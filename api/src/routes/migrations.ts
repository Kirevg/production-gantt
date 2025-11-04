import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();

// Применить миграции (prisma migrate deploy)
router.post('/deploy', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const command = 'npx prisma migrate deploy';

        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 30000 // 30 секунд таймаут
        });

        res.json({
            message: 'Миграции успешно применены',
            output: stdout,
            warnings: stderr || null
        });
    } catch (error) {
        // console.error('Ошибка применения миграций:', error);
        res.status(500).json({
            error: 'Ошибка применения миграций',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

// Сбросить миграции (prisma migrate reset) - ОПАСНО!
router.post('/reset', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { confirm } = req.body;

        if (!confirm) {
            return res.status(400).json({
                error: 'Требуется подтверждение для сброса миграций',
                message: 'Отправьте { "confirm": true } для подтверждения операции'
            });
        }

        const command = 'npx prisma migrate reset --force';

        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 60000 // 60 секунд таймаут
        });

        res.json({
            message: 'Миграции успешно сброшены. База данных пересоздана.',
            output: stdout,
            warnings: stderr || null
        });
    } catch (error) {
        // console.error('Ошибка сброса миграций:', error);
        res.status(500).json({
            error: 'Ошибка сброса миграций',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

// Проверить статус миграций (prisma migrate status)
router.get('/status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const command = 'npx prisma migrate status';

        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 15000 // 15 секунд таймаут
        });

        res.json({
            message: 'Статус миграций получен',
            status: stdout,
            warnings: stderr || null
        });
    } catch (error) {
        // console.error('Ошибка проверки статуса миграций:', error);
        res.status(500).json({
            error: 'Ошибка проверки статуса миграций',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

// Создать новую миграцию (prisma migrate dev)
router.post('/create', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Требуется имя для миграции',
                message: 'Отправьте { "name": "описание_миграции" }'
            });
        }

        const command = `npx prisma migrate dev --name ${name}`;

        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 60000 // 60 секунд таймаут
        });


        res.json({
            message: `Миграция "${name}" успешно создана`,
            output: stdout,
            warnings: stderr || null
        });
    } catch (error) {
        // console.error('Ошибка создания миграции:', error);
        res.status(500).json({
            error: 'Ошибка создания миграции',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});

export default router;
