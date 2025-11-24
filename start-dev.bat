@echo off
chcp 65001 >nul
title Запуск Кванториум (Dev режим)
color 0B

echo ========================================
echo   Запуск Кванториум система доп образования
echo   Режим разработки
echo ========================================
echo.
echo ⚠ Убедитесь, что MongoDB запущен!
echo.
echo Запуск серверов в отдельных окнах...
echo.

start "Кванториум - Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Кванториум - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✓ Серверы запущены в отдельных окнах
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Для остановки нажмите Ctrl+C в каждом окне
echo.
pause

