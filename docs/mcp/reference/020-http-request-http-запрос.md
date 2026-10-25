# http_request — HTTP запрос

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/data?id={user_id}",
    "httpRequestMethod": "GET",
    "httpRequestHeaders": "{\"Authorization\": \"Bearer {token}\"}",
    "httpRequestBody": "{\"key\": \"{value}\"}",
    "httpRequestTimeout": 30,
    "httpRequestResponseVariable": "response_var",
    "autoTransitionTo": "next_node_id"
  }
}
```

Переменные в URL, заголовках, теле и Auth задаются через `{имя}`: переменные сценария + **env бота** (вкладка Бот → env). Сценарий перекрывает одноимённые ключи env.
Переменные сервера панели боту не видны — кроме перечисленных администратором в `WORKER_ENV_PASSTHROUGH`; не используй `{SESSION_SECRET}`, `{DATABASE_URL}` и т.п. в http_request.

#### Bearer из env бота

Секрет хранится в env токена (`API_TOKEN=...`), в ноде — только плейсхолдер:

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/me",
    "httpRequestMethod": "GET",
    "httpRequestAuthType": "bearer",
    "httpRequestAuthBearerToken": "{API_TOKEN}",
    "httpRequestResponseVariable": "me_response",
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

#### Получение файла (base64)

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/export/project.json",
    "httpRequestMethod": "GET",
    "httpRequestResponseFormat": "file",
    "httpRequestResponseVariable": "export_file",
    "autoTransitionTo": "send-file-node"
  }
}
```

При `httpRequestResponseFormat: "file"` ответ сохраняется как объект:
```json
{
  "type": "file",
  "data": "base64...",
  "mimeType": "application/json",
  "fileName": "project.json"
}
```

Этот объект можно передать в медиа-ноду через `{export_file}` для отправки файла пользователю.
