/* ══════════════════ 28 · NAVEGAÇÃO ══════════════════ */
const NAV={cand:[['home','Vagas'],['minhas','Minhas candidaturas'],['tags','Meu perfil']],
           emp:[['perfil','Perfil'],['evagas','Vagas'],['ecand','Candidaturas'],['edash','Dashboard']]};
const REND={home:vHome,vaga:vVaga,triagem:vTriagem,minhas:vMinhas,tags:vTags,
            perfil:vPerfil,evagas:vEvagas,ecand:vEcand,edash:vEdash,comparar:vComparar};
const PUBLICO=['home','vaga'];

function montarNav(){
  const itens = (S.modo==='emp' && S.contaEmp) ? NAV.emp
              : (S.modo==='cand' && S.logado) ? NAV.cand
              : [['home','Vagas']];
  $('#tnav').innerHTML=itens.map(([k,r])=>
    '<button data-n="'+k+'"'+(S.view===k?' aria-current="page"':'')+'>'+esc(r)+'</button>').join('');

  /* Barra de abas do celular. Abaixo de 900px a navegação do topo é
     escondida, e sem isto não havia como sair da lista de vagas no
     telefone. Com um item só ela não aparece: o topo já resolve. */
  const tb=$('#tabbar');
  if(itens.length>1){
    tb.hidden=false;
    tb.innerHTML=itens.map(([k])=>{
      const [ic,rot]=NAV_ICONE[k]||['nvHome',k];
      return '<button data-n="'+k+'"'+(S.view===k?' aria-current="page"':'')+'>'+
        I[ic]+'<span>'+esc(rot)+'</span></button>';
    }).join('');
  } else { tb.hidden=true; tb.innerHTML=''; }
  /* marca o corpo para o CSS reservar (ou não) o espaço do rodapé */
  document.body.classList.toggle('comAbas', itens.length>1);

  $$('[data-n]').forEach(b=>b.onclick=()=>ir(b.dataset.n));

  const logadoAlgum = S.logado || S.contaEmp;
  $('#tdir').innerHTML = logadoAlgum
    ? (S.logado && S.cand.fonte!=='user'
        ? '<span class="pill al" title="Perfil ainda apoiado em inferência">'+
          '<i></i>em revisão</span>' : '')+
      '<button class="btn g sm" id="sair">Sair</button>'+
      '<button class="av" id="avatar" aria-label="Sua conta">'+(S.modo==='emp'?'GA':'CR')+'</button>'
    : '<button class="btn g sm" id="btEntrar">Entrar</button>'+
      '<button class="btn sm" id="btCriar">Criar conta</button>';
  const e=$('#btEntrar'); if(e) e.onclick=()=>abrirAcesso('cand','entrar');
  const c=$('#btCriar'); if(c) c.onclick=()=>abrirAcesso('cand','criar');
  const sa=$('#sair'); if(sa) sa.onclick=sair;
  const av=$('#avatar'); if(av) av.onclick=()=>toast(S.modo==='emp'
    ? 'Grupo Aurora · plano Parceiro'
    : 'Perfil '+FONTE_ROT[S.cand.fonte]+'. Confiança '+
      pc(confiancaDe([...S.cand.competencias.map(x=>x.nivel),
        ...EIXO_IDS.map(id=>S.cand.eixos[id])], POLITICA))+'.');
}
/* Tabela que rola de lado precisa ser alcançável pelo teclado: sem
   tabindex, quem não usa mouse não chega nas colunas da direita. Só marca
   quando de fato transborda, para não criar parada de tab inútil. */
function marcarRolaveis(){
  $$('.tabw').forEach(el=>{
    if(el.scrollWidth > el.clientWidth + 1){
      el.tabIndex=0;
      el.setAttribute('role','region');
      if(!el.hasAttribute('aria-label')) el.setAttribute('aria-label','Tabela, role para os lados');
    } else {
      el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label');
    }
  });
}
/* a largura muda com a rotação do aparelho, então revisa ao redimensionar */
addEventListener('resize', debounce(marcarRolaveis, 200), {passive:true});

function sair(){
  S.logado=false; S.contaEmp=false; S.conta=null; S.modo='cand';
  S.candidaturas=[]; S.comparar=[]; S.vaga=null;
  S.cand=candidatoNovo('conversation');
  invalidarMatch();  // identidade trocada, não versionada: o cache inteiro sai
  salvar(); ir('home'); toast('Você saiu da conta.');
}

function ir(v,arg){
  if(!PUBLICO.includes(v) && !['triagem','tags'].includes(v)){
    const ehEmp=['perfil','evagas','ecand','edash'].includes(v);
    if(ehEmp && !S.contaEmp){ abrirAcesso('emp','entrar'); return; }
    if(!ehEmp && !S.logado){ abrirAcesso('cand','criar'); return; }
  }
  fecharTrace();
  S.view=v;
  $$('.view').forEach(x=>x.classList.remove('on'));
  $('#v-'+v).classList.add('on');
  REND[v](arg);
  montarNav(); marcarRolaveis(); salvar();
  window.scrollTo({top:0,behavior:'instant'});
  if(['vaga','triagem','tags','comparar'].includes(v)) $('#v-'+v).focus();
}
