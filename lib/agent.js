const LINKAI_URL='https://api.link-ai.tech/v1/workflow/run';

async function requestLinkAi({message,userId,sessionId},env){
  const response=await fetch(env.LINKAI_API_URL||LINKAI_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.LINKAI_API_KEY}`},
    body:JSON.stringify({
      app_code:env.LINKAI_APP_CODE,
      args:{input_text:message,user_id:userId},
      session_id:sessionId
    })
  });
  const data=await response.json().catch(()=>null);
  if(!response.ok||data?.success===false){
    const error=new Error(data?.message||'AI工作流暂时不可用');
    error.status=response.status;
    throw error;
  }
  const reply=String(data?.data?.output_text||'').trim();
  if(!reply)throw new Error('AI工作流没有返回回复内容');
  return reply;
}

async function linkAiWorkflow(payload,env){
  try{
    return await requestLinkAi(payload,env);
  }catch(error){
    if(!/未知异常/.test(String(error?.message||'')))throw error;
    try{
      console.warn('linkai-session-recovery',{userId:payload.userId,status:error.status});
      return await requestLinkAi({...payload,sessionId:`${payload.sessionId}:recovery`},env);
    }catch(retryError){
      const friendlyError=new Error('AI顾问暂时没有响应，请重新发送一次。');
      friendlyError.cause=retryError;
      throw friendlyError;
    }
  }
}

export async function chatWithAgent({message,context,history=[],userId,sessionId},env){
  if(env.AI_PROVIDER==='linkai'&&env.LINKAI_API_KEY&&env.LINKAI_APP_CODE){
    return linkAiWorkflow({message,userId,sessionId},env);
  }
  if(env.AI_PROVIDER==='openai'&&env.AI_API_KEY){
    const response=await fetch(`${env.AI_BASE_URL||'https://api.openai.com/v1'}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.AI_API_KEY}`},body:JSON.stringify({model:env.AI_MODEL||'gpt-4.1-mini',temperature:.3,messages:[{role:'system',content:'你是赴港通AI顾问。只能解释给定评估，不得修改规则分数或承诺法律、税务、开户与注册结果。回答简洁、可执行。评估上下文：'+JSON.stringify(context)},...history.slice(-8),{role:'user',content:message}]})});
    if(!response.ok) throw new Error('AI服务暂时不可用');
    const data=await response.json(); return data.choices?.[0]?.message?.content||'暂时无法生成回复。';
  }
  const result=context?.result;
  if(!result) return '我可以先了解你的业务阶段，再帮你梳理适合的赴港路径。';
  if(/为什么|结论/.test(message)) return `你的结论是“${result.conclusion}”。这是规则引擎根据企业基础、跨境需求和赴港目标计算的结果；AI只负责解释，不会改变结论。`;
  if(/先做|下一步|现在/.test(message)) return result.type==='in-hk'?`建议先处理：${result.issues?.[0]||result.actions?.[0]||'确认公司维护与业务资料是否完整'}。完成后再进入下一项。`:`建议先明确“${result.position||'香港公司的业务角色'}”的具体业务范围，再准备注册、账户和持续合规安排。`;
  return `结合本次“${result.conclusion}”评估，建议围绕真实合同、收付款和主体分工继续确认。你也可以问我“为什么得到这个结论”或“现在先做什么”。`;
}
