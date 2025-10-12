import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Схема для создания физического лица
const personCreateSchema = z.object({
    lastName: z.string().min(1, 'Фамилия обязательна'),
    firstName: z.string().min(1, 'Имя обязательно'),
    middleName: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Неверный формат email').optional(),
    isProjectManager: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

// Схема для обновления физического лица
const personUpdateSchema = personCreateSchema.partial();

// GET /persons - получить всех физических лиц
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { isProjectManager, isActive, query } = req.query;

        const where: any = {};

        // Фильтр по роли руководителя проекта
        if (isProjectManager !== undefined) {
            where.isProjectManager = isProjectManager === 'true';
        }

        // Фильтр по активности
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        // Поиск по ФИО
        if (query) {
            where.OR = [
                { lastName: { contains: query as string, mode: 'insensitive' } },
                { firstName: { contains: query as string, mode: 'insensitive' } },
                { middleName: { contains: query as string, mode: 'insensitive' } },
            ];
        }

        const persons = await prisma.person.findMany({
            where,
            orderBy: [
                { lastName: 'asc' },
                { firstName: 'asc' }
            ],
        });

        res.json(persons);
    } catch (error) {
        console.error('Ошибка при получении физических лиц:', error);
        res.status(500).json({ error: 'Ошибка при получении физических лиц' });
    }
});

// GET /persons/:id - получить физическое лицо по ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const person = await prisma.person.findUnique({
            where: { id },
        });

        if (!person) {
            return res.status(404).json({ error: 'Физическое лицо не найдено' });
        }

        res.json(person);
    } catch (error) {
        console.error('Ошибка при получении физического лица:', error);
        res.status(500).json({ error: 'Ошибка при получении физического лица' });
    }
});

// POST /persons - создать физическое лицо
router.post('/', authenticateToken, async (req, res) => {
    try {
        const validatedData = personCreateSchema.parse(req.body);

        const person = await prisma.person.create({
            data: validatedData,
        });

        res.status(201).json(person);
    } catch (error) {
        console.error('Ошибка при создании физического лица:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при создании физического лица' });
    }
});

// PUT /persons/:id - обновить физическое лицо
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const validatedData = personUpdateSchema.parse(req.body);

        const person = await prisma.person.update({
            where: { id },
            data: validatedData,
        });

        res.json(person);
    } catch (error) {
        console.error('Ошибка при обновлении физического лица:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при обновлении физического лица' });
    }
});

// DELETE /persons/:id - удалить физическое лицо
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.person.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении физического лица:', error);
        res.status(500).json({ error: 'Ошибка при удалении физического лица' });
    }
});

export default router;

