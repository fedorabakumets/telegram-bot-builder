# config

Эндпоинтов: **1**

### `GET` /api/config

Bootstrap экрана входа Studio

**Авторизация:** Публичный

Публичный срез настроек **для UI до логина** (сессия не нужна).

Зачем: фронт (`useAppConfig` → `AuthScreen` / Login Widget) должен знать, что показать на экране входа — Telegram Login Widget, форму **dev-login** (ввод Telegram ID без proof) или что виджет ещё не настроен. Без этого запроса экран авторизации не собрать.

Это **не** конфиг бота и не env проекта — только параметры входа в Studio.

Поля:
- `telegramClientId` — Client ID Telegram Login Widget; `0` = не задан
- `telegramBotUsername` — username бота для виджета (без `@`); пустая строка = не задан
- `skipAuth` — `true` при `auth_login_mode=dev_login` (форма ID); `false` при `telegram_widget`

Источник: `app_settings` (настраивается в `/admin/settings`), fallback на `process.env` для старых деплоев.

```bash
curl -s http://localhost:5000/api/config
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Параметры экрана входа (без секретов) |

#### Пример ответа `200`

```json
{
  "telegramClientId": 12345678,
  "telegramBotUsername": "my_bot",
  "skipAuth": false
}
```
