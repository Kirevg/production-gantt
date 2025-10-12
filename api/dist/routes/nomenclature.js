"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Схемы валидации для групп
const groupCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Название обязательно'),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().optional(),
});
const groupUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Название обязательно').optional(),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().optional(),
});
// Схемы валидации для позиций
const itemCreateSchema = zod_1.z.object({
    groupId: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Наименование обязательно'),
    article: zod_1.z.string().optional(),
    code1c: zod_1.z.string().optional(),
    manufacturer: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
});
const itemUpdateSchema = zod_1.z.object({
    groupId: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Наименование обязательно').optional(),
    article: zod_1.z.string().optional(),
    code1c: zod_1.z.string().optional(),
    manufacturer: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
});
// ============= РОУТЫ ДЛЯ ГРУПП =============
// GET /nomenclature/groups - получить все группы
router.get('/groups', auth_1.authenticateToken, async (req, res) => {
    try {
        const groups = await prisma.nomenclatureGroup.findMany({
            orderBy: { name: 'asc' },
            include: {
                items: true,
                children: true,
            },
        });
        res.json(groups);
    }
    catch (error) {
        console.error('Ошибка получения групп:', error);
        res.status(500).json({ error: 'Ошибка загрузки групп' });
    }
});
// GET /nomenclature/groups/:id - получить группу по ID
router.get('/groups/:id', auth_1.authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        console.error('Ошибка получения группы:', error);
        res.status(500).json({ error: 'Ошибка загрузки группы' });
    }
});
// POST /nomenclature/groups - создать новую группу
router.post('/groups', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
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
    }
    catch (error) {
        console.error('Ошибка создания группы:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания группы' });
    }
});
// PUT /nomenclature/groups/:id - обновить группу
router.put('/groups/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
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
    }
    catch (error) {
        console.error('Ошибка обновления группы:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления группы' });
    }
});
// DELETE /nomenclature/groups/:id - удалить группу
router.delete('/groups/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
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
    }
    catch (error) {
        console.error('Ошибка удаления группы:', error);
        res.status(500).json({ error: 'Ошибка удаления группы' });
    }
});
// ============= РОУТЫ ДЛЯ ПОЗИЦИЙ =============
// GET /nomenclature - получить все позиции (корневой роут, алиас для /items)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { groupId, type } = req.query;
        const where = {};
        if (groupId) {
            where.groupId = groupId;
        }
        if (type) {
            where.type = type;
        }
        const items = await prisma.nomenclatureItem.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                group: true,
            },
        });
        res.json(items);
    }
    catch (error) {
        console.error('Ошибка получения позиций:', error);
        res.status(500).json({ error: 'Ошибка загрузки позиций' });
    }
});
// GET /nomenclature/items - получить все позиции
router.get('/items', auth_1.authenticateToken, async (req, res) => {
    try {
        const { groupId, type } = req.query;
        const where = {};
        if (groupId) {
            where.groupId = groupId;
        }
        if (type) {
            where.type = type;
        }
        const items = await prisma.nomenclatureItem.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                group: true,
            },
        });
        res.json(items);
    }
    catch (error) {
        console.error('Ошибка получения позиций:', error);
        res.status(500).json({ error: 'Ошибка загрузки позиций' });
    }
});
// GET /nomenclature/items/:id - получить позицию по ID
router.get('/items/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.nomenclatureItem.findUnique({
            where: { id },
            include: {
                group: true,
            },
        });
        if (!item) {
            return res.status(404).json({ error: 'Позиция не найдена' });
        }
        res.json(item);
    }
    catch (error) {
        console.error('Ошибка получения позиции:', error);
        res.status(500).json({ error: 'Ошибка загрузки позиции' });
    }
});
// POST /nomenclature/items - создать новую позицию
router.post('/items', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const data = itemCreateSchema.parse(req.body);
        const item = await prisma.nomenclatureItem.create({
            data: {
                groupId: data.groupId || null,
                designation: data.designation || null,
                name: data.name,
                article: data.article || null,
                code1c: data.code1c || null,
                manufacturer: data.manufacturer || null,
                description: data.description || null,
                // unit: data.unit || null, // TODO: изменить на связь с Unit
                price: data.price || null,
            },
            include: {
                group: true,
            },
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error('Ошибка создания позиции:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания позиции' });
    }
});
// PUT /nomenclature/items/:id - обновить позицию
router.put('/items/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = itemUpdateSchema.parse(req.body);
        const item = await prisma.nomenclatureItem.update({
            where: { id },
            data: {
                ...(data.groupId !== undefined && { groupId: data.groupId }),
                ...(data.designation !== undefined && { designation: data.designation }),
                ...(data.name !== undefined && { name: data.name }),
                ...(data.article !== undefined && { article: data.article }),
                ...(data.code1c !== undefined && { code1c: data.code1c }),
                ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
                ...(data.description !== undefined && { description: data.description }),
                // ...(data.unit !== undefined && { unit: data.unit }), // TODO: изменить на связь с Unit
                ...(data.price !== undefined && { price: data.price }),
                updatedAt: new Date(),
            },
            include: {
                group: true,
            },
        });
        res.json(item);
    }
    catch (error) {
        console.error('Ошибка обновления позиции:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления позиции' });
    }
});
// DELETE /nomenclature/items/:id - удалить позицию
router.delete('/items/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.nomenclatureItem.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Ошибка удаления позиции:', error);
        res.status(500).json({ error: 'Ошибка удаления позиции' });
    }
});
exports.default = router;
//# sourceMappingURL=nomenclature.js.map