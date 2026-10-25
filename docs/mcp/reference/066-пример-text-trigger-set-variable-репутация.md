# Пример: text_trigger + set_variable (репутация)

```json
{
  "id": "trig-plus-rep",
  "type": "text_trigger",
  "position": { "x": 0, "y": 400 },
  "data": {
    "textMatchType": "exact",
    "textSynonyms": ["+реп", "плюс реп"],
    "autoTransitionTo": "db-add-rep"
  }
},
{
  "id": "db-add-rep",
  "type": "psql_query",
  "position": { "x": 300, "y": 400 },
  "data": {
    "query": "UPDATE profiles SET reputation = LEAST(reputation + 10, 100) WHERE telegram_id = {reply_to_user_id} RETURNING reputation",
    "saveResultTo": "new_rep",
    "resultFormat": "scalar",
    "enableAutoTransition": true,
    "autoTransitionTo": "msg-rep-done",
    "connectionSource": "env",
    "connectionEnvVar": "MY_DB_URL"
  }
},
{
  "id": "msg-rep-done",
  "type": "message",
  "position": { "x": 600, "y": 400 },
  "data": {
    "messageText": "✅ Репутация @{reply_to_username} теперь: {new_rep}",
    "keyboardType": "none"
  }
}
```

---
