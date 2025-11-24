#!/bin/bash

echo "========================================"
echo "Обновление Node.js на Ubuntu"
echo "========================================"
echo ""

# Проверка текущей версии
echo "Текущая версия Node.js:"
node --version
echo ""

# Установка Node.js 20.x (LTS версия)
echo "Установка Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ""
echo "Проверка установленной версии:"
node --version
npm --version

echo ""
echo "========================================"
echo "Node.js успешно обновлен!"
echo "========================================"
echo ""
echo "Теперь можно запустить сборку проекта:"
echo "  bash build-for-hosting.sh"
echo ""

