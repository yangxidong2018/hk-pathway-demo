import crypto from 'node:crypto';
import {evaluatePreHK,evaluateInHK} from './rules.js';
import {chatWithAgent} from './agent.js';
import {saveAssessment,upsertCustomer} from './feishu.js';

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

export async function handleApi(req,res,env=process.env){
  try{
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&url.pathname==='/api/status')return json(res,200,{ai:{provider:env.AI_PROVIDER==='openai'&&env.AI_API_KEY?'openai':'mock',model:env.AI_PROVIDER==='openai'&&env.AI_API_KEY?(env.AI_MODEL||'configured'):'本地调试模型'},feishu:{configured:!!(env.FEISHU_APP_ID&&env.FEISHU_APP_SECRET&&env.FEISHU_APP_TOKEN),tables:{customer:!!env.FEISHU_CUSTOMER_TABLE_ID,preHK:!!env.FEISHU_PRE_HK_TABLE_ID,inHK:!!env.FEISHU_IN_HK_TABLE_ID}}});
    if(req.method==='POST'&&url.pathname==='/api/login'){
      const b=await body(req);
      if(!/^1\d{10}$/.test(b.phone||''))return json(res,400,{error:'请输入11位手机号'});
      if(b.code!==(env.DEMO_CODE||'888888'))return json(res,400,{error:'验证码不正确'});
      const qa=req.headers['x-qa-test']==='1';
      const token=issueToken({phone:b.phone,createdAt:Date.now(),qa},env);
      let customerSaved=false,customerSaveError='';
      try{
        if(qa)customerSaved=true;
        else if(env.FEISHU_CUSTOMER_TABLE_ID){const write=await upsertCustomer(env,b.phone,{'用户状态':b.companyStatus==='in-hk'?'已有香港公司':'暂无香港公司'});customerSaved=!write?.mock;if(write?.mock)customerSaveError='飞书尚未配置';}
      }catch(e){customerSaveError=e.message;}
      return json(res,200,{token,user:{phone:b.phone},customerSaved,customerSaveError});
    }
    const session=auth(req,env);
    if(!session)return json(res,401,{error:'请先登录'});
    if(req.method==='POST'&&url.pathname==='/api/account'){
      const b=await body(req),displayName=String(b.displayName||'').trim();
      if(!displayName||displayName.length>30)return json(res,400,{error:'请输入30字以内的称呼'});
      try{const write=session.qa?{qa:true}:await upsertCustomer(env,session.phone,{'用户称呼':displayName});return json(res,200,{saved:!!write});}catch(e){return json(res,502,{error:e.message||'账号资料保存失败'});}
    }
    if(req.method==='POST'&&url.pathname.startsWith('/api/assess/')){
      const b=await body(req),type=url.pathname.endsWith('in-hk')?'in-hk':'pre-hk';
      const result=type==='in-hk'?evaluateInHK(b.answers):evaluatePreHK(b.answers);
      let saved=false,saveError='';
      try{if(session.qa)saved=true;else{const write=await saveAssessment(env,session.phone,result);saved=!write?.mock;if(write?.mock)saveError='飞书尚未配置';}}catch(e){saveError=e.message;}
      return json(res,200,{result,saved,saveError});
    }
    if(req.method==='POST'&&url.pathname==='/api/chat'){
      const b=await body(req);
      try{return json(res,200,{reply:await chatWithAgent(b,env)});}catch(e){return json(res,502,{error:e.message});}
    }
    return json(res,404,{error:'未找到接口'});
  }catch(e){return json(res,500,{error:e.message||'服务异常'});}
}
