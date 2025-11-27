-- Script para adicionar a coluna sellerDomain à tabela sas_campaigns
-- Execute este script no banco de dados SQLite

-- Verificar se a coluna já existe antes de adicionar
-- SQLite não suporta IF NOT EXISTS diretamente em ALTER TABLE, então vamos usar uma abordagem diferente

-- Adicionar a coluna sellerDomain
ALTER TABLE sas_campaigns ADD COLUMN sellerDomain VARCHAR(255) NOT NULL DEFAULT '';

-- Atualizar registros existentes com um valor padrão (se necessário)
-- UPDATE sas_campaigns SET sellerDomain = '' WHERE sellerDomain IS NULL;

