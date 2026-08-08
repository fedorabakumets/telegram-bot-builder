# config

Эндпоинтов: **1**

### `GET` /api/config

Публичная конфигурация клиента

**Авторизация:** Публичный

Публичный (**без сессии**): параметры для Login Widget / экрана входа.

- `telegramClientId` — Client ID виджета (`0` если не задан)
- `telegramBotUsername` — username бота без `@`
- `skipAuth` — `true` при режиме **dev-login** (форма ID без proof); `false` при `telegram_widget`

Источник: `app_settings` → fallback `process.env`.

**Клиент:** `useAppConfig` → `AuthScreen` / `useTelegramLogin`.

```bash
curl -s http://localhost:5000/api/config
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Публичные параметры для фронтенда |

#### Пример ответа `200`

```json
{
  "telegramClientId": 12345678,
  "telegramBotUsername": "my_bot",
  "skipAuth": false
}
```
