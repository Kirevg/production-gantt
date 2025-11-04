import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Схемы валидации для групп
const groupCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
    parentId: z.string().optional(),
});

const groupUpdateSchema = z.object({
    name: z.string().min(1, 'Название обязательно').optional(),
    description: z.string().optional(),
    parentId: z.string().optional(),
});

// Схемы валидации для позиций
const itemCreateSchema = z.object({
    groupId: z.string().optional(),
    kindId: z.string().optional(),
    unitId: z.string().optional(),
    designation: z.string().optional(),
    name: z.string().min(1, 'Наименование обязательно'),
    article: z.string().optional(),
    code1c: z.string().optional(),
    manufacturer: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    type: z.enum(['Product', 'Service', 'Work']).optional(),
});

const itemUpdateSchema = z.object({
    groupId: z.string().optional(),
    kindId: z.string().optional(),
    unitId: z.string().optional(),
    designation: z.string().optional(),
    name: z.string().min(1, 'Наименование обязательно').optional(),
    article: z.string().optional(),
    code1c: z.string().optional(),
    manufacturer: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    type: z.enum(['Product', 'Service', 'Work']).optional(),
});

// ============= РОУТЫ ДЛЯ ГРУПП =============

// GET /nomenclature/groups - получить все группы
router.get('/groups', authenticateToken, async (req, res) => {
    try {
        const groups = await prisma.nomenclatureGroup.findMany({
            orderBy: { name: 'asc' },
            include: {
                items: true,
                children: true,
            },
        });
        res.json(groups);
    } catch (error) {
        // console.error('Ошибка получения групп:', error);
        res.status(500).json({ error: 'Ошибка загрузки групп' });
    }
});

// GET /nomenclature/groups/:id - получить группу по ID
router.get('/groups/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const group = await prisma.nomenclatureGroup.findUnique({
            where: { id },
            include: {
                items: true,
                children: true,
            },
        });

        if (!group) {
            return res.status(404).json({ error: 'Группа не найдена' });
        }

        res.json(group);
    } catch (error) {
        // console.error('Ошибка получения группы:', error);
        res.status(500).json({ error: 'Ошибка загрузки группы' });
    }
});

// POST /nomenclature/groups - создать новую группу
router.post('/groups', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const data = groupCreateSchema.parse(req.body);
        const group = await prisma.nomenclatureGroup.create({
            data: {
                name: data.name,
                description: data.description || null,
                parentId: data.parentId || null,
            },
        });
        res.status(201).json(group);
    } catch (error) {
        // console.error('Ошибка создания группы:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания группы' });
    }
});

// PUT /nomenclature/groups/:id - обновить группу
router.put('/groups/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = groupUpdateSchema.parse(req.body);

        const group = await prisma.nomenclatureGroup.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.parentId !== undefined && { parentId: data.parentId }),
                updatedAt: new Date(),
            },
        });
        res.json(group);
    } catch (error) {
        // console.error('Ошибка обновления группы:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления группы' });
    }
});

// DELETE /nomenclature/groups/:id - удалить группу
router.delete('/groups/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем, есть ли позиции в этой группе
        const itemsInGroup = await prisma.nomenclatureItem.findFirst({
            where: { groupId: id },
        });

        if (itemsInGroup) {
            return res.status(400).json({
                error: 'Невозможно удалить группу, содержащую позиции'
            });
        }

        // Проверяем, есть ли подгруппы
        const childGroups = await prisma.nomenclatureGroup.findFirst({
            where: { parentId: id },
        });

        if (childGroups) {
            return res.status(400).json({
                error: 'Невозможно удалить группу, содержащую подгруппы'
            });
        }

        await prisma.nomenclatureGroup.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        // console.error('Ошибка удаления группы:', error);
        res.status(500).json({ error: 'Ошибка удаления группы' });
    }
});

// ============= РОУТЫ ДЛЯ ПОЗИЦИЙ =============

// GET /nomenclature - получить все позиции (корневой роут, алиас для /items)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { groupId, type, article, code1c, name } = req.query;

        const where: any = {};

        if (groupId) {
            where.groupId = groupId as string;
        }

        if (type) {
            where.type = type as string;
        }

        // Поиск по артикулу
        if (article) {
            where.article = {
                contains: article as string,
                mode: 'insensitive'
            };
        }

        // Поиск по коду 1С
        if (code1c) {
            where.code1c = {
                contains: code1c as string,
                mode: 'insensitive'
            };
        }

        // Поиск по названию
        if (name) {
            where.name = {
                contains: name as string,
                mode: 'insensitive'
            };
        }

        const items = await prisma.nomenclatureItem.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                group: true,
                kind: true,
                unit: true,
            },
        });
        res.json(items);
    } catch (error) {
        // console.error('Ошибка получения позиций:', error);
        res.status(500).json({ error: 'Ошибка загрузки позиций' });
    }
});

// GET /nomenclature/find - найти существующие позиции по полям
router.get('/find', authenticateToken, async (req, res) => {
    try {
        const { article, code1c, name, designation } = req.query;

        if (!article && !code1c && !name && !designation) {
            return res.status(400).json({ error: 'Необходимо указать хотя бы одно поле для поиска' });
        }

        const where: any = {};

        // Поиск по артикулу (точное совпадение)
        if (article) {
            where.article = {
                equals: article as string,
                mode: 'insensitive'
            };
        }

        // Поиск по коду 1С (точное совпадение)
        if (code1c) {
            where.code1c = {
                equals: code1c as string,
                mode: 'insensitive'
            };
        }

        // Поиск по обозначению (точное совпадение)
        if (designation) {
            where.designation = {
                equals: designation as string,
                mode: 'insensitive'
            };
        }

        // Поиск по названию (точное совпадение)
        if (name) {
            where.name = {
                equals: name as string,
                mode: 'insensitive'
            };
        }

        const items = await prisma.nomenclatureItem.findFirst({
            where,
            include: {
                group: true,
                kind: true,
                unit: true,
            },
        });

        res.json(items);
    } catch (error) {
        // console.error('Ошибка поиска позиции:', error);
        res.status(500).json({ error: 'Ошибка поиска позиции' });
    }
});

// GET /nomenclature/items - получить все позиции
router.get('/items', authenticateToken, async (req, res) => {
    try {
        const { groupId, type } = req.query;

        const where: any = {};

        if (groupId) {
            where.groupId = groupId as string;
        }

        if (type) {
            where.type = type as string;
        }

        const items = await prisma.nomenclatureItem.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                group: true,
                kind: true,
                unit: true,
            },
        });
        res.json(items);
    } catch (error) {
        // console.error('Ошибка получения позиций:', error);
        res.status(500).json({ error: 'Ошибка загрузки позиций' });
    }
});

// GET /nomenclature/items/:id - получить позицию по ID
router.get('/items/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.nomenclatureItem.findUnique({
            where: { id },
            include: {
                group: true,
                kind: true,
                unit: true,
            },
        });

        if (!item) {
            return res.status(404).json({ error: 'Позиция не найдена' });
        }

        res.json(item);
    } catch (error) {
        // console.error('Ошибка получения позиции:', error);
        res.status(500).json({ error: 'Ошибка загрузки позиции' });
    }
});

// POST /nomenclature/items - создать новую позицию
router.post('/items', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const data = itemCreateSchema.parse(req.body);
        const item = await prisma.nomenclatureItem.create({
            data: {
                groupId: data.groupId || null,
                kindId: data.kindId || null,
                unitId: data.unitId || null,
                designation: data.designation || null,
                name: data.name,
                article: data.article || null,
                code1c: data.code1c || null,
                manufacturer: data.manufacturer || null,
                description: data.description || null,
                price: data.price || null,
                type: data.type || 'Product',
            },
            include: {
                group: true,
                kind: true,
                unit: true,
            },
        });
        res.status(201).json(item);
    } catch (error) {
        // console.error('Ошибка создания позиции:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания позиции' });
    }
});

// PUT /nomenclature/items/:id - обновить позицию
router.put('/items/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = itemUpdateSchema.parse(req.body);

        const item = await prisma.nomenclatureItem.update({
            where: { id },
            data: {
                ...(data.groupId !== undefined && { groupId: data.groupId }),
                ...(data.kindId !== undefined && { kindId: data.kindId }),
                ...(data.unitId !== undefined && { unitId: data.unitId }),
                ...(data.designation !== undefined && { designation: data.designation }),
                ...(data.name !== undefined && { name: data.name }),
                ...(data.article !== undefined && { article: data.article }),
                ...(data.code1c !== undefined && { code1c: data.code1c }),
                ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.type !== undefined && { type: data.type }),
                updatedAt: new Date(),
            },
            include: {
                group: true,
                kind: true,
                unit: true,
            },
        });
        res.json(item);
    } catch (error) {
        // console.error('Ошибка обновления позиции:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления позиции' });
    }
});

// DELETE /nomenclature/items/:id - удалить позицию
router.delete('/items/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем, используется ли позиция в спецификациях
        const usedInSpecifications = await prisma.specification.findFirst({
            where: { nomenclatureItemId: id },
        });

        if (usedInSpecifications) {
            return res.status(400).json({
                error: 'Невозможно удалить позицию, используемую в спецификациях',
                details: 'Сначала удалите все спецификации, содержащие эту позицию'
            });
        }

        // Проверяем, используется ли позиция в изделиях
        const usedInProducts = await prisma.projectProduct.findFirst({
            where: { productId: id },
        });

        if (usedInProducts) {
            return res.status(400).json({
                error: 'Невозможно удалить позицию, используемую в изделиях',
                details: 'Сначала удалите все изделия, связанные с этой позицией'
            });
        }

        // Проверяем, используется ли позиция в этапах работ
        const usedInStages = await prisma.workStage.findFirst({
            where: { nomenclatureItemId: id },
        });

        if (usedInStages) {
            return res.status(400).json({
                error: 'Невозможно удалить позицию, используемую в этапах работ',
                details: 'Сначала удалите все этапы работ, связанные с этой позицией'
            });
        }

        await prisma.nomenclatureItem.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        // console.error('Ошибка удаления позиции:', error);
        res.status(500).json({ error: 'Ошибка удаления позиции' });
    }
});

export default router;

