import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        role: string;
    };
}

const router = Router();
const prisma = new PrismaClient();

// Схема для создания спецификации
const specificationCreateSchema = z.object({
    nomenclatureItemId: z.string().uuid().optional(),
    designation: z.string().optional(),
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
    unit: z.string().optional(),
    price: z.number().positive().optional(),
    totalPrice: z.number().positive().optional(),
});

// Схема для обновления спецификации
const specificationUpdateSchema = specificationCreateSchema.partial();

// GET /product-specifications/:id/specifications - Получить все спецификации для спецификации изделия
router.get('/product-specifications/:id/specifications', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Product Specification ID is required' });
        }

        // Проверяем права доступа к спецификации изделия
        const productSpec = await prisma.productSpecification.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!productSpec) {
            return res.status(404).json({ error: 'Спецификация изделия не найдена' });
        }

        const specifications = await prisma.specification.findMany({
            where: { productSpecificationId: id },
            include: {
                nomenclatureItem: {
                    select: {
                        id: true,
                        name: true,
                        designation: true,
                        article: true,
                        code1c: true,
                        manufacturer: true,
                        price: true
                    }
                }
            },
            orderBy: { orderIndex: 'asc' }
        });

        res.json(specifications);
    } catch (error) {
        console.error('Ошибка получения спецификаций:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// POST /product-specifications/:id/specifications - Создать новую спецификацию
router.post('/product-specifications/:id/specifications', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Product Specification ID is required' });
        }

        const data = specificationCreateSchema.parse(req.body);

        // Проверяем права доступа к спецификации изделия
        const productSpec = await prisma.productSpecification.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!productSpec) {
            return res.status(404).json({ error: 'Спецификация изделия не найдена' });
        }

        // Если выбрана позиция из номенклатуры, подтягиваем данные
        let specData = { ...data };
        if (data.nomenclatureItemId) {
            const nomenclatureItem = await prisma.nomenclatureItem.findUnique({
                where: { id: data.nomenclatureItemId }
            });

            if (nomenclatureItem) {
                // Автоматически заполняем поля из номенклатуры, если они не указаны
                if (!data.name) specData.name = nomenclatureItem.name;
                if (!data.designation) specData.designation = nomenclatureItem.designation || undefined;
                // if (!data.unit) specData.unit = nomenclatureItem.unit || undefined; // TODO: связь с Unit
                if (!data.price) specData.price = nomenclatureItem.price || undefined;
                if (!data.description) specData.description = nomenclatureItem.description || undefined;
            }
        }

        // Получаем максимальный orderIndex для сортировки
        const lastSpecification = await prisma.specification.findFirst({
            where: { productSpecificationId: id },
            orderBy: { orderIndex: 'desc' }
        });

        const orderIndex = lastSpecification ? lastSpecification.orderIndex + 1 : 0;

        // Вычисляем общую стоимость если есть цена и количество
        let totalPrice = specData.totalPrice;
        if (specData.price && specData.quantity && !totalPrice) {
            totalPrice = specData.price * specData.quantity;
        }

        const specificationData: any = {
            name: specData.name,
            description: specData.description || null,
            quantity: specData.quantity,
            // unit: specData.unit || null, // TODO: связь с Unit
            price: specData.price || null,
            designation: specData.designation || null,
            productSpecificationId: id,
            orderIndex,
            totalPrice: totalPrice || null
        };

        if (specData.nomenclatureItemId) {
            specificationData.nomenclatureItem = {
                connect: { id: specData.nomenclatureItemId }
            };
        }

        const specification = await prisma.specification.create({
            data: specificationData
        });

        res.status(201).json(specification);
    } catch (error) {
        console.error('Ошибка создания спецификации:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// PUT /specifications/:id - Обновить спецификацию
router.put('/specifications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Specification ID is required' });
        }

        const data = specificationUpdateSchema.parse(req.body);

        // Проверяем права доступа к спецификации
        const existingSpecification = await prisma.specification.findFirst({
            where: {
                id,
                productSpecification: {
                    product: {
                        project: {
                            ownerId: (req as AuthenticatedRequest).user.id
                        }
                    }
                }
            }
        });

        if (!existingSpecification) {
            return res.status(404).json({ error: 'Спецификация не найдена' });
        }

        // Вычисляем общую стоимость если есть цена и количество
        let totalPrice = data.totalPrice;
        if (data.price && data.quantity && !totalPrice) {
            totalPrice = data.price * data.quantity;
        }

        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.quantity !== undefined) updateData.quantity = data.quantity;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.designation !== undefined) updateData.designation = data.designation;
        if (totalPrice !== undefined) updateData.totalPrice = totalPrice;

        const specification = await prisma.specification.update({
            where: { id },
            data: updateData
        });

        res.json(specification);
    } catch (error) {
        console.error('Ошибка обновления спецификации:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// DELETE /specifications/:id - Удалить спецификацию
router.delete('/specifications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Specification ID is required' });
        }

        // Проверяем права доступа к спецификации
        const specification = await prisma.specification.findFirst({
            where: {
                id,
                productSpecification: {
                    product: {
                        project: {
                            ownerId: (req as AuthenticatedRequest).user.id
                        }
                    }
                }
            }
        });

        if (!specification) {
            return res.status(404).json({ error: 'Спецификация не найдена' });
        }

        await prisma.specification.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка удаления спецификации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// PUT /specifications/reorder - Переупорядочить спецификации
router.put('/specifications/reorder', authenticateToken, async (req, res) => {
    try {
        const { specificationOrders } = req.body;

        if (!Array.isArray(specificationOrders)) {
            return res.status(400).json({ error: 'Неверный формат данных' });
        }

        // Проверяем, что все спецификации принадлежат проектам пользователя
        const specificationIds = specificationOrders.map((item: any) => item.id);
        const specifications = await prisma.specification.findMany({
            where: {
                id: { in: specificationIds },
                productSpecification: {
                    product: {
                        project: {
                            ownerId: (req as AuthenticatedRequest).user.id
                        }
                    }
                }
            }
        });

        if (specifications.length !== specificationOrders.length) {
            return res.status(403).json({ error: 'Нет доступа к одной или нескольким спецификациям' });
        }

        // Обновляем порядок
        const updatePromises = specificationOrders.map((item: any) =>
            prisma.specification.update({
                where: { id: item.id },
                data: { orderIndex: item.orderIndex }
            })
        );

        await Promise.all(updatePromises);

        res.json({ message: 'Порядок спецификаций обновлен' });
    } catch (error) {
        console.error('Ошибка переупорядочивания спецификаций:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;
