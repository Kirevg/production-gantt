-- Удаление внешнего ключа и связи между ProjectProductSpecificationList.productId и ProjectProduct.id
-- Удаляем внешний ключ (если он существует)
ALTER TABLE "ProjectProductSpecificationList" 
DROP CONSTRAINT IF EXISTS "ProjectProductSpecificationList_productId_fkey";

-- Колонка productId остается, но без внешнего ключа
-- Это позволяет хранить ID без проверки ссылочной целостности

