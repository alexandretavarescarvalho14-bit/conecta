/* ══════════════════ EMPRESAS E VAGAS DE PARTIDA ══════════════════

   Tiradas da vitrine pública atual (vagas.conectaria.com.br), para o
   teste abrir com o conteúdo que o João já opera, e não com empresa
   fictícia. Só o que está publicado no site entra aqui. Contato interno,
   CNPJ e observações ficam em branco: é a Conectaria quem preenche.

   `cargoId` liga a vaga à taxonomia. É dele que saem os requisitos
   iniciais e a família de peso. `dias` é há quanto tempo a vaga está no
   ar quando o teste começa. */

const EMPRESAS_SEED = [
  {id:'e-origo',  n:'Órigo Energia',          setor:'Energia solar',               cidade:'Atuação nacional',  c:'#D9822B'},
  {id:'e-trilha', n:'Trilha Certa Consultoria', setor:'Educação e consultoria',    cidade:'Carapicuíba, SP',   c:'#3D7A4A'},
  {id:'e-jah',    n:'JAH Açaí',               setor:'Alimentação · franquias',     cidade:'São Paulo, SP',     c:'#6B2A7A'},
  {id:'e-conect', n:'Conectaria',             setor:'Carreira e recrutamento',     cidade:'Recife, PE',        c:'#189CCC'},
  {id:'e-candida',n:'Cândida Galle',          setor:'Acabamentos para construção', cidade:'Gramado, RS',       c:'#8A6A4A'},
  {id:'e-nstech', n:'NS Tech',                setor:'Logística e gestão de risco', cidade:'Joinville, SC',     c:'#1F5E9E'},
  {id:'e-biz2',   n:'Biz2People',             setor:'Consultoria de TI',           cidade:'Lisboa, Portugal',  c:'#2E7D8F'},
  {id:'e-mb',     n:'MB Consultoria de RH',   setor:'Consultoria de RH',           cidade:'Recife, PE',        c:'#C0568A'},
  {id:'e-bf',     n:'BF Consultoria',         setor:'Seguros e benefícios',        cidade:'Rio de Janeiro, RJ', c:'#4A6FD8'},
  {id:'e-mpage',  n:'Michael Page',           setor:'Recrutamento especializado',  cidade:'Atuação nacional',  c:'#0E2233'},
];

/* [id, empresa, cargo, título, local, uf, modelo, regime, faixa, resumo, trabalhada pela Conectaria, dias] */
const VAGAS_SEED = [
  ['v-001','e-origo','c-ven-7','Consultor(a) de Vendas / Parceiro Comercial (PJ)','MG, PA, PE, BA e mais 5 estados','BR','hibrido','Comissionada, CLT ou PJ','Comissão sem teto',
    'Órigo Energia está em expansão e busca vendedores e parceiros comerciais para energia solar e mercado livre de energia.', false, 3],
  ['v-002','e-trilha','c-log-1','Estoquista','Extrema, MG','MG','presencial','CLT','A combinar',
    'Nova operação em Extrema/MG buscando quem quer iniciar ou crescer na área de logística.', false, 5],
  ['v-003','e-jah','c-ven-8','Representante de Desenvolvimento de Vendas (SDR)','Pinheiros, São Paulo (2x por semana)','SP','hibrido','CLT (PJ negociável)','A combinar',
    'Primeiro contato com candidatos a franqueados: qualificar leads e agendar reuniões para o time de Expansão.', true, 2],
  ['v-004','e-conect','c-mkt-6','Estagiário(a) de Marketing','Remoto','BR','remoto','Estágio, 6h por dia','Bolsa a combinar',
    'Apoiar a estratégia de conteúdo da Conectaria: redes sociais, roteiros, métricas e produção de conteúdo.', true, 1],
  ['v-005','e-jah','c-rh-4','Especialista de Gente & Gestão','São Paulo (sede) e Sorocaba (fábrica)','SP','hibrido','PJ, tempo integral','A combinar',
    'Atuação técnica em performance, talentos, people analytics e engajamento para a franqueadora e a rede.', true, 6],
  ['v-006','e-trilha','c-edu-1','Instrutor de Cursos Profissionalizantes','Carapicuíba, SP','SP','presencial','CLT','A combinar',
    'Tirar dúvidas de alunos sobre pacote Office e programação web básica. A empresa oferece formação antes do início.', false, 9],
  ['v-007','e-candida','c-ven-9','Vendedor(a) Interno e Externo','Gramado, RS','RS','presencial','CLT','A combinar',
    'Atuação consultiva em acabamentos para construção, aproximando relacionamentos com clientes e arquitetos.', false, 12],
  ['v-008','e-candida','c-ven-9','Vendedor(a) Interno e Externo','Taquara, RS','RS','presencial','CLT','A combinar',
    'Atuação consultiva em acabamentos para construção, aproximando relacionamentos com clientes e arquitetos.', false, 12],
  ['v-009','e-trilha','c-ven-7','Consultor(a) Comercial','Vila Dirce, Carapicuíba, SP','SP','presencial','CLT','A combinar',
    'Venda de cursos profissionalizantes por WhatsApp e presencialmente, com abordagem de leads já captados.', false, 8],
  ['v-010','e-nstech','c-log-2','Operador de Rastreamento Jr (12x36 diurno)','Joinville, SC','SC','presencial','CLT, escala 12x36 (6h às 18h)','A combinar',
    'Monitoramento de viagens, tratativa de sinistros e atendimento a clientes, parceiros e fornecedores.', false, 4],
  ['v-011','e-nstech','c-log-2','Operador de Rastreamento Jr (12x36 noturno)','Joinville, SC','SC','presencial','CLT, escala 12x36 (18h às 6h)','A combinar',
    'Monitoramento de viagens, tratativa de sinistros e atendimento a clientes, parceiros e fornecedores, no turno da noite.', false, 4],
  ['v-012','e-nstech','c-log-3','Auxiliar de Contas (6x1 diurno)','Extrema, MG','MG','presencial','CLT, escala 6x1 (6h às 14h20)','A combinar',
    'Atendimento ao cliente, suporte operacional e conferência de cadastros em operações logísticas.', false, 7],
  ['v-013','e-nstech','c-log-3','Auxiliar de Contas (6x1 diurno)','Concórdia, SC','SC','presencial','CLT, escala 6x1','A combinar',
    'Atendimento ao cliente e contato diário com motoristas e transportadores.', false, 10],
  ['v-014','e-biz2','c-tec-8','Consultor(a) SAP FICO','Lisboa, Portugal','EX','hibrido','Híbrido, sênior (5+ anos)','A combinar',
    'Implementação e suporte SAP FI e CO, com integração a MM, SD e PP.', false, 15],
  ['v-015','e-biz2','c-tec-8','SAP EWM Senior Consultant','Porto, Portugal','EX','hibrido','Híbrido, sênior (5 a 7 anos)','A combinar',
    'Implementação SAP em novos sites e migração de SAP WM para SAP EWM.', false, 15],
  ['v-016','e-biz2','c-tec-2','Senior Java Backend Developer','Porto, Portugal','EX','hibrido','Híbrido, sênior (5+ anos)','A combinar',
    'Serviços back-end com Java, Spring Boot, Spring Cloud, Kubernetes e OpenShift.', false, 18],
  ['v-017','e-biz2','c-tec-2','Java Sênior (remoto do Brasil)','Remoto, do Brasil para Lisboa','BR','remoto','Remoto, sênior (7+ anos), inglês B2','A combinar',
    'Java EE, JSF/Primefaces, JPA/Hibernate, EJB e CDI em cliente de Lisboa.', false, 18],
  ['v-018','e-biz2','c-tec-7','Tech Lead Java','Lisboa, Portugal','EX','hibrido','Híbrido, sênior (6+ anos)','A combinar',
    'Liderança técnica em Java, definição de arquitetura, modernização de sistemas e mentoria do time.', false, 20],
  ['v-019','e-mb','c-ven-6','Gerente Comercial','Recife, PE','PE','presencial','CLT','A combinar',
    'Liderar a equipe comercial, acompanhar indicadores e impulsionar vendas presenciais e online.', true, 6],
  ['v-020','e-mb','c-sau-2','Biomédica(o) Esteta','Recife, PE','PE','presencial','PJ','A combinar',
    'Avaliações estéticas, planos de tratamento personalizados e atuação consultiva em procedimentos.', true, 11],
  ['v-021','e-mb','c-sau-1','Esteticista','Recife, PE','PE','presencial','PJ','A combinar',
    'Procedimentos estéticos faciais e corporais, com atuação consultiva e vendas durante os atendimentos.', true, 11],
  ['v-022','e-mb','c-sau-3','Aplicador(a) de Laser','Recife, PE','PE','presencial','PJ','A combinar',
    'Aplicação de procedimentos a laser, orientação de clientes e identificação de oportunidades de venda.', true, 11],
  ['v-023','e-bf','c-ven-2','Analista Comercial','Centro, Rio de Janeiro','RJ','presencial','CLT, presencial','A combinar',
    'Cotação e negociação com operadoras de planos de saúde, odontológicos e seguros de vida em grupo.', false, 14],
  ['v-024','e-mpage','c-ven-6','Gerente de Vendas, Loja de Alto Padrão','Recife, PE','PE','presencial','Efetivo (CLT)','A combinar',
    'Coordenação comercial e administrativa de loja de alto padrão em arquitetura e construção civil.', false, 9],
  ['v-025','e-mpage','c-eng-1','Gerente de Engenharia','Recife, PE','PE','presencial','Efetivo (CLT)','A combinar',
    'Gestão do ciclo completo de empreendimentos, coordenando construtoras, projetistas e fornecedores.', false, 13],
  ['v-026','e-mpage','c-eng-2','Supervisor Administrativo de Planta','Manaus, AM','AM','presencial','Efetivo (CLT)','A combinar',
    'Gestão administrativa de planta industrial, integrando Produção, Qualidade, Compras, Finanças e RH.', false, 16],
  ['v-027','e-mpage','c-ate-5','Gerente de Serviço ao Cliente (Pós-vendas/SAC)','Manaus, AM','AM','presencial','PJ','A combinar',
    'Liderança da jornada de atendimento, estruturando processos, SLAs, CRM e indicadores de performance.', false, 16],
];

/* Requisitos iniciais pelo cargo: as primeiras atividades típicas, com a
   primeira obrigatória. Quem publica ajusta na tela da vaga. */
function requisitosDoCargo(cargoId){
  const c = CARGO[cargoId]; if(!c) return [];
  const pesos = [3, 2, 2, 1];
  return c.sk.slice(0, 4).map((skillId, i) => ({skillId, peso:pesos[i], obrigatorio:i === 0}));
}

/* Maior valor em reais citado na faixa, para comparar com a pretensão.
   "A combinar" não tem número, e aí a pretensão simplesmente não entra
   no cálculo em vez de penalizar alguém por uma faixa que não existe. */
function tetoDaFaixa(txt){
  const nums = (String(txt || '').match(/\d[\d.]*/g) || [])
    .map(n => Number(n.replace(/\./g, ''))).filter(n => n >= 500);
  return nums.length ? Math.max(...nums) : null;
}
