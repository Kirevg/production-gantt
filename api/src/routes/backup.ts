import express, { Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        role: string;
    };
}

// POST /api/backup/create - Создать резервную копию базы данных
router.post('/create', authenticateToken, requireRole(['admin']), async (req, res: Response) => {
    try {

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

        // Формируем объект с данными
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
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
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ error: 'Данные для восстановления не предоставлены' });
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


        res.json({
            message: 'База данных успешно восстановлена',
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
        });

    } catch (error) {
        // console.error('❌ Ошибка восстановления базы данных:', error);
        res.status(500).json({
            error: 'Ошибка восстановления базы данных',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

export default router;

