import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createGzip } from 'node:zlib';

const root = path.resolve(process.argv[2] || '_site');
const port = Number(process.argv[3] || 4173);
const types = new Map([
  ['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],['.js','text/javascript; charset=utf-8'],
  ['.json','application/json; charset=utf-8'],['.jsonld','application/ld+json; charset=utf-8'],['.xml','application/xml; charset=utf-8'],
  ['.txt','text/plain; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp'],['.avif','image/avif'],['.jpg','image/jpeg'],
  ['.jpeg','image/jpeg'],['.png','image/png'],['.gif','image/gif'],['.ico','image/x-icon'],['.mp4','video/mp4'],['.webm','video/webm'],['.woff2','font/woff2']
]);
const compressible = /^(text\/|application\/(json|ld\+json|xml|javascript)|image\/svg\+xml)/;
function resolveRequest(urlPath){
  const clean=decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g,'/');
  let target=path.resolve(root,'.'+clean);
  if(!target.startsWith(root)) return null;
  if(existsSync(target)&&statSync(target).isDirectory()) target=path.join(target,'index.html');
  if(!existsSync(target)&&!path.extname(target)) target=path.join(target,'index.html');
  return existsSync(target)&&statSync(target).isFile()?target:null;
}
const server=http.createServer((req,res)=>{
  const file=resolveRequest(req.url||'/');
  if(!file){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');return;}
  const type=types.get(path.extname(file).toLowerCase())||'application/octet-stream';
  const headers={'content-type':type,'cache-control':file.includes(`${path.sep}assets${path.sep}`)?'public, max-age=31536000, immutable':'no-cache','vary':'Accept-Encoding'};
  if(/(?:^|,)\s*gzip\s*(?:,|$)/i.test(req.headers['accept-encoding']||'')&&compressible.test(type)){
    headers['content-encoding']='gzip';res.writeHead(200,headers);createReadStream(file).pipe(createGzip({level:6})).pipe(res);
  }else{res.writeHead(200,headers);createReadStream(file).pipe(res);}
});
server.listen(port,'127.0.0.1',()=>console.log(`PERF_SERVER_READY http://127.0.0.1:${port}`));
