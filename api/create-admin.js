const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Проверяем, есть ли уже админ
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            console.log('Админ уже существует:', existingAdmin.email);
            return;
        }

        // Создаем нового админа
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true
            }
        });

        console.log('Админ создан:', admin.email);
    } catch (error) {
        console.error('Ошибка создания админа:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
