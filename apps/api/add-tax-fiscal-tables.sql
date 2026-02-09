-- Matriz de configuracao de impostos: regimes, regras federais, ISS por municipio

-- Regimes tributarios (Simples, Lucro Presumido, Real, MEI, Exterior)
CREATE TABLE IF NOT EXISTS sas_tax_regimes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    createdAt TEXT,
    updatedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_sas_tax_regimes_code ON sas_tax_regimes(code);

-- Regras de retencao federal (PIS, COFINS, CSLL, IRRF) e gatilho em R$
CREATE TABLE IF NOT EXISTS sas_tax_rules (
    id TEXT PRIMARY KEY,
    tax_name TEXT NOT NULL,
    percentage REAL NOT NULL,
    min_threshold REAL,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT,
    updatedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_sas_tax_rules_tax_name ON sas_tax_rules(tax_name);

-- ISS por municipio (2% a 5%) - tabela global por cidade/UF
CREATE TABLE IF NOT EXISTS sas_tax_iss_municipality (
    id TEXT PRIMARY KEY,
    municipality TEXT NOT NULL,
    uf TEXT NOT NULL,
    percent REAL NOT NULL,
    createdAt TEXT,
    updatedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_sas_tax_iss_municipality_uf ON sas_tax_iss_municipality(uf);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sas_tax_iss_municipality_uf_mun ON sas_tax_iss_municipality(uf, municipality);
