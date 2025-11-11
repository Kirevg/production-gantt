import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Схема для создания единицы измерения
const unitCreateSchema = z.object({
    code: z.string().min(1, 'Код обязателен'),
    name: z.string().min(1, 'Название обязательно'),
    fullName: z.string().optional(),
    internationalCode: z.string().optional(),
    aliases: z.array(z.string().min(1)).optional(),
});

// Схема для обновления единицы измерения
const unitUpdateSchema = unitCreateSchema.partial();

const normalizeAlias = (value: string): string => {
    return value
        .trim()
        .toLowerCase()
        .replace(/[\.\,;:]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const prepareAliasData = (name?: string, aliases?: string[]) => {
    const aliasMap = new Map<string, { alias: string; normalizedAlias: string }>();

    const appendAlias = (aliasValue?: string) => {
        if (!aliasValue) {
            return;
        }
        const normalized = normalizeAlias(aliasValue);
        if (!normalized) {
            return;
        }
        const original = aliasValue.trim();
        aliasMap.set(normalized, {
            alias: original,
            normalizedAlias: normalized,
        });
    };

    appendAlias(name);
    aliases?.forEach(appendAlias);

    return Array.from(aliasMap.values());
};

// GET /units - получить все единицы измерения
router.get('/', authenticateToken, async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { code: 'asc' },
            include: {
                aliases: true,
            },
        });
        res.json(units);
    } catch (error) {
        // console.error('Ошибка получения единиц измерения:', error);
        res.status(500).json({ error: 'Ошибка загрузки единиц измерения' });
    }
});

// GET /units/:id - получить единицу измерения по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const unit = await prisma.unit.findUnique({
            where: { id },
        });

        if (!unit) {
            return res.status(404).json({ error: 'Единица измерения не найдена' });
        }

        res.json(unit);
    } catch (error) {
        // console.error('Ошибка получения единицы измерения:', error);
        res.status(500).json({ error: 'Ошибка получения единицы измерения' });
    }
});

// POST /units - создать единицу измерения (только админы и менеджеры)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const validatedData = unitCreateSchema.parse(req.body);
        const { aliases, ...unitData } = validatedData;

        const aliasRecords = prepareAliasData(unitData.name, aliases);

        const unit = await prisma.unit.create({
            data: {
                ...unitData,
                aliases: aliasRecords.length
                    ? {
                        create: aliasRecords,
                    }
                    : undefined,
            },
            include: {
                aliases: true,
            },
        });

        res.status(201).json(unit);
    } catch (error) {
        // console.error('Ошибка создания единицы измерения:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка создания единицы измерения' });
    }
});

// PUT /units/:id - обновить единицу измерения (только админы и менеджеры)
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = unitUpdateSchema.parse(req.body);
        const { aliases, ...unitData } = validatedData;

        let aliasRecords: ReturnType<typeof prepareAliasData> | undefined;
        if (aliases !== undefined) {
            aliasRecords = prepareAliasData(unitData.name ?? '', aliases);
        }

        const unit = await prisma.unit.update({
            where: { id },
            data: {
                ...unitData,
                ...(aliases !== undefined && {
                    aliases: {
                        deleteMany: { unitId: id },
                        create: aliasRecords ?? [],
                    },
                }),
            },
            include: {
                aliases: true,
            },
        });

        res.json(unit);
    } catch (error) {
        // console.error('Ошибка обновления единицы измерения:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Ошибка обновления единицы измерения' });
    }
});

// DELETE /units/:id - удалить единицу измерения (только админы)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.unit.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        // console.error('Ошибка удаления единицы измерения:', error);
        res.status(500).json({ error: 'Ошибка удаления единицы измерения' });
    }
});

export default router;

