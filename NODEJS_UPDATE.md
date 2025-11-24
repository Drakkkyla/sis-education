# Обновление Node.js на Ubuntu сервере

## Проблема

Если вы видите ошибку:
```
SyntaxError: Unexpected token '?'
```

Это означает, что версия Node.js слишком старая. Проект требует **Node.js 18+** (рекомендуется Node.js 20 LTS).

## Быстрое решение

### Вариант 1: Использовать скрипт (рекомендуется)

```bash
bash update-nodejs.sh
```

### Вариант 2: Ручная установка

```bash
# Обновление списка пакетов
sudo apt update

# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

### Вариант 3: Использование nvm (Node Version Manager)

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Перезагрузка терминала или выполнение:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Установка Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Проверка
node --version
```

## Проверка после обновления

После обновления Node.js выполните:

```bash
# Проверка версии (должна быть 18+)
node --version

# Переустановка зависимостей (рекомендуется)
cd backend
rm -rf node_modules package-lock.json
npm install

# Сборка проекта
cd ..
bash build-for-hosting.sh
```

## Требования

- **Минимальная версия Node.js:** 18.x
- **Рекомендуемая версия:** 20.x LTS
- **npm:** обычно устанавливается вместе с Node.js

## Решение проблем

### Если команда curl не найдена:

```bash
sudo apt install curl
```

### Если возникают проблемы с правами:

Убедитесь, что используете `sudo` для установки системных пакетов.

### Если нужно удалить старую версию Node.js:

```bash
# Удаление старой версии
sudo apt remove nodejs npm
sudo apt autoremove

# Затем установите новую версию по инструкции выше
```

## Проверка совместимости пакетов

После обновления Node.js проверьте, что все зависимости совместимы:

```bash
cd backend
npm install
npm audit
```

Если есть предупреждения о версиях Node.js, они должны исчезнуть после обновления.

