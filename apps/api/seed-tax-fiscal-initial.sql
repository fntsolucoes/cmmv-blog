-- Seed: regimes tributarios e regras federais (gatilho R$ 215,05 e 4,65%)
INSERT OR IGNORE INTO sas_tax_regimes (id, code, name, createdAt, updatedAt) VALUES
('reg-simples', 'SIMPLES_NACIONAL', 'Simples Nacional', datetime('now'), datetime('now')),
('reg-presumido', 'LUCRO_PRESUMIDO', 'Lucro Presumido', datetime('now'), datetime('now')),
('reg-real', 'LUCRO_REAL', 'Lucro Real', datetime('now'), datetime('now')),
('reg-mei', 'MEI', 'MEI', datetime('now'), datetime('now')),
('reg-exterior', 'EXTERIOR', 'Exterior', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO sas_tax_rules (id, tax_name, percentage, min_threshold, active, createdAt, updatedAt) VALUES
('rule-pis', 'PIS', 0.65, 215.05, 1, datetime('now'), datetime('now')),
('rule-cofins', 'COFINS', 3.00, 215.05, 1, datetime('now'), datetime('now')),
('rule-csll', 'CSLL', 1.00, 215.05, 1, datetime('now'), datetime('now')),
('rule-csrf', 'CSRF', 4.65, 215.05, 1, datetime('now'), datetime('now')),
('rule-irrf-servicos', 'IRRF_SERVICOS', 1.5, 0, 1, datetime('now'), datetime('now'));
