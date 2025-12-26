-- Adiciona a coluna finalized_for_profit_sharing_at na tabela sas_payment_orders
-- Esta coluna armazena a data/hora em que a ordem foi confirmada como paga
-- e está disponível para ser incluída na divisão de lucros
-- Valor padrão: NULL (ordens não finalizadas ainda podem ser incluídas em cálculos)
-- Quando preenchido, a ordem não será mais considerada em novos cálculos de divisão de lucros

ALTER TABLE sas_payment_orders ADD COLUMN finalized_for_profit_sharing_at INTEGER;

-- Criar índice para melhorar performance em consultas que filtram por esta data
CREATE INDEX IF NOT EXISTS idx_sas_payment_orders_finalized_for_profit_sharing_at ON sas_payment_orders(finalized_for_profit_sharing_at);


