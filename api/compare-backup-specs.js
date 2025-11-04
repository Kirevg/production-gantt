const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        // Читаем бэкап
        const backup = JSON.parse(fs.readFileSync('../backup_2025-11-04.json', 'utf8'));
        const backupIds = backup.data.projectProductSpecificationLists.map(s => s.id).sort();
        console.log('📦 ID в бэкапе:', backupIds);
        console.log('   Всего в бэкапе:', backupIds.length);

        // Читаем из базы
        const dbRecords = await prisma.projectProductSpecificationList.findMany({
            select: { id: true, name: true, productId: true }
        });
        const dbIds = dbRecords.map(s => s.id).sort();
        console.log('💾 ID в базе:', dbIds);
        console.log('   Всего в базе:', dbIds.length);

        // Сравниваем
        const missing = backupIds.filter(id => !dbIds.includes(id));
        const extra = dbIds.filter(id => !backupIds.includes(id));

        if (missing.length > 0) {
            console.log('❌ Отсутствуют в базе:', missing);
            for (const id of missing) {
                const backupItem = backup.data.projectProductSpecificationLists.find(s => s.id === id);
                console.log(`   - ${id}: ${backupItem.name} (productId: ${backupItem.productId})`);
            }
        }

        if (extra.length > 0) {
            console.log('⚠️  Лишние в базе:', extra);
        }

        if (missing.length === 0 && extra.length === 0) {
            console.log('✅ Все данные совпадают!');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        await prisma.$disconnect();
    }
})();

