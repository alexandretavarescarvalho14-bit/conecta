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

/* DIST_ETAPA, etapaSorteada, motivoPara e aplicar() moram em
   37-pipeline-base.js, compartilhado com o Conectaria Vagas. */

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
