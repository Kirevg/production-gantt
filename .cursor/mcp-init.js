/**
 * MCP Initialization Script
 * Инициализирует все MCP инструменты для AI агента
 */

const MCPDatabaseTools = require('./mcp-database-tools');
const MCPGitTools = require('./mcp-git-tools');
const MCPFileTools = require('./mcp-file-tools');
const fs = require('fs');
const path = require('path');

class MCPInitializer {
    constructor() {
        this.tools = {};
        this.config = this.loadConfig();
        this.setupDirectories();
    }

    /**
     * Загружает конфигурацию MCP
     */
    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'mcp.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                console.log('✅ Конфигурация MCP загружена');
                return config;
            } else {
                console.log('⚠️ Конфигурация MCP не найдена, используем настройки по умолчанию');
                return this.getDefaultConfig();
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки конфигурации: ${error.message}`);
            return this.getDefaultConfig();
        }
    }

    /**
     * Возвращает конфигурацию по умолчанию
     */
    getDefaultConfig() {
        return {
            mcpServers: {
                filesystem: {
                    command: "npx",
                    args: ["@modelcontextprotocol/server-filesystem", "C:\\Projects\\production-gantt"],
                    env: {
                        "ALLOWED_DIRECTORIES": "C:\\Projects\\production-gantt"
                    }
                },
                browser: {
                    command: "npx",
                    args: ["@modelcontextprotocol/server-browser"],
                    env: {
                        "HEADLESS": "false",
                        "BROWSER_TIMEOUT": "30000"
                    }
                }
            },
            safety: {
                allowed_directories: [
                    "C:\\Projects\\production-gantt",
                    "C:\\Projects\\production-gantt\\api",
                    "C:\\Projects\\production-gantt\\web",
                    "C:\\Projects\\production-gantt\\.cursor"
                ],
                max_file_size: "10MB",
                backup_before_changes: true
            }
        };
    }

    /**
     * Создает необходимые директории
     */
    setupDirectories() {
        const directories = [
            path.join(__dirname, '..', 'backups'),
            path.join(__dirname, '..', 'logs'),
            path.join(__dirname, '..', 'screenshots'),
            path.join(__dirname, '..', 'memory'),
            path.join(__dirname, '..', 'temp')
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Создана директория: ${dir}`);
            }
        });
    }

    /**
     * Инициализирует все MCP инструменты
     */
    async initializeTools() {
        try {
            console.log('🚀 Инициализация MCP инструментов...');

            // Инициализируем файловые инструменты
            this.tools.files = new MCPFileTools();
            console.log('✅ Файловые инструменты инициализированы');

            // Инициализируем Git инструменты
            this.tools.git = new MCPGitTools();
            console.log('✅ Git инструменты инициализированы');

            // Инициализируем инструменты базы данных
            this.tools.database = new MCPDatabaseTools();
            console.log('✅ Инструменты базы данных инициализированы');

            console.log('🎉 Все MCP инструменты успешно инициализированы!');
            return this.tools;
        } catch (error) {
            console.error(`❌ Ошибка инициализации MCP инструментов: ${error.message}`);
            throw error;
        }
    }

    /**
     * Проверяет работоспособность всех инструментов
     */
    async testTools() {
        try {
            console.log('🔍 Тестирование MCP инструментов...');

            // Тестируем файловые инструменты
            const testDir = path.join(__dirname, '..', 'temp', 'test');
            this.tools.files.ensureDirectory(testDir);
            console.log('✅ Файловые инструменты работают');

            // Тестируем Git инструменты
            const gitStatus = this.tools.git.getStatus();
            console.log('✅ Git инструменты работают');

            // Тестируем инструменты базы данных
            const dbStats = await this.tools.database.getDatabaseStats();
            console.log('✅ Инструменты базы данных работают');

            console.log('🎉 Все MCP инструменты работают корректно!');
            return true;
        } catch (error) {
            console.error(`❌ Ошибка тестирования MCP инструментов: ${error.message}`);
            return false;
        }
    }

    /**
     * Получает статус всех инструментов
     */
    getToolsStatus() {
        const status = {
            files: {
                available: !!this.tools.files,
                description: 'Работа с файлами и папками'
            },
            git: {
                available: !!this.tools.git,
                description: 'Работа с Git репозиторием'
            },
            database: {
                available: !!this.tools.database,
                description: 'Работа с базой данных'
            }
        };

        console.log('📊 Статус MCP инструментов:');
        Object.entries(status).forEach(([name, info]) => {
            const statusIcon = info.available ? '✅' : '❌';
            console.log(`  ${statusIcon} ${name}: ${info.description}`);
        });

        return status;
    }

    /**
     * Создает резервную копию всех важных данных
     */
    async createFullBackup() {
        try {
            console.log('💾 Создание полной резервной копии...');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(__dirname, '..', 'backups', `full-backup-${timestamp}`);

            // Создаем директорию для бэкапа
            this.tools.files.ensureDirectory(backupDir);

            // Бэкап базы данных
            const dbBackup = await this.tools.database.createBackup();
            console.log(`✅ Бэкап БД: ${dbBackup}`);

            // Бэкап Git репозитория
            const gitBackup = await this.tools.git.createBackup();
            console.log(`✅ Бэкап Git: ${gitBackup}`);

            // Копируем важные файлы
            const importantFiles = [
                '.cursorrules',
                'package.json',
                'prisma/schema.prisma'
            ];

            importantFiles.forEach(file => {
                const sourcePath = path.join(process.cwd(), file);
                if (fs.existsSync(sourcePath)) {
                    const destPath = path.join(backupDir, file);
                    this.tools.files.safeCopyFile(sourcePath, destPath);
                }
            });

            console.log(`✅ Полная резервная копия создана: ${backupDir}`);
            return backupDir;
        } catch (error) {
            console.error(`❌ Ошибка создания резервной копии: ${error.message}`);
            throw error;
        }
    }

    /**
     * Закрывает все соединения
     */
    async cleanup() {
        try {
            console.log('🧹 Очистка ресурсов...');

            if (this.tools.database) {
                await this.tools.database.disconnect();
            }

            console.log('✅ Очистка завершена');
        } catch (error) {
            console.error(`❌ Ошибка очистки: ${error.message}`);
        }
    }
}

// Экспортируем класс и создаем экземпляр
module.exports = MCPInitializer;

// Если файл запущен напрямую, инициализируем MCP
if (require.main === module) {
    const mcp = new MCPInitializer();

    mcp.initializeTools()
        .then(() => mcp.testTools())
        .then(() => mcp.getToolsStatus())
        .then(() => {
            console.log('🎉 MCP инициализация завершена успешно!');
        })
        .catch(error => {
            console.error(`❌ Ошибка инициализации MCP: ${error.message}`);
            process.exit(1);
        });
}

