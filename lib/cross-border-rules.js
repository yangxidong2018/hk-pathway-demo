import {evaluatePreHK} from './rules.js';
import {normalizeAnswers,softConfirmations} from '../public/cross-border.js';

const array=v=>Array.isArray(v)?v:[];
export {softConfirmations} from '../public/cross-border.js';

export function evaluateCrossBorder(input){
 const a=normalizeAnswers(input),country=a.F00;
 for(const k of ['F01','F10'])if(a[k]?.length===1)a[k+'_primary']=a[k][0];
 // Preserve the proven score tables. Only map canonical target-neutral options
 // for this numeric calculation; never reuse HK narrative for another country.
 const numeric={...a,F10:a.F10.map(x=>x.replaceAll('目标国家','香港')),F10_primary:a.F10_primary?.replaceAll('目标国家','香港'),F11:a.F11.replaceAll('目标国家','香港').replace('了解和准备','了解和比较'),F08:a.F08.map(x=>['新加坡元','越南盾','巴西雷亚尔'].includes(x)?'其他外币':x),IP01:array(a.IP01).filter(x=>!['不适用','目前没有核心知识产权'].includes(x))};
 const old=evaluatePreHK(numeric),dimensions={compliance:old.dimensions.compliance,business:old.dimensions.business,crossBorder:old.dimensions.crossBorder,targetValue:old.dimensions.hkValue};
 const titles={'适合启动':`${country}公司设立可以进入落地规划`,'具备基础':`你的业务已具备在${country}设立公司的基础`,'值得探索':`值得进一步验证在${country}设立公司的机会`,'早期准备':`先明确在${country}设立公司的业务用途`};
 const positionMap={'承接海外合同':'国际业务签约与履约主体','处理跨境收付款':'跨境交易结算主体','开拓目标国家或国际市场':'海外市场拓展与销售主体','建设国际品牌或管理知识产权':'国际品牌与知识产权运营主体','融资或引入投资':'融资与股权承接主体','搭建供应链或贸易平台':'国际采购与贸易协调主体','在目标国家招聘或设立办公室':'本地运营主体','设立区域总部':'区域管理与业务协调主体','合规进行税务与架构优化':'跨境业务架构承接主体'};
 const position=positionMap[a.F10_primary]||'跨境业务承接主体',secondary=a.F10.find(x=>x!==a.F10_primary&&positionMap[x]);
 const features=[];
 if(a.F07.some(x=>!['中国内地','目前还没有客户'].includes(x)))features.push('已有海外客户基础，需要衔接合同签署与实际交付。');
 if(a.F08.some(x=>!['人民币','目前还没有收付款'].includes(x)))features.push('已有外币收付款场景，需要保持交易资料与资金路径一致。');
 features.push(`首要目的为${a.F10_primary}，公司用途应与这一目标一致。`);
 features.push(`当前业务模式为${a.F02.join('、')}，需要明确各主体的实际职责。`);
 features.push(`团队规模为${a.F12}，启动方式应匹配现有管理能力。`);
 features.push(`主营行业为${a.F01_primary}，需确认具体活动的准入要求。`);
 const verification=[`核验${country}的注册、注册地址与持续申报要求，以明确设立和维护责任。`,...softConfirmations(a)];
 if(a.F09.includes('跨境收付款')||a.F10.includes('处理跨境收付款'))verification.push('核验开户材料、交易币种、付款方及合同主体，以确认真实交易路径；开户结果由银行独立审核。');
 if(['金融／金融科技','医疗健康','教育／培训','人力资源'].some(x=>a.F01.includes(x))||a.F02.includes('投融资或资产管理'))verification.push('核验具体经营活动的行业准入、牌照及专业资格边界，避免把公司注册等同于获准经营。');
 if(numeric.IP01.length)verification.push('核验知识产权权属、授权范围及关联主体安排，以确定持有或使用方式。');
 if(country==='新加坡')verification.push(`本地董事情况为“${a.S01}”，需由专业机构确认人选条件与责任安排。`);
 if(['美国','巴西'].includes(country))verification.push(`州的情况为“${a.S01}”${a.STATES?.length?`（${a.STATES.join('、')}）`:''}，需核验注册州与实际经营州的义务及执业资格。`);
 if(country==='越南')verification.push(`计划开展${array(a.S01).join('、')}；当地资源为“${a.S02}”，需核验业务准入和实际落地条件。`);
 if(country==='巴西'&&['明确涉及','可能涉及'].includes(a.S02))verification.push('核验进口商品类别、海关与税务登记要求，以明确进口责任主体。');
 let architecture=`初步可考虑由单一${country}主体承接核心业务，需进一步核验。`;
 if(a.F10_primary==='融资或引入投资')architecture='初步可考虑为融资预留清晰股权层级，需进一步核验投资人和融资条件。';
 else if(a.F12==='200人及以上'||a.F10_primary==='设立区域总部')architecture='初步可考虑纳入集团化持股与治理体系，需进一步核验各主体职能。';
 else if(a.F10_primary==='建设国际品牌或管理知识产权'&&numeric.IP01.length)architecture='初步可考虑分别设计业务运营与知识产权关系，需进一步核验权属及授权安排。';
 else if(['稳定经营','快速增长','转型或业务拓展期'].includes(a.F04)&&a.F03.includes('中国内地'))architecture=`初步可考虑由内地经营主体持有${country}公司，需进一步核验境外投资、资金出境及税务安排。`;
 else if(['筹备中','起步阶段'].includes(a.F04)&&['10人以下','10—49人'].includes(a.F12))architecture=`初步可考虑创始人直接持有${country}公司，需进一步核验股权与管理安排。`;
 return {type:'cross-border',targetCountry:country,answers:a,score:old.score,dimensions,conclusion:old.conclusion,title:titles[old.conclusion],summary:`根据你提交的业务事实，${country}公司初步可考虑承担${position}；设立前仍需完成专业核验。`,fitReason:`企业处于${a.F04}，海外收入为${a.F06}，首要目的是${a.F10_primary}；本次判断同时考虑业务基础、跨境需求、目标国价值和行业准入。`,features,verification:[...new Set(verification)],position,auxiliaryPosition:secondary?positionMap[secondary]:'',architecture,division:`合同：确认由哪个主体签署并承担责任。交付：由具备实际资源的主体履行。收付款：与合同及实际交易保持一致。本地运营：明确${country}的人员、办公和管理职责，不能仅凭注册推定经营实质。`,lightStart:'先验证最核心的业务机会，以能够持续维护的最小安排启动；需求明确后再扩展。',cost:'需按具体业务、目标地区及服务范围取得专业机构报价；当前不提供未经维护的金额或周期承诺。',obligations:`需进一步核验${country}适用的登记维护、税务申报、会计记录及实际经营义务。`,nextSteps:['确认真实业务用途与专业核验事项','明确公司设立、合同及境内外分工','向合格服务商确认费用范围与持续义务'],softConfirmations:softConfirmations(a)};
}
