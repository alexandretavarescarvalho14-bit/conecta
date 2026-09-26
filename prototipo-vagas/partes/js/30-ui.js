/* ══════════════════ COMPONENTES DE TELA ══════════════════ */

/* Link que o site atual já usa para falar com a equipe. */
const WHATS_EQUIPE = 'https://api.whatsapp.com/send?phone=558193914560&text=Ol%C3%A1,%20vim%20pelo%20site%20de%20vagas%20e%20gostaria%20de%20conhecer%20o%20apoio%20da%20mentoria%20de%20carreira';
const NUMERO_EQUIPE = '(81) 9391-4560';

const soDigitos = t => String(t || '').replace(/\D/g, '');
function linkWhats(numero, texto){
  const d = soDigitos(numero);
  return 'https://wa.me/' + (d.startsWith('55') ? d : '55' + d) + (texto ? '?text=' + encodeURIComponent(texto) : '');
}
function mascararWhats(v){
  const d = soDigitos(v).slice(0, 11);
  if(d.length <= 2) return d.length ? '(' + d : '';
  if(d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if(d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}
const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

function logoEmp(e, grande){
  const ini = e.n.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  return '<span class="emplogo' + (grande ? ' g' : '') + '" style="background:' + esc(e.c || '#189CCC') + '" aria-hidden="true">' + esc(ini) + '</span>';
}

function tempoRel(t){
  const d = Math.floor((Date.now() - new Date(t).getTime()) / DIA);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : 'há ' + d + ' dias';
}
const dataCurta = t => new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);

function pillStatus(ap){
  if(ap.status === 'reprovada') return '<span class="pill bl"><i></i>Encerrada</span>';
  if(ap.status === 'contratada') return '<span class="pill ok"><i></i>Contratada</span>';
  return '<span class="pill ' + (ap.etapa >= 3 ? 'ac' : 'n') + '">' + esc(ETAPAS[ap.etapa]) + '</span>';
}
const ST_VAGA = {publicada:['ok','Publicada'], rascunho:['n','Rascunho'], pausada:['al','Pausada'], encerrada:['bl','Encerrada']};
const pillVaga = st => '<span class="pill ' + ST_VAGA[st][0] + '"><i></i>' + ST_VAGA[st][1] + '</span>';

/* Barra de fit, só no lado da Conectaria. */
function barraFit(n){
  const cls = n >= 70 ? '' : n >= 50 ? ' medio' : ' baixo';
  return '<span class="fitb' + cls + '" title="Aderência ' + n + ' de 100"><span><i style="width:' + n + '%"></i></span><b>' + n + '</b></span>';
}

/* ── modal ──
   Reaproveita o #modal do corpo. confirm() e prompt() não existem dentro
   do Artifact, então toda confirmação é um modal desta página. */
const FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
let focoAntes = null;
function abrirModal(html){
  focoAntes = document.activeElement;
  $('#mbox').innerHTML = html;
  $('#scrim').classList.add('on'); $('#mbox').classList.add('on');
  $('#modal').setAttribute('aria-hidden', 'false');
  setTimeout(() => { const f = $('#mbox input, #mbox select, #mbox textarea') || $('#mbox button'); if(f) f.focus(); }, 60);
}
function fecharModal(){
  $('#scrim').classList.remove('on'); $('#mbox').classList.remove('on');
  $('#modal').setAttribute('aria-hidden', 'true');
  if(focoAntes && focoAntes.isConnected) focoAntes.focus();
}
function confirmar(titulo, texto, rotulo, acao, perigo){
  abrirModal('<h2 id="mTit">' + esc(titulo) + '</h2><p class="sub">' + texto + '</p>' +
    '<div class="form" style="gap:8px"><button class="btn w' + (perigo ? ' perigo' : '') + '" id="mOk">' + esc(rotulo) + '</button>' +
    '<button class="btn g w" id="mCancela">Cancelar</button></div>');
  $('#mCancela').onclick = fecharModal;
  $('#mOk').onclick = () => { fecharModal(); acao(); };
}
function prenderFoco(e){
  if(e.key !== 'Tab' || !$('#mbox').classList.contains('on')) return;
  const f = $$(FOCAVEIS, $('#mbox')).filter(x => x.offsetParent !== null);
  if(!f.length) return;
  const pri = f[0], ult = f[f.length - 1];
  if(e.shiftKey && document.activeElement === pri){ e.preventDefault(); ult.focus(); }
  else if(!e.shiftKey && document.activeElement === ult){ e.preventDefault(); pri.focus(); }
}

/* ── gaveta lateral (perfil do candidato no lado da Conectaria) ── */
let gavetaAberta = null;
function abrirGaveta(titulo, etiqueta, html, chave){
  gavetaAberta = chave || titulo;
  $('#drwTit').textContent = titulo;
  $('#drwId').textContent = etiqueta || '';
  $('#drwId').hidden = !etiqueta;
  $('#drwBody').innerHTML = html;
  $('#drw').classList.add('on'); $('#drw').setAttribute('aria-hidden', 'false');
  $('#drwX').focus();
}
function fecharGaveta(){
  gavetaAberta = null;
  $('#drw').classList.remove('on'); $('#drw').setAttribute('aria-hidden', 'true');
}

/* Perfil do candidato em blocos. Serve a gaveta do pipeline e a do banco
   de talentos: a Conectaria vê a mesma coisa nos dois lugares. */
function blocoContato(c, vaga){
  const msg = 'Olá, ' + c.nome.split(' ')[0] + '! Aqui é da Conectaria' +
    (vaga ? ', sobre a vaga de ' + vaga.titulo + '.' : '.');
  return '<div class="gv"><h4>Contato</h4>' +
    '<div class="linha"><span>WhatsApp</span><b class="sel">' + esc(c.whatsapp) + '</b></div>' +
    '<div class="linha"><span>E-mail</span><b class="sel">' + esc(c.email) + '</b></div>' +
    (c.linkedin ? '<div class="linha"><span>LinkedIn</span><b class="sel">' + esc(c.linkedin) + '</b></div>' : '') +
    '<div class="gvacoes"><a class="btn sm" href="' + esc(linkWhats(c.whatsapp, msg)) + '" target="_blank" rel="noopener">Chamar no WhatsApp</a>' +
    '<button class="btn g sm" data-copiar="' + esc(c.whatsapp) + '">Copiar número</button></div></div>';
}
function blocoPerfil(c){
  const cargos = (c.cargos || []).map(id => CARGO[id] ? CARGO[id].n : id);
  return '<div class="gv"><h4>Perfil</h4>' +
    (c.resumo ? '<p class="gvres">' + esc(c.resumo) + '</p>' : '') +
    '<div class="linha"><span>Área</span><b>' + esc(AREA[c.areaId] ? AREA[c.areaId].n : 'sem área') + '</b></div>' +
    '<div class="linha"><span>Cargos que busca</span><b>' + esc(cargos.join(', ') || 'não informado') + '</b></div>' +
    '<div class="linha"><span>Onde está</span><b>' + esc([c.cidade, c.uf].filter(Boolean).join(', ') || 'não informado') + '</b></div>' +
    '<div class="linha"><span>Modelos</span><b>' + esc((c.modelos || []).map(m => MODELO_ROT[m]).join(', ') || 'não informado') + '</b></div>' +
    '<div class="linha"><span>Pretensão</span><b>' + (c.pretensao ? brl(c.pretensao) : 'não informada') + '</b></div>' +
    '<div class="linha"><span>Experiência</span><b>' + (c.anos != null ? plural(c.anos, 'ano', 'anos') : 'não informada') + '</b></div>' +
    '<div class="linha"><span>Currículo</span><b>' + (c.cvNome ? esc(c.cvNome) : 'não enviado') + '</b></div>' +
    '<h4 style="margin-top:var(--s2)">Competências</h4>' +
    ((c.competencias || []).length
      ? '<div class="tags">' + c.competencias.map(k => '<span class="tag">' + esc(skillNome(k.skillId)) + ' · ' + NIVEIS[k.nivel - 1] + '</span>').join('') + '</div>'
      : '<p class="hint">Nenhuma declarada.</p>') +
    '</div>';
}
function blocoFit(rec, pesos){
  return '<div class="gv"><h4>Aderência à vaga</h4>' +
    '<div class="fitgrande">' + barraFit(rec.total) + selo(rec.desfecho) + '</div>' +
    '<div class="eixos">' +
      '<div class="eixo"><span class="n">Técnico <span style="color:var(--i34)">' + pc(rec.pesos ? rec.pesos.tecnico : pesos.tecnico) + '</span></span>' +
        '<span class="t"><i data-w="' + rec.tecnico + '"></i></span><span class="v">' + rec.tecnico + '</span></div>' +
      '<div class="eixo"><span class="n">Contexto <span style="color:var(--i34)">' + pc(rec.pesos ? rec.pesos.contexto : pesos.contexto) + '</span></span>' +
        '<span class="t"><i data-w="' + rec.contexto + '"></i></span><span class="v">' + rec.contexto + '</span></div>' +
    '</div>' +
    evidencias([...rec.tecnico_ev, ...rec.contexto_ev]) +
    '<p class="hint" style="margin-top:8px">Calculado ' + tempoRel(rec.geradoEm) + '. Técnico compara as competências com os requisitos da vaga; contexto compara local, modelo e, quando a vaga tem faixa, a pretensão.</p>' +
    '</div>';
}

async function copiar(txt){
  try{ await navigator.clipboard.writeText(txt); toast('Copiado: ' + txt); }
  catch(_){ toast('Não consegui copiar. Selecione o texto e copie manualmente.', I.al); }
}
