# Настройка GitHub репозитория

## Шаг 1: Создание репозитория на GitHub

1. Перейдите на https://github.com
2. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
3. Заполните:
   - **Repository name:** `sis-education` (или другое имя)
   - **Description:** "Система дополнительного образования Кванториум"
   - **Visibility:** Public или Private (на ваш выбор)
   - **НЕ** создавайте README, .gitignore или лицензию (у нас уже есть)
4. Нажмите **"Create repository"**

## Шаг 2: Подключение локального репозитория к GitHub

После создания репозитория GitHub покажет инструкции. Выполните команды:

### Если репозиторий пустой (рекомендуется):

```bash
# Добавьте remote (замените YOUR_USERNAME и REPO_NAME на ваши данные)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите код на GitHub
git push -u origin main
```

### Если на GitHub уже есть файлы:

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Шаг 3: Проверка

Откройте ваш репозиторий на GitHub - все файлы должны быть там!

## Дальнейшая работа

### Загрузка изменений:

```bash
git add .
git commit -m "Описание изменений"
git push
```

### Загрузка изменений с GitHub:

```bash
git pull
```

## Полезные команды

```bash
# Проверить статус
git status

# Посмотреть историю коммитов
git log

# Посмотреть подключенные remote
git remote -v

# Изменить URL remote (если нужно)
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

## ⚠️ Важно!

- **НЕ загружайте** файлы `.env` с реальными паролями и ключами
- **НЕ загружайте** `node_modules/` (они в .gitignore)
- **НЕ загружайте** `dist/` папки (они в .gitignore)
- **НЕ загружайте** загруженные файлы из `backend/uploads/` (они в .gitignore)

Все это уже настроено в `.gitignore` файле!

