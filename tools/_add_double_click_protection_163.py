"""
@fileoverview Защита от двойного нажатия в цепочке сравнения курсов.

Добавляет флаг compare_in_progress который предотвращает повторный запуск
сравнения пока предыдущее ещё выполняется.

Изменения:
1. Обновляет текст загрузки в bot-msg-loading
2. Добавляет ноду bot-cond-in-progress (condition) — проверка флага
3. Добавляет ноду bot-answer-busy (answer_callback_query) — ответ "уже выполняется"
4. Перенаправляет все входящие ноды с bot-setv-init на bot-cond-in-progress
5. Добавляет установку флага в bot-setv-init (в начало assignments)
6. Добавляет сброс флага в bot-setv-format (в конец assignments)
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)

# Ноды которые нужно перенаправить с bot-setv-init на bot-cond-in-progress
REDIRECT_NODES_AUTO_TRANSITION = [
    "bot-setv-amt-5000",
    "bot-setv-amt-10000",
    "bot-setv-amt-50000",
    "bot-setv-amt-100000",
    "bot-setv-amt-500000",
]

NEW_LOADING_TEXT = "⏳ <b>Собираю курсы обменников...</b>\n\nЭто займёт не более минуты."

COND_IN_PROGRESS_ID = "bot-cond-in-progress"
ANSWER_BUSY_ID = "bot-answer-busy"


def find_sheet(data, sheet_id):
    """
    Находит лист по id
    @param data - полный JSON проекта
    @param sheet_id - идентификатор листа
    @returns найденный лист или None
    """
    for s in data["sheets"]:
        if s.get("id") == sheet_id:
            return s
    return None


def find_node(sheet, node_id):
    """
    Находит ноду по id в листе
    @param sheet - лист с нодами
    @param node_id - идентификатор ноды
    @returns найденная нода или None
    """
    for node in sheet["nodes"]:
        if node["id"] == node_id:
            return node
    return None


def update_loading_text(sheet):
    """
    Задача 1: Обновляет текст загрузки в bot-msg-loading
    @param sheet - лист с нодами
    """
    node = find_node(sheet, "bot-msg-loading")
    if not node:
        print("❌ Нода bot-msg-loading не найдена!")
        return False

    old_text = node["data"]["messageText"]
    node["data"]["messageText"] = NEW_LOADING_TEXT
    print(f"✅ bot-msg-loading: messageText обновлён")
    print(f"   Было: {repr(old_text)}")
    print(f"   Стало: {repr(NEW_LOADING_TEXT)}")
    return True


def add_condition_node(sheet):
    """
    Задача 2.1: Добавляет ноду bot-cond-in-progress (condition)
    @param sheet - лист с нодами
    """
    existing_ids = {n["id"] for n in sheet["nodes"]}
    if COND_IN_PROGRESS_ID in existing_ids:
        print(f"⚠️  Нода {COND_IN_PROGRESS_ID} уже существует, пропускаем")
        return True

    cond_node = {
        "id": COND_IN_PROGRESS_ID,
        "type": "condition",
        "position": {"x": 5600, "y": 1800},
        "data": {
            "branches": [
                {
                    "id": "branch_busy",
                    "label": "Уже выполняется",
                    "conditions": [
                        {
                            "variable": "compare_in_progress",
                            "operator": "equals",
                            "value": "1",
                        }
                    ],
                    "target": ANSWER_BUSY_ID,
                },
                {
                    "id": "branch_free",
                    "label": "Свободен",
                    "conditions": [],
                    "target": "bot-setv-init",
                },
            ],
            "autoTransitionTo": "",
            "enableAutoTransition": False,
        },
    }

    sheet["nodes"].append(cond_node)
    print(f"✅ Добавлена нода {COND_IN_PROGRESS_ID} (condition)")
    return True


def add_answer_busy_node(sheet):
    """
    Задача 2.2: Добавляет ноду bot-answer-busy (answer_callback_query)
    @param sheet - лист с нодами
    """
    existing_ids = {n["id"] for n in sheet["nodes"]}
    if ANSWER_BUSY_ID in existing_ids:
        print(f"⚠️  Нода {ANSWER_BUSY_ID} уже существует, пропускаем")
        return True

    answer_node = {
        "id": ANSWER_BUSY_ID,
        "type": "answer_callback_query",
        "position": {"x": 5600, "y": 2000},
        "data": {
            "answerText": "⏳ Сравнение уже выполняется, подождите...",
            "showAlert": False,
            "autoTransitionTo": "",
            "enableAutoTransition": False,
        },
    }

    sheet["nodes"].append(answer_node)
    print(f"✅ Добавлена нода {ANSWER_BUSY_ID} (answer_callback_query)")
    return True


def redirect_auto_transitions(sheet):
    """
    Задача 2.3: Перенаправляет autoTransitionTo с bot-setv-init на bot-cond-in-progress
    для всех нод bot-setv-amt-*
    @param sheet - лист с нодами
    """
    redirected = 0

    for node_id in REDIRECT_NODES_AUTO_TRANSITION:
        node = find_node(sheet, node_id)
        if not node:
            print(f"⚠️  Нода {node_id} не найдена!")
            continue

        old_target = node["data"].get("autoTransitionTo", "")
        if old_target == COND_IN_PROGRESS_ID:
            print(f"   {node_id}: уже перенаправлена")
            redirected += 1
            continue

        node["data"]["autoTransitionTo"] = COND_IN_PROGRESS_ID
        print(f"✅ {node_id}: autoTransitionTo → {COND_IN_PROGRESS_ID}")
        redirected += 1

    return redirected


def redirect_cond_validate(sheet):
    """
    Задача 2.3: Перенаправляет ветку bot-cond-validate с bot-setv-init на bot-cond-in-progress
    @param sheet - лист с нодами
    """
    node = find_node(sheet, "bot-cond-validate")
    if not node:
        print("❌ Нода bot-cond-validate не найдена!")
        return False

    branches = node["data"].get("branches", [])
    redirected = False
    for branch in branches:
        if branch.get("target") == "bot-setv-init":
            branch["target"] = COND_IN_PROGRESS_ID
            print(f"✅ bot-cond-validate (branch {branch['id']}): target → {COND_IN_PROGRESS_ID}")
            redirected = True

    if not redirected:
        # Проверяем может уже перенаправлена
        for branch in branches:
            if branch.get("target") == COND_IN_PROGRESS_ID:
                print(f"   bot-cond-validate: уже перенаправлена")
                return True
        print("⚠️  bot-cond-validate: ветка с target=bot-setv-init не найдена")

    return True


def redirect_refresh_button(sheet):
    """
    Задача 2.3: Перенаправляет кнопку "🔄 Обновить" в bot-msg-result
    с bot-setv-init на bot-cond-in-progress
    @param sheet - лист с нодами
    """
    node = find_node(sheet, "bot-msg-result")
    if not node:
        print("❌ Нода bot-msg-result не найдена!")
        return False

    buttons = node["data"].get("buttons", [])
    for btn in buttons:
        if btn.get("id") == "bot-btn-refresh":
            old_target = btn.get("target", "")
            if old_target == COND_IN_PROGRESS_ID:
                print(f"   bot-msg-result кнопка 'Обновить': уже перенаправлена")
                return True
            btn["target"] = COND_IN_PROGRESS_ID
            print(f"✅ bot-msg-result кнопка 'Обновить': target → {COND_IN_PROGRESS_ID}")
            return True

    print("⚠️  Кнопка bot-btn-refresh не найдена в bot-msg-result")
    return False


def add_set_in_progress(sheet):
    """
    Задача 2.4: Добавляет установку флага compare_in_progress=1 в начало assignments bot-setv-init
    @param sheet - лист с нодами
    """
    node = find_node(sheet, "bot-setv-init")
    if not node:
        print("❌ Нода bot-setv-init не найдена!")
        return False

    assignments = node["data"].get("assignments", [])

    # Проверяем что ещё не добавлено
    for a in assignments:
        if a.get("id") == "set_in_progress":
            print("   bot-setv-init: assignment set_in_progress уже существует")
            return True

    new_assignment = {
        "id": "set_in_progress",
        "mode": "text",
        "value": "1",
        "variable": "compare_in_progress",
    }

    assignments.insert(0, new_assignment)
    node["data"]["assignments"] = assignments
    print(f"✅ bot-setv-init: добавлен assignment set_in_progress в начало")
    return True


def add_reset_in_progress(sheet):
    """
    Задача 2.5: Добавляет сброс флага compare_in_progress=0 в конец assignments bot-setv-format
    @param sheet - лист с нодами
    """
    node = find_node(sheet, "bot-setv-format")
    if not node:
        print("❌ Нода bot-setv-format не найдена!")
        return False

    assignments = node["data"].get("assignments", [])

    # Проверяем что ещё не добавлено
    for a in assignments:
        if a.get("id") == "reset_in_progress":
            print("   bot-setv-format: assignment reset_in_progress уже существует")
            return True

    new_assignment = {
        "id": "reset_in_progress",
        "mode": "text",
        "value": "0",
        "variable": "compare_in_progress",
    }

    assignments.append(new_assignment)
    node["data"]["assignments"] = assignments
    print(f"✅ bot-setv-format: добавлен assignment reset_in_progress в конец")
    return True


def verify_redirects(sheet):
    """
    Проверяет что все перенаправления выполнены корректно
    @param sheet - лист с нодами
    """
    print("\n📋 Проверка перенаправлений:")
    errors = 0

    # Проверяем bot-setv-amt-* ноды
    for node_id in REDIRECT_NODES_AUTO_TRANSITION:
        node = find_node(sheet, node_id)
        if node:
            target = node["data"].get("autoTransitionTo", "")
            status = "✅" if target == COND_IN_PROGRESS_ID else "❌"
            if target != COND_IN_PROGRESS_ID:
                errors += 1
            print(f"   {status} {node_id} → {target}")

    # Проверяем bot-cond-validate
    node = find_node(sheet, "bot-cond-validate")
    if node:
        for branch in node["data"].get("branches", []):
            if branch.get("id") == "cv1":
                target = branch.get("target", "")
                status = "✅" if target == COND_IN_PROGRESS_ID else "❌"
                if target != COND_IN_PROGRESS_ID:
                    errors += 1
                print(f"   {status} bot-cond-validate (cv1) → {target}")

    # Проверяем кнопку Обновить
    node = find_node(sheet, "bot-msg-result")
    if node:
        for btn in node["data"].get("buttons", []):
            if btn.get("id") == "bot-btn-refresh":
                target = btn.get("target", "")
                status = "✅" if target == COND_IN_PROGRESS_ID else "❌"
                if target != COND_IN_PROGRESS_ID:
                    errors += 1
                print(f"   {status} bot-msg-result кнопка 'Обновить' → {target}")

    if errors == 0:
        print("\n✅ Все перенаправления корректны!")
    else:
        print(f"\n❌ Найдено ошибок: {errors}")

    return errors == 0


def main():
    """
    Основная функция: применяет все изменения для защиты от двойного нажатия
    """
    print("=" * 60)
    print("🛡️  Защита от двойного нажатия — bot-cond-in-progress")
    print("=" * 60)

    # Загружаем проект
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Находим лист сравнения через ботов
    sheet = find_sheet(data, "sheet-bots")
    if not sheet:
        print("❌ Лист sheet-bots не найден!")
        return

    print(f"\n📄 Лист: {sheet['name']} ({sheet['id']})")
    print(f"   Нод: {len(sheet['nodes'])}")

    # Задача 1: Обновить текст загрузки
    print("\n--- Задача 1: Обновление текста загрузки ---")
    update_loading_text(sheet)

    # Задача 2.1: Добавить ноду condition
    print("\n--- Задача 2.1: Добавление bot-cond-in-progress ---")
    add_condition_node(sheet)

    # Задача 2.2: Добавить ноду answer_callback_query
    print("\n--- Задача 2.2: Добавление bot-answer-busy ---")
    add_answer_busy_node(sheet)

    # Задача 2.3: Перенаправить входящие ноды
    print("\n--- Задача 2.3: Перенаправление входящих нод ---")
    redirect_auto_transitions(sheet)
    redirect_cond_validate(sheet)
    redirect_refresh_button(sheet)

    # Задача 2.4: Установка флага в bot-setv-init
    print("\n--- Задача 2.4: Установка флага в bot-setv-init ---")
    add_set_in_progress(sheet)

    # Задача 2.5: Сброс флага в bot-setv-format
    print("\n--- Задача 2.5: Сброс флага в bot-setv-format ---")
    add_reset_in_progress(sheet)

    # Сохраняем
    print("\n--- Сохранение ---")
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Валидация JSON
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        validated = json.load(f)

    print(f"✅ JSON валиден, файл сохранён: {PROJECT_PATH}")

    # Проверяем перенаправления
    sheet = find_sheet(validated, "sheet-bots")
    verify_redirects(sheet)

    # Итоговая цепочка
    print("\n📋 Новая цепочка:")
    print("   [bot-setv-amt-*] ──┐")
    print("   [bot-cond-validate] ─┤")
    print("   [кнопка Обновить] ───┘")
    print("          │")
    print("          ▼")
    print("   bot-cond-in-progress")
    print("     ├─ [busy] → bot-answer-busy (⏳ уже выполняется)")
    print("     └─ [free] → bot-setv-init (compare_in_progress=1)")
    print("                    │")
    print("                    ▼")
    print("              bot-msg-loading → ... → bot-setv-format (compare_in_progress=0)")
    print("                                         │")
    print("                                         ▼")
    print("                                   bot-msg-result")


if __name__ == "__main__":
    main()
