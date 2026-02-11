-- Indica se o CNAE possui Fator R (folha/receita para opcao Anexo III)
ALTER TABLE sas_simples_nacional_cnae ADD COLUMN fator_r INTEGER NOT NULL DEFAULT 0;
