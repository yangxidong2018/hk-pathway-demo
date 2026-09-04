const arr=v=>Array.isArray(v)?v:v===undefined||v===null||v===''?[]:[v];
const intersects=(a,b)=>arr(a).some(x=>arr(b).includes(x));
const includes=(a,v)=>arr(a).includes(v);
const text=v=>typeof v==='object'&&v?v.link||v.url||v.text||'':String(v||'');
const providerTypeMatches=(provider,required)=>!required||arr(provider['服务商类型']||provider['机构类型']).some(x=>String(x).includes(required.replace('持牌公司',''))||required.includes(String(x).replace('持牌公司','')));

const preCopy={
 '适合启动':['你的企业已经具备较清晰的跨境业务基础，香港公司能够承担明确角色。','现在是启动香港布局的合适时机'],
 '具备基础':['补充关键业务和运营安排后，可以逐步进入落地规划。','你的业务已经具备赴港基础'],
 '值得探索':['建议先验证最核心的业务机会，再决定香港公司承担什么功能。','香港值得成为你的下一步选项'],
 '早期准备':['先明确目标客户、业务路径和香港公司能够解决的实际问题。','先把赴港机会看清楚']
};
const inCopy={
 '注册审批中':['利用等待期间准备账户、合同、会计记录和持续维护安排。','可以开始准备公司成立后的第一步'],
 '成立待运营':['先明确公司用途，再依次准备账户、合同、会计记录和持续维护事项。','香港公司已经成立，接下来把基础安排接上'],
 '当前运行基本正常':['继续保持公司维护、会计记录和业务资料完整。','目前没有发现明显需要优先处理的事项'],
 '有事项待完善':['部分公司维护、账户、会计或业务安排需要进一步完善。','公司具备基本运作条件，但仍有事项需要补齐'],
 '需要优先核验':['当前不代表已经违规，但建议尽快确认实际状态和处理时间。','先确认这些关键事项，再继续推进经营'],
 '退出安排待梳理':['先核清业务、账户、税务、债务和未完成事项。','先核清公司现状，再决定暂停还是撤销']
};

const action=(id,stage,title,reason,services,providerType='')=>({id,stage,title,reason,services,providerType});
const prePurposeActions={
 '承接海外合同':['contract','确认跨境合同与主体分工',['商业合同','跨境交易及资金安排'],'律师事务所'],
 '处理跨境收付款':['payment','规划账户与跨境收付款路径',['银行开户','跨境交易及资金安排','税务及架构咨询'],'TCSP持牌公司'],
 '开拓香港或国际市场':['market','明确香港公司的市场角色',['进入香港或国际市场','业务落地'],'TCSP持牌公司'],
 '建设国际品牌或管理知识产权':['ip','确认品牌与知识产权权属',['知识产权咨询','商业合同'],'律师事务所'],
 '融资或引入投资':['equity','梳理融资与股权结构',['融资及投资','股权及公司架构'],'律师事务所'],
 '搭建供应链或贸易平台':['supply','梳理供应链与贸易路径',['跨境交易及资金安排','税务及架构咨询'],'会计师事务所'],
 '在香港招聘或设立办公室':['employment','准备香港雇佣与本地运营',['香港雇佣及强积金'],'律师事务所'],
 '设立区域总部':['headquarters','设计区域总部与治理结构',['股权及公司架构','商业合同'],'律师事务所'],
 '合规进行税务与架构优化':['tax','核验业务实质与税务架构',['税务及架构咨询','会计记账'],'会计师事务所']
};
const preStages={'适合启动':['当前优先','建议同步','公司成立后'],'具备基础':['当前优先','建议同步了解','落地后准备'],'值得探索':['优先验证','进一步确认','后续准备'],'早期准备':['先做准备','逐步确认','条件成熟后']};
const inHKIssueActions={
 '确认公司秘书和注册地址状态':['maintenance','核对公司维护及周年申报事项',['公司秘书','注册地址'],'TCSP持牌公司'],
 '优先核验商业登记和周年申报':['maintenance','核对公司维护及周年申报事项',['商业登记及周年申报'],'TCSP持牌公司'],
 '尽快整理会计记录':['finance','梳理会计、审计及税务安排',['会计记账'],'会计师事务所'],
 '确认审计安排':['finance','梳理会计、审计及税务安排',['审计'],'会计师事务所'],
 '优先确认税务申报状态':['finance','梳理会计、审计及税务安排',['税务申报','税务及架构咨询'],'会计师事务所'],
 '完善账户及收付款安排':['payment','完善账户及跨境收付款安排',['跨境交易及资金安排'],'TCSP持牌公司'],
 '完善跨境收付款能力':['payment','完善账户及跨境收付款安排',['跨境交易及资金安排'],'TCSP持牌公司'],
 '优先处理账户使用问题':['payment','完善账户及跨境收付款安排',['跨境交易及资金安排'],'律师事务所'],
 '核验雇佣及强积金事项':['employment','准备香港雇佣安排',['香港雇佣及强积金'],'律师事务所'],
 '核验业务是否涉及牌照要求':['license','核验行业经营要求',['行业牌照及监管合规'],'律师事务所'],
 '梳理境内外主体关系':['contracts','梳理境内外主体关系',['商业合同','跨境交易及资金安排','股权及公司架构'],'律师事务所'],
 '先核清公司的基础状态':['status','先核清公司的基础状态',['公司持续维护','会计记账'],'TCSP持牌公司'],
 '获取成立后待办清单':['startup','获取成立后待办清单',['公司秘书','注册地址','商业登记及周年申报','公司持续维护'],'TCSP持牌公司'],
 '核对公司维护事项':['maintenance','核对公司维护事项',['公司持续维护','商业登记及周年申报'],'TCSP持牌公司'],
 '梳理财税安排':['finance','梳理财税安排',['会计记账','审计','税务申报','税务及架构咨询'],'会计师事务所'],
 '准备香港雇佣安排':['employment','准备香港雇佣安排',['香港雇佣及强积金'],'律师事务所'],
 '核验行业经营要求':['license','核验行业经营要求',['行业牌照及监管合规'],'律师事务所'],
 '制定市场拓展计划':['market','制定市场拓展计划',['进入香港或国际市场','业务落地'],'TCSP持牌公司'],
 '梳理融资及股权结构':['equity','梳理融资及股权结构',['融资及投资','股权及公司架构'],'律师事务所'],
 '先核清退出前事项':['exit','先核清退出前事项',['停止经营及撤销注册','公司重组','税务申报'],'会计师事务所'],
 '了解后续维护事项':['maintenance','了解后续维护事项',['公司持续维护'],'TCSP持牌公司']
};
const inHKFallback={
 '注册审批中':['获取成立后待办清单','梳理财税安排'], '成立待运营':['核对公司维护事项','完善账户及收付款安排'],
 '当前运行基本正常':['核对公司维护事项','梳理财税安排'], '有事项待完善':['核对公司维护事项','了解后续维护事项'],
 '需要优先核验':['先核清公司的基础状态','核对公司维护事项'], '退出安排待梳理':['先核清退出前事项','梳理财税安排']
};
export function buildActions(type,f){
 const actions=[];
 if(type==='pre-hk'){
  const purpose=f['赴港首要目的']||arr(f['赴港主要目的'])[0]||'';
  const conclusion=f['评估结论']||'具备基础',stages=preStages[conclusion]||preStages['具备基础'];
  const core=prePurposeActions[purpose];
  if(core)actions.push(action(core[0],stages[0],core[1],`你的赴港首要目的是“${purpose}”，这项行动直接由该目标生成。`,core[2],core[3]));
  else actions.push(action('validation',stages[0],'确认香港公司需要解决的业务问题','当前赴港目标尚不足以生成具体落地事项，建议先完成业务条件核验。',['税务及架构咨询'],'会计师事务所'));
  if(['适合启动','具备基础'].includes(conclusion)&&!actions.some(x=>x.id==='setup'))actions.push(action('setup',stages[1],'注册香港公司',`为了承接“${purpose||'已确认的跨境业务'}”，需要确认注册、公司秘书、注册地址及后续维护安排。`,['香港公司注册','公司秘书','注册地址'],'TCSP持牌公司'));
  const pains=arr(f['当前跨境业务难点']),ips=arr(f['核心知识产权类型']);
  if((pains.includes('品牌及知识产权保护')||ips.length)&&!actions.some(x=>x.id==='ip'))actions.push(action('ip',stages[actions.length],'确认品牌与知识产权安排','你的品牌或知识产权将与香港业务发生关联，需要先核实权属及授权路径。',['知识产权咨询','商业合同'],'律师事务所'));
  if(actions.length<2)actions.push(action('validation',stages[1],'补充业务条件与专业核验','根据当前评估结论，需要先补充关键业务信息，再确定香港公司的落地方案。',['税务及架构咨询'],'会计师事务所'));
  if(['适合启动','具备基础'].includes(conclusion)&&actions.length<3)actions.push(action('compliance',stages[2],'配置财税与持续合规','公司成立后需要持续保留会计记录，并安排周年申报、审计和税务事项。',['会计记账','审计','税务申报'],'会计师事务所'));
 }else{
  const conclusion=f['在港状态评估结论']||'';
  const sources=[...arr(f['优先处理与待完善事项']),...arr(f['下一步建议'])];
  if(conclusion==='注册审批中')sources.unshift('获取成立后待办清单');
  if(conclusion==='退出安排待梳理')sources.unshift('先核清退出前事项');
  for(const source of sources){
   const def=inHKIssueActions[source]; if(!def||actions.some(x=>x.id===def[0]))continue;
   actions.push(action(def[0],actions.length?'建议随后处理':'当前优先',def[1],`你在最新评估中反馈了“${source}”，这项行动直接由该信息生成。`,def[2],def[3]));
  }
  for(const fallback of inHKFallback[conclusion]||[])if(actions.length<2){const def=inHKIssueActions[fallback];if(def&&!actions.some(x=>x.id===def[0]))actions.push(action(def[0],actions.length?'建议随后处理':'当前优先',def[1],`根据“${conclusion}”的结论兜底规则生成。`,def[2],def[3]))}
 }
 return actions.slice(0,3);
}

export function matchProviders(actions,providers,assessment){
 const inHK=Boolean(assessment['在港状态评估结论']);
 const status=assessment['香港公司当前状态']||'';
 const stageMap={'注册审批中':['公司设立','业务落地'],'成立待运营':['业务落地','持续维护'],'正常经营':['持续维护','专项服务'],'暂停经营':['持续维护','专项服务','停止经营及退出'],'考虑停止经营或撤销注册':['停止经营及退出','专项服务']};
 const roles=arr(assessment['香港公司主要作用']);
 const rolePurposes=roles.flatMap(x=>({'海外签约及跨境收付款':['承接海外合同','处理跨境收付款'],'进出口或供应链业务':['搭建供应链或贸易平台'],'开拓香港或国际市场':['开拓香港或国际市场'],'运营品牌或管理知识产权':['建设国际品牌或管理知识产权'],'融资、投资或持有股权':['融资或引入投资'],'在香港招聘或设立办公室':['在香港招聘或设立办公室'],'区域总部或业务管理':['设立区域总部']}[x]||[]));
 return actions.map(a=>{
   const ranked=providers.map(provider=>{
   const hit=arr(provider['可提供服务']).filter(x=>a.services.includes(x));
   if(provider['推荐状态']!=='正常推荐'||provider['资质核验状态']!=='已核验'||!text(provider['官方网站'])||!providerTypeMatches(provider,a.providerType)||!hit.length)return null;
   if(!inHK&&!includes(provider['适合企业规模'],assessment['企业规模']))return null;
   let score=0;const dimensions=[];
   if(inHK){
    score+=35;dimensions.push('服务匹配');
    if(intersects(provider['可解决的业务难点'],[...arr(assessment['优先处理与待完善事项']),...arr(assessment['当前跨境业务难点'])])){score+=20;dimensions.push('当前业务难点匹配')}
    if(intersects(provider['支持服务阶段'],stageMap[status]||[])){score+=10;dimensions.push('服务阶段匹配')}
    if(includes(provider['擅长行业'],assessment['主营行业'])){score+=10;dimensions.push('行业经验匹配')}
    if(includes(provider['适合企业规模'],assessment['企业规模'])){score+=10;dimensions.push('企业规模匹配')}
    if(intersects(provider['擅长业务模式'],assessment['主要业务模式'])){score+=5;dimensions.push('业务模式匹配')}
    if(intersects(provider['擅长赴港目的'],rolePurposes)){score+=5;dimensions.push('赴港目标匹配')}
    if(arr(provider['服务语言']).some(x=>['普通话','中文','简体中文'].includes(x))){score+=3;dimensions.push('支持普通话服务')}
    if(provider['是否支持远程办理']==='是'){score+=2;dimensions.push('支持远程办理')}else if(provider['是否支持远程办理']==='部分支持'){score+=1;dimensions.push('部分支持远程办理')}
   }else{
    score+=35;dimensions.push('赴港目标匹配');
    score+=Math.round(20*hit.length/Math.max(1,a.services.length));dimensions.push('服务匹配');
    const industry=includes(provider['擅长行业'],assessment['主营行业']),mode=intersects(provider['擅长业务模式'],assessment['主要业务模式']);
    if(industry){score+=10;dimensions.push('行业经验匹配')}if(mode){score+=5;dimensions.push('业务模式匹配')}
    score+=5;dimensions.push('企业规模匹配');
    if(includes(provider['适合经营阶段'],assessment['当前经营阶段'])){score+=5;dimensions.push('经营阶段匹配')}
    if(intersects(provider['熟悉业务地区'],assessment['当前客户所在地区'])){score+=5;dimensions.push('业务地区匹配')}
    if(intersects(provider['熟悉收付款币种'],assessment['当前收付款币种'])){score+=5;dimensions.push('收付款币种匹配')}
    if(intersects(provider['知识产权服务能力'],assessment['核心知识产权类型'])||intersects(provider['可解决的业务难点'],assessment['当前跨境业务难点'])){score+=5;dimensions.push('专项服务能力匹配')}
    if(arr(provider['服务语言']).some(x=>['普通话','中文','简体中文'].includes(x))){score+=3;dimensions.push('支持普通话服务')}
    if(provider['是否支持远程办理']==='是'){score+=2;dimensions.push('支持远程办理')}else if(provider['是否支持远程办理']==='部分支持'){score+=1;dimensions.push('部分支持远程办理')}
   }
   if(score<50)return null;
   const abilities=dimensions.filter(x=>!['服务匹配','赴港目标匹配'].includes(x)).slice(0,2);
   const reason=`该服务商可提供${hit.slice(0,2).join('和')}服务${abilities.length?`，并在${abilities.join('及')}方面与你当前的企业需求相符`:''}。`;
   return {provider,score,dimensions:[...new Set(dimensions)],reason};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||String(a.provider['服务商简称']||a.provider['服务商名称']).localeCompare(String(b.provider['服务商简称']||b.provider['服务商名称']),'zh-Hans-CN')).slice(0,3).map((x,i)=>({...x,rank:i+1}));
  if(ranked.length)return {...a,providers:ranked};

  // Demo 兜底：严格匹配为空时，仍只使用可正常推荐、已核验且有官网的服务商。
  // 放宽服务项目和企业规模的硬匹配，优先选择服务商类型最接近的一家，避免首页出现空推荐。
  const fallback=providers.map(provider=>{
   if(provider['推荐状态']!=='正常推荐'||provider['资质核验状态']!=='已核验'||!text(provider['官方网站']))return null;
   const hit=arr(provider['可提供服务']).filter(x=>a.services.includes(x));
   const typeMatch=providerTypeMatches(provider,a.providerType);
   let score=(typeMatch?50:0)+Math.min(30,hit.length*15);
   const dimensions=[];
   if(typeMatch)dimensions.push('服务类型匹配');
   if(hit.length)dimensions.push('部分服务能力匹配');
   if(includes(provider['适合企业规模'],assessment['企业规模'])){score+=10;dimensions.push('企业规模匹配')}
   if(includes(provider['擅长行业'],assessment['主营行业'])){score+=5;dimensions.push('行业经验匹配')}
   if(intersects(provider['擅长业务模式'],assessment['主要业务模式'])){score+=3;dimensions.push('业务模式匹配')}
   if(provider['是否支持远程办理']==='是'){score+=2;dimensions.push('支持远程办理')}
   return {provider,score,dimensions,reason:`该服务商在${dimensions.slice(0,2).join('及')||'相关专业服务'}方面更接近你当前的需求，建议进入详情确认具体承接范围。`,fallback:true};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||String(a.provider['服务商简称']||a.provider['服务商名称']).localeCompare(String(b.provider['服务商简称']||b.provider['服务商名称']),'zh-Hans-CN')).slice(0,1).map(x=>({...x,rank:1}));
  return {...a,providers:fallback};
 });
}

export function assessmentHome(type,record,providers){
 const f=record.fields||{},conclusion=f[type==='in-hk'?'在港状态评估结论':'评估结论']||'';
 const copy=(type==='in-hk'?inCopy:preCopy)[conclusion]||['根据最新评估整理了当前建议。','接下来，优先处理这些事'];
 const actions=matchProviders(buildActions(type,f),providers,f);
 const lines=v=>String(v||'').split('\n').filter(Boolean);
 const result=type==='in-hk'?{type,conclusion,title:copy[1],summary:copy[0],companyStatus:f['香港公司当前状态']||'',roles:arr(f['香港公司主要作用']),issues:arr(f['优先处理与待完善事项']),actions:arr(f['下一步建议']),answers:{}}:{type,conclusion,title:copy[1],summary:copy[0],basis:`评估总分 ${f['评估总分']||0} 分，结合企业业务基础、跨境需求、行业合规和香港发展价值生成。`,score:Number(f['评估总分']||0),dimensions:{compliance:Number(f['行业及合规实际得分']||0),business:Number(f['企业业务基础实际得分']||0),crossBorder:Number(f['跨境业务需求实际得分']||0),hkValue:Number(f['香港发展价值实际得分']||0)},features:lines(f['业务特点']),confirmations:lines(f['需要进一步确认']),risks:lines(f['需要特别关注']),position:f['初步公司主定位']||'',architecture:f['初步架构方向']||'',attention:arr(f['当前跨境业务难点']),answers:{}};
 return {type,assessmentRecordId:record.record_id,assessmentId:f[type==='in-hk'?'在港评估ID':'赴港评估ID'],conclusion,title:copy[1],summary:copy[0],actions,result};
}

// 提交完成后直接生成本次首页数据，避免依赖飞书的写后立即回读。
export function assessmentRecordFromResult(result,recordId=''){
 const a=result.answers||{};
 const common={'主营行业':a.F01_primary||arr(a.F01)[0]||'','企业规模':a.F12||'','当前经营阶段':a.F04||'','主要业务模式':arr(a.F02)};
 if(result.type==='in-hk'){
  const issueLabels={'公司秘书或注册地址':'确认公司秘书和注册地址状态','商业登记或周年申报':'优先核验商业登记和周年申报','做账及会计记录':'尽快整理会计记录','审计':'确认审计安排','税务申报':'优先确认税务申报状态','银行账户或跨境收付款':'完善账户及收付款安排','香港雇员或强积金':'核验雇佣及强积金事项','行业牌照或许可':'核验业务是否涉及牌照要求','内地与香港公司之间的合同或资金安排':'梳理境内外主体关系','整体情况不太清楚':'先核清公司的基础状态'};
  const issues=arr(a.HK06).map(x=>issueLabels[x]).filter(Boolean);
  if(a.HK05==='已经开户但使用中遇到问题')issues.unshift('优先处理账户使用问题');
  if(arr(a.HK03).includes('海外签约及跨境收付款')&&a.HK05==='尚未申请开户')issues.push('完善跨境收付款能力');
  return {record_id:recordId,fields:{...common,'在港状态评估结论':result.conclusion,'香港公司当前状态':a.HK01||'','香港公司主要作用':arr(a.HK03),'优先处理与待完善事项':[...new Set(issues)],'下一步建议':arr(result.actions)}};
 }
 return {record_id:recordId,fields:{...common,'评估结论':result.conclusion,'赴港首要目的':a.F10_primary||arr(a.F10)[0]||'','赴港主要目的':arr(a.F10),'当前跨境业务难点':arr(a.F09),'核心知识产权类型':arr(a.IP01),'评估总分':result.score,'行业及合规实际得分':result.dimensions?.compliance,'企业业务基础实际得分':result.dimensions?.business,'跨境业务需求实际得分':result.dimensions?.crossBorder,'香港发展价值实际得分':result.dimensions?.hkValue,'业务特点':arr(result.features).join('\n'),'需要进一步确认':arr(result.confirmations).join('\n'),'需要特别关注':arr(result.risks).join('\n'),'初步公司主定位':result.position||'','初步架构方向':result.architecture||''}};
}
