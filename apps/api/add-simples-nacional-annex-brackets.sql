-- Faixas de RBT12 e aliquotas do Simples Nacional (Anexos I a V)
-- Para consulta pelo motor de tributos no regime Simples Nacional
CREATE TABLE IF NOT EXISTS sas_simples_nacional_annex_brackets (
    id TEXT PRIMARY KEY,
    annex_code TEXT NOT NULL,
    annex_name TEXT,
    faixa INTEGER NOT NULL,
    rbt12_limit REAL NOT NULL,
    nominal_rate_percent REAL NOT NULL,
    parcel_to_deduct REAL NOT NULL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_simples_annex_code ON sas_simples_nacional_annex_brackets(annex_code);
CREATE INDEX IF NOT EXISTS idx_simples_annex_faixa ON sas_simples_nacional_annex_brackets(annex_code, faixa);
CREATE UNIQUE INDEX IF NOT EXISTS idx_simples_annex_faixa_unique ON sas_simples_nacional_annex_brackets(annex_code, faixa);
