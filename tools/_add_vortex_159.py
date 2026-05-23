"""
@fileoverview Добавляет Vortex в сценарий сравнения через ботов.
Цепочка: /start → send "🚀 Купить ВТС" → click "Обычный BTC" (idx 0, edit) → парсим курс
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
            "id": "bot-ub-vortex-start",
            "type": "userbot_message",
            "position": {"x": 3600, "y": 1200},
            "data": {
                "formatMode": "none",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@vrtxbtc_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-vortex-buy",
                "saveResponseIdTo": "vortex_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-vortex-buy",
            "type": "userbot_message",
            "position": {"x": 3600, "y": 1400},
            "data": {
                "formatMode": "none",
                "messageText": "\u0420\u043e\u043a\u0435\u0442\u0430 Купить ВТС",
                "attachedMedia": [],
                "userbotEntity": "@vrtxbtc_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-vortex-btc",
                "saveResponseIdTo": "vortex_resp2",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "first"
            }
        },
        {
            "id": "bot-ub-vortex-btc",
            "type": "userbot_click_button",
            "position": {"x": 3600, "y": 1600},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@vrtxbtc_bot",
                "saveResultTo": "vortex_text",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-setv-parse-vortex",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-setv-parse-vortex",
            "type": "set_variable",
            "position": {"x": 3600, "y": 1800},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "vortex_1",
                        "mode": "regex_extract",
                        "value": "{vortex_text}",
                        "pattern": "Текущий курс:\\s*([\\d]+)",
                        "variable": "vortex_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "vortex_2",
                        "mode": "expression",
                        "value": "float('{vortex_rate_raw}') if '{vortex_rate_raw}' else 0",
                        "variable": "vortex_rate"
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
    print(f"✅ Добавлено 4 ноды для Vortex")

    # Цепочка: bot-setv-parse-cf (через cancel) → ... уже идёт в calc
    # Вставляем после CryptoFlow: bot-ub-cf-cancel → bot-ub-vortex-start
    cf_cancel = find_node(sheets, 'bot-ub-cf-cancel')
    if cf_cancel:
        cf_cancel['data']['autoTransitionTo'] = 'bot-ub-vortex-start'
        print(f"✅ bot-ub-cf-cancel → bot-ub-vortex-start")

    # bot-setv-parse-vortex → bot-setv-calc (уже задано)

    # Добавляем vortex в bot-setv-calc
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_vortex",
            "mode": "expression",
            "value": "round({user_amount} / float({vortex_rate}), 8) if float({vortex_rate}) > 0 else 0",
            "variable": "vortex_btc"
        })
        assignments.append({
            "id": "fmt_vortex",
            "mode": "format_number",
            "value": "{vortex_rate}",
            "variable": "vortex_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены vortex_btc и vortex_rate_fmt")

    # Обновляем текст результата
    result_node = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        vortex_line = "\n🔸 <a href='https://t.me/vrtxbtc_bot?start=7733607050'>Vortex</a>: <b>{vortex_btc}</b> BTC ({vortex_rate_fmt} ₽)"
        if 'vortex_btc' not in msg:
            msg = msg.replace("\n\n👆", vortex_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка Vortex")

    # Тест только Vortex
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-vortex-start'
        print(f"✅ bot-setv-init → bot-ub-vortex-start (тест)")

    # Исправляем текст кнопки — нужен эмодзи ракеты 🚀
    vortex_buy = find_node(sheets, 'bot-ub-vortex-buy')
    if vortex_buy:
        vortex_buy['data']['messageText'] = "🚀 Купить ВТС"
        print(f"✅ bot-ub-vortex-buy: messageText = '🚀 Купить ВТС'")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
