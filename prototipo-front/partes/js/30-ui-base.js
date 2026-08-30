/* ══════════════════ 10 · HELPERS ══════════════════ */
const $ = (s,r) => (r||document).querySelector(s);
const $$ = (s,r) => [...(r||document).querySelectorAll(s)];
const esc = t => String(t).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const espera = ms => new Promise(r=>setTimeout(r,ms));
const pc = n => Math.round(n*100)+'%';
const brl = n => 'R$ '+Number(n).toLocaleString('pt-BR');
function debounce(fn,ms){ let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}; }
const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let tT;
function toast(t, ic2){
  const a=$('#toast');
  a.innerHTML=(ic2||I.ok)+'<span>'+esc(t)+'</span>';
  a.classList.add('on');
  clearTimeout(tT); tT=setTimeout(()=>a.classList.remove('on'), 4200);
}

const I = {
  ok:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 7"/></svg>',
  lupa:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  pin:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  volta:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M14 6l-6 6 6 6"/></svg>',
  spark:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
  gg:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">'+
    '<path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z"/>'+
    '<path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21 7.6 23.5 12 23.5Z"/>'+
    '<path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z"/>'+
    '<path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15.1.5 12 .5 7.6.5 3.7 3 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1Z"/></svg>',
  li:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+
    '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05a4.2 4.2 0 0 1 3.75-2c4 0 4.75 2.6 4.75 6V21h-4v-5.4c0-1.3 0-3-1.85-3s-2.15 1.4-2.15 2.9V21h-4V9Z"/></svg>',
  pes:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.8 3.4-6.3 7.5-6.3s7.5 2.5 7.5 6.3"/></svg>',
  pre:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9.5 11h1M13.5 11h1M9.5 15h1M13.5 15h1"/></svg>',
  ch:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  cad:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  x:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  vazio:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/></svg>',
  doc:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  bal:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M12 4v16M5 8h14M7 8l-3 6h6l-3-6ZM17 8l-3 6h6l-3-6Z"/></svg>',
  esc:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/></svg>',
  al:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 8.5v5M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>',
  /* ícones da barra de abas, desenhados no mesmo traço de 1.8 para não
     destoarem dos demais quando ficam lado a lado no rodapé */
  nvHome:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z"/><path d="M9.5 20.5v-6h5v6"/></svg>',
  nvMala:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7.5" width="18" height="12.5" rx="2.2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 13h18"/></svg>',
  nvTag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12.4V5.4a1.9 1.9 0 0 1 1.9-1.9h7l8.1 8.1a1.9 1.9 0 0 1 0 2.7l-5.4 5.4a1.9 1.9 0 0 1-2.7 0Z"/><circle cx="8.4" cy="8.4" r="1.5"/></svg>',
  nvPredio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9.5 11h1M13.5 11h1M9.5 15h1M13.5 15h1"/></svg>',
  nvLista:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/></svg>',
  nvPessoas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.3 2.9-5.4 6.5-5.4s6.5 2.1 6.5 5.4"/><path d="M17 4.4a3.2 3.2 0 0 1 0 6.2M18.5 14.9c2 .7 3.2 2.2 3.2 4.3"/></svg>',
  nvGraf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18"/><rect x="5" y="11" width="3.6" height="6" rx="1"/><rect x="10.2" y="7" width="3.6" height="10" rx="1"/><rect x="15.4" y="13" width="3.6" height="4" rx="1"/></svg>',
};
/* rótulos curtos e ícone por rota, para o rodapé do celular */
const NAV_ICONE = {home:['nvHome','Vagas'], minhas:['nvMala','Candidaturas'], tags:['nvTag','Perfil'],
  perfil:['nvPredio','Perfil'], evagas:['nvLista','Vagas'], ecand:['nvPessoas','Pessoas'],
  edash:['nvGraf','Painel']};

function logo(k){
  const e=EMPRESAS[k];
  return '<span class="emplogo" style="background:'+e.c+'" aria-hidden="true">'+
    e.n.split(' ').slice(0,2).map(x=>x[0]).join('')+'</span>';
}

let _malha=null;
function malha(){
  if(_malha) return _malha;
  const pts=[]; for(let i=0;i<26;i++) pts.push([Math.random()*1200, Math.random()*420]);
  let l='';
  pts.forEach((a,i)=>pts.forEach((b,j)=>{ if(j<=i) return;
    const d=Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(d<178) l+='<line x1="'+a[0].toFixed(0)+'" y1="'+a[1].toFixed(0)+'" x2="'+b[0].toFixed(0)+
      '" y2="'+b[1].toFixed(0)+'" stroke="currentColor" stroke-width="1" opacity="'+
      (0.3-d/700).toFixed(2)+'"/>';}));
  const c=pts.map(p=>'<circle cx="'+p[0].toFixed(0)+'" cy="'+p[1].toFixed(0)+'" r="'+
    (1.8+Math.random()*2).toFixed(1)+'" fill="currentColor" opacity="'+
    (0.22+Math.random()*0.3).toFixed(2)+'"/>').join('');
  _malha='<svg class="malha" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" '+
    'style="color:var(--ac3)" aria-hidden="true">'+l+c+'</svg>';
  return _malha;
}
