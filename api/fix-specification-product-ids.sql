-- SQL скрипт для исправления productId в ProjectProductSpecificationList
-- Проблема: productId может указывать на Product.id (справочник), а должен указывать на ProjectProduct.id
--
-- Алгоритм:
-- 1. Находим все спецификации, где productId не существует в ProjectProduct
-- 2. Для каждой такой спецификации находим правильный ProjectProduct.id
-- 3. Обновляем productId

-- Сначала проверим, какие спецификации имеют неправильный productId
SELECT 
    ppsl.id,
    ppsl.name,
    ppsl."productId" as current_product_id,
    CASE 
        WHEN pp.id IS NOT NULL THEN 'OK - указывает на ProjectProduct'
        WHEN p.id IS NOT NULL THEN 'ERROR - указывает на Product (справочник)'
        ELSE 'ERROR - не найден ни Product, ни ProjectProduct'
    END as status,
    pp.id as correct_project_product_id,
    pp."projectId",
    p.name as product_name
FROM "ProjectProductSpecificationList" ppsl
LEFT JOIN "ProjectProduct" pp ON pp.id = ppsl."productId"
LEFT JOIN "Product" p ON p.id = ppsl."productId"
ORDER BY status, ppsl.name;

-- Исправление: обновляем productId на правильный ProjectProduct.id
-- Для спецификаций, где productId указывает на Product.id, находим соответствующий ProjectProduct
UPDATE "ProjectProductSpecificationList" ppsl
SET "productId" = pp.id
FROM "Product" p, "ProjectProduct" pp
WHERE 
    -- Текущий productId указывает на Product (справочник)
    ppsl."productId" = p.id
    -- Ищем ProjectProduct, который ссылается на этот Product
    AND pp."productId" = p.id
    -- Берем первый найденный ProjectProduct (если их несколько, нужна дополнительная проверка)
    AND NOT EXISTS (
        SELECT 1 FROM "ProjectProduct" pp2 
        WHERE pp2."productId" = p.id 
        AND pp2.id != pp.id
    )
RETURNING 
    ppsl.id,
    ppsl.name,
    ppsl."productId" as new_product_id;

