# ========================================
#   ГЕНЕРАЦИЯ PRISMA CLIENT
#   Production Gantt
# ========================================

# Устанавливаем кодировку UTF-8 для корректного отображения русского текста
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🔧 Генерируем Prisma Client..." -ForegroundColor Yellow

# Переходим в папку API
Set-Location "C:\Projects\production-gantt\api"

# Запускаем генерацию Prisma Client
npm run prisma:generate

Write-Host ""
Write-Host "✅ Prisma Client успешно сгенерирован!" -ForegroundColor Green
Write-Host ""

# Возвращаемся в корень проекта
Set-Location "C:\Projects\production-gantt"

