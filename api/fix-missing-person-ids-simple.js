const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function fixMissingPersonIds() {
    try {
        console.log('🔍 Получаем все записи Person...');
        
        // Получаем все записи Person
        const allPersons = await prisma.person.findMany();
        
        console.log(`📊 Всего записей: ${allPersons.length}`);
        
        let updatedCount = 0;
        
        // Проверяем каждую запись и обновляем если нужно
        for (const person of allPersons) {
            // Если ID пустой или null, генерируем новый
            if (!person.id || person.id === '' || person.id === null) {
                const newId = uuidv4();
                
                console.log(`🔄 Обновляем: ${person.lastName} ${person.firstName} -> ${newId}`);
                
                // Обновляем запись
                await prisma.person.update({
                    where: {
                        // Используем уникальные поля для поиска
                        lastName_firstName_middleName: {
                            lastName: person.lastName,
                            firstName: person.firstName,
                            middleName: person.middleName
                        }
                    },
                    data: {
                        id: newId
                    }
                });
                
                updatedCount++;
            }
        }

        console.log(`✅ Обновлено записей: ${updatedCount}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        
        // Если не работает через уникальный ключ, попробуем другой способ
        console.log('🔄 Пробуем альтернативный способ...');
        
        try {
            // Получаем все записи снова
            const allPersons = await prisma.person.findMany();
            
            for (const person of allPersons) {
                if (!person.id || person.id === '' || person.id === null) {
                    const newId = uuidv4();
                    
                    // Пробуем обновить по всем полям
                    await prisma.$executeRaw`
                        UPDATE "Person" 
                        SET id = ${newId}
                        WHERE "lastName" = ${person.lastName} 
                        AND "firstName" = ${person.firstName}
                        AND ("middleName" = ${person.middleName} OR ("middleName" IS NULL AND ${person.middleName} IS NULL))
                        AND id IS NULL
                    `;
                    
                    console.log(`✅ Обновлено: ${person.lastName} ${person.firstName}`);
                }
            }
            
        } catch (rawError) {
            console.error('❌ Ошибка при использовании raw SQL:', rawError);
        }
        
    } finally {
        await prisma.$disconnect();
    }
}

// Запускаем скрипт
fixMissingPersonIds();
