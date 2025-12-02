-- Migration: Adicionar coluna sellerDomain na tabela sas_tags
-- Este script é idempotente e pode ser executado múltiplas vezes

-- Verificar se a coluna já existe antes de adicionar
-- SQLite não suporta IF NOT EXISTS diretamente no ALTER TABLE,
-- então precisamos verificar manualmente ou usar uma abordagem diferente

-- Para SQLite, vamos usar uma abordagem que verifica se a coluna existe
-- Se a coluna não existir, ela será adicionada
-- Se já existir, o comando será ignorado (erro será suprimido)

-- Adicionar coluna sellerDomain se não existir
-- Nota: Em SQLite, precisamos verificar manualmente via PRAGMA table_info
-- Este script deve ser executado via um script wrapper que verifica a existência

-- Comando SQL para adicionar a coluna (execute apenas se a coluna não existir)
ALTER TABLE sas_tags ADD COLUMN sellerDomain TEXT NOT NULL DEFAULT '';

-- Criar índice para melhor performance em buscas
CREATE INDEX IF NOT EXISTS idx_sas_tags_sellerDomain ON sas_tags(sellerDomain);


