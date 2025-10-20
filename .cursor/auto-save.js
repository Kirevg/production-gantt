/**
 * Автоматическое сохранение изменений с возможностью отката
 */

const AutoBackupSystem = require('./auto-backup-system');
const fs = require('fs');
const path = require('path');

class AutoSaveSystem {
    constructor(intervalMinutes = 5) {
        this.backupSystem = new AutoBackupSystem();
        this.saveInterval = intervalMinutes * 60 * 1000; // интервал в миллисекундах
        this.isRunning = false;
        this.intervalId = null;
    }

    /**
     * Запускает автоматическое сохранение
     */
    startAutoSave() {
        if (this.isRunning) {
            console.log('⚠️ Автосохранение уже запущено');
            return;
        }

        console.log('🚀 Запускаем автоматическое сохранение...');
        this.isRunning = true;

        // Создаем первый бэкап
        this.createAutoBackup('Автоматическое сохранение при запуске');

        // Запускаем интервал
        this.intervalId = setInterval(() => {
            this.createAutoBackup('Автоматическое сохранение по расписанию');
        }, this.saveInterval);

        console.log(`✅ Автосохранение запущено (интервал: ${this.saveInterval / 1000} сек)`);
    }

    /**
     * Останавливает автоматическое сохранение
     */
    stopAutoSave() {
        if (!this.isRunning) {
            console.log('⚠️ Автосохранение не запущено');
            return;
        }

        console.log('🛑 Останавливаем автоматическое сохранение...');
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('✅ Автосохранение остановлено');
    }

    /**
     * Создает автоматический бэкап только при наличии изменений
     */
    createAutoBackup(description = '') {
        try {
            // Проверяем, есть ли изменения в проекте
            if (!this.hasChanges()) {
                console.log('📭 Изменений нет, пропускаем создание бэкапа');
                return null;
            }

            const timestamp = new Date().toISOString();
            const backupName = `auto-backup-${timestamp.replace(/[:.]/g, '-')}`;
            const backupPath = this.backupSystem.createFullBackup(description);

            console.log(`💾 Автобэкап создан: ${backupName}`);

            // Очищаем старые бэкапы (оставляем последние 20)
            this.backupSystem.cleanupOldBackups(20);

            return backupPath;
        } catch (error) {
            console.error(`❌ Ошибка автобэкапа: ${error.message}`);
        }
    }

    /**
     * Создает бэкап перед важными изменениями
     */
    createPreChangeBackup(changeDescription = '') {
        try {
            const description = `Перед изменением: ${changeDescription}`;
            const backupPath = this.backupSystem.createFullBackup(description);
            console.log(`🛡️ Защитный бэкап создан: ${changeDescription}`);
            return backupPath;
        } catch (error) {
            console.error(`❌ Ошибка создания защитного бэкапа: ${error.message}`);
        }
    }

    /**
     * Показывает список доступных бэкапов
     */
    showBackupList() {
        try {
            const backups = this.backupSystem.getBackupList();

            if (backups.length === 0) {
                console.log('📭 Бэкапы не найдены');
                return;
            }

            console.log('📋 Доступные бэкапы:');
            console.log('==================');

            backups.forEach((backup, index) => {
                const date = new Date(backup.timestamp).toLocaleString('ru-RU');
                const size = (backup.size / 1024 / 1024).toFixed(2);
                console.log(`${index + 1}. ${backup.name}`);
                console.log(`   📅 Дата: ${date}`);
                console.log(`   📝 Описание: ${backup.description}`);
                console.log(`   📊 Файлов: ${backup.filesCount}, Размер: ${size} MB`);
                console.log(`   🌿 Ветка: ${backup.gitBranch}, Коммит: ${backup.gitCommit.substring(0, 8)}`);
                console.log('');
            });
        } catch (error) {
            console.error(`❌ Ошибка получения списка бэкапов: ${error.message}`);
        }
    }

    /**
     * Восстанавливает проект из бэкапа
     */
    restoreFromBackup(backupName) {
        try {
            console.log(`🔄 Восстанавливаем из бэкапа: ${backupName}`);
            this.backupSystem.restoreFromBackup(backupName);
            console.log('✅ Восстановление завершено');
        } catch (error) {
            console.error(`❌ Ошибка восстановления: ${error.message}`);
        }
    }

    /**
     * Создает бэкап перед изменениями файла
     */
    backupBeforeFileChange(filePath, description = '') {
        try {
            const changeDesc = description || `Изменение файла: ${filePath}`;
            return this.createPreChangeBackup(changeDesc);
        } catch (error) {
            console.error(`❌ Ошибка бэкапа перед изменением файла: ${error.message}`);
        }
    }

    /**
     * Проверяет, есть ли изменения в проекте
     */
    hasChanges() {
        try {
            const { execSync } = require('child_process');

            // Проверяем Git статус
            const gitStatus = execSync('git status --porcelain', {
                cwd: this.backupSystem.projectPath,
                encoding: 'utf8'
            }).trim();

            if (gitStatus) {
                console.log(`📝 Обнаружены изменения в Git: ${gitStatus.split('\n').length} файлов`);
                return true;
            }

            // Проверяем время последнего изменения важных файлов
            const importantFiles = [
                'api/src',
                'web/src',
                'api/package.json',
                'web/package.json',
                'api/prisma/schema.prisma'
            ];

            const lastBackup = this.getLastBackupTime();
            if (!lastBackup) {
                console.log('📭 Первый бэкап - создаем обязательно');
                return true;
            }

            for (const file of importantFiles) {
                const filePath = require('path').join(this.backupSystem.projectPath, file);
                if (require('fs').existsSync(filePath)) {
                    const stats = require('fs').statSync(filePath);
                    if (stats.mtime > lastBackup) {
                        console.log(`📝 Обнаружены изменения в файле: ${file}`);
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.warn(`⚠️ Ошибка проверки изменений: ${error.message}`);
            // В случае ошибки создаем бэкап для безопасности
            return true;
        }
    }

    /**
     * Получает время последнего бэкапа
     */
    getLastBackupTime() {
        try {
            const backups = this.backupSystem.getBackupList();
            if (backups.length === 0) {
                return null;
            }

            // Сортируем по времени и берем последний
            const lastBackup = backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            return new Date(lastBackup.timestamp);
        } catch (error) {
            console.warn(`⚠️ Ошибка получения времени последнего бэкапа: ${error.message}`);
            return null;
        }
    }
}

// Экспортируем класс и создаем экземпляр
const autoSave = new AutoSaveSystem();

// Если файл запущен напрямую, показываем меню
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'start':
            // Проверяем, есть ли параметр интервала
            const intervalMinutes = parseInt(args[1]) || 5;
            if (intervalMinutes !== 5) {
                console.log(`⚙️ Устанавливаем интервал: ${intervalMinutes} минут`);
                autoSave.saveInterval = intervalMinutes * 60 * 1000;
            }
            autoSave.startAutoSave();
            break;
        case 'stop':
            autoSave.stopAutoSave();
            break;
        case 'backup':
            autoSave.createAutoBackup(args[1] || 'Ручной бэкап');
            break;
        case 'list':
            autoSave.showBackupList();
            break;
        case 'restore':
            if (args[1]) {
                autoSave.restoreFromBackup(args[1]);
            } else {
                console.log('❌ Укажите имя бэкапа для восстановления');
            }
            break;
        default:
            console.log('🔧 Система автоматического сохранения');
            console.log('=====================================');
            console.log('Команды:');
            console.log('  start [минуты] - Запустить автосохранение (по умолчанию 5 мин)');
            console.log('  stop            - Остановить автосохранение');
            console.log('  backup          - Создать бэкап вручную');
            console.log('  list            - Показать список бэкапов');
            console.log('  restore         - Восстановить из бэкапа');
            console.log('');
            console.log('Примеры:');
            console.log('  node auto-save.js start           # каждые 5 минут');
            console.log('  node auto-save.js start 10        # каждые 10 минут');
            console.log('  node auto-save.js start 1         # каждую минуту');
            console.log('  node auto-save.js backup "Описание бэкапа"');
            console.log('  node auto-save.js restore backup-2025-10-19T18-30-00-000Z');
    }
}

module.exports = AutoSaveSystem;
