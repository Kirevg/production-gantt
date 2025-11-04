const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        // Проверяем подключение и получаем информацию о базе
        console.log('🔍 Проверка подключения к базе данных...\n');

        // Проверяем количество записей в разных таблицах
        const usersCount = await prisma.user.count();
        const projectsCount = await prisma.project.count();
        const projectProductsCount = await prisma.projectProduct.count();
        const specListsCount = await prisma.projectProductSpecificationList.count();
        const specsCount = await prisma.specification.count();

        console.log('📊 Количество записей в базе:');
        console.log(`   Пользователи: ${usersCount}`);
        console.log(`   Проекты: ${projectsCount}`);
        console.log(`   Изделия проектов: ${projectProductsCount}`);
        console.log(`   Списки спецификаций: ${specListsCount}`);
        console.log(`   Спецификации: ${specsCount}`);

        if (specListsCount === 0) {
            console.log('\n❌ ВНИМАНИЕ: ProjectProductSpecificationList пуста!');
        } else {
            console.log('\n✅ ProjectProductSpecificationList содержит данные');

            // Показываем первые 3 записи
            const firstThree = await prisma.projectProductSpecificationList.findMany({
                take: 3,
                select: {
                    id: true,
                    name: true,
                    productId: true,
                    version: true
                }
            });
            console.log('\nПервые записи:');
            firstThree.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} (версия ${item.version}, ID: ${item.id.substring(0, 8)}...)`);
            });
        }

        // Получаем информацию о базе из переменных окружения
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
            // Маскируем пароль
            const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
            console.log(`\n🔗 База данных: ${maskedUrl}`);
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await prisma.$disconnect();
    }
})();

