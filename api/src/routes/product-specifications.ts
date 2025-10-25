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
    version: z.number().int().min(1).optional(),
});

// Схема для обновления спецификации изделия
const productSpecificationUpdateSchema = productSpecificationCreateSchema.partial();

// GET /products/:productId/specifications - Получить все спецификации изделия
router.get('/products/:productId/specifications', authenticateToken, async (req, res) => {
    const { productId } = req.params;

    try {
        const productSpecifications = await prisma.productSpecification.findMany({
            where: { productId },
            include: {
                product: {
                    select: {
                        id: true,
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

        console.log('=== FETCHING PRODUCT SPECIFICATIONS ===');
        console.log('Product ID:', productId);
        console.log('Found specifications:', productSpecifications.length);
        productSpecifications.forEach(spec => {
            console.log(`Spec: ${spec.name}, isLocked: ${spec.isLocked}, ID: ${spec.id}`);
        });

        // Проверяем права доступа
        const userSpecifications = productSpecifications.filter(ps =>
            ps.productId === productId
        );

        res.json(userSpecifications);
    } catch (error) {
        console.error('Ошибка при получении спецификаций изделия:', error);
        res.status(500).json({ error: 'Ошибка при получении спецификаций изделия' });
    }
});

// POST /products/:productId/specifications - Создать новую спецификацию изделия
router.post('/products/:productId/specifications', authenticateToken, async (req, res) => {
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
        console.log('=== CREATING PRODUCT SPECIFICATION ===');
        console.log('Validated data:', validatedData);
        console.log('Product ID:', productId);

        const productSpecification = await prisma.productSpecification.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                version: validatedData.version || 1,
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

        // Проверяем, не заблокирована ли спецификация
        if (existingSpec.isLocked) {
            return res.status(403).json({ 
                error: 'Спецификация заблокирована для редактирования. Сначала удалите все дочерние спецификации.' 
            });
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

// DELETE /:id - Удалить спецификацию изделия
router.delete('/:id', authenticateToken, async (req, res) => {
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

        // Проверяем, не заблокирована ли спецификация
        if (existingSpec.isLocked) {
            return res.status(403).json({ 
                error: 'Спецификация заблокирована для удаления. Сначала удалите все дочерние спецификации.' 
            });
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

// GET /:id/specifications - Получить позиции спецификации
router.get('/:id/specifications', authenticateToken, async (req, res) => {
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

// POST /product-specifications/:id/copy - Копировать спецификацию изделия
router.post('/product-specifications/:id/copy', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа к оригинальной спецификации
        const originalSpec = await prisma.productSpecification.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            },
            include: {
                specifications: {
                    include: {
                        nomenclatureItem: true,
                        unit: true
                    }
                }
            }
        });

        if (!originalSpec) {
            return res.status(404).json({ error: 'Спецификация не найдена' });
        }

        // Создаем копию спецификации
        const copiedSpec = await prisma.productSpecification.create({
            data: {
                name: `${originalSpec.name} (копия)`,
                description: originalSpec.description,
                version: originalSpec.version,
                productId: originalSpec.productId,
                isLocked: false, // Новая спецификация не заблокирована
                totalSum: originalSpec.totalSum
            }
        });

        // Копируем все позиции спецификации
        for (const spec of originalSpec.specifications) {
            await prisma.specification.create({
                data: {
                    productSpecificationId: copiedSpec.id,
                    nomenclatureItemId: spec.nomenclatureItemId,
                    quantity: spec.quantity,
                    price: spec.price,
                    totalPrice: spec.totalPrice,
                    unitId: spec.unitId,
                    orderIndex: spec.orderIndex
                }
            });
        }

        // Блокируем оригинальную спецификацию
        console.log('=== BLOCKING ORIGINAL SPECIFICATION ===');
        console.log('Original spec ID:', id);
        console.log('Setting isLocked to true');
        
        const updatedSpec = await prisma.productSpecification.update({
            where: { id },
            data: { isLocked: true }
        });
        
        console.log('Updated specification:', updatedSpec);
        console.log('isLocked value:', updatedSpec.isLocked);

        res.status(201).json(copiedSpec);
    } catch (error) {
        console.error('Ошибка при копировании спецификации:', error);
        res.status(500).json({ error: 'Ошибка при копировании спецификации' });
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