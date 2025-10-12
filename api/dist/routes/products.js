"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const productCreateSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    nomenclatureItemId: zod_1.z.string().uuid(),
    serialNumber: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().min(1).default(1),
    productSum: zod_1.z.number().optional(),
    orderIndex: zod_1.z.number().min(0).default(0),
});
const productUpdateSchema = productCreateSchema.partial().extend({
    version: zod_1.z.number().min(1)
});
// Схема для создания этапов работ
const workStageCreateSchema = zod_1.z.object({
    sum: zod_1.z.string().min(1).max(200), // Сумма этапа
    hours: zod_1.z.string().optional(),
    workTypeId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().nullable().optional().transform(str => str ? new Date(str) : null),
    endDate: zod_1.z.string().nullable().optional().transform(str => str ? new Date(str) : null),
    duration: zod_1.z.number().min(1).default(1),
    progress: zod_1.z.number().min(0).max(100).default(0),
    assigneeId: zod_1.z.string().uuid().optional(),
    orderIndex: zod_1.z.number().min(0).default(0),
    productId: zod_1.z.string().uuid(),
});
const workStageUpdateSchema = workStageCreateSchema.partial();
// GET /projects/:projectId/products - получить изделия проекта
router.get('/:projectId/products', auth_1.authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { flat } = req.query;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        const products = await prisma_1.default.projectProduct.findMany({
            where: { projectId },
            select: {
                id: true,
                serialNumber: true,
                description: true,
                quantity: true,
                productSum: true,
                version: true,
                orderIndex: true,
                createdAt: true,
                updatedAt: true,
                nomenclatureItem: {
                    select: {
                        id: true,
                        name: true,
                        designation: true,
                        article: true,
                        code1c: true,
                        manufacturer: true,
                        unit: true,
                        price: true
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
        console.log('API: Products fetched:', JSON.stringify(products, null, 2));
        res.json(products);
    }
    catch (error) {
        console.error('API Error fetching products:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /projects/:projectId/products - создать изделие (только для админов и менеджеров)
router.post('/:projectId/products', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = productCreateSchema.parse({
            ...req.body,
            projectId
        });
        const product = await prisma_1.default.projectProduct.create({
            data: data
        });
        res.status(201).json(product);
    }
    catch (error) {
        console.error('Ошибка создания изделия:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.issues });
        }
        res.status(500).json({
            error: 'Failed to create product',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
// PUT /projects/:projectId/products/:productId - обновить изделие (только для админов и менеджеров)
router.put('/:projectId/products/:productId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { productId } = req.params;
        console.log('API: PUT request body:', JSON.stringify(req.body, null, 2));
        const data = productUpdateSchema.parse(req.body);
        console.log('API: Parsed data:', JSON.stringify(data, null, 2));
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        // Проверяем версию для оптимистичной блокировки
        const currentProduct = await prisma_1.default.projectProduct.findUnique({
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
        const product = await prisma_1.default.projectProduct.update({
            where: { id: productId },
            data: {
                ...updateData,
                version: { increment: 1 }
            },
        });
        res.json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
});
// DELETE /projects/:projectId/products/:productId - удалить изделие (только для админов и менеджеров)
router.delete('/:projectId/products/:productId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        await prisma_1.default.projectProduct.delete({
            where: { id: productId }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
// GET /projects/products/:productId/work-stages - получить этапы работ
router.get('/products/:productId/work-stages', auth_1.authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        const workStages = await prisma_1.default.workStage.findMany({
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
                workType: {
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
            orderBy: { orderIndex: 'asc' }
        });
        res.json(workStages);
    }
    catch (error) {
        console.error('Ошибка получения этапов работ:', error);
        res.status(500).json({ error: 'Failed to fetch work stages' });
    }
});
// GET /projects/products/:productId - получить информацию об изделии
router.get('/products/:productId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        const product = await prisma_1.default.projectProduct.findUnique({
            where: { id: productId },
            select: {
                id: true,
                serialNumber: true,
                description: true,
                quantity: true,
                productSum: true,
                version: true,
                orderIndex: true,
                nomenclatureItem: {
                    select: {
                        id: true,
                        name: true,
                        designation: true,
                        article: true,
                        code1c: true,
                        manufacturer: true,
                        unit: true,
                        price: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        console.error('Ошибка получения изделия:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});
// POST /projects/products/:productId/work-stages - создать этап работ
router.post('/products/:productId/work-stages', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { productId } = req.params;
        const data = workStageCreateSchema.parse({
            ...req.body,
            productId: productId
        });
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        const workStage = await prisma_1.default.workStage.create({
            data: data
        });
        res.status(201).json(workStage);
    }
    catch (error) {
        console.error('Ошибка создания этапа работ:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.issues });
        }
        res.status(500).json({
            error: 'Failed to create work stage',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
// PUT /projects/products/:productId/work-stages/:workStageId - обновить этап работ
router.put('/products/:productId/work-stages/:workStageId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { workStageId } = req.params;
        if (!workStageId) {
            return res.status(400).json({ error: 'Work Stage ID is required' });
        }
        const data = workStageUpdateSchema.parse(req.body);
        const workStage = await prisma_1.default.workStage.update({
            where: { id: workStageId },
            data: data
        });
        res.json(workStage);
    }
    catch (error) {
        console.error('Ошибка обновления этапа работ:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.issues });
        }
        res.status(500).json({
            error: 'Failed to update work stage',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
// DELETE /projects/products/:productId/work-stages/:workStageId - удалить этап работ
router.delete('/products/:productId/work-stages/:workStageId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { workStageId } = req.params;
        if (!workStageId) {
            return res.status(400).json({ error: 'Work Stage ID is required' });
        }
        await prisma_1.default.workStage.delete({
            where: { id: workStageId }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Ошибка удаления этапа работ:', error);
        res.status(500).json({ error: 'Failed to delete work stage' });
    }
});
// PUT /products/reorder - изменить порядок изделий
router.put('/reorder', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { productOrders } = req.body;
        if (!Array.isArray(productOrders)) {
            return res.status(400).json({ error: 'productOrders must be an array' });
        }
        // Обновляем orderIndex для каждого изделия
        await Promise.all(productOrders.map((item) => prisma_1.default.projectProduct.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex }
        })));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Ошибка переупорядочивания изделий:', error);
        res.status(500).json({ error: 'Failed to reorder products' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map