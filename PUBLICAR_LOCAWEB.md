# Publicar o Sistema ECORP na Locaweb

Esta pasta ja possui uma versao compativel com hospedagem comum da Locaweb usando HTML, JavaScript e PHP.

## Arquivos que devem ir para a pasta publica da Locaweb

Envie todo o conteudo da pasta `locaweb-upload` para a pasta publica do site na Locaweb, normalmente:

- `public_html`
- `www`
- `htdocs`
- ou a pasta indicada no Gerenciador de Arquivos da hospedagem.

## Arquivos principais

- `index.html`: abre o sistema diretamente no dominio.
- `integracao-preview.html`: copia da tela principal.
- `.htaccess`: faz o dominio abrir o sistema e redireciona a API.
- `api/operacional.php`: salva e carrega o banco do sistema.
- `api/health.php`: teste da API.
- `data/ecorp-operacional.json`: banco do sistema, criado/atualizado pela API.
- `_ecorp_site_zip/client/public`: modulos de orcamentos, materiais e imagens.

## Testes depois de subir

Abra:

```text
https://www.ecorpsistemas.com.br/api/health
```

Deve aparecer algo parecido com:

```json
{"ok":true,"name":"Sistema ECORP Online","runtime":"locaweb-php"}
```

Depois abra:

```text
https://www.ecorpsistemas.com.br/
```

## DNS

Para ficar realmente pela Locaweb, o dominio `ecorpsistemas.com.br` e `www.ecorpsistemas.com.br` precisam apontar para a hospedagem da Locaweb, nao para o Render.

Se o DNS ainda apontar para `onrender.com` ou IP `216.24.57.*`, o site continua passando pelo Render.
