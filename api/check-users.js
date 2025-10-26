const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        console.log('Пользователи в базе данных:');
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
