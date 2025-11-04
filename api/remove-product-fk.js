const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔧 Удаление внешнего ключа из ProjectProductSpecificationList...');
        
        // Получаем имя внешнего ключа
        const result = await prisma.$queryRaw`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'ProjectProductSpecificationList' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%productId%'
        `;
        
        console.log('Найденные внешние ключи:', result);
        
        // Удаляем внешний ключ
        await prisma.$executeRaw`
            ALTER TABLE "ProjectProductSpecificationList" 
            DROP CONSTRAINT IF EXISTS "ProjectProductSpecificationList_productId_fkey"
        `;
        
        console.log('✅ Внешний ключ удален (если существовал)');
        
        // Проверяем, что внешний ключ удален
        const checkResult = await prisma.$queryRaw`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'ProjectProductSpecificationList' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%productId%'
        `;
        
        if (checkResult.length === 0) {
            console.log('✅ Подтверждено: внешний ключ удален');
        } else {
            console.log('⚠️  Внешний ключ все еще существует:', checkResult);
        }
        
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await prisma.$disconnect();
    }
})();

