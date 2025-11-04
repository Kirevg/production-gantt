const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔧 Добавление внешнего ключа между ProjectProductSpecificationList.projectproductId и ProjectProduct.id...');
        
        // Проверяем, существует ли уже внешний ключ
        const existingFK = await prisma.$queryRaw`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'ProjectProductSpecificationList' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%projectproductId%'
        `;
        
        if (existingFK.length > 0) {
            console.log('⚠️  Внешний ключ уже существует:', existingFK);
        } else {
            // Добавляем внешний ключ
            await prisma.$executeRaw`
                ALTER TABLE "ProjectProductSpecificationList" 
                ADD CONSTRAINT "ProjectProductSpecificationList_projectproductId_fkey" 
                FOREIGN KEY ("projectproductId") 
                REFERENCES "ProjectProduct"("id") 
                ON DELETE CASCADE
            `;
            
            console.log('✅ Внешний ключ добавлен');
        }
        
        // Проверяем результат
        const checkResult = await prisma.$queryRaw`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'ProjectProductSpecificationList' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%projectproductId%'
        `;
        
        if (checkResult.length > 0) {
            console.log('✅ Подтверждено: внешний ключ создан:', checkResult);
        } else {
            console.log('❌ Внешний ключ не найден');
        }
        
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await prisma.$disconnect();
    }
})();

