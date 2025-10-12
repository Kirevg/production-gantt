import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Схема для создания вида номенклатуры
const kindCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
});

// Схема для обновления вида номенклатуры
const kindUpdateSchema = kindCreateSchema.partial();

// GET /nomenclature-kinds - получить все виды номенклатуры
router.get('/', authenticateToken, async (req, res) => {
    try {
        const kinds = await prisma.nomenclatureKind.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(kinds);
    } catch (error) {
        console.error('Ошибка получения видов номенклатуры:', error);
        res.status(500).json({ error: 'Ошибка загрузки видов номенклатуры' });
    }
});

// GET /nomenclature-kinds/:id - получить вид номенклатуры по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const kind = await prisma.nomenclatureKind.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        if (!kind) {
            return res.status(404).json({ error: 'Вид номенклатуры не найден' });
        }

        res.json(kind);
    } catch (error) {
        console.error('Ошибка получения вида номенклатуры:', error);
        res.status(500).json({ error: 'Ошибка получения вида номенклатуры' });
    }
});

// POST /nomenclature-kinds - создать вид номенклатуры (только админы и менеджеры)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const validatedData = kindCreateSchema.parse(req.body);

        const kind = await prisma.nomenclatureKind.create({
            data: validatedData,
        });

        res.status(201).json(kind);
    } catch (error) {
        console.error('Ошибка создания вида номенклатуры:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания вида номенклатуры' });
    }
});

// PUT /nomenclature-kinds/:id - обновить вид номенклатуры (только админы и менеджеры)
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = kindUpdateSchema.parse(req.body);

        const kind = await prisma.nomenclatureKind.update({
            where: { id },
            data: validatedData,
        });

        res.json(kind);
    } catch (error) {
        console.error('Ошибка обновления вида номенклатуры:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления вида номенклатуры' });
    }
});

// DELETE /nomenclature-kinds/:id - удалить вид номенклатуры (только админы)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.nomenclatureKind.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка удаления вида номенклатуры:', error);
        res.status(500).json({ error: 'Ошибка удаления вида номенклатуры' });
    }
});

export default router;

