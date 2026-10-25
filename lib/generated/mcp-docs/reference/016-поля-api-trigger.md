# Поля api_trigger

```json
{
  "type": "api_trigger",
  "data": {
    "apiMethod": "POST",
    "apiPath": "/payment",
    "apiSecretToken": "сгенерированный-secret",
    "apiSaveBodyTo": "body",
    "apiSaveQueryTo": "",
    "apiSaveHeadersTo": "",
    "apiParseJson": true,
    "autoTransitionTo": "nodeId"
  }
}
```

- Публичный URL: `{API_BASE_URL}/api/hooks/{projectId}{apiPath}`
- Secret только в заголовке `X-Api-Secret` или `Authorization: Bearer`
- Уникальность пары `(apiMethod, apiPath)` в проекте
- Запрещены пути с `/api/`, `/webhook`, `..`
