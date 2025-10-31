-- Переименование индексов для ProjectProductSpecificationList
-- Выполнить вручную в базе данных

-- Переименовать индексы таблицы ProjectProductSpecificationList
ALTER INDEX IF EXISTS "ProductSpecification_pkey" RENAME TO "ProjectProductSpecificationList_pkey";
ALTER INDEX IF EXISTS "ProductSpecification_productId_idx" RENAME TO "ProjectProductSpecificationList_productId_idx";
ALTER INDEX IF EXISTS "ProductSpecification_isLocked_idx" RENAME TO "ProjectProductSpecificationList_isLocked_idx";

-- Переименовать индексы таблицы Specification, связанные с ProjectProductSpecificationList
ALTER INDEX IF EXISTS "Specification_productSpecificationId_idx" RENAME TO "Specification_projectProductSpecificationListId_idx";
ALTER INDEX IF EXISTS "Specification_productSpecificationId_version_idx" RENAME TO "Specification_projectProductSpecificationListId_version_idx";

