-- Script para garantir que a coluna name da tabela sas_tags aceite NULL
-- Execute antes de reiniciar o servidor

-- 1. Atualizar registros existentes para nome padrão
UPDATE sas_tags
SET name = NULL
WHERE name = '';

-- 2. Criar tabela temporária com esquema corrigido
CREATE TABLE sas_tags_new (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    scriptSettingId TEXT,
    campaignIds TEXT,
    generatedScript TEXT,
    generatedCode TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT,
    deletedAt TEXT
);

-- 3. Copiar dados mantendo NULL em name
INSERT INTO sas_tags_new
SELECT
    id,
    NULLIF(name, '') as name,
    description,
    scriptSettingId,
    campaignIds,
    generatedScript,
    generatedCode,
    active,
    createdAt,
    updatedAt,
    deletedAt
FROM sas_tags;

-- 4. Substituir a tabela antiga
DROP TABLE sas_tags;
ALTER TABLE sas_tags_new RENAME TO sas_tags;

-- 5. Recriar índices necessários
CREATE INDEX IF NOT EXISTS idx_sas_tags_scriptSettingId ON sas_tags(scriptSettingId);
CREATE INDEX IF NOT EXISTS idx_sas_tags_active ON sas_tags(active);

