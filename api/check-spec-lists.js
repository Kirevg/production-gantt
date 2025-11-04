const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const count = await prisma.projectProductSpecificationList.count();
        console.log('Количество записей в ProjectProductSpecificationList:', count);

        if (count === 0) {
            console.log('❌ Таблица пуста!');
        } else {
            const all = await prisma.projectProductSpecificationList.findMany({ take: 5 });
            console.log('Первые записи:', JSON.stringify(all, null, 2));
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Ошибка:', error);
        await prisma.$disconnect();
    }
})();

