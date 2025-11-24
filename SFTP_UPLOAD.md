# Инструкция по загрузке через SFTP

## Использование FileZilla (рекомендуется для Windows)

### 1. Скачайте и установите FileZilla
https://filezilla-project.org/download.php?type=client

### 2. Подключение к серверу

1. Откройте FileZilla
2. Введите данные подключения:
   - **Хост:** адрес вашего сервера (например, `your-server.com` или IP)
   - **Пользователь:** ваш логин на хостинге
   - **Пароль:** ваш пароль
   - **Порт:** обычно `22` (SFTP)
3. Нажмите "Быстрое подключение"

### 3. Загрузка файлов

**Локальная сторона (слева):** Найдите папку вашего проекта  
**Удаленная сторона (справа):** Перейдите в корневую директорию сервера (обычно `/home/container/`)

**Загрузите следующие папки:**

1. **backend/** - перетащите всю папку `backend` на сервер
2. **frontend/dist/** - перетащите только папку `dist` из `frontend` в `/home/container/frontend/`
3. **photo/** - перетащите папку `photo` (если есть)

**Важно:** Сохраняйте структуру папок!

### 4. Проверка структуры на сервере

После загрузки структура должна быть такой:

```
/home/container/
├── backend/
│   ├── dist/
│   ├── uploads/
│   ├── node_modules/ (или установите на сервере)
│   ├── package.json
│   └── .env (создайте вручную)
├── frontend/
│   └── dist/
│       ├── index.html
│       └── assets/
└── photo/
```

## Использование WinSCP (альтернатива для Windows)

### 1. Скачайте WinSCP
https://winscp.net/eng/download.php

### 2. Подключение

1. Откройте WinSCP
2. Создайте новое подключение:
   - **Протокол:** SFTP
   - **Имя хоста:** адрес сервера
   - **Порт:** 22
   - **Имя пользователя:** ваш логин
   - **Пароль:** ваш пароль
3. Нажмите "Войти"

### 3. Загрузка

Перетащите папки из левой панели (локальный компьютер) в правую (сервер).

## Использование командной строки (scp)

### Windows (PowerShell или CMD)

```powershell
# Загрузка бэкенда
scp -r backend\* username@your-server.com:/home/container/backend/

# Загрузка фронтенда
scp -r frontend\dist\* username@your-server.com:/home/container/frontend/dist/

# Загрузка фото
scp -r photo\* username@your-server.com:/home/container/photo/
```

### Linux/Mac

```bash
# Загрузка бэкенда
scp -r backend/* username@your-server.com:/home/container/backend/

# Загрузка фронтенда
scp -r frontend/dist/* username@your-server.com:/home/container/frontend/dist/

# Загрузка фото
scp -r photo/* username@your-server.com:/home/container/photo/
```

## Создание .env файла на сервере

После загрузки файлов создайте файл `backend/.env` на сервере:

### Через FileZilla/WinSCP:

1. Найдите папку `backend/` на сервере
2. Создайте новый файл `env` (без точки в начале)
3. Переименуйте его в `.env` (с точкой)
4. Откройте и вставьте содержимое:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kvantorium
JWT_SECRET=ваш-случайный-секретный-ключ-минимум-32-символа
NODE_ENV=production
FRONTEND_URL=http://ваш-домен.com
```

### Через SSH:

```bash
cd backend
nano .env
# Вставьте содержимое, сохраните (Ctrl+O, Enter, Ctrl+X)
```

## Проверка загрузки

После загрузки проверьте через SSH:

```bash
# Проверка структуры
ls -la backend/
ls -la frontend/dist/
ls -la photo/

# Проверка наличия главного файла
ls -la backend/dist/server.js

# Проверка .env файла
cat backend/.env
```

## Решение проблем

### Файлы не загружаются

- Проверьте права доступа на сервере
- Убедитесь, что используете правильный протокол (SFTP, не FTP)
- Проверьте логин и пароль

### Не видно скрытые файлы (.env)

В FileZilla: Сервер → Показать скрытые файлы  
В WinSCP: Настройки → Панели → Показать скрытые файлы

### Ошибки прав доступа

```bash
# На сервере через SSH
chmod -R 755 backend/
chmod -R 755 frontend/
chmod 644 backend/.env
```

## Полезные советы

1. ✅ Сначала загрузите структуру папок, затем файлы
2. ✅ Используйте бинарный режим для загрузки (FileZilla делает это автоматически)
3. ✅ Проверяйте размер загруженных файлов
4. ✅ Не загружайте `node_modules/` - лучше установить на сервере через `npm install`
5. ✅ Не загружайте `.git/` папку

