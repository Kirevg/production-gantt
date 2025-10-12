const { PrismaClient } = require('@prisma/client');

async function cleanSpecifications() {
    const prisma = new PrismaClient();

    try {
        console.log('🧹 Очищаем существующие спецификации...');

        // Удаляем все ProjectSpecification
        const deletedProjectSpecs = await prisma.projectSpecification.deleteMany({});
        console.log(`✅ Удалено спецификаций проекта: ${deletedProjectSpecs.count}`);

        // Удаляем все Specification
        const deletedSpecs = await prisma.specification.deleteMany({});
        console.log(`✅ Удалено позиций спецификаций: ${deletedSpecs.count}`);

        console.log('🎉 Очистка завершена!');

    } catch (error) {
        console.error('❌ Ошибка очистки:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanSpecifications();
