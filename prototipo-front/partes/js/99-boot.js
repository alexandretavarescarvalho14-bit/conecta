/* ══════════════════ 29 · BOOT ══════════════════ */

/* Invariantes de dados.
   Todas cobrem a mesma classe de falha: dado incoerente que NÃO gera erro.
   Uma área cujo `fam` não existe na política cai no `_padrao` em silêncio —
   o número continua saindo, continua plausível, e está errado. Custa
   milissegundos conferir no carregamento e economiza uma tarde de dúvida. */
function conferirDados(){
  const p = [];
  const fam = POLITICA.pesos_por_familia;

  AREAS.filter(a => !(a.fam in fam))
    .forEach(a => p.push(`área "${a.n}" aponta família "${a.fam}", que não existe na política`));
  CARGOS.filter(c => !(familiaDe(c) in fam))
    .forEach(c => p.push(`cargo "${c.n}" resolve família "${familiaDe(c)}", inexistente`));
  CARGOS.filter(c => c.sk.some(id => !SKILL[id]))
    .forEach(c => p.push(`cargo "${c.n}" cita competência fora do catálogo`));
  VAGAS.filter(v => !(v.familia in fam))
    .forEach(v => p.push(`${v.vid} tem família "${v.familia}", inexistente`));
  VAGAS.filter(v => CARGO[v.cargoId] && v.familia !== familiaDe(CARGO[v.cargoId]))
    .forEach(v => p.push(`${v.vid} declara "${v.familia}" mas o cargo dá "${familiaDe(CARGO[v.cargoId])}"`));
  VAGAS.flatMap(v => v.requisitos.map(r => [v, r]))
    .filter(([, r]) => !SKILL[r.skillId] || ![1, 2, 3].includes(r.peso))
    .forEach(([v, r]) => p.push(`${v.vid} tem requisito inválido (${r.skillId}, peso ${r.peso})`));

  if(p.length){
    console.error('[conectaria] dados incoerentes:\n  ' + p.join('\n  '));
    toast(p.length + ' inconsistência(s) nos dados. Veja o console.', I.al);
  }
  return p;
}

renderDD();
$('#btAcesso').onclick=e=>{e.stopPropagation();S.ddAberto?fecharDD():abrirDD();};
$('#btTema').onclick=alternarTema;
$('#btCmd').onclick=abrirCmd;
$('#drwX').onclick=fecharTrace;
$('#supEmp').onclick=e=>{e.preventDefault();toast('Central de ajuda para empresas, em construção.');};
$('#supCand').onclick=e=>{e.preventDefault();toast('Central de ajuda para candidatos, em construção.');};
$('#scrim').onclick=fecharAcesso;
$('#cmdk').onclick=e=>{ if(e.target.id==='cmdk') fecharCmd(); };

if(/Mac|iPhone|iPad/.test(navigator.platform||'')) $('#kbdCmd').textContent='⌘ K';

document.addEventListener('click',e=>{
  if(S.ddAberto && !e.target.closest('.acesso')) fecharDD();});
addEventListener('scroll',()=>$('#topo').classList.toggle('stuck',scrollY>8),{passive:true});

addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){
    e.preventDefault(); cmdAberta?fecharCmd():abrirCmd(); return;
  }
  if(cmdAberta){
    if(e.key==='Escape'){ e.preventDefault(); fecharCmd(); return; }
    if(e.key==='ArrowDown'){ e.preventDefault(); cmdSel=Math.min(cmdSel+1,cmdItens.length-1); renderCmd(); return; }
    if(e.key==='ArrowUp'){ e.preventDefault(); cmdSel=Math.max(cmdSel-1,0); renderCmd(); return; }
    if(e.key==='Enter'){ e.preventDefault(); executarCmd(cmdSel); return; }
    return;
  }
  prenderFoco(e);
  if(e.key!=='Escape') return;
  if($('.filtro.aberto')) return fecharPops();
  if($('#mbox').classList.contains('on')) return fecharAcesso();
  if($('#drw').classList.contains('on')) return fecharTrace();
  if(S.ddAberto) return fecharDD();
  if(S.view==='vaga'||S.view==='triagem'||S.view==='comparar') ir('home');
});

conferirDados();

/* Semeia o pipeline da empresa aqui, não em 14/15: é inicialização entre
   módulos (PESSOAS de 14, Mp de 21), e essa mistura pertence ao boot.
   Precisa vir antes de restaurar(), que sobrepõe as mutações salvas
   (etapa, status, favorito) por cima desta base determinística. */
S.pipeline = gerarPipelineInicial();

const restaurou = restaurar();
ir('home');
if(restaurou) setTimeout(()=>toast('Retomei de onde você parou neste navegador.'),700);
