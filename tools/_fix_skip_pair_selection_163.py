"""
Скрипт для удаления шага выбора пары из flow сравнения курсов.
После выбора режима (боты/сайты/всё) сразу переходим к выбору суммы.

Изменения:
1. bots-set-mode: autoTransitionTo → bot-msg-ask-amount + хардкод переменных пары
2. sites-set-mode: autoTransitionTo → bot-msg-ask-amount + хардкод переменных пары
3. all-set-mode: autoTransitionTo → bot-msg-ask-amount + хардкод переменных пары
4. bot-msg-ask-amount: новый messageText
5. bot-msg-result: новый messageText
6. msg-compare-result: новый messageText
7. Кнопка "Назад" в bot-msg-ask-amount keyboard → msg-compare-hub
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

# Переменные пары, которые раньше устанавливал bot-cb-pair
PAIR_ASSIGNMENTS = [
    {"id": "pair_from_name", "mode": "text", "value": "СБП/Карта", "variable": "selected_from_name"},
    {"id": "pair_to_name", "mode": "text", "value": "Bitcoin", "variable": "selected_to_name"},
    {"id": "pair_from_id", "mode": "text", "value": "2", "variable": "selected_from_id"},
    {"id": "pair_to_id", "mode": "text", "value": "5", "variable": "selected_to_id"},
]

changes_log = []


def find_node(nodes_list, node_id):
    """Рекурсивно ищет ноду по id во всех sheets"""
    for node in nodes_list:
        if node.get("id") == node_id:
            return node
    return None


def find_node_in_project(project, node_id):
    """Ищет ноду по id во всех sheets проекта"""
    for sheet in project.get("sheets", []):
        node = find_node(sheet.get("nodes", []), node_id)
        if node:
            return node
    return None


def update_set_mode_node(project, node_id, new_target="bot-msg-ask-amount"):
    """Обновляет set_variable ноду: меняет autoTransitionTo и добавляет assignments для пары"""
    node = find_node_in_project(project, node_id)
    if not node:
        print(f"  ⚠️  Нода '{node_id}' не найдена!")
        return

    old_target = node["data"].get("autoTransitionTo", "")
    node["data"]["autoTransitionTo"] = new_target
    changes_log.append(f"  {node_id}: autoTransitionTo '{old_target}' → '{new_target}'")

    # Добавляем assignments для переменных пары
    existing_assignments = node["data"].get("assignments", [])
    existing_vars = {a["variable"] for a in existing_assignments}

    added = []
    for assignment in PAIR_ASSIGNMENTS:
        if assignment["variable"] not in existing_vars:
            existing_assignments.append(assignment)
            added.append(assignment["variable"])

    node["data"]["assignments"] = existing_assignments
    if added:
        changes_log.append(f"  {node_id}: добавлены assignments: {', '.join(added)}")


def update_message_text(project, node_id, old_text, new_text):
    """Обновляет messageText у ноды"""
    node = find_node_in_project(project, node_id)
    if not node:
        print(f"  ⚠️  Нода '{node_id}' не найдена!")
        return

    current_text = node["data"].get("messageText", "")
    if current_text == old_text:
        node["data"]["messageText"] = new_text
        changes_log.append(f"  {node_id}: messageText обновлён")
    else:
        # Всё равно обновляем, но предупреждаем
        node["data"]["messageText"] = new_text
        changes_log.append(f"  {node_id}: messageText обновлён (текст отличался от ожидаемого)")


def update_back_button(project, keyboard_id, button_text, new_target):
    """Обновляет target кнопки в клавиатуре"""
    node = find_node_in_project(project, keyboard_id)
    if not node:
        print(f"  ⚠️  Клавиатура '{keyboard_id}' не найдена!")
        return

    for btn in node["data"].get("buttons", []):
        if btn.get("text") == button_text:
            old_target = btn.get("target", "")
            btn["target"] = new_target
            changes_log.append(f"  {keyboard_id}: кнопка '{button_text}' target '{old_target}' → '{new_target}'")
            return

    print(f"  ⚠️  Кнопка '{button_text}' не найдена в '{keyboard_id}'!")


def main():
    print("=" * 60)
    print("🔧 Убираем шаг выбора пары из flow сравнения курсов")
    print("=" * 60)

    # Загружаем проект
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    print(f"\n📂 Загружен: {PROJECT_PATH}")
    print(f"   Sheets: {len(project.get('sheets', []))}")

    # 1. bots-set-mode → bot-msg-ask-amount
    print("\n1️⃣  Обновляем bots-set-mode...")
    update_set_mode_node(project, "bots-set-mode", "bot-msg-ask-amount")

    # 2. sites-set-mode → bot-msg-ask-amount
    print("\n2️⃣  Обновляем sites-set-mode...")
    update_set_mode_node(project, "sites-set-mode", "bot-msg-ask-amount")

    # 3. all-set-mode → bot-msg-ask-amount
    print("\n3️⃣  Обновляем all-set-mode...")
    update_set_mode_node(project, "all-set-mode", "bot-msg-ask-amount")

    # 4. bot-msg-ask-amount — новый messageText
    print("\n4️⃣  Обновляем bot-msg-ask-amount messageText...")
    update_message_text(
        project,
        "bot-msg-ask-amount",
        "{compare_title}\n\n📊 Пара: <b>{selected_from_name} → {selected_to_name}</b>\n\n💰 Выбери сумму или введи свою (в рублях):",
        "💱 <b>Сравнение курсов</b>\n\n📊 <b>СБП/Карта → Bitcoin</b>\n\n💰 Выбери сумму или введи свою (в рублях):"
    )

    # 5. bot-msg-result — новый messageText
    print("\n5️⃣  Обновляем bot-msg-result messageText...")
    update_message_text(
        project,
        "bot-msg-result",
        "💱 <b>Сравнение курсов</b>\n\n💰 Сумма: <b>{user_amount_fmt}</b> \n\n{bot_rates_text}",
        "💱 <b>Сравнение курсов</b>\n\n📊 <b>СБП/Карта → Bitcoin</b>\n💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n{bot_rates_text}"
    )

    # 6. msg-compare-result — новый messageText
    print("\n6️⃣  Обновляем msg-compare-result messageText...")
    update_message_text(
        project,
        "msg-compare-result",
        "💱 <b>Сравнение курсов</b>\n\n📊 Пара: <b>{selected_from_name} → BTC</b>\n💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n{rates_text}\n👆 <i>Нажми на название для перехода</i>",
        "💱 <b>Сравнение курсов</b>\n\n📊 <b>СБП/Карта → Bitcoin</b>\n💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n{rates_text}\n👆 <i>Нажми на название для перехода</i>"
    )

    # 7. Кнопка "Назад" в bot-msg-ask-amount → msg-compare-hub
    print("\n7️⃣  Обновляем кнопку 'Назад' в bot-msg-ask-amount...")
    update_back_button(
        project,
        "bot-msg-ask-amount_keyboard_1779837310618_st43lsdwb",
        "◀️ Назад",
        "msg-compare-hub"
    )

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("✅ Все изменения применены:")
    print("=" * 60)
    for line in changes_log:
        print(line)

    print(f"\n💾 Сохранено: {PROJECT_PATH}")
    print("\n📋 Итог: шаг выбора пары (bot-msg-menu → bot-cb-pair) пропускается.")
    print("   Flow теперь: msg-compare-hub → set-mode → bot-msg-ask-amount")


if __name__ == "__main__":
    main()
