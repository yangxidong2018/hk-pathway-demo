export function plainTextField(value){
  if(Array.isArray(value))return value.map(plainTextField).join('').trim();
  if(value&&typeof value==='object')return plainTextField(value.text??value.name??value.value??'');
  return String(value??'').trim();
}
