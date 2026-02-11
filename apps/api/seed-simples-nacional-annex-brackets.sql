-- Anexo I (Comercio)
INSERT OR IGNORE INTO sas_simples_nacional_annex_brackets (id, annex_code, annex_name, faixa, rbt12_limit, nominal_rate_percent, parcel_to_deduct, createdAt, updatedAt) VALUES
('anexo-I-1', 'I', 'Comercio', 1, 180000, 4.00, 0, datetime('now'), datetime('now')),
('anexo-I-2', 'I', 'Comercio', 2, 360000, 7.30, 5940, datetime('now'), datetime('now')),
('anexo-I-3', 'I', 'Comercio', 3, 720000, 9.50, 13860, datetime('now'), datetime('now')),
('anexo-I-4', 'I', 'Comercio', 4, 1800000, 10.70, 22500, datetime('now'), datetime('now')),
('anexo-I-5', 'I', 'Comercio', 5, 3600000, 14.30, 87300, datetime('now'), datetime('now')),
('anexo-I-6', 'I', 'Comercio', 6, 4800000, 19.00, 378000, datetime('now'), datetime('now'));

-- Anexo II (Industria)
INSERT OR IGNORE INTO sas_simples_nacional_annex_brackets (id, annex_code, annex_name, faixa, rbt12_limit, nominal_rate_percent, parcel_to_deduct, createdAt, updatedAt) VALUES
('anexo-II-1', 'II', 'Industria', 1, 180000, 4.50, 0, datetime('now'), datetime('now')),
('anexo-II-2', 'II', 'Industria', 2, 360000, 7.80, 5940, datetime('now'), datetime('now')),
('anexo-II-3', 'II', 'Industria', 3, 720000, 10.00, 13860, datetime('now'), datetime('now')),
('anexo-II-4', 'II', 'Industria', 4, 1800000, 11.20, 22500, datetime('now'), datetime('now')),
('anexo-II-5', 'II', 'Industria', 5, 3600000, 14.70, 85500, datetime('now'), datetime('now')),
('anexo-II-6', 'II', 'Industria', 6, 4800000, 30.00, 720000, datetime('now'), datetime('now'));

-- Anexo III (Servicos - Instalacao, Reparos, Academias)
INSERT OR IGNORE INTO sas_simples_nacional_annex_brackets (id, annex_code, annex_name, faixa, rbt12_limit, nominal_rate_percent, parcel_to_deduct, createdAt, updatedAt) VALUES
('anexo-III-1', 'III', 'Servicos Instalacao Reparos Academias', 1, 180000, 6.00, 0, datetime('now'), datetime('now')),
('anexo-III-2', 'III', 'Servicos Instalacao Reparos Academias', 2, 360000, 11.20, 9360, datetime('now'), datetime('now')),
('anexo-III-3', 'III', 'Servicos Instalacao Reparos Academias', 3, 720000, 13.50, 17640, datetime('now'), datetime('now')),
('anexo-III-4', 'III', 'Servicos Instalacao Reparos Academias', 4, 1800000, 16.00, 35640, datetime('now'), datetime('now')),
('anexo-III-5', 'III', 'Servicos Instalacao Reparos Academias', 5, 3600000, 21.00, 125640, datetime('now'), datetime('now')),
('anexo-III-6', 'III', 'Servicos Instalacao Reparos Academias', 6, 4800000, 33.00, 648000, datetime('now'), datetime('now'));

-- Anexo IV (Servicos - Limpeza, Vigilancia, Obras, Advocacia)
INSERT OR IGNORE INTO sas_simples_nacional_annex_brackets (id, annex_code, annex_name, faixa, rbt12_limit, nominal_rate_percent, parcel_to_deduct, createdAt, updatedAt) VALUES
('anexo-IV-1', 'IV', 'Servicos Limpeza Vigilancia Obras Advocacia', 1, 180000, 4.50, 0, datetime('now'), datetime('now')),
('anexo-IV-2', 'IV', 'Servicos Limpeza Vigilancia Obras Advocacia', 2, 360000, 9.00, 8100, datetime('now'), datetime('now')),
('anexo-IV-3', 'IV', 'Servicos Limpeza Vigilancia Obras Advocacia', 3, 720000, 10.20, 12420, datetime('now'), datetime('now')),
('anexo-IV-4', 'IV', 'Servicos Limpeza Vigilancia Obras Advocacia', 4, 1800000, 14.00, 39780, datetime('now'), datetime('now')),
('anexo-IV-5', 'IV', 'Servicos Limpeza Vigilancia Obras Advocacia', 5, 3600000, 22.00, 183780, datetime('now'), datetime('now')),
('anexo-IV-6', 'IV', 'Servicos Limpeza Vigilancia Obras Advocacia', 6, 4800000, 33.00, 828000, datetime('now'), datetime('now'));

-- Anexo V (Servicos de Natureza Intelectual)
INSERT OR IGNORE INTO sas_simples_nacional_annex_brackets (id, annex_code, annex_name, faixa, rbt12_limit, nominal_rate_percent, parcel_to_deduct, createdAt, updatedAt) VALUES
('anexo-V-1', 'V', 'Servicos Natureza Intelectual', 1, 180000, 15.50, 0, datetime('now'), datetime('now')),
('anexo-V-2', 'V', 'Servicos Natureza Intelectual', 2, 360000, 18.00, 4500, datetime('now'), datetime('now')),
('anexo-V-3', 'V', 'Servicos Natureza Intelectual', 3, 720000, 19.50, 9900, datetime('now'), datetime('now')),
('anexo-V-4', 'V', 'Servicos Natureza Intelectual', 4, 1800000, 20.50, 17100, datetime('now'), datetime('now')),
('anexo-V-5', 'V', 'Servicos Natureza Intelectual', 5, 3600000, 23.00, 62100, datetime('now'), datetime('now')),
('anexo-V-6', 'V', 'Servicos Natureza Intelectual', 6, 4800000, 30.50, 540000, datetime('now'), datetime('now'));
