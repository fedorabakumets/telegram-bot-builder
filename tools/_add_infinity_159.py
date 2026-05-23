"""
@fileoverview Добавляет INFINITY в сценарий сравнения через ботов.
Цепочка: /start → click "Купить" (idx 0, edit) → click "Bitcoin" (idx 0, edit) → click "На карту" (idx 0, edit) → send {user_amount} → парсим курс → click "Отмена"
"""

import json
import requests
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")


def find_node(sheets, node_id):
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            if node['id'] == node_id:
                return node
    return None


def main():
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sheets = data['sheets']

    bot_sheet = None
    for s in sheets:
        if 'Сравнение через ботов' in s.get('name', ''):
            bot_sheet = s
            break

    if not bot_sheet:
        print("❌ Лист не найден")
        return

    new_nodes = [
        {
            "id": "bot-ub-inf-start",
            "type": "userbot_message",
            "position": {"x": 4400, "y": 1200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@Infinity_exchange_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-inf-buy",
                "saveResponseIdTo": "inf_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-inf-buy",
            "type": "userbot_click_button",
            "position": {"x": 4400, "y": 1400},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Infinity_exchange_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-inf-btc",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-inf-btc",
            "type": "userbot_click_button",
            "position": {"x": 4400, "y": 1600},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Infinity_exchange_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-inf-card",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-inf-card",
            "type": "userbot_click_button",
            "position": {"x": 4400, "y": 1800},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Infinity_exchange_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-inf-amount",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-inf-amount",
            "type": "userbot_message",
            "position": {"x": 4400, "y": 2000},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "attachedMedia": [],
                "userbotEntity": "@Infinity_exchange_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-parse-inf",
                "saveResponseIdTo": "inf_resp2",
                "saveResponseTextTo": "inf_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 5,
                "responseStrategy": "longest"
            }
        },
        {
            "id": "bot-setv-parse-inf",
            "type": "set_variable",
            "position": {"x": 4400, "y": 2200},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "inf_1",
                        "mode": "regex_extract",
                        "value": "{inf_text}",
                        "pattern": "рыночный курс:\\s*([\\d.]+)",
                        "variable": "inf_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "inf_2",
                        "mode": "expression",
                        "value": "float('{inf_rate_raw}') if '{inf_rate_raw}' else 0",
                        "variable": "inf_rate"
                    }
                ],
                "messageText": "",
                "keyboardType": "none",
                "requiresAuth": False,
                "isPrivateOnly": False,
                "resizeKeyboard": True,
                "oneTimeKeyboard": False,
                "autoTransitionTo": "bot-ub-inf-cancel",
                "enableStatistics": False,
                "enableAutoTransition": True,
                "conditionalMessages": [],
                "enableConditionalMessages": False
            }
        },
        {
            "id": "bot-ub-inf-cancel",
            "type": "userbot_click_button",
            "position": {"x": 4400, "y": 2400},
            "data": {
                "clickMode": "text",
                "clickValue": "❌ Отмена",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Infinity_exchange_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-setv-calc",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        }
    ]

    bot_sheet['nodes'].extend(new_nodes)
    print(f"✅ Добавлено 7 нод для INFINITY")

    # Цепочка: bot-setv-parse-crazy → bot-ub-inf-start
    crazy_parse = find_node(sheets, 'bot-setv-parse-crazy')
    if crazy_parse:
        crazy_parse['data']['autoTransitionTo'] = 'bot-ub-inf-start'
        print(f"✅ bot-setv-parse-crazy → bot-ub-inf-start")

    # Добавляем inf в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_inf",
            "mode": "expression",
            "value": "round({user_amount} / float({inf_rate}), 8) if float({inf_rate}) > 0 else 0",
            "variable": "inf_btc"
        })
        assignments.append({
            "id": "fmt_inf",
            "mode": "format_number",
            "value": "{inf_rate}",
            "variable": "inf_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены inf_btc и inf_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        inf_line = "\n🔸 <a href='https://t.me/Infinity_exchange_bot?start=jBmKj8kM8Z'>INFINITY</a>: <b>{inf_btc}</b> BTC ({inf_rate_fmt} ₽)"
        if 'inf_btc' not in msg:
            msg = msg.replace("\n\n👆", inf_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка INFINITY")

    # Тест только INFINITY
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-inf-start'
        print(f"✅ bot-setv-init → bot-ub-inf-start (тест)")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
