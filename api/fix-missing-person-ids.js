const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function fixMissingPersonIds() {
    try {
        console.log('🔍 Поиск записей Person без ID...');
        
        // Находим записи без ID (где id = null или пустой)
        const personsWithoutId = await prisma.person.findMany({
            where: {
                OR: [
                    { id: null },
                    { id: '' }
                ]
            }
        });

        console.log(`📊 Найдено ${personsWithoutId.length} записей без ID`);

        if (personsWithoutId.length === 0) {
            console.log('✅ Все записи уже имеют ID');
            return;
        }

        // Генерируем новые UUID для каждой записи
        for (const person of personsWithoutId) {
            const newId = uuidv4();
            
            console.log(`🔄 Обновляем: ${person.lastName} ${person.firstName} -> ${newId}`);
            
            // Обновляем запись с новым ID
            await prisma.person.update({
                where: {
                    // Используем временный ключ для поиска
                    lastName_firstName: {
                        lastName: person.lastName,
                        firstName: person.firstName
                    }
                },
                data: {
                    id: newId
                }
            });
        }

        console.log('✅ Все недостающие ID добавлены!');
        
        // Проверяем результат
        const remainingWithoutId = await prisma.person.findMany({
            where: {
                OR: [
                    { id: null },
                    { id: '' }
                ]
            }
        });
        
        console.log(`📊 Осталось записей без ID: ${remainingWithoutId.length}`);

    } catch (error) {
        console.error('❌ Ошибка при добавлении ID:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Запускаем скрипт
fixMissingPersonIds();
