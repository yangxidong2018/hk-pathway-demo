import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {request,listRecords,findByField,createRecord,update} from './feishu.js';
import {TABLES,NEW_BASE,assessmentFields,customerFields,answersFromRecord,resultFields,dimensionFields} from './cross-border-fields.js';
import {evaluateCrossBorder} from './cross-border-rules.js';
import {matchProviders,relationIds} from './cross-border-matching.js';
import {validateAnswers,specials} from '../public/cross-border.js';

const locks=new Map();
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
// Vercel's deployed source filesystem is read-only.  The journal below is only
// used for retry/idempotency during an invocation; Feishu remains the durable
// source of truth.  Keep local development on .data, but use Vercel's writable
// ephemeral volume in production unless an explicit storage directory is set.
export const storageRoot=e=>path.resolve(e.CROSS_BORDER_DATA_DIR||(e.VERCEL?'/tmp/gopathway-cross-border':'.data/cross-border'));
const root=storageRoot;
const file=(e,id)=>path.join(root(e),`${id}.json`);
async function read(e,id){try{return JSON.parse(await fs.readFile(file(e,id),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
async function write(e,id,data){await fs.mkdir(root(e),{recursive:true,mode:0o700});const temp=file(e,`${id}.${crypto.randomUUID()}.tmp`);await fs.writeFile(temp,JSON.stringify(data),{mode:0o600});await fs.rename(temp,file(e,id));}
function assertNewBase(e){if(e.FEISHU_APP_TOKEN!==NEW_BASE||!e.FEISHU_APP_ID||!e.FEISHU_APP_SECRET)throw Error('新飞书 Base 尚未正确配置，已阻止写入');}
const schemaCache=new Map();
const photoCache=new Map();
export async function hydratePhotos(e,people=[]){
 const result=[];
 for(const person of people){const copy=structuredClone(person);const photos=[];
  for(const photo of person['专业人员头像']||[]){
   if(!photo.file_token){photos.push(photo);continue;}
   try{let cached=photoCache.get(photo.file_token);if(!cached||cached.expires<Date.now()){
    const d=await request(e,`/drive/v1/medias/batch_get_tmp_download_url?file_tokens=${encodeURIComponent(photo.file_token)}`);
    const url=d.tmp_download_urls?.find(x=>x.file_token===photo.file_token)?.tmp_download_url;if(!url)throw Error('照片临时链接不可用');
    cached={url,expires:Date.now()+15*60*1000};photoCache.set(photo.file_token,cached);
   }photos.push({...photo,url:cached.url,tmp_url:cached.url});
   }catch(error){console.warn('professional-photo-unavailable',error.message);photos.push({...photo,url:'',tmp_url:''});}
  }copy['专业人员头像']=photos;result.push(copy);
 }return result;
}
export async function stateOptions(e){
 assertNewBase(e);if(schemaCache.has(NEW_BASE))return schemaCache.get(NEW_BASE);
 const data=await request(e,`/bitable/v1/apps/${NEW_BASE}/tables/${TABLES.special}/fields?page_size=100`);
 const values=data.items.find(x=>x.field_name==='州')?.property?.options?.map(x=>x.name)||[];
 if(!values.length)throw Error('新表缺少州选项配置');schemaCache.set(NEW_BASE,values);return values;
}
export async function providerPool(e){assertNewBase(e);const [p,staff]=await Promise.all([listRecords(e,TABLES.provider),listRecords(e,TABLES.professional)]);return {providers:p.map(x=>({recordId:x.record_id,...x.fields})),people:staff.map(x=>({recordId:x.record_id,...x.fields}))};}
async function upsert(e,table,key,value,fields){const existing=await findByField(e,table,key,value);return (existing?await update(e,table,existing.record_id,fields):await createRecord(e,table,fields)).record;}
const home=(result,recommendations=[])=>({mode:'personalized',assessmentType:'cross-border',type:'cross-border',targetCountry:result.targetCountry,title:result.title,summary:result.summary,result,recommendations,updatedAt:result.completedAt,actions:result.nextSteps.map((title,i)=>({id:`step-${i}`,title,reason:i===0?result.lightStart:'',providers:i===0?recommendations.map(x=>({...x,provider:{...x.provider,professionals:x.professionals}})):[]}))});
const hydratedHome=async(e,result,recommendations)=>home(result,await Promise.all(recommendations.map(async r=>({...r,professionals:await hydratePhotos(e,r.professionals||[])}))));

export async function completedHome(e,userId){
 assertNewBase(e);const local=await read(e,`latest-${hash(userId)}`);
 const customer=await findByField(e,TABLES.customer,'用户ID',userId);
 const completedAt=Number(customer?.fields['最近评估时间']);if(!completedAt)return {mode:'new'};
 if(local?.result.completedAt===completedAt)return hydratedHome(e,local.result,local.recommendations);
 // A record alone is not evidence of a completed transaction. Customer commit
 // time is written last and is the cross-device completion boundary.
 const all=await listRecords(e,TABLES.assessment);
 const record=all.filter(x=>x.fields['用户ID']===userId&&Number(x.fields['评估提交时间'])<=completedAt).sort((a,b)=>Number(b.fields['评估提交时间'])-Number(a.fields['评估提交时间']))[0];
 if(!record)return {mode:'new'};
 const specialRows=(await listRecords(e,TABLES.special)).filter(x=>relationIds(x.fields['关联跨境评估']).includes(record.record_id));
 const answers=answersFromRecord(record);
 for(const [i,q] of (specials[answers.F00]||[]).entries()){
  const row=specialRows.find(x=>x.fields['专项信息ID']?.endsWith(`-${i+1}`));if(!row)continue;
  answers[q.id]=q.type==='single'?row.fields['答案内容']:String(row.fields['答案内容']||'').split('；');
  if(row.fields['州']?.length)answers.STATES=row.fields['州'];
 }
 const result={type:'cross-border',targetCountry:answers.F00,answers,id:record.fields['跨境评估ID'],completedAt,score:record.fields['评估总分'],conclusion:record.fields['评估结论'],dimensions:{}};
 for(const [key,name] of Object.entries(resultFields))result[key]=['features','verification','nextSteps'].includes(key)?String(record.fields[name]||'').split('\n').filter(Boolean):record.fields[name]||'';
 for(const [key,[name]] of Object.entries(dimensionFields))result.dimensions[key]=Number(record.fields[name]);
 const {providers,people}=await providerPool(e),rows=(await listRecords(e,TABLES.recommendation)).filter(x=>relationIds(x.fields['关联跨境评估']).includes(record.record_id));
 const recommendations=rows.map(x=>{const f=x.fields,p=providers.find(p=>relationIds(f['关联服务商']).includes(p.recordId));return p?{provider:p,providerRecordId:p.recordId,rank:f['推荐顺位'],reason:f['推荐理由'],dimensions:f['匹配维度'],professionals:people.filter(s=>relationIds(f['关联推荐专业人员']).includes(s.recordId))}:null;}).filter(Boolean).sort((a,b)=>a.rank-b.rank);
 return hydratedHome(e,result,recommendations);
}

export async function submitCrossBorder(e,identity,input,requestId){
 assertNewBase(e);if(!/^[a-zA-Z0-9-]{8,80}$/.test(requestId||''))throw Error('缺少有效的评估提交标识');
 if(!/^\+?[1-9]\d{7,14}$/.test(identity.phone||''))throw Error('账号手机号格式无效，请重新登录后提交');
 const userId=identity.userId,key=hash(`${userId}:${requestId}`),lockKey=hash(userId);
 while(locks.has(lockKey)){try{await locks.get(lockKey);}catch{/* A failed prior request must not block a retry. */}}
 const task=(async()=>{
  const states=(await stateOptions(e)).filter(x=>x.startsWith(`${input.F00}｜`));const errors=validateAnswers(input,states);
  if(errors.length){const error=Error(errors[0].message);error.validation=errors;throw error;}
  const fingerprint=hash(JSON.stringify(input));let job=await read(e,key);
  if(job&&job.fingerprint!==fingerprint)throw Error('本次提交内容已变化，请使用新的提交标识');
  if(job?.status==='completed'){await write(e,`latest-${hash(userId)}`,job);return {result:job.result,home:await hydratedHome(e,job.result,job.recommendations),saved:true};}
  if(!job){const {providers,people}=await providerPool(e);const result=evaluateCrossBorder(input);result.id=`CBA${new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format().replace(/\D/g,'')}${key.slice(0,8)}`;job={fingerprint,status:'pending',userId,result,recommendations:matchProviders(result.answers,providers,people),attempts:0};await write(e,key,job);}
  try{
   const customer=await findByField(e,TABLES.customer,'用户ID',userId);if(!customer)throw Error('账号关联尚未完成，请稍后重试');
   const previousTime=Number(customer.fields['最近评估时间']||0);
   if(job.baselineTime===undefined){job.baselineTime=previousTime;await write(e,key,job);}
   if(previousTime!==job.baselineTime&&previousTime!==job.commit?.time)throw Error('已有更新的已完成评估，本次旧提交不会覆盖企业信息');
   const assessment=await upsert(e,TABLES.assessment,'跨境评估ID',job.result.id,assessmentFields(job.result,{...identity,customerRecordId:customer.record_id}));
   if(!assessment?.record_id)throw Error('新表没有返回评估记录标识');
   const a=job.result.answers;
   for(const [i,q] of (specials[a.F00]||[]).entries()){
    const id=`CSI${job.result.id.slice(3)}-${i+1}`;
    await upsert(e,TABLES.special,'专项信息ID',id,{'专项信息ID':id,'用户ID':userId,'手机号':identity.phone,'关联跨境评估':[assessment.record_id],'跨境评估ID':job.result.id,'目标国家/地区':a.F00,'问题文案':q.title,'答案内容':Array.isArray(a[q.id])?a[q.id].join('；'):a[q.id],'州':q.id==='S01'?a.STATES||[]:[],'补充说明':''});
   }
   for(const r of job.recommendations){const id=`SPR${job.result.id.slice(3)}-${r.rank}`;await upsert(e,TABLES.recommendation,'推荐记录ID',id,{'推荐记录ID':id,'用户ID':userId,'关联客户':[customer.record_id],'关联跨境评估':[assessment.record_id],'关联服务商':[r.providerRecordId],'关联推荐专业人员':r.professionalRecordId?[r.professionalRecordId]:[],'匹配维度':r.dimensions,'推荐理由':r.reason,'推荐顺位':r.rank});}
   // Persist the intended commit values before the last write. An uncertain
   // response can be retried without incrementing the assessment count twice.
   if(!job.commit){job.commit={time:Date.now(),count:Number(customer.fields['赴目标国评估次数']||0)+1};await write(e,key,job);}
   await update(e,TABLES.customer,customer.record_id,customerFields(job.result,job.commit.count,job.commit.time));
   job.status='completed';job.result.completedAt=job.commit.time;await write(e,key,job);await write(e,`latest-${hash(userId)}`,job);
   return {result:job.result,home:await hydratedHome(e,job.result,job.recommendations),saved:true,recommendationsSaved:true};
  }catch(error){job.attempts++;job.lastError=error.message;await write(e,key,job);if(job.attempts>=3)console.error('cross-border-pending-write',{assessmentId:job.result.id,attempts:job.attempts,error:error.message});throw error;}
 })();locks.set(lockKey,task);try{return await task;}finally{if(locks.get(lockKey)===task)locks.delete(lockKey);}
}
