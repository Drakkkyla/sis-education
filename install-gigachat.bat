@echo off
chcp 65001 >nul
echo ========================================
echo Установка зависимостей для GigaChat API
echo ========================================
echo.

cd backend
if exist "package.json" (
    echo Установка пакета axios...
    call npm install axios
    echo.
    echo ========================================
    echo Готово! Зависимости установлены.
    echo ========================================
    echo.
    echo Теперь можно запустить сервер:
    echo npm run dev
) else (
    echo Ошибка: package.json не найден в папке backend
    pause
)

cd ..
pause

