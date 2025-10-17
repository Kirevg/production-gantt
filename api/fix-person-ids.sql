-- Скрипт для добавления недостающих ID в таблицу Person
-- Генерируем UUID для записей без ID

-- Обновляем записи где id IS NULL
UPDATE "Person" 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- Проверяем результат
SELECT COUNT(*) as total_records,
       COUNT(id) as records_with_id,
       COUNT(*) - COUNT(id) as records_without_id
FROM "Person";
