# Поля api_response

```json
{
  "type": "api_response",
  "data": {
    "apiResponseStatusCode": 200,
    "apiResponseBody": "{\"ok\":true}",
    "apiResponseContentType": "application/json",
    "apiResponseHeaders": [],
    "autoTransitionTo": ""
  }
}
```

Завершает HTTP-запрос, инициированный `api_trigger`. Без этой ноды — ответ `200 {"ok":true}`, таймаут 30 с → `504`.

---
