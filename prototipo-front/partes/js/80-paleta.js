/* ══════════════════ 26 · PALETA DE COMANDOS ══════════════════ */
let cmdAberta=false, cmdSel=0, cmdItens=[];

function comandos(){
  const l=[];
  const navs = (S.modo==='emp'&&S.contaEmp)
    ? [['perfil','Perfil da empresa'],['evagas','Suas vagas'],['ecand','Candidaturas'],['edash','Dashboard']]
    : S.logado ? [['home','Vagas abertas'],['minhas','Minhas candidaturas'],['tags','Minhas etiquetas']]
    : [['home','Vagas abertas']];
  navs.forEach(([k,r])=>l.push({g:'Ir para', t:r, ic:I.ch, do:()=>ir(k)}));

  VAGAS.forEach(v=>{
    const m = S.logado ? M(v) : null;
    l.push({g:'Vagas', t:v.cargo, s:EMPRESAS[v.emp].n+' · '+v.local+(m?' · match '+m.total:''),
      ic:I.pin, do:()=>ir('vaga',v.id)});
  });

  if(S.logado){
    l.push({g:'Ações', t:'Comparar vagas selecionadas', s:S.comparar.length+' na seleção',
      ic:I.bal, do:()=>ir('comparar')});
    VAGAS.forEach(v=>l.push({g:'Ações', t:'Ver a conta · '+v.cargo, s:'como esta nota foi calculada',
      ic:I.doc, do:()=>{ir('vaga',v.id); setTimeout(()=>abrirTrace(v.id),300);}}));
  }
  l.push({g:'Ações', t:'Alternar tema claro e escuro', ic:I.esc, kb:'T', do:alternarTema});
  l.push({g:'Ações', t:'Reiniciar o protótipo', s:'apaga o que está salvo neste navegador',
    ic:I.x, do:limparTudo});
  if(S.logado||S.contaEmp) l.push({g:'Ações', t:'Sair da conta', ic:I.x, do:sair});
  else{
    l.push({g:'Ações', t:'Criar conta de candidato', ic:I.pes, do:()=>abrirAcesso('cand','criar')});
    l.push({g:'Ações', t:'Entrar como empresa', ic:I.pre, do:()=>abrirAcesso('emp','entrar')});
  }
  return l;
}
function filtraCmd(q){
  const t=q.trim().toLowerCase();
  const base=comandos();
  if(!t) return base;
  return base.filter(x=>(x.t+' '+(x.s||'')+' '+x.g).toLowerCase().includes(t));
}
function renderCmd(){
  const lst=$('#cmdLst');
  if(!cmdItens.length){
    lst.innerHTML='<div class="vazio">Nada encontrado. Tente o nome de uma vaga ou de uma tela.</div>';
    return;
  }
  let g=null, h='';
  cmdItens.forEach((x,i)=>{
    if(x.g!==g){ g=x.g; h+='<div class="gh">'+esc(g)+'</div>'; }
    h+='<button class="it" role="option" data-i="'+i+'" aria-selected="'+(i===cmdSel)+'">'+
      '<span class="ic">'+x.ic+'</span><span style="min-width:0"><b>'+esc(x.t)+'</b>'+
      (x.s?'<small>'+esc(x.s)+'</small>':'')+'</span>'+
      (x.kb?'<span class="kb">'+x.kb+'</span>':'')+'</button>';
  });
  lst.innerHTML=h;
  const at=$('.it[aria-selected=true]',lst);
  if(at) at.scrollIntoView({block:'nearest'});
}
function abrirCmd(){
  cmdAberta=true; cmdSel=0;
  const c=$('#cmdk'); c.classList.add('on'); c.setAttribute('aria-hidden','false');
  $('#cmdIn').value=''; cmdItens=filtraCmd(''); renderCmd();
  setTimeout(()=>$('#cmdIn').focus(),40);
}
function fecharCmd(){
  cmdAberta=false;
  const c=$('#cmdk'); c.classList.remove('on'); c.setAttribute('aria-hidden','true');
}
function executarCmd(i){
  const x=cmdItens[i]; if(!x) return;
  fecharCmd(); setTimeout(()=>x.do(),60);
}
