# Отчет об исправлении кнопки команды "Начать заново"

## Проблема
Кнопка команды "🔄 Начать заново" в узле `profile_complete` не появлялась в Telegram боте, несмотря на правильную настройку данных.

## Диагностика
1. **Данные корректны**: Узел `profile_complete` содержит кнопку с `action: "command"` и `target: "/start"`
2. **Обработчики генерируются**: Кнопка команды правильно преобразуется в `cmd_start` 
3. **Проблема в генерации клавиатуры**: В обработчике `handle_callback_profile_complete` создавалась пустая клавиатура

## Исправление
**Файл**: `client/src/lib/bot-generator.ts`  
**Строки**: 2502-2516

### Было:
```typescript
targetNode.data.buttons.forEach((btn, index) => {
  if (btn.action === "goto" && btn.target) {
    const btnCallbackData = `${btn.target}_btn_${index}`;
    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
  } else if (btn.action === "url") {
    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
  }
  // ОТСУТСТВОВАЛА обработка action === "command"
});
```

### Стало:
```typescript
targetNode.data.buttons.forEach((btn, index) => {
  if (btn.action === "goto" && btn.target) {
    const btnCallbackData = `${btn.target}_btn_${index}`;
    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
  } else if (btn.action === "url") {
    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
  } else if (btn.action === "command" && btn.target) {
    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
    code += `    # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
  }
});
```

## Результат
- ✅ Кнопки команд теперь правильно добавляются в inline клавиатуру для узлов типа "message"
- ✅ Обработчики кнопок команд работают корректно  
- ✅ Бот перезапущен с исправленным кодом
- ✅ Логи подтверждают: "✅ НАЙДЕНА кнопка команды: 🔄 Начать заново -> /start -> cmd_start"

## Тестирование
1. Отправьте `/start` в бот
2. Пройдите флоу: источник → пол → имя  
3. В финальном сообщении должна появиться кнопка "🔄 Начать заново"
4. Нажмите кнопку - должен запуститься заново `/start`

## Дата
10 августа 2025 г., 00:56 МСК

## Техническая информация
- **Исправленная функция**: Генерация inline клавиатуры для callback обработчиков узлов типа "message"
- **Затронутые файлы**: `client/src/lib/bot-generator.ts`
- **Тип исправления**: Добавление поддержки кнопок с `action: "command"`
- **Статус бота**: Перезапущен с новым кодом (PID: 5927)