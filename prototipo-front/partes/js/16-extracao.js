/* ══════════════════ 7e · EXTRAÇÃO DE CURRÍCULO ══════════════════

   Lê o arquivo e devolve texto; depois interpreta o texto e devolve
   SUGESTÕES, nunca fatos. Tudo que sai daqui entra no perfil com
   source: 'document', que a política pesa em 0,7 contra 1,0 do que a
   pessoa confirma. É a regra "IA sugere, pessoa confirma" do contrato,
   agora com uma interface na frente.

   Nada aqui usa biblioteca externa: o Artifact precisa abrir sem rede.
   TXT e MD são texto. DOCX é um zip com XML dentro, e o navegador
   descompacta deflate nativamente.

   PDF foi testado e tirado do fluxo aceito: a leitura funciona só para
   fonte padrão, e a maioria dos currículos reais exportados do Word ou
   do Canva usa fonte embutida com codificação própria, que sai como
   lixo. Em vez de aceitar o formato e falhar silenciosamente para boa
   parte de quem usa, a extração recusa PDF de saída e orienta para
   DOCX, que lê com precisão. O código de leitura de PDF continua
   abaixo, sem uso: fica pronto para o dia em que uma extração de
   verdade (servidor, OCR) o tornar confiável de novo.                 */

class ErroExtracao extends Error {
  constructor(msg, motivo){ super(msg); this.motivo = motivo; }
}

const FORMATOS = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt', 'text/markdown': 'md', 'text/x-markdown': 'md',
};
/* PDF fica fora de propósito: ver a nota de leitura acima. */
function formatoDe(arquivo){
  const ext = (arquivo.name.split('.').pop() || '').toLowerCase();
  if(['docx','txt','md'].includes(ext)) return ext;
  return FORMATOS[arquivo.type] || null;
}
const LIMITE_BYTES = 8 * 1024 * 1024;

/* ── leitura por formato ── */

async function inflar(dados, formato){
  const ds = new DecompressionStream(formato);
  const w = ds.writable.getWriter();
  w.write(dados); w.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(buf);
}
const utf8 = u8 => new TextDecoder('utf-8').decode(u8);
const latin = u8 => new TextDecoder('latin1').decode(u8);

/* DOCX: procura word/document.xml pelo diretório central do zip, que é
   onde os tamanhos são confiáveis. O cabeçalho local pode ter tamanho
   zero quando o gravador usou descritor de dados. */
async function lerDocx(buf){
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let eocd = -1;
  for(let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--){
    if(dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
  }
  if(eocd < 0) throw new ErroExtracao('O arquivo não é um DOCX válido.', 'formato');
  const n = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  for(let i = 0; i < n; i++){
    if(dv.getUint32(p, true) !== 0x02014b50) break;
    const metodo = dv.getUint16(p + 10, true);
    const tamComp = dv.getUint32(p + 20, true);
    const nomeLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const comentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const nome = utf8(u8.subarray(p + 46, p + 46 + nomeLen));
    if(nome === 'word/document.xml'){
      const lNome = dv.getUint16(local + 26, true), lExtra = dv.getUint16(local + 28, true);
      const ini = local + 30 + lNome + lExtra;
      const dados = u8.subarray(ini, ini + tamComp);
      const xml = metodo === 8 ? utf8(await inflar(dados, 'deflate-raw'))
                : metodo === 0 ? utf8(dados)
                : null;
      if(xml === null) throw new ErroExtracao('O DOCX usa uma compressão que não consigo ler.', 'formato');
      return docxParaTexto(xml);
    }
    p += 46 + nomeLen + extraLen + comentLen;
  }
  throw new ErroExtracao('Não encontrei o conteúdo do documento dentro do DOCX.', 'formato');
}
function docxParaTexto(xml){
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* PDF: varre os streams, infla os FlateDecode e lê os operadores de
   texto Tj e TJ. Cobre PDF com fonte padrão. Fonte com codificação
   própria (Identity-H sem ToUnicode) sai como lixo, e o teste de
   legibilidade abaixo pega isso e devolve falha em vez de perfil errado. */
async function lerPdf(buf){
  const u8 = new Uint8Array(buf);
  const s = latin(u8);
  if(!s.startsWith('%PDF')) throw new ErroExtracao('O arquivo não é um PDF válido.', 'formato');
  const partes = [];
  const re = /stream\r?\n/g; let m;
  while((m = re.exec(s))){
    const ini = m.index + m[0].length;
    const fim = s.indexOf('endstream', ini);
    if(fim < 0) break;
    const dict = s.slice(Math.max(0, s.lastIndexOf('<<', m.index)), m.index);
    // /Length diz o tamanho exato. Sem ele, corta o fim de linha antes de
    // endstream: byte sobrando depois do trailer zlib faz o inflate rejeitar.
    const len = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
    let fimDados = len ? Math.min(ini + (+len[1]), fim) : fim;
    while(fimDados > ini && (s[fimDados - 1] === '\n' || s[fimDados - 1] === '\r')) fimDados--;
    const dados = u8.subarray(ini, fimDados);
    let txt;
    try{
      txt = /FlateDecode/.test(dict) ? latin(await inflar(dados, 'deflate')) : latin(dados);
    }catch(_){ re.lastIndex = fim; continue; }
    if(/\bT[jJ]\b/.test(txt)) partes.push(pdfOperadoresParaTexto(txt));
    re.lastIndex = fim;
  }
  const texto = partes.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if(!textoLegivel(texto)){
    throw new ErroExtracao(
      'Consegui abrir o PDF, mas o texto dele não saiu legível. Isso acontece quando o ' +
      'arquivo foi exportado com fontes embutidas de um jeito que não consigo decodificar.',
      'ilegivel');
  }
  return texto;
}
function pdfOperadoresParaTexto(s){
  const out = [];
  const re = /\[((?:[^\]\\]|\\.)*)\]\s*TJ|\(((?:[^)\\]|\\.)*)\)\s*Tj|\bT\*|\bET\b/g;
  let m;
  while((m = re.exec(s))){
    if(m[1] !== undefined){
      const strs = m[1].match(/\(((?:[^)\\]|\\.)*)\)/g) || [];
      out.push(strs.map(x => pdfDesescapar(x.slice(1, -1))).join(''));
    } else if(m[2] !== undefined){
      out.push(pdfDesescapar(m[2]));
    } else out.push('\n');
  }
  return out.join(' ').replace(/[ \t]+/g, ' ').replace(/ \n/g, '\n');
}
function pdfDesescapar(s){
  return s.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\n/g, '\n')
    .replace(/\\r/g, '').replace(/\\t/g, ' ').replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
}
/* Teste de legibilidade: texto de currículo em português tem palavras
   comuns. Se quase nenhuma aparece, o que saiu é codificação, não texto. */
function textoLegivel(t){
  if(t.replace(/\s/g, '').length < 60) return false;
  const comuns = ['de', 'e', 'em', 'com', 'para', 'do', 'da', 'que', 'um', 'uma', 'na', 'no', 'por'];
  const palavras = t.toLowerCase().match(/[a-záéíóúâêôãõç]{2,}/g) || [];
  if(palavras.length < 15) return false;
  const acertos = palavras.filter(p => comuns.includes(p)).length;
  return acertos / palavras.length > 0.03;
}

async function lerArquivo(arquivo){
  const fmt = formatoDe(arquivo);
  if(!fmt){
    const ext = (arquivo.name.split('.').pop() || '').toLowerCase();
    if(ext === 'pdf') throw new ErroExtracao(
      'PDF não é aceito nesta versão: a leitura falha na maioria dos currículos exportados ' +
      'com fonte própria. Exporte como DOCX (Word: Salvar como → Word) e envie de novo.',
      'formato');
    throw new ErroExtracao('Aceito DOCX, TXT ou MD. Este arquivo é outra coisa.', 'formato');
  }
  if(arquivo.size > LIMITE_BYTES) throw new ErroExtracao('O arquivo passa de 8 MB. Currículo costuma ter bem menos que isso.', 'tamanho');
  if(arquivo.size === 0) throw new ErroExtracao('O arquivo está vazio.', 'vazio');
  const buf = await arquivo.arrayBuffer();
  let texto;
  if(fmt === 'txt' || fmt === 'md') texto = utf8(new Uint8Array(buf));
  else texto = await lerDocx(buf);
  if(!textoLegivel(texto)) throw new ErroExtracao('Abri o arquivo, mas não achei texto suficiente para montar um perfil.', 'vazio');
  return {texto, formato: fmt};
}

/* ── interpretação: texto → sugestões ──
   Determinística e por catálogo. Cada sugestão carrega o trecho do
   currículo que a motivou, para a pessoa ver de onde veio e decidir. */

const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* Sinônimos por competência. Recall vale mais que precisão aqui: uma
   sugestão errada custa um clique para remover; uma que faltou custa
   procurar no catálogo. Termo genérico demais (dados, produção,
   qualidade) fica de fora porque acerta em tudo. */
const SINONIMOS = {
  s01:['recrutamento','recrutamento e selecao','r&s','selecao de pessoas','processo seletivo','triagem de curriculos','entrevistas de selecao','hunting','headhunting'],
  s02:['avaliacao de desempenho','avaliacao de performance','ciclo de avaliacao','feedback estruturado','pdi','avaliacao 360'],
  s03:['clima organizacional','pesquisa de clima','engajamento','gptw','great place to work'],
  s04:['folha de pagamento','admissao','departamento pessoal','rescisao','esocial','ponto eletronico','beneficios'],
  s05:['treinamento','t&d','capacitacao','desenvolvimento de pessoas','onboarding','trilha de aprendizagem','universidade corporativa'],
  s06:['varejo','operacao de loja','loja fisica','pdv','rede de lojas','chao de loja'],
  s07:['gestao de equipe','gestao de pessoas','lideranca de equipe','liderei','gerenciei equipe','coordenei equipe','coordenei o time','gestao de time','equipe de'],
  s08:['midia paga','google ads','meta ads','facebook ads','trafego pago','campanhas pagas','performance digital'],
  s09:['analise de dados','dashboards','power bi','indicadores','kpis','relatorios gerenciais','metabase','looker','tableau'],
  s10:['conciliacao bancaria','conciliacao financeira','conciliacoes'],
  s11:['negociacao','negociei','negociacoes'],
  s12:['excel','planilhas','procv','tabela dinamica','google sheets'],
  s13:['gestao de estoque','controle de estoque','inventario','wms','estoque'],
  s14:['logistica','distribuicao','transporte','frete','roteirizacao','expedicao','armazem'],
  s15:['pcp','planejamento de producao','planejamento e controle da producao','programacao de producao'],
  s16:['compras','suprimentos','fornecedores','cotacao','procurement','sourcing'],
  s17:['melhoria continua','lean','kaizen','six sigma','mapeamento de processos','otimizacao de processos'],
  s18:['controle de qualidade','auditoria','iso 9001','nao conformidade','garantia da qualidade'],
  s19:['facilities','manutencao predial','gestao predial'],
  s20:['contas a pagar','contas a receber','cobranca','faturamento','contas a pagar e receber'],
  s21:['fluxo de caixa','tesouraria','caixa'],
  s22:['fechamento contabil','contabilidade','balancete','dre','demonstracoes financeiras','lancamentos contabeis'],
  s23:['fp&a','orcamento','forecast','planejamento financeiro','budget','orcamentario'],
  s24:['fiscal','tributario','impostos','nota fiscal','sped','apuracao de impostos','obrigacoes acessorias'],
  s25:['precificacao','margem','pricing','formacao de preco'],
  s26:['cargos e salarios','remuneracao','plano de carreira','estrutura salarial'],
  s27:['sindicato','sindical','acordo coletivo','convencao coletiva','negociacao sindical'],
  s28:['people analytics','rh analytics','indicadores de rh','turnover','headcount'],
  s29:['employer branding','marca empregadora','atracao de talentos'],
  s30:['prospeccao','prospectar','sdr','outbound','cold call','geracao de leads','prospeccao ativa'],
  s31:['carteira de clientes','gestao de carteira','key account','contas estrategicas','relacionamento com clientes'],
  s32:['venda consultiva','b2b','vendas complexas','ciclo de venda longo','vendas corporativas'],
  s33:['crm','pipeline','funil de vendas','salesforce','hubspot','pipedrive','rd station crm'],
  s34:['pos-venda','pos venda','renovacao','retencao','churn','customer success','sucesso do cliente'],
  s35:['vendas em loja','atendimento em loja','balcao','vendedor','vendedora','vendas no varejo'],
  s36:['backend','back-end','node','node.js','java','python','api','apis','microsservicos','spring','django'],
  s37:['frontend','front-end','react','vue','angular','javascript','typescript','html','css'],
  s38:['sql','banco de dados','postgres','postgresql','mysql','oracle','modelagem de dados'],
  s39:['cloud','aws','azure','gcp','docker','kubernetes','devops','infraestrutura como codigo','terraform'],
  s40:['qa','testes automatizados','teste automatizado','qualidade de software','cypress','selenium','testes de software'],
  s41:['seguranca da informacao','cybersecurity','pentest','seguranca de aplicacoes','iso 27001'],
  s42:['suporte tecnico','help desk','service desk','suporte de ti','suporte ao usuario'],
  s43:['discovery','pesquisa com usuarios','entrevistas com usuarios','ux research','pesquisa de usuario'],
  s44:['roadmap','priorizacao','backlog','product owner','gestao de backlog'],
  s45:['metricas de produto','north star','analytics de produto','mixpanel','amplitude','funil de ativacao'],
  s46:['design de fluxo','ux','wireframe','figma','prototipacao','fluxo de usuario'],
  s47:['requisitos','user stories','historias de usuario','especificacao funcional','documentacao de requisitos'],
  s48:['atendimento ao cliente','sac','atendimento ao consumidor','relacionamento com o cliente'],
  s49:['suporte n1','suporte n2','primeiro nivel','segundo nivel','n1','n2'],
  s50:['sla','gestao de filas','tempo de resposta','tempo medio de atendimento','tma'],
  s51:['ouvidoria','reclamacoes','reclame aqui','procon'],
  s52:['seo','marketing de conteudo','producao de conteudo','blog','redacao','copywriting'],
  s53:['automacao de marketing','rd station','mailchimp','e-mail marketing','email marketing','nutricao de leads'],
  s54:['eventos','trade marketing','feiras','ativacoes','ponto de venda'],
  s55:['gestao de orcamento','gestao orcamentaria','controle de orcamento','centro de custo'],
  s56:['gestao de projetos','pmo','scrum','kanban','agile','metodologias ageis','gerenciamento de projetos'],
  s57:['desenvolvimento de time','mentoria','formacao de equipe','contratei','desenvolvi pessoas','desenvolvimento da equipe'],
};

const UFS = {
  'acre':'AC','alagoas':'AL','amapa':'AP','amazonas':'AM','bahia':'BA','ceara':'CE',
  'distrito federal':'DF','espirito santo':'ES','goias':'GO','maranhao':'MA','mato grosso':'MT',
  'mato grosso do sul':'MS','minas gerais':'MG','para':'PA','paraiba':'PB','parana':'PR',
  'pernambuco':'PE','piaui':'PI','rio de janeiro':'RJ','rio grande do norte':'RN',
  'rio grande do sul':'RS','rondonia':'RO','roraima':'RR','santa catarina':'SC',
  'sao paulo':'SP','sergipe':'SE','tocantins':'TO',
};
const CIDADES = {
  'recife':'PE','olinda':'PE','jaboatao':'PE','caruaru':'PE','petrolina':'PE',
  'sao paulo':'SP','campinas':'SP','santos':'SP','sorocaba':'SP','ribeirao preto':'SP',
  'rio de janeiro':'RJ','niteroi':'RJ','belo horizonte':'MG','uberlandia':'MG',
  'salvador':'BA','fortaleza':'CE','porto alegre':'RS','curitiba':'PR','brasilia':'DF',
  'manaus':'AM','belem':'PA','goiania':'GO','florianopolis':'SC','vitoria':'ES',
  'natal':'RN','joao pessoa':'PB','maceio':'AL','teresina':'PI','sao luis':'MA',
  'campo grande':'MS','cuiaba':'MT','aracaju':'SE',
};

function trechoEm(texto, norm, idx, len){
  let ini = idx, fim = idx + len;
  while(ini > 0 && !/[\n.;:•·]/.test(norm[ini - 1]) && idx - ini < 110) ini--;
  while(fim < norm.length && !/[\n.;•·]/.test(norm[fim]) && fim - idx < 130) fim++;
  return texto.slice(ini, fim).replace(/\s+/g, ' ').trim();
}
function nivelPorContexto(trecho){
  const t = normalizar(trecho);
  if(/\b(avancad|senior|lider|coorden|gerenci|especialista|responsavel por|implantei|estruturei|head|diretor)/.test(t)) return 3;
  if(/\b(basic|junior|nocoes|iniciante|apoio|auxiliar|estagi|aprendiz)/.test(t)) return 1;
  return 2;
}
const escaparRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function interpretar(texto){
  const norm = normalizar(texto);

  // competências com evidência
  const competencias = [];
  for(const sk of SKILLS){
    if(sk.st !== 'ativa') continue;
    const termos = [normalizar(sk.r), ...(SINONIMOS[sk.id] || [])];
    for(const t of termos){
      const re = new RegExp('(^|[^a-z0-9])' + escaparRe(t) + '($|[^a-z0-9])');
      const m = re.exec(norm);
      if(m){
        const idx = m.index + m[1].length;
        const trecho = trechoEm(texto, norm, idx, t.length);
        competencias.push({skillId: sk.id, nivel: nivelPorContexto(trecho), evidencia: trecho, termo: t});
        break;
      }
    }
  }

  // área: a que mais competências encontradas
  const porArea = {};
  competencias.forEach(c => (SKILL[c.skillId].a || []).forEach(a => porArea[a] = (porArea[a] || 0) + 1));
  const areaId = Object.entries(porArea).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // cargos citados literalmente
  const cargos = CARGOS.filter(c => norm.includes(normalizar(c.n))).map(c => c.id);

  // UF: sigla no formato "Cidade - PE" / "Cidade/PE", nome de estado ou cidade grande
  let uf = null;
  const sigla = norm.match(/\b[a-z ]{3,25}\s*[-\/,]\s*([a-z]{2})\b/);
  if(sigla && Object.values(UFS).includes(sigla[1].toUpperCase())) uf = sigla[1].toUpperCase();
  if(!uf) for(const [nome, s] of Object.entries(CIDADES)) if(new RegExp('\\b' + nome + '\\b').test(norm)){ uf = s; break; }
  if(!uf) for(const [nome, s] of Object.entries(UFS)) if(new RegExp('\\b' + nome + '\\b').test(norm)){ uf = s; break; }

  // anos de experiência: menção explícita ou soma de intervalos de datas
  let anos = null;
  const exp = norm.match(/(\d{1,2})\s*anos?\s*(de\s*)?(experiencia|atuacao|carreira)/) || norm.match(/(experiencia|atuacao)\s*(de|com)?\s*(\d{1,2})\s*anos/);
  if(exp){ const n = +(exp[1] || exp[3]); if(n > 0 && n <= 45) anos = n; }
  if(anos === null){
    const anoAtual = new Date().getFullYear();
    const faixas = [...norm.matchAll(/\b(19[89]\d|20[0-4]\d)\s*(?:-|a|ate|–)\s*(19[89]\d|20[0-4]\d|atual|presente|hoje|momento)\b/g)];
    let soma = 0;
    for(const f of faixas){ const a = +f[1]; const b = /\d/.test(f[2]) ? +f[2] : anoAtual; if(b >= a && b - a <= 40) soma += b - a; }
    if(soma > 0) anos = Math.min(soma, 45);
  }

  // resumo: seção nomeada, senão o primeiro parágrafo com cara de prosa
  let resumo = '';
  const paragrafos = texto.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const idxSecao = paragrafos.findIndex(p => /^(resumo|perfil|sobre mim|sobre|objetivo|apresentacao|summary)\b/i.test(normalizar(p)));
  if(idxSecao >= 0){
    const mesmo = paragrafos[idxSecao].replace(/^[^\n:]{0,25}[:\n]\s*/, '');
    resumo = mesmo.length > 60 ? mesmo : (paragrafos[idxSecao + 1] || '');
  }
  if(!resumo) resumo = paragrafos.find(p => p.length > 80 && p.length < 900 && !/@|\(\d{2}\)|\d{5}-?\d{3}|linkedin/i.test(p)) || '';
  resumo = resumo.slice(0, 700);

  // modelos de trabalho citados
  const modelos = [];
  if(/\bremot[oa]\b|home office|trabalho remoto/.test(norm)) modelos.push('remoto');
  if(/\bhibrid[oa]\b/.test(norm)) modelos.push('hibrido');
  if(/\bpresencial\b/.test(norm)) modelos.push('presencial');

  return {competencias, areaId, cargos, uf, anos, resumo, modelos,
    caracteres: texto.length, palavras: (texto.match(/\S+/g) || []).length};
}

/* Modelo em Markdown, oferecido, nunca exigido. */
const MODELO_MD = [
'# Seu nome',
'',
'Cidade - UF · e-mail · telefone',
'',
'## Resumo',
'Duas ou três frases sobre o que você faz, há quanto tempo, e o que',
'busca agora.',
'',
'## Experiência',
'### Cargo · Empresa · 2021 - atual',
'- O que você fazia, com verbos no passado: liderei, estruturei, implantei',
'- Resultados com número quando tiver: reduzi o prazo de 12 para 5 dias',
'',
'### Cargo anterior · Empresa · 2018 - 2021',
'- Atividades principais',
'',
'## Competências',
'Liste o que você domina, uma por linha. Exemplos: recrutamento e seleção,',
'avaliação de desempenho, Excel avançado, gestão de equipe.',
'',
'## Formação',
'Curso · Instituição · ano',
'',
'## Preferências',
'Modelo: presencial, híbrido ou remoto',
'Pretensão: R$',
].join('\n');
