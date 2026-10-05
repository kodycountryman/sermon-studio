import {useEffect,useState} from 'react';
export function useEditorViewport(shell){
 const [narrow,setNarrow]=useState(()=>window.innerWidth<=700);
 useEffect(()=>{
  const viewport=window.visualViewport,node=shell.current;
  const update=()=>{setNarrow(window.innerWidth<=700);node.style.setProperty('--editor-view-height',`${viewport?.height || window.innerHeight}px`);node.style.setProperty('--editor-view-top',`${viewport?.offsetTop || 0}px`);node.style.setProperty('--editor-keyboard',`${Math.max(0,window.innerHeight-(viewport?.height || window.innerHeight)-(viewport?.offsetTop || 0))}px`);};
  update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);
  return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[shell]);
 return narrow;
}
export const mobileEditorCss=`
@media(max-width:700px){
 .sermon-editor-full{top:var(--editor-view-top,0px)!important;bottom:auto!important;height:var(--editor-view-height,100dvh)!important;padding:116px 8px 8px!important}
 .sermon-editor [aria-label="Editing HUD"]{left:8px!important;right:8px!important;padding:6px!important;max-height:calc(var(--editor-view-height,100dvh) - 24px)!important}
 .sermon-editor [aria-label="Editing HUD"]>div:first-child{flex-wrap:wrap}
 .sermon-editor [aria-label="Editing HUD"]>div:first-child>span{min-width:80px;max-width:calc(100% - 165px)}
 .sermon-editor button,.sermon-editor select,.sermon-editor summary{min-height:44px}
 .sermon-editor input,.sermon-editor textarea,.sermon-editor select{font-size:16px!important}
 .sermon-editor [aria-label="Editor formatting"]{overflow-x:auto;max-width:100%}
 .sermon-editor [aria-label="Document viewport"]{padding:8px!important;padding-bottom:100px!important}
 .sermon-editor .document-assistant-launch{right:12px!important;bottom:calc(var(--editor-keyboard,0px) + env(safe-area-inset-bottom) + 52px)!important}
 .sermon-editor [aria-label="Document counts"]{right:12px!important;bottom:calc(env(safe-area-inset-bottom) + 8px)!important;font-size:11px!important;padding:8px!important}
 .sermon-editor #document-assistant{right:8px!important;left:8px!important;width:auto!important;bottom:calc(var(--editor-keyboard,0px) + env(safe-area-inset-bottom) + 8px)!important;height:calc(var(--editor-view-height,100dvh) - 24px)!important;max-height:650px}
 .sermon-editor:has(.sermon-preparation) .document-assistant-launch,.sermon-editor:has(.sermon-preparation) [aria-label="Document counts"],.sermon-editor:has(#document-assistant) .document-assistant-launch{display:none!important}
 .sermon-editor .saved-sermon-page{padding:20px 16px!important}
 .sermon-editor .sermon-preparation{width:calc(100% - 26px)!important;max-height:100%;padding:12px!important}
 .sermon-editor [aria-label="Sermon outputs"]{inset:calc(var(--editor-view-top,0px) + 8px) 8px auto!important;height:calc(var(--editor-view-height,100dvh) - 32px)!important;box-sizing:border-box;padding:12px!important}
}
@media(pointer:coarse){.sermon-editor [aria-label="Editing HUD"] button,.sermon-editor .sermon-preparation button{min-height:44px}.sermon-editor .saved-sermon-page{touch-action:auto}}
`;
