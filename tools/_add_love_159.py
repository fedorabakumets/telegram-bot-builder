"""
@fileoverview Добавляет Love Exchange в сценарий сравнения через ботов.
Цепочка: /start → click "Купить BTC" (idx 0, new_message) → send {user_amount} → парсим курс
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
            "id": "bot-ub-love-start",
            "type": "userbot_message",
            "position": {"x": 5200, "y": 1200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@Exchange_Love_Bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-love-buy",
                "saveResponseIdTo": "love_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-love-buy",
            "type": "userbot_click_button",
            "position": {"x": 5200, "y": 1400},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Exchange_Love_Bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-love-amount",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-love-amount",
            "type": "userbot_message",
            "position": {"x": 5200, "y": 1600},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "attachedMedia": [],
                "userbotEntity": "@Exchange_Love_Bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-parse-love",
                "saveResponseIdTo": "love_resp2",
                "saveResponseTextTo": "love_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 5,
                "responseStrategy": "longest"
            }
        },
        {
            "id": "bot-setv-parse-love",
            "type": "set_variable",
            "position": {"x": 5200, "y": 1800},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "love_1",
                        "mode": "regex_extract",
                        "value": "{love_text}",
                        "pattern": "курс BTC:\\s*([\\d.]+)\\s*₽",
                        "variable": "love_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "love_2",
                        "mode": "expression",
                        "value": "float('{love_rate_raw}') if '{love_rate_raw}' else 0",
                        "variable": "love_rate"
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
                "enableAutoTransition": True,
                "conditionalMessages": [],
                "enableConditionalMessages": False
            }
        }
    ]

    bot_sheet['nodes'].extend(new_nodes)
    print(f"✅ Добавлено 4 ноды для Love Exchange")

    # Цепочка: bot-setv-parse-lucky → bot-ub-love-start
    lucky_parse = find_node(sheets, 'bot-setv-parse-lucky')
    if lucky_parse:
        lucky_parse['data']['autoTransitionTo'] = 'bot-ub-love-start'
        print(f"✅ bot-setv-parse-lucky → bot-ub-love-start")

    # Добавляем love в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_love",
            "mode": "expression",
            "value": "round({user_amount} / float({love_rate}), 8) if float({love_rate}) > 0 else 0",
            "variable": "love_btc"
        })
        assignments.append({
            "id": "fmt_love",
            "mode": "format_number",
            "value": "{love_rate}",
            "variable": "love_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены love_btc и love_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        love_line = "\n🔸 <a href='https://t.me/Exchange_Love_Bot?start=ref_7733607050'>Love</a>: <b>{love_btc}</b> BTC ({love_rate_fmt} ₽)"
        if 'love_btc' not in msg:
            msg = msg.replace("\n\n👆", love_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка Love")

    # Тест только Love
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-love-start'
        print(f"✅ bot-setv-init → bot-ub-love-start (тест)")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
