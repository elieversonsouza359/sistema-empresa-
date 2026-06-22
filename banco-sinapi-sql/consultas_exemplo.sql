-- Exemplos para o Codex usar

-- 1. Comparar preço de um insumo em SP e PR
SELECT uf, codigo, descricao, unidade, preco
FROM sinapi.vw_insumos_resumo
WHERE codigo = '00000034'
ORDER BY uf;

-- 2. Buscar serviços de pintura
SELECT uf, codigo, descricao, unidade, custo_total
FROM sinapi.vw_composicoes_resumo
WHERE unaccent(descricao) ILIKE unaccent('%pintura%')
ORDER BY uf, custo_total;

-- 3. Abrir uma composição
SELECT *
FROM sinapi.vw_composicao_aberta
WHERE uf = 'PR'
  AND composicao_codigo = '97141'
ORDER BY item_codigo;

-- 4. Buscar por reboco/massa única
SELECT uf, codigo, descricao, unidade, custo_total
FROM sinapi.vw_composicoes_resumo
WHERE unaccent(descricao) ILIKE unaccent('%massa unica%')
   OR unaccent(descricao) ILIKE unaccent('%reboco%')
ORDER BY uf, custo_total;