import {lookupScripture} from '../../server/scripture-source.js';
export async function onRequestGet({request}){
  try{
    const data=await lookupScripture(new URL(request.url).searchParams.get('reference') || '');
    return Response.json(data,{headers:{'Cache-Control':'public, max-age=3600'}});
  }catch(e){return Response.json({error:e.message},{status:400});}
}
