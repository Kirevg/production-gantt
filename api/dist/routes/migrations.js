"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = express_1.default.Router();
// Применить миграции (prisma migrate deploy)
router.post('/deploy', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    console.log('Migration deploy request received');
    try {
        const command = 'npx prisma migrate deploy';
        console.log('Executing command:', command);
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 30000 // 30 секунд таймаут
        });
        console.log('Migration deploy stdout:', stdout);
        if (stderr) {
            console.log('Migration deploy stderr:', stderr);
        }
        res.json({
            message: 'Миграции успешно применены',
            output: stdout,
            warnings: stderr || null
        });
    }
    catch (error) {
        console.error('Ошибка применения миграций:', error);
        res.status(500).json({
            error: 'Ошибка применения миграций',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
// Сбросить миграции (prisma migrate reset) - ОПАСНО!
router.post('/reset', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    console.log('Migration reset request received');
    try {
        const { confirm } = req.body;
        if (!confirm) {
            return res.status(400).json({
                error: 'Требуется подтверждение для сброса миграций',
                message: 'Отправьте { "confirm": true } для подтверждения операции'
            });
        }
        const command = 'npx prisma migrate reset --force';
        console.log('Executing command:', command);
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 60000 // 60 секунд таймаут
        });
        console.log('Migration reset stdout:', stdout);
        if (stderr) {
            console.log('Migration reset stderr:', stderr);
        }
        res.json({
            message: 'Миграции успешно сброшены. База данных пересоздана.',
            output: stdout,
            warnings: stderr || null
        });
    }
    catch (error) {
        console.error('Ошибка сброса миграций:', error);
        res.status(500).json({
            error: 'Ошибка сброса миграций',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
// Проверить статус миграций (prisma migrate status)
router.get('/status', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    console.log('Migration status request received');
    try {
        const command = 'npx prisma migrate status';
        console.log('Executing command:', command);
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 15000 // 15 секунд таймаут
        });
        console.log('Migration status stdout:', stdout);
        if (stderr) {
            console.log('Migration status stderr:', stderr);
        }
        res.json({
            message: 'Статус миграций получен',
            status: stdout,
            warnings: stderr || null
        });
    }
    catch (error) {
        console.error('Ошибка проверки статуса миграций:', error);
        res.status(500).json({
            error: 'Ошибка проверки статуса миграций',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
// Создать новую миграцию (prisma migrate dev)
router.post('/create', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    console.log('Migration create request received');
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                error: 'Требуется имя для миграции',
                message: 'Отправьте { "name": "описание_миграции" }'
            });
        }
        const command = `npx prisma migrate dev --name ${name}`;
        console.log('Executing command:', command);
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 60000 // 60 секунд таймаут
        });
        console.log('Migration create stdout:', stdout);
        if (stderr) {
            console.log('Migration create stderr:', stderr);
        }
        res.json({
            message: `Миграция "${name}" успешно создана`,
            output: stdout,
            warnings: stderr || null
        });
    }
    catch (error) {
        console.error('Ошибка создания миграции:', error);
        res.status(500).json({
            error: 'Ошибка создания миграции',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
});
exports.default = router;
//# sourceMappingURL=migrations.js.map