#!/bin/bash

echo "========================================"
echo "Сборка проекта для загрузки на хостинг"
echo "========================================"
echo ""

echo "[1/3] Сборка бэкенда..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей бэкенда..."
    npm install
fi
echo "Компиляция TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось собрать бэкенд!"
    exit 1
fi
cd ..
echo "✓ Бэкенд собран успешно"
echo ""

echo "[2/3] Сборка фронтенда..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей фронтенда..."
    npm install
fi
echo "Сборка фронтенда..."
npm run build
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось собрать фронтенд!"
    exit 1
fi
cd ..
echo "✓ Фронтенд собран успешно"
echo ""

echo "[3/3] Проверка структуры..."
if [ ! -f "backend/dist/server.js" ]; then
    echo "ОШИБКА: backend/dist/server.js не найден!"
    exit 1
fi
if [ ! -f "frontend/dist/index.html" ]; then
    echo "ОШИБКА: frontend/dist/index.html не найден!"
    exit 1
fi
echo "✓ Все файлы на месте"
echo ""

echo "========================================"
echo "Сборка завершена успешно!"
echo "========================================"
echo ""
echo "Теперь можно загружать на хостинг через SFTP:"
echo "  - backend/ (всю папку)"
echo "  - frontend/dist/ (папку dist)"
echo "  - photo/ (если есть)"
echo ""
echo "Не забудьте создать .env файл на сервере!"
echo "См. инструкцию в DEPLOYMENT_HOSTING.md"
echo ""

