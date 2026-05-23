"""
@fileoverview Добавляет VIRON в сценарий сравнения через ботов.
Цепочка: /start → парсим эмодзи капчи → click эмодзи → click "Купить" (idx 0) → click "Bitcoin" (idx 0) → парсим курс
"""

import json
import requests
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")


def find_node(sheets, node_id):
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            if node['id'] == node_id:
                return node, sheet
    return None, None


def main():
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sheets = data['sheets']

    # Находим лист "Сравнение через ботов"
    bot_sheet = None
    for s in sheets:
        if 'Сравнение через ботов' in s.get('name', ''):
            bot_sheet = s
            break

    if not bot_sheet:
        print("❌ Лист не найден")
        return

    # Ноды для VIRON:
    # 1. bot-ub-viron-start — /start → получаем капчу
    # 2. bot-setv-viron-captcha — парсим эмодзи из текста капчи
    # 3. bot-ub-viron-captcha-click — click по эмодзи (text mode, значение из переменной)
    # 4. bot-ub-viron-buy — click "Купить" (index 0)
    # 5. bot-ub-viron-btc — click "Bitcoin (BTC)" (index 0)
    # 6. bot-setv-parse-viron — парсим курс

    new_nodes = [
        {
            "id": "bot-ub-viron-start",
            "type": "userbot_message",
            "position": {"x": 2800, "y": 1200},
            "data": {
                "formatMode": "html",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@popol_ni_bot",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-setv-viron-captcha",
                "saveResponseIdTo": "viron_resp1",
                "saveResponseTextTo": "viron_captcha_text",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 4,
                "responseStrategy": "longest"
            }
        },
        {
            "id": "bot-setv-viron-captcha",
            "type": "set_variable",
            "position": {"x": 2800, "y": 1400},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "viron_cap_1",
                        "mode": "regex_extract",
                        "value": "{viron_captcha_text}",
                        "pattern": "эмодзи:\\s*\\*{0,2}([^\\s*]+)\\*{0,2}",
                        "variable": "viron_captcha_emoji",
                        "regexGroup": "1"
                    }
                ],
                "messageText": "",
                "keyboardType": "none",
                "requiresAuth": False,
                "isPrivateOnly": False,
                "resizeKeyboard": True,
                "oneTimeKeyboard": False,
                "autoTransitionTo": "bot-ub-viron-captcha-click",
                "enableStatistics": False,
                "enableAutoTransition": True,
                "conditionalMessages": [],
                "enableConditionalMessages": False
            }
        },
        {
            "id": "bot-ub-viron-captcha-click",
            "type": "userbot_click_button",
            "position": {"x": 2800, "y": 1600},
            "data": {
                "clickMode": "text",
                "clickValue": "{viron_captcha_emoji}",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@popol_ni_bot",
                "saveResultTo": "viron_menu_text",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-viron-buy",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-viron-buy",
            "type": "userbot_click_button",
            "position": {"x": 2800, "y": 1800},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@popol_ni_bot",
                "saveResultTo": "viron_buy_text",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-viron-btc",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-viron-btc",
            "type": "userbot_click_button",
            "position": {"x": 2800, "y": 2000},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@popol_ni_bot",
                "saveResultTo": "viron_text",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-setv-parse-viron",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-setv-parse-viron",
            "type": "set_variable",
            "position": {"x": 2800, "y": 2200},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "viron_1",
                        "mode": "regex_extract",
                        "value": "{viron_text}",
                        "pattern": "Курс:\\s*([\\d\\s]+)\\s*₽",
                        "variable": "viron_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "viron_2",
                        "mode": "expression",
                        "value": "float('{viron_rate_raw}'.replace(' ', '').replace('\\xa0', '')) if '{viron_rate_raw}' else 0",
                        "variable": "viron_rate"
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

    # Добавляем ноды
    bot_sheet['nodes'].extend(new_nodes)
    print(f"✅ Добавлено 6 нод для VIRON")

    # Меняем цепочку: bot-setv-parse-imperia → bot-ub-viron-start
    imperia_parse, _ = find_node(sheets, 'bot-setv-parse-imperia')
    if imperia_parse:
        imperia_parse['data']['autoTransitionTo'] = 'bot-ub-viron-start'
        print(f"✅ bot-setv-parse-imperia → bot-ub-viron-start")

    # bot-setv-parse-viron → bot-setv-calc (уже задано)

    # Добавляем viron в bot-setv-calc
    calc_node, _ = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        assignments.append({
            "id": "calc_viron",
            "mode": "expression",
            "value": "round({user_amount} / float({viron_rate}), 8) if float({viron_rate}) > 0 else 0",
            "variable": "viron_btc"
        })
        assignments.append({
            "id": "fmt_viron",
            "mode": "format_number",
            "value": "{viron_rate}",
            "variable": "viron_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены viron_btc и viron_rate_fmt")

    # Обновляем текст результата
    result_node, _ = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        viron_line = "\n🔸 <a href='https://t.me/popol_ni_bot?start=ref_959XUMH2'>VIRON</a>: <b>{viron_btc}</b> BTC ({viron_rate_fmt} ₽)"
        if 'viron' not in msg:
            msg = msg.replace("\n\n👆", viron_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка VIRON")

    # Сохраняем
    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Обновляем через API
    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
