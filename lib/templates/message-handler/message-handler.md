# Шаблон обработчиков управления сообщениями (message-handler.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для управления сообщениями в группах Telegram:
закрепление (`pin_message`), открепление (`unpin_message`) и удаление (`delete_message`).

## Параметры

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| nodeType | 'pin_message' \| 'unpin_message' \| 'delete_message' | Тип действия | - |
| nodeId | string | ID узла | - |
| safeName | string | Безопасное имя функции | - |
| synonyms | string[] | Текстовые триггеры (min 1) | - |
| targetGroupId | string | ID конкретной группы или '' | '' |
| disableNotification | boolean | Без уведомления (pin) | false |
| messageText | string | Текст ответа после действия | '' |
| state | FSMContext | Опциональный FSM контекст (state: FSMContext = None). Используется для чтения/записи данных между переходами. | None |

## Примеры использования

```typescript
generateMessageHandler({
  nodeType: 'pin_message',
  nodeId: 'pin_1',
  safeName: 'pin_1',
  synonyms: ['закрепить', 'прикрепить'],
  disableNotification: false,
});

generateMessageHandlerFromNode(node); // высокоуровневый API
```

## Структура файлов

```
message-handler/
├── message-handler.py.jinja2
├── message-handler.params.ts
├── message-handler.schema.ts
├── message-handler.renderer.ts
├── message-handler.fixture.ts
├── message-handler.test.ts
├── message-handler.md
└── index.ts
```

## Тесты

```bash
npm test -- message-handler.test.ts
```
