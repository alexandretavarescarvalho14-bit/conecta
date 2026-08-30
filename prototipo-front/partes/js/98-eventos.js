/* ══════════════════ 27 · DELEGAÇÃO DE EVENTOS ══════════════════
   Um listener no documento resolve por data-attribute. Antes, cada render
   reatava dezenas de onclick, o que virava churn de listener a cada tecla. */
const ACOES = {
  v:  el => ir('vaga', Number(el.dataset.v)),
  sug: el => { S.q=el.dataset.sug; const q=$('#q'); if(q) q.value=S.q; renderVagas(); },
  f:  el => { S.filtro=el.dataset.f;
        $$('[data-f]').forEach(x=>x.setAttribute('aria-pressed', x.dataset.f===S.filtro));
        renderVagas(); },
  cmp: el => {
        const id=Number(el.dataset.cmp);
        S.comparar = S.comparar.includes(id) ? S.comparar.filter(x=>x!==id)
          : S.comparar.length>=3 ? (toast('O comparador aceita três vagas por vez.',I.al), S.comparar)
          : [...S.comparar, id];
        salvar(); renderVagas(); },
  addk: el => { S.cand.competencias.push({skillId:el.dataset.addk,
          nivel: sv(2, S.cand.fonte, S.cand.fonte==='user'?1:.8)}); repintarSkills(); },
  rms:  el => { S.cand.competencias = S.cand.competencias.filter(c=>c.skillId!==el.dataset.rms);
          repintarSkills(); },
  niv:  el => { const it=S.cand.competencias.find(c=>c.skillId===el.dataset.niv);
          if(it){ it.nivel = sv(it.nivel.value%3+1, S.cand.fonte,
            S.cand.fonte==='user'?1:.8); repintarSkills(); } },
  ver:  el => ir('vaga', Number(el.dataset.ver)),
  trace: el => abrirTrace(Number(el.dataset.trace)),
};
document.addEventListener('click', e => {
  const it=e.target.closest('.cmdk .it');
  if(it){ executarCmd(Number(it.dataset.i)); return; }
  for(const chave in ACOES){
    const el = e.target.closest('[data-'+chave+']');
    if(el && document.contains(el)){ ACOES[chave](el); return; }
  }
});
document.addEventListener('input', e => {
  if(e.target.id==='buscaSkill') repintarSkills();
  if(e.target.id==='cmdIn'){ cmdSel=0; cmdItens=filtraCmd(e.target.value); renderCmd(); }
});
