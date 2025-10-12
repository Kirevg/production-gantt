const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const email = 'admin@test.com';
        const password = 'admin123';

        // Проверяем, есть ли уже пользователь с таким email
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('Пользователь с таким email уже существует:', email);
            console.log('Роль:', existingUser.role);
            return;
        }

        // Создаем нового админа
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                email: email,
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true
            }
        });

        console.log('✅ Администратор успешно создан!');
        console.log('Email:', admin.email);
        console.log('Пароль:', password);
        console.log('Роль:', admin.role);
    } catch (error) {
        console.error('❌ Ошибка создания админа:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();

