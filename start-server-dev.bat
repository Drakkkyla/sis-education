@echo off
chcp 65001 >nul
title Кванториум - Сервер (Разработка)
echo ========================================
echo Запуск сервера Кванториум (режим разработки)
echo ========================================
echo.

REM Проверка .env файла
if not exist "backend\.env" (
    echo ОШИБКА: Файл backend\.env не найден!
    echo Запустите setup-server.bat для настройки
    pause
    exit /b 1
)

echo Запуск бэкенда (режим разработки)...
start "Кванториум Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Запуск фронтенда (режим разработки)...
start "Кванториум Frontend" cmd /k "cd frontend && npm run dev -- --host --port 5173"

echo.
echo ========================================
echo Сервер запущен в режиме разработки!
echo ========================================
echo.
echo Бэкенд: http://localhost:5000
echo Фронтенд: http://localhost:5173
echo.
echo Нажмите любую клавишу для выхода...
pause >nul

