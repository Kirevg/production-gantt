-- Удаление полей designation и article из таблицы Product
-- Безопасная миграция - удаляет только эти два поля

ALTER TABLE "Product" DROP COLUMN IF EXISTS "designation";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "article";

