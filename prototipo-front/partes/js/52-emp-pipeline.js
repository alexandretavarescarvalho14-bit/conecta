/* TEMPORÁRIO — sai na Etapa 3, quando PESSOAS e S.pipeline entrarem.
   Lista chapada, sem vínculo com vaga e sem perfil que o motor consiga
   avaliar: o fit aqui é um número escrito à mão, não calculado. */
const CANDS_EMP = [
  {ini:'M.S.', obj:'Coordenador de RH', et:4, match:94, conf:.93, at:'há 2 dias',
   pt:'Montou ciclo de avaliação em duas empresas. Cultura casa em autonomia.'},
  {ini:'R.A.', obj:'Coordenador de RH', et:3, match:88, conf:.81, at:'há 1 dia',
   pt:'Generalista de RH em indústria. Busca mais autonomia, o que a vaga oferece.'},
  {ini:'L.F.', obj:'Analista de RH Sênior', et:2, match:71, conf:.68, at:'há 4 dias',
   pt:'Perfil mais operacional que a vaga pede. Cultura e contexto casam bem.'},
  {ini:'C.P.', obj:'Coordenador de Gente', et:1, match:64, conf:.59, at:'há 6 dias',
   pt:'Experiência em startup, sem operação de loja física.'},
];

/* ══════════════════ 22 · EMPRESA · CANDIDATURAS ══════════════════ */
const gateDe = conf => conf < POLITICA.confianca.minima_para_publicar ? 'block'
  : conf < POLITICA.confianca.revisar_abaixo_de ? 'review' : 'allow';

function vEcand(){
  $('#v-ecand').innerHTML=
  '<div class="barra" style="margin-top:var(--s5)"><h2>Candidaturas</h2>'+
    '<p class="cont">Coordenador de RH · '+CANDS_EMP.length+' pessoas</p></div>'+
  '<div class="bloco" style="margin-top:0"><div class="tabw"><table class="tab"><thead><tr>'+
    '<th>Pessoa</th><th>Match</th><th>Confiança</th><th>Portão</th><th>Por quê</th><th>Etapa</th>'+
    '</tr></thead><tbody>'+CANDS_EMP.map(c=>{
    const g=gateDe(c.conf);
    return '<tr data-c="'+c.ini+'"><td><b style="font-family:var(--d);font-size:var(--md)">'+
      esc(c.ini)+'</b><div style="color:var(--i52);font-size:var(--xs)">'+esc(c.obj)+'</div></td>'+
    '<td><span class="eixo" style="grid-template-columns:1fr 34px;width:104px">'+
      '<span class="t"><i data-w="'+c.match+'"></i></span>'+
      '<span class="v">'+c.match+'</span></span></td>'+
    '<td><span class="cbar'+(c.conf<POLITICA.confianca.revisar_abaixo_de?' bx':'')+
      '" style="width:58px;display:block"><i data-w="'+Math.round(c.conf*100)+'"></i></span>'+
      '<span style="font-size:var(--xs);color:var(--i52)">'+pc(c.conf)+'</span></td>'+
    '<td>'+selo(g)+'</td>'+
    '<td style="max-width:250px;color:var(--i72)">'+esc(c.pt)+'</td>'+
    '<td><span class="pill '+(c.et>=3?'ac':'n')+'">'+esc(ETAPAS[c.et])+'</span></td></tr>';
  }).join('')+'</tbody></table></div></div>'+
  '<p class="nota">A coluna "por quê" vem dos mesmos eixos que a pessoa vê do outro lado. '+
  'A coluna portão traz a decisão da política de publicação: quem aparece em <b>revisão '+
  'humana</b> tem perfil que o próprio candidato ainda não confirmou, então o número existe '+
  'mas a plataforma não o trata como fato verificado.</p>';
  $$('[data-c]').forEach(t=>t.onclick=()=>toast('Perfil completo e agenda de entrevista, em construção nesta versão.'));
  animaEixos();
}
