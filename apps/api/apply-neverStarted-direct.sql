-- Aplicar migração do campo neverStarted diretamente
-- Execute: sqlite3 /root/1001div/database.sqlite < apps/api/apply-neverStarted-direct.sql

-- Verificar se coluna já existe (não gera erro se já existir)
-- SQLite não suporta IF NOT EXISTS em ALTER TABLE, então vamos tentar criar

-- Adicionar coluna (pode gerar erro se já existir, mas isso é OK)
ALTER TABLE sas_campaigns ADD COLUMN neverStarted INTEGER NOT NULL DEFAULT 0;

-- Criar índice (IF NOT EXISTS é suportado aqui)
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_neverStarted ON sas_campaigns(neverStarted);

-- Normalizar valores NULL para 0 (caso existam)
UPDATE sas_campaigns SET neverStarted = 0 WHERE neverStarted IS NULL;

