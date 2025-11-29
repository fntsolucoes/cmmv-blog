-- Adiciona a coluna neverStarted na tabela sas_campaigns
-- Esta flag marca se uma campanha nunca foi iniciada
-- Valor padrão: true (assume que novas campanhas nunca foram iniciadas)
-- SQLite trata BOOLEAN como INTEGER (0 = false, 1 = true)

ALTER TABLE sas_campaigns ADD COLUMN neverStarted INTEGER NOT NULL DEFAULT 1;

-- Criar índice para melhorar performance em consultas que filtram por esta flag
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_neverStarted ON sas_campaigns(neverStarted);

