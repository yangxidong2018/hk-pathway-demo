import {preHongKongQuestions} from './questions.js';

export const countries=['中国香港','新加坡','美国','越南','巴西'];
export const countryNames={en:['Hong Kong','Singapore','United States','Vietnam','Brazil'],vi:['Hồng Kông','Singapore','Hoa Kỳ','Việt Nam','Brazil'],'pt-BR':['Hong Kong','Singapura','Estados Unidos','Vietnã','Brasil'],'zh-HK':['中國香港','新加坡','美國','越南','巴西']};
export const countryName=(country,locale='zh-CN')=>countryNames[locale]?.[countries.indexOf(country)]||country;
export const common=preHongKongQuestions.map(q=>({...q,options:[...q.options]}));
const byId=id=>common.find(q=>q.id===id);
byId('F07').options=['中国内地','中国香港','新加坡','越南','美国','巴西','其他东南亚地区','其他东亚地区','欧洲','其他北美地区','其他拉丁美洲地区','中东','其他海外地区','目前还没有客户'];
byId('F08').options=['人民币','港币','美元','新加坡元','越南盾','巴西雷亚尔','欧元或英镑','其他外币','目前还没有收付款'];
byId('F09').options=['跨境收付款','与海外客户签约','进入目标国家或国际市场','品牌及知识产权保护','供应链或进出口安排','税务及持续合规','融资或投资对接','在目标国家招聘或办公','目前没有明确问题'];
byId('F10').title='企业考虑赴目标国家，最主要想实现什么？';
byId('F10').options=byId('F10').options.map(x=>x.replaceAll('香港','目标国家'));
byId('F11').title='企业目前为赴目标国家推进到了哪一步？';
byId('F11').options=['已有明确客户、合同或收付款需求','已有具体业务机会，正在洽谈','正在主动拓展目标国家或海外业务','目前主要是了解和准备'];
byId('IP01').options.push('不适用');byId('IP01').exclusive=['目前没有核心知识产权','不适用'];
const stateQuestion={id:'S01',title:'企业是否已经明确拟注册或重点开展业务的州？',type:'single',options:['已明确一个州','涉及多个州','暂未明确']};
export const specials={
 '中国香港':[],
 '新加坡':[{id:'S01',title:'企业目前是否已有可担任新加坡公司本地董事的人选？',type:'single',options:['已有符合条件的人选','正在确认或寻找人选','暂无人选，希望获得专业协助','尚不清楚相关要求']}],
 '美国':[stateQuestion],
 '越南':[{id:'S01',title:'企业计划在越南主要开展哪些实际业务活动？',type:'multi',max:2,exclusive:['尚未明确'],options:['商品销售或贸易','生产制造','软件、技术或专业服务','组建本地团队或办公室','其他','尚未明确']},{id:'S02',title:'企业目前是否已有越南当地客户、合作方或供应链资源？',type:'single',options:['已有明确资源','正在接洽','暂时没有','尚未确认是否需要']}],
 '巴西':[stateQuestion,{id:'S02',title:'巴西公司是否计划进口商品、设备或原材料？',type:'single',options:['明确涉及','可能涉及','暂不涉及','尚未确定']}]
};
export function normalizeAnswers(input={}){
 const a=structuredClone(input);if(a.F04==='筹备中')a.F05='尚未开始经营';if(!byId('IP01').show(a))a.IP01=['不适用'];
 const active=new Set((specials[a.F00]||[]).map(q=>q.id));for(const key of ['S01','S02'])if(!active.has(key))delete a[key];
 if(!['美国','巴西'].includes(a.F00)||!['已明确一个州','涉及多个州'].includes(a.S01))delete a.STATES;
 for(const key of ['F01','F10']){if(a[key]?.length===1)a[key+'_primary']=a[key][0];if(!a[key]?.includes('其他'))delete a[key+'_other'];}
 if(!a.F02?.includes('其他'))delete a.F02_other;
 return a;
}
export function crossQuestions(a={},states=[]){return [{id:'F00',title:'本次希望评估在哪个国家或地区设立公司？',type:'single',options:countries},...common.filter(q=>(!q.show||q.show(a))&&(!q.skip||!q.skip(a))),...(specials[a.F00]||[]).flatMap(q=>q.id==='S01'&&['美国','巴西'].includes(a.F00)&&['已明确一个州','涉及多个州'].includes(a.S01)?[q,{id:'STATES',title:'请选择拟注册或重点开展业务的州',type:'multi',max:a.S01==='已明确一个州'?1:undefined,options:states}]:[q])];}
export function validateAnswers(input,states=[]){const a=normalizeAnswers(input),errors=[];if(input.F04==='筹备中'&&input.F05&&input.F05!=='尚未开始经营')errors.push({id:'F05',message:'筹备中的企业经营时间应为尚未开始经营'});for(const q of crossQuestions(a,states)){const v=a[q.id],values=Array.isArray(v)?v:v?[v]:[];if(!values.length||values.some(x=>!q.options.includes(x))||new Set(values).size!==values.length)errors.push({id:q.id,message:'请完成有效答案：'+q.title});else if(q.type==='single'&&Array.isArray(v)||q.type!=='single'&&!Array.isArray(v))errors.push({id:q.id,message:'答案格式不正确'});if(q.max&&values.length>q.max)errors.push({id:q.id,message:'选择数量超过上限'});if(values.length>1&&q.exclusive?.some(x=>values.includes(x)))errors.push({id:q.id,message:'互斥选项不能同时选择'});if(q.type==='multi-primary'&&values.length>1&&!values.includes(a[q.id+'_primary']))errors.push({id:q.id,message:'请指定最主要的一项'});if(q.other&&values.includes('其他')&&(!String(a[q.id+'_other']||'').trim()||a[q.id+'_other'].length>q.other.max))errors.push({id:q.id,message:'请补充有效的其他说明'});}if(['美国','巴西'].includes(a.F00)&&((a.S01==='已明确一个州'&&a.STATES?.length!==1)||(a.S01==='涉及多个州'&&!(a.STATES?.length>=2))))errors.push({id:'STATES',message:'单州请选择1项，多州至少选择2项'});return errors;}
export function reuseAnswers(previous,country){return Object.fromEntries(Object.entries(previous||{}).filter(([k])=>/^F\d|^IP01/.test(k)).concat([['F00',country]]));}
export const questionLabel=(text,country)=>String(text).replaceAll('目标国家',country);
const array=v=>Array.isArray(v)?v:[];
export function softConfirmations(a){
 const warnings=[];const overseas=array(a.F07).some(x=>!['中国内地','目前还没有客户'].includes(x)),foreign=array(a.F08).some(x=>!['人民币','目前还没有收付款'].includes(x));
 if(a.F06!=='暂无海外收入'&&!overseas)warnings.push('已有海外收入，但客户地区没有海外地区；请确认客户信息。');
 if(a.F06!=='暂无海外收入'&&!foreign)warnings.push('已有海外收入，但没有外币收付款；请确认是否主要以人民币结算。');
 if(array(a.F09).includes('跨境收付款')&&!overseas&&!foreign)warnings.push('当前跨境收付款需求可能属于未来规划，请确认。');
 if(array(a.F10).length===1&&a.F10[0]==='合规进行税务与架构优化')warnings.push('税务与架构优化需要真实业务支撑，请确认实际用途。');
 if(a.F11==='已有明确客户、合同或收付款需求'&&array(a.F09).includes('目前没有明确问题'))warnings.push('已有明确业务需求且没有明确难点，请确认两项信息。');
 if(a.F06==='暂无海外收入'&&a.F11==='已有明确客户、合同或收付款需求')warnings.push('尚无海外收入，已有的明确业务需求将作为未来计划分析。');
 if(['美国','巴西'].includes(a.F00)&&a.S01==='暂未明确')warnings.push('目标州尚未明确，后续需核验州级注册及经营要求。');
 if(a.F00==='越南'&&array(a.S01).includes('生产制造')&&['暂时没有','尚未确认是否需要'].includes(a.S02))warnings.push('制造业务尚无明确当地资源，需要核验实际落地条件。');
 if(a.F00==='巴西'&&['明确涉及','可能涉及'].includes(a.S02))warnings.push('计划涉及进口，需进一步核验海关、进口及税务安排。');
 return warnings;
}
