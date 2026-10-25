# stop_processing — остановка middleware-цепочки

```json
{
  "type": "stop_processing",
  "data": {
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

Устанавливает `user_data[user_id]["_stop_processing"] = True`. Работает в паре с `incoming_message_trigger` и `imtStopOnFlag: true` — middleware не вызовет следующий handler для этого апдейта.
