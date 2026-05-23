"""
@fileoverview Добавляет Империю Обмена в сценарий сравнения через ботов.
Цепочка: /start → click "С карты в кошелёк" (idx 0) → click "BTC" (idx 0) → парсим курс
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

    # Новые ноды для Империи Обмена:
    # 1. bot-ub-imperia-start — отправляет /start
    # 2. bot-ub-imperia-buy — click "С карты в кошелёк" (index 0)
    # 3. bot-ub-imperia-btc — click "BTC" (index 0)
    # 4. bot-setv-parse-imperia — парсит курс

    new_nodes = [
        {
            "id": "bot-ub-imperia-start",
            "type": "userbot_message",
            "position": {"x": 2400, "y": 1200},
            "data": {
                "formatMode": "html",
                "messageText": "/start",
                "attachedMedia": [],
                "userbotEntity": "@IMPERIA_OBMENA_BOT",
                "saveMessageIdTo": "ub_sent_msg_id",
                "autoTransitionTo": "bot-ub-imperia-buy",
                "saveResponseIdTo": "imperia_resp1",
                "disableLinkPreview": False,
                "enableAutoTransition": True,
                "waitSeconds": 3,
                "responseStrategy": "longest"
            }
        },
        {
            "id": "bot-ub-imperia-buy",
            "type": "userbot_click_button",
            "position": {"x": 2400, "y": 1400},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@IMPERIA_OBMENA_BOT",
                "saveResultTo": "imperia_buy_text",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-ub-imperia-btc",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-ub-imperia-btc",
            "type": "userbot_click_button",
            "position": {"x": 2400, "y": 1600},
            "data": {
                "clickMode": "index",
                "clickValue": "0",
                "messageId": "",
                "messageIdSource": "last",
                "userbotEntity": "@IMPERIA_OBMENA_BOT",
                "saveResultTo": "imperia_text",
                "saveAlertTo": "",
                "saveMediaTo": "",
                "saveButtonsTo": "",
                "saveHasMediaTo": "",
                "autoTransitionTo": "bot-setv-parse-imperia",
                "responseStrategy": "edit",
                "enableAutoTransition": True
            }
        },
        {
            "id": "bot-setv-parse-imperia",
            "type": "set_variable",
            "position": {"x": 2400, "y": 1800},
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "assignments": [
                    {
                        "id": "imp_1",
                        "mode": "regex_extract",
                        "value": "{imperia_text}",
                        "pattern": "Текущий курс:\\s*([\\d,.\\s]+)\\s*₽",
                        "variable": "imperia_rate_raw",
                        "regexGroup": "1"
                    },
                    {
                        "id": "imp_2",
                        "mode": "expression",
                        "value": "float('{imperia_rate_raw}'.replace(',', '').replace(' ', '').replace('\\xa0', '')) * 1.17 if '{imperia_rate_raw}' else 0",
                        "variable": "imperia_rate"
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

    # Добавляем ноды в лист
    bot_sheet['nodes'].extend(new_nodes)
    print(f"✅ Добавлено 4 ноды для Империи Обмена")

    # Меняем цепочку: bot-setv-parse-sanchez → bot-ub-imperia-start (вместо bot-setv-calc)
    sanchez_parse, _ = find_node(sheets, 'bot-setv-parse-sanchez')
    if sanchez_parse:
        sanchez_parse['data']['autoTransitionTo'] = 'bot-ub-imperia-start'
        print(f"✅ bot-setv-parse-sanchez → bot-ub-imperia-start")

    # bot-setv-parse-imperia → bot-setv-calc (уже задано выше)

    # Добавляем imperia в bot-setv-calc
    calc_node, _ = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        assignments = calc_node['data']['assignments']
        # Добавляем вычисление imperia_btc и imperia_rate_fmt
        assignments.append({
            "id": "calc_imp",
            "mode": "expression",
            "value": "round({user_amount} / float({imperia_rate}), 8) if float({imperia_rate}) > 0 else 0",
            "variable": "imperia_btc"
        })
        assignments.append({
            "id": "fmt_imp",
            "mode": "format_number",
            "value": "{imperia_rate}",
            "variable": "imperia_rate_fmt"
        })
        print(f"✅ bot-setv-calc: добавлены imperia_btc и imperia_rate_fmt")

    # Обновляем текст результата — добавляем строку для Империи
    result_node, _ = find_node(sheets, 'bot-msg-result')
    if result_node:
        msg = result_node['data'].get('messageText', '')
        # Добавляем перед "👆 <i>Нажми"
        imperia_line = "\n🔸 <a href='https://t.me/IMPERIA_OBMENA_BOT?start=7733607050'>Империя</a>: <b>{imperia_btc}</b> BTC ({imperia_rate_fmt} ₽)"
        if 'imperia' not in msg:
            msg = msg.replace("\n\n👆", imperia_line + "\n\n👆")
            result_node['data']['messageText'] = msg
            print(f"✅ bot-msg-result: добавлена строка Империи")

    # Сохраняем
    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Обновляем через API
    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"✅ API: {r.status_code}")


if __name__ == '__main__':
    main()
