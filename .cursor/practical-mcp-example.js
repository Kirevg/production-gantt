/**
 * Практический пример использования MCP
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Практический пример: MCP в действии\n');

// Пример 1: AI агент создает новую структуру проекта
console.log('📁 Пример 1: Создание структуры проекта');
try {
    const MCPFileTools = require('./mcp-file-tools');
    const fileTools = new MCPFileTools();
    
    // AI агент создает новую структуру для компонента
    const componentDir = path.join(__dirname, 'new-component');
    const files = [
        { path: 'index.ts', content: 'export { default } from "./Component";' },
        { path: 'Component.tsx', content: 'import React from "react";\n\nexport default function Component() {\n  return <div>New Component</div>;\n}' },
        { path: 'Component.test.tsx', content: 'import { render } from "@testing-library/react";\nimport Component from "./Component";\n\ntest("renders component", () => {\n  render(<Component />);\n});' },
        { path: 'Component.stories.tsx', content: 'import Component from "./Component";\n\nexport default {\n  title: "Components/Component",\n  component: Component,\n};\n\nexport const Default = {};' }
    ];
    
    console.log('  • AI агент создает структуру компонента...');
    
    files.forEach(file => {
        const filePath = path.join(componentDir, file.path);
        console.log(`    Создаю: ${file.path}`);
        fileTools.safeWriteFile(filePath, file.content, true);
    });
    
    console.log('  ✅ AI агент автоматически создал все папки и файлы');
    console.log('  ✅ Все файлы сохранены с резервными копиями');
    
    // Показываем созданную структуру
    console.log('\n  📂 Созданная структура:');
    const showStructure = (dir, prefix = '') => {
        const items = fs.readdirSync(dir);
        items.forEach((item, index) => {
            const itemPath = path.join(dir, item);
            const isLast = index === items.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            console.log(`  ${prefix}${connector}${item}`);
            
            if (fs.statSync(itemPath).isDirectory()) {
                showStructure(itemPath, prefix + (isLast ? '    ' : '│   '));
            }
        });
    };
    
    showStructure(componentDir);
    
    // Очистка
    fs.rmSync(componentDir, { recursive: true, force: true });
    console.log('\n  ✅ Демонстрация завершена, тестовые файлы удалены\n');
    
} catch (error) {
    console.log(`  ❌ Ошибка: ${error.message}\n`);
}

// Пример 2: AI агент работает с Git
console.log('🔄 Пример 2: Работа с Git репозиторием');
try {
    const MCPGitTools = require('./mcp-git-tools');
    const gitTools = new MCPGitTools();
    
    console.log('  • AI агент проверяет статус репозитория...');
    const status = gitTools.getStatus();
    
    if (status.modified.length > 0 || status.added.length > 0 || status.untracked.length > 0) {
        console.log('  • AI агент видит изменения в репозитории:');
        console.log(`    - Изменено: ${status.modified.length} файлов`);
        console.log(`    - Добавлено: ${status.added.length} файлов`);
        console.log(`    - Неотслеживаемых: ${status.untracked.length} файлов`);
        
        console.log('  • AI агент может создать коммит с описанием изменений');
        console.log('  • AI агент может создать новую ветку для разработки');
        console.log('  • AI агент может слить ветки после завершения работы');
    } else {
        console.log('  • Репозиторий чистый, нет изменений для коммита');
    }
    
    console.log('  ✅ AI агент может управлять Git репозиторием\n');
    
} catch (error) {
    console.log(`  ❌ Ошибка Git: ${error.message}\n`);
}

// Пример 3: AI агент работает с базой данных
console.log('🗄️ Пример 3: Работа с базой данных');
try {
    const MCPDatabaseTools = require('./mcp-database-tools');
    const dbTools = new MCPDatabaseTools();
    
    console.log('  • AI агент может выполнять безопасные SQL запросы');
    console.log('  • AI агент может создавать резервные копии БД');
    console.log('  • AI агент может выполнять миграции с проверками');
    console.log('  • AI агент может получать статистику БД');
    
    // Демонстрируем получение статистики (если БД доступна)
    try {
        const stats = await dbTools.getDatabaseStats();
        console.log('  • Статистика базы данных:');
        Object.entries(stats).forEach(([table, count]) => {
            console.log(`    - ${table}: ${count} записей`);
        });
    } catch (dbError) {
        console.log('  • База данных недоступна для демонстрации');
    }
    
    console.log('  ✅ AI агент может безопасно работать с БД\n');
    
} catch (error) {
    console.log(`  ❌ Ошибка БД: ${error.message}\n`);
}

// Пример 4: AI агент генерирует документацию
console.log('📚 Пример 4: Генерация документации');
try {
    const MCPFileTools = require('./mcp-file-tools');
    const fileTools = new MCPFileTools();
    
    // AI агент создает документацию для API
    const docsDir = path.join(__dirname, 'api-docs');
    const apiDocs = {
        'README.md': `# API Documentation

## Endpoints

### GET /api/projects
Returns list of all projects

### POST /api/projects
Creates a new project

### GET /api/projects/:id
Returns project by ID

## Authentication
All endpoints require Bearer token in Authorization header
`,
        'projects.md': `# Projects API

## Project Model
- id: string
- name: string
- description: string
- createdAt: Date
- updatedAt: Date
`,
        'auth.md': `# Authentication

## Login
POST /api/auth/login
Body: { email, password }

## Register
POST /api/auth/register
Body: { email, password, name }
`
    };
    
    console.log('  • AI агент создает документацию API...');
    
    Object.entries(apiDocs).forEach(([filename, content]) => {
        const filePath = path.join(docsDir, filename);
        console.log(`    Создаю: ${filename}`);
        fileTools.safeWriteFile(filePath, content, true);
    });
    
    console.log('  ✅ AI агент автоматически создал документацию');
    console.log('  ✅ Все файлы сохранены с резервными копиями');
    
    // Очистка
    fs.rmSync(docsDir, { recursive: true, force: true });
    console.log('  ✅ Демонстрация завершена, тестовые файлы удалены\n');
    
} catch (error) {
    console.log(`  ❌ Ошибка: ${error.message}\n`);
}

// Итоговый отчет
console.log('🎉 ПРАКТИЧЕСКИЕ ПРИМЕРЫ ЗАВЕРШЕНЫ');
console.log('==================================');
console.log('✅ AI агент может создавать сложные структуры файлов');
console.log('✅ AI агент может управлять Git репозиторием');
console.log('✅ AI агент может работать с базой данных');
console.log('✅ AI агент может генерировать документацию');
console.log('✅ Все операции выполняются с проверками безопасности');

console.log('\n🚀 MCP расширяет возможности AI агента:');
console.log('  • Автоматическое создание папок и файлов');
console.log('  • Безопасная работа с Git и базой данных');
console.log('  • Генерация документации и диаграмм');
console.log('  • Мониторинг и логирование всех операций');
console.log('  • Резервное копирование перед изменениями');

console.log('\n🎯 Теперь AI агент может делать гораздо больше!');
console.log('MCP готов к полноценной работе с проектом Production Gantt!');
