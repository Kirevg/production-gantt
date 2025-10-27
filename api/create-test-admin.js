const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestAdmin() {
    try {
        // Удаляем существующего админа
        await prisma.user.deleteMany({
            where: { email: 'admin@test.com' }
        });

        // Создаем нового админа с паролем test123
        const hashedPassword = await bcrypt.hash('test123', 10);

        const admin = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true
            }
        });

        console.log('Тестовый админ создан:', admin.email);
        console.log('Пароль: test123');
    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAdmin();

