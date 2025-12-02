-- Migration: Adicionar coluna sellerUrl na tabela sas_tags
-- Idempotente: Pode ser executada múltiplas vezes sem problemas
-- Data: 2025-01-XX

-- SQLite não suporta IF NOT EXISTS diretamente em ALTER TABLE
-- A migration deve verificar manualmente se a coluna existe antes de adicionar
-- Ou usar uma abordagem com PRAGMA table_info

-- Adicionar coluna sellerUrl
-- Nota: Se a coluna já existir, este comando falhará silenciosamente em algumas versões do SQLite
-- Para garantir idempotência, execute primeiro: PRAGMA table_info(sas_tags) e verifique se a coluna existe
ALTER TABLE sas_tags ADD COLUMN sellerUrl TEXT;

-- Criar índice se necessário (opcional, para buscas por URL)
-- CREATE INDEX IF NOT EXISTS idx_sas_tags_sellerUrl ON sas_tags(sellerUrl);

