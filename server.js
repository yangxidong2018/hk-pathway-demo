import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {handleApi} from './lib/http-api.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const localEnvFile=['.env','1.env'].map(name=>path.join(root,name)).find(file=>fs.existsSync(file));
if(localEnvFile)for(const line of fs.readFileSync(localEnvFile,'utf8').split(/\r?\n/)){const m=line.match(/^([^#=]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['\"]|['\"]$/g,'');}
const env=process.env;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return await handleApi(req,res,env);let p=url.pathname==='/shared/questions.js'?path.join(root,'lib','questions.js'):path.join(root,'public',url.pathname==='/'?'index.html':url.pathname);const allowed=[path.join(root,'public'),path.join(root,'lib','questions.js')];if(!allowed.some(base=>p===base||p.startsWith(base+path.sep)))return res.end();if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'public','index.html');res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store, max-age=0'});fs.createReadStream(p).pipe(res);}catch(e){json(res,500,{error:e.message||'服务异常'});}});
const host=env.HOST||'0.0.0.0',port=Number(env.PORT||4173);
server.listen(port,host,()=>console.log(`HK Pathway demo listening on ${host}:${port}`));
