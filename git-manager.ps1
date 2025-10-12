# Git Manager - управление снапшотами и откатами
# Использование: powershell -ExecutionPolicy Bypass -File git-manager.ps1 [команда]

param(
    [string]$Command = "menu",
    [string]$Message = "Snapshot",
    [int]$Steps = 1
)

function Show-Menu {
    Clear-Host
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "       Git Snapshot Manager       " -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Создать снапшот (сохранить текущее состояние)" -ForegroundColor Green
    Write-Host "2. Показать историю снапшотов" -ForegroundColor Yellow
    Write-Host "3. Откатиться на 1 шаг назад" -ForegroundColor Red
    Write-Host "4. Откатиться на N шагов назад" -ForegroundColor Red
    Write-Host "5. Показать изменения (diff)" -ForegroundColor Magenta
    Write-Host "6. Создать ветку для экспериментов" -ForegroundColor Blue
    Write-Host "7. Показать статус" -ForegroundColor White
    Write-Host "0. Выход" -ForegroundColor Gray
    Write-Host ""
}

function Create-Snapshot {
    param([string]$Msg)
    
    Write-Host "Создание снапшота..." -ForegroundColor Green
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg = "[SNAPSHOT] $timestamp - $Msg"
    git commit -m "$commitMsg"
    Write-Host "✓ Снапшот создан: $Msg" -ForegroundColor Green
}

function Show-History {
    Write-Host "`n=== История снапшотов (последние 20) ===" -ForegroundColor Cyan
    Write-Host ""
    git log --oneline --decorate --graph -20
    Write-Host ""
}

function Rollback-Changes {
    param([int]$StepsBack)
    
    Write-Host "`n⚠ ВНИМАНИЕ! Откат на $StepsBack шаг(ов) назад" -ForegroundColor Yellow
    Write-Host "Текущие несохраненные изменения будут потеряны!" -ForegroundColor Red
    $confirm = Read-Host "Продолжить? (yes/no)"
    
    if ($confirm -eq "yes") {
        # Создаем снапшот перед откатом
        Write-Host "Создание снапшота перед откатом..." -ForegroundColor Yellow
        git add .
        git commit -m "[AUTO-SNAPSHOT] Before rollback" -ErrorAction SilentlyContinue
        
        # Откатываемся
        git reset --hard "HEAD~$StepsBack"
        Write-Host "✓ Откат выполнен на $StepsBack шаг(ов) назад" -ForegroundColor Green
    } else {
        Write-Host "Откат отменен" -ForegroundColor Gray
    }
}

function Show-Diff {
    Write-Host "`n=== Текущие изменения ===" -ForegroundColor Cyan
    git diff
    Write-Host "`n=== Изменения в staged ===" -ForegroundColor Cyan
    git diff --cached
}

function Create-ExperimentBranch {
    $branchName = Read-Host "Введите имя новой ветки для экспериментов"
    git checkout -b $branchName
    Write-Host "✓ Создана и активирована ветка: $branchName" -ForegroundColor Green
    Write-Host "Теперь можно экспериментировать безопасно!" -ForegroundColor Yellow
}

function Show-Status {
    Write-Host "`n=== Git Status ===" -ForegroundColor Cyan
    git status
    Write-Host ""
    Write-Host "=== Текущая ветка ===" -ForegroundColor Cyan
    git branch --show-current
}

# Обработка команд
switch ($Command) {
    "snapshot" {
        Create-Snapshot -Msg $Message
        exit
    }
    "history" {
        Show-History
        exit
    }
    "rollback" {
        Rollback-Changes -StepsBack $Steps
        exit
    }
    "diff" {
        Show-Diff
        exit
    }
    "menu" {
        while ($true) {
            Show-Menu
            $choice = Read-Host "Выберите действие"
            
            switch ($choice) {
                "1" {
                    $msg = Read-Host "Описание снапшота"
                    Create-Snapshot -Msg $msg
                    Read-Host "Нажмите Enter для продолжения"
                }
                "2" {
                    Show-History
                    Read-Host "Нажмите Enter для продолжения"
                }
                "3" {
                    Rollback-Changes -StepsBack 1
                    Read-Host "Нажмите Enter для продолжения"
                }
                "4" {
                    $steps = Read-Host "На сколько шагов откатиться?"
                    Rollback-Changes -StepsBack $steps
                    Read-Host "Нажмите Enter для продолжения"
                }
                "5" {
                    Show-Diff
                    Read-Host "Нажмите Enter для продолжения"
                }
                "6" {
                    Create-ExperimentBranch
                    Read-Host "Нажмите Enter для продолжения"
                }
                "7" {
                    Show-Status
                    Read-Host "Нажмите Enter для продолжения"
                }
                "0" {
                    Write-Host "До свидания!" -ForegroundColor Green
                    exit
                }
                default {
                    Write-Host "Неверный выбор!" -ForegroundColor Red
                    Start-Sleep -Seconds 1
                }
            }
        }
    }
}

