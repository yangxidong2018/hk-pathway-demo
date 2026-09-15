import crypto from 'node:crypto';

const host='asr.tencentcloudapi.com';
const service='asr';
const version='2019-06-14';
const algorithm='TC3-HMAC-SHA256';

export const engineForLocale=locale=>({
  'zh-CN':'16k_zh',
  'zh-HK':'16k_yue',
  en:'16k_en',
  vi:'16k_vi',
  'pt-BR':'16k_pt'
}[locale]||'16k_zh');

export const tencentAsrReady=env=>env.TENCENT_ASR_ENABLED==='true'&&!!env.TENCENT_SECRET_ID&&!!env.TENCENT_SECRET_KEY;
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const hmac=(key,value)=>crypto.createHmac('sha256',key).update(value).digest();
const dateFromTimestamp=timestamp=>new Date(timestamp*1000).toISOString().slice(0,10);

export function signedTencentHeaders({payload,secretId,secretKey,timestamp=Math.floor(Date.now()/1000)}){
  const date=dateFromTimestamp(timestamp),canonicalHeaders=`content-type:application/json; charset=utf-8\nhost:${host}\n`,signedHeaders='content-type;host';
  const canonicalRequest=`POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256(payload)}`;
  const credentialScope=`${date}/${service}/tc3_request`;
  const stringToSign=`${algorithm}\n${timestamp}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const secretDate=hmac(`TC3${secretKey}`,date),secretService=hmac(secretDate,service),secretSigning=hmac(secretService,'tc3_request');
  const signature=crypto.createHmac('sha256',secretSigning).update(stringToSign).digest('hex');
  return {
    'Content-Type':'application/json; charset=utf-8',
    Host:host,
    'X-TC-Action':'SentenceRecognition',
    'X-TC-Version':version,
    'X-TC-Timestamp':String(timestamp),
    Authorization:`${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
}

export async function transcribeTencentAudio(env,{audioBase64,locale='zh-CN',format='wav'}){
  if(!tencentAsrReady(env)){const error=Error('语音转写服务尚未配置');error.code='not-configured';throw error;}
  if(format!=='wav')throw Error('仅支持 WAV 语音格式');
  const audio=Buffer.from(String(audioBase64||''),'base64');
  if(!audio.length)throw Error('没有收到有效语音');
  if(audio.length>3*1024*1024)throw Error('录音超过 3MB，请缩短后重试');
  const payload=JSON.stringify({EngSerViceType:engineForLocale(locale),SourceType:1,VoiceFormat:'wav',Data:audioBase64,DataLen:audio.length,FilterDirty:0,FilterModal:0,FilterPunc:0,ConvertNumMode:1});
  const response=await fetch(`https://${host}`,{method:'POST',headers:signedTencentHeaders({payload,secretId:env.TENCENT_SECRET_ID,secretKey:env.TENCENT_SECRET_KEY}),body:payload,signal:AbortSignal.timeout(20000)});
  const data=await response.json().catch(()=>null);
  const error=data?.Response?.Error;
  if(!response.ok||error){const message=error?.Message||'语音服务暂时无法响应';const failure=Error(message);failure.code=error?.Code||'asr-request-failed';throw failure;}
  const text=String(data?.Response?.Result||'').trim();
  if(!text)throw Error('未识别到清晰语音，请靠近麦克风后重试');
  return text;
}
