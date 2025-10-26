const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreBackup(backupPath) {
    try {
        console.log('🔄 Восстановление данных из резервной копии...');
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
        console.log(`   - Продукты проектов: ${data.projectProducts.length}`);
        console.log(`   - Этапы работ: ${data.workStages.length}`);
        console.log(`   - Спецификации изделий: ${data.productSpecifications.length}`);
        console.log(`   - Спецификации: ${data.specifications.length}`);
        console.log(`   - Виды номенклатуры: ${data.nomenclatureKinds.length}`);
        console.log(`   - Группы номенклатуры: ${data.nomenclatureGroups.length}`);
        console.log(`   - Позиции номенклатуры: ${data.nomenclatureItems.length}`);

        // Очищаем базу данных (в правильном порядке из-за внешних ключей)
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

        // Восстанавливаем данные (в правильном порядке)
        console.log('📥 Восстановление данных...');

        // Сначала создаем связанные записи
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

        if (data.projectProducts.length > 0) {
            // Используем upsert для каждого продукта с проверкой внешних ключей
            let successCount = 0;
            for (const product of data.projectProducts) {
                try {
                    await prisma.projectProduct.upsert({
                        where: { id: product.id },
                        update: product,
                        create: product
                    });
                    successCount++;
                } catch (error) {
                    console.log(`⚠️ Пропущен продукт ${product.id}: ${error.message}`);
                }
            }
            console.log(`✅ Продукты проектов: ${successCount}/${data.projectProducts.length}`);
        }

        if (data.workStages.length > 0) {
            // Используем upsert для каждого этапа с проверкой внешних ключей
            let successCount = 0;
            for (const stage of data.workStages) {
                try {
                    await prisma.workStage.upsert({
                        where: { id: stage.id },
                        update: stage,
                        create: stage
                    });
                    successCount++;
                } catch (error) {
                    console.log(`⚠️ Пропущен этап ${stage.id}: ${error.message}`);
                }
            }
            console.log(`✅ Этапы работ: ${successCount}/${data.workStages.length}`);
        }

        if (data.productSpecifications.length > 0) {
            await prisma.productSpecification.createMany({ data: data.productSpecifications });
            console.log(`✅ Спецификации изделий: ${data.productSpecifications.length}`);
        }

        if (data.specifications.length > 0) {
            await prisma.specification.createMany({ data: data.specifications });
            console.log(`✅ Спецификации: ${data.specifications.length}`);
        }

        if (data.auditLogs.length > 0) {
            await prisma.auditLog.createMany({ data: data.auditLogs });
            console.log(`✅ Логи аудита: ${data.auditLogs.length}`);
        }

        if (data.refreshTokens.length > 0) {
            await prisma.refreshToken.createMany({ data: data.refreshTokens });
            console.log(`✅ Токены обновления: ${data.refreshTokens.length}`);
        }

        console.log('✅ Восстановление завершено успешно!');

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
    console.log('Использование: node restore-backup.js <путь_к_файлу>');
    process.exit(1);
}

restoreBackup(backupPath);
