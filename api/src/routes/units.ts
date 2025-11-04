import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Схема для создания единицы измерения
const unitCreateSchema = z.object({
    code: z.string().min(1, 'Код обязателен'),
    name: z.string().min(1, 'Название обязательно'),
    fullName: z.string().optional(),
    internationalCode: z.string().optional(),
});

// Схема для обновления единицы измерения
const unitUpdateSchema = unitCreateSchema.partial();

// GET /units - получить все единицы измерения
router.get('/', authenticateToken, async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { code: 'asc' },
        });
        res.json(units);
    } catch (error) {
        // console.error('Ошибка получения единиц измерения:', error);
        res.status(500).json({ error: 'Ошибка загрузки единиц измерения' });
    }
});

// GET /units/:id - получить единицу измерения по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const unit = await prisma.unit.findUnique({
            where: { id },
        });

        if (!unit) {
            return res.status(404).json({ error: 'Единица измерения не найдена' });
        }

        res.json(unit);
    } catch (error) {
        // console.error('Ошибка получения единицы измерения:', error);
        res.status(500).json({ error: 'Ошибка получения единицы измерения' });
    }
});

// POST /units - создать единицу измерения (только админы и менеджеры)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const validatedData = unitCreateSchema.parse(req.body);

        const unit = await prisma.unit.create({
            data: validatedData,
        });

        res.status(201).json(unit);
    } catch (error) {
        // console.error('Ошибка создания единицы измерения:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания единицы измерения' });
    }
});

// PUT /units/:id - обновить единицу измерения (только админы и менеджеры)
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = unitUpdateSchema.parse(req.body);

        const unit = await prisma.unit.update({
            where: { id },
            data: validatedData,
        });

        res.json(unit);
    } catch (error) {
        // console.error('Ошибка обновления единицы измерения:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления единицы измерения' });
    }
});

// DELETE /units/:id - удалить единицу измерения (только админы)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.unit.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        // console.error('Ошибка удаления единицы измерения:', error);
        res.status(500).json({ error: 'Ошибка удаления единицы измерения' });
    }
});

export default router;

