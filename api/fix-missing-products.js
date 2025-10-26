const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixMissingProducts(backupPath) {
    try {
        console.log('🔧 Исправление недостающих продуктов...');
        console.log(`📁 Файл: ${backupPath}`);

        // Читаем файл бэкапа
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const data = backupData.data;

        // Собираем все productId из projectProducts
        const productIds = data.projectProducts.map(p => p.productId).filter(Boolean);
        console.log(`📊 Найдено productId в projectProducts: ${productIds.length}`);

        // Создаем недостающие продукты
        const createdProducts = [];
        for (const productId of productIds) {
            try {
                // Проверяем, существует ли продукт
                const existingProduct = await prisma.nomenclatureItem.findUnique({
                    where: { id: productId }
                });

                if (!existingProduct) {
                    // Создаем недостающий продукт
                    const newProduct = await prisma.nomenclatureItem.create({
                        data: {
                            id: productId,
                            name: `Продукт ${productId.substring(0, 8)}`,
                            designation: `PROD-${productId.substring(0, 8)}`,
                            article: `ART-${productId.substring(0, 8)}`,
                            code1c: null,
                            manufacturer: 'Неизвестно',
                            price: 0,
                            description: 'Восстановленный продукт',
                            type: 'Product',
                            kind: data.nomenclatureKinds[0]?.id ? {
                                connect: { id: data.nomenclatureKinds[0].id }
                            } : undefined,
                            group: data.nomenclatureGroups[0]?.id ? {
                                connect: { id: data.nomenclatureGroups[0].id }
                            } : undefined
                        }
                    });
                    createdProducts.push(newProduct);
                    console.log(`   ✅ Создан продукт: ${newProduct.name} (${newProduct.id})`);
                } else {
                    console.log(`   ✅ Продукт уже существует: ${existingProduct.name} (${existingProduct.id})`);
                }
            } catch (error) {
                console.log(`   ❌ Ошибка создания продукта ${productId}: ${error.message}`);
            }
        }

        console.log(`\n✅ Создано продуктов: ${createdProducts.length}`);
        console.log('🔧 Теперь можно восстановить projectProducts!');

    } catch (error) {
        console.error('❌ Ошибка исправления:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Получаем путь к файлу из аргументов командной строки
const backupPath = process.argv[2];
if (!backupPath) {
    console.error('❌ Укажите путь к файлу бэкапа');
    console.log('Использование: node fix-missing-products.js <путь_к_файлу>');
    process.exit(1);
}

fixMissingProducts(backupPath);
