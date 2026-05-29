"""
@fileoverview Скрипт для исправления двух багов в ноде bot-msg-menu:
1. Съедается буква "В" — переносим "Выбери..." в compare_title
2. Нет кнопки "Назад" к хабу сравнения — добавляем статическую кнопку

Решение проблемы 1: вместо хранения "Выбери валютную пару..."
в messageText ноды bot-msg-menu, включаем этот текст в сам compare_title
в нодах bots-set-mode и all-set-mode.

Решение проблемы 2: добавляем кнопку "◀️ Назад" → msg-compare-hub
в массив buttons ноды bot-msg-menu.
"""

import json
import sys
import os

# Путь к project.json
PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)

# Кнопка "Назад" для добавления в bot-msg-menu
BACK_BUTTON = {
    "id": "btn-bot-menu-back-hub",
    "text": "◀️ Назад",
    "action": "goto",
    "target": "msg-compare-hub",
    "hideAfterClick": False,
    "skipDataCollection": False
}

# Новые значения compare_title (включают "Выбери...")
TITLES = {
    "bots-set-mode": "🤖 <b>Сравнение через ботов</b>\n\nВыбери валютную пару для сравнения:",
    "all-set-mode": "📊 <b>Сравнение ботов и сайтов</b>\n\nВыбери валютную пару для сравнения:"
}


def find_node(nodes, node_id):
    """
    Ищет ноду по id в плоском списке нод.
    @param nodes - список нод
    @param node_id - идентификатор ноды
    @returns найденная нода или None
    """
    for node in nodes:
        if node.get("id") == node_id:
            return node
    return None


def fix_bot_msg_menu(node):
    """
    Исправляет messageText и добавляет кнопку "Назад" в bot-msg-menu.
    @param node - нода bot-msg-menu
    @returns True если были изменения
    """
    changed = False

    # Проблема 1: обновляем messageText — теперь только переменная
    old_text = node["data"].get("messageText", "")
    new_text = "{compare_title}"
    if old_text != new_text:
        print(f"  [fix] messageText: '{old_text}' → '{new_text}'")
        node["data"]["messageText"] = new_text
        changed = True
    else:
        print(f"  [ok] messageText уже = '{new_text}'")

    # Проблема 2: добавляем кнопку "Назад" если её нет
    buttons = node["data"].get("buttons", [])
    has_back = any(b.get("id") == BACK_BUTTON["id"] for b in buttons)
    if not has_back:
        buttons.append(BACK_BUTTON)
        node["data"]["buttons"] = buttons
        print(f"  [fix] Добавлена кнопка '{BACK_BUTTON['text']}' → {BACK_BUTTON['target']}")
        changed = True
    else:
        print(f"  [ok] Кнопка '{BACK_BUTTON['text']}' уже существует")

    return changed


def fix_set_mode_node(node, node_id):
    """
    Обновляет значение compare_title в ноде set_variable.
    @param node - нода bots-set-mode или all-set-mode
    @param node_id - идентификатор ноды для выбора нового значения
    @returns True если были изменения
    """
    changed = False
    assignments = node["data"].get("assignments", [])

    for assignment in assignments:
        if assignment.get("variable") == "compare_title":
            old_value = assignment.get("value", "")
            new_value = TITLES[node_id]
            if old_value != new_value:
                print(f"  [fix] compare_title: '{old_value}' → '{new_value}'")
                assignment["value"] = new_value
                changed = True
            else:
                print(f"  [ok] compare_title уже актуален")
            break
    else:
        print(f"  [warn] Не найден assignment compare_title в {node_id}")

    return changed


def main():
    """
    Основная функция: читает project.json, применяет фиксы, сохраняет.
    @returns код завершения (0 = успех)
    """
    print(f"Читаю: {PROJECT_PATH}")

    if not os.path.exists(PROJECT_PATH):
        print(f"ОШИБКА: файл не найден: {PROJECT_PATH}")
        return 1

    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    # Собираем все ноды из всех sheets
    all_nodes = []
    for sheet in project.get("sheets", []):
        all_nodes.extend(sheet.get("nodes", []))

    total_changes = 0

    # 1. Исправляем bot-msg-menu
    print("\n--- bot-msg-menu ---")
    node = find_node(all_nodes, "bot-msg-menu")
    if node:
        if fix_bot_msg_menu(node):
            total_changes += 1
    else:
        print("  ОШИБКА: нода bot-msg-menu не найдена!")
        return 1

    # 2. Исправляем bots-set-mode
    print("\n--- bots-set-mode ---")
    node = find_node(all_nodes, "bots-set-mode")
    if node:
        if fix_set_mode_node(node, "bots-set-mode"):
            total_changes += 1
    else:
        print("  ОШИБКА: нода bots-set-mode не найдена!")
        return 1

    # 3. Исправляем all-set-mode
    print("\n--- all-set-mode ---")
    node = find_node(all_nodes, "all-set-mode")
    if node:
        if fix_set_mode_node(node, "all-set-mode"):
            total_changes += 1
    else:
        print("  ОШИБКА: нода all-set-mode не найдена!")
        return 1

    # Сохраняем
    if total_changes > 0:
        print(f"\nСохраняю {total_changes} изменение(й)...")
        with open(PROJECT_PATH, "w", encoding="utf-8") as f:
            json.dump(project, f, ensure_ascii=False, indent=2)

        # Валидация: перечитываем и проверяем JSON
        print("Валидация...")
        with open(PROJECT_PATH, "r", encoding="utf-8") as f:
            validated = json.load(f)

        # Проверяем что изменения применились
        for sheet in validated.get("sheets", []):
            for n in sheet.get("nodes", []):
                if n["id"] == "bot-msg-menu":
                    assert n["data"]["messageText"] == "{compare_title}", \
                        "messageText не обновился!"
                    assert any(b["id"] == "btn-bot-menu-back-hub" for b in n["data"]["buttons"]), \
                        "Кнопка Назад не добавлена!"
                elif n["id"] == "bots-set-mode":
                    for a in n["data"].get("assignments", []):
                        if a["variable"] == "compare_title":
                            assert "Выбери валютную пару" in a["value"], \
                                "bots-set-mode compare_title не обновился!"
                elif n["id"] == "all-set-mode":
                    for a in n["data"].get("assignments", []):
                        if a["variable"] == "compare_title":
                            assert "Выбери валютную пару" in a["value"], \
                                "all-set-mode compare_title не обновился!"

        print("✅ Валидация пройдена. Все изменения корректны.")
    else:
        print("\nНичего не изменено — всё уже актуально.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
