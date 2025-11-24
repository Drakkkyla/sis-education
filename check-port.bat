@echo off
chcp 65001 >nul
echo ========================================
echo Проверка занятых портов
echo ========================================
echo.

echo Проверка порта 5000 (бэкенд)...
netstat -ano | findstr :5000
if errorlevel 1 (
    echo Порт 5000 свободен
) else (
    echo.
    echo Порт 5000 занят!
    echo Найдены процессы, использующие порт 5000:
    netstat -ano | findstr :5000
    echo.
    set /p KILL_PROCESS="Завершить процесс(ы)? (y/n): "
    if /i "%KILL_PROCESS%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
            echo Завершение процесса %%a...
            taskkill /F /PID %%a >nul 2>&1
        )
        echo Процессы завершены
    )
)

echo.
echo Проверка порта 5173 (фронтенд)...
netstat -ano | findstr :5173
if errorlevel 1 (
    echo Порт 5173 свободен
) else (
    echo.
    echo Порт 5173 занят!
    echo Найдены процессы, использующие порт 5173:
    netstat -ano | findstr :5173
    echo.
    set /p KILL_PROCESS="Завершить процесс(ы)? (y/n): "
    if /i "%KILL_PROCESS%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
            echo Завершение процесса %%a...
            taskkill /F /PID %%a >nul 2>&1
        )
        echo Процессы завершены
    )
)

echo.
pause

