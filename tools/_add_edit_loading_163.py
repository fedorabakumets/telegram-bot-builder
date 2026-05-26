"""
Скрипт для модификации project.json бота новый_бот_1_242_163:
1. Обновляет ноду bot-msg-loading: добавляет saveMessageIdTo, обновляет текст
2. Добавляет ноду bot-edit-loading (type: edit_message) на лист sheet-bots
3. Изменяет autoTransitionTo в bot-setv-calc на bot-edit-loading
4. Идемпотентный — проверяет что bot-edit-loading ещё не существует
"""

import json
import os
import sys

PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)

def find_node_in_sheets(data, node_id):
    """Находит ноду по id во всех листах, возвращает (sheet_index, node_index)"""
    for si, sheet in enumerate(data["sheets"]):
        for ni, node in enumerate(sheet["nodes"]):
            if node["id"] == node_id:
                return si, ni
    return None, None


def main():
    print(f"Читаю: {PROJECT_PATH}")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # --- Проверка идемпотентности ---
    si_check, ni_check = find_node_in_sheets(data, "bot-edit-loading")
    if si_check is not None:
        print("✅ Нода bot-edit-loading уже существует. Пропускаю.")
        sys.exit(0)

    # --- 1. Обновить bot-msg-loading ---
    si_loading, ni_loading = find_node_in_sheets(data, "bot-msg-loading")
    if si_loading is None:
        print("❌ Нода bot-msg-loading не найдена!")
        sys.exit(1)

    node_loading = data["sheets"][si_loading]["nodes"][ni_loading]
    node_loading["data"]["saveMessageIdTo"] = "loading_msg_id"
    node_loading["data"]["messageText"] = (
        "⏳ <b>Собираю курсы обменников...</b>\n\n"
        "Это может занять до 3 минут."
    )
    print(f"✅ bot-msg-loading обновлена: saveMessageIdTo=loading_msg_id, текст обновлён")

    # --- 2. Изменить autoTransitionTo в bot-setv-calc ---
    si_calc, ni_calc = find_node_in_sheets(data, "bot-setv-calc")
    if si_calc is None:
        print("❌ Нода bot-setv-calc не найдена!")
        sys.exit(1)

    node_calc = data["sheets"][si_calc]["nodes"][ni_calc]
    old_target = node_calc["data"].get("autoTransitionTo", "")
    node_calc["data"]["autoTransitionTo"] = "bot-edit-loading"
    print(f"✅ bot-setv-calc: autoTransitionTo изменён с '{old_target}' на 'bot-edit-loading'")

    # --- 3. Добавить ноду bot-edit-loading на лист sheet-bots ---
    sheet_bots_idx = None
    for si, sheet in enumerate(data["sheets"]):
        if sheet["id"] == "sheet-bots":
            sheet_bots_idx = si
            break

    if sheet_bots_idx is None:
        print("❌ Лист sheet-bots не найден!")
        sys.exit(1)

    new_node = {
        "id": "bot-edit-loading",
        "type": "edit_message",
        "position": {"x": 6200, "y": 3200},
        "data": {
            "editMode": "both",
            "editMessageText": (
                "💱 <b>Сравнение курсов (тест)</b>\n\n"
                "💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n"
                "🔸 BTC Monopoly: <b>{monopoly_btc} BTC</b>"
            ),
            "editFormatMode": "html",
            "editMessageIdSource": "custom",
            "editMessageIdManual": "{loading_msg_id}",
            "editKeyboardMode": "remove",
            "autoTransitionTo": "",
            "enableAutoTransition": False
        }
    }

    data["sheets"][sheet_bots_idx]["nodes"].append(new_node)
    print(f"✅ Нода bot-edit-loading добавлена на лист sheet-bots")

    # --- 4. Сохранить ---
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Файл сохранён: {PROJECT_PATH}")

    # --- 5. Валидация ---
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        check = json.load(f)

    si_new, ni_new = find_node_in_sheets(check, "bot-edit-loading")
    assert si_new is not None, "bot-edit-loading не найдена после сохранения!"

    si_calc2, ni_calc2 = find_node_in_sheets(check, "bot-setv-calc")
    assert check["sheets"][si_calc2]["nodes"][ni_calc2]["data"]["autoTransitionTo"] == "bot-edit-loading"

    si_load2, ni_load2 = find_node_in_sheets(check, "bot-msg-loading")
    assert check["sheets"][si_load2]["nodes"][ni_load2]["data"].get("saveMessageIdTo") == "loading_msg_id"

    print("✅ Валидация пройдена успешно!")


if __name__ == "__main__":
    main()
