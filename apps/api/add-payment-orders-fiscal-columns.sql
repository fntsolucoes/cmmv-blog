-- Natureza do rendimento (Reinf), data fato gerador, preparacao reforma
ALTER TABLE sas_payment_orders ADD COLUMN natureza_rendimento TEXT;
ALTER TABLE sas_payment_orders ADD COLUMN data_emissao_nota INTEGER;
ALTER TABLE sas_payment_orders ADD COLUMN id_imposto_reforma TEXT;
