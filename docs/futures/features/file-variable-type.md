<!-- @fileoverview Концепция нового типа переменной `file` для медиа-ноды в BotCraft Studio.
     Описывает проблему, идею, аналогию с n8n, механику работы, примеры и список изменений в коде. -->

# Тип переменной `file` для медиа-ноды

## 1. Проблема

Сейчас медиа-нода умеет отправлять файлы двумя способами:

| Способ | Ограничение |
|--------|-------------|
| URL (`https://...`) | Файл должен быть публично доступен в интернете |
| `FSInputFile` (`/uploads/...`) | Файл должен физически лежать на диске сервера |

Оба способа не работают для **динамически сгенерированных файлов** — тех, что создаются прямо во время выполнения flow:

- Апишник генерирует `project.json` и возвращает его в теле ответа
- Бот хочет отправить этот JSON пользователю как документ
- Некуда положить файл: нет публичного URL, нет пути на диске

Единственный обходной путь сейчас — сохранить файл на диск вручную и передать путь. Это неудобно, требует дополнительной логики и не вписывается в концепцию flow-редактора.

---

## 2. Идея

Добавить новый тип переменной — `file`. Переменная хранит файл в памяти в виде base64-строки и передаётся между нодами как обычная переменная.

### Структура переменной типа `file`

```json
{
  "type": "file",
  "data": "base64-encoded-content...",
  "mimeType": "application/json",
  "fileName": "project.json"
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `type` | `"file"` | Маркер типа — отличает от строк и объектов |
| `data` | `string` | Содержимое файла в кодировке base64 |
| `mimeType` | `string` | MIME-тип: `application/json`, `text/csv`, `application/pdf` и т.д. |
| `fileName` | `string` | Имя файла при отправке пользователю |

Переменная сохраняется в `user_vars` как обычный объект и подставляется в медиа-ноду через `{имя_переменной}`.

---

## 3. Аналогия с n8n

В n8n каждый item в потоке данных может содержать поле `binary`:

```json
{
  "json": { "name": "project.json" },
  "binary": {
    "data": {
      "data": "eyJ2ZXJzaW9uIjoyLCAi...",
      "mimeType": "application/json",
      "fileName": "project.json"
    }
  }
}
```

Ноды типа «Send Email» или «Telegram» умеют читать это поле и прикреплять файл без сохранения на диск. Файл живёт только в памяти в рамках одного выполнения.

BotCraft реализует ту же идею, но через систему переменных пользователя (`user_vars`). Апишник кладёт объект типа `file` в переменную, медиа-нода его читает и отправляет через `BufferedInputFile` (aiogram 3.x) — без диска, без публичного URL.

---

## 4. Как это работает

```
HTTP-нода (GET /api/bot/projects/:id/export)
    │
    │  httpRequestResponseVariable: "export_file"
    ▼
user_vars["export_file"] = {
    "type": "file",
    "data": "eyJ2ZXJzaW9uIjoy...",
    "mimeType": "application/json",
    "fileName": "project.json"
}
    │
    ▼
Медиа-нода (attachedMedia: ["{export_file}"])
    │
    │  Читает переменную, декодирует base64
    │  Создаёт BufferedInputFile(bytes, filename)
    ▼
Telegram API → файл пользователю
```

Медиа-нода уже умеет читать переменные через `{имя_переменной}` — нужно только добавить ветку для `type == "file"`.

---

## 5. Пример flow

### Flow для экспорта project.json

```json
{
  "version": 2,
  "activeSheetId": "sheet1",
  "sheets": [{
    "id": "sheet1",
    "name": "Экспорт",
    "nodes": [
      {
        "id": "cmd-export",
        "type": "command_trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "command": "/export",
          "description": "Экспортировать проект",
          "showInMenu": true,
          "autoTransitionTo": "http-export"
        }
      },
      {
        "id": "http-export",
        "type": "http_request",
        "position": { "x": 300, "y": 0 },
        "data": {
          "httpRequestUrl": "https://botcraft.app/api/bot/projects/{project_id}/export",
          "httpRequestMethod": "GET",
          "httpRequestHeaders": "{\"Authorization\": \"Bearer {api_token}\"}",
          "httpRequestResponseVariable": "export_file",
          "autoTransitionTo": "media-send"
        }
      },
      {
        "id": "media-send",
        "type": "document",
        "position": { "x": 600, "y": 0 },
        "data": {
          "attachedMedia": ["{export_file}"],
          "mediaCaption": "Ваш project.json готов"
        }
      }
    ]
  }]
}
```

### Ответ апишника `GET /api/bot/projects/:id/export`

```typescript
// Апишник возвращает объект типа file — не бинарный поток, а JSON
res.json({
  type: "file",
  data: Buffer.from(JSON.stringify(projectData)).toString("base64"),
  mimeType: "application/json",
  fileName: `project-${projectId}.json`,
});
```

### Обработка в медиа-ноде (Python, aiogram 3.x)

```python
# Фрагмент шаблона media-node.py.jinja2 — ветка для type == "file"
if isinstance(_media_value, dict) and _media_value.get("type") == "file":
    import base64
    from aiogram.types import BufferedInputFile

    _file_bytes = base64.b64decode(_media_value["data"])
    _file_name  = _media_value.get("fileName", "file")
    _mime       = _media_value.get("mimeType", "application/octet-stream")
    _buf_file   = BufferedInputFile(_file_bytes, filename=_file_name)

    await callback_query.message.answer_document(_buf_file)
```

---

## 6. Что нужно изменить

### 6.1 `lib/templates/media-node/media-node.py.jinja2`

В блоке обработки переменной `{имя_переменной}` добавить ветку перед проверкой `_resolved_media_type`:

```python
# Добавить после: if isinstance(_media_value, dict):
if _media_value.get("type") == "file":
    import base64
    from aiogram.types import BufferedInputFile
    _file_bytes = base64.b64decode(_media_value["data"])
    _buf_file   = BufferedInputFile(_file_bytes, filename=_media_value.get("fileName", "file"))
    await callback_query.message.answer_document(_buf_file)
    # Пропустить стандартную логику resolve
    _has_resolved_media = False  # предотвратить повторную отправку
```

Аналогичную ветку добавить в `_send_media_to_{{ nodeId|safe_name }}` для chat_id получателей.

### 6.2 Новый эндпоинт `GET /api/bot/projects/:id/export`

```typescript
/**
 * Экспортирует project.json проекта в виде переменной типа file
 * @param req - Express Request с params.id
 * @param res - Express Response
 * @returns Объект { type, data, mimeType, fileName } для подстановки в user_vars
 */
router.get("/api/bot/projects/:id/export", requireAuth, async (req, res) => {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, Number(req.params.id)),
  });

  if (!project) return res.status(404).json({ error: "Проект не найден" });

  const projectData = await buildProjectExport(project);
  const encoded = Buffer.from(JSON.stringify(projectData, null, 2)).toString("base64");

  res.json({
    type: "file",
    data: encoded,
    mimeType: "application/json",
    fileName: `${project.name.replace(/\s+/g, "_")}.json`,
  });
});
```

### 6.3 `docs/bot-json-prompt.md`

В раздел «Переменные» добавить описание типа `file`:

```markdown
### Переменная типа `file`

Переменная может содержать файл в виде объекта:

| Поле | Тип | Описание |
|------|-----|----------|
| `type` | `"file"` | Маркер типа переменной |
| `data` | `string` | Содержимое файла в base64 |
| `mimeType` | `string` | MIME-тип файла |
| `fileName` | `string` | Имя файла при отправке |

Используется в медиа-ноде через `{имя_переменной}`.
HTTP-нода автоматически сохраняет ответ апишника в переменную через `httpRequestResponseVariable`.
```

---

## 7. Другие применения

| Сценарий | mimeType | fileName |
|----------|----------|----------|
| Экспорт project.json | `application/json` | `project.json` |
| CSV со списком пользователей | `text/csv` | `users.csv` |
| PDF-отчёт по статистике | `application/pdf` | `report.pdf` |
| Сгенерированный Python-код бота | `text/x-python` | `bot.py` |
| ZIP-архив проекта | `application/zip` | `project.zip` |
| Изображение из внешнего API | `image/png` | `qrcode.png` |

Все эти случаи покрываются одной реализацией — апишник возвращает объект `{ type: "file", data, mimeType, fileName }`, медиа-нода отправляет через `BufferedInputFile`. Никакого диска, никаких публичных URL.
