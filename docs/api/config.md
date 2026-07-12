# config

Эндпоинтов: **1**

### `GET` /api/config

Публичная конфигурация клиента

**Авторизация:** Публичный

Отдаёт Telegram Client ID, имя бота и флаг skipAuth для Login Widget. Читает app_settings с fallback на process.env.

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Публичные параметры для фронтенда |
