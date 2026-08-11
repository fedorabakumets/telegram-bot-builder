# templates

Эндпоинтов: **9**

### `GET` /api/templates

Список системных и публичных сценариев

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Каталог готовых сценариев ботов (`bot_templates`).

**Зачем:** вкладка «Все» на странице «Сценарии».

**Отдаёт:** массив шаблонов. Фильтр: `ownerId === null` (системные) **или** `isPublic === 1`. Личные приватные пользователя сюда **не** попадают (они только в `GET …/category/custom`).

**Нюанс:** к каждому элементу добавляется `flow_data` (= `data`) для совместимости с UI.

**Не отдаёт:** чужие приватные сценарии.

**Авторизация:** cookie или Bearer PAT (`requireApiAuth`).

**Клиент:** `useVseStsenary`.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Системные + публичные сценарии |
| 401 | Нет session cookie и Bearer PAT |
| 500 | Ошибка чтения БД |
| 503 | setupGuard / БД не готова |

#### Пример ответа `200`

```json
[
  {
    "id": 1,
    "ownerId": null,
    "name": "FAQ-бот",
    "description": "Ответы на частые вопросы",
    "data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 0,
                "y": 0
              },
              "data": {
                "messageText": "Привет!"
              }
            }
          ],
          "edges": []
        }
      ]
    },
    "flow_data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 0,
                "y": 0
              },
              "data": {
                "messageText": "Привет!"
              }
            }
          ],
          "edges": []
        }
      ]
    },
    "category": "utility",
    "tags": [
      "faq",
      "support"
    ],
    "isPublic": 1,
    "difficulty": "easy",
    "authorName": null,
    "useCount": 120,
    "rating": 0,
    "ratingCount": 0,
    "featured": 1,
    "language": "ru",
    "complexity": 2,
    "estimatedTime": 10,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-10T10:00:00.000Z"
  }
]
```

### `POST` /api/templates

Сохранить проект как сценарий

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Создаёт запись в `bot_templates` из текущего проекта.

**Зачем:** «Сохранить сценарий» в шапке; «сохранить перед удалением» в delete-project-dialog.

**Тело:** `name`, `description`, `data`, `category`, `tags`, `isPublic` (0/1), …

**Не принимает с клиента:** `featured`, rating/счётчики, `ownerId` (mass-assignment закрыт; `featured` всегда 0 на create).

`ownerId` ставится из сессии. **Клиент:** `save-template-modal`.

**Тело запроса:** `CreateTemplateRequest`

#### Пример тела запроса

```json
{
  "name": "Мой FAQ",
  "description": "Сохранено из редактора",
  "category": "custom",
  "tags": [],
  "isPublic": 0,
  "difficulty": "easy",
  "language": "ru",
  "requiresToken": 1,
  "complexity": 1,
  "estimatedTime": 5,
  "authorName": "ivan",
  "data": {
    "sheets": [
      {
        "id": "main",
        "name": "Основной",
        "nodes": [
          {
            "id": "start",
            "type": "start",
            "position": {
              "x": 0,
              "y": 0
            },
            "data": {
              "messageText": "Привет!"
            }
          }
        ],
        "edges": []
      }
    ]
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Сценарий создан |
| 400 | Ошибка Zod (createBotTemplateBodySchema) |
| 401 | Не авторизован |
| 500 | Ошибка создания |
| 503 | setupGuard / БД не готова |

### `DELETE` /api/templates/{id}

Удалить свой сценарий

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет запись `bot_templates`.

**Зачем:** кнопка удаления на вкладке «Мои».

**Права:** только свой шаблон (`ownerId === caller`). Системные → 403.

**Отдаёт:** `{ message: "Template deleted successfully" }`.

**Клиент:** `useUdalitStsenary`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_templates | `"12"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Удалён |
| 401 | Не авторизован |
| 403 | Чужой или системный |
| 404 | Не найден |
| 500 | Ошибка удаления |
| 503 | Приложение не настроено |

#### Пример ответа `200`

```json
{
  "message": "Template deleted successfully"
}
```

### `GET` /api/templates/{id}

Сценарий по ID

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Один шаблон из `bot_templates`.

**Статус:** marketplace/legacy — **текущий UI «Сценарии» не вызывает** (карточки берут данные из list/featured/category).

**Доступ (`canViewOrUseTemplate`):** системный, публичный или свой. Чужой private → **403**.

**Отдаёт:** сырой шаблон **без** алиаса `flow_data`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_templates | `"12"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Шаблон найден |
| 401 | Не авторизован |
| 403 | Чужой шаблон |
| 404 | Не найден |
| 500 | Ошибка БД |
| 503 | setupGuard / БД не готова |

### `PUT` /api/templates/{id}

Обновить сценарий

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Частичное обновление (клиентская схема без featured/счётчиков).

**Статус:** marketplace/legacy — **текущий UI не использует**.

**Права:** только свой шаблон (`ownerId === caller`). Системные и чужие → 403.
**Не принимает:** `featured`, rating/счётчики, `ownerId`.

**Тело запроса:** `UpdateTemplateRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_templates | `"12"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Обновлённый шаблон |
| 400 | Ошибка Zod |
| 401 | Не авторизован |
| 403 | Нет прав (чужой или системный) |
| 404 | Не найден |
| 500 | Ошибка обновления |
| 503 | Приложение не настроено |

### `POST` /api/templates/{id}/use

Создать проект из сценария

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Применяет шаблон: инкремент `useCount` + новый проект + private-копия в «Мои».

**Доступ (`canViewOrUseTemplate`):** системный (`ownerId=null`), публичный (`isPublic=1`) или **свой**. Чужой private → **403** (IDOR закрыт).

1. `incrementTemplateUseCount`
2. `createBotProject` с data шаблона, `ownerId` = текущий user
3. Копия: `category: custom`, `isPublic: 0`, **`ownerId` = текущий user**

**Клиент:** `useIspolzovatStsenary`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | ID записи bot_templates | `"12"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Проект + копия в коллекции |
| 401 | Не авторизован |
| 403 | Чужой приватный шаблон |
| 404 | Шаблон не найден |
| 500 | Ошибка создания проекта/копии |
| 503 | setupGuard / БД не готова |

#### Пример ответа `200`

```json
{
  "message": "Template copied to your projects and collection",
  "project": {
    "id": 266,
    "ownerId": 123456789,
    "name": "FAQ-бот",
    "description": "Ответы на частые вопросы",
    "data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 0,
                "y": 0
              },
              "data": {
                "messageText": "Привет!"
              }
            }
          ],
          "edges": []
        }
      ]
    },
    "userDatabaseEnabled": 1
  },
  "copiedTemplate": {
    "id": 88,
    "ownerId": 123456789,
    "name": "FAQ-бот",
    "description": "Ответы на частые вопросы",
    "data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 0,
                "y": 0
              },
              "data": {
                "messageText": "Привет!"
              }
            }
          ],
          "edges": []
        }
      ]
    },
    "category": "custom",
    "isPublic": 0,
    "difficulty": "easy",
    "useCount": 0,
    "rating": 0,
    "ratingCount": 0,
    "featured": 0,
    "language": "ru",
    "complexity": 2,
    "estimatedTime": 10
  }
}
```

### `GET` /api/templates/category/{category}

Сценарии по категории

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Фильтр по `category`. Особый случай **`custom`** = «Мои».

**custom:** только шаблоны текущего пользователя с `category=custom` (`getUserBotTemplates`). Query `ids` **удалён** (был IDOR).

**Прочие категории:** только `isPublic=1` или `ownerId=null`.

**Клиент:** `useMoiStsenary` → `/category/custom` (требует сессию).

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `category` | path | да | Категория: custom | business | entertainment | education | utility | game | official | community | `"custom"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив шаблонов категории |
| 401 | Не авторизован |
| 500 | Ошибка БД |
| 503 | Приложение не настроено |

### `GET` /api/templates/featured

Рекомендуемые сценарии

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Шаблоны с `featured=1`.

**Зачем:** вкладка «Рекомендуемые» на странице «Сценарии».

**Фильтр privacy:** `isPublic === 1` **или** `ownerId === null` (системные) **или** свой (`ownerId` сессии).

**Не отдаёт:** чужие приватные featured.

**Авторизация:** cookie / PAT. **Клиент:** `useRekomenduemyeStsenary` (запрос при активной вкладке featured).

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Рекомендуемые после privacy-фильтра |
| 401 | Не авторизован |
| 500 | Ошибка БД |
| 503 | Приложение не настроено |

#### Пример ответа `200`

```json
[
  {
    "id": 1,
    "ownerId": null,
    "name": "FAQ-бот",
    "description": "Ответы на частые вопросы",
    "data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 0,
                "y": 0
              },
              "data": {
                "messageText": "Привет!"
              }
            }
          ],
          "edges": []
        }
      ]
    },
    "flow_data": {
      "sheets": [
        {
          "id": "main",
          "name": "Основной",
          "nodes": [
            {
              "id": "start",
              "type": "start",
              "position": {
                "x": 0,
                "y": 0
              },
              "data": {
                "messageText": "Привет!"
              }
            }
          ],
          "edges": []
        }
      ]
    },
    "category": "utility",
    "tags": [
      "faq",
      "support"
    ],
    "isPublic": 1,
    "difficulty": "easy",
    "authorName": null,
    "useCount": 120,
    "rating": 0,
    "ratingCount": 0,
    "featured": 1,
    "language": "ru",
    "complexity": 2,
    "estimatedTime": 10,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-10T10:00:00.000Z"
  }
]
```

### `GET` /api/templates/search

Поиск сценариев

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Поиск по строке `q`.

**Статус:** marketplace/legacy — **текущий UI не вызывает** (нет поисковой строки на «Сценарии»).

**Query:** `q` обязателен (иначе 400).

**Privacy:** публичные + системные (`ownerId=null`) + свои.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `q` | query | да | Строка поиска по имени/описанию/тегам сценария | `"faq"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Найденные шаблоны |
| 400 | Нет q |
| 401 | Не авторизован |
| 500 | Ошибка поиска |
| 503 | Приложение не настроено |
