/* ══════════════════ 12 · PERSISTÊNCIA ══════════════════
   Recarregar a página perdia tudo, o que atrapalhava justamente quem
   estava avaliando o protótipo com calma.                             */
const CHAVE='conectaria.proto.v2';
function salvar(){
  try{
    localStorage.setItem(CHAVE, JSON.stringify({
      logado:S.logado, contaEmp:S.contaEmp, modo:S.modo, view:S.view,
      candidaturas:S.candidaturas, empSalvo:S.empSalvo, comparar:S.comparar,
      fonte:S.cand.fonte,
      eixosCand:Object.fromEntries(EIXO_IDS.map(id=>[id,S.cand.eixos[id].value])),
      skills:S.cand.competencias.map(c=>[c.skillId,c.nivel.value]),
      eixosEmp:Object.fromEntries(EIXO_IDS.map(id=>[id,EMPRESAS.aurora.eixos[id].value])),
      conta:S.conta, onb:S.onb, sugestoes:S.sugestoes,
      candExtra:{areaId:S.cand.areaId||null, cargos:S.cand.cargos||[], resumo:S.cand.resumo||'',
        anos:S.cand.anos??null, uf:S.cand.uf.value, modelos:S.cand.modelos.value,
        pretensao:S.cand.pretensao?S.cand.pretensao.value:null},
      // Só o que muda por ação da empresa. O `rec` fica de fora: é
      // congelado e determinístico a partir de pessoa+vaga+política, então
      // recriá-lo no boot é mais barato e mais confiável que serializar
      // evidências inteiras a cada candidatura.
      empEstado:{cnpj:EMPRESAS.aurora.cnpj, razaoSocial:EMPRESAS.aurora.razaoSocial,
        site:EMPRESAS.aurora.site, estado:EMPRESAS.aurora.estado},
      pipelineDelta:S.pipeline.map(ap=>({id:ap.id, etapa:ap.etapa, status:ap.status,
        motivoId:ap.motivoId, nota:ap.nota, favorito:ap.favorito, historico:ap.historico,
        atualizadaEm:ap.atualizadaEm})),
      vagaEmpSelecionada:S.vagaEmpSelecionada,
    }));
  }catch(_){ /* modo privado ou storage cheio: o protótipo segue sem persistir */ }
}
function restaurar(){
  let d; try{ d=JSON.parse(localStorage.getItem(CHAVE)||'null'); }catch(_){ return false; }
  if(!d) return false;
  try{
    S.logado=!!d.logado; S.contaEmp=!!d.contaEmp; S.modo=d.modo||'cand';
    S.candidaturas=d.candidaturas||[]; S.empSalvo=!!d.empSalvo; S.comparar=d.comparar||[];
    if(d.skills) S.cand.competencias = d.skills.map(([skillId,n])=>({skillId, nivel:sv(n,'user',1)}));
    if(d.eixosCand) EIXO_IDS.forEach(id=>{ if(d.eixosCand[id]!=null) S.cand.eixos[id]=sv(d.eixosCand[id],'user',1); });
    if(d.eixosEmp) EIXO_IDS.forEach(id=>{ if(d.eixosEmp[id]!=null) EMPRESAS.aurora.eixos[id]=sv(d.eixosEmp[id],'company',1); });
    if(d.candExtra){
      const x=d.candExtra;
      S.cand.areaId=x.areaId||null; S.cand.cargos=x.cargos||[]; S.cand.resumo=x.resumo||''; S.cand.anos=x.anos??null;
      if(x.uf) S.cand.uf=sv(x.uf,'user',1);
      if(x.modelos) S.cand.modelos=sv(x.modelos,'user',1);
      S.cand.pretensao = x.pretensao!=null ? sv(x.pretensao,'user',1) : undefined;
    }
    reprojetarFonte(d.fonte||'user');
    S.conta=d.conta||null; S.onb=d.onb||null; S.sugestoes=d.sugestoes||[];
    if(d.empEstado) Object.assign(EMPRESAS.aurora, d.empEstado);
    if(d.pipelineDelta && Array.isArray(d.pipelineDelta)){
      const porId = Object.fromEntries(d.pipelineDelta.map(x=>[x.id,x]));
      S.pipeline.forEach(ap=>{ const dt=porId[ap.id]; if(dt) Object.assign(ap, dt); });
    }
    if(d.vagaEmpSelecionada) S.vagaEmpSelecionada = d.vagaEmpSelecionada;
    return true;
  }catch(_){ return false; }
}
function limparTudo(){
  try{ localStorage.removeItem(CHAVE); }catch(_){}
  location.reload();
}
