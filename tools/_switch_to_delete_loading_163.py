"""
Скрипт для модификации project.json бота новый_бот_1_242_163:
1. Удаляет ноду bot-edit-loading (если существует)
2. Добавляет ноду bot-delete-loading (type: delete_message)
3. Изменяет autoTransitionTo в bot-setv-parse-monopoly на bot-delete-loading
4. bot-delete-loading ведёт на bot-setv-calc
5. bot-setv-calc ведёт на bot-msg-result (проверяем)
6. Обновляет текст и saveMessageIdTo в bot-msg-loading
Идемпотентный — проверяет что bot-delete-loading ещё не существует.
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
    si_check, ni_check = find_node_in_sheets(data, "bot-delete-loading")
    if si_check is not None:
        print("✅ Нода bot-delete-loading уже существует. Пропускаю.")
        sys.exit(0)

    # --- 1. Удалить bot-edit-loading (если есть) ---
    si_edit, ni_edit = find_node_in_sheets(data, "bot-edit-loading")
    if si_edit is not None:
        del data["sheets"][si_edit]["nodes"][ni_edit]
        print("✅ Нода bot-edit-loading удалена")
    else:
        print("ℹ️  Нода bot-edit-loading не найдена (уже удалена или не существовала)")

    # --- 2. Обновить bot-msg-loading ---
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
    print("✅ bot-msg-loading обновлена: saveMessageIdTo=loading_msg_id, текст обновлён")

    # --- 3. Изменить autoTransitionTo в bot-setv-parse-monopoly → bot-delete-loading ---
    si_parse, ni_parse = find_node_in_sheets(data, "bot-setv-parse-monopoly")
    if si_parse is None:
        print("❌ Нода bot-setv-parse-monopoly не найдена!")
        sys.exit(1)

    node_parse = data["sheets"][si_parse]["nodes"][ni_parse]
    old_target_parse = node_parse["data"].get("autoTransitionTo", "")
    node_parse["data"]["autoTransitionTo"] = "bot-delete-loading"
    print(f"✅ bot-setv-parse-monopoly: autoTransitionTo изменён с '{old_target_parse}' на 'bot-delete-loading'")

    # --- 4. Убедиться что bot-setv-calc ведёт на bot-msg-result ---
    si_calc, ni_calc = find_node_in_sheets(data, "bot-setv-calc")
    if si_calc is None:
        print("❌ Нода bot-setv-calc не найдена!")
        sys.exit(1)

    node_calc = data["sheets"][si_calc]["nodes"][ni_calc]
    current_calc_target = node_calc["data"].get("autoTransitionTo", "")
    if current_calc_target != "bot-msg-result":
        node_calc["data"]["autoTransitionTo"] = "bot-msg-result"
        print(f"✅ bot-setv-calc: autoTransitionTo изменён с '{current_calc_target}' на 'bot-msg-result'")
    else:
        print("✅ bot-setv-calc: autoTransitionTo уже указывает на 'bot-msg-result'")

    # --- 5. Добавить ноду bot-delete-loading на лист sheet-bots ---
    sheet_bots_idx = None
    for si, sheet in enumerate(data["sheets"]):
        if sheet["id"] == "sheet-bots":
            sheet_bots_idx = si
            break

    if sheet_bots_idx is None:
        print("❌ Лист sheet-bots не найден!")
        sys.exit(1)

    new_node = {
        "id": "bot-delete-loading",
        "type": "delete_message",
        "position": {"x": 6200, "y": 2900},
        "data": {
            "messageIdSource": "custom",
            "messageIdManual": "{loading_msg_id}",
            "chatIdSource": "current_chat",
            "chatIdManual": "",
            "ignoreErrors": True,
            "bulkDelete": False,
            "bulkMessageIdsVariable": "",
            "autoTransitionTo": "bot-setv-calc",
            "enableAutoTransition": True
        }
    }

    data["sheets"][sheet_bots_idx]["nodes"].append(new_node)
    print("✅ Нода bot-delete-loading добавлена на лист sheet-bots")

    # --- 6. Сохранить ---
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Файл сохранён: {PROJECT_PATH}")

    # --- 7. Валидация ---
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        check = json.load(f)

    # Проверяем bot-delete-loading существует
    si_new, ni_new = find_node_in_sheets(check, "bot-delete-loading")
    assert si_new is not None, "bot-delete-loading не найдена после сохранения!"
    node_del = check["sheets"][si_new]["nodes"][ni_new]
    assert node_del["type"] == "delete_message", f"Тип ноды неверный: {node_del['type']}"
    assert node_del["data"]["autoTransitionTo"] == "bot-setv-calc"
    assert node_del["data"]["messageIdManual"] == "{loading_msg_id}"

    # Проверяем bot-edit-loading удалена
    si_old, _ = find_node_in_sheets(check, "bot-edit-loading")
    assert si_old is None, "bot-edit-loading всё ещё существует!"

    # Проверяем bot-setv-parse-monopoly → bot-delete-loading
    si_p, ni_p = find_node_in_sheets(check, "bot-setv-parse-monopoly")
    assert check["sheets"][si_p]["nodes"][ni_p]["data"]["autoTransitionTo"] == "bot-delete-loading"

    # Проверяем bot-setv-calc → bot-msg-result
    si_c, ni_c = find_node_in_sheets(check, "bot-setv-calc")
    assert check["sheets"][si_c]["nodes"][ni_c]["data"]["autoTransitionTo"] == "bot-msg-result"

    # Проверяем bot-msg-loading
    si_l, ni_l = find_node_in_sheets(check, "bot-msg-loading")
    assert check["sheets"][si_l]["nodes"][ni_l]["data"].get("saveMessageIdTo") == "loading_msg_id"
    assert "до 3 минут" in check["sheets"][si_l]["nodes"][ni_l]["data"]["messageText"]

    print("✅ Валидация пройдена успешно!")
    print("\n📋 Итоговая цепочка:")
    print("   bot-setv-init → bot-msg-loading (saveMessageIdTo: loading_msg_id)")
    print("   → bot-ub-monopoly-start → bot-ub-monopoly-buy → bot-ub-monopoly-amount")
    print("   → bot-setv-parse-monopoly → bot-delete-loading → bot-setv-calc → bot-msg-result")


if __name__ == "__main__":
    main()
