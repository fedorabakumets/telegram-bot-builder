# Шаблон: safe-edit-or-send.py.jinja2

## Описание

Генерирует Python код вспомогательной функции `safe_edit_or_send` для безопасного редактирования сообщений с fallback на отправку нового сообщения. Эта функция используется при работе с inline кнопками и автопереходами.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `hasInlineButtonsOrSpecialNodes` | `boolean` | `false` | Есть ли inline кнопки или специальные узлы |
| `hasAutoTransitions` | `boolean` | `false` | Есть ли автопереходы |

## Использование

### Базовое

```typescript
import { generateSafeEditOrSend } from './safe-edit-or-send.renderer';

const code = generateSafeEditOrSend({
  hasInlineButtonsOrSpecialNodes: true,
  hasAutoTransitions: false,
});
```

### С автопереходами

```typescript
const code = generateSafeEditOrSend({
  hasInlineButtonsOrSpecialNodes: false,
  hasAutoTransitions: true,
});
```

### Оба флага включены

```typescript
const code = generateSafeEditOrSend({
  hasInlineButtonsOrSpecialNodes: true,
  hasAutoTransitions: true,
});
```

## Примеры вывода

### Inline кнопки

**Вход:**
```typescript
{
  hasInlineButtonsOrSpecialNodes: true,
  hasAutoTransitions: false
}
```

**Выход:**
```python
# Safe helper for editing messages with fallback to new message
async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):
    """
    Безопасное редактирование сообщения с fallback на новое сообщение
    При автопереходе или при использовании ReplyKeyboard сразу отправляем новое сообщение
    """
    result = None

    # Проверяем, есть ли reply_markup и является ли он ReplyKeyboardMarkup
    reply_markup = kwargs.get("reply_markup", None)
    is_reply_keyboard = reply_markup and ("ReplyKeyboard" in str(type(reply_markup)))
    
    try:
        # При автопереходе или при использовании ReplyKeyboard сразу отправляем новое сообщение
        if is_auto_transition or is_reply_keyboard:
            if is_reply_keyboard:
                logging.info(f"💬 Reply клавиатура: отправляем новое сообщение вместо редактирования")
            elif is_auto_transition:
                logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")
            if hasattr(cbq, "message") and cbq.message:
                result = await cbq.message.answer(text, **kwargs)
            else:
                raise Exception("Cannot send message in auto-transition or with reply keyboard")
        else:
            # Пробуем редактировать сообщение (только для inline клавиатуры)
            if hasattr(cbq, "edit_text") and callable(getattr(cbq, "edit_text")) and cbq.message and cbq.message.text:
                result = await cbq.edit_text(text, **kwargs)
            elif (hasattr(cbq, "message") and cbq.message and cbq.message.text):
                result = await cbq.message.edit_text(text, **kwargs)
            else:
                # Если сообщение не содержит текста, отправляем новое
                if hasattr(cbq, "message") and cbq.message:
                    result = await cbq.message.answer(text, **kwargs)
                else:
                    raise Exception("No valid edit method found and no message to send new text")
    except Exception as e:
        # При любой ошибке отправляем новое сообщение
        if is_auto_transition:
            logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")
        elif is_reply_keyboard:
            logging.info(f"💬 Reply клавиатура: {e}, отправляем новое сообщение")
        else:
            logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")
        if hasattr(cbq, "answer"):
            result = await cbq.answer(text, **kwargs)
        elif hasattr(cbq, "message") and cbq.message:
            result = await cbq.message.answer(text, **kwargs)
        else:
            logging.error("Не удалось ни отредактировать, ни отправить новое сообщение")
            raise
    
    return result
```

### Пустой вывод (оба флага выключены)

**Вход:**
```typescript
{
  hasInlineButtonsOrSpecialNodes: false,
  hasAutoTransitions: false
}
```

**Выход:**
```
(пустая строка)
```

## Логика условий

### Генерация функции

```typescript
if (hasInlineButtonsOrSpecialNodes || hasAutoTransitions) {
  // Сгенерировать функцию safe_edit_or_send
} else {
  // Вернуть пустую строку
}
```

### Проверка типа клавиатуры

```python
is_reply_keyboard = reply_markup and ("ReplyKeyboard" in str(type(reply_markup)))

if is_reply_keyboard:
  # Отправить новое сообщение
elif is_auto_transition:
  # Отправить новое сообщение
else:
  # Попробовать редактировать
```

### Fallback логика

```python
try:
  # Попробовать редактировать
except Exception as e:
  # Отправить новое сообщение
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./safe-edit-or-send.params` — типы параметров
- `./safe-edit-or-send.schema` — Zod схема

## См. также

- [`message.py.jinja2`](../message/message.md) — шаблон сообщения
- [`keyboard.py.jinja2`](../keyboard/keyboard.md) — шаблон клавиатуры
- [`main.py.jinja2`](../main/main.md) — шаблон функции main
