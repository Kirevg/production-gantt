import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  status: z.enum(['Planned', 'InProgress', 'Done', 'HasProblems']),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  ownerId: z.string().uuid(),
  projectManagerId: z.string().uuid().optional().nullable(),
});

const projectUpdateSchema = projectCreateSchema.partial();

// GET /projects - получить все проекты
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, query, from, to } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (query) {
      where.name = {
        contains: query as string,
        mode: 'insensitive'
      };
    }

    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from as string);
      if (to) where.startDate.lte = new Date(to as string);
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phone: true
          }
        },
        products: {
          select: {
            id: true,
            serialNumber: true,
            description: true,
            quantity: true,
            productSum: true,
            nomenclatureItem: {
              select: {
                id: true,
                name: true,
                designation: true
              }
            }
          }
        }
      } as any,
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ] as any
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /projects/:id - получить проект по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phone: true
          }
        },
        products: {
          select: {
            id: true,
            serialNumber: true,
            description: true,
            quantity: true,
            productSum: true,
            orderIndex: true,
            version: true,
            nomenclatureItem: {
              select: {
                id: true,
                name: true,
                designation: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /projects - создать проект (только для админов и менеджеров)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = projectCreateSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        ...data,
        projectManagerId: data.projectManagerId || null
      } as any,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phone: true
          }
        }
      } as any
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /projects/reorder - обновить порядок проектов (только для админов и менеджеров)
router.put('/reorder', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { projectOrders } = req.body;

    if (!Array.isArray(projectOrders)) {
      return res.status(400).json({ error: 'projectOrders must be an array' });
    }

    if (projectOrders.length === 0) {
      return res.status(400).json({ error: 'projectOrders array is empty' });
    }

    // Валидация данных
    for (const order of projectOrders) {
      if (!order.id || typeof order.orderIndex !== 'number') {
        return res.status(400).json({
          error: 'Invalid project order data. Each item must have id (string) and orderIndex (number)'
        });
      }
    }

    // Проверяем, что все проекты существуют
    const existingProjects = await prisma.project.findMany({
      where: {
        id: {
          in: projectOrders.map(order => order.id)
        }
      },
      select: { id: true }
    });

    if (existingProjects.length !== projectOrders.length) {
      const existingIds = existingProjects.map(p => p.id);
      const missingIds = projectOrders
        .map(order => order.id)
        .filter(id => !existingIds.includes(id));

      return res.status(404).json({
        error: 'One or more projects not found',
        missingIds
      });
    }

    // Обновляем orderIndex для каждого проекта в транзакции
    await prisma.$transaction(
      projectOrders.map(({ id, orderIndex }) =>
        prisma.project.update({
          where: { id },
          data: { orderIndex: orderIndex }
        })
      )
    );

    res.json({ message: 'Project order updated successfully' });
  } catch (error) {
    console.error('Ошибка обновления порядка проектов:', error);

    // Более детальная обработка ошибок
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return res.status(404).json({ error: 'One or more projects not found' });
      }
    }

    res.status(500).json({
      error: 'Failed to update project order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /projects/:id - обновить проект (только для админов и менеджеров)
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const data = projectUpdateSchema.parse(req.body);

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: data as any,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true
          }
        }
      }
    });

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /projects/:id - удалить проект (только для админов)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
