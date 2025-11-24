# Краткая инструкция по настройке на хостинге

## Быстрый старт

### 1. Подготовка проекта

Запустите скрипт сборки:
- **Windows:** `build-for-hosting.bat`
- **Linux/Mac:** `bash build-for-hosting.sh`

Это создаст:
- `backend/dist/` - скомпилированный бэкенд
- `frontend/dist/` - собранный фронтенд

### 2. Загрузка через SFTP

Загрузите на сервер:
- `backend/` (всю папку)
- `frontend/dist/` (папку dist)
- `photo/` (если есть логотипы)

### 3. Настройка на хостинге

#### Создайте файл `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kvantorium
JWT_SECRET=ваш-случайный-секретный-ключ-минимум-32-символа
NODE_ENV=production
FRONTEND_URL=http://ваш-домен.com
```

#### Установите зависимости:

```bash
cd backend
npm install --production
```

#### Настройте команду запуска:

**MAIN FILE:** `backend/dist/server.js`

**Команда запуска (опционально):**
```bash
if [[ -f package.json ]]; then /usr/local/bin/npm install; fi
/usr/local/bin/node backend/dist/server.js
```

### 4. Переменные окружения в панели

Если хостинг поддерживает переменные окружения (Pterodactyl и др.):

- `NODE_ENV=production`
- `PORT` (обычно устанавливается автоматически)
- `MONGODB_URI` - строка подключения к MongoDB
- `JWT_SECRET` - секретный ключ для JWT

### 5. Проверка

1. Запустите сервер через панель управления
2. Откройте ваш домен в браузере
3. Проверьте API: `http://ваш-домен.com/api/health`

## Структура на сервере

```
/home/container/
├── backend/
│   ├── dist/
│   │   └── server.js
│   ├── uploads/
│   ├── node_modules/
│   ├── package.json
│   └── .env
├── frontend/
│   └── dist/
│       ├── index.html
│       └── assets/
└── photo/
```

## MongoDB

Рекомендуется использовать **MongoDB Atlas** (бесплатный):
1. https://www.mongodb.com/cloud/atlas
2. Создайте кластер
3. Получите connection string
4. Добавьте IP хостинга в whitelist

## Создание администратора

После первого запуска:
1. Зарегистрируйтесь через интерфейс
2. В MongoDB выполните:
```javascript
db.users.updateOne(
  {username: "ваш_логин"}, 
  {$set: {role: "admin"}}
)
```

## Решение проблем

- **Сервер не запускается:** Проверьте логи, убедитесь что `dist/server.js` существует
- **MongoDB не подключается:** Проверьте `MONGODB_URI` и whitelist IP
- **Фронтенд не загружается:** Убедитесь что `frontend/dist/` загружен

Подробная инструкция: см. `DEPLOYMENT_HOSTING.md`

