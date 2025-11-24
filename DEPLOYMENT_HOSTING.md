# Инструкция по развертыванию на хостинге Node.js через SFTP

## Подготовка проекта к загрузке

### Шаг 1: Сборка проекта локально

Перед загрузкой на хостинг нужно собрать проект:

#### 1.1. Сборка бэкенда

```bash
cd backend
npm install
npm run build
```

Это создаст папку `backend/dist/` с скомпилированным JavaScript кодом.

#### 1.2. Сборка фронтенда

```bash
cd frontend
npm install
npm run build
```

Это создаст папку `frontend/dist/` с готовым к развертыванию фронтендом.

### Шаг 2: Подготовка файлов для загрузки

На хостинг нужно загрузить следующие файлы и папки:

#### Структура для загрузки:

```
/
├── backend/
│   ├── dist/              # Скомпилированный код (ВАЖНО!)
│   ├── uploads/           # Папка для загруженных файлов
│   ├── node_modules/      # Зависимости (или установить на сервере)
│   ├── package.json       # Конфигурация пакетов
│   ├── package-lock.json  # Зафиксированные версии
│   └── .env               # Конфигурация (создать на сервере)
│
├── frontend/
│   ├── dist/              # Собранный фронтенд (ВАЖНО!)
│   └── .env.production    # Конфигурация (создать на сервере)
│
└── photo/                 # Логотипы курсов (если есть)
```

## Загрузка через SFTP

### Вариант 1: Использование FileZilla или WinSCP

1. Подключитесь к серверу через SFTP:
   - Хост: адрес вашего сервера
   - Порт: обычно 22 (или указанный хостингом)
   - Протокол: SFTP
   - Логин и пароль: данные от хостинга

2. Перейдите в корневую директорию сервера (обычно `/home/container/` или `/home/ваш_пользователь/`)

3. Загрузите файлы, сохраняя структуру папок:
   - `backend/` (вся папка)
   - `frontend/dist/` (только папка dist)
   - `photo/` (если есть)

### Вариант 2: Использование командной строки (scp)

```bash
# Загрузка бэкенда
scp -r backend username@your-server.com:/home/container/

# Загрузка фронтенда
scp -r frontend/dist username@your-server.com:/home/container/frontend/

# Загрузка фото
scp -r photo username@your-server.com:/home/container/
```

## Настройка на хостинге

### Шаг 1: Создание .env файла для бэкенда

На сервере создайте файл `backend/.env` со следующим содержимым:

```env
# Порт сервера (обычно предоставляется хостингом через переменную PORT)
PORT=5000

# MongoDB подключение
MONGODB_URI=mongodb://localhost:27017/kvantorium
# Или для MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kvantorium?retryWrites=true&w=majority

# JWT секрет (ОБЯЗАТЕЛЬНО измените на случайную строку!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# URL фронтенда (для CORS)
FRONTEND_URL=http://your-domain.com
```

### Шаг 2: Настройка переменных окружения на хостинге

Если ваш хостинг поддерживает переменные окружения (например, Pterodactyl), установите:

- `PORT` - порт для бэкенда (обычно предоставляется автоматически)
- `MONGODB_URI` - строка подключения к MongoDB
- `JWT_SECRET` - секретный ключ для JWT токенов
- `NODE_ENV=production`

### Шаг 3: Установка зависимостей на сервере

Подключитесь к серверу через SSH и выполните:

```bash
cd backend
npm install --production
```

Это установит только production зависимости (без devDependencies).

### Шаг 4: Настройка команды запуска

В панели управления хостинга настройте команду запуска:

#### Для Pterodactyl панели:

**MAIN FILE:** `backend/dist/server.js`

**Команда запуска (если нужна кастомизация):**
```bash
if [[ -f package.json ]]; then /usr/local/bin/npm install; fi
/usr/local/bin/node backend/dist/server.js
```

**Переменные окружения:**
- `NODE_ENV=production`
- `PORT` (обычно устанавливается автоматически)
- `MONGODB_URI` - ваша строка подключения к MongoDB
- `JWT_SECRET` - ваш секретный ключ

### Шаг 5: Настройка статических файлов

Бэкенд будет обслуживать:
- `/uploads` - загруженные файлы из `backend/uploads/`
- `/photo` - логотипы из `photo/`
- `/api/*` - API endpoints

Фронтенд нужно настроить отдельно или через reverse proxy (nginx).

## Настройка фронтенда на хостинге

### Вариант 1: Раздача через бэкенд (простой способ)

Добавьте в `backend/src/server.ts` перед всеми маршрутами:

```typescript
// Serve frontend static files
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }
});
```

### Вариант 2: Отдельный сервер для фронтенда

Если фронтенд раздается отдельно (через nginx или другой веб-сервер):

1. Создайте файл `frontend/.env.production`:
```env
VITE_API_URL=http://your-backend-domain.com/api
```

2. Пересоберите фронтенд:
```bash
cd frontend
npm run build
```

3. Загрузите `frontend/dist/` на веб-сервер

## Настройка MongoDB

### Вариант 1: MongoDB Atlas (рекомендуется)

1. Зарегистрируйтесь на https://www.mongodb.com/cloud/atlas
2. Создайте бесплатный кластер
3. Получите connection string
4. Добавьте IP адрес вашего хостинга в whitelist
5. Установите `MONGODB_URI` в переменных окружения

### Вариант 2: Локальный MongoDB на хостинге

Если хостинг предоставляет MongoDB, используйте локальное подключение:
```
MONGODB_URI=mongodb://localhost:27017/kvantorium
```

## Первый запуск

1. Убедитесь, что все файлы загружены
2. Проверьте, что `.env` файл создан и заполнен
3. Запустите сервер через панель управления
4. Проверьте логи на наличие ошибок

## Создание первого администратора

После запуска сервера:

1. Зарегистрируйтесь через интерфейс (первый пользователь)
2. Подключитесь к MongoDB и выполните:
```javascript
db.users.updateOne(
  {username: "ваш_логин"}, 
  {$set: {role: "admin"}}
)
```

Или используйте скрипт seed (если есть доступ к серверу):
```bash
cd backend
npm run seed
```

## Проверка работы

1. Откройте ваш домен в браузере
2. Проверьте, что фронтенд загружается
3. Попробуйте зарегистрироваться
4. Проверьте API: `http://your-domain.com/api/health`

## Решение проблем

### Сервер не запускается

1. Проверьте логи в панели управления
2. Убедитесь, что `backend/dist/server.js` существует
3. Проверьте, что все зависимости установлены (`npm install`)
4. Проверьте переменные окружения

### MongoDB не подключается

1. Проверьте `MONGODB_URI` в `.env`
2. Для Atlas: убедитесь, что IP адрес добавлен в whitelist
3. Проверьте логи подключения

### Фронтенд не загружается

1. Убедитесь, что `frontend/dist/` загружен
2. Проверьте, что `index.html` существует
3. Проверьте консоль браузера на ошибки
4. Убедитесь, что `VITE_API_URL` настроен правильно

### Ошибки с путями

На хостинге пути могут отличаться. Убедитесь, что:
- Все пути относительные или используют `__dirname`
- Папки `uploads/` и `photo/` существуют и доступны для записи

## Структура файлов на хостинге (итоговая)

```
/home/container/  (или ваша корневая директория)
├── backend/
│   ├── dist/
│   │   └── server.js
│   ├── uploads/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── .env
├── frontend/
│   └── dist/
│       ├── index.html
│       ├── assets/
│       └── ...
└── photo/
    └── ...
```

## Безопасность

⚠️ **Важно для продакшена:**

1. ✅ Измените `JWT_SECRET` на случайную строку
2. ✅ Используйте сильные пароли
3. ✅ Настройте HTTPS (SSL сертификат)
4. ✅ Ограничьте доступ к MongoDB (whitelist IP)
5. ✅ Регулярно обновляйте зависимости
6. ✅ Не загружайте `.env` файлы в публичный репозиторий

## Автоматизация (опционально)

Для автоматической загрузки можно использовать GitHub Actions или другие CI/CD инструменты, но это выходит за рамки данной инструкции.

