const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllTables() {
    try {
        console.log('🔍 Проверка всех таблиц в базе данных...\n');

        // Проверяем все основные таблицы
        const [
            users,
            persons,
            counterparties,
            units,
            projects,
            projectProducts,
            workStages,
            productSpecifications,
            specifications,
            nomenclatureKinds,
            nomenclatureGroups,
            nomenclatureItems,
            auditLogs,
            refreshTokens
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.person.findMany(),
            prisma.counterparty.findMany(),
            prisma.unit.findMany(),
            prisma.project.findMany(),
            prisma.projectProduct.findMany(),
            prisma.workStage.findMany(),
            prisma.productSpecification.findMany(),
            prisma.specification.findMany(),
            prisma.nomenclatureKind.findMany(),
            prisma.nomenclatureGroup.findMany(),
            prisma.nomenclatureItem.findMany(),
            prisma.auditLog.findMany(),
            prisma.refreshToken.findMany()
        ]);

        console.log('📊 СТАТИСТИКА ВОССТАНОВЛЕНИЯ:');
        console.log('═'.repeat(50));

        // Основные данные
        console.log('👥 ПОЛЬЗОВАТЕЛИ И ЛИЦА:');
        console.log(`   ✅ Пользователи: ${users.length}`);
        console.log(`   ✅ Физические лица: ${persons.length}`);
        console.log(`   ✅ Контрагенты: ${counterparties.length}`);

        // Справочники
        console.log('\n📚 СПРАВОЧНИКИ:');
        console.log(`   ✅ Единицы измерения: ${units.length}`);
        console.log(`   ✅ Виды номенклатуры: ${nomenclatureKinds.length}`);
        console.log(`   ✅ Группы номенклатуры: ${nomenclatureGroups.length}`);
        console.log(`   ✅ Позиции номенклатуры: ${nomenclatureItems.length}`);

        // Проекты и продукты
        console.log('\n🏗️ ПРОЕКТЫ И ПРОДУКТЫ:');
        console.log(`   ✅ Проекты: ${projects.length}`);
        console.log(`   ${projectProducts.length > 0 ? '✅' : '❌'} Продукты проектов: ${projectProducts.length}`);
        console.log(`   ${workStages.length > 0 ? '✅' : '❌'} Этапы работ: ${workStages.length}`);

        // Спецификации
        console.log('\n📋 СПЕЦИФИКАЦИИ:');
        console.log(`   ${productSpecifications.length > 0 ? '✅' : '❌'} Спецификации изделий: ${productSpecifications.length}`);
        console.log(`   ${specifications.length > 0 ? '✅' : '❌'} Спецификации: ${specifications.length}`);

        // Системные таблицы
        console.log('\n🔧 СИСТЕМНЫЕ:');
        console.log(`   ${auditLogs.length > 0 ? '✅' : '❌'} Логи аудита: ${auditLogs.length}`);
        console.log(`   ${refreshTokens.length > 0 ? '✅' : '❌'} Токены обновления: ${refreshTokens.length}`);

        // Итоговая статистика
        const totalTables = 14;
        const restoredTables = [
            users.length > 0,
            persons.length > 0,
            counterparties.length > 0,
            units.length > 0,
            projects.length > 0,
            projectProducts.length > 0,
            workStages.length > 0,
            productSpecifications.length > 0,
            specifications.length > 0,
            nomenclatureKinds.length > 0,
            nomenclatureGroups.length > 0,
            nomenclatureItems.length > 0,
            auditLogs.length > 0,
            refreshTokens.length > 0
        ].filter(Boolean).length;

        console.log('\n📈 ИТОГОВАЯ СТАТИСТИКА:');
        console.log('═'.repeat(50));
        console.log(`   📊 Восстановлено таблиц: ${restoredTables}/${totalTables}`);
        console.log(`   📈 Процент восстановления: ${Math.round((restoredTables / totalTables) * 100)}%`);

        // Проблемные таблицы
        const emptyTables = [];
        if (projectProducts.length === 0) emptyTables.push('Продукты проектов');
        if (workStages.length === 0) emptyTables.push('Этапы работ');
        if (productSpecifications.length === 0) emptyTables.push('Спецификации изделий');
        if (specifications.length === 0) emptyTables.push('Спецификации');

        if (emptyTables.length > 0) {
            console.log('\n⚠️ ПУСТЫЕ ТАБЛИЦЫ:');
            emptyTables.forEach(table => console.log(`   ❌ ${table}`));
        }

        console.log('\n✅ Проверка завершена!');

    } catch (error) {
        console.error('❌ Ошибка проверки:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllTables();
