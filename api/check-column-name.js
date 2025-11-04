const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        // Проверяем название колонки в базе
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ProjectProductSpecificationList' 
            AND (column_name LIKE '%product%' OR column_name = 'id')
            ORDER BY column_name
        `;
        
        console.log('📊 Колонки в таблице ProjectProductSpecificationList:');
        result.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type})`);
        });
        
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await prisma.$disconnect();
    }
})();

