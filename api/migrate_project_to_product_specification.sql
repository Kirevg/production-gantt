-- Миграция: переименование ProjectSpecification в ProductSpecification
-- ВНИМАНИЕ: Выполнять только после создания резервной копии базы данных!

BEGIN;

-- 1. Создаем новую таблицу ProductSpecification
CREATE TABLE "ProductSpecification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

-- 2. Копируем данные из ProjectSpecification в ProductSpecification
-- Примечание: productId берется из связи с Product через projectId
INSERT INTO "ProductSpecification" ("id", "productId", "name", "description", "createdAt", "updatedAt")
SELECT 
    ps."id",
    p."id" as "productId",
    ps."name",
    ps."description",
    ps."createdAt",
    ps."updatedAt"
FROM "ProjectSpecification" ps
JOIN "Product" p ON p."projectId" = ps."projectId"
WHERE ps."productId" IS NULL;

-- Если есть спецификации, привязанные к конкретному продукту
INSERT INTO "ProductSpecification" ("id", "productId", "name", "description", "createdAt", "updatedAt")
SELECT 
    ps."id",
    ps."productId",
    ps."name",
    ps."description",
    ps."createdAt",
    ps."updatedAt"
FROM "ProjectSpecification" ps
WHERE ps."productId" IS NOT NULL;

-- 3. Обновляем таблицу Specification
-- Добавляем новое поле productSpecificationId
ALTER TABLE "Specification" ADD COLUMN "productSpecificationId" TEXT;

-- Обновляем связи в Specification
UPDATE "Specification" 
SET "productSpecificationId" = "projectSpecificationId"
WHERE "projectSpecificationId" IS NOT NULL;

-- Делаем productSpecificationId обязательным и удаляем projectSpecificationId
ALTER TABLE "Specification" ALTER COLUMN "productSpecificationId" SET NOT NULL;
ALTER TABLE "Specification" DROP COLUMN "projectSpecificationId";

-- 4. Создаем внешние ключи
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Specification" ADD CONSTRAINT "Specification_productSpecificationId_fkey" 
FOREIGN KEY ("productSpecificationId") REFERENCES "ProductSpecification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Создаем индексы
CREATE INDEX "ProductSpecification_productId_idx" ON "ProductSpecification"("productId");

-- 6. Удаляем старую таблицу ProjectSpecification
DROP TABLE "ProjectSpecification";

COMMIT;
