# ========================================
#   ГЕНЕРАЦИЯ PRISMA CLIENT
#   Production Gantt
# ========================================

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

