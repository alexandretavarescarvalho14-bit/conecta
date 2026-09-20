# -*- coding: utf-8 -*-
import io, os, zipfile, zlib

os.makedirs('curriculos', exist_ok=True)

cv = u"""Mariana Costa Albuquerque
Recife - PE · mariana.albuquerque@email.com · (81) 99812-4470

Resumo
Profissional de Recursos Humanos com 8 anos de experiência, sendo os últimos 5 em varejo. Estruturei do zero o processo seletivo de uma rede de 9 lojas e conduzi o ciclo de avaliação de desempenho para 620 pessoas. Busco uma posição de coordenação onde possa montar processo, não só executar.

Experiência

Analista de RH Sênior · Rede Boa Compra · 2021 - atual
- Liderei a implantação do recrutamento e seleção estruturado, reduzindo o tempo de contratação de 34 para 15 dias
- Coordenei o ciclo de avaliação de desempenho com PDI para 620 colaboradores
- Conduzi a pesquisa de clima organizacional anual e o plano de ação por loja
- Apoio ao departamento pessoal em admissão e folha de pagamento

Analista de Recrutamento · Indústria Metalgráfica do Nordeste · 2018 - 2021
- Recrutamento e seleção para posições operacionais e administrativas
- Onboarding e treinamento de integração para novos contratados
- Indicadores de turnover e headcount em Power BI

Competências
Recrutamento e seleção, avaliação de desempenho, clima organizacional, treinamento, Excel avançado, gestão de equipe, people analytics.

Formação
Psicologia · Universidade Federal de Pernambuco · 2017

Preferências
Modelo: presencial ou híbrido, em Recife
Pretensão: R$ 9.500
"""

io.open('curriculos/cv.txt', 'w', encoding='utf-8', newline='\n').write(cv)
io.open('curriculos/cv.md', 'w', encoding='utf-8', newline='\n').write(
    cv.replace('Resumo\n', '## Resumo\n').replace('Experiência\n', '## Experiência\n')
      .replace('Competências\n', '## Competências\n'))

# DOCX mínimo: zip com document.xml em deflate
def xmlesc(t): return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
paras = ''.join('<w:p><w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>' % xmlesc(l) for l in cv.split('\n'))
doc = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
       '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
       + paras + '</w:body></w:document>')
with zipfile.ZipFile('curriculos/cv.docx', 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
    z.writestr('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
    z.writestr('word/document.xml', doc)

# PDF simples com FlateDecode e fonte padrão: o caso que a leitura cobre
BS = chr(92)
def pdfesc(t): return t.replace(BS, BS + BS).replace('(', BS + '(').replace(')', BS + ')')
ops = ['BT', '/F1 10 Tf', '40 800 Td', '12 TL']
for l in cv.split('\n'):
    l2 = l.encode('latin1', 'replace').decode('latin1')
    ops.append('(%s) Tj T*' % pdfesc(l2))
ops.append('ET')
conteudo = '\n'.join(ops).encode('latin1')
comp = zlib.compress(conteudo)

def montar_pdf(objs, nome):
    out = bytearray(b'%PDF-1.4\n'); offs = []
    for i, o in enumerate(objs, 1):
        offs.append(len(out)); out += b'%d 0 obj\n' % i + o + b'\nendobj\n'
    xref = len(out)
    out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1)
    for o in offs: out += b'%010d 00000 n \n' % o
    out += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, xref)
    io.open(nome, 'wb').write(bytes(out))

base = [b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>']
montar_pdf(base + [
    b'<< /Length %d /Filter /FlateDecode >>\nstream\n' % len(comp) + comp + b'\nendstream',
    b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'],
    'curriculos/cv.pdf')

# PDF ilegível: glifos Identity-H em vez de texto. Tem que FALHAR com honestidade.
glifos = b'BT /F1 10 Tf 40 800 Td <0044004500460047> Tj <00480049004a> Tj ET'
comp2 = zlib.compress(glifos)
montar_pdf(base + [
    b'<< /Length %d /Filter /FlateDecode >>\nstream\n' % len(comp2) + comp2 + b'\nendstream',
    b'<< /Type /Font /Subtype /Type0 /BaseFont /ABCDEF+Calibri /Encoding /Identity-H >>'],
    'curriculos/cv-ilegivel.pdf')

# um arquivo que não é currículo
io.open('curriculos/foto.png', 'wb').write(b'\x89PNG\r\n\x1a\n' + b'\x00' * 200)

for f in sorted(os.listdir('curriculos')): print('%-18s %6d bytes' % (f, os.path.getsize('curriculos/' + f)))
