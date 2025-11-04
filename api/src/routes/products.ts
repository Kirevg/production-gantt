import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

const productCreateSchema = z.object({
  projectId: z.string().uuid(),
  productId: z.string().uuid(), // Ссылка на справочник изделий
  serialNumber: z.string().optional(),
  quantity: z.number().min(1).default(1),
  productSum: z.number().optional(),
  orderIndex: z.number().min(0).default(0),
});

const productUpdateSchema = productCreateSchema.partial().extend({
  version: z.number().min(1),
  status: z.enum(['InProject', 'InProgress', 'Done', 'HasProblems']).optional()
});

// Схема для создания этапов работ
const workStageCreateSchema = z.object({
  sum: z.string().max(200).optional().default(''), // Сумма этапа (необязательно)
  hours: z.string().optional().default(''), // Часы (необязательно)
  nomenclatureItemId: z.string().uuid(), // Вид работ (ОБЯЗАТЕЛЬНО)
  startDate: z.string().nullable().optional().transform(str => str ? new Date(str) : null),
  endDate: z.string().nullable().optional().transform(str => str ? new Date(str) : null),
  duration: z.number().min(1).default(1),
  progress: z.number().min(0).max(100).default(0),
  assigneeId: z.string().uuid().optional(),
  orderIndex: z.number().min(0).default(0),
  productId: z.string().uuid(),
});

const workStageUpdateSchema = workStageCreateSchema.partial();

// GET /projects/:projectId/products - получить изделия проекта
router.get('/:projectId/products', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { flat } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const products = await prisma.projectProduct.findMany({
      where: { projectId },
      select: {
        id: true,
        serialNumber: true,
        quantity: true,
        productSum: true,
        status: true,
        version: true,
        orderIndex: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        workStages: {
          select: {
            id: true,
            sum: true,
            hours: true,
            startDate: true,
            endDate: true,
            duration: true,
            progress: true,
            orderIndex: true,
            nomenclatureItem: {
              select: {
                id: true,
                name: true
              }
            },
            assignee: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    res.json(products);
  } catch (error) {
    // console.error('API Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /projects/:projectId/products - создать изделие (только для админов и менеджеров)
router.post('/:projectId/products', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = productCreateSchema.parse({
      ...req.body,
      projectId
    });

    const product = await prisma.projectProduct.create({
      data: data as any
    });

    res.status(201).json(product);
  } catch (error) {
    // console.error('Ошибка создания изделия:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({
      error: 'Failed to create product',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

// PUT /projects/:projectId/products/:productId - обновить изделие (только для админов и менеджеров)
router.put('/:projectId/products/:productId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { productId } = req.params;
    const data = productUpdateSchema.parse(req.body);

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Проверяем версию для оптимистичной блокировки
    const currentProduct = await prisma.projectProduct.findUnique({
      where: { id: productId },
      select: { version: true }
    });

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (data.version !== currentProduct.version) {
      return res.status(409).json({
        error: 'Version conflict',
        details: { currentVersion: currentProduct.version }
      });
    }

    const { version, ...updateData } = data;

    const product = await prisma.projectProduct.update({
      where: { id: productId },
      data: {
        ...updateData,
        version: { increment: 1 }
      } as any,
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /projects/:projectId/products/:productId - удалить изделие (только для админов и менеджеров)
router.delete('/:projectId/products/:productId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    await prisma.projectProduct.delete({
      where: { id: productId }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /projects/products/:productId/work-stages - получить этапы работ
router.get('/products/:productId/work-stages', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const workStages = await prisma.workStage.findMany({
      where: { productId: productId },
      select: {
        id: true,
        sum: true,
        hours: true,
        startDate: true,
        endDate: true,
        duration: true,
        progress: true,
        orderIndex: true,
        nomenclatureItem: {
          select: {
            id: true,
            name: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true
          }
        }
      } as any,
      orderBy: { orderIndex: 'asc' }
    });

    res.json(workStages);
  } catch (error) {
    // console.error('Ошибка получения этапов работ:', error);
    res.status(500).json({ error: 'Failed to fetch work stages' });
  }
});

// GET /projects/products/:productId - получить информацию об изделии
router.get('/products/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await prisma.projectProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        serialNumber: true,
        quantity: true,
        productSum: true,
        version: true,
        orderIndex: true,
        product: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    // console.error('Ошибка получения изделия:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /projects/products/:productId/work-stages - создать этап работ
router.post('/products/:productId/work-stages', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { productId } = req.params;
    const data = workStageCreateSchema.parse({
      ...req.body,
      productId: productId
    });

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Получаем максимальный orderIndex для изделия
    const lastStage = await prisma.workStage.findFirst({
      where: { productId: productId },
      orderBy: { orderIndex: 'desc' }
    });

    const orderIndex = lastStage ? lastStage.orderIndex + 1 : 0;

    const workStage = await prisma.workStage.create({
      data: {
        ...data as any,
        orderIndex: orderIndex
      }
    });

    res.status(201).json(workStage);
  } catch (error) {
    // console.error('Ошибка создания этапа работ:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({
      error: 'Failed to create work stage',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

// PUT /projects/products/:productId/work-stages/:workStageId - обновить этап работ
router.put('/products/:productId/work-stages/:workStageId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { workStageId } = req.params;

    if (!workStageId) {
      return res.status(400).json({ error: 'Work Stage ID is required' });
    }

    const data = workStageUpdateSchema.parse(req.body);

    // Исключаем orderIndex из обновления - он меняется только через drag-and-drop
    const { orderIndex, ...updateData } = data as any;

    const workStage = await prisma.workStage.update({
      where: { id: workStageId },
      data: updateData
    });

    res.json(workStage);
  } catch (error) {
    // console.error('Ошибка обновления этапа работ:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({
      error: 'Failed to update work stage',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

// DELETE /projects/products/:productId/work-stages/:workStageId - удалить этап работ
router.delete('/products/:productId/work-stages/:workStageId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { workStageId } = req.params;

    if (!workStageId) {
      return res.status(400).json({ error: 'Work Stage ID is required' });
    }

    await prisma.workStage.delete({
      where: { id: workStageId }
    });

    res.status(204).send();
  } catch (error) {
    // console.error('Ошибка удаления этапа работ:', error);
    res.status(500).json({ error: 'Failed to delete work stage' });
  }
});

// PUT /projects/products/reorder - изменить порядок изделий
router.put('/products/reorder', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { productOrders } = req.body;

    if (!Array.isArray(productOrders)) {
      return res.status(400).json({ error: 'productOrders must be an array' });
    }

    // Обновляем orderIndex для каждого изделия
    await Promise.all(
      productOrders.map((item: { id: string; orderIndex: number }) =>
        prisma.projectProduct.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка переупорядочивания изделий:', error);
    res.status(500).json({ error: 'Failed to reorder products', details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
