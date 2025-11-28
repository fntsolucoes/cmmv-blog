-- Script para verificar os dados das tags no banco de dados
-- Execute: sqlite3 database.sqlite < verify-tags-data.sql

-- 1. Verificar todas as tags e seus campos críticos
SELECT '=== TODAS AS TAGS COM CAMPOS CRÍTICOS ===' as info;
SELECT 
    id,
    name,
    scriptSettingId,
    campaignIds,
    generatedCode,
    CASE 
        WHEN generatedScript IS NULL THEN 'NULL'
        WHEN generatedScript = '' THEN 'VAZIO'
        ELSE 'PRESENTE (' || LENGTH(generatedScript) || ' chars)'
    END as generatedScript_status,
    scriptStatus,
    active,
    createdAt,
    updatedAt
FROM sas_tags
ORDER BY createdAt DESC;

-- 2. Contar tags com e sem scriptSettingId
SELECT '=== ESTATÍSTICAS ===' as info;
SELECT 
    COUNT(*) as total_tags,
    SUM(CASE WHEN scriptSettingId IS NOT NULL AND scriptSettingId != '' THEN 1 ELSE 0 END) as com_scriptSettingId,
    SUM(CASE WHEN campaignIds IS NOT NULL AND campaignIds != '' THEN 1 ELSE 0 END) as com_campaignIds,
    SUM(CASE WHEN generatedCode IS NOT NULL AND generatedCode != '' THEN 1 ELSE 0 END) as com_generatedCode,
    SUM(CASE WHEN generatedScript IS NOT NULL AND generatedScript != '' THEN 1 ELSE 0 END) as com_generatedScript
FROM sas_tags;

-- 3. Mostrar tags que estão sem dados críticos
SELECT '=== TAGS SEM DADOS CRÍTICOS ===' as info;
SELECT 
    id,
    createdAt,
    CASE 
        WHEN scriptSettingId IS NULL OR scriptSettingId = '' THEN 'SEM scriptSettingId'
        ELSE 'OK'
    END as scriptSettingId_status,
    CASE 
        WHEN campaignIds IS NULL OR campaignIds = '' THEN 'SEM campaignIds'
        ELSE 'OK'
    END as campaignIds_status,
    CASE 
        WHEN generatedCode IS NULL OR generatedCode = '' THEN 'SEM generatedCode'
        ELSE 'OK'
    END as generatedCode_status
FROM sas_tags
WHERE (scriptSettingId IS NULL OR scriptSettingId = '')
   OR (campaignIds IS NULL OR campaignIds = '')
   OR (generatedCode IS NULL OR generatedCode = '');


