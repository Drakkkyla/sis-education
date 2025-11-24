@echo off
echo ========================================
echo Сборка проекта для загрузки на хостинг
echo ========================================
echo.

echo [1/3] Сборка бэкенда...
cd backend
if not exist node_modules (
    echo Установка зависимостей бэкенда...
    call npm install
)
echo Компиляция TypeScript...
call npm run build
if errorlevel 1 (
    echo ОШИБКА: Не удалось собрать бэкенд!
    pause
    exit /b 1
)
cd ..
echo ✓ Бэкенд собран успешно
echo.

echo [2/3] Сборка фронтенда...
cd frontend
if not exist node_modules (
    echo Установка зависимостей фронтенда...
    call npm install
)
echo Сборка фронтенда...
call npm run build
if errorlevel 1 (
    echo ОШИБКА: Не удалось собрать фронтенд!
    pause
    exit /b 1
)
cd ..
echo ✓ Фронтенд собран успешно
echo.

echo [3/3] Проверка структуры...
if not exist "backend\dist\server.js" (
    echo ОШИБКА: backend\dist\server.js не найден!
    pause
    exit /b 1
)
if not exist "frontend\dist\index.html" (
    echo ОШИБКА: frontend\dist\index.html не найден!
    pause
    exit /b 1
)
echo ✓ Все файлы на месте
echo.

echo ========================================
echo Сборка завершена успешно!
echo ========================================
echo.
echo Теперь можно загружать на хостинг через SFTP:
echo   - backend/ (всю папку)
echo   - frontend/dist/ (папку dist)
echo   - photo/ (если есть)
echo.
echo Не забудьте создать .env файл на сервере!
echo См. инструкцию в DEPLOYMENT_HOSTING.md
echo.
pause

