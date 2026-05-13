"""
@fileoverview Генератор project.json для бота мониторинга 4 обменников валют.
Архитектура: для каждой пары — цепочка из 4 http_request нод (swop→sova→pocket→ferma),
затем set_variable с 4 присваиваниями и message с таблицей курсов.
"""

import json
import os

# ─── Константы ────────────────────────────────────────────────────────────────

OUTPUT_DIR  = r"C:\Users\1\Desktop\telegram-bot-builder\bots\exchanger-monitor"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "project.json")
NOW         = "2026-05-13T10:00:00.000Z"

# Пары: (from_id, from_name, from_key, to_id, to_name, to_key, emoji_from, emoji_to)
PAIRS = [
    (2,  "Сбербанк", "sber", 55,  "USDT TRC20", "usdt", "🏦", "₮"),
    (2,  "Сбербанк", "sber", 5,   "Bitcoin",    "btc",  "🏦", "₿"),
    (2,  "Сбербанк", "sber", 4,   "Ethereum",   "eth",  "🏦", "Ξ"),
    (2,  "Сбербанк", "sber", 107, "TON",        "ton",  "🏦", "💎"),
    (18, "Тинькофф", "tcs",  55,  "USDT TRC20", "usdt", "💳", "₮"),
    (18, "Тинькофф", "tcs",  5,   "Bitcoin",    "btc",  "💳", "₿"),
    (48, "ЮMoney",   "yam",  55,  "USDT TRC20", "usdt", "🟡", "₮"),
    (48, "ЮMoney",   "yam",  107, "TON",        "ton",  "🟡", "💎"),
]

# Обменники: (ключ, отображаемое имя, URL)
EXCHANGERS = [
    ("swop",   "swop.is",             "https://swop.is/valuta.json"),
    ("sova",   "sova.is",             "https://sova.is/valuta.json"),
    ("pocket", "pocket-exchange.com", "https://pocket-exchange.com/valuta.json"),
    ("ferma",  "ferma.cc",            "https://ferma.cc/valuta.json"),
]


# ─── Вспомогательные функции ──────────────────────────────────────────────────

def make_dynamic_buttons():
    """
    Возвращает стандартный объект dynamicButtons.
    @returns Словарь с полями динамических кнопок
    """
    return {
        "columns": 2, "arrayPath": "", "styleMode": "none",
        "styleField": "", "textTemplate": "", "styleTemplate": "",
        "sourceVariable": "", "callbackTemplate": ""
    }


def base_data(**extra):
    """
    Базовые поля data, общие для всех нод.
    @param extra - Дополнительные поля для конкретного типа ноды
    @returns Словарь с базовыми полями и переданными extra
    """
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


def btn(btn_id, text, target):
    """
    Создаёт inline-кнопку типа goto.
    @param btn_id - Уникальный идентификатор кнопки
    @param text - Текст кнопки
    @param target - ID ноды-цели
    @returns Словарь с описанием кнопки
    """
    return {
        "id": btn_id, "text": text, "action": "goto",
        "target": target, "buttonType": "normal",
        "skipDataCollection": False, "hideAfterClick": False
    }


# ─── Построители нод ──────────────────────────────────────────────────────────

def cmd_trigger(node_id, command, description, next_id, x, y):
    """
    Создаёт ноду command_trigger.
    @param node_id - ID ноды
    @param command - Команда бота (например /start)
    @param description - Описание команды
    @param next_id - ID следующей ноды
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды command_trigger
    """
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


def message_node(node_id, text, buttons, keyboard_type, x, y, auto_to=""):
    """
    Создаёт ноду message.
    @param node_id - ID ноды
    @param text - HTML-текст сообщения
    @param buttons - Список кнопок
    @param keyboard_type - Тип клавиатуры: inline / none
    @param x - Позиция по X
    @param y - Позиция по Y
    @param auto_to - ID ноды для авто-перехода (опционально)
    @returns Словарь ноды message
    """
    return {
        "id": node_id, "type": "message",
        "position": {"x": x, "y": y},
        "data": base_data(
            messageText=text, formatMode="html",
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


def http_node(node_id, url, resp_var, status_var, next_id, x, y):
    """
    Создаёт ноду http_request для запроса к API обменника.
    @param node_id - ID ноды
    @param url - URL API обменника
    @param resp_var - Переменная для ответа
    @param status_var - Переменная для HTTP-статуса
    @param next_id - ID следующей ноды (autoTransition)
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды http_request
    """
    return {
        "id": node_id, "type": "http_request",
        "position": {"x": x, "y": y},
        "data": base_data(
            httpRequestUrl=url,
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


def set_var_node(node_id, assignments, next_id, x, y):
    """
    Создаёт ноду set_variable с несколькими присваиваниями.
    @param node_id - ID ноды
    @param assignments - Список присваиваний переменных
    @param next_id - ID следующей ноды
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды set_variable
    """
    return {
        "id": node_id, "type": "set_variable",
        "position": {"x": x, "y": y},
        "data": base_data(
            assignments=assignments,
            enableAutoTransition=True, autoTransitionTo=next_id
        )
    }


# ─── Построение цепочки нод для одной пары ───────────────────────────────────

def build_pair_chain(from_id, from_name, from_key, to_id, to_name, to_key,
                     emoji_from, emoji_to, y_row):
    """
    Строит цепочку нод для одной пары FROM→TO с 4 обменниками.
    Порядок: fetch-swop → fetch-sova → fetch-pocket → fetch-ferma → setv → show.
    @param from_id - Числовой ID валюты-источника в API
    @param from_name - Отображаемое имя источника
    @param from_key - Короткий ключ источника (sber, tcs, yam)
    @param to_id - Числовой ID целевой валюты в API
    @param to_name - Отображаемое имя целевой валюты
    @param to_key - Короткий ключ цели (usdt, btc, eth, ton)
    @param emoji_from - Эмодзи источника
    @param emoji_to - Эмодзи цели
    @param y_row - Позиция по Y для всей строки нод
    @returns Кортеж (список нод, ID первой fetch-ноды, текст кнопки меню)
    """
    pk = f"{from_key}-{to_key}"  # pair key
    setv_id = f"setv-{pk}"
    show_id = f"show-{pk}"

    # Строим цепочку fetch-нод: каждая ведёт на следующую
    fetch_nodes = []
    for i, (ex_key, ex_name, ex_url) in enumerate(EXCHANGERS):
        node_id  = f"fetch-{ex_key}-{pk}"
        resp_var = f"r_{ex_key}_{from_key}_{to_key}"
        stat_var = f"s_{ex_key}"
        # Следующая нода: следующий fetch или setv для последнего
        if i + 1 < len(EXCHANGERS):
            next_ex_key = EXCHANGERS[i + 1][0]
            next_id = f"fetch-{next_ex_key}-{pk}"
        else:
            next_id = setv_id
        x_pos = 1200 + i * 400
        fetch_nodes.append(http_node(node_id, ex_url, resp_var, stat_var, next_id, x_pos, y_row))

    # 4 присваивания — по одному на обменник
    assignments = []
    for i, (ex_key, ex_name, ex_url) in enumerate(EXCHANGERS):
        resp_var  = f"r_{ex_key}_{from_key}_{to_key}"
        rate_var  = f"rate_{ex_key}_{from_key}_{to_key}"
        dot_value = "{" + f"{resp_var}.exchange.{from_id}.to.{to_id}" + "}"
        assignments.append({
            "id": f"a{i+1}-{pk}",
            "variable": rate_var,
            "value": dot_value,
            "mode": "text"
        })

    setv = set_var_node(setv_id, assignments, show_id, 2800, y_row)

    # Текст сообщения с таблицей курсов от всех 4 обменников
    lines = [f"💱 <b>{emoji_from} {from_name} → {emoji_to} {to_name}</b>\n"]
    for ex_key, ex_name, _ in EXCHANGERS:
        rate_var = f"rate_{ex_key}_{from_key}_{to_key}"
        pad = " " * max(0, 14 - len(ex_name))
        lines.append(f"🔸 {ex_name}:{pad}<b>{{{rate_var}}}</b>")
    lines.append("\n<i>Курс: сколько крипты за 1 RUB</i>")
    lines.append("<i>Данные: swop.is, sova.is, pocket-exchange.com, ferma.cc</i>")
    msg_text = "\n".join(lines)

    first_fetch_id = f"fetch-swop-{pk}"
    show = message_node(
        show_id, msg_text,
        [
            btn(f"back-{pk}", "◀️ Назад", "msg-menu"),
            btn(f"refresh-{pk}", "🔄 Обновить", first_fetch_id),
        ],
        "inline", 3200, y_row
    )

    nodes = fetch_nodes + [setv, show]
    label = f"{emoji_from} {from_name} → {emoji_to} {to_name}"
    return nodes, first_fetch_id, label


# ─── Главная функция сборки проекта ──────────────────────────────────────────

def build_project():
    """
    Строит полный project.json для бота мониторинга обменников.
    @returns Словарь с полной структурой проекта
    """
    nodes = []
    pair_buttons = []

    # Нода ошибки (x=3200, y=200 по ТЗ)
    error_node = message_node(
        "msg-error",
        "❌ Ошибка загрузки курсов. Попробуйте позже.",
        [btn("back-err", "◀️ Назад", "msg-menu")],
        "inline", 3200, 200
    )

    # Нода «О боте»
    pairs_list = "\n".join(
        f"• {ef} {fn} → {et} {tn}"
        for _, fn, _, _, tn, _, ef, et in PAIRS
    )
    exchangers_list = "\n".join(
        f"• <a href='{url}'>{name}</a>"
        for _, name, url in EXCHANGERS
    )
    about_text = (
        "ℹ️ <b>Бот мониторинга обменников</b>\n\n"
        f"<b>Обменники:</b>\n{exchangers_list}\n\n"
        f"<b>Поддерживаемые пары:</b>\n{pairs_list}"
    )
    about_node = message_node(
        "msg-about", about_text,
        [btn("back-about", "◀️ Назад", "msg-menu")],
        "inline", 800, 200
    )

    # Цепочки для каждой пары
    for i, (fid, fn, fk, tid, tn, tk, ef, et) in enumerate(PAIRS):
        y_row = 600 + i * 300
        chain, first_fetch_id, label = build_pair_chain(
            fid, fn, fk, tid, tn, tk, ef, et, y_row
        )
        nodes.extend(chain)
        pair_buttons.append(btn(f"btn-{fk}-{tk}", label, first_fetch_id))

    # Главное меню
    menu_node = message_node(
        "msg-menu",
        "💱 <b>Выбери пару для обмена:</b>\n\nАктуальные курсы RUB → крипто",
        pair_buttons + [btn("btn-about", "ℹ️ О боте", "msg-about")],
        "inline", 400, 500
    )

    # Команды /start и /rates
    start_trigger = cmd_trigger("cmd-start", "/start", "Запустить бота", "msg-menu", 0, 400)
    rates_trigger = cmd_trigger("cmd-rates", "/rates", "Курсы валют",    "msg-menu", 0, 600)

    all_nodes = [start_trigger, rates_trigger, menu_node, about_node, error_node] + nodes

    return {
        "version": 2,
        "activeSheetId": "sheet-main",
        "sheets": [{
            "id": "sheet-main",
            "name": "Мониторинг обменников",
            "nodes": all_nodes,
            "createdAt": NOW,
            "updatedAt": NOW,
            "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100}
        }]
    }


# ─── Точка входа ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🔨 Строим project.json (4 обменника, 8 пар)...")
    project = build_project()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Валидация — перечитываем и считаем
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        loaded = json.load(f)

    node_count  = len(loaded["sheets"][0]["nodes"])
    sheet_count = len(loaded["sheets"])
    print(f"✅ Сохранено: {OUTPUT_FILE}")
    print(f"📊 Нод в проекте: {node_count}")
    print(f"📋 Листов: {sheet_count}")
    print("🎉 JSON валидный!")
