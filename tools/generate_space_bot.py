"""
@fileoverview Генератор project.json для бота «Космический Торговец».
Создаёт 4 листа: Старт/Меню, Торговля, Карта, Корабль.
Фаза 1 — скелет с заглушками для будущей логики.
@module tools/generate_space_bot
"""

import json
from pathlib import Path


# ============================================================
# Вспомогательные функции (аналогично generate_clone_bot.py)
# ============================================================

# Константа — HTML mention пилота
MENTION = "<a href='tg://user?id={user_id}'>{pilot.nickname}</a>"


def btn(btn_id: str, text: str, action: str = "goto", **kwargs) -> dict:
    """
    Создаёт объект кнопки.
    @param btn_id - уникальный ID кнопки
    @param text - текст кнопки
    @param action - действие (goto, url и т.д.)
    @returns словарь кнопки
    """
    b = {"id": btn_id, "text": text, "action": action}
    b.update(kwargs)
    return b


def node(node_id: str, node_type: str, x: int, y: int, data: dict) -> dict:
    """
    Создаёт узел сценария.
    @param node_id - уникальный ID узла
    @param node_type - тип узла
    @param x - позиция X
    @param y - позиция Y
    @param data - данные узла
    @returns словарь узла
    """
    return {
        "id": node_id,
        "type": node_type,
        "position": {"x": x, "y": y},
        "data": data,
    }


def branch(bid: str, label: str, op: str, value: str, target: str) -> dict:
    """
    Создаёт ветку условия.
    @param bid - ID ветки
    @param label - метка
    @param op - оператор
    @param value - значение
    @param target - целевой узел
    @returns словарь ветки
    """
    return {"id": bid, "label": label, "operator": op, "value": value, "target": target}


# ============================================================
# Главная reply-клавиатура (6 кнопок, 3x2)
# ============================================================

def main_menu_msg(msg_id: str, text: str, x: int, y: int) -> dict:
    """
    Создаёт сообщение с главной reply-клавиатурой космического торговца.
    @param msg_id - ID узла
    @param text - текст сообщения
    @param x - позиция X
    @param y - позиция Y
    @returns узел сообщения с reply-клавиатурой
    """
    return node(msg_id, "message", x, y, {
        "messageText": text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn(f"{msg_id}-trade", "🛒 Торговля"),
            btn(f"{msg_id}-map", "🗺 Карта"),
            btn(f"{msg_id}-ship", "🔧 Корабль"),
            btn(f"{msg_id}-profile", "👤 Профиль"),
            btn(f"{msg_id}-top", "🏆 Топ"),
            btn(f"{msg_id}-planet", "🌍 Планета"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": [f"{msg_id}-trade", f"{msg_id}-map", f"{msg_id}-ship"]},
                {"buttonIds": [f"{msg_id}-profile", f"{msg_id}-top", f"{msg_id}-planet"]},
            ],
        },
        "resizeKeyboard": True,
    })


# ============================================================
# Лист 1: ⭐ Старт / Меню (sheet-start-menu)
# ============================================================

def build_start_menu() -> dict:
    """
    Строит лист «⭐ Старт / Меню».
    Содержит /start, инициализацию таблиц, приветствие, триггеры меню, профиль.
    @returns словарь листа
    """
    nodes = []

    # --- /start → count pilots → set game_id → upsert pilot → init planets → init goods → welcome ---
    nodes.append(node("cmd-start", "command_trigger", 100, 0, {
        "command": "/start",
        "description": "Запустить бота",
        "showInMenu": True,
        "autoTransitionTo": "tbl-count-pilots",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-count-pilots", "bot_table", 300, 0, {
        "tableName": "pilots",
        "operation": "count",
        "where": [],
        "saveResultTo": "pilots_count",
        "autoTransitionTo": "set-game-id",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-game-id", "set_variable", 500, 0, {
        "assignments": [
            {"id": "a-gid", "variable": "new_game_id", "value": "{pilots_count} + 1", "mode": "expression"},
        ],
        "autoTransitionTo": "tbl-upsert-pilot",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-upsert-pilot", "bot_table", 700, 0, {
        "tableName": "pilots",
        "operation": "upsert",
        "key": "telegram_id",
        "row": {
            "telegram_id": "{user_id}",
            "nickname": "{first_name}",
            "credits": "500",
            "current_planet": "earth",
            "fuel": "50",
            "cargo_used": "0",
            "cargo_max": "10",
            "engine_level": "1",
            "hull_level": "1",
            "armor_level": "1",
            "planet_id": "",
            "game_id": "{new_game_id}",
            "registered_at": "{today} {time}",
        },
        "onConflict": "ignore",
        "saveResultTo": "pilot",
        "autoTransitionTo": "tbl-init-planets",
        "enableAutoTransition": True,
    }))

    # --- Инициализация планет ---
    nodes.append(node("tbl-init-planets", "bot_table", 900, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "earth",
            "name": "Земля",
            "emoji": "🌍",
            "description": "Родная планета",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-planets-mars",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-planets-mars", "bot_table", 1100, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "mars",
            "name": "Марс",
            "emoji": "🔴",
            "description": "Красная планета",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-planets-titan",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-planets-titan", "bot_table", 1300, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "titan",
            "name": "Титан",
            "emoji": "🪐",
            "description": "Спутник Сатурна",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-planets-nebula",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-planets-nebula", "bot_table", 1500, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "nebula",
            "name": "Туманность",
            "emoji": "🌌",
            "description": "Загадочная туманность",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-goods",
        "enableAutoTransition": True,
    }))

    # --- Инициализация товаров (5 товаров с ценами на 4 планетах) ---
    nodes.append(node("tbl-init-goods", "bot_table", 1700, -150, {
        "tableName": "goods",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "ore",
            "name": "Руда",
            "emoji": "⛏",
            "price_earth": "50",
            "price_mars": "30",
            "price_titan": "20",
            "price_nebula": "80",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-goods-crystals",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-goods-crystals", "bot_table", 1900, -150, {
        "tableName": "goods",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "crystals",
            "name": "Кристаллы",
            "emoji": "💎",
            "price_earth": "200",
            "price_mars": "300",
            "price_titan": "100",
            "price_nebula": "350",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-goods-fuel",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-goods-fuel", "bot_table", 2100, -150, {
        "tableName": "goods",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "fuel_good",
            "name": "Топливо",
            "emoji": "⛽",
            "price_earth": "30",
            "price_mars": "50",
            "price_titan": "40",
            "price_nebula": "60",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-goods-electronics",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-goods-electronics", "bot_table", 2300, -150, {
        "tableName": "goods",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "electronics",
            "name": "Электроника",
            "emoji": "🔌",
            "price_earth": "150",
            "price_mars": "100",
            "price_titan": "200",
            "price_nebula": "120",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-goods-food",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-goods-food", "bot_table", 2500, -150, {
        "tableName": "goods",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "food",
            "name": "Еда",
            "emoji": "🍖",
            "price_earth": "20",
            "price_mars": "40",
            "price_titan": "60",
            "price_nebula": "10",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "msg-welcome",
        "enableAutoTransition": True,
    }))

    # --- Приветственное сообщение с главным меню ---
    welcome_text = (
        "🚀 Добро пожаловать на борт, пилот!\n\n"
        "Вы на планете: 🌍 Земля\n"
        "💰 Кредиты: 500\n"
        "⛽ Топливо: 50\n"
        "📦 Трюм: 0/10"
    )
    nodes.append(main_menu_msg("msg-welcome", welcome_text, 2700, 0))

    # --- Триггеры главного меню ---
    nodes.append(node("trig-trade", "text_trigger", 100, 300, {
        "textMatchType": "exact",
        "textSynonyms": ["🛒 Торговля"],
        "autoTransitionTo": "tbl-read-pilot-trade",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-map", "text_trigger", 100, 450, {
        "textMatchType": "exact",
        "textSynonyms": ["🗺 Карта"],
        "autoTransitionTo": "tbl-read-pilot-map",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-ship", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["🔧 Корабль"],
        "autoTransitionTo": "tbl-read-pilot-ship",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-profile", "text_trigger", 100, 750, {
        "textMatchType": "exact",
        "textSynonyms": ["👤 Профиль"],
        "autoTransitionTo": "tbl-read-pilot-profile",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-top", "text_trigger", 100, 900, {
        "textMatchType": "exact",
        "textSynonyms": ["🏆 Топ"],
        "autoTransitionTo": "msg-top-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-planet", "text_trigger", 100, 1050, {
        "textMatchType": "exact",
        "textSynonyms": ["🌍 Планета"],
        "autoTransitionTo": "msg-planet-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-back-menu", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["⬅️ Меню"],
        "autoTransitionTo": "tbl-read-pilot-menu",
        "enableAutoTransition": True,
    }))

    # --- Возврат в меню ---
    nodes.append(node("tbl-read-pilot-menu", "bot_table", 400, 1200, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-main-menu",
        "enableAutoTransition": True,
    }))

    main_menu_text = (
        f"🚀 {MENTION}, главное меню:\n\n"
        "🌍 Планета: {pilot.current_planet}\n"
        "💰 Кредиты: {pilot.credits}\n"
        "⛽ Топливо: {pilot.fuel}\n"
        "📦 Трюм: {pilot.cargo_used}/{pilot.cargo_max}"
    )
    nodes.append(main_menu_msg("msg-main-menu", main_menu_text, 700, 1200))

    # --- Заглушки: Топ, Планета ---
    nodes.append(node("msg-top-wip", "message", 400, 900, {
        "messageText": "🏆 Топ пилотов — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("msg-planet-wip", "message", 400, 1050, {
        "messageText": "🌍 Моя планета — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Профиль (👤) ---
    nodes.append(node("tbl-read-pilot-profile", "bot_table", 400, 750, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-profile",
        "enableAutoTransition": True,
    }))

    profile_text = (
        f"👤 {MENTION}, ваш профиль:\n\n"
        "🆔 ID: <code>{pilot.game_id}</code>\n"
        "💰 Кредиты: <code>{pilot.credits}</code>\n"
        "🌍 Планета: <code>{pilot.current_planet}</code>\n"
        "📦 Трюм: {pilot.cargo_used}/{pilot.cargo_max}\n"
        "⛽ Топливо: <code>{pilot.fuel}</code>\n\n"
        "🚀 Корабль:\n"
        "  📦 Трюм: ур. {pilot.hull_level}\n"
        "  🚀 Двигатель: ур. {pilot.engine_level}\n"
        "  🛡 Броня: ур. {pilot.armor_level}\n\n"
        "📅 Регистрация: <code>{pilot.registered_at}</code>"
    )
    nodes.append(node("msg-profile", "message", 700, 750, {
        "messageText": profile_text,
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-start-menu",
        "name": "⭐ Старт / Меню",
        "nodes": nodes,
    }


# ============================================================
# Лист 2: 🛒 Торговля (sheet-trade)
# ============================================================

def build_trade() -> dict:
    """
    Строит лист «🛒 Торговля».
    Содержит подменю торговли, заглушки купить/продать/трюм.
    @returns словарь листа
    """
    nodes = []

    # --- Подменю торговли (переход из trig-trade на sheet-start-menu) ---
    nodes.append(node("tbl-read-pilot-trade", "bot_table", 100, 0, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-trade-menu",
        "enableAutoTransition": True,
    }))

    trade_menu_text = (
        f"🛒 {MENTION}, меню торговли:\n\n"
        "🌍 Вы на: {pilot.current_planet}\n"
        "💰 Кредиты: {pilot.credits}\n"
        "📦 Трюм: {pilot.cargo_used}/{pilot.cargo_max}"
    )
    nodes.append(node("msg-trade-menu", "message", 400, 0, {
        "messageText": trade_menu_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-t-buy", "🛒 Купить"),
            btn("btn-t-sell", "💰 Продать"),
            btn("btn-t-cargo", "📦 Трюм"),
            btn("btn-t-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-t-buy", "btn-t-sell"]},
                {"buttonIds": ["btn-t-cargo"]},
                {"buttonIds": ["btn-t-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # --- Триггер «Купить» (заглушка) ---
    nodes.append(node("trig-buy", "text_trigger", 100, 250, {
        "textMatchType": "exact",
        "textSynonyms": ["🛒 Купить"],
        "autoTransitionTo": "msg-buy-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-buy-wip", "message", 400, 250, {
        "messageText": "🛒 Покупка товаров — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Триггер «Продать» (заглушка) ---
    nodes.append(node("trig-sell", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["💰 Продать"],
        "autoTransitionTo": "msg-sell-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-sell-wip", "message", 400, 400, {
        "messageText": "💰 Продажа товаров — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Триггер «Трюм» (заглушка) ---
    nodes.append(node("trig-cargo", "text_trigger", 100, 550, {
        "textMatchType": "exact",
        "textSynonyms": ["📦 Трюм"],
        "autoTransitionTo": "msg-cargo-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-cargo-wip", "message", 400, 550, {
        "messageText": "📦 Содержимое трюма — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-trade",
        "name": "🛒 Торговля",
        "nodes": nodes,
    }


# ============================================================
# Лист 3: 🗺 Карта (sheet-map)
# ============================================================

def build_map() -> dict:
    """
    Строит лист «🗺 Карта».
    Содержит подменю карты, заглушки перелётов на планеты.
    @returns словарь листа
    """
    nodes = []

    # --- Подменю карты ---
    nodes.append(node("tbl-read-pilot-map", "bot_table", 100, 0, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-map-menu",
        "enableAutoTransition": True,
    }))

    map_menu_text = (
        f"🗺 {MENTION}, карта галактики:\n\n"
        "📍 Вы здесь: {pilot.current_planet}"
    )
    nodes.append(node("msg-map-menu", "message", 400, 0, {
        "messageText": map_menu_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-m-earth", "🌍 Земля"),
            btn("btn-m-mars", "🔴 Марс"),
            btn("btn-m-titan", "🪐 Титан"),
            btn("btn-m-nebula", "🌌 Туманность"),
            btn("btn-m-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-m-earth", "btn-m-mars"]},
                {"buttonIds": ["btn-m-titan", "btn-m-nebula"]},
                {"buttonIds": ["btn-m-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # --- Триггеры планет (заглушки) ---
    nodes.append(node("trig-earth", "text_trigger", 100, 250, {
        "textMatchType": "exact",
        "textSynonyms": ["🌍 Земля"],
        "autoTransitionTo": "msg-fly-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-mars", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["🔴 Марс"],
        "autoTransitionTo": "msg-fly-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-titan", "text_trigger", 100, 550, {
        "textMatchType": "exact",
        "textSynonyms": ["🪐 Титан"],
        "autoTransitionTo": "msg-fly-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-nebula", "text_trigger", 100, 700, {
        "textMatchType": "exact",
        "textSynonyms": ["🌌 Туманность"],
        "autoTransitionTo": "msg-fly-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-fly-wip", "message", 400, 400, {
        "messageText": "🚀 Перелёты — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-map",
        "name": "🗺 Карта",
        "nodes": nodes,
    }


# ============================================================
# Лист 4: 🔧 Корабль (sheet-ship)
# ============================================================

def build_ship() -> dict:
    """
    Строит лист «🔧 Корабль».
    Содержит подменю корабля, заглушки улучшений.
    @returns словарь листа
    """
    nodes = []

    # --- Подменю корабля ---
    nodes.append(node("tbl-read-pilot-ship", "bot_table", 100, 0, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-ship-menu",
        "enableAutoTransition": True,
    }))

    ship_menu_text = (
        f"🔧 {MENTION}, ваш корабль:\n\n"
        "📦 Трюм: ур. {pilot.hull_level}\n"
        "🚀 Двигатель: ур. {pilot.engine_level}\n"
        "🛡 Броня: ур. {pilot.armor_level}"
    )
    nodes.append(node("msg-ship-menu", "message", 400, 0, {
        "messageText": ship_menu_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-s-hull", "📦 Трюм"),
            btn("btn-s-engine", "🚀 Двигатель"),
            btn("btn-s-armor", "🛡 Броня"),
            btn("btn-s-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-s-hull", "btn-s-engine", "btn-s-armor"]},
                {"buttonIds": ["btn-s-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # --- Триггеры улучшений (заглушки) ---
    nodes.append(node("trig-hull", "text_trigger", 100, 250, {
        "textMatchType": "exact",
        "textSynonyms": ["📦 Трюм"],
        "autoTransitionTo": "msg-hull-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-hull-wip", "message", 400, 250, {
        "messageText": "📦 Улучшение трюма — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("trig-engine", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["🚀 Двигатель"],
        "autoTransitionTo": "msg-engine-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-engine-wip", "message", 400, 400, {
        "messageText": "🚀 Улучшение двигателя — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("trig-armor", "text_trigger", 100, 550, {
        "textMatchType": "exact",
        "textSynonyms": ["🛡 Броня"],
        "autoTransitionTo": "msg-armor-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-armor-wip", "message", 400, 550, {
        "messageText": "🛡 Улучшение брони — в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-ship",
        "name": "🔧 Корабль",
        "nodes": nodes,
    }


# ============================================================
# Сборка проекта
# ============================================================

def build_project() -> dict:
    """
    Собирает полный project.json из всех листов.
    @returns полная структура проекта
    """
    return {
        "version": 2,
        "activeSheetId": "sheet-start-menu",
        "sheets": [
            build_start_menu(),
            build_trade(),
            build_map(),
            build_ship(),
        ],
    }


def main():
    """
    Точка входа: генерирует project.json и записывает в папку бота.
    """
    project = build_project()

    # Определяем путь к выходному файлу
    output_dir = Path(__file__).resolve().parent.parent / "bots" / "клон"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "project.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Подсчёт статистики
    total_nodes = sum(len(sheet["nodes"]) for sheet in project["sheets"])
    total_sheets = len(project["sheets"])

    print(f"✅ project.json сгенерирован успешно!")
    print(f"   📁 Путь: {output_path}")
    print(f"   📄 Листов: {total_sheets}")
    print(f"   🔲 Узлов: {total_nodes}")
    print(f"   📦 Размер: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
