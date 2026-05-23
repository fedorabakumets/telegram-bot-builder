"""
@fileoverview Добавляет Lucky Exchange в сценарий сравнения через ботов.
Цепочка: /start → click "Купить" → click "Купить BTC" (idx 0) → click "Карта" (idx 0) → click "В рублях" (idx 0) → send {user_amount} → send адрес → парсим курс
Все шаги — новые сообщения (responseStrategy: new_message для click_button).
"""

import json
import requests
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")
BTC_ADDRESS = "bc1q5at58r5qlwuclpvk4hv0c0wughe69evxle068q"


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
            "id": "bot-ub-lucky-start",
            "type": "userbot_message",
            "position": {"x": 4800, "y": 1200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@LuckyExchange_Bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-lucky-buy",
                "saveResponseIdTo": "lucky_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-lucky-buy",
            "type": "userbot_click_button",
            "position": {"x": 4800, "y": 1400},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@LuckyExchange_Bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-lucky-btc",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-lucky-btc",
            "type": "userbot_click_button",
            "position": {"x": 4800, "y": 1600},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@LuckyExchange_Bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-lucky-card",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-lucky-card",
            "type": "userbot_click_button",
            "position": {"x": 4800, "y": 1800},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@LuckyExchange_Bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-lucky-rub",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-lucky-rub",
            "type": "userbot_click_button",
            "position": {"x": 4800, "y": 2000},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@LuckyExchange_Bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-lucky-amount",
                "responseStrategy": "new_message",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-lucky-amount",
            "type": "userbot_message",
            "position": {"x": 4800, "y": 2200},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "attachedMedia": [],
                "userbotEntity": "@LuckyExchange_Bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-lucky-address",
                "saveResponseIdTo": "lucky_resp2",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-lucky-address",
            "type": "userbot_message",
            "position": {"x": 4800, "y": 2400},
            "data": {
                "formatMode": "none",
                "messageText": BTC_ADDRESS,
                "attachedMedia": [],
                "userbotEntity": "@LuckyExchange_Bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-parse-lucky",
                "saveResponseIdTo": "lucky_resp3",
                "saveResponseTextTo": "lucky_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 5,
                "responseStrategy": "longest"
            }
        },
        {
            "id": "bot-setv-parse-lucky",
            "type": "set_variable",
            "position": {"x": 4800, "y": 2600},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "lucky_1",
                        "mode": "regex_extract",
                        "value": "{lucky_text}",
                        "pattern": "Курс:.*?=\\s*([\\d.]+)\\s*RUB",
                        "variable": "lucky_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "lucky_2",
                        "mode": "expression",
                        "value": "float('{lucky_rate_raw}') if '{lucky_rate_raw}' else 0",
                        "variable": "lucky_rate"
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
    print(f"✅ Добавлено 8 нод для Lucky Exchange")

    # Цепочка: bot-setv-parse-inf → bot-ub-lucky-start
    inf_parse = find_node(sheets, 'bot-setv-parse-inf')
    if inf_parse:
        inf_parse['data']['autoTransitionTo'] = 'bot-ub-lucky-start'
        print(f"✅ bot-setv-parse-inf → bot-ub-lucky-start")

    # Добавляем lucky в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_lucky",
            "mode": "expression",
            "value": "round({user_amount} / float({lucky_rate}), 8) if float({lucky_rate}) > 0 else 0",
            "variable": "lucky_btc"
        })
        assignments.append({
            "id": "fmt_lucky",
            "mode": "format_number",
            "value": "{lucky_rate}",
            "variable": "lucky_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены lucky_btc и lucky_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        lucky_line = "\n🔸 <a href='https://t.me/LuckyExchange_Bot?start=ref_cmj72beqs0001lz016qurlvoz'>Lucky</a>: <b>{lucky_btc}</b> BTC ({lucky_rate_fmt} ₽)"
        if 'lucky_btc' not in msg:
            msg = msg.replace("\n\n👆", lucky_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка Lucky")

    # Тест только Lucky
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-lucky-start'
        print(f"✅ bot-setv-init → bot-ub-lucky-start (тест)")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
