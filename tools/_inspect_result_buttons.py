"""
Скрипт для анализа кнопок результатов сравнения в project.json.
Выводит кнопки 4 клавиатур для сравнения.
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

KEYBOARDS = [
    {
        "id": "kb-compare-result",
        "title": "1. kb-compare-result (результаты режима «Сайты»)",
    },
    {
        "id": "bot-msg-result_keyboard_1779837310618_ku7jy2a2g",
        "title": "2. bot-msg-result_keyboard (результаты режимов «Боты» и «Сравнить всё»)",
    },
    {
        "id": "kb-quick-amounts",
        "title": "3. kb-quick-amounts (выбор суммы для сайтов)",
    },
    {
        "id": "bot-msg-ask-amount_keyboard_1779837310618_st43lsdwb",
        "title": "4. bot-msg-ask-amount_keyboard (выбор суммы для ботов)",
    },
]


def find_node(nodes, node_id):
    for node in nodes:
        if node.get("id") == node_id:
            return node
    return None


def main():
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    all_nodes = []
    for sheet in project.get("sheets", []):
        all_nodes.extend(sheet.get("nodes", []))

    for kb_info in KEYBOARDS:
        kb_id = kb_info["id"]
        title = kb_info["title"]

        print("=" * 70)
        print(f"  {title}")
        print(f"  id: {kb_id}")
        print("=" * 70)

        node = find_node(all_nodes, kb_id)
        if not node:
            print("  ❌ Клавиатура НЕ НАЙДЕНА!\n")
            continue

        buttons = node.get("data", {}).get("buttons", [])
        layout = node.get("data", {}).get("keyboardLayout", {})
        rows = layout.get("rows", [])

        print(f"  Кнопок: {len(buttons)}")
        print()

        # Вывод по рядам
        btn_map = {b["id"]: b for b in buttons}
        for row_idx, row in enumerate(rows):
            btn_ids = row.get("buttonIds", [])
            row_texts = []
            for bid in btn_ids:
                btn = btn_map.get(bid)
                if btn:
                    row_texts.append(btn.get("text", "???"))
                else:
                    row_texts.append(f"[missing:{bid}]")
            print(f"  Ряд {row_idx + 1}: [ {' | '.join(row_texts)} ]")

        print()
        print(f"  {'#':<4} {'Текст':<22} {'Action':<8} {'Target'}")
        print(f"  {'-'*4} {'-'*22} {'-'*8} {'-'*40}")

        for i, btn in enumerate(buttons, 1):
            text = btn.get("text", "")
            action = btn.get("action", "")
            target = btn.get("target", "")
            url = btn.get("url", "")
            display_target = url if action == "url" else target
            print(f"  {i:<4} {text:<22} {action:<8} {display_target}")

        print()


if __name__ == "__main__":
    main()
