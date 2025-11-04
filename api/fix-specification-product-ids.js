// Скрипт для исправления productId в ProjectProductSpecificationList
// Исправляет productId, чтобы он ссылался на ProjectProduct.id вместо Product.id
// 
// ПРОБЛЕМА: В колонке productId таблицы ProjectProductSpecificationList 
// хранятся ID из таблицы Product (справочник), а должны храниться ID из ProjectProduct

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSpecificationProductIds() {
    try {
        console.log('🔍 Начинаю исправление productId в ProjectProductSpecificationList...');
        console.log('📝 Проблема: productId содержит ID из Product, а должен содержать ID из ProjectProduct\n');

        // Получаем все спецификации изделий с их текущими связями
        const specificationLists = await prisma.projectProductSpecificationList.findMany({
            include: {
                specifications: {
                    take: 1 // Берем первую спецификацию для проверки
                }
            }
        });

        console.log(`📊 Найдено спецификаций изделий: ${specificationLists.length}\n`);

        let fixedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const specList of specificationLists) {
            try {
                const currentProductId = specList.productId;
                
                // Проверяем, является ли currentProductId ID из ProjectProduct или Product
                // Пробуем найти ProjectProduct с таким ID
                let projectProductById = await prisma.projectProduct.findUnique({
                    where: { id: currentProductId },
                    include: { project: true }
                });

                if (projectProductById) {
                    // Если найден ProjectProduct с таким ID - значит все правильно
                    console.log(`✓ Спецификация ${specList.id} (${specList.name}): productId уже правильный (${currentProductId})`);
                    skippedCount++;
                    continue;
                }

                // Если не найден ProjectProduct, значит currentProductId - это ID из Product
                // Ищем все ProjectProduct, которые ссылаются на этот Product
                const projectProducts = await prisma.projectProduct.findMany({
                    where: {
                        productId: currentProductId // Ищем ProjectProduct, где productId ссылается на Product.id
                    },
                    include: {
                        project: true,
                        projectProductSpecificationLists: {
                            where: {
                                id: specList.id // Проверяем, есть ли эта спецификация в списке спецификаций ProjectProduct
                            }
                        }
                    }
                });

                if (projectProducts.length === 0) {
                    console.log(`❌ Не найдено ProjectProduct для спецификации ${specList.id}:`);
                    console.log(`   Текущий productId: ${currentProductId}`);
                    console.log(`   Название спецификации: ${specList.name}`);
                    console.log(`   Проверяем, может это ID из Product (справочник)...`);
                    
                    // Проверяем, может это ID из Product
                    const product = await prisma.product.findUnique({
                        where: { id: currentProductId }
                    });
                    
                    if (product) {
                        console.log(`   ⚠️  productId указывает на Product (справочник): ${product.name}`);
                        console.log(`   ❌ Это ОШИБКА - нужно найти правильный ProjectProduct!`);
                        // Пробуем найти ProjectProduct через другие связи
                        // Может быть через спецификации внутри списка?
                        const specListWithSpecs = await prisma.projectProductSpecificationList.findUnique({
                            where: { id: specList.id },
                            include: {
                                specifications: {
                                    take: 1
                                }
                            }
                        });
                        console.log(`   ⚠️  Требуется ручная проверка для этой спецификации`);
                    }
                    skippedCount++;
                    continue;
                }

                // Если найдено несколько ProjectProduct, выбираем тот, у которого уже есть эта спецификация
                let correctProjectProduct = null;
                
                if (projectProducts.length === 1) {
                    correctProjectProduct = projectProducts[0];
                } else {
                    // Ищем ProjectProduct, у которого уже есть эта спецификация
                    const productWithSpec = projectProducts.find(pp => 
                        pp.projectProductSpecificationLists && pp.projectProductSpecificationLists.length > 0
                    );
                    
                    if (productWithSpec) {
                        correctProjectProduct = productWithSpec;
                    } else {
                        // Если нет точного совпадения, берем первый (требуется проверка)
                        console.log(`⚠️  Найдено несколько ProjectProduct для спецификации ${specList.id}:`);
                        console.log(`   Текущий productId: ${currentProductId}`);
                        console.log(`   Название спецификации: ${specList.name}`);
                        projectProducts.forEach(pp => {
                            console.log(`   - ProjectProduct.id: ${pp.id}, project: ${pp.project.name}`);
                        });
                        console.log(`   ⚠️  Используем первый найденный ProjectProduct`);
                        correctProjectProduct = projectProducts[0];
                    }
                }

                const correctProductId = correctProjectProduct.id;

                if (specList.productId !== correctProductId) {
                    console.log(`🔧 Исправление спецификации ${specList.id}:`);
                    console.log(`   Название: ${specList.name}`);
                    console.log(`   Текущий productId: ${specList.productId}`);
                    console.log(`   Правильный productId (ProjectProduct.id): ${correctProductId}`);
                    console.log(`   Проект: ${correctProjectProduct.project.name}`);

                    // Обновляем productId на правильный
                    await prisma.projectProductSpecificationList.update({
                        where: { id: specList.id },
                        data: { productId: correctProductId }
                    });

                    console.log(`   ✅ Исправлено!\n`);
                    fixedCount++;
                } else {
                    // productId уже правильный
                    skippedCount++;
                }
            } catch (error) {
                console.error(`❌ Ошибка при обработке спецификации ${specList.id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📈 Результаты:');
        console.log(`   ✅ Исправлено: ${fixedCount}`);
        console.log(`   ⏭️  Пропущено (уже правильные или неоднозначные): ${skippedCount}`);
        console.log(`   ❌ Ошибок: ${errorCount}`);
        console.log(`   📊 Всего обработано: ${specificationLists.length}`);

        if (fixedCount > 0) {
            console.log('\n✅ Исправление завершено успешно!');
        } else {
            console.log('\n✅ Все данные уже корректны или требуют ручной проверки!');
        }

    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Запускаем скрипт
fixSpecificationProductIds()
    .then(() => {
        console.log('✅ Скрипт завершен');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Скрипт завершен с ошибкой:', error);
        process.exit(1);
    });

