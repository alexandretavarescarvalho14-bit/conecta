/* ══════════════════ TAXONOMIA · ACRÉSCIMOS DA VERSÃO OPERADA ══════════════════

   A taxonomia base (prototipo-front/partes/js/10-taxonomia.js) entra
   inteira: é ela que a extração de currículo conhece, e s01–s12 são
   congeladas pelo baseline do core. Aqui ela só cresce, nunca muda de id.

   As áreas seguem o que o site atual já mostra para quem procura vaga
   (Comercial, Educação, Logística, Saúde e Estética, Engenharia e
   Operações...). Duas são só rótulo novo para uma área que já existia:
   "vendas" aparece como Comercial e "operacoes" como Engenharia e
   Operações. O id não muda, então nada do que já foi salvo quebra.

   Toda área aponta para uma família de peso da política. Área sem
   família própria usa `_padrao` de propósito, e o admin mostra isso. */

function acrescentar(lista, mapa, itens){
  for(const it of itens){
    if(mapa[it.id]) throw new Error('id repetido na taxonomia: ' + it.id);
    lista.push(it); mapa[it.id] = it;
  }
}

AREA.vendas.n = 'Comercial';
AREA.operacoes.n = 'Engenharia e Operações';
acrescentar(AREAS, AREA, [
  {id:'educacao',  n:'Educação',          fam:'_padrao',     c:'#6B5BD2'},
  {id:'logistica', n:'Logística',         fam:'Operações',   c:'#3D7A4A'},
  {id:'saude',     n:'Saúde e Estética',  fam:'Atendimento', c:'#C0568A'},
]);

/* Ordem em que as áreas aparecem para o candidato: a do site atual. */
const ORDEM_AREAS = ['marketing','vendas','rh','educacao','logistica','tecnologia','saude',
  'operacoes','financas','atendimento','produto'];
const areasOrdenadas = () => ORDEM_AREAS.map(id => AREA[id]).filter(Boolean);

SKILL.s13.a.push('logistica');
SKILL.s14.a.push('logistica');
SKILL.s48.a.push('logistica', 'saude');
acrescentar(SKILLS, SKILL, [
  {id:'s58', r:'Instrução e didática',            a:['educacao'],   st:'ativa'},
  {id:'s59', r:'Pacote Office',                   a:[], tr:true,    st:'ativa'},
  {id:'s60', r:'Procedimentos estéticos',         a:['saude'],      st:'ativa'},
  {id:'s61', r:'Aplicação de laser',              a:['saude'],      st:'ativa'},
  {id:'s62', r:'Avaliação estética',              a:['saude'],      st:'ativa'},
  {id:'s63', r:'Rastreamento e monitoramento',    a:['logistica'],  st:'ativa'},
  {id:'s64', r:'Conferência e expedição',         a:['logistica'],  st:'ativa'},
  {id:'s65', r:'SAP',                             a:['tecnologia'], st:'ativa'},
  {id:'s66', r:'Gestão de obras e empreendimentos', a:['operacoes'], st:'ativa'},
]);
Object.assign(SINONIMOS, {
  s58:['instrutor','instrutora','professor','professora','docente','didatica','aulas','ministrei'],
  s59:['pacote office','word','powerpoint','microsoft office'],
  s60:['procedimentos esteticos','estetica facial','estetica corporal','limpeza de pele','esteticista'],
  s61:['laser','depilacao a laser','aplicadora de laser','aplicador de laser'],
  s62:['avaliacao estetica','plano de tratamento','biomedica esteta','biomedico esteta','harmonizacao'],
  s63:['rastreamento','monitoramento de frota','monitoramento de viagens','gerenciamento de risco','sinistro','sinistros'],
  s64:['conferencia','expedicao','recebimento de mercadorias','separacao de pedidos','estoquista','almoxarifado'],
  s65:['sap','sap fico','sap sd','sap mm','sap ewm','abap','s/4hana','successfactors'],
  s66:['gestao de obras','engenharia civil','empreendimentos','construtoras','canteiro de obras'],
});

acrescentar(CARGOS, CARGO, [
  {id:'c-ven-7', a:'vendas',    n:'Consultor de Vendas',               sen:'pleno',     base:[3000,6000],   sk:['s30','s11','s35','s33']},
  {id:'c-ven-8', a:'vendas',    n:'SDR (Pré-vendas)',                  sen:'junior',    base:[2800,4200],   sk:['s30','s33','s48']},
  {id:'c-ven-9', a:'vendas',    n:'Vendedor Interno e Externo',        sen:'pleno',     base:[2800,5500],   sk:['s32','s11','s31','s35']},
  {id:'c-mkt-6', a:'marketing', n:'Estagiário de Marketing',           sen:'junior',    base:[1200,1800],   sk:['s52','s09','s12']},
  {id:'c-edu-1', a:'educacao',  n:'Instrutor de Cursos',               sen:'pleno',     base:[2200,3500],   sk:['s58','s59','s48']},
  {id:'c-edu-2', a:'educacao',  n:'Coordenador Pedagógico',            sen:'lideranca', base:[5000,8000],   sk:['s58','s07','s56']},
  {id:'c-log-1', a:'logistica', n:'Estoquista',                        sen:'junior',    base:[1800,2500],   sk:['s13','s64','s12']},
  {id:'c-log-2', a:'logistica', n:'Operador de Rastreamento',          sen:'junior',    base:[2000,2800],   sk:['s63','s48','s12']},
  {id:'c-log-3', a:'logistica', n:'Auxiliar de Contas (Logística)',    sen:'junior',    base:[1900,2600],   sk:['s48','s63','s12']},
  {id:'c-log-4', a:'logistica', n:'Supervisor de Logística',           sen:'lideranca', base:[5500,8500],   sk:['s14','s13','s07']},
  {id:'c-sau-1', a:'saude',     n:'Esteticista',                       sen:'pleno',     base:[2200,4000],   sk:['s60','s62','s35']},
  {id:'c-sau-2', a:'saude',     n:'Biomédico Esteta',                  sen:'senior',    base:[4500,8000],   sk:['s62','s60','s61']},
  {id:'c-sau-3', a:'saude',     n:'Aplicador de Laser',                sen:'pleno',     base:[2200,3800],   sk:['s61','s60','s35']},
  {id:'c-sau-4', a:'saude',     n:'Gerente Avaliador',                 sen:'lideranca', base:[6000,10000],  sk:['s62','s07','s35']},
  {id:'c-tec-8', a:'tecnologia',n:'Consultor SAP',                     sen:'senior',    base:[14000,22000], sk:['s65','s47','s38']},
  {id:'c-eng-1', a:'operacoes', n:'Gerente de Engenharia',             sen:'lideranca', base:[16000,24000], sk:['s66','s56','s07','s55']},
  {id:'c-eng-2', a:'operacoes', n:'Supervisor Administrativo de Planta', sen:'lideranca', base:[9000,13000], sk:['s19','s16','s07','s55']},
]);

/* Família de peso de uma vaga: do cargo quando há, senão da área. */
const familiaDaVaga = v => v.cargoId && CARGO[v.cargoId] ? familiaDe(CARGO[v.cargoId])
  : (AREA[v.areaId] ? AREA[v.areaId].fam : '_padrao');

/* Etapas vistas dos dois lados. O candidato vê o mesmo nome que a
   Conectaria usa: não existe etapa escondida. */
const ETAPAS = ['Recebida','Triagem Conectaria','Entrevista Conectaria','Entrevista com a empresa','Proposta'];

const MODELO_ROT = {presencial:'Presencial', hibrido:'Híbrido', remoto:'Remoto'};
const UF_ROT = {BR:'Remoto, Brasil', EX:'Exterior'};
const ORIGEM_ROT = {site:'Site de vagas', whatsapp:'Comunidade WhatsApp', indicacao:'Indicação', banco:'Banco de talentos'};
