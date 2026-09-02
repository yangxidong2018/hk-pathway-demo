const scoreMap=(value,map)=>map[value]??0;
const clamp=(n,max)=>Math.min(max,n);
const arr=v=>Array.isArray(v)?v:[];

export function evaluatePreHK(a){
  const business=scoreMap(a.F04,{'快速增长':5,'稳定经营':5,'转型或业务拓展期':4,'起步阶段':3,'筹备中':1})+
    scoreMap(a.F05,{'10年以上':5,'5—10年':5,'3—5年':4,'1—3年':3,'不满1年':1,'尚未开始经营':0})+
    scoreMap(a.F06,{'人民币1亿元以上':10,'人民币3,000万—1亿元':10,'人民币1,000万—3,000万元':9,'人民币500万—1,000万元':8,'人民币100万—500万元':6,'人民币100万元以下':4,'暂无海外收入':0});
  const overseas=arr(a.F07).filter(x=>!['中国内地','目前还没有客户'].includes(x)).length;
  const f7=arr(a.F07).includes('目前还没有客户')?0:overseas>=2?8:overseas===1?6:2;
  const currencies=arr(a.F08).filter(x=>['港币','美元','欧元或英镑','其他外币'].includes(x)).length;
  const f8=arr(a.F08).includes('目前还没有收付款')?0:currencies>=2?6:currencies===1?5:1;
  const pains=arr(a.F09).filter(x=>x!=='目前没有明确问题').length;
  const crossBorder=f7+f8+(pains>=2?6:pains===1?4:0);
  const mainPurpose=a.F10_primary || arr(a.F10)[0];
  const pBase=scoreMap(mainPurpose,{'承接海外合同':20,'处理跨境收付款':20,'开拓香港或国际市场':20,'在香港招聘或设立办公室':20,'设立区域总部':20,'建设国际品牌或管理知识产权':18,'搭建供应链或贸易平台':18,'融资或引入投资':16,'合规进行税务与架构优化':8,'其他':8});
  const complements=arr(a.F10).filter(x=>x!==mainPurpose&&x!=='其他').length;
  const hkValue=clamp(pBase+Math.min(2,complements)*3,25)+scoreMap(a.F11,{'已有明确客户、合同或收付款需求':10,'已有具体业务机会，正在洽谈':8,'正在主动拓展香港或海外业务':6,'目前主要是了解和比较':2});
  const industryScores={'科技／软件与互联网':15,'一般贸易／进出口':15,'制造业':15,'专业服务':15,'跨境电商':11,'食品／餐饮':11,'化妆品／美容':11,'物流／供应链':11,'文化传媒／内容':11,'金融／金融科技':6,'医疗健康':6,'教育／培训':6,'人力资源':6,'其他':8};
  const industries=arr(a.F01); const primary=a.F01_primary||industries[0];
  const industry=industries.length<=1?(industryScores[primary]||8):Math.round((industryScores[primary]||8)*.7+Math.min(...industries.filter(x=>x!==primary).map(x=>industryScores[x]||8))*.3);
  const modeScores={'软件或订阅服务':10,'商品销售':10,'生产制造':10,'咨询或专业服务':10,'内容生产与发行':9,'品牌或知识产权授权':8,'平台撮合或佣金':7,'投融资或资产管理':5,'其他':6};
  const modes=arr(a.F02); const mode=modes.length?Math.min(...modes.map(x=>modeScores[x]||6)):0;
  const compliance=industry+mode; const total=business+crossBorder+hkValue+compliance;
  const conclusion=total>=80?'适合启动':total>=65?'具备基础':total>=50?'值得探索':'早期准备';
  const copy={
    '适合启动':['现在是启动香港布局的合适时机','你的企业已经具备较清晰的跨境业务基础，香港公司能够承担明确角色。'],
    '具备基础':['你的业务已经具备赴港基础','补充关键业务和运营安排后，可以逐步进入落地规划。'],
    '值得探索':['香港值得成为你的下一步选项','建议先验证最核心的业务机会，再决定香港公司承担什么功能。'],
    '早期准备':['先把赴港机会看清楚','先明确目标客户、业务路径和香港公司能够解决的实际问题。']
  }[conclusion];
  const features=[];
  if(primary) features.push(`主营${primary}，赴港方案需要贴合实际业务路径。`);
  if(overseas) features.push('已有海外客户基础，存在国际合同和跨境履约需求。');
  if(currencies) features.push('存在外币结算场景，需要同步规划账户与交易凭证。');
  if(a.F12) features.push(`${a.F12}的团队规模，需要兼顾业务扩展与日常管理效率。`);
  const positionMap={'承接海外合同':'国际业务签约与履约主体','处理跨境收付款':'跨境交易结算主体','开拓香港或国际市场':'海外市场拓展与销售主体','建设国际品牌或管理知识产权':'国际品牌与知识产权运营主体','融资或引入投资':'融资与股权承接主体','搭建供应链或贸易平台':'国际采购与贸易协调主体','在香港招聘或设立办公室':'香港本地运营主体','设立区域总部':'区域管理与业务协调主体','合规进行税务与架构优化':'跨境业务架构承接主体'};
  const position=positionMap[mainPurpose]||'跨境业务承接主体';
  const secondPurpose=arr(a.F10).find(x=>x!==mainPurpose&&positionMap[x]);
  const auxiliaryPosition=secondPurpose?positionMap[secondPurpose]:'';
  const confirmations=[];
  if(arr(a.F09).includes('跨境收付款'))confirmations.push('需要确认主要交易币种、付款方地区和合同主体，以便判断香港公司适合承担的角色。');
  if(arr(a.F09).includes('与海外客户签约'))confirmations.push('需要确认主要合同类型、履约地点及现有签约主体，以便设计主体分工。');
  if(arr(a.F09).includes('进入香港或国际市场'))confirmations.push('需要确认优先进入的国家或地区，以及计划采用直销、渠道还是平台方式。');
  if(arr(a.F09).includes('供应链或进出口安排'))confirmations.push('需要确认采购、发货、报关和收款分别由哪个主体承担。');
  if(['金融／金融科技','医疗健康','教育／培训','人力资源'].some(x=>industries.includes(x)))confirmations.push('需要确认具体经营活动是否涉及香港专项监管、牌照或专业资格要求。');
  if(arr(a.IP01).length)confirmations.push('需要确认核心资产目前由谁持有，以及香港公司将采用持有、受让还是授权使用方式。');
  const risks=[];
  if(['金融／金融科技','医疗健康','教育／培训','人力资源'].some(x=>industries.includes(x)))risks.push('你的业务可能涉及香港专项监管或牌照要求。在确定经营范围和对外宣传前，应先核实具体活动是否受监管。');
  if(modes.includes('投融资或资产管理')||industries.includes('金融／金融科技'))risks.push('如果业务涉及代客户收款、管理第三方资金或提供投资相关服务，需要优先确认监管边界。');
  if(arr(a.F10).length===1&&mainPurpose==='合规进行税务与架构优化')risks.push('税务与架构优化必须与真实业务、人员、管理和交易安排相匹配。');
  if(arr(a.IP01).length)risks.push('核心知识产权在转让或授权前需要确认现有权属、使用范围及关联主体安排。');
  let architecture='先采用单一香港主体承接核心业务';
  if(mainPurpose==='融资或引入投资')architecture='为融资预留清晰股权层级';
  else if(a.F12==='200人及以上'||mainPurpose==='设立区域总部')architecture='纳入集团化持股与治理体系';
  else if(mainPurpose==='建设国际品牌或管理知识产权'&&arr(a.IP01).length)architecture='业务运营与知识产权关系分开设计';
  else if(['稳定经营','快速增长','转型或业务拓展期'].includes(a.F04)&&arr(a.F03).includes('中国内地'))architecture='由内地经营主体持有香港公司';
  else if(['筹备中','起步阶段'].includes(a.F04)&&['10人以下','10—49人'].includes(a.F12))architecture='创始人直接持有香港公司';
  const architectureHint=arr(a.IP01).length?'知识产权安排':arr(a.F10).includes('融资或引入投资')?'融资进入位置':architecture.includes('内地')||architecture.includes('集团')?'境外投资与资金安排':mainPurpose==='合规进行税务与架构优化'?'真实业务与实质':'';
  const summary=`你的${primary||'企业'}业务考虑通过香港公司实现“${mainPurpose||'跨境发展'}”，初步适合作为${position}。`;
  const customerText=arr(a.F07).filter(x=>x!=='目前还没有客户').join('、')||'尚未形成明确海外客户';
  const basis=`企业处于${a.F04||'待确认'}阶段，海外收入为${a.F06||'待确认'}，客户市场为${customerText}；四个评估维度合计 ${total} 分。`;
  return {type:'pre-hk',conclusion,title:copy[0],summary,basis,score:total,dimensions:{business,crossBorder,hkValue,compliance},features,confirmations,risks,position,auxiliaryPosition,architecture,architectureHint,attention:arr(a.F09).slice(0,3),answers:a};
}

export function evaluateInHK(a){
  const issues=arr(a.HK06); const normalIssues=['公司秘书或注册地址','做账及会计记录','审计','银行账户或跨境收付款','内地与香港公司之间的合同或资金安排'];
  const ordinary=issues.filter(x=>normalIssues.includes(x));
  const priority=a.HK05==='已经开户但使用中遇到问题'||issues.some(x=>['商业登记或周年申报','税务申报','香港雇员或强积金','行业牌照或许可','整体情况不太清楚'].includes(x))||(a.HK04==='已经产生收入或收付款'&&issues.some(x=>['做账及会计记录','审计','税务申报'].includes(x)))||ordinary.length>=2;
  let conclusion='当前运行基本正常';
  if(a.HK01==='已提交注册申请，正在等待结果') conclusion='注册审批中';
  else if(a.HK01==='正在考虑停止经营或撤销注册') conclusion='退出安排待梳理';
  else if(priority) conclusion='需要优先核验';
  else if(a.HK01==='已经成立，尚未开始经营') conclusion='成立待运营';
  else if(ordinary.length||a.HK01==='已经成立，但目前暂停经营') conclusion='有事项待完善';
  const copy={
    '注册审批中':['可以开始准备公司成立后的第一步','利用等待期间准备账户、合同、会计记录和持续维护安排。'],
    '成立待运营':['香港公司已经成立，接下来把基础安排接上','先明确公司用途，再依次准备账户、合同、会计记录和持续维护事项。'],
    '当前运行基本正常':['目前没有发现明显需要优先处理的事项','继续保持公司维护、会计记录和业务资料完整。'],
    '有事项待完善':['公司具备基本运作条件，但仍有事项需要补齐','部分公司维护、账户、会计或业务安排需要进一步完善。'],
    '需要优先核验':['先确认这些关键事项，再继续推进经营','当前不代表已经违规，但建议尽快确认实际状态和处理时间。'],
    '退出安排待梳理':['先核清公司现状，再决定暂停还是撤销','先核清业务、账户、税务、债务和未完成事项。']
  }[conclusion];
  const actionMap={'了解公司成立后需要做什么':'获取成立后待办清单','公司秘书、商业登记及周年申报':'核对公司维护事项','做账、审计及税务申报':'梳理财税安排','银行开户及跨境收付款':'完善账户及收付款安排','内地与香港公司的合同及资金安排':'梳理境内外主体关系','香港招聘、雇佣及强积金':'准备香港雇佣安排','行业牌照或专业合规':'核验行业经营要求','香港或海外市场拓展':'制定市场拓展计划','融资、投资或股权安排':'梳理融资及股权结构','停止经营、公司重组或撤销注册':'先核清退出前事项','其他':'了解您的具体需求'};
  const actions=arr(a.HK07).slice(0,3).map(x=>actionMap[x]).filter(Boolean);
  return {type:'in-hk',conclusion,title:copy[0],summary:copy[1],companyStatus:a.HK01,roles:arr(a.HK03),issues:issues.filter(x=>x!=='目前没有明显问题').slice(0,6),actions,industry:a.F01_primary||arr(a.F01)[0],answers:a};
}
