# Currículos de teste

Seis arquivos para exercitar a importação de currículo do protótipo.
O mesmo currículo fictício em quatro formatos que a extração lê, mais
dois casos que têm de falhar com honestidade.

| arquivo | o que testa |
|---|---|
| cv.txt, cv.md | leitura direta de texto |
| cv.docx | zip com XML, descompactado no navegador |
| cv.pdf | PDF com fonte padrão e FlateDecode |
| cv-ilegivel.pdf | PDF com fonte de codificação própria: deve falhar e oferecer colar o texto |
| foto.png | formato não aceito: deve recusar antes de abrir |

Regenerar: `python gerar_curriculos.py` de dentro desta pasta.
