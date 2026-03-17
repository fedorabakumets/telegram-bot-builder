# Шаблон сбора пользовательского ввода (user-input.py.jinja2)

## Описание

Шаблон генерирует Python-код установки состояния `waiting_for_input` для узлов с включённым сбором ответов (`collectUserInput: true`). Этот блок вставляется в конец функции `handle_node_*` и сигнализирует универсальному обработчику `handle_user_input` о том, что нужно ждать ответа пользователя.

## Параметры

| Параметр | Тип | Описание | Обязательное |
|----------|-----|----------|--------------|
| nodeId | string | ID узла | ✅ |
| safeName | string | Безопасное имя функции | ✅ |
| inputVariable | string | Имя переменной для сохранения ответа | ✅ |
| appendVariable | boolean | Режим добавления (не перезаписывать) | нет (false) |
| inputTargetNodeId | string | ID следующего узла после ввода | нет |
| enableTextInput | boolean | Принимать текстовый ввод | нет (true) |
| enablePhotoInput | boolean | Принимать фото | нет (false) |
| photoInputVariable | string | Переменная для фото | нет |
| enableVideoInput | boolean | Принимать видео | нет (false) |
| videoInputVariable | string | Переменная для видео | нет |
| enableAudioInput | boolean | Принимать аудио | нет (false) |
| audioInputVariable | string | Переменная для аудио | нет |
| enableDocumentInput | boolean | Принимать документы | нет (false) |
| documentInputVariable | string | Переменная для документов | нет |
| validationType | `none` \| `email` \| `phone` \| `number` | Тип валидации | нет (none) |
| minLength | number | Минимальная длина текста (0 = без ограничений) | нет (0) |
| maxLength | number | Максимальная длина текста (0 = без ограничений) | нет (0) |
| retryMessage | string | Сообщение при ошибке валидации | нет |
| successMessage | string | Сообщение при успешном сохранении | нет |
| saveToDatabase | boolean | Сохранять в базу данных | нет (true) |

## Генерируемый Python-код

```python
# Устанавливаем состояние ожидания ввода для узла msg_ask_name
user_data[user_id] = user_data.get(user_id, {})
user_data[user_id]["waiting_for_input"] = {
    "type": "text",
    "modes": ["text"],
    "variable": "user_name",
    "save_to_database": True,
    "node_id": "msg_ask_name",
    "next_node_id": "msg_confirm",
    "appendVariable": False,
    "min_length": 0,
    "max_length": 0,
    "validation_type": "none",
    "retry_message": "Пожалуйста, попробуйте еще раз.",
    "success_message": ""
}
logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_name (узел msg_ask_name)")
```

## Примеры использования

### Текстовый ввод с email валидацией

```typescript
generateUserInput({
  nodeId: 'msg_ask_email',
  safeName: 'msg_ask_email',
  inputVariable: 'user_email',
  enableTextInput: true,
  validationType: 'email',
  retryMessage: 'Введите корректный email.',
  inputTargetNodeId: 'msg_confirm',
  saveToDatabase: true,
});
```

### Фото ввод

```typescript
generateUserInput({
  nodeId: 'msg_ask_photo',
  safeName: 'msg_ask_photo',
  inputVariable: 'user_photo',
  enableTextInput: false,
  enablePhotoInput: true,
  photoInputVariable: 'user_photo_file',
  inputTargetNodeId: 'msg_next',
});
```

### Из узла графа (высокоуровневый API)

```typescript
import { generateUserInputFromNode, nodeHasUserInput } from '../../templates/user-input';

// Фильтруем узлы с включённым сбором ввода
const inputNodes = nodes.filter(nodeHasUserInput);

// Генерируем блок waiting_for_input для каждого
for (const node of inputNodes) {
  code += generateUserInputFromNode(node);
}
```

## Связь с UI

Секция "Сбор ответов" в панели свойств (`user-input-settings-section.tsx`) записывает в `node.data`:

| UI поле | node.data поле | Параметр шаблона |
|---------|---------------|-----------------|
| Включить | `collectUserInput` | — (флаг активации) |
| Переменная | `inputVariable` | `inputVariable` |
| Следующий узел | `inputTargetNodeId` | `inputTargetNodeId` |
| Медиафайлы (фото) | `enablePhotoInput` | `enablePhotoInput` |
| Медиафайлы (видео) | `enableVideoInput` | `enableVideoInput` |
| Медиафайлы (аудио) | `enableAudioInput` | `enableAudioInput` |
| Документы | `enableDocumentInput` | `enableDocumentInput` |

## Структура файлов

```
user-input/
├── user-input.py.jinja2   (шаблон блока waiting_for_input)
├── user-input.params.ts   (TypeScript интерфейсы)
├── user-input.schema.ts   (Zod схема валидации)
├── user-input.renderer.ts (функции generateUserInput*)
├── user-input.fixture.ts  (тестовые данные)
├── user-input.test.ts     (тесты)
├── user-input.md          (документация)
└── index.ts               (экспорт)
```
