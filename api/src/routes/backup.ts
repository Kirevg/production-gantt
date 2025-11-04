import express, { Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        role: string;
    };
}

// POST /api/backup/create - Создать резервную копию базы данных
// Включает:
// - Все данные из таблиц БД
// - Схему Prisma (schema.prisma) - для восстановления структуры БД
// - Информацию о примененных миграциях - для понимания состояния структуры БД
router.post('/create', authenticateToken, requireRole(['admin']), async (req, res: Response) => {
    try {
        // Читаем схему Prisma для сохранения структуры БД
        // Используем process.cwd() для определения корневой директории проекта
        const schemaPath = path.join(process.cwd(), 'api/prisma/schema.prisma');
        let prismaSchema = '';
        try {
            prismaSchema = await fs.readFile(schemaPath, 'utf-8');
        } catch (error) {
            // Если не удалось прочитать схему, пробуем альтернативный путь
            try {
                const altSchemaPath = path.join(__dirname, '../../prisma/schema.prisma');
                prismaSchema = await fs.readFile(altSchemaPath, 'utf-8');
            } catch (altError) {
                // Если не удалось прочитать схему, продолжаем без неё
                // console.error('⚠️ Не удалось прочитать schema.prisma:', error);
            }
        }

        // Получаем информацию о примененных миграциях из таблицы _prisma_migrations
        let migrations = [];
        try {
            migrations = await prisma.$queryRaw`
                SELECT 
                    migration_name,
                    finished_at,
                    started_at,
                    applied_steps_count
                FROM _prisma_migrations
                WHERE finished_at IS NOT NULL
                ORDER BY finished_at DESC
            ` as any[];
        } catch (error) {
            // Если таблица миграций не существует или ошибка, продолжаем без неё
            // console.error('⚠️ Не удалось прочитать информацию о миграциях:', error);
        }

        // Получаем все данные из всех таблиц
        const [
            users,
            persons,
            counterparties,
            units,
            projects,
            projectProducts,
            workStages,
            projectProductSpecificationLists,
            specifications,
            nomenclatureKinds,
            nomenclatureGroups,
            nomenclatureItems,
            auditLogs,
            refreshTokens
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.person.findMany(),
            prisma.counterparty.findMany(),
            prisma.unit.findMany(),
            prisma.project.findMany(),
            prisma.projectProduct.findMany(),
            prisma.workStage.findMany(),
            prisma.projectProductSpecificationList.findMany(),
            prisma.specification.findMany(),
            prisma.nomenclatureKind.findMany(),
            prisma.nomenclatureGroup.findMany(),
            prisma.nomenclatureItem.findMany(),
            prisma.auditLog.findMany(),
            prisma.refreshToken.findMany()
        ]);

        // Формируем объект с данными, включая схему БД и информацию о миграциях
        const backup = {
            timestamp: new Date().toISOString(),
            version: '2.0', // Увеличиваем версию, так как добавляем схему и миграции
            // Метаданные о структуре БД
            schema: {
                prismaSchema: prismaSchema, // Полная схема Prisma
                migrations: migrations // Информация о примененных миграциях
            },
            // Данные из таблиц
            data: {
                users,
                persons,
                counterparties,
                units,
                projects,
                projectProducts,
                workStages,
                projectProductSpecificationLists,
                specifications,
                nomenclatureKinds,
                nomenclatureGroups,
                nomenclatureItems,
                auditLogs,
                refreshTokens
            }
        };

        // Формируем имя файла с датой и временем
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `backup_${timestamp}.json`;


        // Отправляем файл как JSON для скачивания
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(backup);

    } catch (error) {
        // console.error('❌ Ошибка создания резервной копии:', error);
        res.status(500).json({
            error: 'Ошибка создания резервной копии',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

// POST /api/backup/restore - Восстановить базу данных из резервной копии
router.post('/restore', authenticateToken, requireRole(['admin']), async (req, res: Response) => {
    try {
        // Поддерживаем оба формата: старый (v1.0) и новый (v2.0)
        const backupData = req.body;
        const backupVersion = backupData.version || '1.0';
        
        // Определяем данные для восстановления
        // В новом формате данные находятся в backupData.data, в старом - прямо в backupData.data
        const data = backupData.data || backupData;

        if (!data) {
            return res.status(400).json({ error: 'Данные для восстановления не предоставлены' });
        }

        // Если это новый формат с информацией о схеме, выводим информацию
        if (backupVersion === '2.0' && backupData.schema) {
            // Информация о схеме сохранена в бэкапе, но для восстановления структуры БД
            // необходимо сначала применить миграции через админ-панель (кнопка "Применить миграции")
            // Это сделано для безопасности - чтобы случайно не перезаписать структуру БД
        }


        // Очищаем все таблицы (в правильном порядке из-за внешних ключей)
        await prisma.refreshToken.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.specification.deleteMany({});
        await prisma.projectProductSpecificationList.deleteMany({});
        await prisma.workStage.deleteMany({});
        await prisma.projectProduct.deleteMany({});
        await prisma.project.deleteMany({});
        await prisma.nomenclatureItem.deleteMany({});
        await prisma.nomenclatureGroup.deleteMany({});
        await prisma.nomenclatureKind.deleteMany({});
        await prisma.unit.deleteMany({});
        await prisma.counterparty.deleteMany({});
        await prisma.person.deleteMany({});
        await prisma.user.deleteMany({});

        // Восстанавливаем данные в правильном порядке
        if (data.users?.length) await prisma.user.createMany({ data: data.users });
        if (data.persons?.length) await prisma.person.createMany({ data: data.persons });
        if (data.counterparties?.length) await prisma.counterparty.createMany({ data: data.counterparties });
        if (data.units?.length) await prisma.unit.createMany({ data: data.units });
        if (data.nomenclatureKinds?.length) await prisma.nomenclatureKind.createMany({ data: data.nomenclatureKinds });
        if (data.nomenclatureGroups?.length) await prisma.nomenclatureGroup.createMany({ data: data.nomenclatureGroups });
        if (data.nomenclatureItems?.length) await prisma.nomenclatureItem.createMany({ data: data.nomenclatureItems });
        if (data.projects?.length) await prisma.project.createMany({ data: data.projects });
        if (data.projectProducts?.length) await prisma.projectProduct.createMany({ data: data.projectProducts });
        if (data.workStages?.length) await prisma.workStage.createMany({ data: data.workStages });
        if (data.projectProductSpecificationLists?.length) await prisma.projectProductSpecificationList.createMany({ data: data.projectProductSpecificationLists });
        if (data.specifications?.length) await prisma.specification.createMany({ data: data.specifications });
        if (data.auditLogs?.length) await prisma.auditLog.createMany({ data: data.auditLogs });
        if (data.refreshTokens?.length) await prisma.refreshToken.createMany({ data: data.refreshTokens });


        const response: any = {
            message: 'База данных успешно восстановлена',
            backupVersion: backupVersion,
            restored: {
                users: data.users?.length || 0,
                persons: data.persons?.length || 0,
                counterparties: data.counterparties?.length || 0,
                units: data.units?.length || 0,
                nomenclatureKinds: data.nomenclatureKinds?.length || 0,
                nomenclatureGroups: data.nomenclatureGroups?.length || 0,
                nomenclatureItems: data.nomenclatureItems?.length || 0,
                projects: data.projects?.length || 0,
                projectProducts: data.projectProducts?.length || 0,
                workStages: data.workStages?.length || 0,
                projectProductSpecificationLists: data.projectProductSpecificationLists?.length || 0,
                specifications: data.specifications?.length || 0
            }
        };

        // Добавляем информацию о схеме, если она была в бэкапе
        if (backupVersion === '2.0' && backupData.schema) {
            response.schemaInfo = {
                hasSchema: !!backupData.schema.prismaSchema,
                migrationsCount: backupData.schema.migrations?.length || 0,
                note: 'Для восстановления структуры БД примените миграции через админ-панель'
            };
        }

        res.json(response);

    } catch (error) {
        // console.error('❌ Ошибка восстановления базы данных:', error);
        res.status(500).json({
            error: 'Ошибка восстановления базы данных',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

export default router;

