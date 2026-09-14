const arr=v=>Array.isArray(v)?v:[];
export const relationIds=v=>arr(v).flatMap(x=>typeof x==='string'?[x]:arr(x?.record_ids).length?x.record_ids:[x?.record_id||x?.recordId||x?.id]).filter(Boolean);
const intersects=(a,b)=>arr(a).some(x=>arr(b).includes(x));
const normal=p=>p['推荐状态']==='正常推荐'&&p['资质核验状态']==='已核验';
export function serviceNeeds(a){
 const services=new Set(['公司设立及登记','注册地址／法定地址','公司秘书／注册代理','年报及公司持续维护','税务登记与申报']);
 const facts=[...arr(a.F09),...arr(a.F10)];
 const rules=[[/收付款/,['银行开户协助','跨境交易及资金安排']],[/签约|合同/,['商业合同']],[/知识产权|品牌/,['知识产权']],[/税务|架构/,['税务及跨境架构咨询']],[/融资|投资/,['融资、投资及尽职调查','股权及公司治理']],[/招聘|办公/,['雇佣及劳动合规','工作签证及人才入境']],[/供应链|进出口/,['跨境交易及资金安排','行业准入、牌照及监管合规']]];
 for(const [re,values] of rules)if(facts.some(x=>re.test(x)))values.forEach(x=>services.add(x));
 if(a.F00==='新加坡'&&a.S01!=='已有符合条件的人选')services.add('本地董事／法定代表人支持');
 if(a.F00==='巴西'&&['明确涉及','可能涉及'].includes(a.S02)||['金融／金融科技','医疗健康','教育／培训','人力资源'].some(x=>arr(a.F01).includes(x)))services.add('行业准入、牌照及监管合规');
 return [...services];
}
export function eligibleProfessionals(provider,people,a){
 return people.filter(p=>relationIds(p['关联服务商']).includes(provider.recordId)&&normal(p)&&arr(p['可服务国家/地区']).includes(a.F00))
 .sort((x,y)=>Number(intersects(y['执业州'],a.STATES))-Number(intersects(x['执业州'],a.STATES))||(Number(x['推荐排序'])||999)-(Number(y['推荐排序'])||999)||x.recordId.localeCompare(y.recordId));
}
export function matchProviders(a,providers,people=[]){
 const needs=serviceNeeds(a),ranked=[];
 // Country is the first gate: only providers tagged for the selected destination
 // may enter the following service, credential and relevance ranking.
 const countryCandidates=providers.filter(p=>normal(p)&&arr(p['服务覆盖国家/地区']).includes(a.F00));
 for(const p of countryCandidates){
  const services=arr(p['可提供服务']).filter(x=>needs.includes(x));
  if(!services.length)continue;
  const lawyers=arr(p['服务商类型']).includes('律师事务所');
  let staff=eligibleProfessionals(p,people,a);if(lawyers)staff=staff.filter(x=>x['专业人员类型']==='律师');
  if(lawyers&&!staff.length)continue;
  const dimensions=['目标国家/地区','可提供服务'],reason=[`可服务${a.F00}`,`提供本次需要的${services.slice(0,2).join('、')}`];let score=30;
  const add=(condition,points,dimension)=>{if(condition){score+=points;dimensions.push(dimension);return true;}return false;};
  add(intersects(p['可解决的跨境业务难点'],a.F09),20,'专项服务能力');
  if(add(intersects(p['擅长行业'],a.F01),15,'行业经验'))reason.push('行业经验与你的行业相符');
  add(intersects(p['擅长业务模式'],a.F02),10,'业务模式');
  add(arr(p['适合企业规模']).includes(a.F12),5,'企业规模');
  add(arr(p['适合经营阶段']).includes(a.F04),5,'经营阶段');
  add(intersects(p['熟悉收付款币种'],a.F08),5,'收付款币种');
  // Display locale is not a service-language preference and must not affect ranking.
  add(['是','支持'].includes(p['是否支持远程办理']),5,'远程办理');
  add(staff.some(x=>intersects(x['执业州'],a.STATES)),5,'执业地区／州');
  ranked.push({provider:p,providerRecordId:p.recordId,professionalRecordId:staff[0]?.recordId||'',professionals:staff.slice(0,3),dimensions:[...new Set(dimensions)],reason:reason.slice(0,3).join('；'),score,services});
 }
 const exact=ranked.sort((a,b)=>b.score-a.score||a.providerRecordId.localeCompare(b.providerRecordId)).slice(0,3).map((x,i)=>({...x,rank:i+1}));
 if(exact.length)return exact;

 // Never leave the user with a blank recommendation area. Prefer a vetted
 // provider that is country-tagged; otherwise use a vetted cross-border
 // provider with the closest service fit and label it as scope-to-confirm.
 const fallbackPool=countryCandidates.length?countryCandidates:providers.filter(normal);
 return fallbackPool.map(p=>{
  const services=arr(p['可提供服务']).filter(x=>needs.includes(x));
  const countryTagged=arr(p['服务覆盖国家/地区']).includes(a.F00);
  const remote=['是','支持'].includes(p['是否支持远程办理']);
  const score=(countryTagged?40:0)+(services.length*12)+(remote?6:0)+(intersects(p['擅长行业'],a.F01)?5:0);
  const dimensions=[countryTagged?'目标国家/地区':'跨境服务能力',services.length?'可提供服务':'服务范围待确认'];
  const reason=countryTagged
   ?`已标注可服务${a.F00}，建议确认本次具体服务范围与承接安排`
   :`具备相关跨境服务能力，尚需确认是否可承接${a.F00}的本次需求`;
  return {provider:p,providerRecordId:p.recordId,professionalRecordId:'',professionals:[],dimensions,reason,score,services,fallback:true};
 }).sort((a,b)=>b.score-a.score||a.providerRecordId.localeCompare(b.providerRecordId)).slice(0,1).map((x,i)=>({...x,rank:i+1}));
}
