const { PrismaClient } = require('@prisma/client');

async function addTestData() {
    const prisma = new PrismaClient();

    try {
        // Найдем изделие с названием содержащим 'Чиллер'
        const task = await prisma.task.findFirst({
            where: {
                name: {
                    contains: 'Чиллер',
                    mode: 'insensitive'
                }
            }
        });

        if (!task) {
            console.log('Изделие Чиллер не найдено. Доступные изделия:');
            const allTasks = await prisma.task.findMany({
                select: { id: true, name: true }
            });
            allTasks.forEach(t => console.log(`- ${t.name} (ID: ${t.id})`));
            return;
        }

        console.log(`Найдено изделие: ${task.name} (ID: ${task.id})`);

        // Тестовые спецификации
        const testSpecs = [
            { designation: '1.1', name: 'Компрессор винтовой', description: 'Основной компрессор холодильного контура', quantity: 1, unit: 'шт', price: 250000 },
            { designation: '1.2', name: 'Конденсатор воздушного охлаждения', description: 'Теплообменник для отвода тепла', quantity: 1, unit: 'шт', price: 180000 },
            { designation: '1.3', name: 'Испаритель пластинчатый', description: 'Теплообменник для охлаждения воды', quantity: 1, unit: 'шт', price: 120000 },
            { designation: '2.1', name: 'Насос циркуляционный', description: 'Циркуляционный насос для охлаждаемой воды', quantity: 2, unit: 'шт', price: 45000 },
            { designation: '2.2', name: 'Фильтр-осушитель', description: 'Фильтр для очистки хладагента', quantity: 2, unit: 'шт', price: 8000 },
            { designation: '3.1', name: 'Реле давления', description: 'Защита от высокого и низкого давления', quantity: 4, unit: 'шт', price: 3500 },
            { designation: '3.2', name: 'Термостат', description: 'Контроль температуры воды', quantity: 2, unit: 'шт', price: 2500 },
            { designation: '4.1', name: 'Клапан запорный', description: 'Шаровые краны для отключения контуров', quantity: 8, unit: 'шт', price: 1200 },
            { designation: '5.1', name: 'Трубопровод медный', description: 'Медные трубы для хладагента', quantity: 50, unit: 'м', price: 850 },
            { designation: '5.2', name: 'Изоляция труб', description: 'Теплоизоляция для трубопроводов', quantity: 60, unit: 'м', price: 120 }
        ];

        // Удаляем существующие спецификации для этого изделия
        await prisma.specification.deleteMany({
            where: { taskId: task.id }
        });

        // Создаем новые спецификации
        for (let i = 0; i < testSpecs.length; i++) {
            const spec = testSpecs[i];
            const totalPrice = spec.price * spec.quantity;

            await prisma.specification.create({
                data: {
                    taskId: task.id,
                    designation: spec.designation,
                    name: spec.name,
                    description: spec.description,
                    quantity: spec.quantity,
                    unit: spec.unit,
                    price: spec.price,
                    totalPrice: totalPrice,
                    orderIndex: i
                }
            });

            console.log(`✓ ${spec.name} - ${totalPrice.toLocaleString()} ₽`);
        }

        console.log(`\n✅ Создано ${testSpecs.length} спецификаций для изделия "${task.name}"`);

    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addTestData();
