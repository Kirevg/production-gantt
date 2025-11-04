-- Удаление колонки description из таблицы ProjectProduct
ALTER TABLE "ProjectProduct" 
DROP COLUMN IF EXISTS "description";

