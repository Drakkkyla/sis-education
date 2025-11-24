# Быстрая шпаргалка по развертыванию

## 1. Сборка проекта

```bash
# Windows
build-for-hosting.bat

# Linux/Mac
bash build-for-hosting.sh
```

## 2. Загрузка через SFTP

Загрузите:
- ✅ `backend/` (всю папку)
- ✅ `frontend/dist/` (папку dist)
- ✅ `photo/` (если есть)

## 3. Настройка на сервере

### Создайте `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kvantorium
JWT_SECRET=случайная-строка-минимум-32-символа
NODE_ENV=production
FRONTEND_URL=http://ваш-домен.com
```

### Установите зависимости:

```bash
cd backend
npm install --production
```

## 4. Настройка панели хостинга

**MAIN FILE:** `backend/dist/server.js`

**Переменные окружения:**
- `NODE_ENV=production`
- `MONGODB_URI=...`
- `JWT_SECRET=...`

## 5. Запуск

Запустите сервер через панель управления.

## 6. Создание администратора

1. Зарегистрируйтесь через интерфейс
2. В MongoDB:
```javascript
db.users.updateOne({username: "логин"}, {$set: {role: "admin"}})
```

## Структура на сервере

```
/home/container/
├── backend/
│   ├── dist/server.js
│   ├── uploads/
│   ├── node_modules/
│   └── .env
├── frontend/dist/
└── photo/
```

---

📖 **Подробная инструкция:** `DEPLOYMENT_HOSTING.md`

