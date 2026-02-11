-- Fator R mensal por centro de custo (folha / receita; se > 28% pode optar Anexo III no Simples)
CREATE TABLE IF NOT EXISTS sas_cost_center_monthly_fator_r (
    id TEXT PRIMARY KEY,
    cost_center_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    fator_r REAL NOT NULL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_cc_monthly_fator_r_cc ON sas_cost_center_monthly_fator_r (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cc_monthly_fator_r_ym ON sas_cost_center_monthly_fator_r (cost_center_id, year, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cc_monthly_fator_r_unique ON sas_cost_center_monthly_fator_r (cost_center_id, year, month);
