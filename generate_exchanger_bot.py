"""
@fileoverview Генератор project.json для бота мониторинга обменников валют.
Использует expression mode в set_variable для извлечения вложенных полей из JSON-ответа API.
"""

import json
import os
import urllib.request
from datetime import datetime

# ─── Константы ────────────────────────────────────────────────────────────────

API_URL = "https://swop.is/valuta.json"
OUTPUT_DIR = r"C:\Users\1\Desktop\telegram-bot-builder\bots\exchanger-monitor"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "project.json")
NOW = "2026-05-13T10:00:00.000Z"

# Пары: (from_id, from_name, from_label, to_id, to_name, to_label, emoji_from, emoji_to)
PAIRS = [
    (2,  "Сбербанк",  "sber",  55,  "USDT TRC20", "usdt", "🏦", "₮"),
    (2,  "Сбербанк",  "sber",  5,   "Bitcoin",    "btc",  "🏦", "₿"),
    (2,  "Сбербанк",  "sber",  4,   "Ethereum",   "eth",  "🏦", "Ξ"),
    (2,  "Сбербанк",  "sber",  107, "TON",        "ton",  "🏦", "💎"),
    (18, "Тинькофф",  "tcs",   55,  "USDT TRC20", "usdt", "💳", "₮"),
]

# ─── Вспомогательные функции ──────────────────────────────────────────────────

def fetch_api_version():
    """Получает версию API для проверки доступности."""
    try:
        with urllib.request.urlopen(API_URL, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get("version", "unknown")
    except Exception as exc:
        print(f"⚠️  Не удалось получить данные с API: {exc}")
        return "unknown"


def make_dynamic_buttons():
    """Возвращает стандартный объект dynamicButtons."""
    return {
        "columns": 2, "arrayPath": "", "styleMode": "none",
        "styleField": "", "textTemplate": "", "styleTemplate": "",
        "sourceVariable": "", "callbackTemplate": ""
    }


def base_data(**extra):
    """Базовые поля data, общие для всех нод."""
    return {
        "showInMenu": False, "adminOnly": False, "requiresAuth": False,
        "buttons": [], "markdown": False, "messageText": "",
        "keyboardType": "none", "resizeKeyboard": True, "oneTimeKeyboard": False,
        "enableStatistics": False, "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons(),
        "enableDynamicButtons": False, "conditionalMessages": [],
        "enableConditionalMessages": False,
        **extra
    }


# ─── Построители нод ──────────────────────────────────────────────────────────

def cmd_trigger(node_id, command, description, next_id, x, y):
    """Нода command_trigger."""
    return {
        "id": node_id, "type": "command_trigger",
        "position": {"x": x, "y": y},
        "data": base_data(
            command=command, description=description,
            showInMenu=True, enableStatistics=True,
            autoTransitionTo=next_id, enableAutoTransition=True,
            collectUserInput=False, enableTextInput=False,
            enablePhotoInput=False, enableVideoInput=False,
            enableAudioInput=False, enableDocumentInput=False,
            inputVariable="", photoInputVariable="",
            videoInputVariable="", audioInputVariable="",
            documentInputVariable=""
        )
    }


def message_node(node_id, text, buttons, keyboard_type, x, y, auto_to="", fmt="html"):
    """Нода message."""
    return {
        "id": node_id, "type": "message",
        "position": {"x": x, "y": y},
        "data": base_data(
            messageText=text, formatMode=fmt,
            keyboardType=keyboard_type, buttons=buttons,
            showInMenu=False, enableStatistics=True,
            variableFilters={},
            enableAutoTransition=bool(auto_to), autoTransitionTo=auto_to,
            collectUserInput=False, enableTextInput=False,
            enablePhotoInput=False, enableVideoInput=False,
            enableAudioInput=False, enableDocumentInput=False,
            inputVariable="", photoInputVariable="",
            videoInputVariable="", audioInputVariable="",
            documentInputVariable=""
        )
    }


def btn(btn_id, text, target):
    """Inline-кнопка goto."""
    return {
        "id": btn_id, "text": text, "action": "goto",
        "target": target, "buttonType": "normal",
        "skipDataCollection": False, "hideAfterClick": False
    }


def set_var_node(node_id, assignments, next_id, x, y):
    """Нода set_variable."""
    return {
        "id": node_id, "type": "set_variable",
        "position": {"x": x, "y": y},
        "data": base_data(
            assignments=assignments,
            enableAutoTransition=True, autoTransitionTo=next_id
        )
    }


def http_node(node_id, next_id, resp_var, status_var, x, y):
    """Нода http_request для запроса к API курсов."""
    return {
        "id": node_id, "type": "http_request",
        "position": {"x": x, "y": y},
        "data": base_data(
            httpRequestUrl=API_URL,
            httpRequestMethod="GET",
            httpRequestHeaders="",
            httpRequestBody="",
            httpRequestTimeout=15,
            httpRequestResponseVariable=resp_var,
            httpRequestStatusVariable=status_var,
            httpRequestBodyFormat="json",
            httpRequestResponseFormat="autodetect",
            httpRequestIgnoreHttpErrors=False,
            httpRequestIgnoreSsl=False,
            httpRequestFollowRedirects=True,
            httpRequestAuthType="none",
            enableAutoTransition=True, autoTransitionTo=next_id,
            collectUserInput=False, enableTextInput=False, inputVariable=""
        )
    }


def condition_node(node_id, variable, branches, x, y):
    """Нода condition."""
    return {
        "id": node_id, "type": "condition",
        "position": {"x": x, "y": y},
        "data": base_data(variable=variable, branches=branches)
    }


# ─── Построение нод для одной пары ───────────────────────────────────────────

def build_pair_chain(from_id, from_name, from_key, to_id, to_name, to_key,
                     emoji_from, emoji_to, x_start, y_row, error_id):
    """
    Строит цепочку нод для одной пары from→to.
    Возвращает (список нод, id кнопки для главного меню).
    """
    pair_key = f"{from_key}-{to_key}"
    btn_id   = f"btn-{pair_key}"
    fetch_id = f"fetch-{pair_key}"
    check_id = f"check-{pair_key}"
    setv_id  = f"setv-{pair_key}"
    show_id  = f"show-{pair_key}"
    resp_var = f"rates_{pair_key}".replace("-", "_")
    stat_var = f"status_{pair_key}".replace("-", "_")
    rate_var = f"rate_{pair_key}".replace("-", "_")

    # expression: извлекаем курс из вложенного JSON
    expr = f"rates_{from_key}_{to_key}['exchange']['{from_id}']['to']['{to_id}']"
    expr = f"rates_{pair_key.replace('-','_')}['exchange']['{from_id}']['to']['{to_id}']"

    nodes = [
        http_node(fetch_id, check_id, resp_var, stat_var, x_start, y_row),
        condition_node(check_id, stat_var, [
            {"id": f"ok-{pair_key}", "label": "= 200", "operator": "equals",
             "value": "200", "target": setv_id},
            {"id": f"err-{pair_key}", "label": "Иначе", "operator": "else",
             "value": "", "target": error_id}
        ], x_start + 400, y_row),
        set_var_node(setv_id, [
            {"id": f"a1-{pair_key}", "variable": rate_var,
             "value": f"{resp_var}['exchange']['{from_id}']['to']['{to_id}']",
             "mode": "expression"}
        ], show_id, x_start + 800, y_row),
        message_node(
            show_id,
            f"💱 <b>{emoji_from} {from_name} → {emoji_to} {to_name}</b>\n\n"
            f"Курс: <b>1 RUB = {{{rate_var}}} {to_name}</b>\n\n"
            f"<i>Данные: swop.is</i>",
            [btn(f"back-{pair_key}", "◀️ Назад", "msg-menu")],
            "inline", x_start + 1200, y_row
        )
    ]
    label = f"{emoji_from} {from_name} → {emoji_to} {to_name}"
    return nodes, btn_id, fetch_id, label


# ─── Главная функция ──────────────────────────────────────────────────────────

def build_project(api_version):
    """Строит полный project.json."""
    nodes = []
    pair_buttons = []   # кнопки для msg-menu
    y_base = 600

    error_node = message_node(
        "msg-error",
        "❌ Ошибка загрузки курсов. Попробуйте позже.",
        [btn("back-err", "◀️ Назад", "msg-menu")],
        "inline", 2000, 200
    )

    about_node = message_node(
        "msg-about",
        f"ℹ️ <b>Бот мониторинга обменников</b>\n\n"
        f"Источник данных: <a href='https://swop.is'>swop.is</a>\n"
        f"Версия API: {api_version}\n\n"
        f"Поддерживаемые пары:\n"
        + "\n".join(
            f"• {ef} {fn} → {et} {tn}"
            for _, fn, _, _, tn, _, ef, et in PAIRS
        ),
        [btn("back-about", "◀️ Назад", "msg-menu")],
        "inline", 800, 200
    )

    # Строим цепочки для каждой пары
    all_pair_nodes = []
    for i, (fid, fn, fk, tid, tn, tk, ef, et) in enumerate(PAIRS):
        chain, btn_id, fetch_id, label = build_pair_chain(
            fid, fn, fk, tid, tn, tk, ef, et,
            x_start=1200, y_row=y_base + i * 250,
            error_id="msg-error"
        )
        all_pair_nodes.extend(chain)
        pair_buttons.append(btn(btn_id, label, fetch_id))

    # Главное меню
    menu_node = message_node(
        "msg-menu",
        "💱 <b>Выбери пару для обмена:</b>\n\nАктуальные курсы RUB → крипто",
        pair_buttons + [btn("btn-about", "ℹ️ О боте", "msg-about")],
        "inline", 400, 400
    )

    # /start
    start_trigger = cmd_trigger("cmd-start", "/start", "Запустить бота", "msg-menu", 0, 400)
    # /rates
    rates_trigger = cmd_trigger("cmd-rates", "/rates", "Курсы валют", "msg-menu", 0, 600)

    nodes = [start_trigger, rates_trigger, menu_node, about_node, error_node]
    nodes.extend(all_pair_nodes)

    return {
        "version": 2,
        "activeSheetId": "sheet-main",
        "sheets": [{
            "id": "sheet-main",
            "name": "Мониторинг обменников",
            "nodes": nodes,
            "createdAt": NOW,
            "updatedAt": NOW,
            "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100}
        }]
    }


# ─── Точка входа ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🔍 Получаем данные с API...")
    version = fetch_api_version()
    print(f"✅ API версия: {version}")

    print("🔨 Строим project.json...")
    project = build_project(version)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Валидация
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        loaded = json.load(f)

    node_count = len(loaded["sheets"][0]["nodes"])
    print(f"✅ Сохранено: {OUTPUT_FILE}")
    print(f"📊 Нод в проекте: {node_count}")
    print(f"📋 Листов: {len(loaded['sheets'])}")
    print("🎉 JSON валидный!")
