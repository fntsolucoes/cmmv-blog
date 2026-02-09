-- Perfil fiscal: vinculo com regime e MEI; detalhes em fiscal_profile (JSON)
ALTER TABLE sas_cost_centers ADD COLUMN tax_regime_id TEXT REFERENCES sas_tax_regimes(id);
ALTER TABLE sas_cost_centers ADD COLUMN is_mei_optant INTEGER DEFAULT 0;
ALTER TABLE sas_cost_centers ADD COLUMN fiscal_profile TEXT;
