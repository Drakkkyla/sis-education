@echo off
chcp 65001 >nul
title Кванториум - Сервер
echo ========================================
echo Запуск сервера Кванториум
echo ========================================
echo.

REM Проверка .env файла
if not exist "backend\.env" (
    echo ОШИБКА: Файл backend\.env не найден!
    echo Запустите setup-server.bat для настройки
    pause
    exit /b 1
)

REM Проверка сборки фронтенда
if not exist "frontend\dist" (
    echo Сборка фронтенда...
    cd frontend
    call npm run build
    if errorlevel 1 (
        echo ОШИБКА при сборке фронтенда!
        pause
        exit /b 1
    )
    cd ..
)

REM Проверка сборки бэкенда
if not exist "backend\dist" (
    echo Сборка бэкенда...
    cd backend
    call npm run build
    if errorlevel 1 (
        echo ОШИБКА при сборке бэкенда!
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo Запуск бэкенда...
start "Кванториум Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo.
echo Запуск фронтенда...
start "Кванториум Frontend" cmd /k "cd frontend && npm run preview -- --host --port 5173"

echo.
echo ========================================
echo Сервер запущен!
echo ========================================
echo.
echo Бэкенд: http://localhost:5000
echo Фронтенд: http://localhost:5173
echo.
echo Чтобы узнать IP адрес для доступа из сети:
echo ipconfig
echo.
echo Нажмите любую клавишу для выхода...
pause >nul

