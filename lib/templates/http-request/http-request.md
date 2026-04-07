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

### Аутентификация

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `authType` | none/basic/bearer/header/query | `none` | Тип аутентификации |
| `authBearerToken` | string | — | Bearer токен |
| `authBasicUsername` | string | — | Basic auth логин |
| `authBasicPassword` | string | — | Basic auth пароль |
| `authHeaderName` | string | — | Имя заголовка (header auth) |
| `authHeaderValue` | string | — | Значение заголовка (header auth) |
| `authQueryName` | string | — | Имя query параметра (query auth) |
| `authQueryValue` | string | — | Значение query параметра (query auth) |

### Дополнительные параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `queryParams` | JSON string | — | Query параметры `[{key, value}]` |
| `bodyFormat` | json/form-urlencoded/raw | `json` | Формат тела запроса |
| `responseFormat` | autodetect/json/text | `autodetect` | Формат ответа |
| `ignoreHttpErrors` | boolean | `false` | Не падать при 4xx/5xx |
| `ignoreSsl` | boolean | `false` | Игнорировать SSL сертификат |
| `followRedirects` | boolean | `true` | Следовать редиректам |

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

### Bearer аутентификация

```json
{
  "url": "https://api.example.com/me",
  "method": "GET",
  "authType": "bearer",
  "authBearerToken": "mytoken123",
  "responseVariable": "me_response"
}
```

### Basic аутентификация

```json
{
  "url": "https://api.example.com/secure",
  "method": "GET",
  "authType": "basic",
  "authBasicUsername": "admin",
  "authBasicPassword": "secret",
  "responseVariable": "secure_response"
}
```

### Query параметры

```json
{
  "url": "https://api.example.com/search",
  "method": "GET",
  "queryParams": "[{\"key\": \"q\", \"value\": \"test\"}, {\"key\": \"limit\", \"value\": \"10\"}]",
  "responseVariable": "search_response"
}
```

### Игнорировать SSL и редиректы

```json
{
  "url": "https://self-signed.example.com/api",
  "method": "GET",
  "ignoreSsl": true,
  "followRedirects": false,
  "responseVariable": "result"
}
```

## Подстановка переменных

Переменные в формате `{var_name}` подставляются в URL, заголовки, тело и query параметры из переменных пользователя.

## Обработка ошибок

При ошибке сети `_response_data` будет `None`, `_status_code` — `0`. Ошибка логируется через `logging.error`. При `ignoreHttpErrors: true` ошибки 4xx/5xx не прерывают выполнение.
