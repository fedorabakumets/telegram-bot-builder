# support

Эндпоинтов: **4**

### `GET` /api/support/attachments/{id}

Картинка своего диалога

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Отдаёт файл только автору диалога. Тип проверен при загрузке: png, jpeg, webp или gif.

```bash
curl -s http://localhost:5000/api/support/attachments/1 -b cookies.txt -o screen.png
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | — | `"1"` |
| `connect.sid` | cookie | нет | — | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Картинка. Content-Type — сохранённый MIME, Content-Disposition: inline |
| 401 | Нет сессии |
| 404 | Нет файла или он из чужого диалога |

### `POST` /api/support/messages

Написать в поддержку

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Создаёт диалог при первом сообщении, увеличивает непрочитанное у администратора и переоткрывает закрытый чат. Поля `text` и `files` (картинки). Пустая отправка без текста и без файлов — 400. `context` — JSON-строка.

```bash
curl -s -X POST http://localhost:5000/api/support/messages -b cookies.txt -F text='Не сохраняется сценарий' -F files=@screen.png
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | — | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Сообщение сохранено |
| 400 | Пустое сообщение, файл не картинка, больше 8 МБ или текст длиннее 4000 |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка базы |

#### Пример ответа `201`

```json
{
  "id": 1,
  "sender": "user",
  "text": "Не сохраняется сценарий",
  "context": {
    "projectId": 294,
    "path": "/editor/294",
    "userAgent": "Mozilla/5.0"
  },
  "source": "web",
  "createdAt": "2026-09-30T11:10:20.787Z",
  "attachments": []
}
```

### `POST` /api/support/read

Отметить ответы прочитанными

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Обнуляет `unreadByUser` своего диалога. Если диалога ещё нет, отвечает `{ ok: true }` без ошибки.

```bash
curl -s -X POST http://localhost:5000/api/support/read -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | — | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Счётчик обнулён |
| 401 | Нет session cookie и Bearer PAT |

#### Пример ответа `200`

```json
{
  "ok": true
}
```

### `GET` /api/support/thread

Свой диалог поддержки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Диалог текущего пользователя и сообщения. `thread` равен `null`, пока пользователь ни разу не писал. Auth: cookie `connect.sid` или Bearer PAT, виден только свой чат. UI: кнопка чата в шапке.

```bash
curl -s http://localhost:5000/api/support/thread -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | — | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Диалог и сообщения |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка базы |

#### Пример ответа `200`

```json
{
  "thread": {
    "id": 1,
    "status": "open",
    "unreadByAdmin": 0,
    "unreadByUser": 0,
    "lastMessageAt": "2026-09-30T11:11:04.565Z"
  },
  "messages": [
    {
      "id": 1,
      "sender": "user",
      "text": "Не сохраняется сценарий",
      "context": {
        "projectId": 294,
        "path": "/editor/294",
        "userAgent": "Mozilla/5.0"
      },
      "source": "web",
      "createdAt": "2026-09-30T11:10:20.787Z",
      "attachments": []
    },
    {
      "id": 2,
      "sender": "admin",
      "text": "Проверьте, что проект открыт, и повторите сохранение.",
      "context": null,
      "source": "web",
      "createdAt": "2026-09-30T11:11:04.565Z",
      "attachments": []
    }
  ]
}
```
