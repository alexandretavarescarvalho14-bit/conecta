/* ══════════════════ BOOT ══════════════════
   Sempre por último. Confere os vínculos que falham em silêncio, carrega
   (ou semeia) o banco, liga os eventos globais e abre a primeira tela. */

/* Família errada cai no `_padrao` sem erro nenhum, e o número continua
   plausível. Por isso a conferência é aqui, alta, no carregamento. */
(function conferir(){
  const prob = [];
  for(const [fam, w] of Object.entries(POLITICA_VAGAS.pesos_por_familia)){
    if(Math.abs(w.tecnico + w.cultural + w.contexto - 1) > 1e-9) prob.push('pesos de ' + fam + ' não somam 1');
    if(w.cultural !== 0) prob.push('peso cultural de ' + fam + ' não é zero');
  }
  AREAS.forEach(a => { if(!(a.fam in POLITICA_VAGAS.pesos_por_familia)) prob.push('área ' + a.id + ' sem família válida'); });
  CARGOS.forEach(c => { if(!(familiaDe(c) in POLITICA_VAGAS.pesos_por_familia)) prob.push('cargo ' + c.id + ' sem família válida'); });
  CARGOS.forEach(c => c.sk.forEach(s => { if(!SKILL[s]) prob.push('cargo ' + c.id + ' cita skill inexistente ' + s); }));
  VAGAS_SEED.forEach(v => { if(!CARGO[v[2]]) prob.push('vaga ' + v[0] + ' com cargo inexistente'); if(!EMPRESAS_SEED.some(e => e.id === v[1])) prob.push('vaga ' + v[0] + ' com empresa inexistente'); });
  if(ETAPAS.length !== DIST_ETAPA.length) prob.push('ETAPAS e DIST_ETAPA com tamanhos diferentes');
  if(prob.length) console.error('[conectaria vagas] dados inconsistentes:\n  ' + prob.join('\n  '));
})();

if(!carregar()) semear();

document.addEventListener('click', e => {
  const ir_ = e.target.closest('[data-ir]');
  if(ir_ && document.contains(ir_)){ ir(ir_.dataset.ir, ir_.dataset.irarg); return; }
  const cp = e.target.closest('[data-copiar]');
  if(cp){ copiar(cp.dataset.copiar); return; }
  const pp = e.target.closest('[data-papel]');
  if(pp){ trocarPapel(pp.dataset.papel); return; }
});
document.addEventListener('keydown', e => {
  prenderFoco(e);
  if(e.key !== 'Escape') return;
  if($('#mbox').classList.contains('on')) fecharModal();
  else if($('#drw').classList.contains('on')) fecharGaveta();
});
$('#scrim').onclick = fecharModal;
$('#drwX').onclick = fecharGaveta;
$('#btTema').onclick = alternarTema;
$('#btReset').onclick = recomecar;
addEventListener('resize', debounce(marcarRolaveis, 200), {passive:true});

ir(S.papel === 'admin' ? 'painel' : 'vagas');
