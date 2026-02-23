-- Coluna para armazenar o valor do IRPJ adicional calculado para a nota
ALTER TABLE sas_payment_orders ADD COLUMN irpj_adicional_amount REAL DEFAULT 0;
