-- Script SIMPLES para corrigir a constraint NOT NULL na coluna sellerDomain
-- Execute este script ANTES de reiniciar o servidor

-- 1. Primeiro, garantir que todos os registros existentes tenham um valor para sellerDomain
UPDATE sas_campaigns 
SET sellerDomain = '' 
WHERE sellerDomain IS NULL OR sellerDomain = '';

-- 2. Verificar quantos registros foram atualizados
SELECT COUNT(*) as total_atualizados 
FROM sas_campaigns 
WHERE sellerDomain = '';

-- 3. Verificar estrutura atual da tabela
PRAGMA table_info(sas_campaigns);

