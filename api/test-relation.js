const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔍 Проверка связи projectProduct в ProjectProductSpecificationList...\n');
        
        // Пробуем получить спецификации с связью
        const specLists = await prisma.projectProductSpecificationList.findMany({
            take: 2,
            include: {
                projectProduct: {
                    select: {
                        id: true,
                        serialNumber: true,
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        
        console.log(`📊 Найдено записей: ${specLists.length}\n`);
        
        for (const spec of specLists) {
            console.log(`ID: ${spec.id}`);
            console.log(`  Название: ${spec.name}`);
            console.log(`  projectProductId: ${spec.projectProductId}`);
            if (spec.projectProduct) {
                console.log(`  ✅ Связь работает!`);
                console.log(`    ProjectProduct: ${spec.projectProduct.serialNumber || 'N/A'} - ${spec.projectProduct.product?.name || 'N/A'}`);
            } else {
                console.log(`  ❌ Связь не работает!`);
            }
            console.log('');
        }
        
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error('Stack:', error.stack);
        await prisma.$disconnect();
    }
})();

