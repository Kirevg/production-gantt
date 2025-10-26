const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNomenclature() {
    try {
        console.log('🔍 Проверка номенклатуры в базе данных...');

        const items = await prisma.nomenclatureItem.findMany();
        console.log(`📊 Найдено позиций номенклатуры: ${items.length}`);

        if (items.length > 0) {
            console.log('✅ Номенклатура восстановлена!');
            console.log('📋 Первые 5 позиций:');
            items.slice(0, 5).forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} (${item.designation || 'без обозначения'})`);
            });
        } else {
            console.log('❌ Номенклатура НЕ восстановлена!');
        }

        // Проверим другие таблицы
        const users = await prisma.user.findMany();
        const persons = await prisma.person.findMany();
        const projects = await prisma.project.findMany();

        console.log('\n📊 Статистика восстановления:');
        console.log(`   - Пользователи: ${users.length}`);
        console.log(`   - Физические лица: ${persons.length}`);
        console.log(`   - Проекты: ${projects.length}`);
        console.log(`   - Позиции номенклатуры: ${items.length}`);

    } catch (error) {
        console.error('❌ Ошибка проверки:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNomenclature();
