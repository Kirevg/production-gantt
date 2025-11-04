// Диагностический скрипт для проверки productId в ProjectProductSpecificationList
// Показывает, на что указывает productId - на ProjectProduct или Product

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificationProductIds() {
    try {
        console.log('🔍 Диагностика productId в ProjectProductSpecificationList...\n');

        // Получаем все спецификации
        const specificationLists = await prisma.projectProductSpecificationList.findMany({
            include: {
                specifications: {
                    take: 1
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Всего спецификаций: ${specificationLists.length}\n`);

        let correctCount = 0;
        let errorCount = 0;
        let notFoundCount = 0;

        for (const specList of specificationLists) {
            const productId = specList.productId;
            
            // Проверяем, является ли это ID из ProjectProduct
            const projectProduct = await prisma.projectProduct.findUnique({
                where: { id: productId },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            if (projectProduct) {
                // Это ID из ProjectProduct - правильно
                console.log(`✅ ${specList.name}`);
                console.log(`   ID спецификации: ${specList.id}`);
                console.log(`   productId: ${productId} → ProjectProduct`);
                console.log(`   Проект: ${projectProduct.project.name}`);
                console.log(`   Изделие (справочник): ${projectProduct.product?.name || 'N/A'}`);
                console.log(`   ProjectProduct.id: ${projectProduct.id}`);
                console.log(`   ProjectProduct.productId (ссылка на Product): ${projectProduct.productId}`);
                console.log('');
                correctCount++;
            } else {
                // Это не ID из ProjectProduct - проверяем, может это ID из Product
                const product = await prisma.product.findUnique({
                    where: { id: productId }
                });

                if (product) {
                    // Это ID из Product - ОШИБКА!
                    console.log(`❌ ${specList.name}`);
                    console.log(`   ID спецификации: ${specList.id}`);
                    console.log(`   productId: ${productId} → Product (ОШИБКА!)`);
                    console.log(`   Product.name: ${product.name}`);
                    console.log(`   ⚠️  Нужно найти правильный ProjectProduct!`);
                    
                    // Ищем ProjectProduct, которые ссылаются на этот Product
                    const projectProducts = await prisma.projectProduct.findMany({
                        where: {
                            productId: product.id
                        },
                        include: {
                            project: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    });

                    if (projectProducts.length > 0) {
                        console.log(`   Найдено ProjectProduct для этого Product:`);
                        projectProducts.forEach((pp, index) => {
                            console.log(`   ${index + 1}. ProjectProduct.id: ${pp.id}, Проект: ${pp.project.name}`);
                        });
                        
                        if (projectProducts.length === 1) {
                            console.log(`   ✅ Можно автоматически исправить на: ${projectProducts[0].id}`);
                        } else {
                            console.log(`   ⚠️  Найдено несколько ProjectProduct - требуется ручной выбор`);
                        }
                    } else {
                        console.log(`   ❌ Не найдено ProjectProduct для этого Product!`);
                    }
                    console.log('');
                    errorCount++;
                } else {
                    // Не найдено ни ProjectProduct, ни Product
                    console.log(`⚠️  ${specList.name}`);
                    console.log(`   ID спецификации: ${specList.id}`);
                    console.log(`   productId: ${productId} → НЕ НАЙДЕНО`);
                    console.log(`   ❌ Не найден ни ProjectProduct, ни Product!`);
                    console.log('');
                    notFoundCount++;
                }
            }
        }

        console.log('\n📈 Итоги:');
        console.log(`   ✅ Правильных: ${correctCount}`);
        console.log(`   ❌ Ошибок (указывает на Product): ${errorCount}`);
        console.log(`   ⚠️  Не найдено: ${notFoundCount}`);
        console.log(`   📊 Всего: ${specificationLists.length}`);

        if (errorCount > 0 || notFoundCount > 0) {
            console.log('\n⚠️  Обнаружены проблемы! Запустите fix-specification-product-ids.js для исправления.');
        } else {
            console.log('\n✅ Все данные корректны!');
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificationProductIds()
    .then(() => {
        console.log('\n✅ Диагностика завершена');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Диагностика завершена с ошибкой:', error);
        process.exit(1);
    });

