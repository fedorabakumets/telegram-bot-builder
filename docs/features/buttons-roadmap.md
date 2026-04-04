# Roadmap: Улучшение системы кнопок

## Статус выполненных задач

| Задача | Статус |
|--------|--------|
| Показывать `hideAfterClick` на канвасе | ✅ Готово |
| Тоггл `hideAfterClick` в панели свойств | ✅ Готово |
| Красивые ID кнопок (`btn_N`) | ✅ Готово |
| Уникальные ID при дублировании узла | ✅ Готово |
| Дефолтные 2 кнопки у узла "Клавиатура" | ✅ Готово |
| Иконки requestContact/requestLocation на канвасе и в панели | ✅ Готово |
| Счётчик кнопок в заголовке узла | ❌ Отклонено |
| Валидация customCallbackData (64 байта) | ✅ Готово |

---

## UX / Канвас

### 1. Визуальное различие типов кнопок

**Проблема:** `inline` и `reply` кнопки выглядят одинаково — только заголовок отличается.

**Решение:**
- Добавить цветную полосу слева у карточки кнопки
  - `inline` → синяя (`border-l-4 border-blue-500`)
  - `reply` → зелёная (`border-l-4 border-green-500`)
- Или иконку типа в правом верхнем углу карточки

**Файлы:**
- `client/components/editor/canvas/canvas-node/inline-button.tsx`
- `client/components/editor/canvas/canvas-node/reply-button.tsx`

---

### 2. Иконки для reply кнопок requestContact / requestLocation

**Проблема:** Кнопки с `requestContact=true` или `requestLocation=true` показывают просто текст без визуального намёка.

**Решение:** Показывать иконку 📞 или 📍 вместо/рядом с текстом действия.

**Файлы:**
- `client/components/editor/canvas/canvas-node/reply-button.tsx`

---

### 3. Счётчик кнопок в заголовке узла

**Проблема:** Непонятно сколько кнопок в узле без раскрытия.

**Решение:** `INLINE КНОПКИ · 3` — добавить счётчик в `ButtonsPreviewHeader`.

**Файлы:**
- `client/components/editor/canvas/canvas-node/buttons-preview-header.tsx`

---

## Панель свойств

### 4. Валидация customCallbackData

**Проблема:** Telegram ограничивает `callback_data` до 64 байт. Сейчас нет проверки — пользователь может ввести длинную строку и получить ошибку в рантайме.

**Решение:**
- Добавить счётчик символов в поле `ButtonCallbackField`
- Показывать предупреждение при превышении 64 байт
- Блокировать сохранение или показывать ошибку

**Файлы:**
- `client/components/editor/properties/components/button-card/button-callback-field.tsx`

---

### 5. Дублирование кнопки

**Проблема:** Нет быстрого способа скопировать кнопку с теми же настройками.

**Решение:** Добавить кнопку "Дублировать" в `ButtonCardHeader` — копирует кнопку с новым `generateButtonId()`.

**Файлы:**
- `client/components/editor/properties/components/button-card/button-card-header.tsx`
- `client/components/editor/properties/hooks/use-handle-add-button.ts`

---

### 6. Drag-and-drop переупорядочивание кнопок в списке

**Проблема:** Чтобы изменить порядок кнопок нужно открывать `KeyboardLayoutEditor` — неудобно.

**Решение:** Добавить drag handle (`⠿`) к каждой карточке кнопки, реализовать сортировку через `react-dnd` или нативный HTML5 drag.

**Файлы:**
- `client/components/editor/properties/components/button-card/button-card.tsx`
- `client/components/editor/properties/components/button-card/button-card-header.tsx`

---

## Генератор кода

### 7. processNodeButtonsAndGenerateHandlers — TODO

**Проблема:** В `generateInteractiveCallbackHandlers` есть незаконченная реализация — функция `processNodeButtonsAndGenerateHandlers` помечена TODO и не генерирует обработчики для inline-кнопок `inlineNodes`.

**Решение:** Реализовать генерацию обработчиков для каждой inline-кнопки узла, добавить их ID в `processedCallbacks` чтобы избежать дублирования.

**Файлы:**
- `lib/templates/keyboard-handlers/interactive-callback-handlers/interactive-callback-handlers.renderer.ts`

---

### 8. Предупреждение о несуществующем target

**Проблема:** Если кнопка ссылается на удалённый узел — генерируется битый код без предупреждения.

**Решение:**
- При генерации кода проверять что `button.target` существует в списке узлов
- Логировать предупреждение через `generatorLogger.warn`
- На канвасе подсвечивать кнопку красным если target не найден

**Файлы:**
- `lib/bot-generator.ts`
- `client/components/editor/canvas/canvas-node/inline-button.tsx`

---

### 9. Проверка циклических переходов

**Проблема:** Кнопка A → узел B → кнопка → узел A создаёт бесконечный цикл в боте.

**Решение:** Добавить обход графа (DFS) при генерации кода для обнаружения циклов. Логировать предупреждение, не блокировать генерацию.

**Файлы:**
- `lib/bot-generator/core/create-generation-context.ts`

---

## Новые фичи

### 10. Действие copy_text

**Проблема:** Telegram поддерживает `copy_text` в inline keyboard (Bot API 7.11+), но в редакторе этого действия нет.

**Решение:**
- Добавить `copy_text` в `ButtonAction` enum
- Добавить поле `copyText: string` в `buttonSchema`
- Добавить опцию в `ActionSelector`
- Генерировать `InlineKeyboardButton(text=..., copy_text=CopyTextButton(text=...))`

**Файлы:**
- `shared/schema/tables/button-schema.ts`
- `lib/bot-generator/types/button-types.ts`
- `client/components/editor/properties/components/button-card/button-action-selector.tsx`
- `lib/templates/keyboard/keyboard.py.jinja2`

---

### 11. Условная видимость кнопки

**Проблема:** Нет способа показывать кнопку только при определённом значении переменной.

**Решение:**
- Добавить поле `condition: { variable: string, operator: string, value: string }` в `buttonSchema`
- В генераторе оборачивать кнопку в `if variable == value:`
- В панели свойств добавить секцию "Условие показа"

**Файлы:**
- `shared/schema/tables/button-schema.ts`
- `lib/templates/keyboard/keyboard.py.jinja2`
- `client/components/editor/properties/components/button-card/button-card.tsx`

---

### 12. Шаблоны кнопок

**Проблема:** Нет способа сохранить набор кнопок и переиспользовать в разных узлах.

**Решение:**
- Добавить `buttonPresets` в `localStorage` или в данные проекта
- Кнопка "Сохранить как шаблон" в панели свойств
- Кнопка "Загрузить шаблон" при добавлении кнопок
- UI: выпадающий список сохранённых шаблонов

**Файлы:**
- Новый файл: `client/utils/button-presets.ts`
- `client/components/editor/properties/components/keyboard/keyboard-buttons-section.tsx`

---

## Приоритеты

| # | Задача | Сложность | Ценность |
|---|--------|-----------|----------|
| 3 | Счётчик кнопок в заголовке | Низкая | Средняя |
| 4 | Валидация customCallbackData | Низкая | Высокая |
| 5 | Дублирование кнопки | Низкая | Высокая |
| 2 | Иконки requestContact/requestLocation | Низкая | Средняя |
| 1 | Визуальное различие типов | Средняя | Средняя |
| 8 | Предупреждение о несуществующем target | Средняя | Высокая |
| 6 | Drag-and-drop в списке | Средняя | Средняя |
| 10 | copy_text действие | Средняя | Высокая |
| 7 | processNodeButtonsAndGenerateHandlers | Высокая | Высокая |
| 9 | Циклические переходы | Высокая | Средняя |
| 11 | Условная видимость | Высокая | Высокая |
| 12 | Шаблоны кнопок | Высокая | Средняя |
