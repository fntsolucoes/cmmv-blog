CREATE TABLE IF NOT EXISTS sas_cost_center_tax_rules (
    id TEXT PRIMARY KEY,
    cost_center_id TEXT NOT NULL,
    tax_name TEXT NOT NULL,
    percentage REAL NOT NULL DEFAULT 0,
    min_threshold REAL,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_cc_tax_rules_cc_id ON sas_cost_center_tax_rules (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cc_tax_rules_tax_name ON sas_cost_center_tax_rules (tax_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cc_tax_rules_unique ON sas_cost_center_tax_rules (cost_center_id, tax_name);
