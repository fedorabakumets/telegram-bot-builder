"""
@fileoverview Добавляет сообщение "Загрузка..." перед цепочкой сравнения ботов.
Вставляет ноду message между bot-setv-init и bot-ub-monopoly-start.

Цепочка до: bot-setv-init → bot-ub-monopoly-start
Цепочка после: bot-setv-init → bot-msg-loading → bot-ub-monopoly-start
"""

import json
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")

LOADING_NODE_ID = "bot-msg-loading"


def main():
    """
    Добавляет ноду "Загрузка" в цепочку сравнения через ботов
    """
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    sheets = data["sheets"]

    # Находим лист sheet-bots
    bot_sheet = None
    for s in sheets:
        if s.get("id") == "sheet-bots":
            bot_sheet = s
            break

    if not bot_sheet:
        print("❌ Лист sheet-bots не найден!")
        return

    # Проверяем что нода ещё не добавлена
    existing_ids = {n["id"] for n in bot_sheet["nodes"]}
    if LOADING_NODE_ID in existing_ids:
        print("⚠️  Нода bot-msg-loading уже существует")
        return

    # Находим bot-setv-init и меняем его autoTransitionTo
    for node in bot_sheet["nodes"]:
        if node["id"] == "bot-setv-init":
            old_target = node["data"]["autoTransitionTo"]
            node["data"]["autoTransitionTo"] = LOADING_NODE_ID
            print(f"✅ bot-setv-init: autoTransitionTo {old_target} → {LOADING_NODE_ID}")
            break

    # Создаём ноду загрузки
    loading_node = {
        "id": LOADING_NODE_ID,
        "type": "message",
        "position": {"x": 5800, "y": 2000},
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "formatMode": "html",
            "showInMenu": False,
            "messageText": "⏳ <b>Собираю курсы обменников...</b>\n\nЭто займёт несколько секунд.",
            "keyboardType": "none",
            "requiresAuth": False,
            "attachedMedia": [],
            "inputVariable": "",
            "isPrivateOnly": False,
            "resizeKeyboard": True,
            "enableTextInput": False,
            "oneTimeKeyboard": False,
            "variableFilters": {},
            "autoTransitionTo": "bot-ub-monopoly-start",
            "collectUserInput": False,
            "enableAudioInput": False,
            "enablePhotoInput": False,
            "enableStatistics": False,
            "enableVideoInput": False,
            "audioInputVariable": "",
            "photoInputVariable": "",
            "videoInputVariable": "",
            "conditionalMessages": [],
            "enableDocumentInput": False,
            "enableAutoTransition": True,
            "documentInputVariable": "",
            "enableConditionalMessages": False
        }
    }

    bot_sheet["nodes"].append(loading_node)
    print(f"✅ Добавлена нода {LOADING_NODE_ID}")

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Валидация
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        json.load(f)

    print(f"\n✅ Файл сохранён: {PROJECT_PATH}")
    print(f"\n📋 Цепочка:")
    print(f"   bot-setv-init → bot-msg-loading → bot-ub-monopoly-start")
    print(f"   → bot-ub-monopoly-buy → bot-ub-monopoly-amount")
    print(f"   → bot-setv-parse-monopoly → bot-setv-calc → bot-msg-result")


if __name__ == "__main__":
    main()
