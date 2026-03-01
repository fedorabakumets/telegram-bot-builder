# 📋 План рефакторинга: Properties Module

**Дата создания:** 2026-03-01  
**Модуль:** `client/components/editor/properties`

---

## 🔴 P0 — Критические ошибки

### 1. God Component PropertiesPanel
- **Файл:** `components/main/properties-panel.tsx`
- **Проблема:** 350+ строк, 14 состояний, 13 пропсов
- **Решение:** Разделить на композируемые компоненты
- **Новые файлы:**
  - [ ] `components/sections/properties-content.tsx`
  - [ ] `components/sections/keyboard/keyboard-section.tsx`
  - [ ] `components/sections/conditional/conditional-section.tsx`
  - [ ] `components/sections/user-input/user-input-section.tsx`
  - [ ] `components/sections/auto-transition/auto-transition-section.tsx`

### 2. Дублирование состояния
- **Файл:** `components/main/properties-panel.tsx` + `hooks/use-properties-panel-state.ts`
- **Проблема:** Хук определён, но не используется
- **Решение:** Внедрить хук в компонент

### 3. Использование `any`
- **Файлы:**
  - [ ] `hooks/use-properties-panel-memo.ts` — 3 места
  - [ ] `utils/conditional-utils.ts` — индексная сигнатура
  - [ ] `components/main/properties-panel.tsx` — пропсы
- **Решение:** Заменить на строгие типы

### 4. Мёртвый код
- **Файл:** `components/main/properties-panel.tsx`
- **Проблема:** Пустые `useState` без использования
- **Решение:** Удалить строки 118-119

---

## 🟠 P1 — Серьёзные ошибки

### 5. Неправильная организация папок
- **Проблема:** `action-loggers/` не компоненты, `main/` размыто
- **Решение:** Переименовать/переместить
- **Новые файлы:**
  - [ ] `types/properties.types.ts` — централизованные типы
  - [ ] `constants/keyboard.types.ts` — типы клавиатур
  - [ ] `constants/conditional.constants.ts` — константы условий
  - [ ] `constants/node-priority.constants.ts` — приоритеты узлов

### 6. Баррел-экспорты с дублированием
- **Файл:** `index.ts`
- **Проблема:** Дублирующий экспорт action-loggers, configuration
- **Решение:** Упростить экспорты

### 7. Отсутствие валидации API ответов
- **Файл:** `hooks/use-media.ts`
- **Проблема:** Нет валидации response.json()
- **Решение:** Добавить валидацию

### 8. Глубокие относительные импорты
- **Файл:** `components/main/properties-panel.tsx`
- **Проблема:** 25+ импортов, смешение стилей
- **Решение:** Использовать абсолютные пути

---

## 🟡 P2 — Улучшения

### 9. Слабая документация
- **Файлы:**
  - [ ] `hooks/README.md` — создать
  - [ ] `utils/README.md` — создать
  - [ ] `media/README.md` — создать
  - [ ] `types/README.md` — создать
  - [ ] `constants/README.md` — создать

### 10. Магические числа и строки
- **Файлы:**
  - [ ] `utils/conditional-utils.ts` — приоритеты 100, 50, 30, 10
  - [ ] `components/keyboard/keyboard-type-selector.tsx` — 'inline', 'reply', 'none'
- **Решение:** Вынести в константы

### 11. Отсутствие тестов
- **Файлы:**
  - [ ] `utils/conditional-utils.test.ts`
  - [ ] `utils/node-utils.test.ts`
  - [ ] `utils/variables-utils.test.ts`
  - [ ] `hooks/use-properties-panel-state.test.ts`

---

## 📊 Метрики до/после

| Метрика | До | После |
|---------|-----|-------|
| Размер PropertiesPanel | 350+ | < 100 |
| Использований `any` | 10+ | 0 |
| Компонентов > 200 строк | 5+ | 0 |
| Покрытие тестами | 0% | 80%+ |
| JSDoc покрытие | 60% | 95%+ |

---

## ✅ Чек-лист выполнения

- [ ] Все P0 задачи выполнены
- [ ] Все P1 задачи выполнены
- [ ] Все P2 задачи выполнены
- [ ] Тесты написаны и проходят
- [ ] Документация обновлена
- [ ] Git commit с описанием изменений
