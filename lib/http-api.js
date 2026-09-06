import crypto from 'node:crypto';
import {evaluatePreHK,evaluateInHK} from './rules.js';
import {chatWithAgent} from './agent.js';
import {chatHistory,findCustomer,getProvider,latestAssessment,listProviders,recommendationsForAssessment,saveAssessment,saveChatExchange,saveRecommendations,upsertCustomer} from './feishu.js';
import {assessmentHome,assessmentRecordFromResult} from './recommendations.js';
import {parseAgentAction,persistableAgentReply} from './chat-actions.js';
import {plainTextField} from './field-value.js';

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
const identitySyncs=new Map();

const recordIdOf=value=>value?.record?.record_id||value?.record_id||'';
async function ensureRecommendations(env,{customer,assessment,type,providers}){
 const customerRecordId=customer?.record_id,assessmentRecordId=assessment?.record_id;
 if(!customerRecordId||!assessmentRecordId)throw new Error('推荐关联记录不完整');
 const eligible=(providers||await listProviders(env)).filter(x=>x['资质核验状态']==='已核验');
 const home=assessmentHome(type,assessment,eligible);
 const recommendations=[...new Map(home.actions.flatMap(action=>action.providers.map(p=>[p.provider.recordId,{providerRecordId:p.provider.recordId,rank:p.rank,dimensions:p.dimensions,reason:p.reason}]))).values()];
 if(!recommendations.length)throw new Error('服务商数据库暂无可推荐记录');
 const sync=await saveRecommendations(env,{customerRecordId,assessmentRecordId,type,recommendations});
 return {...home,recommendationSync:sync};
}

async function repairCustomerIdentity(env,session){
 if(session.qa)return {ok:true,customer:{record_id:'qa',fields:{'用户ID':session.userId}}};
 try{
  let customer=await findCustomer(env,session.phone);
  if(!customer){await upsertCustomer(env,session.phone,{'用户ID':session.userId});customer=await findCustomer(env,session.phone)}
  const linked=plainTextField(customer?.fields?.['用户ID']);
  if(!linked){await upsertCustomer(env,session.phone,{'用户ID':session.userId});customer=await findCustomer(env,session.phone)}
  // 飞书中的永久用户 ID 是权威值。重新登录期间客户端令牌可能暂时携带
  // 新生成的候选 ID，不应把这一短暂差异误判成账号异常。
  const effectiveUserId=plainTextField(customer?.fields?.['用户ID'])||session.userId;
  return {ok:true,customer,effectiveUserId};
 }catch(error){console.error('customer-identity-repair-failed',error.message);return {ok:false,reason:'sync-failed'};}
}

async function ensureCustomerIdentity(env,session){
 if(session.qa)return repairCustomerIdentity(env,session);
 const key=String(session.phone||'');
 if(identitySyncs.has(key))return identitySyncs.get(key);
 const pending=repairCustomerIdentity(env,session).finally(()=>identitySyncs.delete(key));
 identitySyncs.set(key,pending);
 return pending;
}

async function homePayload(env,session,preferredType=''){
 if(session.qa){
  const saved=qaLatestAssessments.get(session.phone);
  if(!saved||preferredType&&saved.type!==preferredType)return {mode:'new',assessmentType:preferredType||saved?.type||'pre-hk',reason:'qa-assessment-missing'};
  const result=saved.result,actions=(result.actions?.length?result.actions:['确认公司用途与业务资料','完成注册与初步合规安排','接上账户、财税与法律支持']).slice(0,3).map((title,index)=>({id:`qa-${index+1}`,stage:index?'接下来':'现在优先',title,reason:'根据你刚完成的评估结果生成。',services:[],providers:[]}));
  return {mode:'personalized',assessmentType:saved.type,type:saved.type,conclusion:result.conclusion,title:result.title,summary:result.summary,actions,result};
 }
 const customer=await findCustomer(env,session.phone);
 if(!customer)return {mode:'new',reason:'customer-missing'};
 let type=['pre-hk','in-hk'].includes(preferredType)?preferredType:'';
 if(!type&&customer.fields?.['用户状态']==='已有香港公司')type='in-hk';
 if(!type&&customer.fields?.['用户状态']==='暂无香港公司')type='pre-hk';
 let assessment;
 if(type)assessment=await latestAssessment(env,session.phone,type);
 else{
  const [pre,inHK]=await Promise.all([latestAssessment(env,session.phone,'pre-hk'),latestAssessment(env,session.phone,'in-hk')]);
  assessment=[pre&&{type:'pre-hk',value:pre},inHK&&{type:'in-hk',value:inHK}].filter(Boolean).sort((a,b)=>Number(b.value.fields?.['评估提交时间']||0)-Number(a.value.fields?.['评估提交时间']||0))[0]?.value;
  if(assessment)type=assessment===inHK?'in-hk':'pre-hk';
 }
 if(!assessment)return {mode:'new',assessmentType:type||'',reason:'assessment-missing'};
 let eligible=[];
 try{eligible=(await listProviders(env)).filter(x=>x['资质核验状态']==='已核验');}catch(e){console.error('provider-pool-read-failed',e.message)}
 const home=await ensureRecommendations(env,{customer,assessment,type,providers:eligible});
 return {mode:'personalized',customer:{status:customer.fields?.['用户状态']||'',displayName:customer.fields?.['用户称呼']||''},...home};
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
      // 登录只负责建立本地会话，不再等待飞书网络请求。账号资料随后由
      // /api/account/sync 在后台完成，避免云端延迟阻塞页面跳转。
      const userId=createUserId();
      const token=issueToken({phone:b.phone,userId,createdAt:Date.now(),qa},env);
      return json(res,200,{token,user:{id:userId,phone:b.phone},customerSaved:qa,customerSyncPending:!qa});
    }
    const session=auth(req,env);
    if(!session)return json(res,401,{error:'请先登录'});
    if(req.method==='POST'&&url.pathname==='/api/account/sync'){
      if(session.qa)return json(res,200,{token:issueToken(session,env),user:{id:session.userId,phone:session.phone},synced:true});
      try{
        const identity=await ensureCustomerIdentity(env,session);
        if(!identity.ok)throw new Error('账号同步失败');
        const userId=identity.effectiveUserId||session.userId;
        const token=issueToken({...session,userId,accountSyncedAt:Date.now()},env);
        return json(res,200,{token,user:{id:userId,phone:session.phone},synced:true});
      }catch(error){
        console.error('background-account-sync-failed',error.message);
        return json(res,202,{token:issueToken(session,env),user:{id:session.userId,phone:session.phone},synced:false});
      }
    }
    if(req.method==='GET'&&url.pathname==='/api/session')return json(res,200,{user:{id:session.userId,phone:session.phone}});
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
      if(session.qa){qaLatestAssessments.set(session.phone,{type,result});return json(res,200,{result,home:{mode:'personalized',...assessmentHome(type,assessmentRecordFromResult(result),[])},saved:true});}
      try{
       const savedAssessment=await saveAssessment(env,session.phone,result),assessmentRecordId=recordIdOf(savedAssessment);
       if(!assessmentRecordId)throw new Error('评估记录保存后未返回记录ID');
       const [customer,providers]=await Promise.all([findCustomer(env,session.phone),listProviders(env)]);
       const assessment={record_id:assessmentRecordId,fields:{...assessmentRecordFromResult(result).fields,'评估提交时间':Date.now()}};
       const home={mode:'personalized',...await ensureRecommendations(env,{customer,assessment,type,providers})};
       return json(res,200,{result,home,saved:true,recommendationsSaved:true});
      }catch(e){return json(res,502,{error:e.message||'评估或推荐记录保存失败'});}
    }
    if(req.method==='POST'&&url.pathname==='/api/chat'){
      const b=await body(req);
      const message=String(b.message||'').trim();
      if(!message)return json(res,400,{error:'请输入问题'});
      if(message.length>4000)return json(res,400,{error:'问题内容过长'});
       let sessionId=`hkpathway:${session.userId}`;
      try{
       const identity=session.qa?{ok:true,customer:null}:await ensureCustomerIdentity(env,session);
       if(!identity.ok)return json(res,200,{reply:'账号关联需要恢复后才能继续提供个性化建议。',action:{type:'account_sync_required'},sessionId,messages:[],saved:false});
       const effectiveUserId=identity.effectiveUserId||session.userId;
       sessionId=`hkpathway:${effectiveUserId}`;
       const rawReply=await chatWithAgent({...b,message,userId:effectiveUserId,sessionId},env);
       const parsed=parseAgentAction(rawReply,identity.customer?.fields?.['用户状态']||'');
       const reply=parsed.reply||'我已根据你的情况整理了下一步入口。',action=parsed.action;
       let saved=false,messages=[];
       try{const storedReply=persistableAgentReply(reply,action);const write=session.qa?{messages:[]}:await saveChatExchange(env,{sessionId,userId:effectiveUserId,message,reply:storedReply,requestId:b.requestId});messages=(write.messages||[]).map(m=>m.role==='assistant'?{...m,content:reply,action}:m);saved=!write.mock;}catch(error){console.error('chat-history-write-failed',error.message)}
       return json(res,200,{reply,action,sessionId,messages,saved});
      }catch(e){return json(res,502,{error:e.message});}
    }
    if(req.method==='GET'&&url.pathname==='/api/chat/history'){
      try{const identity=session.qa?{ok:true,customer:null,effectiveUserId:session.userId}:await ensureCustomerIdentity(env,session);if(!identity.ok)throw new Error('账号同步失败');const effectiveUserId=identity.effectiveUserId||session.userId,sessionId=`hkpathway:${effectiveUserId}`;const raw=session.qa?[]:await chatHistory(env,effectiveUserId,sessionId);const messages=raw.map(m=>{if(m.role!=='assistant')return m;const parsed=parseAgentAction(m.content,identity.customer?.fields?.['用户状态']||'');return {...m,content:parsed.reply,action:parsed.action}});return json(res,200,{sessionId,messages});}catch(e){return json(res,502,{error:e.message||'对话记录读取失败'});}
    }
    return json(res,404,{error:'未找到接口'});
  }catch(e){return json(res,500,{error:e.message||'服务异常'});}
}
