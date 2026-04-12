# Шаблон: message.py.jinja2

## Описание

Генерирует Python код обработчика для узла типа `message`. Этот обработчик используется для навигации к узлу сообщения через callback кнопки.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `nodeId` | `string` | - | Уникальный идентификатор узла |
| `messageText` | `string` | `''` | Текст сообщения |
| `isPrivateOnly` | `boolean` | `false` | Только для приватных чатов |
| `adminOnly` | `boolean` | `false` | Только для администраторов |
| `requiresAuth` | `boolean` | `false` | Требуется авторизация |
| `userDatabaseEnabled` | `boolean` | `false` | База данных включена |
| `allowMultipleSelection` | `boolean` | `false` | Множественный выбор разрешён |
| `multiSelectVariable` | `string` | - | Переменная для хранения выборов |
| `keyboardType` | `'inline' \| 'reply' \| 'none'` | `'none'` | Тип клавиатуры |
| `keyboardLayout` | `any` | - | Раскладка клавиатуры |
| `buttons` | `Button[]` | `[]` | Кнопки |
| `enableDynamicButtons` | `boolean` | `false` | Включает runtime-генерацию inline keyboard из HTTP response |
| `dynamicButtons` | `DynamicButtonsConfig` | - | Конфиг dynamic buttons: `sourceVariable`, `arrayPath`, `textTemplate`, `callbackTemplate`, `styleMode`, `styleField`, `styleTemplate`, `columns` |
| `keyboardNodeId` | `string` | - | ID отдельной `keyboard`-ноды, если клавиатура вынесена из сообщения; при его отсутствии host может быть найден по графу переходов |
| `oneTimeKeyboard` | `boolean` | `false` | Скрыть клавиатуру после использования |
| `resizeKeyboard` | `boolean` | - | Изменить размер клавиатуры |
| `formatMode` | `'html' \| 'markdown' \| 'none'` | `'none'` | Режим форматирования |
| `enableAutoTransition` | `boolean` | `false` | Автопереход включён |
| `autoTransitionTo` | `string` | - | Цель автоперехода |
| `collectUserInput` | `boolean` | `false` | Сбор пользовательского ввода |
| `enableTextInput` | `boolean` | `false` | Включить текстовый ввод |
| `enablePhotoInput` | `boolean` | `false` | Включить ввод фото |
| `enableVideoInput` | `boolean` | `false` | Включить ввод видео |
| `enableAudioInput` | `boolean` | `false` | Включить ввод аудио |
| `enableDocumentInput` | `boolean` | `false` | Включить ввод документов |
| `inputVariable` | `string` | - | Переменная для сохранения ввода |
| `inputTargetNodeId` | `string` | - | Целевой узел после ввода |
| `minLength` | `number` | `0` | Минимальная длина ввода |
| `maxLength` | `number` | `0` | Максимальная длина ввода |
| `appendVariable` | `boolean` | `false` | Добавлять к существующей переменной |
| `imageUrl` | `string` | - | URL изображения |
| `documentUrl` | `string` | - | URL документа |
| `videoUrl` | `string` | - | URL видео |
| `audioUrl` | `string` | - | URL аудио |
| `attachedMedia` | `string[]` | `[]` | Прикреплённые медиа |
| `enableConditionalMessages` | `boolean` | `false` | Условные сообщения включены |
| `conditionalMessages` | `any[]` | `[]` | Массив условных сообщений |
| `fallbackMessage` | `string` | - | Запасное сообщение |
| `synonymEntries` | `SynonymEntry[]` | `[]` | Записи синонимов |
| `hasHideAfterClickIncoming` | `boolean` | `false` | Входящие кнопки с hideAfterClick |
| `hasUserIdsVariable` | `boolean` | `false` | Текст использует переменную user_ids |
| `messageSendRecipients` | `MessageSendRecipient[]` | `[]` | Список дополнительных получателей сообщения |
| `saveMessageIdTo` | `string` | - | Имя переменной для сохранения ID отправленного сообщения |

## Тип MessageSendRecipient

```typescript
interface MessageSendRecipient {
  /** Уникальный идентификатор получателя */
  id: string;
  /** Тип: 'user' — основной пользователь, 'chat_id' — конкретный чат, 'admin_ids' — администраторы */
  type: 'user' | 'chat_id' | 'admin_ids';
  /** ID чата, @username или {переменная} */
  chatId?: string;
  /** ID топика или {переменная} */
  threadId?: string;
}
```

Если `messageSendRecipients` пустой или содержит только `type: 'user'` — дополнительный код не генерируется (обратная совместимость).

## Форматирование текста

### Как работает formatMode

Параметр `formatMode` управляет режимом разметки Telegram:

| Значение | Результат в Python | Описание |
|---|---|---|
| `'html'` | `parse_mode="HTML"` | HTML-теги: `<b>`, `<i>`, `<code>`, `<a>` и др. |
| `'markdown'` | `parse_mode="Markdown"` | Markdown: `*жирный*`, `_курсив_`, `` `код` `` |
| `'none'` | *(нет аргумента)* | Текст без форматирования |

### HTML-теги передаются как есть

При `formatMode: 'html'` HTML-теги в `messageText` передаются в Python строку без изменений — Telegram API сам их интерпретирует:

```python
text = "<b>Жирный</b> и <i>курсив</i>"
await bot.send_message(chat_id, text, parse_mode="HTML")
```

### Замена переменных через replace_variables_in_text

Если `messageText` содержит `{переменная}` — генерируется вызов `replace_variables_in_text`:

```python
text = "Привет, {user_name}!"
all_user_vars = await init_all_user_vars(user_id)
text = replace_variables_in_text(text, all_user_vars, {})
```

### Фильтры переменных {name|join:", "}

Переменные поддерживают фильтры в формате `{имя|фильтр:аргумент}`. Фильтры обрабатываются внутри `replace_variables_in_text` на стороне Python.

### Экранирование текста

Фильтр `format_python_text` (Nunjucks) автоматически выбирает стратегию:

- **Однострочный текст** → двойные кавычки `"..."` с экранированием `"`, `\`, `\n`, `\r`, `\t`
- **Многострочный текст** → одинарные тройные кавычки `'''...'''` — двойные кавычки внутри не нужно экранировать

```python
# Однострочный
text = "Привет, \"мир\"!"

# Многострочный
text = '''Строка 1
Строка 2
Строка с "двойными" кавычками'''
```

## Использование

### Базовое

```typescript
import { generateMessage } from './message.renderer';

const code = generateMessage({
  nodeId: 'msg_123',
  messageText: 'Привет! Выберите опцию:',
  keyboardType: 'inline',
  buttons: [
    { text: 'Опция 1', action: 'goto', target: 'option_1', id: 'btn_1' },
    { text: 'Опция 2', action: 'goto', target: 'option_2', id: 'btn_2' },
  ],
});
```

### С сохранением ID сообщения

```typescript
const code = generateMessage({
  nodeId: 'menu_node',
  messageText: 'Выберите действие:',
  keyboardType: 'inline',
  buttons: [{ text: '👍 Лайк', action: 'goto', target: 'like', id: 'btn_like' }],
  saveMessageIdTo: 'menu_msg_id',
});
// Генерирует: user_data[user_id]["menu_msg_id"] = sent_message.message_id
// Используй в узле edit_message: editMessageIdSource: 'custom', editMessageIdManual: '{menu_msg_id}'
```

### С автопереходом

```typescript
const code = generateMessage({
  nodeId: 'welcome',
  messageText: 'Добро пожаловать!',
  enableAutoTransition: true,
  autoTransitionTo: 'main_menu',
});
```

### С медиа

```typescript
const code = generateMessage({
  nodeId: 'photo_node',
  messageText: 'Вот ваше фото:',
  imageUrl: 'https://example.com/image.jpg',
  keyboardType: 'inline',
  buttons: [
    { text: '👍 Нравится', action: 'goto', target: 'like', id: 'btn_like' },
  ],
});
```

## Примеры вывода

### Простое сообщение с кнопками

**Вход:**
```typescript
{
  nodeId: 'main_menu',
  messageText: 'Главное меню',
  keyboardType: 'inline',
  buttons: [
    { text: 'Профиль', action: 'goto', target: 'profile', id: 'btn_profile' },
    { text: 'Настройки', action: 'goto', target: 'settings', id: 'btn_settings' },
  ]
}
```

**Выход:**
```python
@dp.callback_query(lambda c: c.data == "main_menu" or c.data.startswith("main_menu_btn_"))
async def handle_callback_main_menu(callback_query: types.CallbackQuery):
    """Обработчик перехода к узлу main_menu"""
    user_id = callback_query.from_user.id
    logging.info(f"🔵 Переход к узлу main_menu для пользователя {user_id}")

    try:
        await callback_query.answer()
    except Exception:
        pass

    text = "Главное меню"
    
    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Профиль", callback_data="profile"))
    builder.add(InlineKeyboardButton(text="Настройки", callback_data="settings"))
    keyboard = builder.as_markup()

    await callback_query.message.answer(text, reply_markup=keyboard)
```

> Примечание: `callback_data` генерируется из поля `target` кнопки, а не `id`. При `isPrivateOnly=true` в обработчик добавляется проверка `is_private_chat` перед обработкой.

### Сообщение с автопереходом

**Вход:**
```typescript
{
  nodeId: 'loading',
  messageText: 'Загрузка...',
  enableAutoTransition: true,
  autoTransitionTo: 'next_step'
}
```

**Выход:**
```python
@dp.callback_query(lambda c: c.data == "loading" or c.data.startswith("loading_btn_"))
async def handle_callback_loading(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    text = "Загрузка..."
    sent_message = await callback_query.message.answer(text)
    
    # ⚡ АВТОПЕРЕХОД к next_step
    logging.info(f"⚡ Автопереход от узла loading к узлу next_step")
    
    class FakeCallbackQuery:
        def __init__(self, message, from_user, target_node_id):
            self.from_user = from_user
            self.chat = message.chat
            self.data = target_node_id
            self.message = message
            self._is_fake = True
        
        async def answer(self, *args, **kwargs):
            pass
    
    fake_callback = FakeCallbackQuery(sent_message or callback_query.message, callback_query.from_user, "next_step")
    try:
        await handle_callback_next_step(fake_callback)
        logging.info(f"✅ Автопереход выполнен: loading -> next_step")
    except Exception as e:
        logging.error(f"Ошибка при автопереходе к узлу next_step: {e}")
        await (sent_message or callback_query.message).answer("Переход завершен")
    return
```

## Логика условий

### Проверки безопасности

```typescript
if (isPrivateOnly) {
  // Добавить проверку is_private_chat
}

if (adminOnly) {
  // Добавить проверку is_admin
}

if (requiresAuth) {
  // Добавить проверку check_auth
}
```

### Сохранение пользователя

```typescript
if (userDatabaseEnabled) {
  // Добавить save_user_to_db и update_user_data_in_db
}
```

### Автопереход

```typescript
if (enableAutoTransition && autoTransitionTo) {
  // Сгенерировать FakeCallbackQuery и сохранить исходного пользователя
}
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./message.params` — типы параметров
- `./message.schema` — Zod схема
- `keyboard/keyboard.py.jinja2` — шаблон клавиатуры

## См. также

- [`command-trigger.py.jinja2`](../command-trigger/command-trigger.md) — шаблон входа по команде
- [`keyboard.py.jinja2`](../keyboard/keyboard.md) — шаблон клавиатуры

## Dynamic keyboard flow

Если `MessageTemplateParams.enableDynamicButtons=true`, сообщение остаётся отдельной нодой, а клавиатура строится в следующем `keyboard`-шаблоне на основе данных, которые пришли после HTTP request.

Типичный сценарий:

```typescript
generateMessage({
  nodeId: 'projects_message',
  messageText: 'Выберите проект:',
  keyboardType: 'inline',
  enableDynamicButtons: true,
  dynamicButtons: {
    sourceVariable: 'projects',
    arrayPath: 'items',
    textTemplate: '{name}',
    callbackTemplate: 'project_{id}',
    styleMode: 'field',
    styleField: 'style',
    styleTemplate: '',
    columns: 2,
  },
  buttons: [],
});
```

Backward compatibility:
- legacy dynamic fields `variable`, `arrayField`, `textField`, `callbackField` are normalized in schema;
- if `enableDynamicButtons` is set, the renderer forces `keyboardType: 'inline'`.
