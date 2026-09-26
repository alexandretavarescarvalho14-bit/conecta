/* ══════════════════ DESCRIÇÃO DE VAGA POR IA ══════════════════
   Compartilhado entre o protótipo e o Conectaria Vagas (montar.py).

   "IA sugere, pessoa confirma" — a mesma regra da extração de currículo
   (16-extracao.js), do outro lado do match. Nada aqui chama serviço
   externo: é um rascunho por template a partir do que quem cadastra já
   preencheu, sempre editável antes de publicar. Trocar por um modelo de
   linguagem de verdade é mexer só nesta função.

   `extras` é opcional: {empresa, regime, requisitos:[nomes], obrigatorios:[nomes]}.
   Sem ele sai o parágrafo curto de sempre. */
const FAMILIA_ROTINA = {
  'Gente':       ['cuidar dos processos de pessoas do dia a dia', 'apoiar as lideranças em decisões de gente', 'acompanhar clima e retenção do time'],
  'Liderança':   ['liderar o time e distribuir a rotina entre as pessoas', 'reportar resultados e prioridades para a diretoria', 'desenvolver quem está no time'],
  'Tecnologia':  ['desenvolver e manter os sistemas em produção', 'participar do planejamento técnico do time', 'resolver problemas de performance e estabilidade'],
  'Marketing':   ['planejar e executar campanhas', 'acompanhar métricas de canal e ajustar investimento', 'alinhar a mensagem com o time comercial'],
  'Financeiro':  ['acompanhar os indicadores financeiros do mês', 'apoiar o fechamento e as conciliações', 'dar suporte a decisões de orçamento'],
  'Operações':   ['garantir que a operação rode dentro do padrão', 'acompanhar indicadores de produtividade e qualidade', 'resolver gargalos do dia a dia'],
  'Produto':     ['priorizar o backlog junto com o time', 'conduzir descoberta com usuários', 'acompanhar métricas de uso do produto'],
  'Atendimento': ['atender e resolver as demandas dos clientes', 'acompanhar indicadores de SLA e satisfação', 'escalar os casos fora do padrão'],
  'Vendas':      ['prospectar e qualificar oportunidades', 'conduzir negociações até o fechamento', 'acompanhar a carteira e a meta do mês'],
};
function gerarDescricaoVaga(cargo, local, familia, extras){
  const cidade = (local || '').split(',')[0].trim() || 'nossa unidade';
  const cargoTxt = (cargo || '').trim() || 'a posição';
  const [r1, r2, r3] = FAMILIA_ROTINA[familia] || FAMILIA_ROTINA['Operações'];
  const base = 'Buscamos ' + cargoTxt + ' para atuar em ' + cidade + '. No dia a dia, a pessoa vai ' +
    r1 + ', ' + r2 + ' e ' + r3 + '. Valorizamos quem já passou por rotina parecida e consegue ' +
    'propor melhoria sem esperar processo pronto.';
  if(!extras) return base;

  const partes = [];
  if(extras.empresa) partes.push('Sobre a empresa\n' + extras.empresa + ' está contratando e conta com a Conectaria para conduzir o processo.');
  partes.push('Sobre a vaga\n' + base);
  const obrig = extras.obrigatorios || [], desej = (extras.requisitos || []).filter(n => !obrig.includes(n));
  if(obrig.length || desej.length){
    partes.push('O que buscamos\n' +
      obrig.map(n => '- Experiência com ' + n.toLowerCase() + ' (obrigatório)').concat(
      desej.map(n => '- ' + n + ' é um diferencial')).join('\n'));
  }
  if(extras.regime) partes.push('Contratação\n' + extras.regime + '.');
  partes.push('Como funciona\nA Conectaria faz a primeira conversa com você e acompanha todas as etapas até a resposta final da empresa.');
  return partes.join('\n\n');
}
