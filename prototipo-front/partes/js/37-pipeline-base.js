/* ══════════════════ PIPELINE · BASE ══════════════════
   Compartilhado entre o protótipo e o Conectaria Vagas (montar.py).
   Depende de ETAPAS, MOTIVO/MOTIVOS_REJEICAO, escolher() e salvar(),
   que cada alvo define. */

const DIST_ETAPA = [.34, .27, .18, .13, .08]; // onde a candidatura "parou", acumulado
function etapaSorteada(r){
  let k = r(), acc = 0;
  for(let i = 0; i < DIST_ETAPA.length; i++){ acc += DIST_ETAPA[i]; if(k <= acc) return i; }
  return DIST_ETAPA.length - 1;
}
/* motivo mais plausível quando a reprovação acontece NAQUELA etapa */
const MOTIVOS_POR_ETAPA = {
  0: ['mr-req', 'mr-exp', 'mr-local', 'mr-modelo'],
  1: ['mr-req', 'mr-exp', 'mr-cultura', 'mr-pretensao'],
  2: ['mr-cultura', 'mr-nivel', 'mr-outro'],
  3: ['mr-outro', 'mr-congelada', 'mr-desistiu'],
  4: ['mr-desistiu', 'mr-semresp'],
};

/* Puxa o motivo alinhado ao que o motor já apontou boa parte das vezes:
   é o que dá sinal real ao widget "o motor já tinha avisado?" no
   dashboard. O resto sorteia do vocabulário fechado da etapa. */
function motivoPara(r, rec, etapa){
  const gap = [...rec.tecnico_ev, ...rec.cultural_ev, ...rec.contexto_ev].find(e => e.kind !== 'strength');
  if(gap && r() < .55){
    const alinhado = MOTIVOS_REJEICAO.find(m => m.eng === gap.reasonCode);
    if(alinhado) return alinhado.id;
  }
  return escolher(r, MOTIVOS_POR_ETAPA[etapa] || ['mr-outro']);
}

/* ── ação única que muda estado de candidatura ──
   Toda mudança passa por aqui, e toda mudança empilha em `historico` —
   é de onde o funil do painel sai. `quem` diz de onde partiu: 'empresa'
   no protótipo, 'conectaria' na versão operada pela Conectaria. */
function aplicar(ap, acao){
  const antes = ap.etapa, agora = new Date().toISOString();
  switch(acao.tipo){
    case 'avancar':  ap.etapa = Math.min(ETAPAS.length - 1, ap.etapa + 1); ap.status = 'ativa'; break;
    case 'voltar':   ap.etapa = Math.max(0, ap.etapa - 1); break;
    case 'mover':
      if(!(acao.etapa >= 0 && acao.etapa < ETAPAS.length)) throw new Error('etapa inválida: ' + acao.etapa);
      ap.etapa = acao.etapa; ap.status = 'ativa';
      break;
    case 'reprovar':
      if(!MOTIVO[acao.motivoId]) throw new Error('motivo fora do vocabulário: ' + acao.motivoId);
      ap.status = 'reprovada'; ap.motivoId = acao.motivoId; ap.nota = acao.nota || '';
      break;
    case 'contratar': ap.status = 'contratada'; ap.etapa = ETAPAS.length - 1; break;
    case 'reabrir':   ap.status = 'ativa'; ap.motivoId = null; break;
    case 'favoritar': ap.favorito = !ap.favorito; break;
    default: throw new Error('ação desconhecida: ' + acao.tipo);
  }
  if(acao.tipo !== 'favoritar'){
    ap.historico.push({de:antes, para:ap.etapa, em:agora, quem:acao.quem || 'empresa',
      ...(ap.motivoId ? {motivoId:ap.motivoId} : {}), status:ap.status});
  }
  ap.atualizadaEm = agora;
  salvar();
}
