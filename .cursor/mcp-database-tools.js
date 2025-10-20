/**
 * MCP Database Tools для работы с базой данных Production Gantt
 * Обеспечивает безопасную работу с PostgreSQL через Prisma
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class MCPDatabaseTools {
    constructor() {
        this.prisma = new PrismaClient();
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.ensureBackupDir();
    }

    /**
     * Создает директорию для бэкапов если не существует
     */
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Создана директория для бэкапов: ${this.backupDir}`);
        }
    }

    /**
     * Безопасное выполнение SQL запросов
     * @param {string} sql - SQL запрос
     * @param {Object} params - Параметры запроса
     */
    async executeQuery(sql, params = {}) {
        try {
            // Проверяем безопасность запроса
            if (this.isUnsafeQuery(sql)) {
                throw new Error('❌ Запрещенная операция: ' + sql);
            }

            console.log(`🔍 Выполняем SQL: ${sql}`);
            const result = await this.prisma.$queryRawUnsafe(sql, ...Object.values(params));

            console.log(`✅ Запрос выполнен успешно. Записей: ${result.length}`);
            return result;
        } catch (error) {
            console.error(`❌ Ошибка выполнения SQL: ${error.message}`);
            throw error;
        }
    }

    /**
     * Проверяет безопасность SQL запроса
     * @param {string} sql - SQL запрос
     */
    isUnsafeQuery(sql) {
        const unsafeOperations = [
            'DROP', 'TRUNCATE', 'ALTER', 'DELETE FROM',
            'UPDATE SET', 'INSERT INTO'
        ];

        const upperSql = sql.toUpperCase();
        return unsafeOperations.some(op => upperSql.includes(op));
    }

    /**
     * Создает резервную копию базы данных
     * @param {string} backupName - Имя бэкапа
     */
    async createBackup(backupName = null) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = backupName || `backup-${timestamp}.sql`;
            const backupPath = path.join(this.backupDir, backupFileName);

            console.log(`💾 Создаем резервную копию: ${backupPath}`);

            // Экспорт схемы и данных
            const schema = await this.exportSchema();
            const data = await this.exportData();

            const backupContent = `-- Backup created: ${new Date().toISOString()}
-- Database: Production Gantt

${schema}

${data}`;

            fs.writeFileSync(backupPath, backupContent, 'utf8');
            console.log(`✅ Резервная копия создана: ${backupPath}`);

            return backupPath;
        } catch (error) {
            console.error(`❌ Ошибка создания бэкапа: ${error.message}`);
            throw error;
        }
    }

    /**
     * Экспортирует схему базы данных
     */
    async exportSchema() {
        const tables = [
            'Counterparty', 'Person', 'NomenclatureItem', 'NomenclatureKind',
            'Product', 'ProductSpecification', 'Specification', 'Project',
            'WorkStage', 'Unit', 'User'
        ];

        let schema = '-- Database Schema\n';

        for (const table of tables) {
            try {
                const tableInfo = await this.prisma.$queryRaw`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = ${table.toLowerCase()}
                    ORDER BY ordinal_position;
                `;

                schema += `\n-- Table: ${table}\n`;
                schema += `CREATE TABLE ${table} (\n`;

                tableInfo.forEach((col, index) => {
                    schema += `  ${col.column_name} ${col.data_type}`;
                    if (col.is_nullable === 'NO') schema += ' NOT NULL';
                    if (col.column_default) schema += ` DEFAULT ${col.column_default}`;
                    if (index < tableInfo.length - 1) schema += ',';
                    schema += '\n';
                });

                schema += ');\n';
            } catch (error) {
                console.warn(`⚠️ Не удалось экспортировать таблицу ${table}: ${error.message}`);
            }
        }

        return schema;
    }

    /**
     * Экспортирует данные из базы
     */
    async exportData() {
        let data = '\n-- Database Data\n';

        try {
            // Экспортируем основные таблицы
            const counterparties = await this.prisma.counterparty.findMany();
            data += this.formatDataForExport('Counterparty', counterparties);

            const persons = await this.prisma.person.findMany();
            data += this.formatDataForExport('Person', persons);

            const nomenclature = await this.prisma.nomenclatureItem.findMany();
            data += this.formatDataForExport('NomenclatureItem', nomenclature);

            const projects = await this.prisma.project.findMany();
            data += this.formatDataForExport('Project', projects);

        } catch (error) {
            console.warn(`⚠️ Ошибка экспорта данных: ${error.message}`);
        }

        return data;
    }

    /**
     * Форматирует данные для экспорта
     */
    formatDataForExport(tableName, data) {
        if (!data || data.length === 0) return '';

        let result = `\n-- Data for table ${tableName}\n`;

        data.forEach(record => {
            const columns = Object.keys(record);
            const values = Object.values(record).map(v =>
                v === null ? 'NULL' :
                    typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
                        v
            );

            result += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        });

        return result;
    }

    /**
     * Выполняет миграцию базы данных
     * @param {string} migrationFile - Путь к файлу миграции
     */
    async runMigration(migrationFile) {
        try {
            console.log(`🔄 Выполняем миграцию: ${migrationFile}`);

            // Создаем бэкап перед миграцией
            await this.createBackup(`pre-migration-${Date.now()}.sql`);

            // Читаем и выполняем миграцию
            const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
            await this.prisma.$executeRawUnsafe(migrationSQL);

            console.log(`✅ Миграция выполнена успешно`);
        } catch (error) {
            console.error(`❌ Ошибка миграции: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получает статистику базы данных
     */
    async getDatabaseStats() {
        try {
            const stats = {
                counterparties: await this.prisma.counterparty.count(),
                persons: await this.prisma.person.count(),
                nomenclature: await this.prisma.nomenclatureItem.count(),
                projects: await this.prisma.project.count(),
                specifications: await this.prisma.specification.count(),
                users: await this.prisma.user.count()
            };

            console.log('📊 Статистика базы данных:');
            Object.entries(stats).forEach(([table, count]) => {
                console.log(`  ${table}: ${count} записей`);
            });

            return stats;
        } catch (error) {
            console.error(`❌ Ошибка получения статистики: ${error.message}`);
            throw error;
        }
    }

    /**
     * Закрывает соединение с базой данных
     */
    async disconnect() {
        await this.prisma.$disconnect();
        console.log('🔌 Соединение с базой данных закрыто');
    }
}

module.exports = MCPDatabaseTools;

