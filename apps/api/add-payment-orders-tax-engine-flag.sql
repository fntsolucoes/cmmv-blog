-- Flag indicando que o imposto foi calculado pelo motor tributario
ALTER TABLE sas_payment_orders ADD COLUMN tax_engine_used INTEGER DEFAULT 0;
