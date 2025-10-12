const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Проверяем, есть ли уже пользователь с таким email
        const existingUser = await prisma.user.findUnique({
            where: { email: 'admin@test.com' }
        });

        if (existingUser) {
            console.log('Пользователь с email admin@test.com уже существует');

            // Обновляем роль на admin если это не админ
            if (existingUser.role !== 'admin') {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'admin' }
                });
                console.log('Роль пользователя изменена на admin');
            }
            return;
        }

        // Создаем нового админа
        const hashedPassword = await bcrypt.hash('password', 10);

        const admin = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true
            }
        });

        console.log('✅ Админ успешно создан!');
        console.log('Email:', admin.email);
        console.log('Password: password');
        console.log('Role:', admin.role);
    } catch (error) {
        console.error('❌ Ошибка создания админа:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
