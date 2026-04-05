# Узел `http_request` — HTTP запрос к внешнему API

Выполняет HTTP запрос к внешнему API и сохраняет ответ в переменную пользователя. После выполнения передаёт управление следующему узлу.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `url` | string | — | URL запроса, поддерживает `{var_name}` |
| `method` | GET/POST/PUT/PATCH/DELETE | `GET` | HTTP метод |
| `headers` | JSON string | — | Заголовки запроса |
| `body` | JSON string | — | Тело запроса (POST/PUT/PATCH) |
| `timeout` | number | `30` | Таймаут в секундах |
| `responseVariable` | string | `response` | Переменная для сохранения ответа |
| `statusVariable` | string | — | Переменная для HTTP статус кода |
| `autoTransitionTo` | string | — | ID следующего узла |

## Примеры

### GET — получение погоды

```json
{
  "url": "https://api.weather.com/v1/current?city={city}",
  "method": "GET",
  "responseVariable": "weather_data"
}
```

### POST — регистрация пользователя

```json
{
  "url": "https://api.example.com/register",
  "method": "POST",
  "headers": "{\"Content-Type\": \"application/json\"}",
  "body": "{\"name\": \"{user_name}\", \"phone\": \"{phone}\"}",
  "responseVariable": "register_result",
  "statusVariable": "register_status"
}
```

## Подстановка переменных

Переменные в формате `{var_name}` подставляются в URL, заголовки и тело запроса из переменных пользователя.

## Обработка ошибок

При ошибке сети `_response_data` будет `None`, `_status_code` — `0`. Ошибка логируется через `logging.error`.
