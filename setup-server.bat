@echo off
chcp 65001 >nul
echo ========================================
echo Настройка сервера Кванториум
echo ========================================
echo.

set SERVER_IP=
set MONGODB_URI=
set JWT_SECRET=

echo Введите IP адрес этого компьютера (например: 192.168.1.100)
echo Чтобы узнать IP: ipconfig
set /p SERVER_IP="IP адрес сервера: "

if "%SERVER_IP%"=="" (
    echo ОШИБКА: IP адрес не может быть пустым!
    pause
    exit /b 1
)

echo.
echo Выберите вариант MongoDB:
echo 1. Локальный MongoDB (установлен на этом компьютере)
echo 2. MongoDB Atlas (облачный)
set /p MONGO_CHOICE="Ваш выбор (1 или 2): "

if "%MONGO_CHOICE%"=="1" (
    set MONGODB_URI=mongodb://localhost:27017/kvantorium
) else if "%MONGO_CHOICE%"=="2" (
    echo.
    echo Введите connection string от MongoDB Atlas
    echo Пример: mongodb+srv://user:password@cluster.mongodb.net/kvantorium
    set /p MONGODB_URI="MongoDB URI: "
    if "%MONGODB_URI%"=="" (
        echo ОШИБКА: MongoDB URI не может быть пустым!
        pause
        exit /b 1
    )
) else (
    echo ОШИБКА: Неверный выбор!
    pause
    exit /b 1
)

echo.
echo Генерация JWT секрета...
for /f "delims=" %%i in ('powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32, 5)"') do set JWT_SECRET=%%i
if "%JWT_SECRET%"=="" (
    set JWT_SECRET=kvantorium-secret-key-change-in-production-2024
)

echo.
echo Создание .env файла для бэкенда...
(
echo PORT=5000
echo MONGODB_URI=%MONGODB_URI%
echo JWT_SECRET=%JWT_SECRET%
echo JWT_EXPIRE=7d
echo NODE_ENV=production
) > backend\.env

echo.
echo Создание .env файла для фронтенда...
(
echo VITE_API_URL=http://%SERVER_IP%:5000
) > frontend\.env.production

echo.
echo ========================================
echo Настройка завершена!
echo ========================================
echo.
echo Сервер будет доступен по адресу: http://%SERVER_IP%:5173
echo API будет доступен по адресу: http://%SERVER_IP%:5000
echo.
echo ВАЖНО: Откройте порты 5000 и 5173 в файрволе Windows!
echo Запустите configure-firewall.bat для автоматической настройки
echo.
pause

