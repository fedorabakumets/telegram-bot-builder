"""
@fileoverview Скрипт исправления 4 UI-проблем в project.json бота новый_бот_1_242_163.

Проблема 1: Кнопки пар отображаются в столбик — dynamicButtons.columns должно быть 2.
Проблема 2: Буквы "П" и "В" съедаются эмодзи в bot-msg-ask-amount.
Проблема 3: Текст загрузки "через ботов" — нужен нейтральный вариант.
Проблема 4: Нет заголовков "Боты:" и "Сайты:" в результатах + убрать кнопку "Боты".
"""

import json
import os
import sys

# Путь к project.json
PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)


def find_node(data, node_id):
    """
    Рекурсивно ищет ноду по id во всех sheets.
    @param data - корневой объект project.json
    @param node_id - идентификатор ноды
    @returns найденная нода или None
    """
    for sheet in data.get("sheets", []):
        for node in sheet.get("nodes", []):
            if node.get("id") == node_id:
                return node
    return None


def fix_1_dynamic_buttons_columns(data):
    """
    Проблема 1: Устанавливает dynamicButtons.columns = 2 для bot-msg-menu.
    Кнопки пар должны отображаться в ряд (по 2), а не в столбик.
    """
    node = find_node(data, "bot-msg-menu")
    if not node:
        print("[ОШИБКА] Нода bot-msg-menu не найдена!")
        return False

    db = node["data"].get("dynamicButtons", {})
    old_columns = db.get("columns")
    if old_columns == 2:
        print(f"[OK] bot-msg-menu: dynamicButtons.columns уже = 2")
        return True

    node["data"]["dynamicButtons"]["columns"] = 2
    print(f"[FIX 1] bot-msg-menu: dynamicButtons.columns {old_columns} → 2")
    return True


def fix_2_emoji_eating_letters(data):
    """
    Проблема 2: Эмодзи 📊 и 💰 съедают следующую букву.
    В JSON уже записано без букв: "📊 ара:" и "💰 ыбери".
    Исправляем messageText — убираем эмодзи, оставляем чистый текст.
    """
    node = find_node(data, "bot-msg-ask-amount")
    if not node:
        print("[ОШИБКА] Нода bot-msg-ask-amount не найдена!")
        return False

    old_text = node["data"].get("messageText", "")
    new_text = (
        "{compare_title}\n\n"
        "Пара: <b>{selected_from_name} → {selected_to_name}</b>\n\n"
        "Выбери сумму или введи свою (в рублях):"
    )

    if old_text == new_text:
        print("[OK] bot-msg-ask-amount: messageText уже исправлен")
        return True

    node["data"]["messageText"] = new_text
    print(f"[FIX 2] bot-msg-ask-amount: убраны эмодзи из messageText")
    print(f"        Было: {repr(old_text[:80])}...")
    print(f"        Стало: {repr(new_text[:80])}...")
    return True


def fix_3_loading_message(data):
    """
    Проблема 3: Текст загрузки "через ботов" не подходит для mode=all.
    Заменяем на нейтральный вариант "Собираю курсы обменников...".
    """
    node = find_node(data, "bot-msg-loading")
    if not node:
        print("[ОШИБКА] Нода bot-msg-loading не найдена!")
        return False

    old_text = node["data"].get("messageText", "")
    new_text = "⏳ <b>Собираю курсы обменников...</b>\n\nЭто займёт не более минуты."

    if old_text == new_text:
        print("[OK] bot-msg-loading: messageText уже исправлен")
        return True

    node["data"]["messageText"] = new_text
    print(f"[FIX 3] bot-msg-loading: текст заменён на нейтральный")
    print(f"        Было: {repr(old_text)}")
    print(f"        Стало: {repr(new_text)}")
    return True


def fix_4_merge_format_and_keyboard(data):
    """
    Проблема 4a: Добавить заголовки "Боты:" и "Сайты:" в all-merge-format.
    Проблема 4b: Убрать кнопку "🤖 Боты" (btn-compare-bots) из kb-compare-result.
    """
    # --- 4a: all-merge-format ---
    node_merge = find_node(data, "all-merge-format")
    if not node_merge:
        print("[ОШИБКА] Нода all-merge-format не найдена!")
        return False

    assignments = node_merge["data"].get("assignments", [])
    merge_assignment = None
    for a in assignments:
        if a.get("id") == "merge_all":
            merge_assignment = a
            break

    if not merge_assignment:
        print("[ОШИБКА] Присвоение merge_all не найдено в all-merge-format!")
        return False

    old_value = merge_assignment.get("value", "")
    new_value = "🤖 <b>Боты:</b>\n{bot_rates_text}\n🌐 <b>Сайты:</b>\n{rates_text}"

    if old_value == new_value:
        print("[OK] all-merge-format: value уже исправлен")
    else:
        merge_assignment["value"] = new_value
        print(f"[FIX 4a] all-merge-format: добавлены заголовки секций")
        print(f"         Было: {repr(old_value)}")
        print(f"         Стало: {repr(new_value)}")

    # --- 4b: kb-compare-result — убрать кнопку btn-compare-bots ---
    node_kb = find_node(data, "kb-compare-result")
    if not node_kb:
        print("[ОШИБКА] Нода kb-compare-result не найдена!")
        return False

    buttons = node_kb["data"].get("buttons", [])
    btn_index = None
    for i, btn in enumerate(buttons):
        if btn.get("id") == "btn-compare-bots":
            btn_index = i
            break

    if btn_index is None:
        print("[OK] kb-compare-result: кнопка btn-compare-bots уже удалена")
    else:
        buttons.pop(btn_index)
        print(f"[FIX 4b] kb-compare-result: удалена кнопка '🤖 Боты' (btn-compare-bots)")

    # Убрать btn-compare-bots из keyboardLayout.rows
    layout = node_kb["data"].get("keyboardLayout", {})
    rows = layout.get("rows", [])
    modified_rows = False
    new_rows = []
    for row in rows:
        btn_ids = row.get("buttonIds", [])
        if "btn-compare-bots" in btn_ids:
            btn_ids = [b for b in btn_ids if b != "btn-compare-bots"]
            modified_rows = True
            if btn_ids:
                new_rows.append({"buttonIds": btn_ids})
            # Если ряд пустой — не добавляем
        else:
            new_rows.append(row)

    if modified_rows:
        layout["rows"] = new_rows
        print(f"[FIX 4b] kb-compare-result: удалена btn-compare-bots из keyboardLayout")

    return True


def main():
    """Основная функция: загружает JSON, применяет все 4 исправления, сохраняет."""
    print(f"Загрузка: {PROJECT_PATH}")
    if not os.path.exists(PROJECT_PATH):
        print(f"[ОШИБКА] Файл не найден: {PROJECT_PATH}")
        sys.exit(1)

    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Загружено sheets: {len(data.get('sheets', []))}")
    print("=" * 60)

    # Применяем все исправления
    fix_1_dynamic_buttons_columns(data)
    print()
    fix_2_emoji_eating_letters(data)
    print()
    fix_3_loading_message(data)
    print()
    fix_4_merge_format_and_keyboard(data)

    print()
    print("=" * 60)

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Сохранено: {PROJECT_PATH}")

    # Верификация — перечитываем и проверяем
    print("\n--- Верификация ---")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        check = json.load(f)

    node = find_node(check, "bot-msg-menu")
    cols = node["data"]["dynamicButtons"]["columns"]
    assert cols == 2, f"bot-msg-menu columns = {cols}, ожидалось 2"
    print(f"✓ bot-msg-menu dynamicButtons.columns = {cols}")

    node = find_node(check, "bot-msg-ask-amount")
    text = node["data"]["messageText"]
    assert "📊" not in text and "💰" not in text, f"Эмодзи не убраны: {text[:50]}"
    assert "Пара:" in text and "Выбери сумму" in text
    print(f"✓ bot-msg-ask-amount: эмодзи убраны, текст корректен")

    node = find_node(check, "bot-msg-loading")
    text = node["data"]["messageText"]
    assert "обменников" in text, f"Текст не обновлён: {text}"
    assert "через ботов" not in text
    print(f"✓ bot-msg-loading: нейтральный текст")

    node = find_node(check, "all-merge-format")
    val = node["data"]["assignments"][0]["value"]
    assert "🤖 <b>Боты:</b>" in val and "🌐 <b>Сайты:</b>" in val
    print(f"✓ all-merge-format: заголовки секций добавлены")

    node = find_node(check, "kb-compare-result")
    btn_ids = [b["id"] for b in node["data"]["buttons"]]
    assert "btn-compare-bots" not in btn_ids, f"Кнопка не удалена: {btn_ids}"
    layout_ids = []
    for row in node["data"]["keyboardLayout"]["rows"]:
        layout_ids.extend(row["buttonIds"])
    assert "btn-compare-bots" not in layout_ids
    print(f"✓ kb-compare-result: кнопка 'Боты' удалена")

    print("\n✅ Все 4 проблемы исправлены и верифицированы!")


if __name__ == "__main__":
    main()
