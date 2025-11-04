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
            quantity: true,
            productSum: true,
            product: {
              select: {
                id: true,
                name: true
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

// GET /projects/gantt - получить все этапы работ для Gantt-диаграммы
router.get('/gantt', authenticateToken, async (req, res) => {
  try {
    // console.log('🔍 Запрос данных для Gantt-диаграммы');

    // Получаем все этапы работ со связанными данными
    const workStages = await prisma.workStage.findMany({
      include: {
        product: {
          select: {
            id: true,
            serialNumber: true,
            quantity: true,
            productSum: true,
            status: true,
            orderIndex: true,
            version: true,
            project: {
              include: {
                projectManager: {
                  select: {
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    phone: true,
                    email: true
                  }
                }
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        nomenclatureItem: true,
        assignee: true
      },
      orderBy: [
        { product: { project: { orderIndex: 'asc' } } },
        { product: { orderIndex: 'asc' } },
        { orderIndex: 'asc' }
      ]
    } as any);

    // console.log('📊 Найдено этапов работ:', workStages.length);

    // Получаем все проекты с изделиями, чтобы показать изделия без этапов
    const projectsWithProducts = await prisma.project.findMany({
      include: {
        projectManager: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
            email: true
          }
        },
        products: {
          select: {
            id: true,
            serialNumber: true,
            quantity: true,
            productSum: true,
            status: true,
            orderIndex: true,
            version: true,
            product: {
              select: {
                id: true,
                name: true,
                description: true
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
    } as any);

    // Создаем карту изделий с этапами, чтобы не дублировать их
    const productsWithStages = new Set<string>();
    workStages.forEach((stage: any) => {
      productsWithStages.add(stage.product.id);
    });

    // Преобразуем этапы работ в формат для Gantt-диаграммы
    const ganttData = workStages.map((stage: any) => ({
      id: stage.id,
      name: stage.nomenclatureItem?.name || 'Не указан',
      start: stage.startDate,
      end: stage.endDate,
      progress: stage.progress || 0,
      assignee: stage.assignee?.name || 'Не назначен',
      workType: stage.nomenclatureItem?.name || 'Не указан',
      sum: stage.sum,
      hours: stage.hours || '0',
      assigneeId: stage.assigneeId || null, // ID исполнителя
      workTypeId: stage.nomenclatureItemId || null, // ID вида работ
      orderIndex: stage.orderIndex || 0, // Индекс порядка этапа работ
      // Логируем для отладки
      _debug: {
        nomenclatureItemId: stage.nomenclatureItemId,
        nomenclatureItemName: stage.nomenclatureItem?.name
      },
      projectId: stage.product.project.id,
      projectName: stage.product.project.name,
      projectOrderIndex: stage.product.project.orderIndex,
      productId: stage.product.id,
      productOrderIndex: stage.product.orderIndex,
      productName: stage.product.product?.name || 'Изделие', // Теперь правильно получаем название из справочника
      productDescription: stage.product.product?.description || null, // Описание из справочника Product
      serialNumber: stage.product.serialNumber || null, // Серийный номер изделия
      productStatus: stage.product.status || 'InProject', // Статус изделия
      projectStatus: stage.product.project.status,
      duration: stage.duration,
      projectManager: stage.product.project.projectManager ? {
        name: `${stage.product.project.projectManager.lastName || ''} ${stage.product.project.projectManager.firstName || ''} ${stage.product.project.projectManager.middleName || ''}`.trim() || 'Не указан',
        phone: stage.product.project.projectManager.phone || null,
        email: stage.product.project.projectManager.email || null
      } : null
    }));

    // Создаем карту проектов, которые уже есть в ganttData
    const projectsInGantt = new Set<string>();
    ganttData.forEach((item: any) => {
      if (item.projectId) {
        projectsInGantt.add(item.projectId);
      }
    });

    // Добавляем изделия без этапов как пустые записи (без id, только для отображения структуры)
    projectsWithProducts.forEach((project: any) => {
      // Если у проекта нет изделий, добавляем его как проект без изделий
      if (project.products.length === 0) {
        const projectManager = project.projectManager ? {
          name: `${project.projectManager.lastName || ''} ${project.projectManager.firstName || ''} ${project.projectManager.middleName || ''}`.trim() || 'Не указан',
          phone: project.projectManager.phone || null,
          email: project.projectManager.email || null
        } : null;

        // Создаем запись проекта без изделий (используем специальный ID)
        ganttData.push({
          id: `project-only-${project.id}`, // Специальный ID для проектов без изделий
          name: '', // Пустое имя этапа
          start: null,
          end: null,
          progress: 0,
          assignee: null,
          workType: null,
          sum: null,
          hours: null,
          assigneeId: null,
          workTypeId: null,
          projectId: project.id,
          projectName: project.name,
          projectOrderIndex: project.orderIndex,
          productId: null, // Нет изделия
          productName: null,
          productDescription: null,
          serialNumber: null,
          projectStatus: project.status,
          duration: null,
          projectManager: projectManager
        });
      } else {
        // Если у проекта есть изделия, добавляем изделия без этапов
        project.products.forEach((projectProduct: any) => {
          // Если у изделия нет этапов, добавляем его для отображения
          if (!productsWithStages.has(projectProduct.id)) {
            const projectManager = project.projectManager ? {
              name: `${project.projectManager.lastName || ''} ${project.projectManager.firstName || ''} ${project.projectManager.middleName || ''}`.trim() || 'Не указан',
              phone: project.projectManager.phone || null,
              email: project.projectManager.email || null
            } : null;

            // Создаем запись изделия без этапа (используем специальный ID для идентификации)
            ganttData.push({
              id: `product-only-${projectProduct.id}`, // Специальный ID для изделий без этапов
              name: '', // Пустое имя этапа, так как этапа нет
              start: null, // Нет дат
              end: null,
              progress: 0,
              assignee: null,
              workType: null,
              sum: null,
              hours: null,
              assigneeId: null,
              workTypeId: null,
              projectId: project.id,
              projectName: project.name,
              projectOrderIndex: project.orderIndex,
              productId: projectProduct.id,
              productOrderIndex: projectProduct.orderIndex,
              productName: projectProduct.product?.name || 'Изделие',
              productDescription: projectProduct.product?.description || null,
              serialNumber: projectProduct.serialNumber || null,
              projectStatus: project.status,
              duration: null,
              projectManager: projectManager
            });
          }
        });
      }
    });

    // console.log('🎯 Отправляем данные Gantt:', ganttData.length, 'задач');
    res.json(ganttData);
  } catch (error) {
    // console.error('❌ Ошибка получения данных для Gantt-диаграммы:', error);
    // console.error('❌ Детали ошибки:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    // console.error('❌ Стек ошибки:', error instanceof Error ? error.stack : 'Нет стека');
    res.status(500).json({
      error: 'Failed to fetch gantt data',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
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
            quantity: true,
            productSum: true,
            orderIndex: true,
            version: true,
            product: {
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
    // console.error('Ошибка обновления порядка проектов:', error);

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

// PUT /projects/products/:productId/work-stages/order - обновить порядок этапов
router.put('/products/:productId/work-stages/order', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { stages } = req.body;

    // Валидация входных данных
    if (!Array.isArray(stages)) {
      return res.status(400).json({ error: 'stages должен быть массивом' });
    }

    // Проверяем, что все этапы принадлежат указанному изделию
    const existingStages = await prisma.workStage.findMany({
      where: { productId },
      select: { id: true }
    });

    const existingStageIds = existingStages.map(stage => stage.id);
    const requestStageIds = stages.map((stage: any) => stage.id);

    // Проверяем, что все запрашиваемые этапы существуют и принадлежат изделию
    const invalidStages = requestStageIds.filter(id => !existingStageIds.includes(id));
    if (invalidStages.length > 0) {
      return res.status(400).json({
        error: `Этапы не найдены или не принадлежат изделию: ${invalidStages.join(', ')}`
      });
    }

    // Обновляем порядок этапов
    const updatePromises = stages.map((stage: any) =>
      prisma.workStage.update({
        where: { id: stage.id },
        data: { orderIndex: stage.order }
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Порядок этапов успешно обновлен' });
  } catch (error) {
    // console.error('Ошибка обновления порядка этапов:', error);
    res.status(500).json({ error: 'Ошибка обновления порядка этапов' });
  }
});

export default router;
