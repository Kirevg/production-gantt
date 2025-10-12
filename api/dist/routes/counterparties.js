"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Схема для создания контрагента
const counterpartyCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Название обязательно'),
    fullName: zod_1.z.string().optional(),
    inn: zod_1.z.string().optional(),
    kpp: zod_1.z.string().optional(),
    legalAddress: zod_1.z.string().optional(),
    contactName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Неверный формат email').optional(),
    isSupplier: zod_1.z.boolean().default(false),
    isManufacturer: zod_1.z.boolean().default(false),
    isContractor: zod_1.z.boolean().default(false),
    isActive: zod_1.z.boolean().default(true),
});
// Схема для обновления контрагента
const counterpartyUpdateSchema = counterpartyCreateSchema.partial();
// GET /counterparties - получить всех контрагентов
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { isSupplier, isManufacturer, isContractor, isActive, query } = req.query;
        const where = {};
        // Фильтры по типам контрагентов
        if (isSupplier !== undefined) {
            where.isSupplier = isSupplier === 'true';
        }
        if (isManufacturer !== undefined) {
            where.isManufacturer = isManufacturer === 'true';
        }
        if (isContractor !== undefined) {
            where.isContractor = isContractor === 'true';
        }
        // Фильтр по активности
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        // Поиск по названию
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { fullName: { contains: query, mode: 'insensitive' } },
                { inn: { contains: query, mode: 'insensitive' } },
            ];
        }
        const counterparties = await prisma.counterparty.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.json(counterparties);
    }
    catch (error) {
        console.error('Ошибка при получении контрагентов:', error);
        res.status(500).json({ error: 'Ошибка при получении контрагентов' });
    }
});
// GET /counterparties/:id - получить контрагента по ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const counterparty = await prisma.counterparty.findUnique({
            where: { id },
        });
        if (!counterparty) {
            return res.status(404).json({ error: 'Контрагент не найден' });
        }
        res.json(counterparty);
    }
    catch (error) {
        console.error('Ошибка при получении контрагента:', error);
        res.status(500).json({ error: 'Ошибка при получении контрагента' });
    }
});
// POST /counterparties - создать контрагента
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = counterpartyCreateSchema.parse(req.body);
        const counterparty = await prisma.counterparty.create({
            data: validatedData,
        });
        res.status(201).json(counterparty);
    }
    catch (error) {
        console.error('Ошибка при создании контрагента:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при создании контрагента' });
    }
});
// PUT /counterparties/:id - обновить контрагента
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const validatedData = counterpartyUpdateSchema.parse(req.body);
        const counterparty = await prisma.counterparty.update({
            where: { id },
            data: validatedData,
        });
        res.json(counterparty);
    }
    catch (error) {
        console.error('Ошибка при обновлении контрагента:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при обновлении контрагента' });
    }
});
// DELETE /counterparties/:id - удалить контрагента
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.counterparty.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Ошибка при удалении контрагента:', error);
        res.status(500).json({ error: 'Ошибка при удалении контрагента' });
    }
});
exports.default = router;
//# sourceMappingURL=counterparties.js.map