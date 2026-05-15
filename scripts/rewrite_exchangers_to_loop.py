"""
@fileoverview Переписывает project.json обменников на loop-архитектуру.

Заменяет 53 жёстких ноды на ~12 нод с использованием:
- loop по массиву обменников из {table.urls.exchangers_json}
- dynamic buttons из {table.ids.pairs_json}
- set_variable для накопления результатов

Запуск из корня проекта:
    python scripts/rewrite_exchangers_to_loop.py
"""

import json
import shutil
from pathlib import Path

BOT_FILE = Path("bots/обменники_240_153/project.json")
BACKUP_FILE = BOT_FILE.with_suffix(".json.bak2")

SHEET_ID = "XTEWfsVExmWRz_xFj6MKX"
SHEET_NAME = "Мониторинг обменников"


def make_node(node_id: str, node_type: str, data: dict, position: dict) -> dict:
    """
    Создаёт структуру узла для project.json.
    @param node_id - Уникальный идентификатор узла
    @param node_type - Тип узла
    @param data - Словарь с данными узла
    @param position - Координаты {"x": ..., "y": ...}
    @returns Словарь узла
    """
    return {
        "id": node_id,
        "type": node_type,
        "position": position,
        "data": data,
    }


def build_nodes() -> list:
    """
    Строит полный набор нод для loop-архитектуры.
    @returns Список нод нового сценария
    """
    nodes = []

    # 1. /start → msg-menu
    nodes.append(make_node("cmd-start", "command_trigger", {
        "command": "/start",
        "description": "Запустить бота",
        "showInMenu": True,
        "adminOnly": False,
        "requiresAuth": False,
        "autoTransitionTo": "msg-menu",
        "enableAutoTransition": True,
        "enableStatistics": True,
        "buttons": [],
        "keyboardType": "none",
        "isPrivateOnly": False,
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "enableDynamicButtons": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "inputVariable": "",
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 0, "y": 400}))

    # 2. /rates → msg-menu
    nodes.append(make_node("cmd-rates", "command_trigger", {
        "command": "/rates",
        "description": "Курсы валют",
        "showInMenu": True,
        "adminOnly": False,
        "requiresAuth": False,
        "autoTransitionTo": "msg-menu",
        "enableAutoTransition": True,
        "enableStatistics": True,
        "buttons": [],
        "keyboardType": "none",
        "isPrivateOnly": False,
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "enableDynamicButtons": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "inputVariable": "",
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 0, "y": 600}))

    # 3. /about → msg-about
    nodes.append(make_node("cmd-about", "command_trigger", {
        "command": "/about",
        "description": "О боте",
        "showInMenu": True,
        "adminOnly": False,
        "requiresAuth": False,
        "autoTransitionTo": "msg-about",
        "enableAutoTransition": True,
        "enableStatistics": True,
        "buttons": [],
        "keyboardType": "none",
        "isPrivateOnly": False,
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "enableDynamicButtons": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "inputVariable": "",
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 0, "y": 200}))

    # 4. msg-menu — выбор пары (dynamic buttons из pairs_json)
    nodes.append(make_node("msg-menu", "message", {
        "messageText": "💱 <b>Выбери пару для обмена:</b>\n\nАктуальные курсы RUB → крипто",
        "formatMode": "html",
        "markdown": False,
        "keyboardType": "inline",
        "buttons": [
            {"id": "btn-about", "text": "ℹ️ О боте", "action": "goto", "target": "msg-about"}
        ],
        "enableDynamicButtons": True,
        "dynamicButtons": {
            "columns": 1,
            "arrayPath": "",
            "styleMode": "none",
            "styleField": "",
            "textTemplate": "{emoji_from} {from_name} → {emoji_to} {to_name}",
            "styleTemplate": "",
            "sourceVariable": "table.ids.pairs_json",
            "callbackTemplate": "pair_{from_id}_{to_id}",
        },
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableStatistics": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "inputVariable": "",
        "isPrivateOnly": False,
        "adminOnly": False,
        "showInMenu": False,
        "requiresAuth": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 400, "y": 400}))

    # 5. msg-about — информация о боте
    nodes.append(make_node("msg-about", "message", {
        "messageText": "ℹ️ <b>{table.texts.about_header}</b>\n\n<b>Обменники:</b>\n• swop.is\n• sova.is\n• pocket-exchange.com\n• ferma.cc\n\n<b>Поддерживаемые пары:</b>\n• 🏦 Сбербанк → ₮ USDT TRC20\n• 🏦 Сбербанк → ₿ Bitcoin\n• 🏦 Сбербанк → Ξ Ethereum\n• 🏦 Сбербанк → 💎 TON\n• 💳 Тинькофф → ₮ USDT TRC20\n• 💳 Тинькофф → ₿ Bitcoin\n• 🟡 ЮMoney → ₮ USDT TRC20\n• 🟡 ЮMoney → 💎 TON",
        "formatMode": "html",
        "markdown": False,
        "keyboardType": "inline",
        "buttons": [
            {"id": "btn-back-menu", "text": "◀️ Назад", "action": "goto", "target": "msg-menu"}
        ],
        "enableDynamicButtons": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableStatistics": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "inputVariable": "",
        "isPrivateOnly": False,
        "adminOnly": False,
        "showInMenu": False,
        "requiresAuth": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 780, "y": 200}))

    return nodes


def build_callback_nodes() -> list:
    """
    Строит ноды обработки callback от кнопок пар.
    Используем callback_trigger для перехвата pair_{from_id}_{to_id}.
    @returns Список нод обработки выбора пары
    """
    nodes = []

    # 6. callback_trigger — перехватывает pair_* callback
    nodes.append(make_node("cb-pair", "callback_trigger", {
        "callbackPattern": "pair_",
        "callbackMatchMode": "startsWith",
        "autoTransitionTo": "setv-parse-pair",
        "enableAutoTransition": True,
        "enableStatistics": False,
        "buttons": [],
        "keyboardType": "none",
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "enableDynamicButtons": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "adminOnly": False,
        "showInMenu": False,
        "requiresAuth": False,
    }, {"x": 800, "y": 400}))

    # 7. set_variable — парсим from_id и to_id из callback_data
    # callback_data = "pair_2_55" → selected_from_id=2, selected_to_id=55
    nodes.append(make_node("setv-parse-pair", "set_variable", {
        "assignments": [
            {
                "id": "sp1",
                "variable": "selected_from_id",
                "value": "{callback_data_part_1}",
                "mode": "text",
            },
            {
                "id": "sp2",
                "variable": "selected_to_id",
                "value": "{callback_data_part_2}",
                "mode": "text",
            },
            {
                "id": "sp3",
                "variable": "rates_text",
                "value": "",
                "mode": "text",
            },
        ],
        "autoTransitionTo": "loop-exchangers",
        "enableAutoTransition": True,
        "enableStatistics": False,
        "buttons": [],
        "keyboardType": "none",
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "conditionalMessages": [],
        "enableDynamicButtons": False,
        "enableConditionalMessages": False,
    }, {"x": 1200, "y": 400}))

    # 8. loop — итерация по обменникам
    nodes.append(make_node("loop-exchangers", "loop", {
        "sourceVariable": "table.urls.exchangers_json",
        "itemVariable": "exchanger",
        "indexVariable": "exch_index",
        "parallel": False,
        "delaySeconds": 0,
        "maxIterations": 0,
        "autoTransitionTo": "fetch-rate",
        "afterLoopTo": "msg-result",
    }, {"x": 1600, "y": 400}))

    # 9. http_request — запрос к текущему обменнику
    nodes.append(make_node("fetch-rate", "http_request", {
        "httpRequestUrl": "{exchanger.url}",
        "httpRequestMethod": "GET",
        "httpRequestHeaders": "",
        "httpRequestBody": "",
        "httpRequestTimeout": 15,
        "httpRequestResponseVariable": "r_exch",
        "httpRequestStatusVariable": "s_exch",
        "httpRequestAuthType": "none",
        "httpRequestIgnoreSsl": False,
        "httpRequestBodyFormat": "json",
        "httpRequestResponseFormat": "autodetect",
        "httpRequestFollowRedirects": True,
        "httpRequestIgnoreHttpErrors": True,
        "autoTransitionTo": "setv-extract-rate",
        "enableAutoTransition": True,
        "enableStatistics": False,
        "buttons": [],
        "keyboardType": "none",
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "enableDynamicButtons": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "adminOnly": False,
        "showInMenu": False,
        "requiresAuth": False,
    }, {"x": 2000, "y": 400}))

    # 10. set_variable — извлечь курс и накопить в rates_text
    nodes.append(make_node("setv-extract-rate", "set_variable", {
        "assignments": [
            {
                "id": "er1",
                "variable": "current_rate",
                "value": "{r_exch.exchange.{selected_from_id}.to.{selected_to_id}}",
                "mode": "text",
            },
            {
                "id": "er2",
                "variable": "rates_text",
                "value": "{rates_text}🔸 {exchanger.name}: <b>{current_rate}</b>\n",
                "mode": "text",
            },
        ],
        "autoTransitionTo": "",
        "enableAutoTransition": False,
        "enableStatistics": False,
        "buttons": [],
        "keyboardType": "none",
        "messageText": "",
        "markdown": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "conditionalMessages": [],
        "enableDynamicButtons": False,
        "enableConditionalMessages": False,
    }, {"x": 2400, "y": 400}))

    # 11. msg-result — показать результат
    nodes.append(make_node("msg-result", "message", {
        "messageText": "💱 <b>Курсы обмена</b>\n\n{rates_text}\n<i>Данные: swop.is, sova.is, pocket-exchange.com, ferma.cc</i>",
        "formatMode": "html",
        "markdown": False,
        "keyboardType": "inline",
        "buttons": [
            {"id": "btn-back", "text": "◀️ Назад к парам", "action": "goto", "target": "msg-menu"}
        ],
        "enableDynamicButtons": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableStatistics": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "inputVariable": "",
        "isPrivateOnly": False,
        "adminOnly": False,
        "showInMenu": False,
        "requiresAuth": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 2800, "y": 400}))

    # 12. msg-error — ошибка
    nodes.append(make_node("msg-error", "message", {
        "messageText": "{table.texts.error_msg}",
        "formatMode": "html",
        "markdown": False,
        "keyboardType": "inline",
        "buttons": [
            {"id": "btn-retry", "text": "🔄 Попробовать снова", "action": "goto", "target": "msg-menu"}
        ],
        "enableDynamicButtons": False,
        "dynamicButtons": {"columns": 2, "arrayPath": "", "styleMode": "none", "styleField": "", "textTemplate": "", "styleTemplate": "", "sourceVariable": "", "callbackTemplate": ""},
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "collectUserInput": False,
        "enableStatistics": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableVideoInput": False,
        "enableDocumentInput": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "inputVariable": "",
        "isPrivateOnly": False,
        "adminOnly": False,
        "showInMenu": False,
        "requiresAuth": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "documentInputVariable": "",
    }, {"x": 2800, "y": 600}))

    return nodes


def main():
    """
    Основная функция: создаёт бэкап, строит новый сценарий, сохраняет.
    """
    if not BOT_FILE.exists():
        print(f"❌ Файл не найден: {BOT_FILE}")
        return

    # Бэкап
    shutil.copy2(BOT_FILE, BACKUP_FILE)
    print(f"💾 Бэкап: {BACKUP_FILE}")

    # Читаем текущий проект
    with BOT_FILE.open(encoding="utf-8") as f:
        project = json.load(f)

    # Считаем старые ноды
    old_sheet = next((s for s in project["sheets"] if s["id"] == SHEET_ID), None)
    old_count = len(old_sheet["nodes"]) if old_sheet else 0

    # Строим новые ноды
    all_nodes = build_nodes() + build_callback_nodes()

    # Обновляем лист
    new_sheet = {
        "id": SHEET_ID,
        "name": SHEET_NAME,
        "nodes": all_nodes,
        "createdAt": old_sheet.get("createdAt", "2025-01-01T00:00:00.000Z") if old_sheet else "2025-01-01T00:00:00.000Z",
        "updatedAt": "2026-05-15T00:00:00.000Z",
        "viewState": {"zoom": 0.8, "position": {"x": 0, "y": 0}},
    }

    # Заменяем лист в проекте
    project["sheets"] = [new_sheet if s["id"] == SHEET_ID else s for s in project["sheets"]]

    # Сохраняем
    output = json.dumps(project, ensure_ascii=False, indent=2)
    json.loads(output)  # Валидация

    with BOT_FILE.open("w", encoding="utf-8", newline="\n") as f:
        f.write(output)

    new_count = len(all_nodes)
    print(f"\n📊 Было нод: {old_count}")
    print(f"📊 Стало нод: {new_count}")
    print(f"📊 Сокращение: {old_count - new_count} нод ({100 - round(new_count/old_count*100)}%)")
    print(f"\n✅ Готово! Файл: {BOT_FILE}")
    print(f"\nНоды нового сценария:")
    for n in all_nodes:
        print(f"  • {n['id']} ({n['type']})")


if __name__ == "__main__":
    main()
