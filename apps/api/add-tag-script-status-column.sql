-- Adiciona a coluna scriptStatus na tabela sas_tags
-- Execute este script no banco SQLite antes de reiniciar a API
--
-- No WSL:
--   cd /mnt/c/Users/ferna/Desktop/Projetos/sas/apps/api
--   sqlite3 database.sqlite < add-tag-script-status-column.sql

ALTER TABLE sas_tags
ADD COLUMN scriptStatus VARCHAR(255) NULL DEFAULT 'Não verificada';


