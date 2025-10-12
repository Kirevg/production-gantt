const { PrismaClient } = require('@prisma/client');

async function migrateSpecifications() {
    const prisma = new PrismaClient();

    try {
        console.log('🔄 Начинаем миграцию спецификаций...');

        // 1. Получаем все проекты
        const projects = await prisma.project.findMany({
            include: {
                tasks: {
                    include: {
                        specifications: true
                    }
                }
            }
        });

        console.log(`📋 Найдено проектов: ${projects.length}`);

        for (const project of projects) {
            console.log(`\n📁 Проект: ${project.name}`);

            // 3. Для каждого изделия (Task) с спецификациями создаем отдельную ProjectSpecification
            let totalSpecs = 0;
            for (const task of project.tasks) {
                if (task.specifications.length > 0) {
                    console.log(`  📦 Изделие: ${task.name} (${task.specifications.length} позиций)`);

                    // Создаем ProjectSpecification для этого конкретного изделия
                    const projectSpec = await prisma.projectSpecification.create({
                        data: {
                            projectId: project.id,
                            taskId: task.id, // Связываем с конкретным изделием
                            name: `Спецификация: ${task.name}`,
                            description: `Спецификация для изделия ${task.name}`
                        }
                    });

                    console.log(`    ✅ Создана спецификация: ${projectSpec.name}`);

                    // Переносим спецификации этого изделия в созданную ProjectSpecification
                    for (const spec of task.specifications) {
                        await prisma.specification.update({
                            where: { id: spec.id },
                            data: {
                                projectSpecificationId: projectSpec.id,
                                taskId: null // Убираем привязку к Task
                            }
                        });
                        totalSpecs++;
                    }
                }
            }

            console.log(`  ✅ Перенесено позиций: ${totalSpecs}`);
        }

        // 4. Проверяем результат
        const totalProjectSpecs = await prisma.projectSpecification.count();
        const totalSpecs = await prisma.specification.count({
            where: {
                projectSpecificationId: { not: null }
            }
        });

        console.log(`\n🎉 Миграция завершена!`);
        console.log(`📊 Результат:`);
        console.log(`  - Спецификаций проекта: ${totalProjectSpecs}`);
        console.log(`  - Позиций спецификаций: ${totalSpecs}`);

    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateSpecifications();
