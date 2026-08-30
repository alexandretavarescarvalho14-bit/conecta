/* ═══════════════════════════════════════════════════════════════════════
   Conectaria · protótipo de plataforma

   O motor abaixo é porte fiel de packages/matching-core do conectaria-core.
   Mesma política, mesmas fórmulas, mesmos reasonCodes, mesmo portão. O que
   muda é só a superfície: aqui ele roda no navegador para dar preview, e no
   core roda como biblioteca pura com testes de propriedade em cima.

   Enquanto não existe API, este arquivo é a autoridade do cálculo. Quando
   POST /v1/recommendations:generate entrar, ele vira preview e o servidor
   passa a mandar o trace pronto. As assinaturas já estão no formato certo
   para essa troca não mexer na interface.
   ═══════════════════════════════════════════════════════════════════════ */

/* ══════════════════ 1 · POLÍTICA VERSIONADA ══════════════════

   O JSON abaixo NÃO é escrito à mão: montar.py o injeta lendo o arquivo
   publicado em conectaria-core/packages/recommendation-policy/policies/,
   na versão que POLITICA_ATUAL aponta.

   O motivo é o que a política existe para garantir. Front-end, API, job
   offline e avaliação histórica precisam ler exatamente os mesmos números;
   uma cópia manual aqui divergiria do core no primeiro ajuste e ninguém
   perceberia, porque o resultado continuaria plausível. Com a injeção, o
   protótipo não consegue discordar do motor.                             */

const POLITICA = Object.freeze(__POLITICA_JSON__);

/* Rótulo curto por eixo, só para caber nas pontas do radar. É apresentação,
   não política: por isso mora aqui e não no artefato versionado. */
const EIXO_CURTO = {
  ritmo:'Ritmo', autonomia:'Autonomia', formal:'Formal.', erro:'Erro',
  decisao:'Decisão', colab:'Colab.', previsib:'Previsib.', presenca:'Presença',
  interrup:'Interrup.', escopo:'Escopo', senior:'Senior.', espec:'Espec.',
  dados:'Dados', relacional:'Relac.',
};

const EIXOS = POLITICA.eixos.map(e => ({...e, curto: EIXO_CURTO[e.id] || e.nome}));
const EIXO = Object.fromEntries(EIXOS.map(e => [e.id, e]));
const EIXO_IDS = EIXOS.map(e => e.id);
const pesosDe = (pol, fam) => pol.pesos_por_familia[fam] || pol.pesos_por_familia._padrao;
