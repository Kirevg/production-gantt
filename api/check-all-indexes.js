const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔍 Проверка всех индексов в ProjectProductSpecificationList...\n');

        const indexes = await prisma.$queryRaw`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'ProjectProductSpecificationList'
            ORDER BY indexname
        `;

        console.log('📑 Все индексы:');
        indexes.forEach(idx => {
            console.log(`   ${idx.indexname}`);
            console.log(`      ${idx.indexdef}`);
            console.log('');
        });

        // Проверяем, есть ли индекс на projectproductId
        const projectProductIndex = indexes.find(idx =>
            idx.indexdef.includes('projectproductId') ||
            idx.indexdef.includes('projectProductId')
        );

        if (!projectProductIndex) {
            console.log('⚠️  Индекс на projectproductId не найден!');
            console.log('   Нужно создать вручную:');
            console.log('   CREATE INDEX IF NOT EXISTS "ProjectProductSpecificationList_projectproductId_idx" ON "ProjectProductSpecificationList"("projectproductId");');
        } else {
            console.log('✅ Индекс на projectproductId существует');
        }

        // Проверяем старый индекс на productId
        const oldIndex = indexes.find(idx => idx.indexname.includes('productId') && !idx.indexname.includes('projectproductId'));
        if (oldIndex) {
            console.log('\n⚠️  Найден старый индекс на productId:');
            console.log(`   ${oldIndex.indexname}`);
            console.log('   Можно удалить вручную:');
            console.log(`   DROP INDEX IF EXISTS "${oldIndex.indexname}";`);
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await prisma.$disconnect();
    }
})();

