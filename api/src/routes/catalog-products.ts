// API роуты для справочника изделий (Products)
// Управление справочником изделий, которые можно использовать в проектах
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Схема валидации для создания изделия
const productCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    designation: z.string().optional(),
    article: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

// Схема валидации для обновления изделия
const productUpdateSchema = z.object({
    name: z.string().min(1, 'Название обязательно').optional(),
    designation: z.string().optional(),
    article: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});

// GET /catalog-products - получить все изделия из справочника
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { isActive, query } = req.query;

        const where: any = {};

        // Фильтр по активности
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        // Поиск по названию, обозначению, артикулу
        if (query) {
            where.OR = [
                { name: { contains: query as string, mode: 'insensitive' } },
                { designation: { contains: query as string, mode: 'insensitive' } },
                { article: { contains: query as string, mode: 'insensitive' } },
            ];
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        res.json(products);
    } catch (error) {
        console.error('Ошибка получения изделий:', error);
        res.status(500).json({ error: 'Ошибка загрузки изделий' });
    }
});

// GET /catalog-products/:id - получить изделие по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                projectProducts: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Изделие не найдено' });
        }

        res.json(product);
    } catch (error) {
        console.error('Ошибка получения изделия:', error);
        res.status(500).json({ error: 'Ошибка загрузки изделия' });
    }
});

// POST /catalog-products - создать новое изделие
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const data = productCreateSchema.parse(req.body);

        const product = await prisma.product.create({
            data: {
                name: data.name,
                designation: data.designation || null,
                article: data.article || null,
                description: data.description || null,
                isActive: data.isActive ?? true,
            },
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Ошибка создания изделия:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания изделия' });
    }
});

// PUT /catalog-products/:id - обновить изделие
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = productUpdateSchema.parse(req.body);

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.designation !== undefined && { designation: data.designation }),
                ...(data.article !== undefined && { article: data.article }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                updatedAt: new Date(),
            },
        });

        res.json(product);
    } catch (error) {
        console.error('Ошибка обновления изделия:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления изделия' });
    }
});

// DELETE /catalog-products/:id - удалить изделие
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем, используется ли изделие в проектах
        const usedInProjects = await prisma.projectProduct.findFirst({
            where: { productId: id },
        });

        if (usedInProjects) {
            return res.status(400).json({
                error: 'Невозможно удалить изделие, используемое в проектах',
                details: 'Сначала удалите все экземпляры этого изделия из проектов'
            });
        }

        await prisma.product.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка удаления изделия:', error);
        res.status(500).json({ error: 'Ошибка удаления изделия' });
    }
});

export default router;

