const { PrismaClient } = require('@prisma/client');

async function renameTaskToProduct() {
    const prisma = new PrismaClient();

    try {
        console.log('🔄 Переименовываем Task в Product...');

        // 1. Обновляем WorkStage: taskId -> productId
        console.log('📝 Обновляем WorkStage...');
        const workStages = await prisma.workStage.findMany();
        console.log(`Найдено ${workStages.length} этапов работ`);

        for (const stage of workStages) {
            await prisma.$executeRaw`
                ALTER TABLE "WorkStage" 
                ADD COLUMN "productId" TEXT;
            `;
            break; // Добавляем колонку только один раз
        }

        // Копируем данные из taskId в productId
        await prisma.$executeRaw`
            UPDATE "WorkStage" 
            SET "productId" = "taskId";
        `;

        // Удаляем старую колонку taskId
        await prisma.$executeRaw`
            ALTER TABLE "WorkStage" 
            DROP COLUMN "taskId";
        `;

        console.log('✅ WorkStage обновлены');

        // 2. Переименовываем таблицу Task в Product
        console.log('📝 Переименовываем таблицу Task в Product...');
        await prisma.$executeRaw`
            ALTER TABLE "Task" 
            RENAME TO "Product";
        `;
        console.log('✅ Таблица Task переименована в Product');

        // 3. Обновляем ProjectSpecification: taskId -> productId
        console.log('📝 Обновляем ProjectSpecification...');
        await prisma.$executeRaw`
            ALTER TABLE "ProjectSpecification" 
            ADD COLUMN "productId" TEXT;
        `;

        await prisma.$executeRaw`
            UPDATE "ProjectSpecification" 
            SET "productId" = "taskId";
        `;

        await prisma.$executeRaw`
            ALTER TABLE "ProjectSpecification" 
            DROP COLUMN "taskId";
        `;
        console.log('✅ ProjectSpecification обновлены');

        // 4. Обновляем Specification: taskId -> productId
        console.log('📝 Обновляем Specification...');
        await prisma.$executeRaw`
            ALTER TABLE "Specification" 
            ADD COLUMN "productId" TEXT;
        `;

        await prisma.$executeRaw`
            UPDATE "Specification" 
            SET "productId" = "taskId";
        `;

        await prisma.$executeRaw`
            ALTER TABLE "Specification" 
            DROP COLUMN "taskId";
        `;
        console.log('✅ Specification обновлены');

        console.log('🎉 Переименование завершено!');

    } catch (error) {
        console.error('❌ Ошибка переименования:', error);
    } finally {
        await prisma.$disconnect();
    }
}

renameTaskToProduct();
