"""
Скрипт для унификации кнопок результатов и фикса кнопки "Назад" в kb-quick-amounts.
Модифицирует bots/новый_бот_1_242_163/project.json
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)


def fix_kb_compare_result(nodes):
    """
    Клавиатура kb-compare-result: убрать кнопки "📋 Сайты" и "🤖 Боты",
    обновить keyboardLayout.rows.
    """
    for node in nodes:
        if node.get("id") == "kb-compare-result":
            data = node["data"]
            
            # Удалить кнопки btn-full-list (📋 Сайты) и btn-compare-bots (🤖 Боты)
            buttons_to_remove = {"btn-full-list", "btn-compare-bots"}
            original_count = len(data["buttons"])
            data["buttons"] = [b for b in data["buttons"] if b["id"] not in buttons_to_remove]
            removed_count = original_count - len(data["buttons"])
            
            # Обновить keyboardLayout.rows
            data["keyboardLayout"]["rows"] = [
                {"buttonIds": ["btn-compare-refresh"]},
                {"buttonIds": ["btn-compare-new-amount", "btn-compare-another"]},
                {"buttonIds": ["btn-compare-back-menu"]}
            ]
            
            print(f"[kb-compare-result] Удалено кнопок: {removed_count}")
            print(f"  Осталось кнопок: {len(data['buttons'])}")
            print(f"  Новый layout: 3 ряда (1 + 2 + 1)")
            return True
    
    print("[kb-compare-result] НЕ НАЙДЕНА!")
    return False


def fix_bot_msg_result_keyboard(nodes):
    """
    Клавиатура bot-msg-result_keyboard_1779837310618_ku7jy2a2g: убрать кнопку "📋 Сайты",
    обновить keyboardLayout.rows.
    """
    kb_id = "bot-msg-result_keyboard_1779837310618_ku7jy2a2g"
    for node in nodes:
        if node.get("id") == kb_id:
            data = node["data"]
            
            # Удалить кнопку bot-btn-sites (📋 Сайты)
            buttons_to_remove = {"bot-btn-sites"}
            original_count = len(data["buttons"])
            data["buttons"] = [b for b in data["buttons"] if b["id"] not in buttons_to_remove]
            removed_count = original_count - len(data["buttons"])
            
            # Обновить keyboardLayout.rows
            data["keyboardLayout"]["rows"] = [
                {"buttonIds": ["bot-btn-refresh"]},
                {"buttonIds": ["bot-btn-new-amount", "bot-btn-new-pair"]},
                {"buttonIds": ["bot-btn-back-menu"]}
            ]
            
            print(f"[bot-msg-result_keyboard] Удалено кнопок: {removed_count}")
            print(f"  Осталось кнопок: {len(data['buttons'])}")
            print(f"  Новый layout: 3 ряда (1 + 2 + 1)")
            return True
    
    print(f"[bot-msg-result_keyboard] НЕ НАЙДЕНА!")
    return False


def fix_kb_quick_amounts(nodes):
    """
    Клавиатура kb-quick-amounts: кнопка "◀️ Назад" (btn-amt-back)
    target: msg-compare-menu → msg-compare-hub
    """
    for node in nodes:
        if node.get("id") == "kb-quick-amounts":
            data = node["data"]
            for btn in data["buttons"]:
                if btn["id"] == "btn-amt-back":
                    old_target = btn["target"]
                    btn["target"] = "msg-compare-hub"
                    print(f"[kb-quick-amounts] Кнопка '◀️ Назад': target '{old_target}' → 'msg-compare-hub'")
                    return True
            
            print("[kb-quick-amounts] Кнопка btn-amt-back НЕ НАЙДЕНА!")
            return False
    
    print("[kb-quick-amounts] НЕ НАЙДЕНА!")
    return False


def main():
    print(f"Загрузка: {PROJECT_PATH}")
    
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)
    
    # Собрать все ноды из всех sheets
    all_nodes = []
    sheets = project.get("sheets", [])
    for sheet in sheets:
        sheet_nodes = sheet.get("nodes", [])
        all_nodes.extend(sheet_nodes)
    
    if not all_nodes:
        print("ОШИБКА: Не удалось найти ноды в project.json")
        return
    
    print(f"Найдено sheets: {len(sheets)}, всего нод: {len(all_nodes)}")
    print()
    
    # Задача 1: kb-compare-result
    fix_kb_compare_result(all_nodes)
    print()
    
    # Задача 1: bot-msg-result keyboard
    fix_bot_msg_result_keyboard(all_nodes)
    print()
    
    # Задача 2: kb-quick-amounts
    fix_kb_quick_amounts(all_nodes)
    print()
    
    # Сохранить
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)
    
    print(f"Сохранено: {PROJECT_PATH}")


if __name__ == "__main__":
    main()
