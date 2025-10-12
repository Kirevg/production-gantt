const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateAdminPassword() {
    try {
        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Обновляем пароль существующего админа
        const admin = await prisma.user.update({
            where: {
                email: 'admin@test.com'
            },
            data: {
                passwordHash: hashedPassword
            }
        });

        console.log('✅ Пароль админа обновлен:');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        console.log('Role: admin');

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminPassword();

