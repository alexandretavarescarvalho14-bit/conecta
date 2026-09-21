#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
montar.py — build do protótipo da Conectaria.

Concatena as partes de `partes/` em dois arquivos:

  index.html          página autônoma, abre com duplo clique
  artifact-body.html  sem <!doctype>/<html>/<head>/<body>, para publicar como Artifact
                      (o publicador embrulha o conteúdo por conta própria)

Por que concatenar em vez de usar módulos ES: o Artifact precisa ser um arquivo
único e self-contained, sem rede. Tudo vira um <script> só, num escopo só. Isso
tem duas consequências que este script existe para vigiar:

  1. `import`/`export` não funcionam e quebram o parse inteiro em silêncio;
  2. dois arquivos declarando o mesmo identificador no topo é `SyntaxError` de
     redeclaração — o modo mais fácil de quebrar tudo quando a fonte passa de
     2 para 27 arquivos.

Ordem importa e é semântica, por isso o manifesto abaixo é explícito e nunca
um glob: só declaração de função sobrevive a mudança de ordem (é hoisted).
Qualquer inicialização que dependa de outra parte pertence a 99-boot.js.

Uso:
  python montar.py            gera index.html e artifact-body.html
  python montar.py --check    verifica que o gerado bate com o versionado
                              (não escreve nada; sai 1 se divergir)
"""
import hashlib
import json
import io
import os
import re
import sys
from datetime import datetime, timezone

RAIZ = os.path.dirname(os.path.abspath(__file__))
PARTES = os.path.join(RAIZ, 'partes')

# ── manifesto ────────────────────────────────────────────────────────────────
# A ordem é a ordem de execução. Mudar aqui muda o comportamento.
JS = [
    # motor: porte fiel de conectaria-core/packages/matching-core
    'js/00-politica.js',       # política versionada, congelada
    'js/01-motor.js',          # SourcedValue, projeção de features, evaluate
    'js/02-gate.js',           # portão allow/review/block
    'js/03-trace.js',          # hash canônico e Recommendation Trace
    # helpers puros — vêm antes dos dados porque os geradores usam brl/esc,
    # e `const` não é hoisted: a ordem inversa estoura TDZ na construção
    'js/30-ui-base.js',        # seletores, escape, toast, ícones
    # dados
    'js/10-taxonomia.js',      # áreas, cargos, competências, motivos
    'js/11-prng.js',           # aleatório determinístico, âncora de tempo
    'js/12-empresas.js',
    'js/13-vagas.js',
    'js/14-pessoas.js',        # pessoas sintéticas ancoradas nas vagas da empresa
    'js/15-pipeline-seed.js',  # candidaturas semeadas, aplicar() e recalcularFit()
    'js/16-extracao.js',       # leitura de currículo e interpretação por catálogo
    # estado
    'js/20-estado.js',
    'js/21-fachada.js',        # memo do match
    'js/32-persistencia.js',
    'js/33-tema.js',
    'js/31-ui-comp.js',        # medidor, radar, evidências, portão
    # telas do candidato
    'js/40-cand-busca.js',
    'js/41-cand-vaga.js',
    'js/42-cand-triagem.js',
    'js/43-cand-minhas.js',
    'js/71-cand-perfil.js',
    # telas da empresa
    'js/50-emp-cadastro.js',
    'js/51-emp-vagas.js',
    'js/52-emp-pipeline.js',
    'js/53-emp-dash.js',
    # comuns
    'js/70-acesso.js',
    'js/80-paleta.js',
    'js/90-nav.js',
    'js/98-eventos.js',
    'js/99-boot.js',           # sempre por último: é quem executa
]

CSS = ['assets/fonts.css', 'app.css']   # fontes embutidas primeiro
CORPO = 'body.html'
LOGO = 'assets/logo.html'

CABECA = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#189CCC">
<meta name="color-scheme" content="light dark">
<title>Conectaria</title>
"""


def ler(rel):
    caminho = os.path.join(PARTES, rel)
    if not os.path.exists(caminho):
        erro('parte ausente: partes/%s' % rel)
    with io.open(caminho, encoding='utf-8') as f:
        return f.read()


# ── política ─────────────────────────────────────────────────────────────────
# A política é injetada do core, nunca copiada à mão. Front-end, API, job
# offline e avaliação histórica têm de ler os mesmos números; uma segunda
# cópia divergiria no primeiro ajuste e ninguém veria, porque o resultado
# continuaria plausível. Aqui o protótipo não consegue discordar do motor.

CORE = os.path.normpath(os.path.join(RAIZ, '..', 'conectaria-core'))
DIR_POLITICAS = os.path.join(CORE, 'packages', 'recommendation-policy', 'policies')
SRC_POLITICA = os.path.join(CORE, 'packages', 'recommendation-policy', 'src', 'index.ts')


def politica_atual():
    """Lê POLITICA_ATUAL do core em vez de repetir a constante aqui."""
    if not os.path.exists(SRC_POLITICA):
        erro('core não encontrado em %s\n'
             '  O protótipo lê a política publicada pelo conectaria-core.\n'
             '  Rode o build a partir do repositório completo.' % CORE)
    with io.open(SRC_POLITICA, encoding='utf-8') as f:
        m = re.search(r"POLITICA_ATUAL\s*=\s*'([^']+)'", f.read())
    if not m:
        erro('não achei POLITICA_ATUAL em %s' % SRC_POLITICA)
    return m.group(1)


def carregar_politica():
    versao = politica_atual()
    caminho = os.path.join(DIR_POLITICAS, versao + '.json')
    if not os.path.exists(caminho):
        erro('política "%s" não publicada em %s' % (versao, DIR_POLITICAS))
    with io.open(caminho, encoding='utf-8') as f:
        p = json.load(f)
    if p.get('policy_version') != versao:
        erro('%s.json declara policy_version "%s"' % (versao, p.get('policy_version')))
    # `notas` é comentário para quem lê o JSON; não entra no bundle
    p.pop('notas', None)
    return versao, json.dumps(p, ensure_ascii=False, indent=2)


def erro(msg):
    sys.stderr.write('\n  ERRO DE BUILD: %s\n\n' % msg)
    sys.exit(1)


# ── verificações ─────────────────────────────────────────────────────────────

RE_MODULO = re.compile(r'^\s*(?:import\s|export\s|export\{|import\{)', re.M)

# declaração no topo do arquivo = começa na coluna 0
RE_TOPO = re.compile(
    r'^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)', re.M)
# segundo declarador em `const a = 1, b = 2` na coluna 0
RE_TOPO_EXTRA = re.compile(
    r'^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=[^;\n]*?,\s*([A-Za-z_$][\w$]*)\s*=', re.M)


def checar_modulos(rel, txt):
    m = RE_MODULO.search(txt)
    if m:
        linha = txt[:m.start()].count('\n') + 1
        erro('partes/%s linha %d usa import/export.\n'
             '  Tudo vira um <script> único, sem módulos. Remova a instrução.'
             % (rel, linha))


def coletar_topo(txt):
    nomes = set(RE_TOPO.findall(txt))
    nomes |= set(RE_TOPO_EXTRA.findall(txt))
    return nomes


def checar_colisoes(partes):
    """Duas partes declarando o mesmo nome no topo = SyntaxError em runtime.
    É a falha mais provável ao dividir o fonte, e a mais difícil de achar
    depois, porque derruba o arquivo inteiro sem apontar a causa."""
    dono = {}
    problemas = []
    for rel, txt in partes:
        for nome in sorted(coletar_topo(txt)):
            if nome in dono:
                problemas.append((nome, dono[nome], rel))
            else:
                dono[nome] = rel
    if problemas:
        linhas = ['identificador declarado em duas partes:']
        for nome, a, b in problemas:
            linhas.append('    %-22s partes/%s  e  partes/%s' % (nome, a, b))
        linhas.append('  Renomeie um dos dois, ou mova a declaração para uma parte só.')
        erro('\n'.join(linhas))


# ── montagem ─────────────────────────────────────────────────────────────────

def montar():
    css = '\n'.join(ler(c) for c in CSS)
    versao_pol, json_pol = carregar_politica()

    partes_js = []
    for rel in JS:
        txt = ler(rel)
        checar_modulos(rel, txt)
        if '__POLITICA_JSON__' in txt:
            txt = txt.replace('__POLITICA_JSON__', json_pol)
        partes_js.append((rel, txt))
    checar_colisoes(partes_js)

    if '__POLITICA_JSON__' not in ler('js/00-politica.js'):
        erro('js/00-politica.js perdeu o marcador __POLITICA_JSON__.\n'
             '  Sem ele a política vira cópia manual e volta a divergir do core.')

    # banner por parte: mantém o stack trace rastreável até o arquivo de origem
    js = '\n'.join(
        '/* ══ parte: partes/%s ══ */\n%s' % (rel, txt)
        for rel, txt in partes_js
    )

    corpo = ler(CORPO).replace('__LOGO__', ler(LOGO).rstrip('\n'))

    sha = hashlib.sha256(js.encode('utf-8')).hexdigest()[:12]
    carimbo = ('const BUILD = Object.freeze({partes:%d, sha:"%s", em:"%s"});\n'
               % (len(JS), sha, datetime.now(timezone.utc).strftime('%Y-%m-%d')))

    miolo = (CABECA + '<style>\n' + css + '</style>\n\n' + corpo
             + '\n<script>\n' + carimbo + js + '</script>\n')

    completo = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n'
                + CABECA + '<style>\n' + css + '</style>\n</head>\n<body>\n'
                + corpo + '\n<script>\n' + carimbo + js + '</script>\n'
                + '</body>\n</html>\n')

    return miolo, completo, sha


def escrever(caminho, txt):
    with io.open(caminho, 'w', encoding='utf-8', newline='\n') as f:
        f.write(txt)


def main():
    checar = '--check' in sys.argv
    miolo, completo, sha = montar()

    alvos = [
        (os.path.join(RAIZ, 'index.html'), completo),
        (os.path.join(RAIZ, 'artifact-body.html'), miolo),
    ]

    if checar:
        divergiu = []
        for caminho, esperado in alvos:
            if not os.path.exists(caminho):
                divergiu.append('%s não existe' % os.path.basename(caminho))
                continue
            with io.open(caminho, encoding='utf-8') as f:
                atual = f.read()
            # o carimbo de data muda todo dia; compara ignorando a linha dele
            limpa = lambda t: re.sub(r'const BUILD = [^\n]*\n', '', t)
            if limpa(atual) != limpa(esperado):
                divergiu.append('%s difere das partes' % os.path.basename(caminho))
        if divergiu:
            sys.stderr.write(
                '\n  DIVERGÊNCIA: ' + '; '.join(divergiu) + '\n'
                '  O gerado não corresponde a partes/. Alguém editou o HTML\n'
                '  gerado à mão, ou esqueceu de rodar o build. Rode:\n'
                '      python montar.py\n\n')
            sys.exit(1)
        print('ok — index.html e artifact-body.html conferem com partes/')
        return

    for caminho, txt in alvos:
        escrever(caminho, txt)
        print('%-22s %7.1f KB' % (os.path.basename(caminho), len(txt) / 1024))
    print('%d partes de JS · sha %s' % (len(JS), sha))


if __name__ == '__main__':
    main()
