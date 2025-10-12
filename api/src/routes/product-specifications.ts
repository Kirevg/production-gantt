import { Router, Request } from 'express';
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

// Схема для создания спецификации изделия
const productSpecificationCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
});

// Схема для обновления спецификации изделия
const productSpecificationUpdateSchema = productSpecificationCreateSchema.partial();

// GET /:productId/specifications - Получить все спецификации изделия
router.get('/:productId/specifications', authenticateToken, async (req, res) => {
    const { productId } = req.params;

    try {
        const productSpecifications = await prisma.productSpecification.findMany({
            where: { productId },
            include: {
                product: {
                    select: {
                        id: true,
                        nomenclatureItem: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        project: {
                            select: {
                                id: true,
                                name: true,
                                ownerId: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Проверяем права доступа
        const userSpecifications = productSpecifications.filter(ps =>
            ps.product.project.ownerId === (req as AuthenticatedRequest).user.id
        );

        res.json(userSpecifications);
    } catch (error) {
        console.error('Ошибка при получении спецификаций изделия:', error);
        res.status(500).json({ error: 'Ошибка при получении спецификаций изделия' });
    }
});

// POST /:productId/specifications - Создать новую спецификацию изделия
router.post('/:productId/specifications', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    try {
        // Проверяем права доступа к изделию
        const product = await prisma.projectProduct.findFirst({
            where: {
                id: productId,
                project: {
                    ownerId: (req as AuthenticatedRequest).user.id
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Изделие не найдено' });
        }

        const validatedData = productSpecificationCreateSchema.parse(req.body);

        const productSpecification = await prisma.productSpecification.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                product: {
                    connect: { id: productId }
                }
            },
        });
        res.status(201).json(productSpecification);
    } catch (error) {
        console.error('Ошибка при создании спецификации изделия:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при создании спецификации изделия' });
    }
});

// PUT /product-specifications/:id - Обновить спецификацию изделия
router.put('/product-specifications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
        const existingSpec = await prisma.productSpecification.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!existingSpec) {
            return res.status(404).json({ error: 'Спецификация не найдена' });
        }

        const validatedData = productSpecificationUpdateSchema.parse(req.body);
        const productSpecification = await prisma.productSpecification.update({
            where: { id },
            data: validatedData,
        });
        res.json(productSpecification);
    } catch (error) {
        console.error('Ошибка при обновлении спецификации изделия:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при обновлении спецификации изделия' });
    }
});

// DELETE /product-specifications/:id - Удалить спецификацию изделия
router.delete('/product-specifications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
        const existingSpec = await prisma.productSpecification.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!existingSpec) {
            return res.status(404).json({ error: 'Спецификация не найдена' });
        }

        await prisma.productSpecification.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении спецификации изделия:', error);
        res.status(500).json({ error: 'Ошибка при удалении спецификации изделия' });
    }
});

// GET /product-specifications/:id/specifications - Получить позиции спецификации
router.get('/product-specifications/:id/specifications', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
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
            orderBy: { orderIndex: 'asc' },
        });
        res.json(specifications);
    } catch (error) {
        console.error('Ошибка при получении позиций спецификации:', error);
        res.status(500).json({ error: 'Ошибка при получении позиций спецификации' });
    }
});

// POST /product-specifications/:id/specifications - Создать позицию спецификации
router.post('/product-specifications/:id/specifications', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
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

        const specificationCreateSchema = z.object({
            nomenclatureItemId: z.string().uuid().optional(),
            designation: z.string().optional(),
            name: z.string().min(1, 'Название обязательно'),
            article: z.string().optional(),
            code1c: z.string().optional(),
            group: z.string().optional(),
            manufacturer: z.string().optional(),
            description: z.string().optional(),
            quantity: z.number().int().min(1).default(1),
            unit: z.string().optional(),
            price: z.number().positive().optional(),
            totalPrice: z.number().positive().optional(),
        });

        const validatedData = specificationCreateSchema.parse(req.body);

        // Если выбрана позиция из номенклатуры, подтягиваем данные
        let specData = { ...validatedData };
        if (validatedData.nomenclatureItemId) {
            const nomenclatureItem = await prisma.nomenclatureItem.findUnique({
                where: { id: validatedData.nomenclatureItemId }
            });

            if (nomenclatureItem) {
                // Автоматически заполняем поля из номенклатуры, если они не указаны
                if (!validatedData.name) specData.name = nomenclatureItem.name;
                if (!validatedData.designation) specData.designation = nomenclatureItem.designation || undefined;
                // if (!validatedData.unit) specData.unit = nomenclatureItem.unit || undefined; // TODO: связь с Unit
                if (!validatedData.price) specData.price = nomenclatureItem.price || undefined;
                if (!validatedData.description) specData.description = nomenclatureItem.description || undefined;
                if (!validatedData.article) specData.article = nomenclatureItem.article || undefined;
                if (!validatedData.code1c) specData.code1c = nomenclatureItem.code1c || undefined;
                if (!validatedData.manufacturer) specData.manufacturer = nomenclatureItem.manufacturer || undefined;
            }
        }

        // Вычисляем общую стоимость если есть количество и цена
        let totalPrice = specData.totalPrice;
        if (!totalPrice && specData.quantity && specData.price) {
            totalPrice = specData.quantity * specData.price;
        }

        const lastSpecification = await prisma.specification.findFirst({
            where: { productSpecificationId: id },
            orderBy: { orderIndex: 'desc' },
        });

        const newOrderIndex = lastSpecification ? lastSpecification.orderIndex + 1 : 0;

        const specificationData: any = {
            name: specData.name,
            designation: specData.designation,
            article: specData.article,
            code1c: specData.code1c,
            group: specData.group,
            manufacturer: specData.manufacturer,
            description: specData.description,
            quantity: specData.quantity,
            // unit: specData.unit, // TODO: связь с Unit
            price: specData.price,
            totalPrice: totalPrice,
            orderIndex: newOrderIndex,
            productSpecification: {
                connect: { id: id }
            }
        };

        if (specData.nomenclatureItemId) {
            specificationData.nomenclatureItem = {
                connect: { id: specData.nomenclatureItemId }
            };
        }

        const specification = await prisma.specification.create({
            data: specificationData,
        });
        res.status(201).json(specification);
    } catch (error) {
        console.error('Ошибка при создании позиции спецификации:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при создании позиции спецификации' });
    }
});

// PUT /specifications/:id - Обновить позицию спецификации
router.put('/specifications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
        const existingSpec = await prisma.specification.findFirst({
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

        if (!existingSpec) {
            return res.status(404).json({ error: 'Позиция спецификации не найдена' });
        }

        const specificationUpdateSchema = z.object({
            designation: z.string().optional(),
            name: z.string().min(1, 'Название обязательно').optional(),
            article: z.string().optional(),
            code1c: z.string().optional(),
            group: z.string().optional(),
            manufacturer: z.string().optional(),
            description: z.string().optional(),
            quantity: z.number().int().min(1).optional(),
            unit: z.string().optional(),
            price: z.number().positive().optional(),
            totalPrice: z.number().positive().optional(),
        });

        const validatedData = specificationUpdateSchema.parse(req.body);

        // Вычисляем общую стоимость если есть количество и цена
        let totalPrice = validatedData.totalPrice;
        if (!totalPrice && validatedData.quantity && validatedData.price) {
            totalPrice = validatedData.quantity * validatedData.price;
        } else if (!totalPrice && existingSpec.quantity && validatedData.price) {
            totalPrice = existingSpec.quantity * validatedData.price;
        } else if (!totalPrice && validatedData.quantity && existingSpec.price) {
            totalPrice = validatedData.quantity * existingSpec.price;
        }

        const { unit: _, ...updateData } = validatedData; // Убираем unit
        const specification = await prisma.specification.update({
            where: { id },
            data: {
                ...updateData,
                ...(totalPrice && { totalPrice }),
            },
        });
        res.json(specification);
    } catch (error) {
        console.error('Ошибка при обновлении позиции спецификации:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при обновлении позиции спецификации' });
    }
});

export default router;