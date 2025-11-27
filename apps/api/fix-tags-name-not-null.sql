-- Garante que nenhuma tag tenha name = NULL
-- Isso evita erro de NOT NULL em temporary_sas_tags.name na sincronização
--
-- Execute no WSL:
--   cd /mnt/c/Users/ferna/Desktop/Projetos/sas/apps/api
--   sqlite3 database.sqlite < fix-tags-name-not-null.sql

UPDATE sas_tags
SET name = ''
WHERE name IS NULL;


