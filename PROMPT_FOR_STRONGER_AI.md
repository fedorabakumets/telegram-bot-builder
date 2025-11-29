# Промпт для более сильного ИИ: Исправление бага навигации в редакторе Telegram ботов

## Контекст задачи
Разработчик создает визуальный редактор для Telegram ботов с node-based интерфейсом. Боты генерируются в Python код (aiogram). Возник критический баг: когда пользователь нажимает на кнопку (reply keyboard) с флагом `skipDataCollection: true` в условном сообщении (conditional message) медиа-узла (photo/video/audio/document input), навигация на целевой узел не происходит.

## Проблема
1. **Сценарий**: 
   - Узел A имеет `enablePhotoInput: true` (ожидает фото)
   - Узел A содержит `conditionalMessages` с кнопками, где одна кнопка имеет `skipDataCollection: true` и `target: "NodeB"`
   - Когда показывается условное сообщение, устанавливается состояние `waiting_for_photo`
   - Пользователь нажимает кнопку
   - Бот получает текст (название кнопки), но текстовый обработчик игнорирует его, потому что ожидает фото

2. **Root Cause**: 
   - Медиа-узлы устанавливают состояние `waiting_for_photo`, `waiting_for_video` и т.д.
   - Text handler проверяет только `waiting_for_input`, а не медиа-состояния
   - Кнопки с `skipDataCollection` должны пропускать сбор данных и сразу переходить на целевой узел

3. **Текущее решение**:
   - В `generateConditionalMessageLogic` добавлен код, который сохраняет `skip_buttons` в `user_data[user_id]["pending_skip_buttons"]` когда условие выполнено
   - В text handler добавлена проверка `pending_skip_buttons` перед проверкой `waiting_for_input`
   - Исправлена синтаксическая ошибка с f-string и JSON в Python коде (экранирование фигурных скобок)

## Файлы для проверки/исправления

### 1. client/src/lib/bot-generator.ts
- **Функция `generateConditionalMessageLogic`** (строки ~813-1250):
  - Содержит 4 case'а: `user_data_exists`, `user_data_not_exists`, `user_data_equals`, `user_data_contains`
  - В каждом case'е после создания `conditional_message_config` должен быть код, который сохраняет `pending_skip_buttons`:
    ```python
    if skipButtons.length > 0:
        user_data[user_id]["pending_skip_buttons"] = [список кнопок с target]
    ```
  - **ВАЖНО**: Убедитесь, что `skipButtonsJson` содержит только кнопки где `skipDataCollection === true && btn.target`

- **Функция `generateTextHandlerForNode`** (где генерируется text handler):
  - Нужно добавить проверку `pending_skip_buttons` в НАЧАЛО text handler, перед другими проверками
  - Примерная логика:
    ```python
    # Проверяем skip buttons для медиа-узлов
    if user_id in user_data and "pending_skip_buttons" in user_data[user_id]:
        for button in user_data[user_id]["pending_skip_buttons"]:
            if message.text == button["text"]:
                # Перейти к целевому узлу
                # Очистить pending_skip_buttons
    ```

### 2. Проблема с отображением вопросов в базе данных
В `client/src/components/editor/user-database-panel.tsx` когда показывается подробная информация о пользователе, вопрос отображает "Информация о вопросе отсутствует", но в таблице показывается правильный текст.

**Причина**: Нужно проверить где парсится `userData` и как извлекается текст вопроса из `response_*` ключей. Возможно, нужно добавить логику для получения оригинального вопроса из `nodeData` по `nodeId`.

## Что нужно сделать

1. **Проверить Python код бота** (в `bots/bot_1_1.py`):
   - Убедиться, что text handler правильно обрабатывает `pending_skip_buttons`
   - Логировать все шаги обработки для отладки
   - Убедиться, что очищаются медиа-состояния после нажатия skip кнопки

2. **Тестирование сценария**:
   - Создать узел с `enablePhotoInput: true`
   - Добавить условное сообщение с кнопкой, где `skipDataCollection: true`
   - Сгенерировать бот
   - Проверить логи: должны быть логи о сохранении `pending_skip_buttons`
   - Отправить текст (нажать кнопку) - должна произойти навигация

3. **Исправление отображения вопросов**:
   - Найти где в `user-database-panel.tsx` отображаются вопросы
   - Добавить логику для получения оригинального текста вопроса из узла по `nodeId`
   - Показать правильный вопрос в подробном виде, а не "информация отсутствует"

## Ключевые переменные и состояния

- `waiting_for_photo`, `waiting_for_video`, `waiting_for_audio`, `waiting_for_document` - состояния для медиа-узлов
- `pending_skip_buttons` - список кнопок с target, которые должны пропустить сбор данных
- `conditional_keyboard` - reply keyboard для условного сообщения
- `skipDataCollection` - флаг на кнопке, который указывает пропустить сбор данных

## Проверочный список

- [ ] Синтаксис Python кода верный (проверить f-strings)
- [ ] `pending_skip_buttons` сохраняется только когда условие выполнено
- [ ] Text handler проверяет `pending_skip_buttons` ДО других состояний
- [ ] После обработки skip кнопки очищаются медиа-состояния и `pending_skip_buttons`
- [ ] Бот перезапускается и генерирует новый код после изменений в редакторе
- [ ] Логи показывают правильный flow обработки
- [ ] Вопросы отображаются корректно как в таблице, так и в подробном виде
