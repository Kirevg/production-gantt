/**
 * MCP Git Tools для работы с Git репозиторием
 * Обеспечивает безопасную работу с версионным контролем
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MCPGitTools {
    constructor(repoPath = process.cwd()) {
        this.repoPath = repoPath;
        this.ensureGitRepo();
    }

    /**
     * Проверяет что директория является Git репозиторием
     */
    ensureGitRepo() {
        try {
            execSync('git status', { cwd: this.repoPath, stdio: 'pipe' });
            console.log(`✅ Git репозиторий найден: ${this.repoPath}`);
        } catch (error) {
            throw new Error(`❌ Директория не является Git репозиторием: ${this.repoPath}`);
        }
    }

    /**
     * Получает статус Git репозитория
     */
    getStatus() {
        try {
            const status = execSync('git status --porcelain', {
                cwd: this.repoPath,
                encoding: 'utf8'
            });

            const lines = status.trim().split('\n').filter(line => line);

            const changes = {
                modified: [],
                added: [],
                deleted: [],
                untracked: []
            };

            lines.forEach(line => {
                const status = line.substring(0, 2);
                const file = line.substring(3);

                if (status.includes('M')) changes.modified.push(file);
                if (status.includes('A')) changes.added.push(file);
                if (status.includes('D')) changes.deleted.push(file);
                if (status.includes('?')) changes.untracked.push(file);
            });

            console.log('📊 Статус Git репозитория:');
            console.log(`  Изменено: ${changes.modified.length} файлов`);
            console.log(`  Добавлено: ${changes.added.length} файлов`);
            console.log(`  Удалено: ${changes.deleted.length} файлов`);
            console.log(`  Неотслеживаемых: ${changes.untracked.length} файлов`);

            return changes;
        } catch (error) {
            console.error(`❌ Ошибка получения статуса Git: ${error.message}`);
            throw error;
        }
    }

    /**
     * Создает коммит с изменениями
     * @param {string} message - Сообщение коммита
     * @param {Array} files - Список файлов для коммита (опционально)
     * @param {boolean} push - Отправить в удаленный репозиторий
     */
    async commitChanges(message, files = null, push = false) {
        try {
            console.log(`💾 Создаем коммит: ${message}`);

            // Добавляем файлы в индекс
            if (files && files.length > 0) {
                files.forEach(file => {
                    execSync(`git add "${file}"`, { cwd: this.repoPath });
                    console.log(`✅ Добавлен в индекс: ${file}`);
                });
            } else {
                execSync('git add .', { cwd: this.repoPath });
                console.log('✅ Все изменения добавлены в индекс');
            }

            // Создаем коммит
            execSync(`git commit -m "${message}"`, { cwd: this.repoPath });
            console.log(`✅ Коммит создан: ${message}`);

            // Отправляем в удаленный репозиторий если нужно
            if (push) {
                await this.pushChanges();
            }

            return true;
        } catch (error) {
            console.error(`❌ Ошибка создания коммита: ${error.message}`);
            throw error;
        }
    }

    /**
     * Отправляет изменения в удаленный репозиторий
     */
    async pushChanges(branch = null) {
        try {
            const currentBranch = branch || this.getCurrentBranch();
            console.log(`🚀 Отправляем изменения в ветку: ${currentBranch}`);

            execSync(`git push origin ${currentBranch}`, { cwd: this.repoPath });
            console.log(`✅ Изменения отправлены в ${currentBranch}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка отправки изменений: ${error.message}`);
            throw error;
        }
    }

    /**
     * Создает новую ветку
     * @param {string} branchName - Название ветки
     * @param {string} fromBranch - Базовая ветка (опционально)
     */
    createBranch(branchName, fromBranch = null) {
        try {
            console.log(`🌿 Создаем ветку: ${branchName}`);

            if (fromBranch) {
                execSync(`git checkout -b ${branchName} ${fromBranch}`, { cwd: this.repoPath });
            } else {
                execSync(`git checkout -b ${branchName}`, { cwd: this.repoPath });
            }

            console.log(`✅ Ветка ${branchName} создана и переключена`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка создания ветки: ${error.message}`);
            throw error;
        }
    }

    /**
     * Переключается на ветку
     * @param {string} branchName - Название ветки
     */
    checkoutBranch(branchName) {
        try {
            console.log(`🔄 Переключаемся на ветку: ${branchName}`);

            execSync(`git checkout ${branchName}`, { cwd: this.repoPath });
            console.log(`✅ Переключены на ветку: ${branchName}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка переключения ветки: ${error.message}`);
            throw error;
        }
    }

    /**
     * Сливает ветки
     * @param {string} sourceBranch - Исходная ветка
     * @param {string} targetBranch - Целевая ветка
     */
    async mergeBranch(sourceBranch, targetBranch) {
        try {
            console.log(`🔀 Сливаем ветку ${sourceBranch} в ${targetBranch}`);

            // Переключаемся на целевую ветку
            this.checkoutBranch(targetBranch);

            // Сливаем изменения
            execSync(`git merge ${sourceBranch}`, { cwd: this.repoPath });
            console.log(`✅ Ветка ${sourceBranch} слита в ${targetBranch}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка слияния веток: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получает текущую ветку
     */
    getCurrentBranch() {
        try {
            const branch = execSync('git branch --show-current', {
                cwd: this.repoPath,
                encoding: 'utf8'
            }).trim();

            console.log(`📍 Текущая ветка: ${branch}`);
            return branch;
        } catch (error) {
            console.error(`❌ Ошибка получения текущей ветки: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получает список веток
     */
    getBranches() {
        try {
            const branches = execSync('git branch -a', {
                cwd: this.repoPath,
                encoding: 'utf8'
            });

            const branchList = branches
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.includes('HEAD'))
                .map(line => line.replace(/^\*?\s*/, ''));

            console.log(`🌿 Найдено веток: ${branchList.length}`);
            branchList.forEach(branch => {
                console.log(`  - ${branch}`);
            });

            return branchList;
        } catch (error) {
            console.error(`❌ Ошибка получения списка веток: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получает историю коммитов
     * @param {number} limit - Количество коммитов
     */
    getCommitHistory(limit = 10) {
        try {
            const history = execSync(`git log --oneline -${limit}`, {
                cwd: this.repoPath,
                encoding: 'utf8'
            });

            const commits = history
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [hash, ...message] = line.split(' ');
                    return {
                        hash: hash,
                        message: message.join(' ')
                    };
                });

            console.log(`📜 История коммитов (последние ${limit}):`);
            commits.forEach(commit => {
                console.log(`  ${commit.hash} ${commit.message}`);
            });

            return commits;
        } catch (error) {
            console.error(`❌ Ошибка получения истории: ${error.message}`);
            throw error;
        }
    }

    /**
     * Создает тег
     * @param {string} tagName - Название тега
     * @param {string} message - Сообщение тега
     */
    createTag(tagName, message = '') {
        try {
            console.log(`🏷️ Создаем тег: ${tagName}`);

            if (message) {
                execSync(`git tag -a ${tagName} -m "${message}"`, { cwd: this.repoPath });
            } else {
                execSync(`git tag ${tagName}`, { cwd: this.repoPath });
            }

            console.log(`✅ Тег ${tagName} создан`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка создания тега: ${error.message}`);
            throw error;
        }
    }

    /**
     * Откатывает изменения
     * @param {string} commitHash - Хеш коммита для отката
     */
    revertToCommit(commitHash) {
        try {
            console.log(`⏪ Откатываемся к коммиту: ${commitHash}`);

            // Создаем бэкап текущего состояния
            const backupBranch = `backup-${Date.now()}`;
            this.createBranch(backupBranch);

            // Откатываемся к указанному коммиту
            execSync(`git reset --hard ${commitHash}`, { cwd: this.repoPath });
            console.log(`✅ Откат выполнен к коммиту: ${commitHash}`);
            console.log(`💾 Резервная копия сохранена в ветке: ${backupBranch}`);

            return true;
        } catch (error) {
            console.error(`❌ Ошибка отката: ${error.message}`);
            throw error;
        }
    }

    /**
     * Проверяет безопасность операций
     * @param {string} operation - Название операции
     */
    isSafeOperation(operation) {
        const unsafeOperations = [
            'force-push', 'delete-branch', 'reset-hard',
            'clean-all', 'remove-remote'
        ];

        return !unsafeOperations.includes(operation);
    }
}

module.exports = MCPGitTools;

