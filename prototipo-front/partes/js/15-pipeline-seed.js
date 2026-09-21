/* ══════════════════ 8c · SEMENTE DO PIPELINE ══════════════════

   Cada pessoa gerada em 14-pessoas.js já nasceu ancorada numa vaga: é
   essa vaga que ela "candidatou". Aqui a candidatura ganha etapa,
   status, histórico e o snapshot de recomendação.

   O fit vai CONGELADO em `rec`, não recalculado no render. Três motivos:
   o dashboard é histórico, e não pode se reescrever quando a empresa
   mexe num eixo depois; evita recalcular o motor a cada render de
   dashboard; e o Recommendation Trace é explicitamente imutável no
   contrato — mutar o número em cima quebraria a propriedade que o core
   inteiro sustenta. "Recalcular fit" (na tela da vaga) cria um `rec`
   novo e empurra o antigo para `recAnteriores`, nunca sobrescreve.

   Chamada de dentro de 99-boot.js, depois que PESSOAS e o motor (Mp)
   já existem — é inicialização entre módulos, e é para isso que o boot
   existe. */

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

/* Snapshot no formato do trace, sem passar pelo hash canônico: aqui é
   dado semeado para popular a demo, não uma chamada real à API. Usa
   Mp() para nunca duplicar a fórmula do motor — se o motor mudar, o
   snapshot muda junto no próximo boot. */
function montarRec(pessoa, vaga){
  const m = Mp(pessoa, vaga);
  return Object.freeze({
    total:m.total, tecnico:m.tecnico.nota, cultural:m.cultural.nota, contexto:m.contexto.nota,
    confidence:m.confidence, desfecho:m.desfecho, decisoes:m.decisoes,
    tecnico_ev:m.tecnico.evidencias, cultural_ev:m.cultural.evidencias, contexto_ev:m.contexto.evidencias,
    geradoEm: AGORA_DEMO.toISOString(),
  });
}

function gerarPipelineInicial(){
  const pipeline = [];
  for(const pessoa of PESSOAS){
    const v = VAGA[pessoa.vagaAncoraId];
    const r = prng(sementeDe('ap|' + pessoa.id));
    const rec = montarRec(pessoa, v);

    const etapa = etapaSorteada(r);
    // reprovação é mais provável quanto mais cedo a candidatura estacionou
    const chanceReprovar = [.42, .34, .24, .14, .05][etapa];
    let status = 'ativa', motivoId = null;
    if(r() < chanceReprovar){ status = 'reprovada'; motivoId = motivoPara(r, rec, etapa); }
    else if(etapa === ETAPAS.length - 1 && r() < .5){ status = 'contratada'; }

    // histórico: datas derivadas da âncora fixa AGORA_DEMO, nunca de
    // Date.now() — senão o funil muda de forma a cada reload
    const diasNaEtapaAtual = entre(r, 0, 6);
    const iniciouHa = entre(r, diasNaEtapaAtual + 3, diasNaEtapaAtual + 42);
    const historico = [{de:null, para:0, em:diasAtras(iniciouHa), quem:'candidato'}];
    let diaCursor = iniciouHa;
    for(let e = 1; e <= etapa; e++){
      diaCursor = Math.max(0, diaCursor - entre(r, 1, 8));
      historico.push({de:e - 1, para:e, em:diasAtras(diaCursor), quem:'empresa'});
    }
    if(status !== 'ativa'){
      diaCursor = Math.max(0, diaCursor - entre(r, 0, 3));
      historico.push({de:etapa, para:etapa, em:diasAtras(diaCursor), quem:'empresa', motivoId, status});
    }

    pipeline.push({
      id:'ap-' + pessoa.id, vagaId:v.id, pessoaId:pessoa.id,
      etapa, status, motivoId, nota:'', favorito: r() < .08,
      origem: pessoa.origem,
      criadaEm: diasAtras(iniciouHa), atualizadaEm: historico[historico.length - 1].em,
      historico, rec, recAnteriores: [],
    });
  }
  return pipeline;
}

/* ── ação única que muda estado de candidatura ──
   Toda mudança passa por aqui, e toda mudança empilha em `historico` —
   é de onde o funil do dashboard sai. */
function aplicar(ap, acao){
  const antes = ap.etapa, agora = new Date().toISOString();
  switch(acao.tipo){
    case 'avancar':  ap.etapa = Math.min(ETAPAS.length - 1, ap.etapa + 1); ap.status = 'ativa'; break;
    case 'voltar':   ap.etapa = Math.max(0, ap.etapa - 1); break;
    case 'reprovar':
      if(!MOTIVO[acao.motivoId]) throw new Error('motivo fora do vocabulário: ' + acao.motivoId);
      ap.status = 'reprovada'; ap.motivoId = acao.motivoId; ap.nota = acao.nota || '';
      break;
    case 'contratar': ap.status = 'contratada'; ap.etapa = ETAPAS.length - 1; break;
    case 'reabrir':   ap.status = 'ativa'; ap.motivoId = null; break;
    case 'favoritar': ap.favorito = !ap.favorito; break;
  }
  if(acao.tipo !== 'favoritar'){
    ap.historico.push({de:antes, para:ap.etapa, em:agora, quem:'empresa',
      ...(ap.motivoId ? {motivoId:ap.motivoId} : {}), status:ap.status});
  }
  ap.atualizadaEm = agora;
  salvar();
}

/* Recalcula o fit ao vivo e arquiva o anterior — nunca sobrescreve.
   É o que permite a tela mostrar "o fit caiu de 78 para 71 porque a
   empresa ajustou o eixo de presença". */
function recalcularFit(ap){
  const pessoa = PESSOA[ap.pessoaId], v = VAGA[ap.vagaId];
  const novo = montarRec(pessoa, v);
  if(novo.total === ap.rec.total && novo.desfecho === ap.rec.desfecho) return false;
  ap.recAnteriores.push(ap.rec);
  ap.rec = novo;
  ap.atualizadaEm = new Date().toISOString();
  salvar();
  return true;
}
