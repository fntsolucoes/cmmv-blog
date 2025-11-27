-- Script para corrigir a constraint NOT NULL na coluna sellerDomain
-- Execute este script ANTES de reiniciar o servidor

-- 1. Primeiro, garantir que todos os registros existentes tenham um valor para sellerDomain
UPDATE sas_campaigns 
SET sellerDomain = '' 
WHERE sellerDomain IS NULL OR sellerDomain = '';

-- 2. Verificar se há registros sem sellerDomain
SELECT COUNT(*) as total_sem_dominio 
FROM sas_campaigns 
WHERE sellerDomain IS NULL OR sellerDomain = '';

-- 3. Se necessário, remover a constraint NOT NULL temporariamente e recriar
-- (SQLite não suporta MODIFY COLUMN diretamente, então precisamos recriar a tabela)

-- Passo 1: Criar nova tabela sem NOT NULL (temporariamente)
CREATE TABLE sas_campaigns_new (
    id TEXT PRIMARY KEY,
    commercialPartnerId TEXT NOT NULL,
    sellerDomain TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT,
    script TEXT,
    scriptStatus TEXT,
    weighting REAL,
    link TEXT,
    linkStatus TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT,
    deletedAt TEXT
);

-- Passo 2: Copiar dados existentes, garantindo que sellerDomain tenha valor
INSERT INTO sas_campaigns_new 
SELECT 
    id,
    commercialPartnerId,
    COALESCE(sellerDomain, '') as sellerDomain,
    name,
    startDate,
    endDate,
    script,
    scriptStatus,
    weighting,
    link,
    linkStatus,
    active,
    createdAt,
    updatedAt,
    deletedAt
FROM sas_campaigns;

-- Passo 3: Remover tabela antiga
DROP TABLE sas_campaigns;

-- Passo 4: Renomear nova tabela
ALTER TABLE sas_campaigns_new RENAME TO sas_campaigns;

-- Passo 5: Recriar índices (se necessário)
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_commercialPartnerId ON sas_campaigns(commercialPartnerId);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_sellerDomain ON sas_campaigns(sellerDomain);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_name ON sas_campaigns(name);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_startDate ON sas_campaigns(startDate);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_endDate ON sas_campaigns(endDate);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_scriptStatus ON sas_campaigns(scriptStatus);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_weighting ON sas_campaigns(weighting);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_linkStatus ON sas_campaigns(linkStatus);
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_active ON sas_campaigns(active);

