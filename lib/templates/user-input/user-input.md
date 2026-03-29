# Шаблон сбора пользовательского ввода (user-input.py.jinja2)

## Описание

Шаблон генерирует Python-код установки состояния `waiting_for_input` для отдельного узла `type: 'input'`, а также для legacy-узлов `message` с `collectUserInput: true`. Для dedicated `input` он используется и как runtime-блок ожидания, и как источник callback-handler через `generateUserInputNodeHandler`.

## Параметры

| Параметр | Тип | Описание | Обязательное |
|----------|-----|----------|--------------|
| nodeId | string | ID узла | ✅ |
| safeName | string | Безопасное имя функции | ✅ |
| inputVariable | string | Имя переменной для сохранения ответа | ✅ |
| appendVariable | boolean | Режим добавления (не перезаписывать) | нет (false) |
| inputTargetNodeId | string | ID следующего узла после ввода | нет |
| inputSource | `any` \| `text` \| `photo` \| `video` \| `audio` \| `document` \| `location` \| `contact` | Источник ответа для отдельного `input`-узла | нет |
| enableTextInput | boolean | Принимать текстовый ввод | нет (true) |
| enablePhotoInput | boolean | Принимать фото | нет (false) |
| photoInputVariable | string | Переменная для фото | нет |
| enableVideoInput | boolean | Принимать видео | нет (false) |
| videoInputVariable | string | Переменная для видео | нет |
| enableAudioInput | boolean | Принимать аудио | нет (false) |
| audioInputVariable | string | Переменная для аудио | нет |
| enableDocumentInput | boolean | Принимать документы | нет (false) |
| documentInputVariable | string | Переменная для документов | нет |
| enableLocationInput | boolean | Принимать геолокацию | нет (false) |
| locationInputVariable | string | Переменная для геолокации | нет |
| enableContactInput | boolean | Принимать контакт | нет (false) |
| contactInputVariable | string | Переменная для контакта | нет |
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

### Отдельный input-узел

```typescript
generateUserInput({
  nodeId: 'input_contact_1',
  safeName: 'input_contact_1',
  inputVariable: 'user_contact',
  inputSource: 'contact',
  enableContactInput: true,
  contactInputVariable: 'user_contact_card',
  inputTargetNodeId: 'msg_done',
});
```

## Связь с UI

Новая UI-модель записывает настройки в отдельный `input`-узел (`node.type === 'input'`), но legacy-путь внутри `message` тоже поддерживается:

| UI поле | node.data поле | Параметр шаблона |
|---------|---------------|-----------------|
| Включить legacy-режим | `collectUserInput` | — (флаг активации) |
| Переменная | `inputVariable` | `inputVariable` |
| Следующий узел | `inputTargetNodeId` | `inputTargetNodeId` |
| Источник ответа | `inputType`/`inputSource` | `inputSource` |
| Медиафайлы (фото) | `enablePhotoInput` | `enablePhotoInput` |
| Медиафайлы (видео) | `enableVideoInput` | `enableVideoInput` |
| Медиафайлы (аудио) | `enableAudioInput` | `enableAudioInput` |
| Документы | `enableDocumentInput` | `enableDocumentInput` |
| Геолокация | `enableLocationInput` | `enableLocationInput` |
| Контакт | `enableContactInput` | `enableContactInput` |

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
