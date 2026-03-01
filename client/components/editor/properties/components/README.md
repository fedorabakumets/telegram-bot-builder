# Компоненты панели свойств

**Модуль:** `components/editor/properties/components`

## 📁 Структура папок

```
components/
├── layout/           # Компоненты макета (header, footer, section headers)
├── common/           # Общие переиспользуемые компоненты
├── keyboard/         # Компоненты клавиатур и кнопок
├── conditional/      # Компоненты условных сообщений
├── variables/        # Компоненты работы с переменными
├── questions/        # Компоненты вопросов и тестов
├── commands/         # Компоненты команд бота
├── broadcast/        # Компоненты рассылки сообщений
├── admin/            # Компоненты администрирования
├── navigation/       # Компоненты навигации между узлами
├── csv/              # Компоненты CSV экспорта
├── synonyms/         # Компоненты редактирования синонимов
├── media/            # Компоненты медиа
└── main/             # Главные компоненты (properties-panel)
```

## 📦 Использование

### Импорт из конкретной папки

```typescript
// Импорт компонента заголовка
import { PropertiesHeader } from './components/layout';

// Импорт компонента клавиатуры
import { KeyboardTypeSelector } from './components/keyboard';

// Импорт компонента условного сообщения
import { ConditionalButton } from './components/conditional';
```

### Импорт из главного барреля

```typescript
// Импорт из components/index.ts
import { 
  PropertiesHeader,
  KeyboardTypeSelector,
  ConditionalButton
} from './components';
```

## 🎯 Назначение папок

### `layout/`
Компоненты каркаса панели свойств:
- `PropertiesHeader` — заголовок с информацией об узле
- `PropertiesFooter` — футер с кнопками действий
- `SectionHeader` — заголовок секции настроек
- `DevelopmentNoticeBlock` — блок уведомлений для разработки

### `common/`
Общие переиспользуемые компоненты:
- `ApplyButton` — кнопка применения изменений
- `MessageInfoBlock` — блок информации о сообщении
- `CompleteButtonInfo` — информация о кнопке завершения
- `NormalButtonInfo` — информация об обычной кнопке
- `OptionButtonInfo` — информация о кнопке опции

### `keyboard/`
Компоненты для работы с клавиатурами:
- `ActionInput` — поле ввода действия
- `ActionSelector` — селектор действий
- `ButtonTypeSelector` — выбор типа кнопки
- `KeyboardTypeSelector` — выбор типа клавиатуры
- `KeyboardTypeToggles` — переключатели типа клавиатуры
- `ReplyKeyboardSettings` — настройки reply клавиатуры
- `TargetNodeSelector` — выбор целевого узла

### `conditional/`
Компоненты условных сообщений:
- `ConditionContent` — содержимое условия
- `ConditionalActionInput` — ввод действия условия
- `ConditionalActionSelector` — селектор действия условия
- `ConditionalButton` — кнопка условия
- `ConditionalButtonConfig` — конфигурация кнопки условия
- `ConditionalButtonsList` — список кнопок условия
- `ConditionalCollectionSection` — секция коллекции условий
- `ConditionalInputConfig` — конфигурация ввода условия
- `ConditionalKeyboardConfig` — конфигурация клавиатуры условия
- `ConditionalMediaToggles` — переключатели медиа условия
- `ConditionalTransition` — переход условия
- `ConditionalVariableDropdown` — выпадающий список переменных условия
- `ConditionalVariableInputConfig` — конфигурация ввода переменной условия
- `ConditionalVariableInputs` — ввод переменных условия
- `EmptyConditionalState` — состояние отсутствия условий
- `LogicOperatorSelector` — выбор логического оператора

### `variables/`
Компоненты работы с переменными:
- `ExpectedValueInput` — ввод ожидаемого значения
- `SystemVariablesDropdown` — выпадающий список системных переменных
- `VariableInputConfig` — конфигурация ввода переменной
- `VariableInputGrid` — сетка ввода переменных
- `VariableNamesSection` — секция имён переменных

### `questions/`
Компоненты вопросов:
- `QuestionCheckboxList` — список чекбоксов вопросов
- `SelectedQuestions` — выбранные вопросы
- `MultipleSelectionSettings` — настройки множественного выбора

### `commands/`
Компоненты команд бота:
- `CommandAdvancedSettings` — расширенные настройки команды
- `CommandTargetSection` — секция целевой аудитории команды

### `broadcast/`
Компоненты рассылки:
- `BroadcastProperties` — свойства рассылки
- `BroadcastToggle` — переключатель рассылки

### `admin/`
Компоненты администрирования:
- `AdminOnlySetting` — настройка только для админов
- `AdminRightsEditor` — редактор прав администратора
- `PrivateOnlySetting` — настройка только для личных сообщений
- `ShowInMenuSetting` — настройка отображения в меню

### `navigation/`
Компоненты навигации:
- `AutoTransitionSection` — секция автоперехода
- `GotoTargetSection` — секция целевого перехода
- `IdSourceSelector` — выбор источника ID
- `InputNavigationGrid` — сетка навигации ввода

### `csv/`
Компоненты CSV экспорта:
- `SaveToCsvSwitch` — переключатель сохранения в CSV
- `SaveToUserIdsSwitch` — переключатель сохранения ID пользователей

### `synonyms/`
Компоненты синонимов:
- `SynonymEditor` — редактор синонимов

### `media/`
Компоненты медиа:
- `MediaInputConfig` — конфигурация ввода медиа
- `MediaInputToggles` — переключатели медиа

### `main/`
Главные компоненты:
- `PropertiesPanel` — основная панель свойств
- `CustomMessageSection` — секция пользовательского сообщения

## 📝 JSDoc Соглашения

Все файлы содержат JSDoc комментарии на русском языке:

```typescript
/**
 * @fileoverview Описание назначения файла
 * @module Путь к модулю
 */

/**
 * Описание компонента
 * @param props Пропсы компонента
 * @returns JSX элемент
 */
export function Component(props: Props) {
  // ...
}
```

## 🔧 Рефакторинг

При добавлении нового компонента:
1. Определите тематическую группу (папку)
2. Создайте файл компонента с JSDoc
3. Добавьте экспорт в `index.ts` папки
4. При необходимости создайте новую папку
