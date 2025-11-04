const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const all = await prisma.projectProductSpecificationList.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        serialNumber: true,
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                specifications: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        console.log(`📊 Всего записей: ${all.length}\n`);

        for (const spec of all) {
            console.log(`ID: ${spec.id}`);
            console.log(`  Название: ${spec.name}`);
            console.log(`  Версия: ${spec.version}`);
            console.log(`  Заблокирована: ${spec.isLocked}`);
            console.log(`  productId: ${spec.productId}`);
            if (spec.product) {
                console.log(`  Проект изделия: ${spec.product.serialNumber || 'N/A'} - ${spec.product.product?.name || 'N/A'}`);
            } else {
                console.log(`  ⚠️  Проект изделия НЕ НАЙДЕН!`);
            }
            console.log(`  Спецификаций внутри: ${spec.specifications.length}`);
            console.log(`  Сумма: ${spec.totalSum || 'null'}`);
            console.log('');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        await prisma.$disconnect();
    }
})();

