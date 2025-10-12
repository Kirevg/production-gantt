import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Схема для создания контрагента
const counterpartyCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    fullName: z.string().optional(),
    inn: z.string().optional(),
    kpp: z.string().optional(),
    legalAddress: z.string().optional(),
    contactName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Неверный формат email').optional(),
    isSupplier: z.boolean().default(false),
    isManufacturer: z.boolean().default(false),
    isContractor: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

// Схема для обновления контрагента
const counterpartyUpdateSchema = counterpartyCreateSchema.partial();

// GET /counterparties - получить всех контрагентов
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { isSupplier, isManufacturer, isContractor, isActive, query } = req.query;

        const where: any = {};

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
                { name: { contains: query as string, mode: 'insensitive' } },
                { fullName: { contains: query as string, mode: 'insensitive' } },
                { inn: { contains: query as string, mode: 'insensitive' } },
            ];
        }

        const counterparties = await prisma.counterparty.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        res.json(counterparties);
    } catch (error) {
        console.error('Ошибка при получении контрагентов:', error);
        res.status(500).json({ error: 'Ошибка при получении контрагентов' });
    }
});

// GET /counterparties/:id - получить контрагента по ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const counterparty = await prisma.counterparty.findUnique({
            where: { id },
        });

        if (!counterparty) {
            return res.status(404).json({ error: 'Контрагент не найден' });
        }

        res.json(counterparty);
    } catch (error) {
        console.error('Ошибка при получении контрагента:', error);
        res.status(500).json({ error: 'Ошибка при получении контрагента' });
    }
});

// POST /counterparties - создать контрагента
router.post('/', authenticateToken, async (req, res) => {
    try {
        const validatedData = counterpartyCreateSchema.parse(req.body);

        const counterparty = await prisma.counterparty.create({
            data: validatedData,
        });

        res.status(201).json(counterparty);
    } catch (error) {
        console.error('Ошибка при создании контрагента:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при создании контрагента' });
    }
});

// PUT /counterparties/:id - обновить контрагента
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const validatedData = counterpartyUpdateSchema.parse(req.body);

        const counterparty = await prisma.counterparty.update({
            where: { id },
            data: validatedData,
        });

        res.json(counterparty);
    } catch (error) {
        console.error('Ошибка при обновлении контрагента:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при обновлении контрагента' });
    }
});

// DELETE /counterparties/:id - удалить контрагента
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.counterparty.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении контрагента:', error);
        res.status(500).json({ error: 'Ошибка при удалении контрагента' });
    }
});

export default router;

