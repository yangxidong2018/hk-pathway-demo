import crypto from 'node:crypto';
import {listRecords} from './feishu.js';
import {TABLES} from './cross-border-fields.js';

const text=value=>{
 if(value===undefined||value===null)return '';
 if(Array.isArray(value))return value.map(text).filter(Boolean).join('、');
 if(typeof value==='object')return String(value.text||value.name||value.link||value.url||'');
 return String(value).trim();
};
const link=value=>typeof value==='object'?(value.link||value.url||value.text||''):text(value);
const first=(fields,names)=>{for(const name of names){if(fields[name]!==undefined&&fields[name]!==null&&text(fields[name]))return fields[name];}return '';};
const coverByCountry={'中国香港':'/assets/country-hong-kong.png','新加坡':'/assets/country-singapore.png','美国':'/assets/country-united-states.png','越南':'/assets/country-vietnam.png','巴西':'/assets/country-brazil.png'};
const guideCountryCode={'中国香港':'HK','新加坡':'SG','美国':'US','越南':'VN','巴西':'BR'};
const guideCover=(country,conclusion,sortOrder)=>{
 const code=guideCountryCode[country],order=Math.max(1,Math.min(3,Number(sortOrder)||1));
 if(!code)return coverByCountry[country]||'';
 // Six reusable country-specific scenes: setup/compliance (1–3) and
 // market-entry/investment planning (4–6). The binding is deterministic.
 const scene=['值得探索','早期准备'].includes(conclusion)?order+3:order;
 return `/assets/guides/${code}-${scene}.webp`;
};

function isEnabled(fields){
 const value=first(fields,['是否启用','启用','enabled']);
 if(value===''||value===undefined)return true; // The current table predates this optional PRD field.
 return !['false','0','否','停用','禁用','no'].includes(text(value).toLowerCase());
}
function guideFromRecord(record){
 const fields=record.fields||{};
 const country=text(first(fields,['国家/地区','country_code'])),conclusion=text(first(fields,['评估结论','result_code'])),sortOrder=Number(text(first(fields,['展示顺序','sort_order'])))||9999;
 return {
  id:text(first(fields,['配置ID','article_id']))||record.record_id,
  country,
  conclusion,
  sortOrder,
  title:text(first(fields,['文章标题','title_zh'])),
  source:text(first(fields,['来源机构','source_name'])),
  url:link(first(fields,['官方链接','source_url'])),
  contentLanguage:text(first(fields,['原文语言','内容语言','content_language'])),
  cover:text(first(fields,['封面素材','封面标识','cover_key']))||guideCover(country,conclusion,sortOrder),
  enabled:isEnabled(fields)
 };
}
const rank=(seed,id)=>crypto.createHash('sha256').update(`${seed}:${id}`).digest('hex');

// Kept exported so the selection contract can be tested without Feishu.
export function selectGuides(records,{country,conclusion,assessmentId=''}){
 const eligible=records.map(guideFromRecord).filter(item=>item.enabled&&item.country===country&&item.title&&/^https?:\/\//i.test(item.url));
 const exact=eligible.filter(item=>item.conclusion===conclusion).sort((a,b)=>a.sortOrder-b.sortOrder||a.id.localeCompare(b.id));
 if(exact.length>=3)return exact.slice(0,3).map((item,index)=>({...item,displayOrder:index+1,selectionMode:'exact'}));
 const selectedIds=new Set(exact.map(item=>item.id));
 const seed=`${assessmentId||`${country}:${conclusion}`}:${country}:${conclusion}`;
 const filler=eligible.filter(item=>!selectedIds.has(item.id)).sort((a,b)=>rank(seed,a.id).localeCompare(rank(seed,b.id))||a.id.localeCompare(b.id));
 return [...exact,...filler].slice(0,3).map((item,index)=>({...item,displayOrder:index+1,selectionMode:exact.length?'country-fallback':'country-fallback'}));
}

export async function guidesForAssessment(env,result){
 if(!result?.targetCountry||!result?.conclusion)return [];
 const records=await listRecords(env,TABLES.guide);
 return selectGuides(records,{country:result.targetCountry,conclusion:result.conclusion,assessmentId:result.id});
}

// Before an assessment exists, the selected destination is still meaningful.
// Use the table's "early preparation" set as the country-level starting point,
// then use the same-country fallback in selectGuides when that set is incomplete.
export async function guidesForCountry(env,country){
 const targetCountry=String(country||'').trim();
 if(!targetCountry)return [];
 const records=await listRecords(env,TABLES.guide);
 return selectGuides(records,{country:targetCountry,conclusion:'早期准备',assessmentId:`country-basics:${targetCountry}`});
}
