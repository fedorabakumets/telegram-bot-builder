"""
@fileoverview Добавляет CASPER Exchange в сценарий сравнения через ботов.
Цепочка: /start → click "BTC" (idx 0, new_message) → send {user_amount} → парсим курс
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
            "id": "bot-ub-casper-start",
            "type": "userbot_message",
            "position": {"x": 5600, "y": 1200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@casper_btc_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-casper-btc",
                "saveResponseIdTo": "casper_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-casper-btc",
            "type": "userbot_click_button",
            "position": {"x": 5600, "y": 1400},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@casper_btc_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-casper-amount",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-casper-amount",
            "type": "userbot_message",
            "position": {"x": 5600, "y": 1600},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "attachedMedia": [],
                "userbotEntity": "@casper_btc_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-parse-casper",
                "saveResponseIdTo": "casper_resp2",
                "saveResponseTextTo": "casper_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 5,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-setv-parse-casper",
            "type": "set_variable",
            "position": {"x": 5600, "y": 1800},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "casper_1",
                        "mode": "regex_extract",
                        "value": "{casper_text}",
                        "pattern": "курс BTC:\\s*\\*{0,2}([\\d\\s,.]+)\\s*₽",
                        "variable": "casper_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "casper_2",
                        "mode": "expression",
                        "value": "float('{casper_rate_raw}'.replace(' ', '').replace(',', '.').replace('\\xa0', '')) if '{casper_rate_raw}' else 0",
                        "variable": "casper_rate"
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
    print(f"✅ Добавлено 4 ноды для CASPER")

    # Цепочка: bot-setv-parse-love → bot-ub-casper-start
    love_parse = find_node(sheets, 'bot-setv-parse-love')
    if love_parse:
        love_parse['data']['autoTransitionTo'] = 'bot-ub-casper-start'
        print(f"✅ bot-setv-parse-love → bot-ub-casper-start")

    # Добавляем casper в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_casper",
            "mode": "expression",
            "value": "round({user_amount} / float({casper_rate}), 8) if float({casper_rate}) > 0 else 0",
            "variable": "casper_btc"
        })
        assignments.append({
            "id": "fmt_casper",
            "mode": "format_number",
            "value": "{casper_rate}",
            "variable": "casper_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены casper_btc и casper_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        casper_line = "\n🔸 <a href='https://t.me/casper_btc_bot?start=jDr1Wi8Y'>CASPER</a>: <b>{casper_btc}</b> BTC ({casper_rate_fmt} ₽)"
        if 'casper_btc' not in msg:
            msg = msg.replace("\n\n👆", casper_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка CASPER")

    # Тест только CASPER
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-casper-start'
        print(f"✅ bot-setv-init → bot-ub-casper-start (тест)")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
