"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Схема валидации для создания пользователя
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['admin', 'manager', 'user']).default('user'),
    personId: zod_1.z.string().uuid().optional(),
});
// Схема валидации для обновления пользователя
const updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z.enum(['admin', 'manager', 'user']).optional(),
    isActive: zod_1.z.boolean().optional(),
    personId: zod_1.z.string().uuid().optional().nullable(),
});
// GET /users - получить список пользователей (только для авторизованных)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                personId: true,
                person: {
                    select: {
                        id: true,
                        lastName: true,
                        firstName: true,
                        middleName: true
                    }
                },
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});
// GET /users/:id - получить пользователя по ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ error: 'Ошибка получения пользователя' });
    }
});
// POST /users - создать пользователя (только для админов)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);
        // Проверяем, существует ли пользователь с таким email
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        // Хешируем пароль
        const passwordHash = bcryptjs_1.default.hashSync(data.password, 10);
        // Создаем пользователя
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                passwordHash,
                role: data.role,
                personId: data.personId || null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                personId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.status(201).json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        console.error('Ошибка создания пользователя:', error);
        res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
});
// PUT /users/:id - обновить пользователя (только для админов)
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Проверяем, что пользователь существует
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        // Проверяем уникальность email, если он изменился
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma_1.default.user.findUnique({
                where: { email: data.email }
            });
            if (emailExists) {
                return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
            }
        }
        // Проверяем, не пытается ли последний администратор изменить свою роль
        if (existingUser.role === 'admin' && data.role && data.role !== 'admin') {
            const adminCount = await prisma_1.default.user.count({
                where: {
                    role: 'admin',
                    isActive: true
                }
            });
            if (adminCount <= 1) {
                return res.status(400).json({
                    error: 'Последний активный администратор не может изменить свою роль'
                });
            }
        }
        // Проверяем, не пытается ли последний администратор деактивировать себя
        if (existingUser.role === 'admin' && data.isActive === false) {
            const adminCount = await prisma_1.default.user.count({
                where: {
                    role: 'admin',
                    isActive: true
                }
            });
            if (adminCount <= 1) {
                return res.status(400).json({
                    error: 'Последний активный администратор не может быть деактивирован'
                });
            }
        }
        // Подготавливаем данные для обновления
        const updateData = {};
        if (data.email) {
            updateData.email = data.email;
        }
        if (data.password) {
            updateData.passwordHash = bcryptjs_1.default.hashSync(data.password, 10);
        }
        if (data.role) {
            updateData.role = data.role;
        }
        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }
        if (data.personId !== undefined) {
            updateData.personId = data.personId || null;
        }
        // Обновляем пользователя
        const updatedUser = await prisma_1.default.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                personId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Неверные данные', details: error.issues });
        }
        console.error('Ошибка обновления пользователя:', error);
        res.status(500).json({ error: 'Ошибка обновления пользователя' });
    }
});
// DELETE /users/:id - удалить пользователя (только для админов)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Проверяем, что пользователь существует
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        // Проверяем, не является ли удаляемый пользователь последним администратором
        if (existingUser.role === 'admin') {
            const adminCount = await prisma_1.default.user.count({
                where: {
                    role: 'admin',
                    isActive: true
                }
            });
            if (adminCount <= 1) {
                return res.status(400).json({
                    error: 'Нельзя удалить последнего активного администратора системы'
                });
            }
        }
        // Удаляем пользователя
        await prisma_1.default.user.delete({
            where: { id }
        });
        res.json({ message: 'Пользователь удален' });
    }
    catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map