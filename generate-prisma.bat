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
npm run prisma:generate

REM Пауза для просмотра результата
pause