import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

// Интерфейс для аутентифицированного запроса
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        role: string;
    };
}

const router = Router();
const prisma = new PrismaClient();

// Схема для создания ссылки на модель
const modelLinkCreateSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    url: z.string().url('Некорректный URL'),
    description: z.string().optional(),
});

// Схема для обновления ссылки на модель
const modelLinkUpdateSchema = modelLinkCreateSchema.partial();

// GET /products/:productId/model-links - Получить все ссылки на модели для изделия
router.get('/products/:productId/model-links', authenticateToken, async (req, res) => {
    const { productId } = req.params;

    try {
        // Проверяем, существует ли ProjectProduct с таким ID и права доступа
        const projectProduct = await prisma.projectProduct.findFirst({
            where: {
                id: productId,
                project: {
                    ownerId: (req as AuthenticatedRequest).user.id
                }
            },
            select: { id: true, projectId: true }
        });

        if (!projectProduct) {
            return res.status(404).json({ error: 'Изделие не найдено' });
        }

        // Получаем все ссылки на модели для этого изделия
        const modelLinks = await prisma.modelLink.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(modelLinks);
    } catch (error) {
        console.error('Ошибка при получении ссылок на модели:', error);
        res.status(500).json({ 
            error: 'Ошибка при получении ссылок на модели', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
});

// POST /products/:productId/model-links - Создать новую ссылку на модель
router.post('/products/:productId/model-links', authenticateToken, async (req, res) => {
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

        // Валидируем данные
        const validatedData = modelLinkCreateSchema.parse(req.body);

        // Создаем ссылку на модель
        const modelLink = await prisma.modelLink.create({
            data: {
                name: validatedData.name,
                url: validatedData.url,
                description: validatedData.description,
                product: {
                    connect: { id: productId }
                }
            }
        });

        res.status(201).json(modelLink);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
        }
        console.error('Ошибка при создании ссылки на модель:', error);
        res.status(500).json({ 
            error: 'Ошибка при создании ссылки на модель', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
});

// PUT /model-links/:id - Обновить ссылку на модель
router.put('/model-links/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Проверяем права доступа
        const existingLink = await prisma.modelLink.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!existingLink) {
            return res.status(404).json({ error: 'Ссылка на модель не найдена' });
        }

        // Валидируем данные
        const validatedData = modelLinkUpdateSchema.parse(req.body);

        // Обновляем ссылку на модель
        const updatedLink = await prisma.modelLink.update({
            where: { id },
            data: validatedData
        });

        res.json(updatedLink);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
        }
        console.error('Ошибка при обновлении ссылки на модель:', error);
        res.status(500).json({ 
            error: 'Ошибка при обновлении ссылки на модель', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
});

// DELETE /model-links/:id - Удалить ссылку на модель
router.delete('/model-links/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Проверяем права доступа
        const existingLink = await prisma.modelLink.findFirst({
            where: {
                id,
                product: {
                    project: {
                        ownerId: (req as AuthenticatedRequest).user.id
                    }
                }
            }
        });

        if (!existingLink) {
            return res.status(404).json({ error: 'Ссылка на модель не найдена' });
        }

        // Удаляем ссылку на модель
        await prisma.modelLink.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении ссылки на модель:', error);
        res.status(500).json({ 
            error: 'Ошибка при удалении ссылки на модель', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
});

export default router;

