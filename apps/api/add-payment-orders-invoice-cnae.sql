-- CNAE da nota (codigo da tabela sas_simples_nacional_cnae). Default: CNAE principal do centro de custo.
ALTER TABLE sas_payment_orders ADD COLUMN invoice_cnae TEXT;
