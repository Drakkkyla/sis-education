@echo off
chcp 65001 >nul
echo ========================================
echo Установка Кванториум система доп образования
echo ========================================
echo.

echo [1/4] Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен!
    echo Пожалуйста, установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js установлен: 
node --version

echo.
echo [2/4] Проверка MongoDB...
where mongod >nul 2>&1
if errorlevel 1 (
    echo ВНИМАНИЕ: MongoDB не найден в PATH
    echo Убедитесь, что MongoDB установлен и добавлен в PATH
    echo Или используйте MongoDB Atlas (облачный вариант)
    echo.
    set /p USE_ATLAS="Использовать MongoDB Atlas? (y/n): "
    if /i "%USE_ATLAS%"=="y" (
        echo MongoDB Atlas будет использован
    ) else (
        echo Пожалуйста, установите MongoDB локально
        pause
        exit /b 1
    )
) else (
    echo MongoDB найден
)

echo.
echo [3/4] Установка зависимостей бэкенда...
cd backend
call npm install
if errorlevel 1 (
    echo ОШИБКА при установке зависимостей бэкенда!
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] Установка зависимостей фронтенда...
cd frontend
call npm install
if errorlevel 1 (
    echo ОШИБКА при установке зависимостей фронтенда!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Установка завершена успешно!
echo ========================================
echo.
echo Следующие шаги:
echo 1. Настройте .env файл в папке backend
echo 2. Запустите setup-server.bat для настройки
echo 3. Запустите start-server.bat для запуска сервера
echo.
pause

