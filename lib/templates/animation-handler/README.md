# Шаблон animation-handler

## Описание

Генерирует Python-код отправки анимации (GIF) пользователю через Telegram Bot API.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `animationUrl` | `string` | Нет | — | URL анимации (GIF) или путь `/uploads/...` |
| `nodeId` | `string` | Нет | — | ID узла |
| `indentLevel` | `string` | Нет | `'                '` | Базовый отступ генерируемого кода |

## Пример использования

```typescript
import { generateAnimationHandler } from './animation-handler.renderer';

const code = generateAnimationHandler({
  animationUrl: 'https://example.com/animation.gif',
  nodeId: 'node_1',
});
```

**Вывод:**

```python
await bot.send_animation(message.chat.id, "https://example.com/animation.gif", caption=text, parse_mode=parse_mode)
```

## Тесты

```bash
npm run test:animation-handler
```
