"""
ETL SINAPI SP/PR 12/2024 -> PostgreSQL

Uso:
1) Coloque os XLSX do SINAPI na pasta ./data
2) Configure o arquivo .env
3) Rode:
   python etl_sinapi.py

Arquivos esperados:
- SINAPI_Preco_Ref_Insumos_SP_202412_NaoDesonerado.xlsx
- SINAPI_Preco_Ref_Insumos_PR_202412_NaoDesonerado.xlsx
- SINAPI_Custo_Ref_Composicoes_Analitico_SP_202412_NaoDesonerado.xlsx
- SINAPI_Custo_Ref_Composicoes_Analitico_PR_202412_NaoDesonerado.xlsx
- SINAPI_Custo_Ref_Composicoes_Sintetico_PR_202412_NaoDesonerado.xlsx
- _SINAPI_Relatório_Família_de_Insumos_2024_12.xlsx
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from decimal import Decimal, InvalidOperation
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


UF_CONFIG = {
    "SP": {
        "nome": "São Paulo",
        "localidade": "SAO PAULO",
        "mes_coleta": "2024-12-01",
        "data_rt": "2025-01-13",
        "encargo_horista": 115.54,
        "encargo_mensalista": 71.46,
        "insumos": "SINAPI_Preco_Ref_Insumos_SP_202412_NaoDesonerado.xlsx",
        "analitico": "SINAPI_Custo_Ref_Composicoes_Analitico_SP_202412_NaoDesonerado.xlsx",
        "sintetico": None,
    },
    "PR": {
        "nome": "Paraná",
        "localidade": "CURITIBA",
        "mes_coleta": "2024-12-01",
        "data_rt": "2025-01-13",
        "encargo_horista": 117.57,
        "encargo_mensalista": 73.10,
        "insumos": "SINAPI_Preco_Ref_Insumos_PR_202412_NaoDesonerado.xlsx",
        "analitico": "SINAPI_Custo_Ref_Composicoes_Analitico_PR_202412_NaoDesonerado.xlsx",
        "sintetico": "SINAPI_Custo_Ref_Composicoes_Sintetico_PR_202412_NaoDesonerado.xlsx",
    },
}


def clean_text(value) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def to_decimal(value) -> Optional[Decimal]:
    if value is None or pd.isna(value):
        return None
    txt = str(value).strip()
    if not txt:
        return None
    txt = txt.replace(".", "").replace(",", ".") if "," in txt else txt
    txt = re.sub(r"[^0-9\.\-]", "", txt)
    if not txt:
        return None
    try:
        return Decimal(txt)
    except InvalidOperation:
        return None


def normalize_codigo(value) -> str:
    txt = clean_text(value)
    txt = re.sub(r"\.0$", "", txt)
    return txt.zfill(8) if txt.isdigit() and len(txt) < 8 else txt


def get_engine():
    load_dotenv(BASE_DIR / ".env")
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("Configure DATABASE_URL no arquivo .env")
    return create_engine(url, pool_pre_ping=True)


SCHEMA_SQL = """
CREATE SCHEMA IF NOT EXISTS sinapi;

CREATE TABLE IF NOT EXISTS sinapi.estados (
    uf CHAR(2) PRIMARY KEY,
    nome VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS sinapi.referencias (
    id BIGSERIAL PRIMARY KEY,
    uf CHAR(2) NOT NULL REFERENCES sinapi.estados(uf),
    mes_coleta DATE NOT NULL,
    data_referencia_tecnica DATE NULL,
    nivel_preco VARCHAR(40),
    encargos_regime VARCHAR(40),
    encargo_horista_percentual NUMERIC(10,4),
    encargo_mensalista_percentual NUMERIC(10,4),
    fonte_arquivo TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (uf, mes_coleta, encargos_regime, nivel_preco)
);

CREATE TABLE IF NOT EXISTS sinapi.familias_insumos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(30),
    descricao TEXT NOT NULL,
    UNIQUE (codigo, descricao)
);

CREATE TABLE IF NOT EXISTS sinapi.insumos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    unidade VARCHAR(20),
    preco_median NUMERIC(14,4),
    origem_preco VARCHAR(10),
    familia_id BIGINT REFERENCES sinapi.familias_insumos(id),
    uf CHAR(2) NOT NULL REFERENCES sinapi.estados(uf),
    referencia_id BIGINT REFERENCES sinapi.referencias(id),
    ativo BOOLEAN DEFAULT TRUE,
    UNIQUE (codigo, uf, referencia_id)
);

CREATE TABLE IF NOT EXISTS sinapi.composicoes (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    unidade VARCHAR(20),
    custo_total NUMERIC(14,4),
    origem_preco VARCHAR(10),
    uf CHAR(2) NOT NULL REFERENCES sinapi.estados(uf),
    referencia_id BIGINT REFERENCES sinapi.referencias(id),
    vinculo VARCHAR(120),
    classe_codigo VARCHAR(30),
    classe_descricao TEXT,
    tipo_codigo VARCHAR(30),
    tipo_descricao TEXT,
    custo_equipamento NUMERIC(14,4),
    perc_equipamento NUMERIC(12,6),
    custo_material NUMERIC(14,4),
    perc_material NUMERIC(12,6),
    custo_mao_obra NUMERIC(14,4),
    perc_mao_obra NUMERIC(12,6),
    ativo BOOLEAN DEFAULT TRUE,
    UNIQUE (codigo, uf, referencia_id)
);

CREATE TABLE IF NOT EXISTS sinapi.composicao_itens (
    id BIGSERIAL PRIMARY KEY,
    composicao_id BIGINT NOT NULL REFERENCES sinapi.composicoes(id) ON DELETE CASCADE,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('C','I')),
    item_codigo VARCHAR(20) NOT NULL,
    item_descricao TEXT NOT NULL,
    unidade VARCHAR(20),
    origem_preco VARCHAR(10),
    coeficiente NUMERIC(18,8),
    preco_unitario NUMERIC(14,4),
    custo_total NUMERIC(14,4),
    ordem INTEGER
);

CREATE INDEX IF NOT EXISTS idx_insumos_codigo ON sinapi.insumos (codigo);
CREATE INDEX IF NOT EXISTS idx_composicoes_codigo ON sinapi.composicoes (codigo);
CREATE INDEX IF NOT EXISTS idx_comp_itens_item ON sinapi.composicao_itens (item_codigo, tipo);
CREATE INDEX IF NOT EXISTS idx_comp_itens_comp ON sinapi.composicao_itens (composicao_id);

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE VIEW sinapi.vw_insumos_resumo AS
SELECT i.codigo, i.descricao, i.unidade, i.preco_median AS preco, i.origem_preco,
       i.uf, r.mes_coleta, r.encargos_regime
FROM sinapi.insumos i
LEFT JOIN sinapi.referencias r ON r.id = i.referencia_id;

CREATE OR REPLACE VIEW sinapi.vw_composicoes_resumo AS
SELECT c.codigo, c.descricao, c.unidade, c.custo_total, c.origem_preco,
       c.uf, r.mes_coleta, r.encargos_regime,
       c.custo_material, c.custo_mao_obra, c.custo_equipamento
FROM sinapi.composicoes c
LEFT JOIN sinapi.referencias r ON r.id = c.referencia_id;

CREATE OR REPLACE VIEW sinapi.vw_composicao_aberta AS
SELECT c.codigo AS composicao_codigo,
       c.descricao AS composicao_descricao,
       c.unidade AS composicao_unidade,
       c.custo_total AS composicao_custo_total,
       c.uf,
       r.mes_coleta,
       ci.tipo,
       ci.item_codigo,
       ci.item_descricao,
       ci.unidade AS item_unidade,
       ci.coeficiente,
       ci.preco_unitario,
       ci.custo_total AS item_custo_total
FROM sinapi.composicoes c
JOIN sinapi.composicao_itens ci ON ci.composicao_id = c.id
LEFT JOIN sinapi.referencias r ON r.id = c.referencia_id;
"""


def setup_database(engine):
    with engine.begin() as conn:
        conn.execute(text(SCHEMA_SQL))
        for uf, cfg in UF_CONFIG.items():
            conn.execute(
                text("INSERT INTO sinapi.estados (uf, nome) VALUES (:uf, :nome) ON CONFLICT (uf) DO UPDATE SET nome = EXCLUDED.nome"),
                {"uf": uf, "nome": cfg["nome"]},
            )


def upsert_referencia(engine, uf: str, fonte: str) -> int:
    cfg = UF_CONFIG[uf]
    with engine.begin() as conn:
        row = conn.execute(
            text("""
                INSERT INTO sinapi.referencias
                (uf, mes_coleta, data_referencia_tecnica, nivel_preco, encargos_regime,
                 encargo_horista_percentual, encargo_mensalista_percentual, fonte_arquivo)
                VALUES (:uf, :mes, :rt, 'MEDIANO', 'NAO_DESONERADO', :eh, :em, :fonte)
                ON CONFLICT (uf, mes_coleta, encargos_regime, nivel_preco)
                DO UPDATE SET
                    data_referencia_tecnica = EXCLUDED.data_referencia_tecnica,
                    encargo_horista_percentual = EXCLUDED.encargo_horista_percentual,
                    encargo_mensalista_percentual = EXCLUDED.encargo_mensalista_percentual,
                    fonte_arquivo = EXCLUDED.fonte_arquivo
                RETURNING id
            """),
            {
                "uf": uf,
                "mes": cfg["mes_coleta"],
                "rt": cfg["data_rt"],
                "eh": cfg["encargo_horista"],
                "em": cfg["encargo_mensalista"],
                "fonte": fonte,
            },
        ).fetchone()
        return int(row[0])


def find_header_row(df: pd.DataFrame, required_terms: list[str], max_scan: int = 30) -> int:
    for idx in range(min(max_scan, len(df))):
        values = " ".join(clean_text(x).upper() for x in df.iloc[idx].tolist())
        if all(term.upper() in values for term in required_terms):
            return idx
    return 0


def import_insumos(engine, uf: str):
    cfg = UF_CONFIG[uf]
    path = DATA_DIR / cfg["insumos"]
    if not path.exists():
        print(f"[AVISO] Arquivo de insumos não encontrado: {path.name}")
        return

    ref_id = upsert_referencia(engine, uf, path.name)

    raw = pd.read_excel(path, header=None, dtype=str)
    header_row = find_header_row(raw, ["Código", "Descri", "Unid", "Preço"])
    df = pd.read_excel(path, header=header_row, dtype=str)
    df.columns = [clean_text(c).lower() for c in df.columns]

    col_codigo = next(c for c in df.columns if "código" in c or "codigo" in c)
    col_desc = next(c for c in df.columns if "descr" in c)
    col_unid = next(c for c in df.columns if "unid" in c)
    col_preco = next(c for c in df.columns if "preço" in c or "preco" in c)
    col_origem = next((c for c in df.columns if "origem" in c), None)

    records = []
    for _, r in df.iterrows():
        codigo = normalize_codigo(r.get(col_codigo))
        descricao = clean_text(r.get(col_desc))
        if not codigo or not codigo[:1].isdigit() or not descricao:
            continue
        records.append({
            "codigo": codigo,
            "descricao": descricao,
            "unidade": clean_text(r.get(col_unid)),
            "preco_median": to_decimal(r.get(col_preco)),
            "origem_preco": clean_text(r.get(col_origem)) if col_origem else None,
            "uf": uf,
            "referencia_id": ref_id,
        })

    if not records:
        print(f"[AVISO] Nenhum insumo importado para {uf}")
        return

    sql = text("""
        INSERT INTO sinapi.insumos
        (codigo, descricao, unidade, preco_median, origem_preco, uf, referencia_id)
        VALUES (:codigo, :descricao, :unidade, :preco_median, :origem_preco, :uf, :referencia_id)
        ON CONFLICT (codigo, uf, referencia_id)
        DO UPDATE SET
            descricao = EXCLUDED.descricao,
            unidade = EXCLUDED.unidade,
            preco_median = EXCLUDED.preco_median,
            origem_preco = EXCLUDED.origem_preco,
            ativo = TRUE
    """)
    with engine.begin() as conn:
        conn.execute(sql, records)
    print(f"[OK] Insumos {uf}: {len(records)} registros")


def import_composicoes_sinteticas(engine, uf: str):
    cfg = UF_CONFIG[uf]
    path_name = cfg.get("sintetico")
    if not path_name:
        return
    path = DATA_DIR / path_name
    if not path.exists():
        print(f"[AVISO] Sintético não encontrado: {path.name}")
        return

    ref_id = upsert_referencia(engine, uf, path.name)
    raw = pd.read_excel(path, header=None, dtype=str)
    header_row = find_header_row(raw, ["CÓDIGO", "DESCRI", "UNIDADE", "CUSTO"])
    df = pd.read_excel(path, header=header_row, dtype=str)
    df.columns = [clean_text(c).lower() for c in df.columns]

    col_codigo = next(c for c in df.columns if "código" in c or "codigo" in c)
    col_desc = next(c for c in df.columns if "descr" in c)
    col_unid = next(c for c in df.columns if "unidade" in c)
    col_custo = next(c for c in df.columns if "custo" in c)
    col_origem = next((c for c in df.columns if "origem" in c), None)

    records = []
    for _, r in df.iterrows():
        codigo = normalize_codigo(r.get(col_codigo))
        descricao = clean_text(r.get(col_desc))
        if not codigo or not codigo[:1].isdigit() or not descricao:
            continue
        records.append({
            "codigo": codigo,
            "descricao": descricao,
            "unidade": clean_text(r.get(col_unid)),
            "custo_total": to_decimal(r.get(col_custo)),
            "origem_preco": clean_text(r.get(col_origem)) if col_origem else None,
            "uf": uf,
            "referencia_id": ref_id,
        })

    if not records:
        print(f"[AVISO] Nenhuma composição sintética importada para {uf}")
        return

    sql = text("""
        INSERT INTO sinapi.composicoes
        (codigo, descricao, unidade, custo_total, origem_preco, uf, referencia_id)
        VALUES (:codigo, :descricao, :unidade, :custo_total, :origem_preco, :uf, :referencia_id)
        ON CONFLICT (codigo, uf, referencia_id)
        DO UPDATE SET
            descricao = EXCLUDED.descricao,
            unidade = EXCLUDED.unidade,
            custo_total = EXCLUDED.custo_total,
            origem_preco = EXCLUDED.origem_preco,
            ativo = TRUE
    """)
    with engine.begin() as conn:
        conn.execute(sql, records)
    print(f"[OK] Composições sintéticas {uf}: {len(records)} registros")


def import_composicoes_analiticas_text_layout(engine, uf: str):
    """
    Importador para XLSX analítico exportado no mesmo layout do relatório PDF.
    Ele lê linhas sequenciais e identifica:
    - cabeçalho de composição: linha que começa com código numérico e descrição
    - item da composição: linha que começa com C ou I e código do item
    - total da composição: linha com TOTAL COMPOSIÇÃO
    """
    cfg = UF_CONFIG[uf]
    path = DATA_DIR / cfg["analitico"]
    if not path.exists():
        print(f"[AVISO] Analítico não encontrado: {path.name}")
        return

    ref_id = upsert_referencia(engine, uf, path.name)
    df = pd.read_excel(path, header=None, dtype=str).fillna("")

    current = None
    compositions = {}
    items_by_comp = {}

    def row_text(row):
        return [clean_text(x) for x in row.tolist()]

    for _, row in df.iterrows():
        vals = row_text(row)
        joined = " ".join(vals)
        if not joined:
            continue

        if "TOTAL COMPOSIÇÃO" in joined.upper() and current:
            nums = re.findall(r"\d+,\d+|\d+\.\d+|\d+", joined)
            if nums:
                current["custo_total"] = to_decimal(nums[0])
            compositions[current["codigo"]] = current
            continue

        # Linha de composição: código com 5 dígitos ou mais no início da linha
        first_numbers = [v for v in vals[:4] if re.fullmatch(r"\d{4,8}", v)]
        if first_numbers and not vals[0].upper() in ("C", "I"):
            codigo = normalize_codigo(first_numbers[0])
            desc_parts = [v for v in vals if v and v != first_numbers[0]]
            descricao = clean_text(" ".join(desc_parts))
            if descricao and len(descricao) > 15:
                current = {
                    "codigo": codigo,
                    "descricao": descricao,
                    "unidade": None,
                    "custo_total": None,
                    "origem_preco": None,
                    "uf": uf,
                    "referencia_id": ref_id,
                }
                items_by_comp.setdefault(codigo, [])
            continue

        # Linha de item: C/I + código
        if current and vals[0].upper() in ("C", "I"):
            tipo = vals[0].upper()
            codigo_item = None
            for v in vals[1:4]:
                if re.fullmatch(r"\d{1,8}", v):
                    codigo_item = normalize_codigo(v)
                    break
            if not codigo_item:
                continue

            nums = []
            for v in vals:
                d = to_decimal(v)
                if d is not None:
                    nums.append(d)

            # Os últimos números normalmente são coeficiente, preço unitário e custo total
            coef = nums[-3] if len(nums) >= 3 else None
            preco = nums[-2] if len(nums) >= 2 else None
            custo = nums[-1] if len(nums) >= 1 else None

            desc = " ".join(v for v in vals if v not in (tipo, codigo_item) and not re.fullmatch(r"\d{1,8}", v))
            desc = re.sub(r"\b(C|CR|AS|RE)\b\s+\d+[,.]\d+.*$", "", desc).strip()

            items_by_comp[current["codigo"]].append({
                "tipo": tipo,
                "item_codigo": codigo_item,
                "item_descricao": desc,
                "unidade": None,
                "origem_preco": None,
                "coeficiente": coef,
                "preco_unitario": preco,
                "custo_total": custo,
                "ordem": len(items_by_comp[current["codigo"]]) + 1,
            })

    if not compositions:
        print(f"[AVISO] Nenhuma composição analítica identificada para {uf}. Verifique o layout do XLSX.")
        return

    comp_sql = text("""
        INSERT INTO sinapi.composicoes
        (codigo, descricao, unidade, custo_total, origem_preco, uf, referencia_id)
        VALUES (:codigo, :descricao, :unidade, :custo_total, :origem_preco, :uf, :referencia_id)
        ON CONFLICT (codigo, uf, referencia_id)
        DO UPDATE SET
            descricao = EXCLUDED.descricao,
            custo_total = COALESCE(EXCLUDED.custo_total, sinapi.composicoes.custo_total),
            ativo = TRUE
        RETURNING id, codigo
    """)

    item_sql = text("""
        INSERT INTO sinapi.composicao_itens
        (composicao_id, tipo, item_codigo, item_descricao, unidade, origem_preco,
         coeficiente, preco_unitario, custo_total, ordem)
        VALUES (:composicao_id, :tipo, :item_codigo, :item_descricao, :unidade, :origem_preco,
                :coeficiente, :preco_unitario, :custo_total, :ordem)
    """)

    total_items = 0
    with engine.begin() as conn:
        for comp in compositions.values():
            row = conn.execute(comp_sql, comp).fetchone()
            comp_id = int(row[0])
            conn.execute(text("DELETE FROM sinapi.composicao_itens WHERE composicao_id = :id"), {"id": comp_id})
            item_records = []
            for item in items_by_comp.get(comp["codigo"], []):
                item["composicao_id"] = comp_id
                item_records.append(item)
            if item_records:
                conn.execute(item_sql, item_records)
                total_items += len(item_records)

    print(f"[OK] Composições analíticas {uf}: {len(compositions)} composições, {total_items} itens")


def main():
    engine = get_engine()
    setup_database(engine)

    for uf in ("SP", "PR"):
        import_insumos(engine, uf)
        import_composicoes_sinteticas(engine, uf)
        import_composicoes_analiticas_text_layout(engine, uf)

    print("[FINALIZADO] ETL SINAPI concluído.")


if __name__ == "__main__":
    main()