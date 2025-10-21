const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
    try {
        console.log('🔄 Создание резервной копии базы данных...');

        // Получаем все данные из всех таблиц
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

        // Формируем объект с данными
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
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
            }
        };

        // Формируем имя файла с локальным временем
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
        const filename = `backup_${timestamp}.json`;
        const filepath = path.join(__dirname, 'backups', filename);

        // Сохраняем файл
        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

        console.log('✅ Резервная копия создана успешно!');
        console.log(`📁 Файл: ${filepath}`);
        console.log(`📊 Данные:`);
        console.log(`   - Пользователи: ${users.length}`);
        console.log(`   - Физические лица: ${persons.length}`);
        console.log(`   - Контрагенты: ${counterparties.length}`);
        console.log(`   - Единицы измерения: ${units.length}`);
        console.log(`   - Проекты: ${projects.length}`);
        console.log(`   - Продукты проектов: ${projectProducts.length}`);
        console.log(`   - Этапы работ: ${workStages.length}`);
        console.log(`   - Спецификации изделий: ${productSpecifications.length}`);
        console.log(`   - Спецификации: ${specifications.length}`);
        console.log(`   - Виды номенклатуры: ${nomenclatureKinds.length}`);
        console.log(`   - Группы номенклатуры: ${nomenclatureGroups.length}`);
        console.log(`   - Позиции номенклатуры: ${nomenclatureItems.length}`);
        console.log(`   - Логи аудита: ${auditLogs.length}`);
        console.log(`   - Токены обновления: ${refreshTokens.length}`);

    } catch (error) {
        console.error('❌ Ошибка создания резервной копии:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createBackup();
