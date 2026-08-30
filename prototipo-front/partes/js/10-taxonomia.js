/* ══════════════════ 7 · TAXONOMIA DE CARREIRA ══════════════════

   Três níveis, e cada um existe por um motivo diferente:

   ÁREA    porta de entrada da triagem e recorte da busca. NÃO é feature:
           não entra no cálculo, não aparece na allowlist. Serve para
           navegar e para escolher o peso padrão.
   CARGO   é quem carrega a família de peso da política. Não é a área:
           "Gerente de Operações" pesa cultura como Liderança, "Analista
           de Operações" não. Peso de cargo é decisão de política.
   SKILL   a unidade que o motor compara. O candidato declara como
           atividade que já fez; a empresa declara como requisito da vaga.
           Mesmo id dos dois lados, senão o match não é comparável.

   Texto livre nunca pontua: duas grafias da mesma coisa degradam o match
   em silêncio, e silêncio é o pior modo de falhar. O que não está no
   catálogo vira sugestão para a curadoria, não competência.            */

/* ── áreas ──
   `fam` é a chave EXATA em POLITICA.pesos_por_familia. Duas traduções são
   deliberadas: RH responde pela família "Gente" e Finanças pela
   "Financeiro", que são os nomes que a política já usava antes das áreas
   existirem. Renomear aqui faz `pesosDe` cair no _padrao sem erro nenhum,
   por isso 99-boot.js valida esse vínculo no carregamento.              */
const AREAS = [
  {id:'operacoes',   n:'Operações',   fam:'Operações',   c:'#0C5F92'},
  {id:'financas',    n:'Finanças',    fam:'Financeiro',  c:'#B0741A'},
  {id:'rh',          n:'RH',          fam:'Gente',       c:'#1E8E6A'},
  {id:'vendas',      n:'Vendas',      fam:'Vendas',      c:'#C1443A'},
  {id:'marketing',   n:'Marketing',   fam:'Marketing',   c:'#D0559B'},
  {id:'tecnologia',  n:'Tecnologia',  fam:'Tecnologia',  c:'#8A4FBE'},
  {id:'produto',     n:'Produto',     fam:'Produto',     c:'#4A6FD8'},
  {id:'atendimento', n:'Atendimento', fam:'Atendimento', c:'#2E7D8F'},
];
const AREA = Object.fromEntries(AREAS.map(a=>[a.id,a]));

/* ── competências ──
   s01 a s12 são CONGELADAS em id e rótulo: o baseline do ADR 001 e as
   fixtures do core dependem delas. O catálogo só cresce.

   `a`  áreas onde a competência aparece na triagem
   `tr` transversal: aparece em toda área, independente do cargo
   `st` ativa | pendente (sugerida por candidato, aguarda curadoria)     */
const SKILLS = [
  // ── congeladas ──
  {id:'s01', r:'Processo seletivo',        a:['rh'],                  st:'ativa'},
  {id:'s02', r:'Avaliação de desempenho',  a:['rh'],                  st:'ativa'},
  {id:'s03', r:'Clima e engajamento',      a:['rh'],                  st:'ativa'},
  {id:'s04', r:'Folha e admissão',         a:['rh'],                  st:'ativa'},
  {id:'s05', r:'Treinamento e T&D',        a:['rh'],                  st:'ativa'},
  {id:'s06', r:'Operação de varejo',       a:['operacoes','vendas'],  st:'ativa'},
  {id:'s07', r:'Gestão de equipe',         a:[], tr:true,             st:'ativa'},
  {id:'s08', r:'Mídia paga',               a:['marketing'],           st:'ativa'},
  {id:'s09', r:'Análise de dados',         a:[], tr:true,             st:'ativa'},
  {id:'s10', r:'Conciliação financeira',   a:['financas'],            st:'ativa'},
  {id:'s11', r:'Negociação',               a:['vendas'],              st:'ativa'},
  {id:'s12', r:'Excel avançado',           a:[], tr:true,             st:'ativa'},
  // ── operações ──
  {id:'s13', r:'Gestão de estoque',            a:['operacoes'],       st:'ativa'},
  {id:'s14', r:'Logística e distribuição',     a:['operacoes'],       st:'ativa'},
  {id:'s15', r:'Planejamento de produção',     a:['operacoes'],       st:'ativa'},
  {id:'s16', r:'Compras e suprimentos',        a:['operacoes'],       st:'ativa'},
  {id:'s17', r:'Melhoria contínua',            a:['operacoes'],       st:'ativa'},
  {id:'s18', r:'Qualidade e auditoria',        a:['operacoes'],       st:'ativa'},
  {id:'s19', r:'Gestão de facilities',         a:['operacoes'],       st:'ativa'},
  // ── finanças ──
  {id:'s20', r:'Contas a pagar e receber',     a:['financas'],        st:'ativa'},
  {id:'s21', r:'Fluxo de caixa',               a:['financas'],        st:'ativa'},
  {id:'s22', r:'Fechamento contábil',          a:['financas'],        st:'ativa'},
  {id:'s23', r:'Planejamento financeiro',      a:['financas'],        st:'ativa'},
  {id:'s24', r:'Rotinas fiscais',              a:['financas'],        st:'ativa'},
  {id:'s25', r:'Precificação e margem',        a:['financas'],        st:'ativa'},
  // ── RH ──
  {id:'s26', r:'Cargos e salários',            a:['rh'],              st:'ativa'},
  {id:'s27', r:'Relações sindicais',           a:['rh'],              st:'ativa'},
  {id:'s28', r:'RH analytics',                 a:['rh'],              st:'ativa'},
  {id:'s29', r:'Employer branding',            a:['rh','marketing'],  st:'ativa'},
  // ── vendas ──
  {id:'s30', r:'Prospecção ativa',             a:['vendas'],          st:'ativa'},
  {id:'s31', r:'Gestão de carteira',           a:['vendas'],          st:'ativa'},
  {id:'s32', r:'Venda consultiva B2B',         a:['vendas'],          st:'ativa'},
  {id:'s33', r:'CRM e pipeline',               a:['vendas'],          st:'ativa'},
  {id:'s34', r:'Pós-venda e renovação',        a:['vendas','atendimento'], st:'ativa'},
  {id:'s35', r:'Venda em ponto de venda',      a:['vendas'],          st:'ativa'},
  // ── tecnologia ──
  {id:'s36', r:'Desenvolvimento backend',      a:['tecnologia'],      st:'ativa'},
  {id:'s37', r:'Desenvolvimento frontend',     a:['tecnologia'],      st:'ativa'},
  {id:'s38', r:'SQL e banco de dados',         a:['tecnologia'],      st:'ativa'},
  {id:'s39', r:'Cloud e infraestrutura',       a:['tecnologia'],      st:'ativa'},
  {id:'s40', r:'QA e testes',                  a:['tecnologia'],      st:'ativa'},
  {id:'s41', r:'Segurança da informação',      a:['tecnologia'],      st:'ativa'},
  {id:'s42', r:'Suporte de TI',                a:['tecnologia','atendimento'], st:'ativa'},
  // ── produto ──
  {id:'s43', r:'Discovery e pesquisa',         a:['produto'],         st:'ativa'},
  {id:'s44', r:'Roadmap e priorização',        a:['produto'],         st:'ativa'},
  {id:'s45', r:'Métricas de produto',          a:['produto'],         st:'ativa'},
  {id:'s46', r:'Design de fluxo',              a:['produto'],         st:'ativa'},
  {id:'s47', r:'Escrita de requisitos',        a:['produto'],         st:'ativa'},
  // ── atendimento ──
  {id:'s48', r:'Atendimento ao cliente',       a:['atendimento'],     st:'ativa'},
  {id:'s49', r:'Suporte técnico N1 e N2',      a:['atendimento'],     st:'ativa'},
  {id:'s50', r:'Gestão de SLA e filas',        a:['atendimento'],     st:'ativa'},
  {id:'s51', r:'Ouvidoria e reclamações',      a:['atendimento'],     st:'ativa'},
  // ── marketing ──
  {id:'s52', r:'Conteúdo e SEO',               a:['marketing'],       st:'ativa'},
  {id:'s53', r:'CRM e automação',              a:['marketing'],       st:'ativa'},
  {id:'s54', r:'Eventos e trade marketing',    a:['marketing'],       st:'ativa'},
  // ── transversais ──
  {id:'s55', r:'Gestão de orçamento',          a:[], tr:true,         st:'ativa'},
  {id:'s56', r:'Gestão de projetos',           a:[], tr:true,         st:'ativa'},
  {id:'s57', r:'Desenvolvimento de time',      a:[], tr:true,         st:'ativa'},
];
const SKILL = Object.fromEntries(SKILLS.map(s=>[s.id,s]));
const skillNome = id => (SKILL[id]||{r:id}).r;
const NIVEIS = ['básico','intermediário','avançado'];

/* ── cargos ──
   `sen`  junior | pleno | senior | lideranca
   `base` faixa salarial de referência; a vaga aplica um fator por empresa
   `sk`   atividades típicas. Serve os DOIS lados: alimenta o passo de
          atividades da triagem e o sorteio de requisitos do gerador de
          vagas. Uma lista só é o que mantém o match comparável.         */
const CARGOS = [
  // ── operações ──
  {id:'c-ope-1', a:'operacoes', n:'Assistente de Operações',    sen:'junior',    base:[2400,3200],   sk:['s13','s06','s12']},
  {id:'c-ope-2', a:'operacoes', n:'Analista de Operações',      sen:'pleno',     base:[4200,5600],   sk:['s13','s15','s17','s09','s12']},
  {id:'c-ope-3', a:'operacoes', n:'Analista de Logística',      sen:'pleno',     base:[4500,6000],   sk:['s14','s13','s16','s12']},
  {id:'c-ope-4', a:'operacoes', n:'Analista de Qualidade',      sen:'pleno',     base:[4300,5800],   sk:['s18','s17','s09']},
  {id:'c-ope-5', a:'operacoes', n:'Coordenador de Operações',   sen:'lideranca', base:[8000,10500],  sk:['s13','s17','s07','s56','s55']},
  {id:'c-ope-6', a:'operacoes', n:'Gerente de Operações',       sen:'lideranca', base:[13000,17000], sk:['s07','s55','s17','s56','s57']},
  // ── finanças ──
  {id:'c-fin-1', a:'financas', n:'Assistente Financeiro',       sen:'junior',    base:[2300,3000],   sk:['s20','s10','s12']},
  {id:'c-fin-2', a:'financas', n:'Analista Financeiro',         sen:'pleno',     base:[4400,5900],   sk:['s21','s10','s20','s12','s09']},
  {id:'c-fin-3', a:'financas', n:'Analista Contábil',           sen:'pleno',     base:[4600,6200],   sk:['s22','s24','s10','s12']},
  {id:'c-fin-4', a:'financas', n:'Analista de FP&A',            sen:'senior',    base:[7000,9500],   sk:['s23','s25','s09','s12','s55']},
  {id:'c-fin-5', a:'financas', n:'Coordenador Financeiro',      sen:'lideranca', base:[9500,12500],  sk:['s21','s23','s07','s55']},
  {id:'c-fin-6', a:'financas', n:'Controller',                  sen:'lideranca', base:[15000,20000], sk:['s22','s23','s55','s07','s24']},
  // ── RH ──
  {id:'c-rh-1',  a:'rh', n:'Assistente de RH',                  sen:'junior',    base:[2400,3100],   sk:['s04','s01','s12']},
  {id:'c-rh-2',  a:'rh', n:'Analista de Recrutamento',          sen:'pleno',     base:[4200,5600],   sk:['s01','s29','s28','s12']},
  {id:'c-rh-3',  a:'rh', n:'Analista de Desenvolvimento',       sen:'pleno',     base:[4500,6000],   sk:['s05','s02','s03']},
  {id:'c-rh-4',  a:'rh', n:'Business Partner de RH',            sen:'senior',    base:[7500,10000],  sk:['s02','s03','s26','s07']},
  // Coordenador de RH é 'senior', não 'lideranca': é o cargo da vaga do
  // ADR 001, cuja família tem de continuar sendo "Gente". Marcá-lo como
  // liderança mudaria os pesos para .32/.46/.22 e o baseline iria de 84
  // para 86 — o número que o core inteiro existe para travar.
  {id:'c-rh-5',  a:'rh', n:'Coordenador de RH',                 sen:'senior',    base:[9000,11000],  sk:['s01','s02','s06','s07','s03']},
  {id:'c-rh-6',  a:'rh', n:'Gerente de Gente e Gestão',         sen:'lideranca', base:[14000,18000], sk:['s07','s26','s02','s57','s55']},
  // ── vendas ──
  {id:'c-ven-1', a:'vendas', n:'Vendedor de Loja',              sen:'junior',    base:[2000,2800],   sk:['s35','s06','s48']},
  {id:'c-ven-2', a:'vendas', n:'Representante Comercial',       sen:'pleno',     base:[4000,6500],   sk:['s30','s11','s33']},
  {id:'c-ven-3', a:'vendas', n:'Executivo de Contas',           sen:'senior',    base:[7000,11000],  sk:['s32','s31','s11','s33']},
  {id:'c-ven-4', a:'vendas', n:'Analista de Customer Success',  sen:'pleno',     base:[4500,6200],   sk:['s34','s31','s33','s09']},
  {id:'c-ven-5', a:'vendas', n:'Coordenador Comercial',         sen:'lideranca', base:[9000,13000],  sk:['s31','s07','s33','s55']},
  {id:'c-ven-6', a:'vendas', n:'Gerente Comercial',             sen:'lideranca', base:[15000,21000], sk:['s07','s32','s55','s57','s11']},
  // ── marketing ──
  {id:'c-mkt-1', a:'marketing', n:'Assistente de Marketing',    sen:'junior',    base:[2600,3400],   sk:['s52','s08','s12']},
  {id:'c-mkt-2', a:'marketing', n:'Analista de Marketing',      sen:'pleno',     base:[4500,6500],   sk:['s08','s52','s53','s09']},
  {id:'c-mkt-3', a:'marketing', n:'Analista de Growth',         sen:'pleno',     base:[5500,8000],   sk:['s08','s09','s53','s45']},
  {id:'c-mkt-4', a:'marketing', n:'Analista de Eventos',        sen:'pleno',     base:[4000,5500],   sk:['s54','s56','s55']},
  {id:'c-mkt-5', a:'marketing', n:'Coordenador de Marketing',   sen:'lideranca', base:[9000,12500],  sk:['s08','s52','s07','s55']},
  // ── tecnologia ──
  {id:'c-tec-1', a:'tecnologia', n:'Pessoa Desenvolvedora Júnior',   sen:'junior',    base:[4000,6000],   sk:['s36','s38','s40']},
  {id:'c-tec-2', a:'tecnologia', n:'Pessoa Desenvolvedora Backend',  sen:'senior',    base:[12000,15000], sk:['s36','s38','s39','s09']},
  {id:'c-tec-3', a:'tecnologia', n:'Pessoa Desenvolvedora Frontend', sen:'pleno',     base:[8000,11000],  sk:['s37','s40','s46']},
  {id:'c-tec-4', a:'tecnologia', n:'Analista de Dados',              sen:'pleno',     base:[6500,9000],   sk:['s38','s09','s12','s45']},
  {id:'c-tec-5', a:'tecnologia', n:'Analista de Infraestrutura',     sen:'pleno',     base:[7000,9500],   sk:['s39','s41','s42']},
  {id:'c-tec-6', a:'tecnologia', n:'Analista de QA',                 sen:'pleno',     base:[6000,8500],   sk:['s40','s47','s38']},
  {id:'c-tec-7', a:'tecnologia', n:'Tech Lead',                      sen:'lideranca', base:[16000,22000], sk:['s36','s07','s39','s56','s57']},
  // ── produto ──
  {id:'c-pro-1', a:'produto', n:'Analista de Produto',          sen:'pleno',     base:[6000,8500],   sk:['s45','s47','s43','s09']},
  {id:'c-pro-2', a:'produto', n:'Product Owner',                sen:'pleno',     base:[8000,11000],  sk:['s44','s47','s56','s43']},
  {id:'c-pro-3', a:'produto', n:'Product Manager',              sen:'senior',    base:[12000,16000], sk:['s44','s43','s45','s46']},
  {id:'c-pro-4', a:'produto', n:'Pesquisador de Produto',       sen:'pleno',     base:[7000,9500],   sk:['s43','s46','s09']},
  {id:'c-pro-5', a:'produto', n:'Head de Produto',              sen:'lideranca', base:[18000,25000], sk:['s44','s07','s45','s57','s55']},
  // ── atendimento ──
  {id:'c-ate-1', a:'atendimento', n:'Atendente de Suporte',     sen:'junior',    base:[2000,2700],   sk:['s48','s49']},
  {id:'c-ate-2', a:'atendimento', n:'Analista de Suporte',      sen:'pleno',     base:[3600,5000],   sk:['s49','s42','s50']},
  {id:'c-ate-3', a:'atendimento', n:'Analista de Ouvidoria',    sen:'pleno',     base:[4000,5500],   sk:['s51','s48','s09']},
  {id:'c-ate-4', a:'atendimento', n:'Analista de Sucesso do Cliente', sen:'pleno', base:[4500,6200], sk:['s34','s48','s33']},
  {id:'c-ate-5', a:'atendimento', n:'Coordenador de Atendimento', sen:'lideranca', base:[7500,10000], sk:['s50','s07','s48','s55']},
];
const CARGO = Object.fromEntries(CARGOS.map(c=>[c.id,c]));

/* A família de peso vem do CARGO, não da área. Liderança pesa cultura mais
   alto em qualquer área, e é isso que faz "Gerente de Operações" e
   "Analista de Operações" não serem avaliados com a mesma régua. */
const familiaDe = c => c.fam || (c.sen==='lideranca' ? 'Liderança' : AREA[c.a].fam);

const SEN_ROT = {junior:'Júnior', pleno:'Pleno', senior:'Sênior', lideranca:'Liderança'};

const cargosDaArea = areaId => CARGOS.filter(c=>c.a===areaId);

/* Catálogo do passo de atividades: o que os cargos escolhidos pedem, mais
   as transversais, que aparecem sempre. Só competência ativa — sugestão
   pendente de curadoria não entra no match. */
function skillsDosCargos(cargoIds){
  const s = new Set();
  cargoIds.forEach(id => (CARGO[id]?.sk || []).forEach(x => s.add(x)));
  SKILLS.filter(k=>k.tr).forEach(k => s.add(k.id));
  return [...s].map(id=>SKILL[id]).filter(k=>k && k.st==='ativa');
}

/* ── motivos de rejeição ──
   Vocabulário fechado desde a primeira versão. Texto livre não treina, e
   ninguém volta para categorizar depois.

   `g`   grupo, para o gráfico de distribuição
   `dec` de quem partiu a decisão
   `eng` o reasonCode que o motor emite quando ele já previa esse motivo.
         É o que permite medir calibração: em quantas reprovações por
         requisito ausente o motor já tinha levantado a mão? Sem esse
         vínculo, vocabulário fechado é só um select bonito.             */
const MOTIVOS_REJEICAO = [
  {id:'mr-req',       r:'Requisito obrigatório ausente',   g:'tecnico',  dec:'empresa',   eng:'REQ_OBRIGATORIO_AUSENTE'},
  {id:'mr-exp',       r:'Experiência aquém do necessário', g:'tecnico',  dec:'empresa',   eng:null},
  {id:'mr-nivel',     r:'Nível acima do escopo da vaga',   g:'tecnico',  dec:'empresa',   eng:null},
  {id:'mr-cultura',   r:'Desalinhamento de ambiente',      g:'cultural', dec:'empresa',   eng:'EIXO_FORA_TOLERANCIA'},
  {id:'mr-pretensao', r:'Pretensão fora da faixa',         g:'contexto', dec:'ambos',     eng:'PRETENSAO_FORA'},
  {id:'mr-local',     r:'Localidade incompatível',         g:'contexto', dec:'ambos',     eng:'LOCAL_DIVERGENTE'},
  {id:'mr-modelo',    r:'Modelo de trabalho incompatível', g:'contexto', dec:'ambos',     eng:'MODELO_DIVERGENTE'},
  {id:'mr-outro',     r:'Selecionamos outra pessoa',       g:'processo', dec:'empresa',   eng:null},
  {id:'mr-congelada', r:'Vaga congelada ou cancelada',     g:'processo', dec:'empresa',   eng:null},
  {id:'mr-desistiu',  r:'Candidato desistiu',              g:'processo', dec:'candidato', eng:null},
  {id:'mr-semresp',   r:'Sem resposta do candidato',       g:'processo', dec:'candidato', eng:null},
];
const MOTIVO = Object.fromEntries(MOTIVOS_REJEICAO.map(m=>[m.id,m]));

const GRUPO_MOTIVO = {tecnico:'Técnico', cultural:'Cultural', contexto:'Contexto', processo:'Processo'};
