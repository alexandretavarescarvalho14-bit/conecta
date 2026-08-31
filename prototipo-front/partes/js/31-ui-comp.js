/* ══════════════════ 11 · COMPONENTES ══════════════════ */

/* Medidor: anel externo é a nota, arco interno é a confiança. Duas
   informações que a plataforma nunca deve mostrar separadas, porque nota
   alta com confiança baixa é exatamente o caso que engana.             */
const R_NOTA=44, R_CONF=35;
const C_NOTA=2*Math.PI*R_NOTA, C_CONF=2*Math.PI*R_CONF;

function medidor(p, conf, grande){
  if(!S.logado) return '<span class="lockw"><span class="lock" title="Crie sua conta para ver">'+
    I.cad+'</span><small>aderência</small></span>';
  const est = p>=70 ? '' : p>=50 ? 'baixa' : 'blk';
  return '<span class="medw"><span class="med '+(grande?'g ':'')+est+'" data-p="'+p+'" data-c="'+
    conf.toFixed(4)+'" style="--circ:'+C_NOTA.toFixed(2)+';--circ2:'+C_CONF.toFixed(2)+'" '+
    'title="Aderência '+p+' de 100. O arco interno é a confiança do dado: '+pc(conf)+'." '+
    'role="img" aria-label="Aderência '+p+' de 100, confiança do dado '+pc(conf)+'">'+
    '<svg viewBox="0 0 100 100" aria-hidden="true">'+
      '<circle class="tr" cx="50" cy="50" r="'+R_NOTA+'"/>'+
      '<circle class="pr" cx="50" cy="50" r="'+R_NOTA+'"/>'+
      '<circle class="cf" cx="50" cy="50" r="'+R_CONF+'"/>'+
    '</svg><b data-n="'+p+'">0</b></span>'+
    '<small>'+(conf < POLITICA.confianca.revisar_abaixo_de ? 'match estimado' : 'match')+
    '</small></span>';
}

function contar(el, alvo){
  if(reduz()){ el.textContent=alvo; return; }
  const t0=performance.now(), dur=750;
  // Rede de segurança: requestAnimationFrame não roda em aba de segundo
  // plano. Sem isto, quem abre o link numa aba que não está à frente vê
  // "0 vagas" congelado até trocar de aba. O número correto vale mais que
  // a animação.
  const rede = setTimeout(() => { el.textContent = alvo; }, 1400);
  const passo = t => {
    const k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(alvo * eased);
    if(k < 1) requestAnimationFrame(passo);
    else clearTimeout(rede);
  };
  requestAnimationFrame(passo);
}

function animaMed(){
  requestAnimationFrame(()=>$$('.med[data-p]').forEach((el,i)=>setTimeout(()=>{
    const p=+el.dataset.p, c=+el.dataset.c;
    const pr=$('.pr',el), cf=$('.cf',el);
    if(pr) pr.style.strokeDashoffset = (C_NOTA*(1-p/100)).toFixed(2);
    if(cf) cf.style.strokeDashoffset = (C_CONF*(1-c)).toFixed(2);
    const b=$('b',el); if(b) contar(b,p);
  }, 90+i*70)));
}
function animaEixos(){
  requestAnimationFrame(()=>$$('.eixo .t i[data-w]').forEach((el,i)=>
    setTimeout(()=>{el.style.width=el.dataset.w+'%'}, 140+i*80)));
  requestAnimationFrame(()=>$$('.cbar i[data-w]').forEach((el,i)=>
    setTimeout(()=>{el.style.width=el.dataset.w+'%'}, 200+i*80)));
}

/* Evidência: nota nunca viaja sozinha. Cada afirmação carrega o código
   de razão e a feature que a originou, para a explicação ser auditável
   e não só simpática.                                                  */
const EV_IC = {strength:'✓', gap:'!', constraint:'×'};
function evidencias(list, limite){
  const l = limite ? list.slice(0,limite) : list;
  if(!l.length) return '';
  // --i alimenta o atraso em cascata: a lista já vem ordenada por peso,
  // então a cascata acompanha a ordem de importância em vez de contrariá-la
  return '<div class="evs">'+l.map((e,i)=>
    '<div class="ev '+e.kind+'" style="--i:'+Math.min(i,12)+'">'+
    '<span class="ei" aria-hidden="true">'+EV_IC[e.kind]+'</span>'+
    '<div><p>'+esc(e.humano)+'</p><code>'+esc(e.reasonCode)+' · '+esc(e.featureId)+'</code></div></div>'
  ).join('')+'</div>';
}

const selo = o => '<span class="gt '+o+'"><i></i>'+GATE_ROT[o]+'</span>';

function portao(m){
  return '<div class="gtbox">'+selo(m.desfecho)+
    '<ul>'+m.decisoes.map(d=>'<li>'+esc(RAZAO[d.reasonCode]||d.reasonCode)+'</li>').join('')+'</ul></div>';
}

const provenienciaSelo = f =>
  '<span class="prov '+f+'"><i></i>'+esc(FONTE_ROT[f]||f)+'</span>';

/* Radar: os 14 eixos de uma vez. Três barras dizem quanto; o radar diz
   onde. É a única leitura em que a forma da distância aparece inteira. */
function radar(cand, emp){
  const n=EIXOS.length, cx=120, cy=116, R=76;
  const ang = i => (Math.PI*2*i/n) - Math.PI/2;
  const pt = (i,v) => [cx+Math.cos(ang(i))*R*(v/100), cy+Math.sin(ang(i))*R*(v/100)];
  const poly = vals => vals.map((v,i)=>pt(i,v).map(x=>x.toFixed(1)).join(',')).join(' ');

  const vc = EIXOS.map(e=>cand[e.id].value);
  const ve = EIXOS.map(e=>emp[e.id].value);

  const aneis = [25,50,75,100].map(r=>
    '<polygon class="malhaR" points="'+poly(EIXOS.map(()=>r))+'"/>').join('');
  const raios = EIXOS.map((e,i)=>{
    const [x,y]=pt(i,100);
    return '<line class="spoke" x1="'+cx+'" y1="'+cy+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'"/>';
  }).join('');
  const rots = EIXOS.map((e,i)=>{
    const [x,y]=pt(i,127);
    const a = Math.cos(ang(i));
    const anc = a>0.25?'start':a<-0.25?'end':'middle';
    return '<text class="lbl" x="'+x.toFixed(1)+'" y="'+(y+2.5).toFixed(1)+'" text-anchor="'+anc+'">'+
      esc(e.curto)+'</text>';
  }).join('');
  const pontos = EIXOS.map((e,i)=>{
    const [x,y]=pt(i,vc[i]);
    const d=Math.abs(vc[i]-ve[i]);
    return '<circle class="dotp'+(d>e.tolerancia?' fora':'')+'" cx="'+x.toFixed(1)+'" cy="'+
      y.toFixed(1)+'" r="2" style="--i:'+i+'" data-eixo="'+e.id+'"/>';
  }).join('');

  return '<div class="radarw"><svg class="radar" viewBox="0 0 240 236" role="img" '+
    'aria-label="Radar comparando os 14 eixos do candidato com os da empresa">'+
    aneis+raios+
    '<polygon class="polE" points="'+poly(ve)+'"/>'+
    '<polygon class="polC" points="'+poly(vc)+'"/>'+
    pontos+rots+'</svg></div>'+
    '<div class="radarleg"><span><i></i>você</span><span><i class="e"></i>empresa</span>'+
    '<span style="color:var(--al)">● fora da tolerância</span></div>';
}

/* Sparkline para os KPIs: número sozinho não diz direção. */
function spark(vals){
  const w=120,h=26,max=Math.max(...vals),min=Math.min(...vals),amp=(max-min)||1;
  const px=(v,i)=>[ (i/(vals.length-1))*w, h-((v-min)/amp)*(h-4)-2 ];
  const d=vals.map((v,i)=>px(v,i).map(x=>x.toFixed(1)).join(',')).map((p,i)=>(i?'L':'M')+p).join(' ');
  const fim=px(vals[vals.length-1],vals.length-1);
  return '<svg class="spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true">'+
    '<path class="fill" d="'+d+' L'+w+','+h+' L0,'+h+' Z"/><path d="'+d+'"/>'+
    '<circle cx="'+fim[0].toFixed(1)+'" cy="'+fim[1].toFixed(1)+'" r="2.2"/></svg>';
}

/* Revelação escalonada na rolagem. Um observador só, reaproveitado. */
/* Revelação por rolagem.

   O estado inicial é aplicado AQUI, por JS, e nunca no CSS. A diferença
   não é estilística: com `opacity:0` no CSS, qualquer coisa que impeça o
   observador de rodar — script quebrado, navegador antigo, aba que o
   sistema congelou — entrega uma página em branco com o conteúdo todo
   presente no DOM. Já vi acontecer nesta peça.

   Por isso, além do observador, existe um prazo: passados 2,5s, o que
   ainda estiver escondido aparece de qualquer jeito. Animação não pode
   ser condição para o conteúdo existir. */
function mostrar(el){
  el.style.opacity = '';
  el.style.transform = '';
  el.classList.add('vis');
}
const io = ('IntersectionObserver' in window) ? new IntersectionObserver(ents=>{
  ents.forEach((en,i)=>{ if(en.isIntersecting){
    setTimeout(()=>mostrar(en.target), i*60);
    io.unobserve(en.target);
  }});
},{rootMargin:'0px 0px -40px 0px'}) : null;

function revelar(escopo){
  const alvos = $$('.rv:not(.vis)', escopo);
  if(!io || reduz()){ alvos.forEach(mostrar); return; }
  alvos.forEach(el=>{
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    io.observe(el);
  });
  setTimeout(()=>alvos.forEach(el=>{ if(!el.classList.contains('vis')) mostrar(el); }), 2500);
}
