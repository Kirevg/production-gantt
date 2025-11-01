@echo off
REM ========================================
REM   ГЕНЕРАЦИЯ PRISMA CLIENT
REM   Production Gantt
REM ========================================

REM Устанавливаем кодировку UTF-8 для корректного отображения русского текста
chcp 65001 >nul

REM Переходим в папку API
cd "C:\Projects\production-gantt\api"

REM Запускаем генерацию Prisma Client
echo.
echo Генерируем Prisma Client...
call npm run prisma:generate

REM Проверяем результат
if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Генерация Prisma Client завершилась с ошибкой!
    echo Код ошибки: %errorlevel%
    echo.
) else (
    echo.
    echo [УСПЕХ] Prisma Client успешно сгенерирован!
    echo.
)

REM Пауза для просмотра результата
echo Нажмите любую клавишу для выхода...
pause >nul