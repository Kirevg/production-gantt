// Роут для приёма логов с клиентской стороны (браузера)
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Интерфейс для лога
interface ClientLog {
    level: 'log' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
    url?: string;
    userAgent?: string;
    stack?: string;
}

// POST /client-logs - принять лог от клиента
router.post('/', async (req, res) => {
    try {
        const log: ClientLog = req.body;

        // Добавляем информацию о запросе
        const enrichedLog = {
            ...log,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            receivedAt: new Date().toISOString()
        };

        // Формируем строку лога
        const logLine = `[${enrichedLog.timestamp}] [${enrichedLog.level.toUpperCase()}] ${enrichedLog.message}\n`;

        // Если есть stack trace, добавляем его
        if (enrichedLog.stack) {
            const stackLine = `Stack: ${enrichedLog.stack}\n`;
            console.error(logLine + stackLine);
        } else {
            console.log(logLine);
        }

        // Сохраняем в файл (опционально)
        const logsDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const logFile = path.join(logsDir, `client-${new Date().toISOString().split('T')[0]}.log`);
        const fullLogLine = `${JSON.stringify(enrichedLog)}\n`;

        fs.appendFileSync(logFile, fullLogLine);

        // Отправляем успешный ответ (без тела, чтобы не нагружать сеть)
        res.status(204).send();
    } catch (error) {
        console.error('Ошибка записи клиентского лога:', error);
        // Не отправляем ошибку клиенту, чтобы не создавать цикл логирования
        res.status(204).send();
    }
});

export default router;


