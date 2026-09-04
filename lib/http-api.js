import crypto from 'node:crypto';
import {evaluatePreHK,evaluateInHK} from './rules.js';
import {chatWithAgent} from './agent.js';
import {chatHistory,findCustomer,getProvider,latestAssessment,listProviders,recommendationsForAssessment,saveAssessment,saveChatExchange,saveRecommendations,upsertCustomer} from './feishu.js';
import {assessmentHome,assessmentRecordFromResult} from './recommendations.js';

const json=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(data));
};

const body=async req=>{
  if(req.body&&typeof req.body==='object')return req.body;
  if(typeof req.body==='string')return req.body?JSON.parse(req.body):{};
  let s='';
  for await(const c of req)s+=c;
  if(s.length>1e6)throw new Error('请求过大');
  return s?JSON.parse(s):{};
};

const secret=env=>env.AUTH_SECRET||env.FEISHU_APP_SECRET||'hk-pathway-local-demo';
const sign=(value,key)=>crypto.createHmac('sha256',key).update(value).digest('base64url');
const issueToken=(session,env)=>{
  const payload=Buffer.from(JSON.stringify({...session,expiresAt:Date.now()+7*24*60*60*1000})).toString('base64url');
  return `${payload}.${sign(payload,secret(env))}`;
};
const readToken=(token,env)=>{
  try{
    const [payload,signature]=String(token||'').split('.');
    if(!payload||!signature)return null;
    const expected=sign(payload,secret(env));
    const a=Buffer.from(signature),b=Buffer.from(expected);
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
    const session=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return session.expiresAt>Date.now()?session:null;
  }catch{return null;}
};
const auth=(req,env)=>readToken((req.headers.authorization||'').replace(/^Bearer /,''),env);
const relationIds=v=>(Array.isArray(v)?v:[]).flatMap(x=>typeof x==='string'?[x]:Array.isArray(x?.record_ids)?x.record_ids:[x?.record_id||x?.recordId||x?.id]).filter(Boolean);
const createUserId=()=>{const stamp=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format().replace(/\D/g,'');return `USR${stamp}${String(crypto.randomInt(0,1000000)).padStart(6,'0')}`};
const qaLatestAssessments=new Map();

async function homePayload(env,session,preferredType=''){
 if(session.qa){
  const saved=qaLatestAssessments.get(session.phone);
  if(!saved||preferredType&&saved.type!==preferredType)return {mode:'new',assessmentType:preferredType||saved?.type||'pre-hk',reason:'qa-assessment-missing'};
  const result=saved.result,actions=(result.actions?.length?result.actions:['确认公司用途与业务资料','完成注册与初步合规安排','接上账户、财税与法律支持']).slice(0,3).map((title,index)=>({id:`qa-${index+1}`,stage:index?'接下来':'现在优先',title,reason:'根据你刚完成的评估结果生成。',services:[],providers:[]}));
  return {mode:'personalized',assessmentType:saved.type,type:saved.type,conclusion:result.conclusion,title:result.title,summary:result.summary,actions,result};
 }
 const customer=await findCustomer(env,session.phone);
 if(!customer)return {mode:'new',reason:'customer-missing'};
 const type=['pre-hk','in-hk'].includes(preferredType)
  ?preferredType
  :customer.fields?.['用户状态']==='已有香港公司'?'in-hk':'pre-hk';
 const assessment=await latestAssessment(env,session.phone,type);
 if(!assessment)return {mode:'new',assessmentType:type,reason:'assessment-missing'};
 let eligible=[];
 try{eligible=(await listProviders(env)).filter(x=>x['资质核验状态']==='已核验');}catch(e){console.error('provider-pool-read-failed',e.message)}
 let home=assessmentHome(type,assessment,eligible);
 let existing=[];
 try{existing=await recommendationsForAssessment(env,assessment.record_id);}catch(e){console.error('recommendation-read-failed',e.message)}
 const validProviderIds=new Set(eligible.map(x=>x.recordId));
 const existingProviderIds=new Set(existing.flatMap(x=>relationIds(x.fields?.['关联服务商'])).filter(x=>validProviderIds.has(x)));
 const desiredProviderIds=new Set(home.actions.flatMap(x=>x.providers.map(p=>p.provider.recordId)));
 const needsGeneration=!existing.length||[...desiredProviderIds].some(id=>!existingProviderIds.has(id));
 if(needsGeneration){
  const flat=[...new Map(home.actions.flatMap(action=>action.providers.map(p=>[p.provider.recordId,{providerRecordId:p.provider.recordId,rank:p.rank,dimensions:p.dimensions,reason:p.reason}]))).values()];
  if(flat.length)try{await saveRecommendations(env,{customerRecordId:customer.record_id,assessmentRecordId:assessment.record_id,type,recommendations:flat});}catch(e){console.error('recommendation-write-failed',e.message)}
 }else{
  home={...home,actions:home.actions.map(action=>({...action,providers:action.providers.filter(p=>existingProviderIds.has(p.provider.recordId))}))};
 }
 return {mode:'personalized',generated:needsGeneration,customer:{status:customer.fields?.['用户状态'],displayName:customer.fields?.['用户称呼']||''},...home};
}

export async function handleApi(req,res,env=process.env){
  try{
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&url.pathname==='/api/status'){
      const linkai=env.AI_PROVIDER==='linkai'&&env.LINKAI_API_KEY&&env.LINKAI_APP_CODE;
      const openai=env.AI_PROVIDER==='openai'&&env.AI_API_KEY;
      return json(res,200,{ai:{provider:linkai?'linkai':openai?'openai':'mock',model:linkai?'workflow':openai?(env.AI_MODEL||'configured'):'本地调试模型'},feishu:{configured:!!(env.FEISHU_APP_ID&&env.FEISHU_APP_SECRET&&env.FEISHU_APP_TOKEN),tables:{customer:!!env.FEISHU_CUSTOMER_TABLE_ID,preHK:!!env.FEISHU_PRE_HK_TABLE_ID,inHK:!!env.FEISHU_IN_HK_TABLE_ID,providerRecommendation:!!env.FEISHU_PROVIDER_RECOMMENDATION_TABLE_ID,provider:!!env.FEISHU_PROVIDER_TABLE_ID,chatSession:!!env.FEISHU_CHAT_SESSION_TABLE_ID,chatMessage:!!env.FEISHU_CHAT_MESSAGE_TABLE_ID}}});
    }
    if(req.method==='POST'&&url.pathname==='/api/login'){
      const b=await body(req);
      if(!/^1\d{10}$/.test(b.phone||''))return json(res,400,{error:'请输入11位手机号'});
      if(b.code!==(env.DEMO_CODE||'888888'))return json(res,400,{error:'验证码不正确'});
      const qa=req.headers['x-qa-test']==='1';
      let userId='';
      let customerSaved=false,customerSaveError='';
      try{
        if(qa){userId=createUserId();customerSaved=true;}
        else if(env.FEISHU_CUSTOMER_TABLE_ID){const existing=await findCustomer(env,b.phone);userId=existing?.fields?.['用户ID']||createUserId();const write=await upsertCustomer(env,b.phone,{'用户ID':userId,'用户状态':b.companyStatus==='in-hk'?'已有香港公司':'暂无香港公司'});customerSaved=!write?.mock;if(write?.mock)customerSaveError='飞书尚未配置';}
      }catch(e){customerSaveError=e.message;}
      if(!userId)userId=createUserId();
      const token=issueToken({phone:b.phone,userId,createdAt:Date.now(),qa},env);
      return json(res,200,{token,user:{id:userId,phone:b.phone},customerSaved,customerSaveError});
    }
    const session=auth(req,env);
    if(!session)return json(res,401,{error:'请先登录'});
    if(req.method==='GET'&&url.pathname==='/api/home')return json(res,200,await homePayload(env,session,url.searchParams.get('type')||''));
    if(req.method==='GET'&&url.pathname==='/api/providers')return json(res,200,{providers:await listProviders(env)});
    if(req.method==='GET'&&url.pathname.startsWith('/api/providers/')){
      const provider=await getProvider(env,decodeURIComponent(url.pathname.slice('/api/providers/'.length)));
      return provider?json(res,200,{provider}):json(res,404,{error:'未找到服务商'});
    }
    if(req.method==='POST'&&url.pathname==='/api/account'){
      const b=await body(req),displayName=String(b.displayName||'').trim();
      if(!displayName||displayName.length>30)return json(res,400,{error:'请输入30字以内的称呼'});
      try{const write=session.qa?{qa:true}:await upsertCustomer(env,session.phone,{'用户称呼':displayName});return json(res,200,{saved:!!write});}catch(e){return json(res,502,{error:e.message||'账号资料保存失败'});}
    }
    if(req.method==='POST'&&url.pathname==='/api/company'){
      const b=await body(req),fields={'主营行业':String(b.industry||'').trim(),'当前主要经营地':String(b.location||'').split(/[、,，]/).filter(Boolean),'当前经营阶段':String(b.stage||'').trim(),'企业规模':String(b.scale||'').trim(),'赴港首要目的':String(b.goal||'').trim()};
      if(!fields['主营行业'])return json(res,400,{error:'请填写主营行业'});
      try{const write=session.qa?{qa:true}:await upsertCustomer(env,session.phone,fields);return json(res,200,{saved:!!write});}catch(e){return json(res,502,{error:e.message||'企业信息保存失败'});}
    }
    if(req.method==='POST'&&url.pathname.startsWith('/api/assess/')){
      const b=await body(req),type=url.pathname.endsWith('in-hk')?'in-hk':'pre-hk';
      const result=type==='in-hk'?evaluateInHK(b.answers):evaluatePreHK(b.answers);
      let saved=false,saveError='';
      try{if(session.qa){saved=true;qaLatestAssessments.set(session.phone,{type,result});}else{const write=await saveAssessment(env,session.phone,result);saved=!write?.mock;if(write?.mock)saveError='飞书尚未配置';}}catch(e){saveError=e.message;}
      let providers=[];
      try{providers=(await listProviders(env)).filter(x=>x['资质核验状态']==='已核验');}catch(e){console.error('post-assessment-provider-read-failed',e.message)}
      const home={mode:'personalized',...assessmentHome(type,assessmentRecordFromResult(result),providers)};
      return json(res,200,{result,home,saved,saveError});
    }
    if(req.method==='POST'&&url.pathname==='/api/chat'){
      const b=await body(req);
      const message=String(b.message||'').trim();
      if(!message)return json(res,400,{error:'请输入问题'});
      if(message.length>4000)return json(res,400,{error:'问题内容过长'});
      const sessionId=`hkpathway:${session.userId}`;
      try{
       const reply=await chatWithAgent({...b,message,userId:session.userId,sessionId},env);
       let saved=false,messages=[];
       try{const write=session.qa?{messages:[]}:await saveChatExchange(env,{sessionId,userId:session.userId,message,reply,requestId:b.requestId});messages=write.messages||[];saved=!write.mock;}catch(error){console.error('chat-history-write-failed',error.message)}
       return json(res,200,{reply,sessionId,messages,saved});
      }catch(e){return json(res,502,{error:e.message});}
    }
    if(req.method==='GET'&&url.pathname==='/api/chat/history'){
      const sessionId=`hkpathway:${session.userId}`;
      try{return json(res,200,{sessionId,messages:session.qa?[]:await chatHistory(env,session.userId,sessionId)});}catch(e){return json(res,502,{error:e.message||'对话记录读取失败'});}
    }
    return json(res,404,{error:'未找到接口'});
  }catch(e){return json(res,500,{error:e.message||'服务异常'});}
}
