# 📦 Telegram Bot Builder v1.5.0

**Дата выпуска:** 23 февраля 2026 г.

**Сравнение версий:** [v1.4.4...v1.5.0](https://github.com/fedorabakumets/telegram-bot-builder/compare/v1.4.4...v1.5.0)

---

## 🎯 Основные изменения

### 🐳 Docker-конфигурация для развёртывания

Добавлена полная поддержка Docker для удобного развёртывания проекта у клиентов.

#### Новые файлы:

- **`Dockerfile`** — образ приложения с Node.js
- **`docker-compose.yml`** — оркестрация контейнеров (приложение + PostgreSQL)
- **`.dockerignore`** — исключение лишних файлов из образа

#### Возможности:

- ✅ Быстрое развёртывание одной командой
- ✅ Изолированное окружение
- ✅ PostgreSQL в контейнере
- ✅ Настройки для production

#### Использование:

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down
```

---

### 📬 Рассылка по личным сообщениям

Добавлена система массовой рассылки сообщений пользователям в личные сообщения.

#### Возможности:

- **Broadcast-узлы** — специальный тип узла для рассылки
- **База данных User IDs** — хранение и управление ID пользователей
- **Сохранение ID** — автоматический сбор ID при взаимодействии
- **Экспорт/импорт ID** — работа с CSV файлами
- **Статистика рассылки** — отслеживание результатов

#### Компоненты:

- **`Broadcast/generateBroadcastHandler.ts`** — генерация обработчика рассылки (Bot API)
- **`Broadcast/generateBroadcastClientHandler.ts`** — генерация обработчика (Client API)
- **`Broadcast/generateDatabaseVariables.ts`** — генерация переменных БД
- **`utils/findUploadsPath.ts`** — универсальный поиск пути к uploads

---

### 🗄️ База данных User IDs

Новая система хранения и управления ID пользователей для рассылок.

#### Функционал:

- ✅ Сохранение ID при взаимодействии с ботом
- ✅ Экспорт в CSV (столбиком, только ID)
- ✅ Импорт из CSV
- ✅ Переключатель сохранения ID в настройках проекта
- ✅ Статистика базы пользователей

#### Миграции БД:

- **`0003_add_user_ids_table.sql`** — таблица `user_ids`
- **`0004_add_user_ids_unique_constraint.sql`** — уникальность user_id

---

### 🔧 Рефакторинг

Улучшена структура кода для лучшей поддерживаемости.

#### Изменения:

- Файлы Broadcast перемещены из `generate/` в `Broadcast/`
- `utils/findUploadsPath.ts` перемещён в корень `utils/`
- Обновлены импорты в зависимых файлах

---

## 📊 Статистика изменений

| Категория | Файлов | Строк добавлено | Строк удалено |
|-----------|--------|-----------------|---------------|
| Docker | 3 | 202 | 26 |
| Рассылка (Broadcast) | 4 | 153 | 0 |
| База данных User IDs | 6 | 200+ | 0 |
| Рефакторинг | 9 | 30 | 32 |
| Документация | 1 | 153 | 0 |
| **Всего** | **23** | **738+** | **58** |

---

## 🔧 Технические детали

### Docker-конфигурация

```
├── Dockerfile              # Образ Node.js приложения
├── docker-compose.yml      # Оркестрация (app + postgres)
├── .dockerignore          # Исключения для образа
└── docs/CLIENT-README.md  # Документация для клиентов
```

### Модули рассылки

```
client/lib/Broadcast/
├── generateBroadcastHandler.ts       # Bot API handler
├── generateBroadcastClientHandler.ts # Client API handler
└── generateDatabaseVariables.ts      # Переменные БД

client/lib/utils/
└── findUploadsPath.ts  # Универсальный путь к uploads
```

### Миграции БД

```sql
-- Таблица user_ids
CREATE TABLE user_ids (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Установка

### Через Docker (рекомендуется):

```bash
# Клонируйте репозиторий
git clone https://github.com/fedorabakumets/telegram-bot-builder.git

# Запустите через Docker Compose
docker-compose up -d

# Приложение доступно на http://localhost:5000
```

### Локальная установка:

```bash
# Обновите проект
git pull origin main

# Установите зависимости
cd client
npm install

# Примените миграции БД
npm run db:migrate

# Запустите проект
npm run build && npm run start
```

---

## ⚠️ Важные замечания

### Docker

- **Порты:** Приложение доступно на порту 5000
- **База данных:** PostgreSQL на порту 5432
- **Тома:** Данные БД сохраняются в volume `postgres_data`

### Рассылка

- **Спам:** Не рассылайте спам, уважайте пользователей
- **Согласие:** Получайте согласие на рассылку
- **Лимиты:** Telegram ограничивает массовые рассылки
- **Блокировки:** При злоупотреблении возможна блокировка

### База данных

- **Резервное копирование:** Регулярно делайте бэкапы
- **Миграции:** Применяйте миграции перед запуском

---

## 📦 Зависимости

Новые зависимости не требуются.

---

## 🔗 Ссылки

- [Исходный код релиза](https://github.com/fedorabakumets/telegram-bot-builder/tree/v1.5.0)
- [Сравнение изменений](https://github.com/fedorabakumets/telegram-bot-builder/compare/v1.4.4...v1.5.0)
- [Полный список коммитов](https://github.com/fedorabakumets/telegram-bot-builder/commits/v1.5.0)
- [Docker-документация](../CLIENT-README.md)

---

## 📋 Чек-лист обновления

- [x] Docker-конфигурация добавлена
- [x] Система рассылок реализована
- [x] База данных User IDs создана
- [x] Миграции БД применены
- [x] Рефакторинг файлов завершён
- [x] Документация обновлена

---

**Полный список изменений:** [Коммиты v1.4.4...v1.5.0](https://github.com/fedorabakumets/telegram-bot-builder/compare/v1.4.4...v1.5.0)
