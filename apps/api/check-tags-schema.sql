-- Script de diagnóstico para verificar o schema da tabela sas_tags
-- Execute: sqlite3 database.sqlite < check-tags-schema.sql

-- 1. Verificar estrutura da tabela
SELECT '=== ESTRUTURA DA TABELA sas_tags ===' as info;
PRAGMA table_info(sas_tags);

-- 2. Verificar se a coluna scriptStatus existe
SELECT '=== VERIFICANDO COLUNA scriptStatus ===' as info;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Coluna scriptStatus EXISTE'
        ELSE '❌ Coluna scriptStatus NÃO EXISTE'
    END as status
FROM pragma_table_info('sas_tags')
WHERE name = 'scriptStatus';

-- 3. Verificar índices
SELECT '=== ÍNDICES DA TABELA ===' as info;
SELECT name, sql FROM sqlite_master 
WHERE type='index' AND tbl_name='sas_tags';

-- 4. Contar registros
SELECT '=== CONTAGEM DE REGISTROS ===' as info;
SELECT COUNT(*) as total_tags FROM sas_tags;

-- 5. Verificar registros recentes (últimos 5)
SELECT '=== ÚLTIMOS 5 REGISTROS ===' as info;
SELECT 
    id,
    name,
    scriptSettingId,
    generatedCode,
    scriptStatus,
    active,
    createdAt,
    updatedAt
FROM sas_tags
ORDER BY createdAt DESC
LIMIT 5;

-- 6. Verificar se há registros sem scriptStatus
SELECT '=== REGISTROS SEM scriptStatus ===' as info;
SELECT COUNT(*) as total_sem_status
FROM sas_tags
WHERE scriptStatus IS NULL;


