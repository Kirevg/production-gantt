# Проверка MCP серверов и инструментов
# Запуск: .\check-mcp-fixed.ps1

Write-Host "Проверка MCP серверов и инструментов..." -ForegroundColor Yellow

# Проверяем Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js не найден!" -ForegroundColor Red
    exit 1
}

# Проверяем npm
try {
    $npmVersion = npm --version
    Write-Host "npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm не найден!" -ForegroundColor Red
    exit 1
}

# Проверяем MCP серверы
Write-Host "`nПроверка MCP серверов..." -ForegroundColor Yellow

$servers = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-browser",
    "@modelcontextprotocol/server-memory", 
    "@modelcontextprotocol/server-git"
)

$workingServers = 0
$totalServers = $servers.Count

foreach ($server in $servers) {
    try {
        $null = npx $server --version 2>$null
        Write-Host "Работает: $server" -ForegroundColor Green
        $workingServers++
    } catch {
        Write-Host "Не работает: $server" -ForegroundColor Red
    }
}

Write-Host "`nСтатистика MCP серверов:" -ForegroundColor Cyan
Write-Host "Работают: $workingServers из $totalServers" -ForegroundColor White

# Проверяем конфигурационные файлы
Write-Host "`nПроверка конфигурации..." -ForegroundColor Yellow

$configFiles = @(
    "mcp.json",
    "mcp-tools.json", 
    "mcp-rules.md",
    "mcp-database-tools.js",
    "mcp-git-tools.js",
    "mcp-file-tools.js",
    "mcp-init.js"
)

$existingConfigs = 0
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "Найден: $file" -ForegroundColor Green
        $existingConfigs++
    } else {
        Write-Host "Не найден: $file" -ForegroundColor Red
    }
}

Write-Host "`nКонфигурационные файлы:" -ForegroundColor Cyan
Write-Host "Найдено: $existingConfigs из $($configFiles.Count)" -ForegroundColor White

# Проверяем директории
Write-Host "`nПроверка директорий..." -ForegroundColor Yellow

$directories = @(
    "backups",
    "logs", 
    "screenshots",
    "memory",
    "temp"
)

$existingDirs = 0
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Создана: $dir" -ForegroundColor Green
        $existingDirs++
    } else {
        Write-Host "Не создана: $dir" -ForegroundColor Red
    }
}

Write-Host "`nДиректории:" -ForegroundColor Cyan
Write-Host "Создано: $existingDirs из $($directories.Count)" -ForegroundColor White

# Тестируем MCP инструменты
Write-Host "`nТестирование MCP инструментов..." -ForegroundColor Yellow

try {
    # Тестируем инициализацию
    $testResult = node mcp-init.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MCP инструменты работают" -ForegroundColor Green
    } else {
        Write-Host "Ошибка инициализации MCP" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
    }
} catch {
    Write-Host "Не удалось запустить тест MCP" -ForegroundColor Red
}

# Проверяем Git репозиторий
Write-Host "`nПроверка Git репозитория..." -ForegroundColor Yellow

try {
    $gitStatus = git status --porcelain 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git репозиторий доступен" -ForegroundColor Green
        
        # Показываем статус
        $changes = ($gitStatus -split "`n").Count
        if ($changes -gt 0) {
            Write-Host "Изменений: $changes файлов" -ForegroundColor Yellow
        } else {
            Write-Host "Рабочая директория чистая" -ForegroundColor Green
        }
    } else {
        Write-Host "Git репозиторий недоступен" -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка проверки Git" -ForegroundColor Red
}

# Итоговый отчет
Write-Host "`nИТОГОВЫЙ ОТЧЕТ:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

$totalChecks = $totalServers + $configFiles.Count + $directories.Count
$passedChecks = $workingServers + $existingConfigs + $existingDirs

Write-Host "MCP серверы: $workingServers/$totalServers" -ForegroundColor White
Write-Host "Конфигурация: $existingConfigs/$($configFiles.Count)" -ForegroundColor White  
Write-Host "Директории: $existingDirs/$($directories.Count)" -ForegroundColor White
Write-Host "Общий результат: $passedChecks/$totalChecks" -ForegroundColor White

if ($passedChecks -eq $totalChecks) {
    Write-Host "`nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! MCP готов к работе!" -ForegroundColor Green
} elseif ($passedChecks -gt ($totalChecks * 0.8)) {
    Write-Host "`nБольшинство проверок пройдено. MCP частично готов." -ForegroundColor Yellow
} else {
    Write-Host "`nМного ошибок. Запустите установку: .\install-mcp-servers.ps1" -ForegroundColor Red
}

Write-Host "`nДля устранения проблем:" -ForegroundColor Yellow
Write-Host "  1. Запустите: .\install-mcp-servers.ps1" -ForegroundColor White
Write-Host "  2. Проверьте конфигурацию в mcp.json" -ForegroundColor White
Write-Host "  3. Убедитесь что все зависимости установлены" -ForegroundColor White
Write-Host "  4. Перезапустите Cursor" -ForegroundColor White

