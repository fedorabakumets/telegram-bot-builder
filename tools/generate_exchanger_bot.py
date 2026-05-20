"""
@fileoverview Генератор project.json для бота мониторинга обменников валют.
Содержит два листа:
  1. "💱 Сравнение курсов" — сравнение через HTTP API сайтов (swop, sova, pocket, ferma)
  2. "💱 Сравнение через ботов" — сравнение через Telegram userbot-ноды

Архитектура листа 1: для каждой пары — цепочка из 4 http_request нод,
затем set_variable с присваиваниями и message с таблицей курсов.

Архитектура листа 2: пользователь выбирает пару → вводит сумму →
бот в цикле опрашивает bot_exchangers (userbot_message / userbot_click_button /
userbot_inline_query) → собирает результаты → показывает таблицу.
"""

import json
import os

# ─── Константы ────────────────────────────────────────────────────────────────

OUTPUT_DIR  = r"C:\Users\1\Desktop\telegram-bot-builder\bots\exchanger-monitor"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "project.json")
NOW         = "2026-05-13T10:00:00.000Z"

# Маппинг ID валют по обменникам (имя_валюты -> id в конкретном API)
# Проверено: swop/ferma совпадают, sova и pocket имеют другие ID для TON
CURRENCY_IDS = {
    #          swop  sova  pocket  ferma
    "SBERRUB": [2,   2,    2,      2],
    "TCSBRUB": [18,  18,   18,     18],
    "YAMRUB":  [48,  48,   48,     48],
    "USDTTRC20":[55, 55,   55,     55],
    "BTC":     [5,   5,    5,      5],
    "ETH":     [4,   4,    4,      4],
    "TON":     [107, 136,  101,    107],  # sova=136, pocket=101
    "SOL":     [74,  74,   74,     74],
}

# Пары: (from_currency, from_name, from_key, to_currency, to_name, to_key, emoji_from, emoji_to)
PAIRS = [
    ("SBERRUB", "Сбербанк", "sber", "USDTTRC20", "USDT TRC20", "usdt", "🏦", "₮"),
    ("SBERRUB", "Сбербанк", "sber", "BTC",       "Bitcoin",    "btc",  "🏦", "₿"),
    ("SBERRUB", "Сбербанк", "sber", "ETH",       "Ethereum",   "eth",  "🏦", "Ξ"),
    ("SBERRUB", "Сбербанк", "sber", "TON",       "TON",        "ton",  "🏦", "💎"),
    ("TCSBRUB", "Тинькофф", "tcs",  "USDTTRC20", "USDT TRC20", "usdt", "💳", "₮"),
    ("TCSBRUB", "Тинькофф", "tcs",  "BTC",       "Bitcoin",    "btc",  "💳", "₿"),
    ("YAMRUB",  "ЮMoney",   "yam",  "USDTTRC20", "USDT TRC20", "usdt", "🟡", "₮"),
    ("YAMRUB",  "ЮMoney",   "yam",  "TON",       "TON",        "ton",  "🟡", "💎"),
]

# Обменники-сайты: (ключ, отображаемое имя, URL, индекс в CURRENCY_IDS)
EXCHANGERS = [
    ("swop",   "swop.is",             "https://swop.is/valuta.json",             0),
    ("sova",   "sova.is",             "https://sova.is/valuta.json",             1),
    ("pocket", "pocket-exchange.com", "https://pocket-exchange.com/valuta.json", 2),
    ("ferma",  "ferma.cc",            "https://ferma.cc/valuta.json",            3),
]

# Обменники-боты: (name, username, ref_url, mode, step1_text, click_button,
#                   step2_text, inline_query, rate_regex, wait_seconds)
BOT_EXCHANGERS = [
    ("ScoobyChange", "@scdoo_bot", "https://t.me/scdoo_bot?start=7733607050",
     "inline", "", "", "",
     "buy_btc 1", r"К оплате будет:\s*([\d]+)", 3),
    ("Capitalist", "@btccapital_bot", "https://t.me/btccapital_bot?start=7733607050",
     "click", "/start", "🔄 Купить BTC", "0.001",
     "", r"Курс покупки .*?BTC.*?:\s*([\d]+)", 4),
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


def message_node(node_id, text, buttons, keyboard_type, x, y, auto_to="",
                 collect_input=False, input_var="", dynamic_btns=None):
    """
    Создаёт ноду message.
    @param node_id - ID ноды
    @param text - HTML-текст сообщения
    @param buttons - Список кнопок
    @param keyboard_type - Тип клавиатуры: inline / none
    @param x - Позиция по X
    @param y - Позиция по Y
    @param auto_to - ID ноды для авто-перехода (опционально)
    @param collect_input - Ожидать ли ввод от пользователя
    @param input_var - Переменная для сохранения ввода
    @param dynamic_btns - Настройки динамических кнопок (опционально)
    @returns Словарь ноды message
    """
    extra = {
        "messageText": text, "formatMode": "html",
        "keyboardType": keyboard_type, "buttons": buttons,
        "showInMenu": False, "enableStatistics": True,
        "variableFilters": {},
        "enableAutoTransition": bool(auto_to), "autoTransitionTo": auto_to,
        "collectUserInput": collect_input, "enableTextInput": collect_input,
        "enablePhotoInput": False, "enableVideoInput": False,
        "enableAudioInput": False, "enableDocumentInput": False,
        "inputVariable": input_var, "photoInputVariable": "",
        "videoInputVariable": "", "audioInputVariable": "",
        "documentInputVariable": ""
    }
    if dynamic_btns:
        extra["enableDynamicButtons"] = True
        extra["dynamicButtons"] = dynamic_btns
    return {
        "id": node_id, "type": "message",
        "position": {"x": x, "y": y},
        "data": base_data(**extra)
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


def loop_node(node_id, source_variable, item_variable, loop_body_to, after_loop_to, x, y):
    """
    Создаёт ноду loop для итерации по таблице/массиву.
    @param node_id - ID ноды
    @param source_variable - Источник данных (table.xxx или переменная-массив)
    @param item_variable - Имя переменной текущего элемента
    @param loop_body_to - ID первой ноды тела цикла (autoTransitionTo)
    @param after_loop_to - ID ноды после завершения цикла
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды loop
    """
    return {
        "id": node_id, "type": "loop",
        "position": {"x": x, "y": y},
        "data": base_data(
            sourceVariable=source_variable,
            itemVariable=item_variable,
            indexVariable="loop_index",
            afterLoopTo=after_loop_to,
            autoTransitionTo=loop_body_to,
            enableAutoTransition=True,
            parallel=False,
            delaySeconds=0,
            maxIterations=10
        )
    }


def conditional_branch_node(node_id, conditions, default_target, x, y):
    """
    Создаёт ноду condition с ветками (формат проекта 159).
    @param node_id - ID ноды
    @param conditions - Список условий [{id, field, operator, value, targetNodeId}]
    @param default_target - ID ноды по умолчанию (else)
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды condition
    """
    branches = []
    for c in conditions:
        branches.append({
            "id": c["id"],
            "value": c["value"],
            "target": c["targetNodeId"],
            "operator": c["operator"]
        })
    # Добавляем ветку else
    branches.append({
        "id": f"{node_id}-else",
        "value": "",
        "target": default_target,
        "operator": "else"
    })
    return {
        "id": node_id, "type": "condition",
        "position": {"x": x, "y": y},
        "data": base_data(
            variable=conditions[0]["field"] if conditions else "",
            branches=branches
        )
    }


def userbot_message_node(node_id, message_text, entity, save_resp_id, next_id, x, y):
    """
    Создаёт ноду userbot_message — отправка сообщения боту через юзербот.
    @param node_id - ID ноды
    @param message_text - Текст сообщения для отправки
    @param entity - @username бота-получателя
    @param save_resp_id - Переменная для ID ответного сообщения
    @param next_id - ID следующей ноды
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды userbot_message
    """
    return {
        "id": node_id, "type": "userbot_message",
        "position": {"x": x, "y": y},
        "data": {
            "messageText": message_text,
            "formatMode": "html",
            "userbotEntity": entity,
            "attachedMedia": [],
            "disableLinkPreview": False,
            "saveMessageIdTo": "ub_sent_msg_id",
            "saveResponseIdTo": save_resp_id,
            "autoTransitionTo": next_id,
            "enableAutoTransition": True
        }
    }


def userbot_click_button_node(node_id, entity, message_id, click_value,
                               save_result_to, next_id, x, y):
    """
    Создаёт ноду userbot_click_button — нажатие кнопки в сообщении бота.
    @param node_id - ID ноды
    @param entity - @username бота
    @param message_id - ID сообщения с кнопками (шаблон переменной)
    @param click_value - Текст кнопки для нажатия
    @param save_result_to - Переменная для текста результата
    @param next_id - ID следующей ноды
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды userbot_click_button
    """
    return {
        "id": node_id, "type": "userbot_click_button",
        "position": {"x": x, "y": y},
        "data": {
            "userbotEntity": entity,
            "messageId": message_id,
            "clickMode": "text",
            "clickValue": click_value,
            "saveAlertTo": "",
            "saveResultTo": save_result_to,
            "saveButtonsTo": "",
            "saveHasMediaTo": "",
            "saveMediaTo": "",
            "autoTransitionTo": next_id,
            "enableAutoTransition": True
        }
    }


def userbot_inline_query_node(node_id, bot_username, query, save_title,
                               save_desc, next_id, x, y):
    """
    Создаёт ноду userbot_inline_query — инлайн-запрос к боту.
    @param node_id - ID ноды
    @param bot_username - @username инлайн-бота
    @param query - Текст инлайн-запроса
    @param save_title - Переменная для заголовка результата
    @param save_desc - Переменная для описания результата
    @param next_id - ID следующей ноды
    @param x - Позиция по X
    @param y - Позиция по Y
    @returns Словарь ноды userbot_inline_query
    """
    return {
        "id": node_id, "type": "userbot_inline_query",
        "position": {"x": x, "y": y},
        "data": {
            "botUsername": bot_username,
            "query": query,
            "targetChat": "me",
            "sendToSameChat": True,
            "resultIndex": "0",
            "saveResultTitleTo": save_title,
            "saveResultDescTo": save_desc,
            "saveResponseIdTo": "ub_inline_resp_id",
            "autoTransitionTo": next_id,
            "enableAutoTransition": True
        }
    }


# ─── Построение цепочки нод для одной пары (HTTP-лист) ────────────────────────

def build_pair_chain(from_cur, from_name, from_key, to_cur, to_name, to_key,
                     emoji_from, emoji_to, y_row):
    """
    Строит цепочку нод для одной пары FROM→TO с 4 обменниками.
    Использует правильные ID валют для каждого обменника из CURRENCY_IDS.
    @param from_cur - Код валюты-источника (например SBERRUB)
    @param from_name - Отображаемое имя источника
    @param from_key - Короткий ключ источника (sber, tcs, yam)
    @param to_cur - Код целевой валюты (например TON)
    @param to_name - Отображаемое имя цели
    @param to_key - Короткий ключ цели (usdt, btc, eth, ton)
    @param emoji_from - Эмодзи источника
    @param emoji_to - Эмодзи цели
    @param y_row - Позиция по Y для всей строки нод
    @returns Кортеж (список нод, ID первой fetch-ноды, текст кнопки меню)
    """
    pk = f"{from_key}-{to_key}"
    setv_id = f"setv-{pk}"
    show_id = f"show-{pk}"

    fetch_nodes = []
    for i, (ex_key, ex_name, ex_url, ex_idx) in enumerate(EXCHANGERS):
        node_id  = f"fetch-{ex_key}-{pk}"
        resp_var = f"r_{ex_key}_{from_key}_{to_key}"
        stat_var = f"s_{ex_key}"
        if i + 1 < len(EXCHANGERS):
            next_ex_key = EXCHANGERS[i + 1][0]
            next_id = f"fetch-{next_ex_key}-{pk}"
        else:
            next_id = setv_id
        x_pos = 1200 + i * 400
        fetch_nodes.append(http_node(node_id, ex_url, resp_var, stat_var, next_id, x_pos, y_row))

    # Присваивания с правильными ID для каждого обменника
    assignments = []
    for i, (ex_key, ex_name, ex_url, ex_idx) in enumerate(EXCHANGERS):
        resp_var  = f"r_{ex_key}_{from_key}_{to_key}"
        rate_var  = f"rate_{ex_key}_{from_key}_{to_key}"
        from_id   = CURRENCY_IDS[from_cur][ex_idx]
        to_id     = CURRENCY_IDS[to_cur][ex_idx]
        dot_value = "{" + f"{resp_var}.exchange.{from_id}.to.{to_id}" + "}"
        assignments.append({
            "id": f"a{i+1}-{pk}",
            "variable": rate_var,
            "value": dot_value,
            "mode": "text"
        })

    setv = set_var_node(setv_id, assignments, show_id, 2800, y_row)

    lines = [f"💱 <b>{emoji_from} {from_name} → {emoji_to} {to_name}</b>\n"]
    for ex_key, ex_name, _, _ in EXCHANGERS:
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


# ─── Построение HTTP-листа (сайты) ───────────────────────────────────────────

def build_http_compare_sheet():
    """
    Строит лист "💱 Сравнение курсов" — сравнение через HTTP API сайтов.
    @returns Словарь листа с нодами
    """
    nodes = []
    pair_buttons = []

    # Нода ошибки
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
        for _, name, url, _ in EXCHANGERS
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
        "id": "sheet-main",
        "name": "💱 Сравнение курсов",
        "nodes": all_nodes,
        "createdAt": NOW,
        "updatedAt": NOW,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100}
    }


# ─── Построение листа сравнения через ботов ───────────────────────────────────

def build_bot_compare_sheet():
    """
    Строит лист "💱 Сравнение через ботов" — сравнение курсов через Telegram-ботов.
    Поток: /compare_bots → init bot_exchangers → меню (динамические кнопки) →
    callback_trigger → ввод суммы → валидация → init переменных →
    ScoobyChange (inline) → parse → Capitalist (click chain) → parse →
    calculate → показ результатов.

    Без циклов и условных ветвлений — каждый бот имеет свою хардкодную цепочку.
    @returns Словарь листа с нодами
    """
    nodes = []

    # ─── 1. Триггер /compare_bots ────────────────────────────────────────────
    nodes.append(cmd_trigger(
        "bot-cmd-compare", "/compare_bots",
        "Сравнить курсы через ботов",
        "tbl-init-bot-ex-1", 0, 400
    ))

    # ─── 1.5. Инициализация таблицы bot_exchangers (upsert при каждом вызове) ─
    init_nodes = build_bot_exchangers_init_nodes(200, 200, "bot-msg-menu")
    nodes.extend(init_nodes)

    # ─── 2. Меню выбора пары (динамические кнопки из table.pairs) ─────────────
    dynamic_btns = {
        "columns": 2,
        "arrayPath": "",
        "styleMode": "none",
        "styleField": "",
        "textTemplate": "{emoji_from} {from_name} → {emoji_to} {to_name}",
        "styleTemplate": "",
        "sourceVariable": "table.pairs",
        "callbackTemplate": "botcmp_{from_id}_{to_id}_{from_name}_{to_name}"
    }
    nodes.append(message_node(
        "bot-msg-menu",
        "💱 <b>Сравнение через ботов</b>\n\nВыбери пару для сравнения:",
        [], "inline", 400, 400,
        dynamic_btns=dynamic_btns
    ))

    # ─── 3. Callback trigger для парсинга выбранной пары ─────────────────────
    nodes.append({
        "id": "bot-cb-pair", "type": "callback_trigger",
        "position": {"x": 600, "y": 400},
        "data": base_data(
            matchType="startswith",
            callbackData="botcmp_",
            callbackPattern="botcmp_",
            callbackMatchMode="startsWith",
            callbackParseTemplate="botcmp_{from_id}_{to_id}_{from_name}_{to_name}",
            callbackSaveVariables=[
                {"saveAs": "selected_from_id", "templateVar": "from_id"},
                {"saveAs": "selected_to_id", "templateVar": "to_id"},
                {"saveAs": "selected_from_name", "templateVar": "from_name"},
                {"saveAs": "selected_to_name", "templateVar": "to_name"},
            ],
            autoTransitionTo="bot-msg-ask-amount",
            enableAutoTransition=True
        )
    })

    # ─── 4. Запрос суммы ──────────────────────────────────────────────────────
    # ─── 4. Запрос суммы (с быстрыми кнопками) ───────────────────────────────
    amount_buttons = []
    for amount, label in [(5000, "5 000 ₽"), (10000, "10 000 ₽"), (50000, "50 000 ₽"),
                          (100000, "100 000 ₽"), (500000, "500 000 ₽")]:
        amount_buttons.append({
            "id": f"bot-amt-{amount}", "text": label, "action": "goto",
            "target": f"bot-setv-amt-{amount}", "buttonType": "normal",
            "hideAfterClick": False, "skipDataCollection": True
        })
    amount_buttons.append({
        "id": "bot-btn-cancel", "text": "◀️ Назад", "action": "goto",
        "target": "bot-msg-menu", "buttonType": "normal",
        "hideAfterClick": False, "skipDataCollection": True
    })

    nodes.append(message_node(
        "bot-msg-ask-amount",
        "📊 Пара: <b>{selected_from_name} → {selected_to_name}</b>\n\n"
        "💰 Выбери сумму или введи свою (в рублях):",
        amount_buttons,
        "inline", 1200, 400,
        auto_to="bot-input-amount"
    ))
    # Патчим layout кнопок (3 + 2 + 1)
    nodes[-1]["data"]["keyboardLayout"] = {
        "rows": [
            {"buttonIds": ["bot-amt-5000", "bot-amt-10000", "bot-amt-50000"]},
            {"buttonIds": ["bot-amt-100000", "bot-amt-500000"]},
            {"buttonIds": ["bot-btn-cancel"]},
        ],
        "columns": 3,
        "autoLayout": False
    }
    # Выделяем 10000 primary
    for b in nodes[-1]["data"]["buttons"]:
        if b["id"] == "bot-amt-10000":
            b["style"] = "primary"

    # Быстрые кнопки сумм — каждая устанавливает user_amount и переходит к init
    for amount in [5000, 10000, 50000, 100000, 500000]:
        nodes.append(set_var_node(
            f"bot-setv-amt-{amount}",
            [{"id": f"sa-{amount}", "variable": "user_amount", "value": str(amount), "mode": "text"}],
            "bot-setv-init", 1400, 400
        ))

    # Нода input — ожидание ввода своей суммы
    nodes.append({
        "id": "bot-input-amount", "type": "input",
        "position": {"x": 1400, "y": 500},
        "data": base_data(
            inputType="text",
            inputPrompt="",
            inputVariable="user_amount",
            inputRequired=True,
            appendVariable=False,
            saveToDatabase=False,
            inputTargetNodeId="bot-cond-validate"
        )
    })

    # ─── 5. Валидация ввода (условие: сумма — число) ──────────────────────────
    nodes.append(conditional_branch_node(
        "bot-cond-validate",
        [
            {
                "id": "cv1", "field": "user_amount",
                "operator": "greater_than", "value": "0",
                "targetNodeId": "bot-setv-init"
            }
        ],
        "bot-msg-invalid-amount", 1600, 400
    ))

    # Сообщение об ошибке ввода
    nodes.append(message_node(
        "bot-msg-invalid-amount",
        "⚠️ Введи корректную сумму (только число).",
        [], "none", 1600, 600,
        auto_to="bot-msg-ask-amount"
    ))

    # ─── 6. Инициализация переменных перед цепочкой ботов ─────────────────────
    nodes.append(set_var_node(
        "bot-setv-init",
        [
            {
                "id": "bi1", "variable": "compare_bot_results",
                "value": "[]", "mode": "expression"
            },
            {
                "id": "bi2", "variable": "user_amount_fmt",
                "value": "{user_amount}", "mode": "text"
            },
        ],
        "bot-ub-scooby", 2000, 400
    ))

    # ─── 7. ScoobyChange — инлайн-запрос ─────────────────────────────────────
    # @scdoo_bot: inline query "buy_btc 1" → получаем title с курсом
    nodes.append(userbot_inline_query_node(
        "bot-ub-scooby",
        "@scdoo_bot",
        "buy_btc 1",
        "ub_inline_title",
        "ub_inline_desc",
        "bot-setv-parse-scooby",
        2400, 400
    ))

    # ─── 8. Парсинг ответа ScoobyChange ──────────────────────────────────────
    # Извлекаем курс из title: "К оплате будет: 12345"
    nodes.append(set_var_node(
        "bot-setv-parse-scooby",
        [
            {
                "id": "ps1", "variable": "scooby_rate",
                "value": "{ub_inline_title}",
                "mode": "regex_extract",
                "pattern": "К оплате будет:\\s*([\\d]+)",
                "regexGroup": "1"
            }
        ],
        "bot-ub-capitalist-start", 2800, 400
    ))

    # ─── 9. Capitalist — отправка /start ─────────────────────────────────────
    # @btccapital_bot: отправляем /start, сохраняем ID ответа
    nodes.append(userbot_message_node(
        "bot-ub-capitalist-start",
        "/start",
        "@btccapital_bot",
        "cap_resp_id",
        "bot-ub-capitalist-click",
        3200, 400
    ))

    # ─── 10. Capitalist — нажатие кнопки "🔄 Купить BTC" ─────────────────────
    nodes.append(userbot_click_button_node(
        "bot-ub-capitalist-click",
        "@btccapital_bot",
        "{cap_resp_id}",
        "🔄 Купить BTC",
        "cap_click_text",
        "bot-ub-capitalist-amount",
        3600, 400
    ))

    # ─── 11. Capitalist — отправка суммы "0.001" ─────────────────────────────
    # saveResponseTextTo сохраняет текст ответа бота (с курсом)
    # responseStrategy=longest — берёт самое длинное сообщение бота
    nodes.append({
        "id": "bot-ub-capitalist-amount", "type": "userbot_message",
        "position": {"x": 4000, "y": 400},
        "data": {
            "messageText": "0.001",
            "formatMode": "html",
            "userbotEntity": "@btccapital_bot",
            "attachedMedia": [],
            "disableLinkPreview": False,
            "saveMessageIdTo": "ub_sent_msg_id",
            "saveResponseIdTo": "cap_amount_resp_id",
            "saveResponseTextTo": "cap_result_text",
            "responseWaitSeconds": 4,
            "responseStrategy": "longest",
            "responseFilterRegex": "",
            "autoTransitionTo": "bot-setv-parse-capitalist",
            "enableAutoTransition": True
        }
    })

    # ─── 12. Парсинг ответа Capitalist ───────────────────────────────────────
    # Извлекаем курс: "Курс покупки ... BTC ...: 12345"
    nodes.append(set_var_node(
        "bot-setv-parse-capitalist",
        [
            {
                "id": "pc1", "variable": "capitalist_rate",
                "value": "{cap_result_text}",
                "mode": "regex_extract",
                "pattern": "Курс покупки .*?BTC.*?:\\s*([\\d]+)",
                "regexGroup": "1"
            }
        ],
        "bot-ub-24crypto-start", 4800, 400
    ))

    # ─── 14. 24Crypto — /start → нажать «Актуальные курсы» → парсить ─────────
    nodes.append(userbot_message_node(
        "bot-ub-24crypto-start",
        "/start",
        "@Exchange24Crypto_bot",
        "crypto24_resp_id",
        "bot-ub-24crypto-click",
        5200, 400
    ))

    # Нажимаем inline-кнопку «Актуальные курсы» (бот удаляет сообщение и шлёт новое)
    nodes.append(userbot_click_button_node(
        "bot-ub-24crypto-click",
        "@Exchange24Crypto_bot",
        "{crypto24_resp_id}",
        "Актуальные курсы",
        "crypto24_text",
        "bot-setv-parse-24crypto",
        5600, 400
    ))

    # Парсинг курса (пробелы в числе — убираем через str_replace после)
    nodes.append(set_var_node(
        "bot-setv-parse-24crypto",
        [
            {
                "id": "p24_1", "variable": "crypto24_rate",
                "value": "{crypto24_text}",
                "mode": "regex_extract",
                "pattern": "Покупка BTC:\\s*([\\d][\\d\\s.,]*[\\d])",
                "regexGroup": "1"
            },
        ],
        "bot-setv-24crypto-clean", 6000, 400
    ))

    # Убираем пробелы и неразрывные пробелы из числа
    nodes.append(set_var_node(
        "bot-setv-24crypto-clean",
        [
            {
                "id": "p24_2", "variable": "crypto24_rate",
                "value": "float('{crypto24_rate}'.replace(' ', '').replace('\\xa0', '').replace(',', '.'))",
                "mode": "expression"
            },
        ],
        "bot-ub-shaxta-start", 6200, 400
    ))

    # ─── 16. Shaxta — /start → нажать «Актуальные курсы» → парсить ───────────
    nodes.append(userbot_message_node(
        "bot-ub-shaxta-start",
        "/start",
        "@shaxta24_bot",
        "shaxta_resp_id",
        "bot-ub-shaxta-click",
        6400, 400
    ))

    nodes.append(userbot_click_button_node(
        "bot-ub-shaxta-click",
        "@shaxta24_bot",
        "{shaxta_resp_id}",
        "Актуальные курсы",
        "shaxta_text",
        "bot-setv-parse-shaxta",
        6800, 400
    ))

    nodes.append(set_var_node(
        "bot-setv-parse-shaxta",
        [
            {
                "id": "psh_1", "variable": "shaxta_rate",
                "value": "{shaxta_text}",
                "mode": "regex_extract",
                "pattern": "Покупка BTC:\\s*([\\d][\\d\\s.,]*[\\d])",
                "regexGroup": "1"
            },
        ],
        "bot-setv-shaxta-clean", 7200, 400
    ))

    nodes.append(set_var_node(
        "bot-setv-shaxta-clean",
        [
            {
                "id": "psh_2", "variable": "shaxta_rate",
                "value": "float('{shaxta_rate}'.replace(' ', '').replace('\\xa0', '').replace(',', '.'))",
                "mode": "expression"
            },
        ],
        "bot-setv-calc", 7400, 400
    ))

    # ─── 17. Вычисление BTC для всех ботов ───────────────────────────────────
    nodes.append(set_var_node(
        "bot-setv-calc",
        [
            {
                "id": "calc1", "variable": "scooby_btc",
                "value": "round({user_amount} / float({scooby_rate}), 8) if float({scooby_rate}) > 0 else 0",
                "mode": "expression"
            },
            {
                "id": "calc2", "variable": "capitalist_btc",
                "value": "round({user_amount} / float({capitalist_rate}), 8) if float({capitalist_rate}) > 0 else 0",
                "mode": "expression"
            },
            {
                "id": "calc3", "variable": "crypto24_btc",
                "value": "round({user_amount} / float({crypto24_rate}), 8) if float({crypto24_rate}) > 0 else 0",
                "mode": "expression"
            },
            {
                "id": "calc4", "variable": "shaxta_btc",
                "value": "round({user_amount} / float({shaxta_rate}), 8) if float({shaxta_rate}) > 0 else 0",
                "mode": "expression"
            },
            {"id": "fmt1", "variable": "scooby_rate_fmt", "value": "{scooby_rate}", "mode": "format_number"},
            {"id": "fmt2", "variable": "capitalist_rate_fmt", "value": "{capitalist_rate}", "mode": "format_number"},
            {"id": "fmt3", "variable": "crypto24_rate_fmt", "value": "{crypto24_rate}", "mode": "format_number"},
            {"id": "fmt4", "variable": "user_amount_fmt", "value": "{user_amount}", "mode": "format_number"},
            {"id": "fmt5", "variable": "shaxta_rate_fmt", "value": "{shaxta_rate}", "mode": "format_number"},
        ],
        "bot-msg-result", 6400, 400
    ))

    # ─── 16. Показ результатов ────────────────────────────────────────────────
    result_text = (
        "💱 <b>Сравнение через ботов</b>\n"
        "📊 Пара: <b>{selected_from_name} → {selected_to_name}</b>\n"
        "💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n"
        "🥇 <a href='https://t.me/scdoo_bot?start=7733607050'>ScoobyChange</a>: "
        "<b>{scooby_btc}</b> BTC ({scooby_rate_fmt} ₽)\n"
        "🥈 <a href='https://t.me/shaxta24_bot?start=r-7733607050'>Shaxta</a>: "
        "<b>{shaxta_btc}</b> BTC ({shaxta_rate_fmt} ₽)\n"
        "🥉 <a href='https://t.me/btccapital_bot?start=7733607050'>Capitalist</a>: "
        "<b>{capitalist_btc}</b> BTC ({capitalist_rate_fmt} ₽)\n"
        "🔸 <a href='http://t.me/Exchange24Crypto_bot?start=r-7733607050'>24Crypto</a>: "
        "<b>{crypto24_btc}</b> BTC ({crypto24_rate_fmt} ₽)\n\n"
        "👆 <i>Нажми на название для перехода</i>"
    )
    nodes.append(message_node(
        "bot-msg-result",
        result_text,
        [
            {"id": "bot-btn-refresh", "text": "🔄 Обновить", "action": "goto",
             "target": "bot-setv-init", "buttonType": "normal", "style": "success",
             "skipDataCollection": False, "hideAfterClick": False},
            btn("bot-btn-new-amount", "💰 Другая сумма", "bot-msg-ask-amount"),
            btn("bot-btn-new-pair", "🔄 Другая пара", "bot-msg-menu"),
            btn("bot-btn-back-menu", "◀️ Меню", "start_dup_1775330630988_2w4z6c8t9"),
            btn("bot-btn-sites", "📋 Сайты", "msg-compare-menu"),
        ],
        "inline", 5600, 400
    ))
    # Layout: Обновить на всю ширину, потом 2+2+1
    nodes[-1]["data"]["keyboardLayout"] = {
        "rows": [
            {"buttonIds": ["bot-btn-refresh"]},
            {"buttonIds": ["bot-btn-new-amount", "bot-btn-new-pair"]},
            {"buttonIds": ["bot-btn-back-menu", "bot-btn-sites"]},
        ],
        "columns": 2,
        "autoLayout": False
    }

    return {
        "id": "sheet-bots",
        "name": "💱 Сравнение через ботов",
        "nodes": nodes,
        "createdAt": NOW,
        "updatedAt": NOW,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100}
    }


# ─── Генерация нод инициализации таблицы bot_exchangers ───────────────────────

def build_bot_exchangers_init_nodes(start_x, y, final_target):
    """
    Строит цепочку bot_table нод для инициализации таблицы bot_exchangers.
    Аналогично generate_space_bot.py — при /start бот сам создаёт записи.
    @param start_x - Начальная позиция X
    @param y - Позиция Y
    @param final_target - ID ноды, куда перейти после инициализации
    @returns Список нод bot_table
    """
    nodes = []
    for i, (name, username, ref_url, mode, step1, click_btn,
            step2, inline_q, regex, wait) in enumerate(BOT_EXCHANGERS):
        node_id = f"tbl-init-bot-ex-{i+1}"
        next_id = f"tbl-init-bot-ex-{i+2}" if i < len(BOT_EXCHANGERS) - 1 else final_target
        nodes.append({
            "id": node_id, "type": "bot_table",
            "position": {"x": start_x + i * 250, "y": y},
            "data": {
                "tableName": "bot_exchangers",
                "operation": "upsert",
                "key": "username",
                "row": {
                    "name": name,
                    "username": username,
                    "ref_url": ref_url,
                    "mode": mode,
                    "step1_text": step1,
                    "click_button": click_btn,
                    "step2_text": step2,
                    "inline_query": inline_q,
                    "rate_regex": regex,
                    "wait_seconds": str(wait),
                },
                "onConflict": "ignore",
                "autoTransitionTo": next_id,
                "enableAutoTransition": True,
            }
        })
    return nodes


# ─── Главная функция сборки проекта ──────────────────────────────────────────

def build_project():
    """
    Строит полный project.json для бота мониторинга обменников.
    Включает два листа: HTTP-сравнение (сайты) и userbot-сравнение (боты).
    @returns Словарь с полной структурой проекта
    """
    sheet_http = build_http_compare_sheet()
    sheet_bots = build_bot_compare_sheet()

    return {
        "version": 2,
        "activeSheetId": "sheet-main",
        "sheets": [sheet_http, sheet_bots]
    }


# ─── Точка входа ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🔨 Строим project.json (4 обменника-сайта, 8 пар + 5 ботов)...")
    project = build_project()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Валидация — перечитываем и считаем
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        loaded = json.load(f)

    total_nodes = sum(len(s["nodes"]) for s in loaded["sheets"])
    sheet_count = len(loaded["sheets"])
    for s in loaded["sheets"]:
        print(f"  📋 Лист \"{s['name']}\": {len(s['nodes'])} нод")

    print(f"\n✅ Сохранено: {OUTPUT_FILE}")
    print(f"📊 Всего нод: {total_nodes}")
    print(f"📋 Листов: {sheet_count}")
    print("🎉 JSON валидный!")
