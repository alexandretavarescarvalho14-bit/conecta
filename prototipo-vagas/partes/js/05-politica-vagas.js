/* ═══════════════════════════════════════════════════════════════════════
   Conectaria Vagas · versão de teste

   Versão operada pela Conectaria: ela cadastra as empresas, publica as
   vagas e acompanha cada candidatura. Não há login de empresa. O
   candidato se cadastra com a qualificação de currículo enxuta e se
   candidata com um clique. O match existe, mas só a Conectaria vê.

   Este arquivo é um HTML de teste: tudo fica no navegador de quem abre,
   e a troca "Candidato / Conectaria" no topo existe para dar para testar
   os dois lados sem backend. A versão real (React + Supabase) segue o
   plano em conectaria-vagas/, e esta página é a especificação visual dela.
   ═══════════════════════════════════════════════════════════════════════ */

/* ══════════════════ POLÍTICA DA VERSÃO OPERADA ══════════════════

   Derivada da política publicada no core (POLITICA, injetada pelo build),
   nunca escrita à mão. A única diferença é o peso cultural: zero.

   Motivo: nesta versão nem a empresa nem o candidato preenchem os 14
   eixos de ambiente. Com eixo neutro dos dois lados o fit cultural daria
   100 para todo mundo e inflaria o total sem dizer nada. Técnico e
   contexto são renormalizados para somar 1, mantendo a proporção entre
   eles que cada família já tinha. A validação do core aceita isso: só
   exige que a soma seja 1. */
const POLITICA_VAGAS = Object.freeze({
  ...POLITICA,
  policy_version: 'policy-vagas-' + POLITICA.policy_version.replace(/^policy-/, ''),
  pesos_por_familia: Object.freeze(Object.fromEntries(
    Object.entries(POLITICA.pesos_por_familia).map(([fam, w]) => {
      const t = Math.round(w.tecnico / (w.tecnico + w.contexto) * 100) / 100;
      return [fam, Object.freeze({tecnico: t, cultural: 0, contexto: Math.round((1 - t) * 100) / 100})];
    }))),
});
