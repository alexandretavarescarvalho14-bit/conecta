/* ══════════════════ 27 · DELEGAÇÃO DE EVENTOS ══════════════════
   Um listener no documento resolve por data-attribute. Antes, cada render
   reatava dezenas de onclick, o que virava churn de listener a cada tecla. */
const ACOES = {
  v:  el => ir('vaga', Number(el.dataset.v)),
  sug: el => { S.q=el.dataset.sug; const q=$('#q'); if(q) q.value=S.q; renderVagas(); },
  tira: el => { const [fid,v]=el.dataset.tira.split('|');
        S.filtros[fid]=S.filtros[fid].filter(x=>x!==v); renderVagas(); },
  flimpa: el => { S.filtros[el.dataset.flimpa]=[]; renderVagas(); },
  tirafiltro: el => { S.filtros[el.dataset.tirafiltro]=[]; renderVagas(); },
  zerar: () => { FILTROS.forEach(f=>S.filtros[f.id]=[]); S.q=''; S.local='';
        const q=$('#q'), l=$('#loc'); if(q) q.value=''; if(l) l.value=''; renderVagas(); },
  limpaq: () => { S.q=''; const q=$('#q'); if(q) q.value=''; renderVagas(); },
  limpal: () => { S.local=''; const l=$('#loc'); if(l) l.value=''; renderVagas(); },
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
  irtags: () => ir('tags'),
  retentar: el => ir(el.dataset.retentar),
  irhome: () => ir('home'),
};
/* Popovers de filtro: um aberto por vez, fecha ao clicar fora e no Esc.
   O clique dentro do painel não fecha, senão marcar duas caixas obrigaria
   a reabrir a cada vez. */
function fecharPops(exceto){
  $$('.filtro.aberto').forEach(f=>{
    if(f===exceto) return;
    f.classList.remove('aberto');
    const b=$('.fbt',f); if(b) b.setAttribute('aria-expanded','false');
  });
}
document.addEventListener('click', e => {
  const bt = e.target.closest('.fbt');
  if(bt){
    const f = bt.closest('.filtro'), abrindo = !f.classList.contains('aberto');
    fecharPops(f);
    f.classList.toggle('aberto', abrindo);
    bt.setAttribute('aria-expanded', String(abrindo));
    return;
  }
  if(!e.target.closest('.fpop')) fecharPops();

  const it=e.target.closest('.cmdk .it');
  if(it){ executarCmd(Number(it.dataset.i)); return; }
  for(const chave in ACOES){
    const el = e.target.closest('[data-'+chave+']');
    if(el && document.contains(el)){ ACOES[chave](el); return; }
  }
});
document.addEventListener('change', e => {
  const fop = e.target.closest('[data-fop]');
  if(fop){
    const fid = fop.dataset.fop, v = fop.value;
    S.filtros[fid] = fop.checked
      ? [...S.filtros[fid], v]
      : S.filtros[fid].filter(x=>x!==v);
    // reabre o mesmo painel depois do render, para dar para marcar várias
    renderVagas();
    const f = $('[data-pop="'+fid+'"]');
    if(f){ f.classList.add('aberto'); $('.fbt',f).setAttribute('aria-expanded','true'); }
    return;
  }
  const ford = e.target.closest('[data-ford]');
  if(ford){ S.ordem = ford.dataset.ford; fecharPops(); renderVagas(); }
});

document.addEventListener('input', e => {
  if(e.target.id==='buscaSkill') repintarSkills();
  if(e.target.id==='cmdIn'){ cmdSel=0; cmdItens=filtraCmd(e.target.value); renderCmd(); }
});
