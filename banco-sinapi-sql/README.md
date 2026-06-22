# ETL SINAPI SP/PR para PostgreSQL

Este pacote transforma os XLSX do SINAPI em tabelas PostgreSQL para uso no Codex e no sistema de orçamento.

## 1. Instalação

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows

pip install -r requirements.txt
```

## 2. Banco

Crie um banco PostgreSQL, por exemplo:

```sql
CREATE DATABASE ecorp_sinapi;
```

Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

## 3. Pasta de dados

Crie uma pasta chamada `data` ao lado do script e coloque os XLSX:

```text
data/
├── SINAPI_Preco_Ref_Insumos_SP_202412_NaoDesonerado.xlsx
├── SINAPI_Preco_Ref_Insumos_PR_202412_NaoDesonerado.xlsx
├── SINAPI_Custo_Ref_Composicoes_Analitico_SP_202412_NaoDesonerado.xlsx
├── SINAPI_Custo_Ref_Composicoes_Analitico_PR_202412_NaoDesonerado.xlsx
├── SINAPI_Custo_Ref_Composicoes_Sintetico_PR_202412_NaoDesonerado.xlsx
└── _SINAPI_Relatório_Família_de_Insumos_2024_12.xlsx
```

## 4. Rodar

```bash
python etl_sinapi.py
```

## 5. Consultas úteis

Buscar insumo:

```sql
SELECT *
FROM sinapi.vw_insumos_resumo
WHERE uf = 'PR'
  AND descricao ILIKE '%ACO CA-50%';
```

Buscar composição:

```sql
SELECT *
FROM sinapi.vw_composicoes_resumo
WHERE uf = 'SP'
  AND descricao ILIKE '%REBOCO%';
```

Abrir composição:

```sql
SELECT *
FROM sinapi.vw_composicao_aberta
WHERE uf = 'PR'
  AND composicao_codigo = '97141';
```

## Observação importante

O importador analítico foi feito para ler o XLSX no layout de relatório do SINAPI. Se a CAIXA mudar o layout das colunas, talvez seja necessário ajustar a função `import_composicoes_analiticas_text_layout`.