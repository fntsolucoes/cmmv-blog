-- Migração de dados: Normalizar valores do campo neverStarted
-- Este script garante que todos os valores estejam no formato correto (0 ou 1)
-- É executado automaticamente pelo sistema de migrações

-- 1. Corrigir valores NULL para 0 (false)
-- Campanhas antigas que não tinham esse campo devem ser marcadas como não pendentes
UPDATE sas_campaigns
SET neverStarted = 0
WHERE neverStarted IS NULL;

-- 2. Garantir que valores estejam normalizados (0 ou 1)
-- Qualquer valor diferente de 0 será convertido para 1
UPDATE sas_campaigns
SET neverStarted = 1
WHERE neverStarted NOT IN (0, 1) AND neverStarted IS NOT NULL;
