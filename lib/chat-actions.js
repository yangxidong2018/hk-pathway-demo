const ACTION_TYPES={ASSESS_PRE_HK:'assess_pre_hk',ASSESS_IN_HK:'assess_in_hk',ACCOUNT_SYNC_REQUIRED:'account_sync_required'};
const ACTION_MARKER=/\[\[\s*HKP_ACTION(?:_V1)?\s*:\s*(ASSESS_PRE_HK|ASSESS_IN_HK|ACCOUNT_SYNC_REQUIRED)\s*\]\]/gi;

export function parseAgentAction(value,status=''){
 const found=[];
 const clean=String(value||'').replace(/\r/g,'').replace(ACTION_MARKER,(_marker,code)=>{
  found.push(ACTION_TYPES[String(code).toUpperCase()]);
  return '';
 }).replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 let type='';
 if(found.includes('account_sync_required'))type='account_sync_required';
 else if(found.includes('assess_pre_hk')&&found.includes('assess_in_hk')){
  type=status==='已有香港公司'?'assess_in_hk':status==='暂无香港公司'?'assess_pre_hk':'assessment_choice';
 }else if(found.includes('assess_pre_hk'))type='assess_pre_hk';
 else if(found.includes('assess_in_hk'))type='assess_in_hk';
 return {reply:clean,action:type?{type}:null};
}

export function persistableAgentReply(reply,action){
 const marker={assess_pre_hk:'[[HKP_ACTION_V1:ASSESS_PRE_HK]]',assess_in_hk:'[[HKP_ACTION_V1:ASSESS_IN_HK]]',account_sync_required:'[[HKP_ACTION_V1:ACCOUNT_SYNC_REQUIRED]]'}[action?.type];
 return marker?`${String(reply||'').trim()}\n${marker}`:String(reply||'').trim();
}
