@echo off
chcp 65001 >nul
echo ========================================
echo Настройка файрвола Windows
echo ========================================
echo.
echo Этот скрипт откроет порты 5000 и 5173 в файрволе Windows
echo Требуются права администратора!
echo.

net session >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Запустите этот файл от имени администратора!
    echo Правой кнопкой мыши -^> Запуск от имени администратора
    pause
    exit /b 1
)

echo Открытие порта 5000 (бэкенд)...
netsh advfirewall firewall add rule name="Кванториум Backend" dir=in action=allow protocol=TCP localport=5000
if errorlevel 1 (
    echo ОШИБКА при открытии порта 5000
) else (
    echo Порт 5000 открыт успешно
)

echo.
echo Открытие порта 5173 (фронтенд)...
netsh advfirewall firewall add rule name="Кванториум Frontend" dir=in action=allow protocol=TCP localport=5173
if errorlevel 1 (
    echo ОШИБКА при открытии порта 5173
) else (
    echo Порт 5173 открыт успешно
)

echo.
echo ========================================
echo Настройка файрвола завершена!
echo ========================================
echo.
pause

