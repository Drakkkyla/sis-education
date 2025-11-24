@echo off
chcp 65001 >nul
title Запуск Кванториум локально
color 0A

echo ========================================
echo   Запуск Кванториум система доп образования
echo   Локальный режим разработки
echo ========================================
echo.

REM Проверка MongoDB
echo [1/4] Проверка MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MongoDB запущен
) else (
    echo ✗ MongoDB не запущен!
    echo.
    echo Пожалуйста, запустите MongoDB перед продолжением.
    echo.
    pause
    exit /b 1
)
echo.

REM Проверка портов
echo [2/4] Проверка портов...
netstat -ano | findstr ":5000" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠ Порт 5000 занят!
    echo.
    set /p KILL_PORT="Завершить процесс на порту 5000? (y/n): "
    if /i "%KILL_PORT%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        echo ✓ Порт 5000 освобожден
        timeout /t 1 /nobreak >nul
    ) else (
        echo Продолжаем с занятым портом...
    )
) else (
    echo ✓ Порт 5000 свободен
)

netstat -ano | findstr ":5173" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠ Порт 5173 занят!
) else (
    echo ✓ Порт 5173 свободен
)
echo.

REM Проверка зависимостей
echo [3/4] Проверка зависимостей...
if not exist "backend\node_modules" (
    echo Установка зависимостей backend...
    cd backend
    call npm install
    cd ..
)
if not exist "frontend\node_modules" (
    echo Установка зависимостей frontend...
    cd frontend
    call npm install
    cd ..
)
echo ✓ Зависимости установлены
echo.

REM Проверка .env файлов
echo [4/4] Проверка конфигурации...
if not exist "backend\.env" (
    echo ⚠ Файл backend\.env не найден!
    echo Создайте файл .env в папке backend с настройками MongoDB
    echo Пример: MONGODB_URI=mongodb://localhost:27017/kvantorium
    echo.
    pause
    exit /b 1
)
echo ✓ Конфигурация найдена
echo.

REM Запуск серверов
echo ========================================
echo   Запуск серверов...
echo ========================================
echo.
echo Backend будет доступен на: http://localhost:5000
echo Frontend будет доступен на: http://localhost:5173
echo.
echo Для остановки нажмите Ctrl+C в каждом окне
echo.

REM Запуск backend в отдельном окне
start "Кванториум - Backend" cmd /k "cd backend && npm run dev"

REM Небольшая задержка перед запуском frontend
timeout /t 3 /nobreak >nul

REM Запуск frontend в отдельном окне
start "Кванториум - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✓ Серверы запущены в отдельных окнах
echo.
echo Откройте браузер и перейдите на: http://localhost:5173
echo.
pause

