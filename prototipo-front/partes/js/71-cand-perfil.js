/* ══════════════════ 25 · ETIQUETAS E CONFIRMAÇÃO ══════════════════ */
function chipsSkill(){
  return S.cand.competencias.map(c=>
    '<span class="tk">'+esc(skillNome(c.skillId))+
    ' <button class="nvbt" data-niv="'+c.skillId+'" title="Nível" aria-label="Mudar nível de '+
    esc(skillNome(c.skillId))+', agora '+NIVEIS[c.nivel.value-1]+'">'+NIVEIS[c.nivel.value-1]+'</button>'+
    '<button data-rms="'+c.skillId+'" aria-label="Remover '+esc(skillNome(c.skillId))+'">'+I.x+
    '</button></span>').join('');
}

function vTags(){
  const tem = new Set(S.cand.competencias.map(c=>c.skillId));
  const disp = SKILLS.filter(k=>!tem.has(k.id));
  const n = S.cand.competencias.length;
  const conf = confiancaDe([...S.cand.competencias.map(c=>c.nivel),
    ...EIXO_IDS.map(id=>S.cand.eixos[id]), S.cand.uf, S.cand.modelos], POLITICA);
  const alcance = VAGAS.filter(v=>M(v).total>=60).length;
  const publicaveis = VAGAS.filter(v=>M(v).desfecho==='allow').length;

  $('#v-tags').innerHTML=
  '<h1 style="font-size:var(--xxl);max-width:21ch;margin-top:var(--s5)">O que fica indexado do seu perfil.</h1>'+
  '<p style="color:var(--i72);max-width:62ch;margin-top:10px">Você escolhe as competências '+
  'do mesmo catálogo que a empresa usa no anúncio. Assim dá para comparar o que a vaga '+
  'pede com o que você sabe fazer, sem depender de palavra-chave no currículo.</p>'+

  (S.cand.fonte!=='user'
    ? '<div class="confirma"><span class="ic">'+I.al+'</span>'+
      '<div style="flex:1;min-width:240px"><b>Falta você confirmar seu perfil</b>'+
      '<p>Ele foi montado a partir da conversa. Enquanto você não revisar, a empresa recebe '+
      'sua candidatura com a ressalva de que os dados ainda não passaram por você.</p></div>'+
      '<button class="btn" id="confirmaBt">Confirmar meu perfil</button></div>'
    : '<div class="confirma" style="background:var(--ok-bg);border-color:var(--ok)">'+
      '<span class="ic" style="background:var(--ok)">'+I.ok+'</span>'+
      '<div style="flex:1;min-width:240px"><b>Perfil confirmado</b>'+
      '<p>Suas candidaturas chegam completas para a empresa, com os dados que você mesmo '+
      'revisou.</p></div></div>')+

  '<div class="split" style="margin-top:var(--s4)"><div class="corpo">'+
    '<div class="grupoTag"><b>Suas competências</b>'+
      '<p class="hint">Clique no nível para alternar entre básico, intermediário e avançado. '+
      'O nível conta na aderência técnica.</p>'+
      '<div class="tagin" id="boxSkills">'+chipsSkill()+
        '<input id="buscaSkill" placeholder="'+(n?'Buscar outra':'Digite para buscar')+
        '" aria-label="Buscar competência" autocomplete="off"></div>'+
      '<div class="sugt" id="sugSkill">'+disp.slice(0,7).map(k=>
        '<button data-addk="'+k.id+'">+ '+esc(k.r)+'</button>').join('')+'</div></div>'+

    '<div class="grupoTag"><b>Origem dos seus dados</b>'+
      '<p class="hint">Dado que você confirmou vale mais do que dado que a plataforma deduziu. '+
      'Troque aqui para ver o efeito na hora: é o que impede a Conectaria de tratar uma '+
      'suposição como se fosse fato.</p>'+
      '<div class="opcoes">'+
        [['user','Confirmado por mim'],['conversation','Extraído da conversa'],
         ['document','Extraído do currículo']].map(([k,r])=>
          '<button class="op'+(S.cand.fonte===k?' on':'')+'" data-fonte="'+k+'" '+
          'aria-pressed="'+(S.cand.fonte===k)+'" style="'+
          (S.cand.fonte===k?'border-color:var(--ac3);color:var(--ac1);background:var(--veu2)':'')+
          '">'+r+'</button>').join('')+'</div>'+
      '<p class="hint" style="margin-top:10px">O peso de cada origem: confirmado por você '+
      'vale 1,0, extraído da conversa vale 0,82 e extraído de documento vale 0,7. Se a '+
      'confiança fica abaixo de '+POLITICA.confianca.revisar_abaixo_de+', a empresa recebe '+
      'sua candidatura com ressalva, e abaixo de '+POLITICA.confianca.minima_para_publicar+' '+
      'a plataforma segura até você confirmar.</p></div>'+

    '<div class="grupoTag"><b>Onde você rende melhor</b>'+
      '<p class="hint">Os mesmos catorze eixos que a empresa responde, com a pergunta espelhada. '+
      'É daqui que sai a aderência de ambiente. Mostrando os de menor tolerância, que são os que mais '+
      'mexem no resultado.</p>'+
      EIXOS.filter(e=>e.tolerancia<=22).map(e=>
        '<div class="slider"><div class="top"><b>'+esc(e.nome)+'</b><span id="cl-'+e.id+'"></span></div>'+
        '<input type="range" min="0" max="100" value="'+S.cand.eixos[e.id].value+'" data-ce="'+e.id+'" '+
        'aria-label="'+esc(e.nome)+'"><div class="polos"><span>'+esc(e.poloA)+'</span>'+
        '<span>'+esc(e.poloB)+'</span></div></div>').join('')+'</div>'+
    '<button class="btn" id="fimTags" style="margin-top:var(--s3)">Concluir meu perfil</button>'+

  '</div><aside class="lateral"><div class="box">'+
    '<h4>Efeito no seu alcance</h4>'+
    '<div class="linha"><span>Competências no catálogo</span><b>'+n+'</b></div>'+
    '<div class="linha"><span>Eixos respondidos</span><b>14 de 14</b></div>'+
    '<div class="linha"><span>Confiança do perfil</span><b id="lnConf">'+pc(conf)+'</b></div>'+
    '<div class="linha"><span>Vagas acima de 60%</span><b id="lnAlc">'+alcance+' de '+VAGAS.length+'</b></div>'+
    '<div class="linha"><span>Vagas onde seu perfil vai completo</span><b id="lnPub">'+publicaveis+' de '+VAGAS.length+'</b></div>'+
    '<div style="margin-top:var(--s2)">'+provenienciaSelo(S.cand.fonte)+'</div>'+
    '<p class="porque">Os números acima recalculam de verdade: rodam o mesmo motor que a vaga '+
    'usa. Tire uma competência obrigatória e veja o alcance cair; troque a origem do dado e '+
    'veja quantas vagas recebem seu perfil completo mudar.</p></div></aside></div>';

  const rotula=()=>EIXOS.filter(e=>e.tolerancia<=22).forEach(e=>{
    const v=S.cand.eixos[e.id].value;
    $('#cl-'+e.id).textContent = v<35?e.poloA:v>65?e.poloB:'equilibrado';});
  rotula();

  $$('[data-ce]').forEach(i=>i.oninput=e=>{
    const id=e.target.dataset.ce;
    S.cand.eixos[id]=sv(Number(e.target.value), S.cand.fonte,
      S.cand.fonte==='user'?1:S.cand.fonte==='conversation'?.85:.78);
    tocar(S.cand); rotula(); atualizarAlcance();});

  $$('[data-fonte]').forEach(b=>b.onclick=()=>{
    reprojetarFonte(b.dataset.fonte); salvar(); vTags();
    toast('Origem agora: '+FONTE_ROT[b.dataset.fonte]+'.');
  });

  const cb=$('#confirmaBt');
  if(cb) cb.onclick=async()=>{
    cb.disabled=true; cb.innerHTML='<span class="spin"></span>Confirmando';
    await espera(520); reprojetarFonte('user'); salvar(); vTags();
    toast('Perfil confirmado. Suas candidaturas passam completas para a empresa.');
  };

  $('#fimTags').onclick=async()=>{
    const b=$('#fimTags'); b.disabled=true; b.innerHTML='<span class="spin"></span>Salvando perfil';
    await espera(600); S.logado=true; salvar();
    if(S.vaga) candidatar(S.vaga,true);
    else { ir('home'); toast('Perfil pronto. Agora você vê sua aderência em cada vaga.'); }
  };
}
function atualizarAlcance(){
  const a=$('#lnAlc'); if(a) a.textContent=VAGAS.filter(v=>M(v).total>=60).length+' de '+VAGAS.length;
  const p=$('#lnPub'); if(p) p.textContent=VAGAS.filter(v=>M(v).desfecho==='allow').length+' de '+VAGAS.length;
  const c=$('#lnConf');
  if(c) c.textContent=pc(confiancaDe([...S.cand.competencias.map(x=>x.nivel),
    ...EIXO_IDS.map(id=>S.cand.eixos[id]), S.cand.uf, S.cand.modelos], POLITICA));
}
/* Redesenho cirúrgico: só os chips e as sugestões. Redesenhar a view
   inteira a cada tag fazia o input perder o foco, que era bug de UX. */
function repintarSkills(){
  const tem=new Set(S.cand.competencias.map(c=>c.skillId));
  const box=$('#boxSkills'), inp=$('#buscaSkill');
  if(!box) return;
  const foco = document.activeElement===inp, valor = inp ? inp.value : '';
  box.innerHTML = chipsSkill() + '<input id="buscaSkill" placeholder="Buscar outra" '+
    'aria-label="Buscar competência" autocomplete="off" value="'+esc(valor)+'">';
  $('#sugSkill').innerHTML = SKILLS.filter(k=>!tem.has(k.id) &&
      (!valor || k.r.toLowerCase().includes(valor.toLowerCase()))).slice(0,7)
    .map(k=>'<button data-addk="'+k.id+'">+ '+esc(k.r)+'</button>').join('')
    || '<span style="font-size:var(--xs);color:var(--i34)">Nada no catálogo com esse termo. '+
       'Escreva e a curadoria avalia incluir.</span>';
  const novo=$('#buscaSkill');
  if(foco && novo){ novo.focus(); novo.setSelectionRange(valor.length,valor.length); }
  tocar(S.cand); atualizarAlcance(); salvar();
}
