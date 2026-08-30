/* ══════════════════ 12 · PERSISTÊNCIA ══════════════════
   Recarregar a página perdia tudo, o que atrapalhava justamente quem
   estava avaliando o protótipo com calma.                             */
const CHAVE='conectaria.proto.v2';
function salvar(){
  try{
    localStorage.setItem(CHAVE, JSON.stringify({
      logado:S.logado, contaEmp:S.contaEmp, modo:S.modo, view:S.view,
      candidaturas:S.candidaturas, empSalvo:S.empSalvo, comparar:S.comparar,
      fonte:S.cand.fonte,
      eixosCand:Object.fromEntries(EIXO_IDS.map(id=>[id,S.cand.eixos[id].value])),
      skills:S.cand.competencias.map(c=>[c.skillId,c.nivel.value]),
      eixosEmp:Object.fromEntries(EIXO_IDS.map(id=>[id,EMPRESAS.aurora.eixos[id].value])),
    }));
  }catch(_){ /* modo privado ou storage cheio: o protótipo segue sem persistir */ }
}
function restaurar(){
  let d; try{ d=JSON.parse(localStorage.getItem(CHAVE)||'null'); }catch(_){ return false; }
  if(!d) return false;
  try{
    S.logado=!!d.logado; S.contaEmp=!!d.contaEmp; S.modo=d.modo||'cand';
    S.candidaturas=d.candidaturas||[]; S.empSalvo=!!d.empSalvo; S.comparar=d.comparar||[];
    if(d.skills) S.cand.competencias = d.skills.map(([skillId,n])=>({skillId, nivel:sv(n,'user',1)}));
    if(d.eixosCand) EIXO_IDS.forEach(id=>{ if(d.eixosCand[id]!=null) S.cand.eixos[id]=sv(d.eixosCand[id],'user',1); });
    if(d.eixosEmp) EIXO_IDS.forEach(id=>{ if(d.eixosEmp[id]!=null) EMPRESAS.aurora.eixos[id]=sv(d.eixosEmp[id],'company',1); });
    reprojetarFonte(d.fonte||'user');
    return true;
  }catch(_){ return false; }
}
function limparTudo(){
  try{ localStorage.removeItem(CHAVE); }catch(_){}
  location.reload();
}
