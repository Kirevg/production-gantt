const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔍 Проверка текущего состояния базы данных...\n');

        // Проверяем название колонки
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'ProjectProductSpecificationList' 
            AND column_name LIKE '%product%'
            ORDER BY column_name
        `;

        console.log('📊 Колонки в ProjectProductSpecificationList:');
        columns.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });

        // Проверяем внешние ключи
        const foreignKeys = await prisma.$queryRaw`
            SELECT 
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            LEFT JOIN information_schema.referential_constraints AS rc
              ON rc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'ProjectProductSpecificationList'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name LIKE '%product%'
        `;

        console.log('\n🔗 Внешние ключи:');
        if (foreignKeys.length === 0) {
            console.log('   ❌ Внешние ключи не найдены');
        } else {
            foreignKeys.forEach(fk => {
                console.log(`   ✅ ${fk.constraint_name}`);
                console.log(`      Колонка: ${fk.column_name}`);
                console.log(`      Ссылается на: ${fk.foreign_table_name}.${fk.foreign_column_name}`);
                console.log(`      ON DELETE: ${fk.delete_rule}`);
            });
        }

        // Проверяем индексы
        const indexes = await prisma.$queryRaw`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'ProjectProductSpecificationList'
            AND indexname LIKE '%product%'
        `;

        console.log('\n📑 Индексы:');
        if (indexes.length === 0) {
            console.log('   ❌ Индексы не найдены');
        } else {
            indexes.forEach(idx => {
                console.log(`   ${idx.indexname}`);
            });
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await prisma.$disconnect();
    }
})();

