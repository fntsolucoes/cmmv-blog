-- URL do PDF da nota fiscal (obrigatorio ao marcar como Pago).
ALTER TABLE sas_payment_orders ADD COLUMN invoice_attachment TEXT;
