-- SQL скрипт для ручного выполнения в базе данных
-- Таблица: public."ProjectProductSpecificationList"
-- Колонка: projectproductId (уже переименована вручную)
-- Связь: с ProjectProduct.id (уже создана)

-- ============================================
-- 1. ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ
-- ============================================

-- Проверить колонку
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ProjectProductSpecificationList' 
AND column_name LIKE '%product%';

-- Проверить внешний ключ
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'ProjectProductSpecificationList'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'projectproductId';

-- Проверить индексы
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ProjectProductSpecificationList'
ORDER BY indexname;

-- ============================================
-- 2. ЕСЛИ НУЖНО СОЗДАТЬ ВНЕШНИЙ КЛЮЧ (если еще не создан)
-- ============================================

-- ALTER TABLE "ProjectProductSpecificationList" 
-- ADD CONSTRAINT "ProjectProductSpecificationList_projectproductId_fkey" 
-- FOREIGN KEY ("projectproductId") 
-- REFERENCES "ProjectProduct"("id") 
-- ON DELETE CASCADE;

-- ============================================
-- 3. ЕСЛИ НУЖНО СОЗДАТЬ ИНДЕКС (если еще не создан)
-- ============================================

-- CREATE INDEX IF NOT EXISTS "ProjectProductSpecificationList_projectproductId_idx" 
-- ON "ProjectProductSpecificationList"("projectproductId");

-- ============================================
-- 4. ЕСЛИ НУЖНО УДАЛИТЬ СТАРЫЙ ИНДЕКС (если есть)
-- ============================================

-- DROP INDEX IF EXISTS "ProjectProductSpecificationList_productId_idx";

-- ============================================
-- ВСЕ УЖЕ ВЫПОЛНЕНО! Ничего делать не нужно.
-- ============================================

