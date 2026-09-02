import {handleApi} from '../lib/http-api.js';

export default async function handler(req,res){
  return handleApi(req,res,process.env);
}
