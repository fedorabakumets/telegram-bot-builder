"""
Фикс кросс-навигации в результатах сравнения (project 163).

Задача 1: Исправить targets кнопок навигации между режимами
- kb-compare-result: [🤖 Боты] → bot-msg-ask-amount (было bot-msg-menu)
- bot-msg-result_keyboard: [📋 Сайты] → msg-compare-ask-amount (было msg-compare-menu)

Задача 2: Заменить кнопку "🔄 Другая пара" на "🔄 Другой режим"
- kb-compare-result: target → msg-compare-hub
- bot-msg-result_keyboard: target → msg-compare-hub
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

def main():
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    changes = []

    # Ищем ноды-клавиатуры во всех sheets
    for sheet in data.get("sheets", []):
        for node in sheet.get("nodes", []):
            node_id = node.get("id", "")

            # --- kb-compare-result ---
            if node_id == "kb-compare-result":
                buttons = node["data"]["buttons"]
                for btn in buttons:
                    # Задача 1: [🤖 Боты] target bot-msg-menu → bot-msg-ask-amount
                    if btn.get("text") == "🤖 Боты" and btn.get("target") == "bot-msg-menu":
                        btn["target"] = "bot-msg-ask-amount"
                        changes.append(
                            f"[kb-compare-result] Кнопка '🤖 Боты': target bot-msg-menu → bot-msg-ask-amount"
                        )

                    # Задача 2: "🔄 Другая пара" → "🔄 Другой режим", target → msg-compare-hub
                    if btn.get("text") == "🔄 Другая пара" and btn.get("target") == "msg-compare-menu":
                        btn["text"] = "🔄 Другой режим"
                        btn["target"] = "msg-compare-hub"
                        changes.append(
                            f"[kb-compare-result] Кнопка '🔄 Другая пара' → '🔄 Другой режим', target → msg-compare-hub"
                        )

            # --- bot-msg-result_keyboard_1779837310618_ku7jy2a2g ---
            if node_id == "bot-msg-result_keyboard_1779837310618_ku7jy2a2g":
                buttons = node["data"]["buttons"]
                for btn in buttons:
                    # Задача 1: [📋 Сайты] target msg-compare-menu → msg-compare-ask-amount
                    if btn.get("text") == "📋 Сайты" and btn.get("target") == "msg-compare-menu":
                        btn["target"] = "msg-compare-ask-amount"
                        changes.append(
                            f"[bot-msg-result_keyboard] Кнопка '📋 Сайты': target msg-compare-menu → msg-compare-ask-amount"
                        )

                    # Задача 2: "🔄 Другая пара" → "🔄 Другой режим", target → msg-compare-hub
                    if btn.get("text") == "🔄 Другая пара" and btn.get("target") == "bot-msg-menu":
                        btn["text"] = "🔄 Другой режим"
                        btn["target"] = "msg-compare-hub"
                        changes.append(
                            f"[bot-msg-result_keyboard] Кнопка '🔄 Другая пара' → '🔄 Другой режим', target → msg-compare-hub"
                        )

    if not changes:
        print("⚠️  Ничего не найдено для изменения!")
        return

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Внесено {len(changes)} изменений:\n")
    for c in changes:
        print(f"  • {c}")

if __name__ == "__main__":
    main()
