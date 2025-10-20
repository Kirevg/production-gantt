/**
 * MCP File Tools для безопасной работы с файлами и папками
 * Обеспечивает проверку существования папок перед сохранением файлов
 */

const fs = require('fs');
const path = require('path');

class MCPFileTools {
    constructor(basePath = process.cwd()) {
        this.basePath = basePath;
        this.allowedDirectories = [
            path.join(basePath, 'api'),
            path.join(basePath, 'web'),
            path.join(basePath, '.cursor'),
            basePath
        ];
    }

    /**
     * Проверяет существование директории и создает если не существует
     * @param {string} dirPath - Путь к директории
     * @param {boolean} recursive - Создавать родительские директории
     */
    ensureDirectory(dirPath, recursive = true) {
        try {
            const fullPath = path.resolve(dirPath);

            // Проверяем безопасность пути
            if (!this.isPathAllowed(fullPath)) {
                throw new Error(`❌ Путь не разрешен: ${fullPath}`);
            }

            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: recursive });
                console.log(`✅ Создана директория: ${fullPath}`);
                return true;
            } else {
                console.log(`✅ Директория существует: ${fullPath}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Ошибка создания директории: ${error.message}`);
            throw error;
        }
    }

    /**
     * Проверяет существование директории
     * @param {string} dirPath - Путь к директории
     */
    directoryExists(dirPath) {
        try {
            const fullPath = path.resolve(dirPath);
            return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
        } catch (error) {
            return false;
        }
    }

    /**
     * Проверяет безопасность пути
     * @param {string} filePath - Путь к файлу
     */
    isPathAllowed(filePath) {
        const normalizedPath = path.resolve(filePath);
        return this.allowedDirectories.some(allowedDir =>
            normalizedPath.startsWith(path.resolve(allowedDir))
        );
    }

    /**
     * Безопасное сохранение файла с проверкой директории
     * @param {string} filePath - Путь к файлу
     * @param {string} content - Содержимое файла
     * @param {boolean} createBackup - Создать резервную копию
     */
    safeWriteFile(filePath, content, createBackup = true) {
        try {
            const fullPath = path.resolve(filePath);
            const dirPath = path.dirname(fullPath);

            // Проверяем безопасность пути
            if (!this.isPathAllowed(fullPath)) {
                throw new Error(`❌ Путь не разрешен: ${fullPath}`);
            }

            // Создаем директорию если не существует
            this.ensureDirectory(dirPath);

            // Создаем резервную копию если файл существует
            if (createBackup && fs.existsSync(fullPath)) {
                this.createBackup(fullPath);
            }

            // Сохраняем файл
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Файл сохранен: ${fullPath}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка сохранения файла: ${error.message}`);
            throw error;
        }
    }

    /**
     * Создает резервную копию файла
     * @param {string} filePath - Путь к файлу
     * @param {string} backupSuffix - Суффикс для бэкапа
     */
    createBackup(filePath, backupSuffix = '.backup') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${filePath}${backupSuffix}.${timestamp}`;

            fs.copyFileSync(filePath, backupPath);
            console.log(`✅ Создана резервная копия: ${backupPath}`);

            return backupPath;
        } catch (error) {
            console.error(`❌ Ошибка создания резервной копии: ${error.message}`);
            throw error;
        }
    }

    /**
     * Читает файл с проверкой существования
     * @param {string} filePath - Путь к файлу
     * @param {string} encoding - Кодировка файла
     */
    safeReadFile(filePath, encoding = 'utf8') {
        try {
            const fullPath = path.resolve(filePath);

            if (!fs.existsSync(fullPath)) {
                throw new Error(`❌ Файл не найден: ${fullPath}`);
            }

            const content = fs.readFileSync(fullPath, encoding);
            console.log(`✅ Файл прочитан: ${fullPath}`);

            return content;
        } catch (error) {
            console.error(`❌ Ошибка чтения файла: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получает список файлов в директории
     * @param {string} dirPath - Путь к директории
     * @param {string} pattern - Паттерн для фильтрации файлов
     */
    getDirectoryContents(dirPath, pattern = null) {
        try {
            const fullPath = path.resolve(dirPath);

            if (!this.directoryExists(fullPath)) {
                throw new Error(`❌ Директория не найдена: ${fullPath}`);
            }

            let files = fs.readdirSync(fullPath);

            if (pattern) {
                const regex = new RegExp(pattern);
                files = files.filter(file => regex.test(file));
            }

            console.log(`📁 Найдено файлов в ${fullPath}: ${files.length}`);
            files.forEach(file => {
                console.log(`  - ${file}`);
            });

            return files;
        } catch (error) {
            console.error(`❌ Ошибка получения списка файлов: ${error.message}`);
            throw error;
        }
    }

    /**
     * Копирует файл с проверкой директорий
     * @param {string} sourcePath - Исходный путь
     * @param {string} destPath - Путь назначения
     */
    safeCopyFile(sourcePath, destPath) {
        try {
            const fullSourcePath = path.resolve(sourcePath);
            const fullDestPath = path.resolve(destPath);
            const destDir = path.dirname(fullDestPath);

            // Проверяем существование исходного файла
            if (!fs.existsSync(fullSourcePath)) {
                throw new Error(`❌ Исходный файл не найден: ${fullSourcePath}`);
            }

            // Проверяем безопасность путей
            if (!this.isPathAllowed(fullDestPath)) {
                throw new Error(`❌ Путь назначения не разрешен: ${fullDestPath}`);
            }

            // Создаем директорию назначения если не существует
            this.ensureDirectory(destDir);

            // Копируем файл
            fs.copyFileSync(fullSourcePath, fullDestPath);
            console.log(`✅ Файл скопирован: ${fullSourcePath} → ${fullDestPath}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка копирования файла: ${error.message}`);
            throw error;
        }
    }

    /**
     * Перемещает файл с проверкой директорий
     * @param {string} sourcePath - Исходный путь
     * @param {string} destPath - Путь назначения
     */
    safeMoveFile(sourcePath, destPath) {
        try {
            const fullSourcePath = path.resolve(sourcePath);
            const fullDestPath = path.resolve(destPath);
            const destDir = path.dirname(fullDestPath);

            // Проверяем существование исходного файла
            if (!fs.existsSync(fullSourcePath)) {
                throw new Error(`❌ Исходный файл не найден: ${fullSourcePath}`);
            }

            // Проверяем безопасность путей
            if (!this.isPathAllowed(fullDestPath)) {
                throw new Error(`❌ Путь назначения не разрешен: ${fullDestPath}`);
            }

            // Создаем директорию назначения если не существует
            this.ensureDirectory(destDir);

            // Перемещаем файл
            fs.renameSync(fullSourcePath, fullDestPath);
            console.log(`✅ Файл перемещен: ${fullSourcePath} → ${fullDestPath}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка перемещения файла: ${error.message}`);
            throw error;
        }
    }

    /**
     * Удаляет файл с созданием резервной копии
     * @param {string} filePath - Путь к файлу
     * @param {boolean} createBackup - Создать резервную копию
     */
    safeDeleteFile(filePath, createBackup = true) {
        try {
            const fullPath = path.resolve(filePath);

            if (!fs.existsSync(fullPath)) {
                console.log(`⚠️ Файл не найден: ${fullPath}`);
                return false;
            }

            // Создаем резервную копию если нужно
            if (createBackup) {
                this.createBackup(fullPath);
            }

            // Удаляем файл
            fs.unlinkSync(fullPath);
            console.log(`✅ Файл удален: ${fullPath}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка удаления файла: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получает информацию о файле
     * @param {string} filePath - Путь к файлу
     */
    getFileInfo(filePath) {
        try {
            const fullPath = path.resolve(filePath);

            if (!fs.existsSync(fullPath)) {
                throw new Error(`❌ Файл не найден: ${fullPath}`);
            }

            const stats = fs.statSync(fullPath);
            const info = {
                path: fullPath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile()
            };

            console.log(`📄 Информация о файле: ${fullPath}`);
            console.log(`  Размер: ${info.size} байт`);
            console.log(`  Создан: ${info.created}`);
            console.log(`  Изменен: ${info.modified}`);
            console.log(`  Тип: ${info.isDirectory ? 'Директория' : 'Файл'}`);

            return info;
        } catch (error) {
            console.error(`❌ Ошибка получения информации о файле: ${error.message}`);
            throw error;
        }
    }

    /**
     * Проверяет права доступа к файлу
     * @param {string} filePath - Путь к файлу
     * @param {string} mode - Режим доступа (r, w, x)
     */
    checkFilePermissions(filePath, mode = 'r') {
        try {
            const fullPath = path.resolve(filePath);

            if (!fs.existsSync(fullPath)) {
                throw new Error(`❌ Файл не найден: ${fullPath}`);
            }

            fs.accessSync(fullPath, fs.constants[mode.toUpperCase()]);
            console.log(`✅ Права доступа ${mode} подтверждены: ${fullPath}`);

            return true;
        } catch (error) {
            console.error(`❌ Нет прав доступа ${mode}: ${error.message}`);
            return false;
        }
    }
}

module.exports = MCPFileTools;

