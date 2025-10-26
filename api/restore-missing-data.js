const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreMissingData(backupPath) {
    try {
        console.log('🔄 Восстановление недостающих данных...');
        console.log(`📁 Файл: ${backupPath}`);

        // Читаем файл бэкапа
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const data = backupData.data;

        console.log('📊 Данные в бэкапе:');
        console.log(`   - Продукты проектов: ${data.projectProducts.length}`);
        console.log(`   - Этапы работ: ${data.workStages.length}`);
        console.log(`   - Спецификации изделий: ${data.productSpecifications.length}`);
        console.log(`   - Спецификации: ${data.specifications.length}`);

        // Восстанавливаем продукты проектов
        if (data.projectProducts.length > 0) {
            console.log('\n🏗️ Восстановление продуктов проектов...');
            let successCount = 0;
            for (const product of data.projectProducts) {
                try {
                    // Проверяем, существует ли проект
                    const project = await prisma.project.findUnique({
                        where: { id: product.projectId }
                    });

                    if (project) {
                        await prisma.projectProduct.upsert({
                            where: { id: product.id },
                            update: product,
                            create: product
                        });
                        successCount++;
                        console.log(`   ✅ Продукт: ${product.name || product.id}`);
                    } else {
                        console.log(`   ⚠️ Пропущен продукт ${product.id}: проект не найден`);
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка продукта ${product.id}: ${error.message}`);
                }
            }
            console.log(`✅ Продукты проектов: ${successCount}/${data.projectProducts.length}`);
        }

        // Восстанавливаем этапы работ
        if (data.workStages.length > 0) {
            console.log('\n🔨 Восстановление этапов работ...');
            let successCount = 0;
            for (const stage of data.workStages) {
                try {
                    // Проверяем, существует ли продукт
                    const product = await prisma.projectProduct.findUnique({
                        where: { id: stage.productId }
                    });

                    if (product) {
                        await prisma.workStage.upsert({
                            where: { id: stage.id },
                            update: stage,
                            create: stage
                        });
                        successCount++;
                        console.log(`   ✅ Этап: ${stage.name || stage.id}`);
                    } else {
                        console.log(`   ⚠️ Пропущен этап ${stage.id}: продукт не найден`);
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка этапа ${stage.id}: ${error.message}`);
                }
            }
            console.log(`✅ Этапы работ: ${successCount}/${data.workStages.length}`);
        }

        // Восстанавливаем спецификации изделий
        if (data.productSpecifications.length > 0) {
            console.log('\n📋 Восстановление спецификаций изделий...');
            let successCount = 0;
            for (const spec of data.productSpecifications) {
                try {
                    // Проверяем, существует ли продукт
                    const product = await prisma.projectProduct.findUnique({
                        where: { id: spec.productId }
                    });

                    if (product) {
                        await prisma.productSpecification.upsert({
                            where: { id: spec.id },
                            update: spec,
                            create: spec
                        });
                        successCount++;
                        console.log(`   ✅ Спецификация: ${spec.name || spec.id}`);
                    } else {
                        console.log(`   ⚠️ Пропущена спецификация ${spec.id}: продукт не найден`);
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка спецификации ${spec.id}: ${error.message}`);
                }
            }
            console.log(`✅ Спецификации изделий: ${successCount}/${data.productSpecifications.length}`);
        }

        // Восстанавливаем спецификации
        if (data.specifications.length > 0) {
            console.log('\n📝 Восстановление спецификаций...');
            let successCount = 0;
            for (const spec of data.specifications) {
                try {
                    // Проверяем, существует ли спецификация изделия
                    const productSpec = await prisma.productSpecification.findUnique({
                        where: { id: spec.productSpecificationId }
                    });

                    if (productSpec) {
                        await prisma.specification.upsert({
                            where: { id: spec.id },
                            update: spec,
                            create: spec
                        });
                        successCount++;
                        console.log(`   ✅ Спецификация: ${spec.id}`);
                    } else {
                        console.log(`   ⚠️ Пропущена спецификация ${spec.id}: спецификация изделия не найдена`);
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка спецификации ${spec.id}: ${error.message}`);
                }
            }
            console.log(`✅ Спецификации: ${successCount}/${data.specifications.length}`);
        }

        // Восстанавливаем логи аудита
        if (data.auditLogs.length > 0) {
            console.log('\n📊 Восстановление логов аудита...');
            let successCount = 0;
            for (const log of data.auditLogs) {
                try {
                    await prisma.auditLog.upsert({
                        where: { id: log.id },
                        update: log,
                        create: log
                    });
                    successCount++;
                } catch (error) {
                    console.log(`   ❌ Ошибка лога ${log.id}: ${error.message}`);
                }
            }
            console.log(`✅ Логи аудита: ${successCount}/${data.auditLogs.length}`);
        }

        // Восстанавливаем токены обновления
        if (data.refreshTokens.length > 0) {
            console.log('\n🔑 Восстановление токенов обновления...');
            let successCount = 0;
            for (const token of data.refreshTokens) {
                try {
                    await prisma.refreshToken.upsert({
                        where: { id: token.id },
                        update: token,
                        create: token
                    });
                    successCount++;
                } catch (error) {
                    console.log(`   ❌ Ошибка токена ${token.id}: ${error.message}`);
                }
            }
            console.log(`✅ Токены обновления: ${successCount}/${data.refreshTokens.length}`);
        }

        console.log('\n✅ Восстановление недостающих данных завершено!');

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
    console.log('Использование: node restore-missing-data.js <путь_к_файлу>');
    process.exit(1);
}

restoreMissingData(backupPath);
