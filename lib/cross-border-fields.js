// PRD v1.0 §§14–16. IDs and canonical values are independent of display locale.
export const NEW_BASE='KyoPbl9APaiZ8CsOpipcpEDtnxf';
export const TABLES={customer:'tbliZtofcDldahb0',assessment:'tblqO9yIXbdy4tB9',special:'tblQhL663Hr1Di6B',provider:'tblllly7pqSDiiBT',professional:'tblnir5hWa3lMpwf',recommendation:'tblplhRgvn59uhYa',guide:'tblDy4RzaDcNWSVQ',chatSession:'tbl55EaojYd9j3iq',chatMessage:'tbliWHg9ITJ6QWbt'};
export const answerFields={F00:'目标国家/地区',F01:'企业所属行业',F01_primary:'主营行业',F01_other:'其他行业说明',F02:'主要业务模式',F02_other:'其他业务模式说明',F03:'当前主要经营地',F04:'当前经营阶段',F05:'企业经营时间',F12:'企业规模',F06:'年度海外收入',F07:'当前客户所在地区',F08:'当前收付款币种',F09:'当前跨境业务难点',F10:'赴目标国主要目的',F10_primary:'赴目标国首要目的',F10_other:'其他赴目标国目的说明',F11:'当前赴目标国推进状态',IP01:'核心知识产权类型'};
export const resultFields={title:'结果主标题',summary:'个性化结论',fitReason:'适配理由',features:'业务特点',verification:'专业核验事项',position:'初步公司主定位',auxiliaryPosition:'初步公司辅助定位',architecture:'初步架构方向',division:'境内外业务分工',lightStart:'轻量启动建议',cost:'预计基础成本',obligations:'持续义务',nextSteps:'下一步建议'};
export const dimensionFields={compliance:['行业及准入适配度得分','行业及准入适配度状态',25,['整体可行','基本可行','建议核验','需要专项核验']],business:['企业业务基础得分','企业业务基础状态',20,['基础扎实','基础稳定','正在形成','仍在准备']],crossBorder:['跨境业务需求得分','跨境业务需求状态',20,['需求明确','已有需求','正在形成','尚不明确']],targetValue:['目标国发展价值得分','目标国发展价值状态',35,['价值明确','具备价值','值得验证','需要确认']]};
export const dimensionStatus=(key,score)=>{const [, ,max,labels]=dimensionFields[key];return labels[score/max>=.8?0:score/max>=.6?1:score/max>=.4?2:3];};
export function assessmentFields(result,{userId,phone,customerRecordId}){
 const f={'跨境评估ID':result.id,'用户ID':userId,'手机号':phone,'关联客户':[customerRecordId],'评估总分':result.score,'评估结论':result.conclusion};
 for(const [k,name] of Object.entries(answerFields))f[name]=result.answers[k]??(Array.isArray(result.answers[k])?[]:'');
 for(const [k,name] of Object.entries(resultFields))f[name]=Array.isArray(result[k])?result[k].join('\n'):result[k]||'';
 for(const [k,[score,state]] of Object.entries(dimensionFields)){f[score]=result.dimensions[k];f[state]=dimensionStatus(k,result.dimensions[k]);}
 return f; // Never write created-time or lookup fields.
}
export function customerFields(result,count,time){
 const f={'用户状态':'已评估','最近评估目标国家/地区':result.answers.F00,'最近评估时间':time,'赴目标国评估次数':count};
 for(const k of ['F01','F01_primary','F01_other','F02','F02_other','F03','F04','F05','F12'])f[answerFields[k]]=result.answers[k]??'';
 return f;
}
export function answersFromRecord(record){return Object.fromEntries(Object.entries(answerFields).map(([k,name])=>[k,record.fields[name]]));}
export function crossEnv(env){return {...env,FEISHU_APP_TOKEN:NEW_BASE,FEISHU_CUSTOMER_TABLE_ID:TABLES.customer,FEISHU_PRE_HK_TABLE_ID:TABLES.assessment,FEISHU_IN_HK_TABLE_ID:'',FEISHU_PROVIDER_TABLE_ID:TABLES.provider,FEISHU_PROVIDER_RECOMMENDATION_TABLE_ID:TABLES.recommendation,FEISHU_CHAT_SESSION_TABLE_ID:TABLES.chatSession,FEISHU_CHAT_MESSAGE_TABLE_ID:TABLES.chatMessage};}
