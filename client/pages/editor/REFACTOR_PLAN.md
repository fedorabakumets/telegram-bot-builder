# План рефакторинга editor.tsx

**Цель:** Разделить файл `editor.tsx` (2464 строки) на модули по ~50 строк каждый.

**Структура папок:**
```
client/pages/editor/
├── index.tsx                    # Главный файл (оркестратор, 50 строк)
├── hooks/
│   ├── use-project-loader.ts    # Загрузка проекта
│   ├── use-project-save.ts      # Сохранение проекта
│   ├── use-sheet-management.ts  # Управление листами
│   ├── use-node-handlers.ts     # Обработчики узлов
│   ├── use-button-handlers.ts   # Обработчики кнопок
│   ├── use-tab-navigation.ts    # Навигация по вкладкам
│   ├── use-layout-management.ts # Управление макетом
│   └── use-template-loader.ts   # Загрузка шаблонов
├── components/
│   ├── editor-layout.tsx        # Гибкий макет редактора
│   ├── tab-content.tsx          # Контент вкладок
│   ├── mobile-panels.tsx        # Мобильные панели
│   └── modals.tsx               # Модальные окна
├── types/
│   └── editor.types.ts          # TypeScript типы
└── utils/
    ├── keyboard-migration.ts    # Миграция keyboardLayout
    └── action-logger.ts         # Логирование действий

└── REFACTOR_PLAN.md             # Этот файл
```

---

## Список файлов для создания

### 1. `types/editor.types.ts` (45 строк)
**Строки оригинала:** 195-210, 220-235

**Содержимое:**
- Интерфейс `ActionHistoryItem`
- Тип `ActionType`
- Прочие типы для редактора

**Ответственность:** Централизованное определение типов

---

### 2. `utils/keyboard-migration.ts` (48 строк)
**Строки оригинала:** 37-66

**Содержимое:**
- Функция `migrateAllKeyboardLayouts`
- Логика фильтрации `done-button`
- Исправление `autoLayout`

**Ответственность:** Миграция раскладок клавиатуры

---

### 3. `utils/action-logger.ts` (52 строки)
**Строки оригинала:** 240-250 + импорты логгеров

**Содержимое:**
- Функция `handleActionLog`
- Интеграция с `logNodeUpdate`, `logNodeTypeChange` и др.

**Ответственность:** Логирование действий пользователя

---

### 4. `hooks/use-project-loader.ts` (50 строк)
**Строки оригинала:** 680-720

**Содержимое:**
- `useQuery` для загрузки проекта по ID
- `useQuery` для списка проектов
- Логика выбора активного проекта

**Ответственность:** Загрузка данных проекта

---

### 5. `hooks/use-project-save.ts` (50 строк)
**Строки оригинала:** 555-650

**Содержимое:**
- `updateProjectMutation`
- Оптимистичное обновление
- Обработка ошибок сохранения

**Ответственность:** Сохранение изменений проекта

---

### 6. `hooks/use-sheet-management.ts` (50 строк)
**Строки оригинала:** 1100-1250

**Содержимое:**
- `handleSheetAdd`
- `handleSheetDelete`
- `handleSheetRename`
- `handleSheetDuplicate`
- `handleSheetSelect`

**Ответственность:** CRUD операции с листами

---

### 7. `hooks/use-node-handlers.ts` (50 строк)
**Строки оригинала:** 870-1000, 1600-1650

**Содержимое:**
- `handleNodeUpdateWithSheets`
- `handleNodeTypeChange`
- `handleNodeIdChange`
- `handleNodeMove`, `handleNodeMoveEnd`
- `handleNodeDelete`, `handleNodeDuplicate`

**Ответственность:** Обработчики операций с узлами

---

### 8. `hooks/use-button-handlers.ts` (48 строк)
**Строки оригинала:** 1660-1720

**Содержимое:**
- `handleButtonAdd`
- `handleButtonUpdate`
- `handleButtonDelete`

**Ответственность:** Обработчики операций с кнопками

---

### 9. `hooks/use-tab-navigation.ts` (50 строк)
**Строки оригинала:** 1050-1100

**Содержимое:**
- `handleTabChange`
- Логика переключения между вкладками
- Автосохранение при переключении

**Ответственность:** Навигация по вкладкам редактора

---

### 10. `hooks/use-layout-management.ts` (50 строк)
**Строки оригинала:** 260-350, 480-520

**Содержимое:**
- `getFlexibleLayoutConfig`
- `handleToggleHeader/Sidebar/Properties/Canvas`
- `handleToggleCodePanel`, `handleOpenCodePanel`, `handleCloseCodePanel`

**Ответственность:** Управление гибким макетом

---

### 11. `hooks/use-template-loader.ts` (50 строк)
**Строки оригинала:** 1400-1550

**Содержимое:**
- Загрузка шаблонов из localStorage
- Миграция legacy шаблонов
- Применение шаблона к проекту

**Ответственность:** Загрузка и применение шаблонов

---

### 12. `components/editor-layout.tsx` (50 строк)
**Строки оригинала:** 1800-1900

**Содержимое:**
- Рендеринг `FlexibleLayout`
- Передача контента для панелей
- Интеграция с `SimpleLayoutCustomizer`

**Ответственность:** Основная структура макета

---

### 13. `components/tab-content.tsx` (50 строк)
**Строки оригинала:** 1900-2000, 2150-2200

**Содержимое:**
- Рендеринг контента для вкладок:
  - `editor` → Canvas
  - `bot` → BotControl
  - `users` → UserDatabasePanel
  - `groups` → GroupsPanel
  - `export` → CodeEditor
  - `user-ids` → UserIdsDatabase
  - `client-api` → TelegramClientConfig

**Ответственность:** Контент для каждой вкладки

---

### 14. `components/mobile-panels.tsx` (48 строк)
**Строки оригинала:** 2350-2450

**Содержимое:**
- Мобильный sidebar (Sheet)
- Мобильная панель свойств (Sheet)
- Адаптивное поведение

**Ответственность:** Мобильные версии панелей

---

### 15. `components/modals.tsx` (45 строк)
**Строки оригинала:** 2300-2340

**Содержимое:**
- `SaveTemplateModal`
- `LayoutManager`
- `LayoutCustomizer`

**Ответственность:** Модальные диалоги

---

### 16. `index.tsx` (50 строк)
**Строки оригинала:** 1-30, 2450-2464

**Содержимое:**
- Главный компонент `Editor`
- Подключение всех хуков
- Композиция компонентов
- Экспорт по умолчанию

**Ответственность:** Оркестрация всех частей

---

## Итоговая статистика

| Файл | Строк | Категория |
|------|-------|-----------|
| index.tsx | 50 | Главный |
| types/editor.types.ts | 45 | Типы |
| utils/keyboard-migration.ts | 48 | Утилиты |
| utils/action-logger.ts | 52 | Утилиты |
| hooks/use-project-loader.ts | 50 | Хуки |
| hooks/use-project-save.ts | 50 | Хуки |
| hooks/use-sheet-management.ts | 50 | Хуки |
| hooks/use-node-handlers.ts | 50 | Хуки |
| hooks/use-button-handlers.ts | 48 | Хуки |
| hooks/use-tab-navigation.ts | 50 | Хуки |
| hooks/use-layout-management.ts | 50 | Хуки |
| hooks/use-template-loader.ts | 50 | Хуки |
| components/editor-layout.tsx | 50 | Компоненты |
| components/tab-content.tsx | 50 | Компоненты |
| components/mobile-panels.tsx | 48 | Компоненты |
| components/modals.tsx | 45 | Компоненты |

**Всего:** 16 файлов, ~786 строк (основная логика), остальное — импорты/экспорты

---

## Порядок выполнения

1. ✅ Создать `types/editor.types.ts`
2. ✅ Создать `utils/keyboard-migration.ts`
3. ✅ Создать `utils/action-logger.ts`
4. ✅ Создать хуки (`hooks/*.ts`)
5. ✅ Создать компоненты (`components/*.tsx`)
6. ✅ Обновить `index.tsx`
7. ✅ Протестировать сборку
8. ✅ Удалить старый `editor.tsx`

---

## Зависимости между модулями

```
index.tsx
├── hooks/* (все хуки)
├── components/* (все компоненты)
├── types/editor.types.ts
│
hooks/use-node-handlers.ts
├── utils/action-logger.ts
├── hooks/use-sheet-management.ts
│
hooks/use-sheet-management.ts
├── utils/keyboard-migration.ts
└── utils/sheets-manager (внешняя зависимость)
│
components/editor-layout.tsx
├── components/tab-content.tsx
└── hooks/use-layout-management.ts
```

---

## Критерии готовности

- [ ] Все файлы созданы по ~50 строк
- [ ] TypeScript компилируется без ошибок
- [ ] Сохранена функциональность редактора
- [ ] Работает загрузка/сохранение проектов
- [ ] Работает управление листами
- [ ] Работают мобильные панели
- [ ] Пройдены основные сценарии использования
