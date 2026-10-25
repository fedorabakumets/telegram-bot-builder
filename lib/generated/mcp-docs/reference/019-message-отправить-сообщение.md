# message — отправить сообщение

```json
{
  "type": "message",
  "data": {
    "messageText": "Текст сообщения, поддерживает {переменные}",
    "markdown": false,
    "keyboardType": "none",
    "buttons": [],
    "conditionalMessages": [],
    "enableConditionalMessages": false,
    "adminOnly": false,
    "requiresAuth": false,
    "isPrivateOnly": false,
    "enableStatistics": true
  }
}
```

> ⛔ **Запрещено** использовать `collectUserInput`, `inputVariable`, `enableTextInput`, `enablePhotoInput` и другие поля сбора ввода в message-ноде. Для сбора ввода используйте **только** отдельную ноду `input`.

#### Форматирование текста (formatMode)

| Значение | Описание |
|----------|----------|
| `"none"` | Без форматирования (по умолчанию) |
| `"html"` | HTML-разметка (`<b>`, `<i>`, `<code>`, `<a href="">`) |
| `"markdown"` | Markdown (`*bold*`, `_italic_`, `` `code` ``) |

**Важно при `formatMode: "html"`:**
- Символы `<`, `>`, `&` в тексте нужно экранировать: `&lt;`, `&gt;`, `&amp;`
- Нельзя использовать `<` для сравнения (например "реп < 50") — Telegram парсит как тег
- Допустимые теги: `<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a href="...">`, `<tg-spoiler>`
- Символ `•` (bullet) безопасен, но не используйте его рядом с `<` или `>`
- **HTML mention пользователя**: `<a href='tg://user?id={user_id}'>{user.nickname}</a>` — если в тексте используется HTML mention, обязательно ставить `"formatMode": "html"`

> ℹ️ **Hot-reload и formatMode:** в режиме горячей перезагрузки контента (генерация с `projectId`/contentCache) статичный `formatMode` ноды учитывается напрямую: `markdown` → `parse_mode="Markdown"`, `html` → `parse_mode="HTML"`. При `formatMode: "none"` (или отсутствии поля) работает автодетект — `parse_mode="HTML"` подставляется, если в тексте найдены HTML-теги (`<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a `, `<tg-spoiler>`), иначе `parse_mode=None`.
