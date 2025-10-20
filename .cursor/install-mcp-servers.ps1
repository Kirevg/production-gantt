# Установка MCP-серверов для расширения возможностей AI агента
# Запуск: .\install-mcp-servers.ps1

Write-Host "🚀 Установка MCP-серверов для AI агента..." -ForegroundColor Green

# Проверяем наличие Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js найден: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден! Установите Node.js с https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Создаем директорию для MCP серверов
$mcpDir = "C:\Projects\production-gantt\.cursor\mcp-servers"
if (!(Test-Path $mcpDir)) {
    New-Item -ItemType Directory -Path $mcpDir -Force
    Write-Host "✅ Создана директория для MCP серверов: $mcpDir" -ForegroundColor Green
}

# Устанавливаем MCP серверы
Write-Host "📦 Установка MCP серверов..." -ForegroundColor Yellow

$servers = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-postgres", 
    "@modelcontextprotocol/server-browser",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-git",
    "@modelcontextprotocol/server-brave-search",
    "@modelcontextprotocol/server-fetch",
    "@modelcontextprotocol/server-sqlite",
    "@modelcontextprotocol/server-puppeteer"
)

foreach ($server in $servers) {
    Write-Host "Устанавливаем $server..." -ForegroundColor Cyan
    try {
        npm install -g $server
        Write-Host "✅ $server установлен" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Ошибка установки $server" -ForegroundColor Yellow
    }
}

# Создаем конфигурационный файл для Cursor
$cursorConfig = @'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "C:\\Projects\\production-gantt"],
      "env": {
        "ALLOWED_DIRECTORIES": "C:\\Projects\\production-gantt"
      }
    },
    "database": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-postgres", "--connection-string", "postgresql://username:password@localhost:5432/production_gantt"],
      "env": {
        "DATABASE_URL": "postgresql://username:password@localhost:5432/production_gantt"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-browser"],
      "env": {
        "HEADLESS": "false",
        "BROWSER_TIMEOUT": "30000"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_DIR": "C:\\Projects\\production-gantt\\.cursor\\memory"
      }
    },
    "git": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-git", "--repository", "C:\\Projects\\production-gantt"],
      "env": {
        "GIT_REPOSITORY": "C:\\Projects\\production-gantt"
      }
    }
  }
}
'@

# Сохраняем конфигурацию
$configPath = "C:\Projects\production-gantt\.cursor\mcp.json"
$cursorConfig | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "✅ Конфигурация MCP сохранена: $configPath" -ForegroundColor Green

# Создаем директории для работы
$directories = @(
    "C:\Projects\production-gantt\.cursor\memory",
    "C:\Projects\production-gantt\.cursor\backups", 
    "C:\Projects\production-gantt\.cursor\logs",
    "C:\Projects\production-gantt\.cursor\screenshots"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "✅ Создана директория: $dir" -ForegroundColor Green
    }
}

# Создаем скрипт для проверки MCP серверов
$checkScript = @"
# Проверка MCP серверов
Write-Host "🔍 Проверка MCP серверов..." -ForegroundColor Yellow

$servers = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-browser", 
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-git"
)

foreach (`$server in `$servers) {
    try {
        npx `$server --version
        Write-Host "✅ `$server работает" -ForegroundColor Green
    } catch {
        Write-Host "❌ `$server не работает" -ForegroundColor Red
    }
}
"@

$checkScript | Out-File -FilePath "C:\Projects\production-gantt\.cursor\check-mcp.ps1" -Encoding UTF8

Write-Host "🎉 Установка MCP серверов завершена!" -ForegroundColor Green
Write-Host "📋 Доступные инструменты:" -ForegroundColor Cyan
Write-Host "  • Файловые операции (создание папок, резервное копирование)" -ForegroundColor White
Write-Host "  • Работа с базой данных (SQL запросы, миграции, бэкапы)" -ForegroundColor White  
Write-Host "  • Браузерные операции (скриншоты, автотесты фронтенда)" -ForegroundColor White
Write-Host "  • Git операции (коммиты, ветки, слияния)" -ForegroundColor White
Write-Host "  • Генерация документации и диаграмм" -ForegroundColor White
Write-Host "  • Поиск в интернете и работа с API" -ForegroundColor White

Write-Host "`n🔧 Для проверки работы MCP серверов запустите:" -ForegroundColor Yellow
Write-Host "  .\check-mcp.ps1" -ForegroundColor White

Write-Host "`n⚠️ ВАЖНО: Обновите конфигурацию Cursor для использования MCP серверов!" -ForegroundColor Red
