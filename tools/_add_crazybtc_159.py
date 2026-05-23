"""
@fileoverview Добавляет CrazyBTC в сценарий сравнения через ботов.
Цепочка: /start → "Купить BTC" → "Внешний BTC" → {user_amount} → адрес → парсим BTC
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
            "id": "bot-ub-crazy-start",
            "type": "userbot_message",
            "position": {"x": 4000, "y": 1200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@BTCrzyBOT",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-crazy-buy",
                "saveResponseIdTo": "crazy_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-crazy-buy",
            "type": "userbot_message",
            "position": {"x": 4000, "y": 1400},
            "data": {
                "formatMode": "none",
                "messageText": "🛒 Купить BTC",
                "attachedMedia": [],
                "userbotEntity": "@BTCrzyBOT",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-crazy-external",
                "saveResponseIdTo": "crazy_resp2",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-crazy-external",
            "type": "userbot_message",
            "position": {"x": 4000, "y": 1600},
            "data": {
                "formatMode": "none",
                "messageText": "📩 Внешний BTC",
                "attachedMedia": [],
                "userbotEntity": "@BTCrzyBOT",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-crazy-amount",
                "saveResponseIdTo": "crazy_resp3",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-crazy-amount",
            "type": "userbot_message",
            "position": {"x": 4000, "y": 1800},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "attachedMedia": [],
                "userbotEntity": "@BTCrzyBOT",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-crazy-address",
                "saveResponseIdTo": "crazy_resp4",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-crazy-address",
            "type": "userbot_message",
            "position": {"x": 4000, "y": 2000},
            "data": {
                "formatMode": "none",
                "messageText": BTC_ADDRESS,
                "attachedMedia": [],
                "userbotEntity": "@BTCrzyBOT",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-parse-crazy",
                "saveResponseIdTo": "crazy_resp5",
                "saveResponseTextTo": "crazy_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 5,
                "responseStrategy": "longest"
            }
        },
        {
            "id": "bot-setv-parse-crazy",
            "type": "set_variable",
            "position": {"x": 4000, "y": 2200},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "crazy_1",
                        "mode": "regex_extract",
                        "value": "{crazy_text}",
                        "pattern": "([\\d.]+)\\s*BTC",
                        "variable": "crazy_btc_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "crazy_2",
                        "mode": "expression",
                        "value": "round(float({user_amount}) / float('{crazy_btc_raw}'), 0) if float('{crazy_btc_raw}') > 0 else 0",
                        "variable": "crazy_rate"
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
    print(f"✅ Добавлено 6 нод для CrazyBTC")

    # Цепочка: bot-setv-parse-vortex → bot-ub-crazy-start
    vortex_parse = find_node(sheets, 'bot-setv-parse-vortex')
    if vortex_parse:
        vortex_parse['data']['autoTransitionTo'] = 'bot-ub-crazy-start'
        print(f"✅ bot-setv-parse-vortex → bot-ub-crazy-start")

    # Добавляем crazy в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_crazy",
            "mode": "expression",
            "value": "round({user_amount} / float({crazy_rate}), 8) if float({crazy_rate}) > 0 else 0",
            "variable": "crazy_btc"
        })
        assignments.append({
            "id": "fmt_crazy",
            "mode": "format_number",
            "value": "{crazy_rate}",
            "variable": "crazy_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены crazy_btc и crazy_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        crazy_line = "\n🔸 <a href='https://t.me/BTCrzyBOT?start=7733607050'>CrazyBTC</a>: <b>{crazy_btc}</b> BTC ({crazy_rate_fmt} ₽)"
        if 'crazy_btc' not in msg:
            msg = msg.replace("\n\n👆", crazy_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка CrazyBTC")

    # Тест только CrazyBTC
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-crazy-start'
        print(f"✅ bot-setv-init → bot-ub-crazy-start (тест)")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
