const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Удаляем существующего админа
        await prisma.user.deleteMany({
            where: {
                email: 'admin@test.com'
            }
        });

        // Создаем нового админа
        const admin = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true
            }
        });

        console.log('✅ Новый админ создан:');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        console.log('Role: admin');

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();

