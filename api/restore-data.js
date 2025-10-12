const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreData() {
    try {
        console.log('🔄 Начинаю восстановление данных...');

        // Читаем дамп
        const backupPath = 'C:\\Projects\\backup_2025-10-04.json';
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

        console.log('📋 Данные из дампа загружены');

        // Очищаем существующие данные
        console.log('🧹 Очищаю существующие данные...');
        await prisma.specification.deleteMany();
        await prisma.productSpecification.deleteMany();
        await prisma.workStage.deleteMany();
        await prisma.product.deleteMany();
        await prisma.project.deleteMany();
        await prisma.workType.deleteMany();
        await prisma.contractor.deleteMany();
        await prisma.projectManager.deleteMany();
        await prisma.user.deleteMany();

        // Восстанавливаем пользователей
        console.log('👤 Восстанавливаю пользователей...');
        for (const user of backupData.data.users) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt)
                }
            });
        }

        // Восстанавливаем менеджеров проектов
        console.log('👨‍💼 Восстанавливаю менеджеров проектов...');
        for (const manager of backupData.data.projectManagers) {
            await prisma.projectManager.create({
                data: {
                    id: manager.id,
                    firstName: manager.firstName,
                    lastName: manager.lastName,
                    middleName: manager.middleName,
                    email: manager.email,
                    phone: manager.phone,
                    createdAt: new Date(manager.createdAt),
                    updatedAt: new Date(manager.updatedAt)
                }
            });
        }

        // Восстанавливаем подрядчиков
        console.log('🏗️ Восстанавливаю подрядчиков...');
        for (const contractor of backupData.data.contractors) {
            await prisma.contractor.create({
                data: {
                    id: contractor.id,
                    name: contractor.name,
                    contactName: contractor.contactName,
                    phone: contractor.phone,
                    email: contractor.email,
                    isActive: contractor.isActive,
                    createdAt: new Date(contractor.createdAt),
                    updatedAt: new Date(contractor.updatedAt)
                }
            });
        }

        // Восстанавливаем типы работ
        console.log('🔧 Восстанавливаю типы работ...');
        for (const workType of backupData.data.workTypes) {
            await prisma.workType.create({
                data: {
                    id: workType.id,
                    name: workType.name,
                    description: workType.description,
                    isActive: workType.isActive,
                    createdAt: new Date(workType.createdAt),
                    updatedAt: new Date(workType.updatedAt)
                }
            });
        }

        // Восстанавливаем проекты
        console.log('📁 Восстанавливаю проекты...');
        for (const project of backupData.data.projects) {
            await prisma.project.create({
                data: {
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    startDate: project.startDate ? new Date(project.startDate) : null,
                    endDate: project.endDate ? new Date(project.endDate) : null,
                    ownerId: project.ownerId,
                    managerId: project.managerId,
                    orderIndex: project.orderIndex,
                    createdAt: new Date(project.createdAt),
                    updatedAt: new Date(project.updatedAt)
                }
            });
        }

        // Восстанавливаем продукты (бывшие tasks)
        console.log('📦 Восстанавливаю продукты...');
        for (const project of backupData.data.projects) {
            for (const task of project.tasks) {
                await prisma.product.create({
                    data: {
                        id: task.id,
                        name: task.name,
                        description: task.description,
                        productSum: task.productSum,
                        orderIndex: task.orderIndex,
                        version: task.version,
                        projectId: project.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            }
        }

        console.log('✅ Данные успешно восстановлены!');
        console.log('\n📊 Статистика:');
        console.log(`- Пользователей: ${backupData.data.users.length}`);
        console.log(`- Менеджеров: ${backupData.data.projectManagers.length}`);
        console.log(`- Подрядчиков: ${backupData.data.contractors.length}`);
        console.log(`- Типов работ: ${backupData.data.workTypes.length}`);
        console.log(`- Проектов: ${backupData.data.projects.length}`);

        let totalProducts = 0;
        for (const project of backupData.data.projects) {
            totalProducts += project.tasks.length;
        }
        console.log(`- Продуктов: ${totalProducts}`);

    } catch (error) {
        console.error('❌ Ошибка при восстановлении данных:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreData();
