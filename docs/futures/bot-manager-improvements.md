# Bot Manager — Запланированные улучшения

Документ описывает улучшения для сценария управляющего бота (`bots/новый/новый.json`) и связанной инфраструктуры. Пункты расставлены по приоритету.

---

## 1. Запуск/остановка бота из карточки проекта

**Проблема:** Кнопки "▶️ Запустить", "⏹ Остановить", "🔄 Перезапустить" в карточке проекта работают некорректно. Статус бота (`botStatus`) привязан к **токену**, а не к проекту — у одного проекта может быть несколько токенов, каждый из которых запускает отдельный процесс бота.

**Что нужно:**
- Переработать карточку проекта: вместо одного статуса показывать список токенов с их индивидуальными статусами
- Кнопки запуска/остановки должны принимать `tokenId` в теле запроса
- Эндпоинт `/api/projects/:id/bot/start` уже поддерживает `tokenId` в body — нужно передавать его из сценария
- Возможно добавить отдельный флоу: "Выбери токен → Запусти"

**Файлы:**
- `bots/новый/новый.json` — узлы `action-start`, `action-stop`, `action-restart`, `check-bot-status`
- `server/routes/botManagement/handlers/botStartHandler.ts`
- `server/routes/userProjectsTokens/handlers/tokens/getBotProjectTokensHandler.ts`

---

## 2. Команда `/help`

**Что нужно:** Добавить второй `command_trigger` узел с командой `/help` который показывает описание всех доступных команд бота.

**Пример текста:**
```
📖 Справка по командам:

/start — Список ваших проектов
/help — Эта справка
```

**Файлы:**
- `bots/новый/новый.json` — добавить узел `help-trigger` и `help-msg`
- `scripts/reorganize_sheets.py` — добавить в лист "Список проектов"

---

## 4. Пагинация проектов

**Проблема:** При большом количестве проектов (> 10) список динамических кнопок становится огромным и неудобным.

**Что нужно:**
- Добавить параметры `limit` и `offset` в `GET /api/bot/projects`
- Добавить кнопки "← Пред" / "След →" в `projects-actions-keyboard`
- Хранить текущую страницу в `user_data` как переменную `projects_page`
- Обновить `fetch-projects` чтобы передавал `offset=projects_page*limit`

**Файлы:**
- `server/routes/userProjectsTokens/handlers/projects/getBotProjectsHandler.ts`
- `bots/новый/новый.json` — узлы `fetch-projects`, `projects-actions-keyboard`

---

## 5. Тест на `__dynamic__` в `KeyboardLayoutEditor`

**Что нужно:** Добавить тесты которые проверяют:
- Перемещение блока `__dynamic__` корректно сохраняется в `keyboardLayout`
- `splitButtonsByDynamicPosition` правильно разбивает кнопки при разных позициях `__dynamic__`
- Генератор Python корректно генерирует кнопки в правильном порядке (статические до + динамические + статические после)

**Файлы:**
- `lib/tests/test-phase-dynamic-buttons-b.ts` — добавить тесты G04-G06
- `lib/templates/keyboard/keyboard.renderer.ts` — покрыть `splitButtonsByDynamicPosition`

---

## 6. Dot-notation глубже одного уровня ✅ Выполнено

**Проблема:** `init_all_user_vars` разворачивал dict-значения только на один уровень (`a.b` работало, `a.b.c` — нет).

**Реализовано:** Рекурсивная функция `_flatten_dict` с защитой `max_depth=5`:
```python
def _flatten_dict(_prefix, _obj, _result, _depth=0, _max_depth=5):
    if _depth > _max_depth: return
    if isinstance(_obj, dict):
        for _dk, _dv in _obj.items():
            _flatten_dict(f"{_prefix}.{_dk}", _dv, _result, _depth + 1, _max_depth)
    elif isinstance(_obj, (str, int, float, bool)) and _obj is not None:
        _result[_prefix] = str(_obj)
```

Теперь работает:
- `project_detail.name` → "Новый проект" (1 уровень)
- `token_status.status` → "stopped" (1 уровень)
- `token_status.instance.botName` → "блогстотеп" (2 уровня)
- `api.result.user.name` → "Иван" (3 уровня)

**Файлы:**
- `lib/templates/utils/utils.py.jinja2` — функция `init_all_user_vars`, рекурсивный `_flatten_dict`
- `lib/tests/test-phase4-condition.ts` — тесты W08-W10
- `lib/tests/test-phase-bot-manager-scenario-2.ts` — тесты R01-R03

---

## 7. Обновление канваса при перетаскивании в панели

**Проблема:** При перетаскивании кнопок в `KeyboardLayoutEditor` канвас обновляется только после сохранения (потеря фокуса). Нужно real-time обновление.

**Что нужно:** Убедиться что `onLayoutChange` вызывается при каждом `moveButton` и изменение немедленно отражается в `node.data.keyboardLayout` → канвас перерисовывается.

**Файлы:**
- `client/components/editor/properties/hooks/useKeyboardLayout.ts`
- `client/components/editor/properties/components/keyboard/keyboard-layout-editor.tsx`

---

## 8. Счётчик рядов в `KeyboardLayoutEditor` при смешанном режиме

**Проблема:** Заголовок показывает "Ручная: 2 ряда" включая виртуальный ряд `__dynamic__`. Это вводит в заблуждение.

**Что нужно:** Не считать ряд `__dynamic__` при отображении счётчика:
```
Ручная: 1 ряд + ⚡ динамические
```

**Файлы:**
- `client/components/editor/properties/components/keyboard/keyboard-layout-editor.tsx` — блок `CardDescription`
- `client/components/editor/properties/utils/keyboard-layout-utils.ts` — добавить `countRealRows(layout)`
