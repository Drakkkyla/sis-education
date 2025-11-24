@echo off
chcp 65001 >nul
echo ========================================
echo Установка пакета OpenAI для DeepSeek API
echo ========================================
echo.

cd backend
if exist "package.json" (
    echo Установка пакета openai...
    call npm install openai
    echo.
    echo ========================================
    echo Готово! Пакет установлен.
    echo ========================================
) else (
    echo Ошибка: package.json не найден в папке backend
    pause
)

cd ..
pause

