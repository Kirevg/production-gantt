const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function simpleRestore(backupPath) {
    try {
        console.log('🔄 Простое восстановление основных данных...');
        console.log(`📁 Файл: ${backupPath}`);

        // Читаем файл бэкапа
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const data = backupData.data;

        console.log('📊 Данные в бэкапе:');
        console.log(`   - Пользователи: ${data.users.length}`);
        console.log(`   - Физические лица: ${data.persons.length}`);
        console.log(`   - Контрагенты: ${data.counterparties.length}`);
        console.log(`   - Единицы измерения: ${data.units.length}`);
        console.log(`   - Проекты: ${data.projects.length}`);
        console.log(`   - Позиции номенклатуры: ${data.nomenclatureItems.length}`);

        // Очищаем базу данных
        console.log('🗑️ Очистка базы данных...');
        await prisma.refreshToken.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.specification.deleteMany();
        await prisma.productSpecification.deleteMany();
        await prisma.workStage.deleteMany();
        await prisma.projectProduct.deleteMany();
        await prisma.project.deleteMany();
        await prisma.nomenclatureItem.deleteMany();
        await prisma.nomenclatureGroup.deleteMany();
        await prisma.nomenclatureKind.deleteMany();
        await prisma.unit.deleteMany();
        await prisma.counterparty.deleteMany();
        await prisma.person.deleteMany();
        await prisma.user.deleteMany();

        // Восстанавливаем только основные данные
        console.log('📥 Восстановление основных данных...');

        if (data.persons.length > 0) {
            await prisma.person.createMany({ data: data.persons });
            console.log(`✅ Физические лица: ${data.persons.length}`);
        }

        if (data.users.length > 0) {
            await prisma.user.createMany({ data: data.users });
            console.log(`✅ Пользователи: ${data.users.length}`);
        }

        if (data.counterparties.length > 0) {
            await prisma.counterparty.createMany({ data: data.counterparties });
            console.log(`✅ Контрагенты: ${data.counterparties.length}`);
        }

        if (data.units.length > 0) {
            await prisma.unit.createMany({ data: data.units });
            console.log(`✅ Единицы измерения: ${data.units.length}`);
        }

        if (data.nomenclatureKinds.length > 0) {
            await prisma.nomenclatureKind.createMany({ data: data.nomenclatureKinds });
            console.log(`✅ Виды номенклатуры: ${data.nomenclatureKinds.length}`);
        }

        if (data.nomenclatureGroups.length > 0) {
            await prisma.nomenclatureGroup.createMany({ data: data.nomenclatureGroups });
            console.log(`✅ Группы номенклатуры: ${data.nomenclatureGroups.length}`);
        }

        if (data.nomenclatureItems.length > 0) {
            await prisma.nomenclatureItem.createMany({ data: data.nomenclatureItems });
            console.log(`✅ Позиции номенклатуры: ${data.nomenclatureItems.length}`);
        }

        if (data.projects.length > 0) {
            await prisma.project.createMany({ data: data.projects });
            console.log(`✅ Проекты: ${data.projects.length}`);
        }

        console.log('✅ Восстановление основных данных завершено!');
        console.log('📝 Примечание: Связанные данные (продукты, спецификации) не восстановлены из-за проблем с внешними ключами');

    } catch (error) {
        console.error('❌ Ошибка восстановления:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Получаем путь к файлу из аргументов командной строки
const backupPath = process.argv[2];
if (!backupPath) {
    console.error('❌ Укажите путь к файлу бэкапа');
    console.log('Использование: node simple-restore.js <путь_к_файлу>');
    process.exit(1);
}

simpleRestore(backupPath);
