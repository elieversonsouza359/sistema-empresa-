# Publicar o Sistema ECORP Online

Esta versao ja pode rodar como um website usando Node.js.

## Como testar no seu computador

1. Abra o terminal na pasta:

```bash
C:\Users\User\Documents\SISTEMA ECORP
```

2. Rode:

```bash
npm start
```

3. Abra no navegador:

```text
http://127.0.0.1:8765/
```

Se a porta `8765` estiver ocupada, o servidor usa a proxima porta livre e mostra o endereco no terminal.

## O que mudou

- A tela principal abre em `/`.
- Orçamentos e Materiais continuam integrados.
- O banco operacional passa a sincronizar em:

```text
data/ecorp-operacional.json
```

Isso guarda online:

- funcionarios;
- obras;
- pontos;
- controle de obra;
- acessos de cliente;
- gastos, projetos e fotos cadastradas no controle de obra.

Quando abrir o sistema como arquivo `file:///`, ele continua funcionando pelo navegador. Quando abrir por `http://`, ele salva no banco do servidor.

## Como subir em uma hospedagem

Use uma hospedagem que aceite Node.js, como Render, Railway, VPS, Hostinger VPS ou Locaweb VPS.

Configure:

```text
Build command: npm install
Start command: npm start
```

Variavel opcional:

```text
PORT=8765
```

Em plataformas como Render/Railway, a propria hospedagem define a porta automaticamente.

## Arquivos importantes

- `server-online.mjs`: servidor do website e API.
- `integracao-preview.html`: sistema principal.
- `_ecorp_site_zip/client/public/orcamentos`: modulo de orçamentos.
- `_ecorp_site_zip/client/public/materiais`: modulo de materiais.
- `data/ecorp-operacional.json`: banco gerado automaticamente.

## Proximo passo recomendado

Para uso profissional com muitos usuarios e arquivos grandes, o ideal e evoluir este banco JSON para PostgreSQL e armazenar PDFs/fotos em storage online. Esta versao ja deixa o sistema publicavel e centraliza os dados principais no servidor.
