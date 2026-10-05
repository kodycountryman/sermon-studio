import {lookupScripture} from '../server/scripture-source.js';
export function scripturePreviewPlugin(){return {name:'scripture-preview',apply:'serve',configureServer(server){
  server.middlewares.use(async(req,res,next)=>{
    if(req.url?.split('?')[0]!=='/api/scripture')return next();
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    try{
      const data=await lookupScripture(new URL(req.url,'http://localhost').searchParams.get('reference') || '');
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));
    }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}
  });
}};}
