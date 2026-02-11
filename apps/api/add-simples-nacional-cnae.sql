-- CNAEs permitidos no Simples Nacional e respectivo anexo (I a VI)
-- Relacionar com sas_simples_nacional_annex_brackets por annex_code para consulta de faixas
CREATE TABLE IF NOT EXISTS sas_simples_nacional_cnae (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    denominacao TEXT NOT NULL,
    annex_code TEXT,
    createdAt TEXT,
    updatedAt TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cnae_code ON sas_simples_nacional_cnae(code);
CREATE INDEX IF NOT EXISTS idx_cnae_annex ON sas_simples_nacional_cnae(annex_code);
