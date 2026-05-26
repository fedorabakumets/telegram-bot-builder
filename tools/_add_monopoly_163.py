"""
@fileoverview Добавляет BTC Monopoly в сценарий сравнения через ботов (project 163).
Сценарий: /start → click "Купить BTC" → send {user_amount} → парсим "Вы получите: X BTC"

Изменения:
1. Добавляет 4 ноды на лист sheet-bots (monopoly start/buy/amount/parse)
2. Переключает bot-setv-init → bot-ub-monopoly-start (отключает остальных ботов)
3. bot-setv-parse-monopoly → bot-setv-calc
4. Обновляет bot-msg-result — временный вывод только Monopoly
"""

import json
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")


def find_node(sheets, node_id):
    """
    Ищет ноду по ID во всех листах
    @param sheets - список листов проекта
    @param node_id - ID искомой ноды
    @returns найденная нода или None
    """
    for sheet in sheets:
        for node in sheet.get("nodes", []):
            if node["id"] == node_id:
                return node
    return None


def create_monopoly_nodes():
    """
    Создаёт 4 ноды для сценария BTC Monopoly
    @returns список нод
    """
    return [
        {
            "id": "bot-ub-monopoly-start",
            "type": "userbot_message",
            "position": {"x": 6000, "y": 2200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "waitSeconds": 4,
                "attachedMedia": [],
                "userbotEntity": "@Btc_Monopoly_Bot",
                "saveMessageIdTo": "ub_msg_id",
                "autoTransitionTo": "bot-ub-monopoly-buy",
                "responseStrategy": "longest",
                "saveResponseIdTo": "ub_resp_id",
                "saveResponseTextTo": "ub_response_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-monopoly-buy",
            "type": "userbot_click_button",
            "position": {"x": 6000, "y": 2400},
            "data": {
                "clickMode": "text",
                "messageId": "{ub_resp_id}",
                "clickValue": "Купить BTC",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveResultTo": "ub_response_text",
                "saveButtonsTo": "",
                "userbotEntity": "@Btc_Monopoly_Bot",
                "saveHasMediaTo": "",
                "messageIdSource": "last",
                "autoTransitionTo": "bot-ub-monopoly-amount",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-monopoly-amount",
            "type": "userbot_message",
            "position": {"x": 6000, "y": 2600},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "waitSeconds": 5,
                "attachedMedia": [],
                "userbotEntity": "@Btc_Monopoly_Bot",
                "saveMessageIdTo": "ub_msg_id",
                "autoTransitionTo": "bot-setv-parse-monopoly",
                "responseStrategy": "longest",
                "saveResponseIdTo": "ub_resp_id",
                "saveResponseTextTo": "ub_response_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-setv-parse-monopoly",
            "type": "set_variable",
            "position": {"x": 6000, "y": 2800},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "monopoly_parse_1",
                        "mode": "regex_extract",
                        "source": "{ub_response_text}",
                        "pattern": "Вы получите:\\s*\\*{0,2}([\\d.,]+)\\s*BTC",
                        "group": "1",
                        "variable": "monopoly_btc"
                    }
                ],
                "messageText": "",
                "keyboardType": "none",
                "requiresAuth": False,
                "isPrivateOnly": False,
                "resizeKeyboard": True,
                "oneTimeKeyboard": False,
                "autoTransitionTo": "bot-setv-calc",
                "enableStatistics": False,
                "conditionalMessages": [],
                "enableAutoTransition": True,
                "enableConditionalMessages": False
            }
        }
    ]


def main():
    """
    Основная функция — модифицирует project.json для добавления BTC Monopoly
    """
    print(f"📂 Загружаю: {PROJECT_PATH}")
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

    # 1. Добавляем 4 ноды для Monopoly
    new_nodes = create_monopoly_nodes()
    bot_sheet["nodes"].extend(new_nodes)
    print(f"✅ Добавлено {len(new_nodes)} нод для BTC Monopoly")

    # 2. Переключаем bot-setv-init → bot-ub-monopoly-start
    init_node = find_node(sheets, "bot-setv-init")
    if init_node:
        old_target = init_node["data"]["autoTransitionTo"]
        init_node["data"]["autoTransitionTo"] = "bot-ub-monopoly-start"
        print(f"✅ bot-setv-init: {old_target} → bot-ub-monopoly-start")
    else:
        print("❌ bot-setv-init не найден!")

    # 3. Обновляем bot-msg-result — временный вывод только Monopoly
    result_node = find_node(sheets, "bot-msg-result")
    if result_node:
        new_text = (
            "💱 <b>Сравнение курсов (тест)</b>\n"
            "\n"
            "💰 Сумма: <b>{user_amount_fmt}</b> ₽\n"
            "\n"
            "🔸 BTC Monopoly: <b>{monopoly_btc} BTC</b>"
        )
        result_node["data"]["messageText"] = new_text
        print(f"✅ bot-msg-result: текст обновлён (только Monopoly)")
    else:
        print("❌ bot-msg-result не найден!")

    # 4. Добавляем format_number для user_amount_fmt в bot-setv-calc (уже есть fmt4)
    # monopoly_btc уже парсится напрямую — дополнительных вычислений не нужно
    calc_node = find_node(sheets, "bot-setv-calc")
    if calc_node:
        print(f"✅ bot-setv-calc: monopoly_btc парсится напрямую, доп. вычисления не нужны")
    else:
        print("❌ bot-setv-calc не найден!")

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Проверяем что JSON валидный
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        json.load(f)

    print(f"\n✅ Файл сохранён и валидирован: {PROJECT_PATH}")
    print(f"\n📋 Итоговая цепочка:")
    print(f"   bot-setv-init → bot-ub-monopoly-start → bot-ub-monopoly-buy")
    print(f"   → bot-ub-monopoly-amount → bot-setv-parse-monopoly → bot-setv-calc")
    print(f"   → bot-msg-result")


if __name__ == "__main__":
    main()
