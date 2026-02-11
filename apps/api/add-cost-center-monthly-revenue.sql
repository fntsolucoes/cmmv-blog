-- Faturamento mensal bruto por centro de custo (para RBT12 do Simples Nacional)
-- RBT12 = soma dos ultimos 12 meses (excluindo o mes atual)
CREATE TABLE IF NOT EXISTS sas_cost_center_monthly_revenue (
    id TEXT PRIMARY KEY,
    cost_center_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    gross_revenue REAL NOT NULL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_cc_monthly_revenue_cc ON sas_cost_center_monthly_revenue (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cc_monthly_revenue_ym ON sas_cost_center_monthly_revenue (cost_center_id, year, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cc_monthly_revenue_unique ON sas_cost_center_monthly_revenue (cost_center_id, year, month);
