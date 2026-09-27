import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file,'index.html');
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}); res.end(body);
  } catch { res.writeHead(404);res.end('Not found'); }
});
const port=Number(process.env.PORT)||4173;
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`端口 ${port} 已占用。可使用现有服务，或 PORT=4174 npm run dev。`:err.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Transfer Lab: http://localhost:${port}/transfer-lab/`));
