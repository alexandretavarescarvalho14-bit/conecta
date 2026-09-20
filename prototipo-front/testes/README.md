# Currículos de teste

Cinco arquivos para exercitar a importação de currículo do protótipo.

| arquivo | o que testa |
|---|---|
| cv.txt, cv.md | leitura direta de texto |
| cv.docx | zip com XML, descompactado no navegador |
| cv.pdf | PDF não é aceito nesta versão: deve recusar com a mensagem orientando exportar como DOCX, antes mesmo de tentar ler o conteúdo |
| foto.png | formato não aceito: deve recusar antes de abrir |

O mesmo currículo fictício está em TXT, MD e DOCX, para conferir que os
três produzem o mesmo perfil sugerido.

Regenerar: `python gerar_curriculos.py` de dentro desta pasta.
