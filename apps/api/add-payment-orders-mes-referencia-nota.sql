-- Troca data_emissao_nota (INTEGER) por mes_referencia_nota (TEXT YYYY-MM)
ALTER TABLE sas_payment_orders ADD COLUMN mes_referencia_nota TEXT;
