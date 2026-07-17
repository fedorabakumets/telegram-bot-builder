# Медиа и хранилище (S3) — Roadmap

Документ описывает развитие работы с медиафайлами в платформе: входящие/исходящие файлы, вкладка «Файлы», сохранение на диск и в S3, связь со сценарием бота.

Связанные документы:

- [Файловое хранилище (концепция)](../futures/infrastructure/file-storage.md)
- [storage_configs](../database/storage_configs.md), [media_files](../database/media_files.md)
- [API storage-configs](../api/storage-configs.md)
- [Вкладка «Файлы»](../interface/files.md)
- [Настройки бота](../interface/bot.md)

Приоритет: 🔴 высокий → 🟡 средний → 🟢 низкий / «фантазия».

---

## Уже реализовано ✅

### Реестр хранилищ (local + S3)

- Таблица `storage_configs`, UI «Хранилища» на вкладке «Файлы»
- `StorageRegistry`, `LocalDiskBackend`, `S3Backend` — `server/storage/`
- Ручные загрузки пишут в **активное** writable-хранилище (`getActiveBackend()`)
- В `media_files` сохраняются `storageConfigId`, `storageBackend`
- Фильтр по хранилищу во «Файлах», удаление через резолв бэкенда по `storageConfigId`

### Вкладка «Файлы»

- Категории: **Все / Входящие / Исходящие / Загруженные**
- Quota, менеджер хранилищ, привязка файлов к нодам сценария (uploaded)

### Telegram без скачивания

- Прокси файлов: `GET /api/projects/:projectId/telegram-file?fileId=...&tokenId=...`
- Метаданные медиа в `bot_messages.messageData` (jsonb с `file_id`)

### SAVE_INCOMING_MEDIA (ограниченно)

- Тумблер на вкладке «Бот» (`BotSaveMediaToggle`) — только при включённой БД пользователей
- Генерируется `_save_incoming_photo_to_db` в `lib/templates/middleware/save-message-to-api.py.jinja2`
- **Только фото**, **только локальный диск**: `uploads/{projectId}/ГГГГ-ММ-ДД/photo_*.jpg`
- Запись в `media_files` **без** `storageConfigId` — обходит `StorageRegistry`
- Подсказки в UI: `client/components/editor/bot/incoming-media-storage-hint.tsx`

### Input-нода «Сохранить ответ»

- В переменную по умолчанию попадает Telegram `file_id` (объект с `value`, метаданные)
- Файлы на диск **не** скачиваются, пока не включён `SAVE_INCOMING_MEDIA`
- Подсказки: `save-answer-storage-hint.tsx`

---

## Текущие ограничения ⚠️

| Проблема | Где проявляется |
|----------|-----------------|
| Две параллельные модели: `file_id` vs скачивание на диск | input-нода vs «Сохранять входящие фото» |
| Incoming save только photo, не video/document/voice | шаблон middleware |
| Incoming save только local disk, не S3 | жёсткий путь в jinja2 |
| «Входящие» во «Файлах» неполные без скачивания | нет единого реестра из `bot_messages` |
| Путаница с `photoUrl` в переменных | генерация media/input |
| Дублирование тумблера | «Бот» + «Пользователи» (`SaveMediaToggle`) |
| На Railway диск эфемерный | риск потери `uploads/` при redeploy |

---

## Фаза 1 — «Файлы» без обязательного скачивания 🔴

**Цель:** все входящие/исходящие медиа видны во вкладке «Файлы» через `file_id` + proxy, без байтов на диске.

### Задачи

1. **Входящие из `bot_messages`**
   - SELECT с фильтром `message_type = 'user'` и непустым `messageData.photo|video|...`
   - Карточка файла: превью через `/api/.../telegram-file`, метаданные, дата, userId, tokenId

2. **Исходящие из логов отправки**
   - Аналогично для `message_type = 'bot'` и обёрток send_* в middleware

3. **UI вкладки «Входящие» / «Исходящие»**
   - Бейдж «Telegram file_id» vs «На диске» / «S3»
   - Без скачивания — источник `bot_messages`, не `media_files`

### Файлы

- `server/routes/botIntegration/handlers/botData/` — query handlers
- `client/components/editor/files/` — список, карточки, фильтры
- Дополнить [file-storage.md](../futures/infrastructure/file-storage.md) статусом реализации

### Критерий готовности

Пользователь отправил фото боту → во «Файлах → Входящие» появилась карточка с превью **без** включения `SAVE_INCOMING_MEDIA`.

---

## Фаза 2 — Сохранение incoming через StorageRegistry (local **или** S3) 🔴

**Цель:** опциональное скачивание байтов идёт в **активное хранилище**, как ручные загрузки.

### Архитектура

```
Пользователь → Telegram → Бот (getFile + download bytes)
                              ↓
                    POST /api/projects/:id/tokens/:tokenId/store-incoming-media
                              ↓
                    StorageRegistry.getActiveBackend().put(key, buffer)
                              ↓
                    INSERT media_files (+ storageConfigId, source: incoming)
```

- S3-ключи **только на сервере** — бот не получает credentials
- Бот использует существующий `API_BASE_URL` + auth проекта

### Задачи

1. **API `store-incoming-media`**
   - Body: `file_id`, `mediaType`, `fileName`, `mimeType`, bytes (multipart или base64)
   - Key: `projects/{projectId}/incoming/{date}/{filename}`
   - Ответ: `media_files.id`, `url`, `storageConfigId`

2. **Шаблон бота**
   - Заменить `open(local_path)` на HTTP-вызов API платформы
   - Удалить hardcode `uploads/{PROJECT_ID}/...`

3. **Настройка бота**
   - Переименовать: «Скачивать входящие медиа на сервер»
   - Подсказка: «В активное хранилище из раздела „Хранилища“ (локально или S3)»
   - Показывать имя активного хранилища рядом с тумблером

4. **`media_files`**
   - Заполнять `storageConfigId`, `storageBackend`, `source: 'incoming'`

### Файлы

- `server/routes/` — новый handler
- `lib/templates/middleware/save-message-to-api.py.jinja2`
- `client/components/editor/bot/incoming-media-storage-hint.tsx`
- `lib/tests/` — фазовый тест middleware

### Критерий готовности

Включил S3 как active storage → отправил фото боту → файл в бакете, во «Файлах» бейдж S3, redeploy сервера не теряет файл.

---

## Фаза 3 — Все типы медиа + политики 🟡

**Цель:** не только photo; предсказуемое поведение и квоты.

### Задачи

1. **Расширить incoming save**
   - video, audio, voice, document, animation, sticker (по приоритету: video, document, voice)

2. **Политика в настройках бота**
   - Чекбоксы типов: фото / видео / документ / голос
   - Или «все типы» одним переключателем

3. **Квота и retention**
   - Не качать, если квота проекта > 90%
   - Опционально: автоудаление incoming старше N дней (local cron → позже S3 lifecycle)

4. **Один тумблер**
   - Убрать дубли `SaveMediaToggle` на «Пользователях» → ссылка «Настроить на вкладке Бот»

### Критерий готовности

Пользователь прислал PDF → при включённой настройке файл в active storage; при выключенной — только card во «Входящие» по file_id (фаза 1).

---

## Фаза 4 — Связь «Файлы ↔ сценарий» 🟡

**Цель:** меньше ручного копирования `file_id`, единый контракт переменных.

### Задачи

1. **Единый формат переменной медиа**
   ```json
   { "type": "photo", "file_id": "AgAC...", "file_size": 12345 }
   ```
   - Убрать/не генерировать фейковый `photoUrl` в input-ноде
   - Документировать в [NODE_TYPES.md](../features/NODE_TYPES.md) и `bot-json-prompt.md`

2. **Input-нода UX**
   - Скрыть режим «Добавить» для медиа-типов
   - Мини-превью сохранённой переменной (через file-proxy)

3. **«Файлы → нода»**
   - Кнопка «Вставить в media-ноду» / «Прикрепить к выбранной ноде»
   - «Где используется» для incoming-файлов (как для uploaded)

4. **Подсказки**
   - Явная ссылка: «Смотреть во вкладке Файлы → Входящие»

---

## Фаза 5 — S3 «по-взрослому» 🟢

Идеи из продуктовой фантазии — после фаз 1–3.

### 5.1 CDN и presigned URL

- Публичная отдача тяжёлых файлов через CDN (Cloudflare R2, CloudFront, Bunny)
- «Скопировать ссылку на 24 часа» на карточке файла
- Presigned GET для админов без прокси через Node

### 5.2 Несколько хранилищ по назначению

| Хранилище | Назначение |
|-----------|------------|
| S3 prod (active) | новые incoming + uploads |
| S3 archive (read-only) | старые файлы, дешёвый tier |
| Local dev | разработка без ключей |
| S3 EU | проекты с требованием региона |

- Настройка per-project: «incoming → config X», «uploads → active»

### 5.3 Lifecycle и экономика

- S3 lifecycle: incoming > 90 дней → Glacier / delete
- Биллинг: X GB free, дальше по квоте
- Статистика во «Файлах»: incoming vs uploaded vs outgoing по объёму

### 5.4 Интеграции

- Экспорт проекта: zip presigned link на префикс `projects/{id}/`
- S3 event → webhook (новый файл → внешний пайплайн OCR/модерация)
- Дедупликация по `file_unique_id` Telegram + hash в metadata

### 5.5 Безопасность

- IAM-политики: write только `incoming/*`, read — отдельная роль
- SSE-S3 / KMS at rest
- Audit log доступа к объектам

---

## Диск vs S3 — рекомендации для деплоя

| Среда | Рекомендация |
|-------|--------------|
| Локальная разработка | **Диск** (`local-default`) |
| Railway / несколько воркеров | **S3** (или R2 / MinIO / Yandex OS) |
| Свой VPS + постоянный volume | Диск допустим при бэкапах |
| Много incoming-медиа | **S3** + lifecycle |

**Правило платформы:** prod → active storage = S3; dev → local. Incoming save (фаза 2) всегда через `StorageRegistry`, не через hardcoded `uploads/`.

---

## Приоритет первых итераций

Рекомендуемый порядок:

1. 🔴 **Фаза 1** — входящие во «Файлах» по `file_id` (максимум пользы, минимум риска)
2. 🔴 **Фаза 2** — API + S3/local через реестр (закрывает Railway и prod)
3. 🟡 **Фаза 3** — все типы медиа + квоты
4. 🟡 **Фаза 4** — UX сценария и единый формат переменных
5. 🟢 **Фаза 5** — CDN, lifecycle, монетизация

---

## Чеклист при реализации (AGENTS.md)

При изменении шаблонов incoming/save:

1. `.py.jinja2`, `.params.ts`, `.renderer.ts`
2. Фазовый тест в `lib/tests/`
3. `docs/bot-json-prompt.md`
4. `docs/features/NODE_TYPES.md` (если UI/поля)
5. Обновить этот roadmap — секция «Уже реализовано»

---

## Не дублировать

- Общая концепция вкладок и типов медиа — [file-storage.md](../futures/infrastructure/file-storage.md)
- Профили генерации бота — [bot-generation-profiles-and-toggles.md](../futures/infrastructure/bot-generation-profiles-and-toggles.md)
- Навигация «Файлы» в новом UI — [new-navigation.md](../futures/ui/new-navigation.md)

---

*Последнее обновление: 2026-07-13 — после обсуждения медиа, SAVE_INCOMING_MEDIA и S3.*
