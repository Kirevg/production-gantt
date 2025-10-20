# MCP (Model Context Protocol) Инструменты для AI Агента

## 🚀 Обзор

MCP-серверы расширяют возможности AI агента, позволяя ему работать с внешними инструментами:
- 🌐 **Браузер** - автотесты фронтенда, скриншоты
- 📁 **Файловая система** - безопасная работа с файлами и папками
- 🗄️ **База данных** - SQL запросы, миграции, бэкапы
- 🔄 **Git** - коммиты, ветки, слияния
- 🔍 **Поиск** - веб-поиск, документация библиотек
- 🎨 **Генерация** - диаграммы, мокапы UI

## 📋 Установка

### 1. Автоматическая установка
```powershell
# Запустите скрипт установки
.\install-mcp-servers.ps1
```

### 2. Ручная установка
```bash
# Установите MCP серверы
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-browser
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-fetch
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-puppeteer
```

## ⚙️ Конфигурация

### Основной конфиг: `.cursor/mcp.json`
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "C:\\Projects\\production-gantt"],
      "env": {
        "ALLOWED_DIRECTORIES": "C:\\Projects\\production-gantt"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-browser"],
      "env": {
        "HEADLESS": "false",
        "BROWSER_TIMEOUT": "30000"
      }
    }
  }
}
```

### Инструменты: `.cursor/mcp-tools.json`
Содержит описания всех доступных инструментов с параметрами и настройками безопасности.

## 🛠️ Доступные инструменты

### 📁 Файловые операции
- `create_directory` - создание папок
- `backup_file` - резервное копирование
- `safe_write_file` - безопасное сохранение файлов
- `validate_path` - проверка путей

### 🗄️ База данных
- `query_executor` - выполнение SQL запросов
- `backup_database` - резервное копирование БД
- `migrate_database` - миграции
- `get_database_stats` - статистика БД

### 🔄 Git операции
- `commit_changes` - создание коммитов
- `create_branch` - создание веток
- `merge_branch` - слияние веток
- `get_status` - статус репозитория

### 🌐 Браузер
- `screenshot` - скриншоты страниц
- `test_frontend` - автотесты фронтенда
- `navigate` - навигация по сайтам

### 🎨 Генерация
- `create_diagram` - создание диаграмм
- `generate_ui_mockup` - мокапы UI
- `generate_docs` - документация

## 🚨 Правила безопасности

### Обязательные проверки перед сохранением файлов:
1. ✅ **Проверить существование директории**
2. ✅ **Создать директорию если не существует**
3. ✅ **Проверить права доступа**
4. ✅ **Создать резервную копию если файл существует**

### Разрешенные директории:
- ✅ `C:\Projects\production-gantt\` - корень проекта
- ✅ `C:\Projects\production-gantt\api\` - API сервер
- ✅ `C:\Projects\production-gantt\web\` - фронтенд
- ✅ `C:\Projects\production-gantt\.cursor\` - конфигурация

### Запрещенные операции:
- ❌ Удаление файлов без разрешения
- ❌ Изменение системных файлов
- ❌ Операции вне разрешенных директорий
- ❌ SQL операции: `DROP`, `TRUNCATE`, `ALTER`

## 📊 Использование

### Инициализация MCP инструментов:
```javascript
const MCPInitializer = require('./mcp-init');
const mcp = new MCPInitializer();

// Инициализация всех инструментов
await mcp.initializeTools();

// Тестирование работоспособности
await mcp.testTools();

// Получение статуса
mcp.getToolsStatus();
```

### Примеры использования:

#### Создание папки с проверкой:
```javascript
const MCPFileTools = require('./mcp-file-tools');
const fileTools = new MCPFileTools();

// Создает папку если не существует
fileTools.ensureDirectory('./new-folder');
```

#### Безопасное сохранение файла:
```javascript
// Автоматически создает папку и резервную копию
fileTools.safeWriteFile('./new-folder/file.txt', 'content', true);
```

#### Работа с Git:
```javascript
const MCPGitTools = require('./mcp-git-tools');
const gitTools = new MCPGitTools();

// Создание коммита
await gitTools.commitChanges('Добавлена новая функция', null, true);
```

#### Работа с базой данных:
```javascript
const MCPDatabaseTools = require('./mcp-database-tools');
const dbTools = new MCPDatabaseTools();

// Безопасный SQL запрос
const result = await dbTools.executeQuery('SELECT * FROM projects LIMIT 10');

// Создание бэкапа
await dbTools.createBackup();
```

## 🔧 Настройка Cursor

Для использования MCP в Cursor добавьте в настройки:

```json
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-filesystem", "C:\\Projects\\production-gantt"]
      },
      "browser": {
        "command": "npx", 
        "args": ["@modelcontextprotocol/server-browser"]
      }
    }
  }
}
```

## 📝 Логирование

Все операции MCP логируются в:
- `.cursor/logs/` - общие логи
- `.cursor/backups/` - резервные копии
- `.cursor/screenshots/` - скриншоты браузера
- `.cursor/memory/` - память агента

## ⚠️ Важные замечания

1. **Всегда создавайте резервные копии** перед критическими операциями
2. **Проверяйте существование папок** перед сохранением файлов
3. **Используйте безопасные SQL запросы** - избегайте `DROP`, `TRUNCATE`
4. **Ограничивайте браузерные операции** локальными URL
5. **Тестируйте изменения** на безопасных данных

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи в `.cursor/logs/`
2. Убедитесь что все MCP серверы установлены
3. Проверьте конфигурацию в `.cursor/mcp.json`
4. Запустите тест: `node .cursor/mcp-init.js`

## 🎯 Преимущества

- 🚀 **Автоматизация** - агент может выполнять сложные задачи
- 🛡️ **Безопасность** - все операции проверяются
- 📊 **Мониторинг** - полное логирование действий
- 🔄 **Резервное копирование** - автоматические бэкапы
- 🎨 **Визуализация** - генерация диаграмм и мокапов
- 🌐 **Тестирование** - автотесты фронтенда
