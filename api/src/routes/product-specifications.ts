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
const projectProductSpecificationListCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
    version: z.number().int().min(1).optional(),
});

// Схема для обновления спецификации изделия
const projectProductSpecificationListUpdateSchema = projectProductSpecificationListCreateSchema.partial();

// GET /products/:productId/specifications - Получить все спецификации изделия
router.get('/products/:productId/specifications', authenticateToken, async (req, res) => {
    const { productId } = req.params;

    try {
        console.log('=== FETCHING PRODUCT SPECIFICATIONS ===');
        console.log('Product ID (projectProductId):', productId);
        
        // Проверяем, существует ли ProjectProduct с таким ID
        const projectProduct = await prisma.projectProduct.findUnique({
            where: { id: productId },
            select: { id: true, projectId: true }
        });

        if (!projectProduct) {
            console.log('❌ ProjectProduct not found with ID:', productId);
            return res.json([]);
        }

        console.log('✅ ProjectProduct found:', projectProduct.id, 'Project:', projectProduct.projectId);
        
        const projectProductSpecificationLists = await prisma.projectProductSpecificationList.findMany({
            where: { projectProductId: productId },
            include: {
                projectProduct: {
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

        console.log('Found specifications:', projectProductSpecificationLists.length);
        projectProductSpecificationLists.forEach(spec => {
            console.log(`Spec: ${spec.name}, isLocked: ${spec.isLocked}, ID: ${spec.id}, projectProductId: ${spec.projectProductId}`);
        });

        // Проверяем права доступа (фильтр избыточен, так как мы уже фильтруем по projectProductId)
        const userSpecifications = projectProductSpecificationLists;

        console.log('Returning specifications:', userSpecifications.length);
        res.json(userSpecifications);
    } catch (error) {
        console.error('Ошибка при получении спецификаций изделия:', error);
        res.status(500).json({ error: 'Ошибка при получении спецификаций изделия', details: error instanceof Error ? error.message : String(error) });
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

        const validatedData = projectProductSpecificationListCreateSchema.parse(req.body);
        // console.log('=== CREATING PRODUCT SPECIFICATION ===');
        // console.log('Validated data:', validatedData);
        // console.log('Product ID:', productId);

        const projectProductSpecificationList = await prisma.projectProductSpecificationList.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                version: validatedData.version || 1,
                projectProduct: {
                    connect: { id: productId }
                }
            },
        });
        res.status(201).json(projectProductSpecificationList);
    } catch (error) {
        // console.error('Ошибка при создании спецификации изделия:', error);
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
        const existingSpec = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                projectProduct: {
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

        const validatedData = projectProductSpecificationListUpdateSchema.parse(req.body);
        const projectProductSpecificationList = await prisma.projectProductSpecificationList.update({
            where: { id },
            data: validatedData,
        });
        res.json(projectProductSpecificationList);
    } catch (error) {
        // console.error('Ошибка при обновлении спецификации изделия:', error);
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
        const existingSpec = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                projectProduct: {
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

        // Разблокируем предыдущую версию (если есть)
        const previousSpec = await prisma.projectProductSpecificationList.findFirst({
            where: {
                projectProductId: existingSpec.projectProductId,
                name: existingSpec.name,
                version: existingSpec.version - 1,
                isLocked: true
            }
        });

        if (previousSpec) {
            // console.log(`Разблокируем предыдущую версию ${previousSpec.id} (v${previousSpec.version})`);
            await prisma.projectProductSpecificationList.update({
                where: { id: previousSpec.id },
                data: { isLocked: false }
            });
        }

        await prisma.projectProductSpecificationList.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        // console.error('Ошибка при удалении спецификации изделия:', error);
        res.status(500).json({ error: 'Ошибка при удалении спецификации изделия' });
    }
});

// GET /:id - Получить информацию о спецификации
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
        const projectProductSpecificationList = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                projectProduct: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!projectProductSpecificationList) {
            return res.status(404).json({ error: 'Спецификация изделия не найдена' });
        }

        res.json(projectProductSpecificationList);
    } catch (error) {
        // console.error('Ошибка при получении спецификации:', error);
        res.status(500).json({ error: 'Ошибка при получении спецификации' });
    }
});

// GET /:id/specifications - Получить позиции спецификации
router.get('/:id/specifications', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа
        const projectProductSpecificationList = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                projectProduct: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!projectProductSpecificationList) {
            return res.status(404).json({ error: 'Спецификация изделия не найдена' });
        }

        const specifications = await prisma.specification.findMany({
            where: { projectProductSpecificationListId: id },
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
        // console.error('Ошибка при получении позиций спецификации:', error);
        res.status(500).json({ error: 'Ошибка при получении позиций спецификации' });
    }
});

// POST /:id/copy - Копировать спецификацию изделия
router.post('/:id/copy', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем права доступа к оригинальной спецификации
        const originalSpec = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                projectProduct: {
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
        const copiedSpec = await prisma.projectProductSpecificationList.create({
            data: {
                name: originalSpec.name, // Название копируется БЕЗ добавления "(копия)"
                description: '', // Описание НЕ копируется - остается пустым
                version: (originalSpec.version || 1) + 1, // Увеличиваем версию на 1
                projectProductId: originalSpec.projectProductId,
                isLocked: false, // Новая спецификация не заблокирована
                totalSum: originalSpec.totalSum
            }
        });

        // Копируем все позиции спецификации
        for (const spec of originalSpec.specifications) {
            await prisma.specification.create({
                data: {
                    projectProductSpecificationListId: copiedSpec.id,
                    nomenclatureItemId: spec.nomenclatureItemId,
                    quantity: spec.quantity,
                    price: spec.price,
                    totalPrice: spec.totalPrice,
                    unitId: spec.unitId,
                    orderIndex: spec.orderIndex,
                    version: copiedSpec.version // Синхронизируем версию с ProjectProductSpecificationList
                }
            });
        }

        // Блокируем оригинальную спецификацию
        // console.log('=== BLOCKING ORIGINAL SPECIFICATION ===');
        // console.log('Original spec ID:', id);
        // console.log('Setting isLocked to true');

        const updatedSpec = await prisma.projectProductSpecificationList.update({
            where: { id },
            data: { isLocked: true }
        });

        // console.log('Updated specification:', updatedSpec);
        // console.log('isLocked value:', updatedSpec.isLocked);

        res.status(201).json(copiedSpec);
    } catch (error) {
        // console.error('Ошибка при копировании спецификации:', error);
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
                projectProductSpecificationList: {
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
        // console.error('Ошибка при обновлении позиции спецификации:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка при обновлении позиции спецификации' });
    }
});

// GET /:id/compare/:version1/:version2 - Сравнить две версии спецификации
router.get('/:id/compare/:version1/:version2', authenticateToken, async (req, res) => {
    const { id, version1, version2 } = req.params;

    try {
        // Проверяем права доступа
        const projectProductSpecificationList = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                projectProduct: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!projectProductSpecificationList) {
            return res.status(404).json({ error: 'Спецификация изделия не найдена' });
        }

        // Получаем текущую спецификацию для определения productId и name
        const currentSpec = await prisma.projectProductSpecificationList.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!currentSpec) {
            return res.status(404).json({ error: 'Спецификация не найдена' });
        }

        // Определяем версии: дочерняя = текущая, родительская = текущая - 1
        const childVersion = currentSpec.version;
        const parentVersion = childVersion - 1;

        // Находим родительскую и дочернюю спецификации
        const [parentSpec, childSpec] = await Promise.all([
            // Родительская спецификация (версия = текущая - 1)
            prisma.projectProductSpecificationList.findFirst({
                where: {
                    projectProductId: currentSpec.projectProductId,
                    name: currentSpec.name,
                    version: parentVersion
                }
            }),
            // Дочерняя спецификация (версия = текущая)
            prisma.projectProductSpecificationList.findFirst({
                where: {
                    projectProductId: currentSpec.projectProductId,
                    name: currentSpec.name,
                    version: childVersion
                }
            })
        ]);

        if (!parentSpec || !childSpec) {
            return res.status(404).json({ error: 'Не найдены родительская или дочерняя спецификации для сравнения' });
        }

        // Получаем строки родительской и дочерней спецификаций
        const [version1Data, version2Data] = await Promise.all([
            prisma.specification.findMany({
                where: {
                    projectProductSpecificationListId: parentSpec.id // Строки родительской спецификации
                },
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
            }),
            prisma.specification.findMany({
                where: {
                    projectProductSpecificationListId: childSpec.id // Строки дочерней спецификации
                },
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
            })
        ]);

        // Сравниваем данные версий
        const changes = [];

        // Создаем карты для быстрого поиска по nomenclatureItemId
        const version1Map = new Map(version1Data.map(item => [item.nomenclatureItemId, item]));
        const version2Map = new Map(version2Data.map(item => [item.nomenclatureItemId, item]));

        // Находим изменения
        const allItemIds = new Set([...version1Map.keys(), ...version2Map.keys()]);

        for (const itemId of allItemIds) {
            const v1Item = version1Map.get(itemId);
            const v2Item = version2Map.get(itemId);

            if (!v1Item && v2Item) {
                // Новый элемент в версии 2
                changes.push({
                    type: 'added',
                    item: v2Item.nomenclatureItem,
                    version2: {
                        quantity: v2Item.quantity,
                        price: v2Item.price,
                        totalPrice: v2Item.totalPrice
                    }
                });
            } else if (v1Item && !v2Item) {
                // Удаленный элемент в версии 2
                changes.push({
                    type: 'removed',
                    item: v1Item.nomenclatureItem,
                    version1: {
                        quantity: v1Item.quantity,
                        price: v1Item.price,
                        totalPrice: v1Item.totalPrice
                    }
                });
            } else if (v1Item && v2Item) {
                // Проверяем изменения в существующем элементе
                const hasChanges =
                    v1Item.quantity !== v2Item.quantity ||
                    v1Item.price !== v2Item.price ||
                    v1Item.totalPrice !== v2Item.totalPrice;

                if (hasChanges) {
                    changes.push({
                        type: 'modified',
                        item: v1Item.nomenclatureItem,
                        version1: {
                            quantity: v1Item.quantity,
                            price: v1Item.price,
                            totalPrice: v1Item.totalPrice
                        },
                        version2: {
                            quantity: v2Item.quantity,
                            price: v2Item.price,
                            totalPrice: v2Item.totalPrice
                        }
                    });
                }
            }
        }

        res.json({
            version1: parentSpec.version,
            version2: childSpec.version,
            changes: changes,
            message: `Найдено ${changes.length} изменений между родительской (v${parentSpec.version}) и дочерней (v${childSpec.version}) спецификациями`
        });

    } catch (error) {
        // console.error('Ошибка при сравнении версий:', error);
        res.status(500).json({ error: 'Ошибка при сравнении версий' });
    }
});

export default router;