/* ══════════════════ 18 · TRIAGEM ══════════════════ */
const ROTEIRO = [
  {campo:'objetivo', rot:'objetivo.cargo_alvo', p:'Para começar, qual posição você está buscando agora?',
   ops:['Coordenador de RH','Analista de RH Sênior','Business Partner','Outra'],
   fixa:'Coordenador de RH'},
  {campo:'experiencia', rot:'experiencia.anos + setores[]',
   p:'Conta rapidamente sua trajetória. Onde você trabalhou e o que você fazia?',
   livre:'Trabalho com RH há 8 anos. Comecei em recrutamento numa indústria e nos últimos 5 anos estou em varejo, cuidando de seleção e avaliação de desempenho para uma rede de lojas.',
   fixa:'8 anos · varejo, indústria'},
  {campo:'competencias', rot:'competencias[] com evidência',
   p:'Do que você fez, o que você faria de novo com os olhos fechados?',
   ops:['Montar processo seletivo','Ciclo de avaliação','Clima e engajamento','Folha e admissão'],
   fixa:'Processo seletivo, avaliação de desempenho'},
  {campo:'cultura', rot:'cultura{14 eixos}',
   p:'E sobre ambiente: você rende mais onde o caminho já está definido, ou onde você precisa desenhar o caminho?',
   ops:['Prefiro desenhar o caminho','Um pouco dos dois','Prefiro caminho definido'],
   fixa:'autonomia alta, formalidade baixa'},
  {campo:'contexto', rot:'contexto{local, modelo, pretensao}',
   p:'Por último, o prático: onde você quer trabalhar e qual pretensão faz sentido?',
   ops:['Recife, presencial ou híbrido','Remoto Brasil','Tanto faz'],
   fixa:'Recife · presencial ou híbrido · R$ 9.500'},
];

function vTriagem(){
  S.passo=0; S.perfil={};
  $('#v-triagem').innerHTML=
  '<button class="volta" id="voltaT">'+I.volta+'Voltar</button>'+
  '<h1 style="font-size:var(--xxl);max-width:19ch">Cinco perguntas e seu perfil está montado.</h1>'+
  '<p style="color:var(--i72);max-width:58ch;margin-top:10px">Responda como você falaria '+
  'numa conversa, e acompanhe ao lado o perfil sendo montado. É ele que faz as vagas '+
  'chegarem até você depois.</p>'+
  '<div class="tri">'+
    '<div class="conversa"><div class="passos" id="passos">'+
      ROTEIRO.map(()=>'<i></i>').join('')+'</div>'+
      '<div class="msgs" id="msgs"></div>'+
      '<div class="entrada" id="entrada"></div></div>'+
    '<aside class="schema"><h4>'+I.spark+'Seu perfil, estruturado</h4>'+
      '<p class="sub">Cada resposta vira um campo que a busca consegue comparar, junto com a '+
      'origem dela. Enquanto vier da conversa, fica marcada como algo que você ainda '+
      'precisa confirmar.</p>'+
      '<div class="jf" id="jf">'+
        '<span class="k">perfil_candidato</span> <span class="p">{</span>'+
        ROTEIRO.map((r,i)=>'<span class="row pend" id="row'+i+'"><span class="k">'+
          r.rot.split(/[.{[ ]/)[0]+'</span><span class="p">:</span> '+
          '<span class="v" id="val'+i+'">aguardando</span><span class="p">,</span></span>').join('')+
        '<span class="row pend" id="row5"><span class="k">source</span><span class="p">:</span> '+
        '<span class="v" id="val5">aguardando</span></span>'+
        '<span class="p">}</span></div>'+
      '<div class="vetor"><span class="dots" id="dots" aria-hidden="true">'+
        Array.from({length:16},()=>'<i></i>').join('')+'</span>'+
        '<span id="vetorTxt">0 de 6 dimensões prontas</span></div>'+
    '</aside></div>';
  $('#voltaT').onclick=()=>ir(S.vaga?'vaga':'home', S.vaga);
  perguntar();
}
function msg(html, quem){
  const d=document.createElement('div'); d.className='m '+quem;
  d.innerHTML = quem==='bot'
    ? '<span class="ava" aria-hidden="true">'+I.spark+'</span><span class="txt">'+html+'</span>'
    : html;
  $('#msgs').appendChild(d); $('#msgs').scrollTop=1e6; return d;
}
async function perguntar(){
  const r=ROTEIRO[S.passo];
  $('#entrada').innerHTML='';
  const t=document.createElement('div'); t.className='m bot';
  t.innerHTML='<span class="ava" aria-hidden="true">'+I.spark+'</span>'+
    '<span class="digita"><i></i><i></i><i></i></span>';
  $('#msgs').appendChild(t); $('#msgs').scrollTop=1e6;
  await espera(680); t.remove();
  msg(esc(r.p),'bot');
  $$('#passos i').forEach((el,i)=>el.classList.toggle('on', i<=S.passo));
  if(r.ops){
    $('#entrada').innerHTML='<div class="opcoes">'+r.ops.map((o,i)=>
      '<button class="op" data-op="'+i+'">'+esc(o)+'</button>').join('')+'</div>';
    $$('[data-op]').forEach(b=>b.onclick=()=>responder(r.ops[Number(b.dataset.op)]));
  }else{
    $('#entrada').innerHTML='<div class="campoLivre">'+
      '<textarea id="livre" placeholder="Escreva como você falaria" aria-label="Sua resposta">'+
      esc(r.livre)+'</textarea>'+
      '<button class="btn envbt" id="env">Enviar</button></div>';
    $('#env').onclick=()=>responder($('#livre').value.trim()||r.livre);
  }
}
async function responder(txt){
  msg(esc(txt),'eu');
  $('#entrada').innerHTML='';
  const r=ROTEIRO[S.passo];
  S.perfil[r.campo]=txt;
  await espera(430);
  const row=$('#row'+S.passo), val=$('#val'+S.passo);
  row.classList.remove('pend'); row.classList.add('on');
  val.textContent='"'+r.fixa+'"';
  if(!reduz()) val.animate([{opacity:0,transform:'translateX(-6px)'},{opacity:1,transform:'none'}],
    {duration:420,easing:'cubic-bezier(.19,1,.22,1)'});
  const dots=$$('#dots i'), n=Math.round((S.passo+1)/6*16);
  dots.forEach((d,i)=>setTimeout(()=>d.classList.toggle('on',i<n), i*28));
  $('#vetorTxt').textContent=(S.passo+1)+' de 6 dimensões prontas';
  S.passo++;
  if(S.passo<ROTEIRO.length){ await espera(320); perguntar(); return; }

  await espera(400);
  $('#row5').classList.remove('pend'); $('#row5').classList.add('on');
  $('#val5').textContent='"conversation"';
  $$('#dots i').forEach((d,i)=>setTimeout(()=>d.classList.add('on'), i*28));
  $('#vetorTxt').textContent='6 de 6 dimensões prontas';
  $$('#passos i').forEach(el=>el.classList.add('on'));
  msg('Pronto, seu perfil está montado e já dá para comparar com qualquer vaga. Como ele '+
      'saiu desta conversa, vale você revisar antes: a empresa recebe seu perfil completo '+
      'depois que você confirmar.','bot');
  await espera(300);
  $('#entrada').innerHTML='<button class="btn w" id="fim">Revisar e confirmar meu perfil</button>';
  $('#fim').onclick=async ()=>{
    const b=$('#fim'); b.disabled=true;
    b.innerHTML='<span class="spin"></span>Extraindo etiquetas';
    await espera(680);
    S.cand.competencias=[['s01',3],['s02',3],['s06',2]].map(([skillId,n])=>
      ({skillId, nivel: sv(n,'conversation',.8)}));
    reprojetarFonte('conversation');
    ir('tags');
    toast('Extraí 4 etiquetas da sua conversa. Revise e confirme.');
  };
}
function candidatar(id, deTriagem){
  if(!S.candidaturas.some(c=>c.v===id))
    S.candidaturas.push({v:id, et:1, quando:'agora'});
  salvar(); ir('minhas');
  toast(deTriagem ? 'Perfil criado e candidatura enviada de uma vez.'
                  : 'Candidatura enviada com seu perfil já estruturado.');
}
