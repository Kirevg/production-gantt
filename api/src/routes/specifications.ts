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

// Функция для пересчёта итоговой суммы документа
async function recalculateProductSpecificationTotal(productSpecificationId: string) {
    const specifications = await prisma.specification.findMany({
        where: { productSpecificationId },
        select: { totalPrice: true }
    });

    const totalSum = specifications.reduce((sum, spec) => sum + (spec.totalPrice || 0), 0);

    await prisma.productSpecification.update({
        where: { id: productSpecificationId },
        data: { totalSum }
    });
}

// Схема для создания спецификации (принцип 1С - только ID номенклатуры, количество и цена)
const specificationCreateSchema = z.object({
    nomenclatureItemId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
    price: z.number().positive().optional().or(z.null()),
    totalPrice: z.number().positive().optional().or(z.null()),
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
                        description: true,
                        price: true,
                        unit: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        },
                        group: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
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

        let data;
        try {
            data = specificationCreateSchema.parse(req.body);
        } catch (validationError) {
            console.error('Ошибка валидации:', validationError);
            return res.status(400).json({
                error: 'Ошибка валидации данных',
                details: validationError
            });
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

        // Если выбрана позиция из номенклатуры, проверяем её существование
        let specData = { ...data };
        if (data.nomenclatureItemId) {
            const nomenclatureItem = await prisma.nomenclatureItem.findUnique({
                where: { id: data.nomenclatureItemId },
                include: { unit: true }
            });

            if (!nomenclatureItem) {
                return res.status(404).json({ error: 'Позиция номенклатуры не найдена' });
            }

            // Если цена не указана, берем из номенклатуры
            if (specData.price === undefined || specData.price === null) {
                specData.price = nomenclatureItem.price ?? undefined;
            }

            // Передаем единицу измерения из номенклатуры в спецификацию
            if (nomenclatureItem.unitId) {
                specData.unitId = nomenclatureItem.unitId;
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
            quantity: specData.quantity,
            price: specData.price ?? null,
            productSpecificationId: id,
            orderIndex,
            totalPrice: totalPrice ?? null,
            nomenclatureItemId: specData.nomenclatureItemId ?? null,
            unitId: specData.unitId ?? null
        };

        const specification = await prisma.specification.create({
            data: specificationData
        });

        // Пересчитываем итоговую сумму документа
        await recalculateProductSpecificationTotal(id);

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

        // По принципу 1С: обновляем количество, цену, сумму и номенклатуру
        const updateData: any = {};

        if (data.nomenclatureItemId !== undefined) updateData.nomenclatureItemId = data.nomenclatureItemId;
        if (data.quantity !== undefined) updateData.quantity = data.quantity;
        if (data.price !== undefined) updateData.price = data.price;
        if (totalPrice !== undefined) updateData.totalPrice = totalPrice;

        const specification = await prisma.specification.update({
            where: { id },
            data: updateData,
            include: {
                nomenclatureItem: true,
                unit: true
            }
        });

        // Пересчитываем итоговую сумму документа
        if (existingSpecification) {
            await recalculateProductSpecificationTotal(existingSpecification.productSpecificationId);
        }

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

        const productSpecificationId = specification.productSpecificationId;

        await prisma.specification.delete({
            where: { id }
        });

        // Пересчитываем итоговую сумму документа
        await recalculateProductSpecificationTotal(productSpecificationId);

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
