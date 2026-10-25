# Действия кнопок (action)

| action | Описание | Доп. поля |
|--------|----------|-----------|
| `goto` | Перейти на узел | `target: "nodeId"` |
| `url` | Открыть URL | `url: "https://..."` |
| `web_app` | Открыть Mini App | `webAppUrl: "https://..."` |
| `copy_text` | Скопировать текст | `copyText: "текст"` |
| `command` | Выполнить команду | — |
| `contact` | Запросить контакт | `requestContact: true` |
| `location` | Запросить геолокацию | `requestLocation: true` |
| `selection` | Выбор из списка (галочка/радио при multi-select) | опционально `selectionGroup` |
| `complete` | Завершить сбор данных / multi-select | `target` — куда перейти после «Готово» |
| `request_managed_bot` | Создать управляемого бота | `suggestedBotName`, `suggestedBotUsername` |
