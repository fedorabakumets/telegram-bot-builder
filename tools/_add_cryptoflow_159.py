"""
@fileoverview Добавляет CryptoFlow в сценарий сравнения через ботов.
Цепочка: /start → click "BTC" (idx 0) → click "Купить BTC" (idx 0) → send {user_amount} → парсим BTC → click "Отменить"
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
            "id": "bot-ub-cf-start",
            "type": "userbot_message",
            "position": {"x": 3200, "y": 1200},
            "data": {
                "formatMode": "html",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@Crypto_Flow_exchange_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-cf-btc",
                "saveResponseIdTo": "cf_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-cf-btc",
            "type": "userbot_click_button",
            "position": {"x": 3200, "y": 1400},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Crypto_Flow_exchange_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-cf-buy",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-cf-buy",
            "type": "userbot_click_button",
            "position": {"x": 3200, "y": 1600},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Crypto_Flow_exchange_bot",
                "saveResultTo": "",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-cf-amount",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-cf-amount",
            "type": "userbot_message",
            "position": {"x": 3200, "y": 1800},
            "data": {
                "formatMode": "none",
                "messageText": "{user_amount}",
                "attachedMedia": [],
                "userbotEntity": "@Crypto_Flow_exchange_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-parse-cf",
                "saveResponseIdTo": "cf_resp2",
                "saveResponseTextTo": "cf_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 5,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-setv-parse-cf",
            "type": "set_variable",
            "position": {"x": 3200, "y": 2000},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "cf_1",
                        "mode": "regex_extract",
                        "value": "{cf_text}",
                        "pattern": "получите.*?([\\d.]+)\\s*BTC",
                        "variable": "cf_btc_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "cf_2",
                        "mode": "expression",
                        "value": "round(float({user_amount}) / float('{cf_btc_raw}'), 0) if float('{cf_btc_raw}') > 0 else 0",
                        "variable": "cf_rate"
                    }
                ],
                "messageText": "",
                "keyboardType": "none",
                "requiresAuth": False,
                "isPrivateOnly": False,
                "resizeKeyboard": True,
                "oneTimeKeyboard": False,
                "autoTransitionTo": "bot-ub-cf-cancel",
                "enableStatistics": False,
                "enableAutoTransition": True,
                "conditionalMessages": [],
                "enableConditionalMessages": False
            }
        },
        {
            "id": "bot-ub-cf-cancel",
            "type": "userbot_click_button",
            "position": {"x": 3200, "y": 2200},
            "data": {
                "clickMode": "index",
                "clickValue": "1",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@Crypto_Flow_exchange_bot",
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
    print(f"✅ Добавлено 6 нод для CryptoFlow")

    # Цепочка: bot-setv-parse-viron → bot-ub-cf-start
    viron_parse = find_node(sheets, 'bot-setv-parse-viron')
    if viron_parse:
        viron_parse['data']['autoTransitionTo'] = 'bot-ub-cf-start'
        print(f"✅ bot-setv-parse-viron → bot-ub-cf-start")

    # bot-ub-cf-cancel → bot-setv-calc (уже задано)

    # Добавляем cf в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_cf",
            "mode": "expression",
            "value": "round({user_amount} / float({cf_rate}), 8) if float({cf_rate}) > 0 else 0",
            "variable": "cf_btc"
        })
        assignments.append({
            "id": "fmt_cf",
            "mode": "format_number",
            "value": "{cf_rate}",
            "variable": "cf_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены cf_btc и cf_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        cf_line = "\n🔸 <a href='https://t.me/Crypto_Flow_exchange_bot?start=ref7733607050'>CryptoFlow</a>: <b>{cf_btc}</b> BTC ({cf_rate_fmt} ₽)"
        if 'cf_btc' not in msg:
            msg = msg.replace("\n\n👆", cf_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка CryptoFlow")

    # Переключаем тест на CryptoFlow
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-cf-start'
        print(f"✅ bot-setv-init → bot-ub-cf-start (тест только CF)")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
