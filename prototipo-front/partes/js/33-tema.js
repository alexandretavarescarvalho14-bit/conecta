/* ══════════════════ 13 · TEMA ══════════════════ */
const T_CHAVE='conectaria.tema';
function aplicarTema(t){
  if(t) document.documentElement.setAttribute('data-theme',t);
  else document.documentElement.removeAttribute('data-theme');
  try{ t ? localStorage.setItem(T_CHAVE,t) : localStorage.removeItem(T_CHAVE); }catch(_){}
}
function alternarTema(){
  const atual = document.documentElement.getAttribute('data-theme');
  const escuroSistema = matchMedia('(prefers-color-scheme: dark)').matches;
  const efetivo = atual || (escuroSistema?'dark':'light');
  aplicarTema(efetivo==='dark'?'light':'dark');
  toast(efetivo==='dark'?'Tema claro.':'Tema escuro.', I.esc);
}
(function iniTema(){
  let t=null; try{ t=localStorage.getItem(T_CHAVE); }catch(_){}
  if(t) aplicarTema(t);
})();
