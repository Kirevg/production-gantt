# Создание ярлыков на рабочий стол для системы бэкапов
# Запуск: .\create-desktop-shortcuts.ps1

Write-Host "🔗 Создаем ярлыки на рабочий стол..." -ForegroundColor Green

$desktopPath = [Environment]::GetFolderPath("Desktop")
$projectPath = "C:\Projects\production-gantt"
$cursorPath = "$projectPath\.cursor"

# Функция создания ярлыка
function Create-Shortcut {
    param(
        [string]$Name,
        [string]$TargetPath,
        [string]$Arguments = "",
        [string]$Description = ""
    )
    
    $shortcutPath = "$desktopPath\$Name.lnk"
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $TargetPath
    $Shortcut.Arguments = $Arguments
    $Shortcut.WorkingDirectory = $cursorPath
    $Shortcut.Description = $Description
    $Shortcut.Save()
    
    Write-Host "✅ Создан ярлык: $Name" -ForegroundColor Green
}

# 1. Создать бэкап
Create-Shortcut -Name "Создать бэкап" -TargetPath "powershell.exe" -Arguments "-Command `"cd '$cursorPath'; node auto-save.js backup 'Ручной бэкап'`"" -Description "Создать резервную копию проекта"

# 2. Показать бэкапы
Create-Shortcut -Name "Список бэкапов" -TargetPath "powershell.exe" -Arguments "-Command `"cd '$cursorPath'; node auto-save.js list; pause`"" -Description "Показать список всех бэкапов"

# 3. Запустить автосохранение
Create-Shortcut -Name "Запустить автосохранение" -TargetPath "powershell.exe" -Arguments "-Command `"cd '$cursorPath'; node auto-save.js start; pause`"" -Description "Запустить автоматическое сохранение"

# 4. Остановить автосохранение
Create-Shortcut -Name "Остановить автосохранение" -TargetPath "powershell.exe" -Arguments "-Command `"cd '$cursorPath'; node auto-save.js stop; pause`"" -Description "Остановить автоматическое сохранение"

# 5. Открыть проект в Cursor
Create-Shortcut -Name "Открыть проект" -TargetPath "cursor" -Arguments "`"$projectPath`"" -Description "Открыть проект Production Gantt в Cursor"

# 6. Открыть папку бэкапов
Create-Shortcut -Name "Папка бэкапов" -TargetPath "explorer.exe" -Arguments "`"$cursorPath\backups`"" -Description "Открыть папку с бэкапами"

Write-Host "`n🎉 Ярлыки созданы на рабочем столе:" -ForegroundColor Cyan
Write-Host "  📁 Создать бэкап" -ForegroundColor White
Write-Host "  📋 Список бэкапов" -ForegroundColor White
Write-Host "  🚀 Запустить автосохранение" -ForegroundColor White
Write-Host "  🛑 Остановить автосохранение" -ForegroundColor White
Write-Host "  🔧 Открыть проект" -ForegroundColor White
Write-Host "  📂 Папка бэкапов" -ForegroundColor White

Write-Host "`n💡 Теперь вы можете:" -ForegroundColor Yellow
Write-Host "  • Двойной клик по ярлыку для быстрого доступа" -ForegroundColor White
Write-Host "  • Создавать бэкапы одним кликом" -ForegroundColor White
Write-Host "  • Просматривать список бэкапов" -ForegroundColor White
Write-Host "  • Управлять автосохранением" -ForegroundColor White

Write-Host "`n🎯 Готово! Ярлыки на рабочем столе созданы!" -ForegroundColor Green
