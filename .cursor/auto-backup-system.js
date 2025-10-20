/**
 * Система автоматического сохранения изменений с возможностью отката
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoBackupSystem {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.backupDir = path.join(projectPath, '.cursor', 'backups');
        this.ensureBackupDir();
    }

    /**
     * Создает директорию для бэкапов
     */
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✅ Создана директория для бэкапов: ${this.backupDir}`);
        }
    }

    /**
     * Создает полный бэкап проекта
     */
    createFullBackup(description = '') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, backupName);
            
            console.log(`💾 Создаем полный бэкап: ${backupName}`);
            
            // Создаем директорию бэкапа
            fs.mkdirSync(backupPath, { recursive: true });
            
            // Копируем важные файлы проекта
            const importantFiles = [
                'api/src',
                'web/src',
                'api/package.json',
                'web/package.json',
                'api/prisma/schema.prisma',
                '.cursorrules',
                'README.md'
            ];
            
            importantFiles.forEach(file => {
                const sourcePath = path.join(this.projectPath, file);
                const destPath = path.join(backupPath, file);
                
                if (fs.existsSync(sourcePath)) {
                    const destDir = path.dirname(destPath);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    
                    if (fs.statSync(sourcePath).isDirectory()) {
                        this.copyDirectory(sourcePath, destPath);
                    } else {
                        fs.copyFileSync(sourcePath, destPath);
                    }
                    console.log(`  ✅ Скопирован: ${file}`);
                }
            });
            
            // Создаем Git снапшот
            const gitSnapshot = this.createGitSnapshot();
            fs.writeFileSync(path.join(backupPath, 'git-snapshot.json'), JSON.stringify(gitSnapshot, null, 2));
            
            // Сохраняем метаданные бэкапа
            const backupInfo = {
                timestamp: new Date().toISOString(),
                description: description,
                gitCommit: gitSnapshot.currentCommit,
                gitBranch: gitSnapshot.currentBranch,
                filesCount: this.countFiles(backupPath),
                size: this.getDirectorySize(backupPath)
            };
            
            fs.writeFileSync(path.join(backupPath, 'backup-info.json'), JSON.stringify(backupInfo, null, 2));
            
            console.log(`✅ Полный бэкап создан: ${backupPath}`);
            console.log(`📊 Файлов: ${backupInfo.filesCount}, Размер: ${backupInfo.size} байт`);
            
            return backupPath;
        } catch (error) {
            console.error(`❌ Ошибка создания бэкапа: ${error.message}`);
            throw error;
        }
    }

    /**
     * Создает снапшот Git состояния
     */
    createGitSnapshot() {
        try {
            const currentCommit = execSync('git rev-parse HEAD', { cwd: this.projectPath, encoding: 'utf8' }).trim();
            const currentBranch = execSync('git branch --show-current', { cwd: this.projectPath, encoding: 'utf8' }).trim();
            const status = execSync('git status --porcelain', { cwd: this.projectPath, encoding: 'utf8' });
            
            return {
                currentCommit,
                currentBranch,
                status: status.split('\n').filter(line => line.trim()),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn(`⚠️ Ошибка получения Git снапшота: ${error.message}`);
            return {
                currentCommit: 'unknown',
                currentBranch: 'unknown',
                status: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Копирует директорию рекурсивно
     */
    copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        
        const items = fs.readdirSync(source);
        items.forEach(item => {
            const sourcePath = path.join(source, item);
            const destPath = path.join(destination, item);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    /**
     * Подсчитывает количество файлов в директории
     */
    countFiles(dir) {
        let count = 0;
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
                count += this.countFiles(itemPath);
            } else {
                count++;
            }
        });
        
        return count;
    }

    /**
     * Получает размер директории в байтах
     */
    getDirectorySize(dir) {
        let size = 0;
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
                size += this.getDirectorySize(itemPath);
            } else {
                size += fs.statSync(itemPath).size;
            }
        });
        
        return size;
    }

    /**
     * Получает список всех бэкапов
     */
    getBackupList() {
        try {
            const backups = [];
            const items = fs.readdirSync(this.backupDir);
            
            items.forEach(item => {
                const backupPath = path.join(this.backupDir, item);
                if (fs.statSync(backupPath).isDirectory()) {
                    const infoPath = path.join(backupPath, 'backup-info.json');
                    if (fs.existsSync(infoPath)) {
                        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                        backups.push({
                            name: item,
                            path: backupPath,
                            ...info
                        });
                    }
                }
            });
            
            return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error(`❌ Ошибка получения списка бэкапов: ${error.message}`);
            return [];
        }
    }

    /**
     * Восстанавливает проект из бэкапа
     */
    restoreFromBackup(backupName) {
        try {
            const backupPath = path.join(this.backupDir, backupName);
            if (!fs.existsSync(backupPath)) {
                throw new Error(`Бэкап не найден: ${backupName}`);
            }
            
            console.log(`🔄 Восстанавливаем из бэкапа: ${backupName}`);
            
            // Создаем резервную копию текущего состояния
            const currentBackup = this.createFullBackup('Перед восстановлением из бэкапа');
            console.log(`💾 Текущее состояние сохранено в: ${currentBackup}`);
            
            // Восстанавливаем файлы
            const items = fs.readdirSync(backupPath);
            items.forEach(item => {
                if (item !== 'backup-info.json' && item !== 'git-snapshot.json') {
                    const sourcePath = path.join(backupPath, item);
                    const destPath = path.join(this.projectPath, item);
                    
                    if (fs.existsSync(destPath)) {
                        fs.rmSync(destPath, { recursive: true, force: true });
                    }
                    
                    if (fs.statSync(sourcePath).isDirectory()) {
                        this.copyDirectory(sourcePath, destPath);
                    } else {
                        fs.copyFileSync(sourcePath, destPath);
                    }
                    
                    console.log(`  ✅ Восстановлен: ${item}`);
                }
            });
            
            console.log(`✅ Проект восстановлен из бэкапа: ${backupName}`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка восстановления: ${error.message}`);
            throw error;
        }
    }

    /**
     * Удаляет старые бэкапы (оставляет только последние N)
     */
    cleanupOldBackups(keepCount = 10) {
        try {
            const backups = this.getBackupList();
            if (backups.length <= keepCount) {
                console.log(`📊 Бэкапов: ${backups.length}, лимит: ${keepCount}. Очистка не нужна.`);
                return;
            }
            
            const toDelete = backups.slice(keepCount);
            console.log(`🧹 Удаляем ${toDelete.length} старых бэкапов...`);
            
            toDelete.forEach(backup => {
                fs.rmSync(backup.path, { recursive: true, force: true });
                console.log(`  🗑️ Удален: ${backup.name}`);
            });
            
            console.log(`✅ Очистка завершена. Осталось бэкапов: ${keepCount}`);
        } catch (error) {
            console.error(`❌ Ошибка очистки: ${error.message}`);
        }
    }
}

module.exports = AutoBackupSystem;
