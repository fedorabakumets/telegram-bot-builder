# Файловое хранилище (File Storage)

## Концепция

Централизованное управление всеми медиафайлами проекта — входящими, исходящими и загруженными вручную. Основной принцип: **не скачивать файлы с Telegram**, а хранить `file_id` и проксировать превью через Bot API.

## Вкладки

### 1. Входящие (Incoming)

Файлы, полученные ботом от пользователей в диалогах.

- Источник: webhook handler при получении сообщения с медиа
- Хранение: только `file_id` + метаданные в БД
- Превью: проксирование через `/api/telegram/file-proxy/:tokenId/:fileId`
- Без скачки на сервер

### 2. Исходящие (Outgoing)

Файлы, отправленные ботом пользователям в диалогах.

- Источник: после успешной отправки сообщения с медиа (response от Telegram содержит file_id)
- Хранение: только `file_id` + метаданные в БД
- Превью: проксирование
- Без скачки на сервер

### 3. Загруженные (Uploaded)

Файлы, загруженные пользователем вручную через интерфейс.

- Три подтипа:
  - **file_id** — пользователь вводит Telegram file_id вручную (привязан к конкретному боту)
  - **По ссылке** — URL на внешний ресурс (скачивается на сервер)
  - **Напрямую** — загрузка файла с устройства (хранится на сервере в `/uploads/`)

## Типы медиа

Каждый файл имеет тип:

| Тип | Описание |
|-----|----------|
| `photo` | Фотография |
| `video` | Видео |
| `video_group` | Медиагруппа (несколько фото/видео) |
| `audio` | Аудиофайл |
| `voice` | Голосовое сообщение |
| `document` | Документ |
| `sticker` | Стикер |
| `animation` | GIF/анимация |

## Схема БД

```sql
CREATE TABLE project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  
  -- Источник файла
  source TEXT NOT NULL CHECK (source IN ('incoming', 'outgoing', 'uploaded')),
  
  -- Тип медиа
  media_type TEXT NOT NULL,
  
  -- Telegram file_id (основной идентификатор для Telegram-файлов)
  file_id TEXT,
  
  -- file_unique_id (для идентификации одного файла между ботами)
  file_unique_id TEXT,
  
  -- К какому боту/токену привязан file_id
  token_id INTEGER REFERENCES bot_tokens(id),
  
  -- Для загруженных файлов — локальный путь или URL
  local_path TEXT,
  external_url TEXT,
  
  -- Метаданные
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  
  -- Связь с медиагруппой
  media_group_id TEXT,
  
  -- Связь с диалогом (для входящих/исходящих)
  dialog_user_id TEXT,
  message_id INTEGER,
  
  -- Прикреплён к ноде
  attached_to_node_id TEXT,
  
  -- Метки
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_source ON project_files(project_id, source);
CREATE INDEX idx_project_files_media_type ON project_files(project_id, media_type);
CREATE INDEX idx_project_files_file_unique_id ON project_files(file_unique_id);
CREATE INDEX idx_project_files_media_group ON project_files(media_group_id);
```

## API Endpoints

```
GET    /api/projects/:id/files?source=incoming&type=photo&page=1&limit=50
POST   /api/projects/:id/files                    — создать запись (загрузка)
DELETE /api/projects/:id/files/:fileId             — удалить
PATCH  /api/projects/:id/files/:fileId             — обновить метаданные
POST   /api/projects/:id/files/:fileId/attach      — прикрепить к ноде
POST   /api/projects/:id/files/bulk-attach         — прикрепить несколько к ноде
GET    /api/telegram/file-proxy/:tokenId/:fileId   — проксирование превью (уже есть)
```

## UI: Колонки таблицы

| Колонка | Описание |
|---------|----------|
| ☐ | Чекбокс для множественного выбора |
| Превью | Миниатюра (проксирование) |
| Название | Имя файла или автоопределение |
| Тип | photo / video / audio / document / ... |
| file_id | Telegram file_id (копируемый) |
| Размер | В КБ/МБ с цветным индикатором |
| Дата | Дата добавления |
| Действия | Прикрепить / Удалить |

## Workflow: Прикрепление к ноде

1. Пользователь в панели свойств ноды нажимает "Прикрепить медиафайл"
2. Открывается вкладка "Файлы" (или модальное окно)
3. Пользователь видит 3 вкладки: Входящие / Исходящие / Загруженные
4. Выбирает файлы галочками
5. Нажимает "Прикрепить выбранные"
6. Файлы добавляются в `attachedMedia` ноды (как file_id JSON-запись или URL)

## Автоматическое заполнение

### Входящие
При получении сообщения с медиа в webhook handler:
```ts
// В обработчике входящего сообщения
if (message.photo || message.video || message.document || ...) {
  await db.insert(projectFiles).values({
    projectId,
    source: 'incoming',
    mediaType: detectMediaType(message),
    fileId: extractFileId(message),
    fileUniqueId: extractFileUniqueId(message),
    tokenId: currentTokenId,
    fileName: message.document?.file_name,
    fileSize: extractFileSize(message),
    dialogUserId: message.from.id.toString(),
    messageId: message.message_id,
  });
}
```

### Исходящие
После успешной отправки сообщения с медиа:
```ts
// После sendPhoto/sendVideo/sendDocument
const result = await bot.sendPhoto(chatId, fileIdOrUrl);
if (result.photo) {
  await db.insert(projectFiles).values({
    projectId,
    source: 'outgoing',
    mediaType: 'photo',
    fileId: result.photo[result.photo.length - 1].file_id,
    fileUniqueId: result.photo[result.photo.length - 1].file_unique_id,
    tokenId: currentTokenId,
    dialogUserId: chatId.toString(),
    messageId: result.message_id,
  });
}
```

## Важные нюансы

1. **file_id привязан к токену** — один и тот же физический файл имеет разные file_id для разных ботов. При прикреплении к ноде нужно учитывать, какой бот будет отправлять.

2. **file_unique_id** — одинаков для одного файла между ботами. Используется для дедупликации.

3. **Пагинация обязательна** — входящие файлы могут накапливаться тысячами.

4. **media_group** — несколько файлов с одним `media_group_id` образуют группу. В UI показываются как одна запись с раскрытием.

5. **Время жизни** — Telegram гарантирует file_id навсегда для одного бота. Файлы не исчезают.

6. **Проксирование** — для превью используется `getFile` → скачивание по временной ссылке → отдача клиенту. Кэшировать на 1 час.

## Этапы реализации

1. **Схема БД** — миграция, создание таблицы `project_files`
2. **API** — CRUD endpoints + проксирование
3. **Автозаполнение** — хуки в webhook handler и send-функциях
4. **UI: Вкладка "Файлы"** — таблица с фильтрами, пагинацией, поиском
5. **UI: Прикрепление** — интеграция с панелью свойств ноды (модальное окно выбора)
6. **Оптимизация** — кэширование превью, lazy loading, виртуализация списка
