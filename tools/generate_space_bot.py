"""
@fileoverview Генератор project.json для бота «Космический Торговец».
Создаёт 6 листов: Старт/Меню, Торговля, Карта, Пираты, Корабль, Планета.
Фаза 1 — скелет с заглушками для будущей логики.
8 руд, динамические цены, фрагменты Эфира.
@module tools/generate_space_bot
"""

import json
from pathlib import Path


# ============================================================
# Вспомогательные функции
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
# Данные руд (8 штук)
# ============================================================

ORES = [
    {"id": "iron", "name": "Железо", "emoji": "⚙️", "earth": "40", "mars": "25", "titan": "30", "nebula": "55"},
    {"id": "copper", "name": "Медь", "emoji": "🟤", "earth": "60", "mars": "45", "titan": "70", "nebula": "50"},
    {"id": "titanium", "name": "Титан", "emoji": "🔩", "earth": "90", "mars": "120", "titan": "50", "nebula": "100"},
    {"id": "uranium", "name": "Уран", "emoji": "☢️", "earth": "150", "mars": "100", "titan": "180", "nebula": "130"},
    {"id": "crystal", "name": "Кристалл", "emoji": "💎", "earth": "200", "mars": "300", "titan": "100", "nebula": "350"},
    {"id": "etherite", "name": "Этерит", "emoji": "✨", "earth": "250", "mars": "180", "titan": "220", "nebula": "120"},
    {"id": "mithril", "name": "Мифрил", "emoji": "🪙", "earth": "320", "mars": "280", "titan": "350", "nebula": "400"},
    {"id": "nexar", "name": "Нексар", "emoji": "🔮", "earth": "500", "mars": "450", "titan": "600", "nebula": "380"},
]


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
            btn(f"{msg_id}-map", "🚀 Полёты"),
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

    # --- /start → count pilots → set game_id → upsert pilot → init planets → init ores → welcome ---
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
            "current_planet_name": "🌍 Земля",
            "fuel": "50",
            "cargo_used": "0",
            "cargo_max": "10",
            "engine_level": "1",
            "hull_level": "1",
            "armor_level": "1",
            "planet_id": "",
            "game_id": "{new_game_id}",
            "registered_at": "{today} {time}",
            "fragments": "0",
            "flight_expires_at": "",
            "flight_target_planet": "",
            "flight_target_name": "",
            "status_text": "📍 Планета: <b>🌍 Земля</b>",
            "last_daily": "",
            "flight_fuel_cost": "",
            "flight_start_ts": "",
        },
        "onConflict": "merge",
        "saveResultTo": "pilot",
        "autoTransitionTo": "tbl-reset-flight",
        "enableAutoTransition": True,
    }))

    # Принудительно сбрасываем flight-поля при /start (на случай если бот перезапустился во время полёта)
    nodes.append(node("tbl-reset-flight", "bot_table", 800, 50, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "flight_expires_at", "op": "set", "value": ""},
            {"column": "flight_target_planet", "op": "set", "value": ""},
            {"column": "flight_target_name", "op": "set", "value": ""},
            {"column": "status_text", "op": "set", "value": "📍 Планета: <b>{pilot.current_planet_name}</b>"},
        ],
        "autoTransitionTo": "tbl-init-planets",
        "enableAutoTransition": True,
    }))

    # --- Инициализация планет ---
    nodes.append(node("tbl-init-planets", "bot_table", 900, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {"id": "earth", "name": "Земля", "emoji": "🌍", "description": "Родная планета"},
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-planets-mars",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-planets-mars", "bot_table", 1100, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {"id": "mars", "name": "Марс", "emoji": "🔴", "description": "Красная планета"},
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-planets-titan",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-planets-titan", "bot_table", 1300, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {"id": "titan", "name": "Титан", "emoji": "🪐", "description": "Спутник Сатурна"},
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-planets-nebula",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-init-planets-nebula", "bot_table", 1500, -150, {
        "tableName": "planets",
        "operation": "upsert",
        "key": "id",
        "row": {"id": "nebula", "name": "Туманность", "emoji": "🌌", "description": "Загадочная туманность"},
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-ores",
        "enableAutoTransition": True,
    }))

    # --- Инициализация руд (8 штук с базовыми ценами на 4 планетах) ---
    for i, ore in enumerate(ORES):
        ore_node_id = f"tbl-init-ores" if i == 0 else f"tbl-init-ores-{ore['id']}"
        # Следующий узел в цепочке — последняя руда переходит к инициализации upgrades
        if i < len(ORES) - 1:
            next_id = f"tbl-init-ores-{ORES[i + 1]['id']}"
        else:
            next_id = "tbl-init-upgrades-1"

        nodes.append(node(ore_node_id, "bot_table", 1700 + i * 200, -150, {
            "tableName": "ores",
            "operation": "upsert",
            "key": "id",
            "row": {
                "id": ore["id"],
                "name": ore["name"],
                "emoji": ore["emoji"],
                "base_price_earth": ore["earth"],
                "base_price_mars": ore["mars"],
                "base_price_titan": ore["titan"],
                "base_price_nebula": ore["nebula"],
            },
            "onConflict": "ignore",
            "autoTransitionTo": next_id,
            "enableAutoTransition": True,
        }))

    # --- Инициализация таблицы upgrades (5 уровней корабля) ---
    UPGRADES = [
        {"level": "1", "hull_slots": "10", "fuel_max": "50", "armor_pct": "30", "price": "0"},
        {"level": "2", "hull_slots": "20", "fuel_max": "75", "armor_pct": "45", "price": "5000"},
        {"level": "3", "hull_slots": "35", "fuel_max": "100", "armor_pct": "60", "price": "20000"},
        {"level": "4", "hull_slots": "50", "fuel_max": "150", "armor_pct": "75", "price": "100000"},
        {"level": "5", "hull_slots": "80", "fuel_max": "200", "armor_pct": "90", "price": "500000"},
    ]
    upgrades_base_x = 1700 + len(ORES) * 200
    for i, upg in enumerate(UPGRADES):
        upg_node_id = f"tbl-init-upgrades-{i + 1}"
        next_id = f"tbl-init-upgrades-{i + 2}" if i < len(UPGRADES) - 1 else "tbl-init-names-1"

        nodes.append(node(upg_node_id, "bot_table", upgrades_base_x + i * 200, -150, {
            "tableName": "upgrades",
            "operation": "upsert",
            "key": "level",
            "row": {
                "level": upg["level"],
                "hull_slots": upg["hull_slots"],
                "fuel_max": upg["fuel_max"],
                "armor_pct": upg["armor_pct"],
                "price": upg["price"],
            },
            "onConflict": "ignore",
            "autoTransitionTo": next_id,
            "enableAutoTransition": True,
        }))

    # --- Инициализация таблицы planet_names (10 случайных названий) ---
    PLANET_NAMES = [
        {"id": "1", "name": "Нова-7"},
        {"id": "2", "name": "Кеплер-22"},
        {"id": "3", "name": "Андромеда-X"},
        {"id": "4", "name": "Сириус-3"},
        {"id": "5", "name": "Орион-12"},
        {"id": "6", "name": "Вега-Prime"},
        {"id": "7", "name": "Альтаир-9"},
        {"id": "8", "name": "Проксима-4"},
        {"id": "9", "name": "Центавр-6"},
        {"id": "10", "name": "Дзета-11"},
    ]
    names_base_x = upgrades_base_x + len(UPGRADES) * 200
    for i, pn in enumerate(PLANET_NAMES):
        pn_node_id = f"tbl-init-names-{i + 1}"
        next_id = f"tbl-init-names-{i + 2}" if i < len(PLANET_NAMES) - 1 else "msg-welcome"

        nodes.append(node(pn_node_id, "bot_table", names_base_x + i * 200, -150, {
            "tableName": "planet_names",
            "operation": "upsert",
            "key": "id",
            "row": {
                "id": pn["id"],
                "name": pn["name"],
            },
            "onConflict": "ignore",
            "autoTransitionTo": next_id,
            "enableAutoTransition": True,
        }))

    # --- Приветственное сообщение с главным меню ---
    welcome_text = (
        f"🚀 Добро пожаловать на борт, {MENTION}!\n\n"
        "{pilot.status_text}\n"
        "💰 Кредиты: <code>{pilot.credits}</code>\n"
        "⛽ Топливо: <code>{pilot.fuel}</code>\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>"
    )
    # Позиция X после всех руд
    welcome_x = 1700 + len(ORES) * 200
    nodes.append(main_menu_msg("msg-welcome", welcome_text, welcome_x, 0))

    # --- Триггеры главного меню ---
    nodes.append(node("trig-trade", "text_trigger", 100, 300, {
        "textMatchType": "exact",
        "textSynonyms": ["🛒 Торговля"],
        "autoTransitionTo": "tbl-read-pilot-trade",
        "enableAutoTransition": True,
    }))

    nodes.append(node("trig-map", "text_trigger", 100, 450, {
        "textMatchType": "exact",
        "textSynonyms": ["🚀 Полёты", "🚀 Полёт"],
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
        "autoTransitionTo": "tbl-read-pilot-planet",
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
        "autoTransitionTo": "menu-set-now",
        "enableAutoTransition": True,
    }))

    # Проверяем в полёте ли для выбора меню
    nodes.append(node("menu-set-now", "set_variable", 500, 1200, {
        "assignments": [
            {"id": "a-menu-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
            {"id": "a-menu-credits-fmt", "variable": "credits_fmt", "value": "{pilot.credits}", "mode": "format_number"},
            {"id": "a-menu-fuel-fmt", "variable": "fuel_fmt", "value": "{pilot.fuel}", "mode": "format_number"},
        ],
        "autoTransitionTo": "menu-cond-inflight",
        "enableAutoTransition": True,
    }))

    nodes.append(node("menu-cond-inflight", "condition", 600, 1200, {
        "variable": "pilot.flight_expires_at",
        "branches": [
            branch("br-menu-inflight", "В полёте", "greater_than", "{now_ts}", "msg-main-menu-flight"),
            branch("br-menu-free", "На планете", "else", "", "msg-main-menu"),
        ],
    }))

    # Урезанное меню в полёте
    flight_menu_text = (
        f"🚀 {MENTION}, главное меню:\n\n"
        "{pilot.status_text}\n"
        "💰 Кредиты: <code>{credits_fmt}</code>\n"
        "⛽ Топливо: <code>{fuel_fmt}</code>\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>"
    )
    nodes.append(node("msg-main-menu-flight", "message", 700, 1350, {
        "messageText": flight_menu_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-mf-profile", "👤 Профиль"),
            btn("btn-mf-ship", "🔧 Корабль"),
            btn("btn-mf-flights", "🚀 Полёт"),
            btn("btn-mf-top", "🏆 Топ"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-mf-profile", "btn-mf-ship"]},
                {"buttonIds": ["btn-mf-flights", "btn-mf-top"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # Полное меню на планете
    main_menu_text = (
        f"🚀 {MENTION}, главное меню:\n\n"
        "{pilot.status_text}\n"
        "💰 Кредиты: <code>{credits_fmt}</code>\n"
        "⛽ Топливо: <code>{fuel_fmt}</code>\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>"
    )
    nodes.append(main_menu_msg("msg-main-menu", main_menu_text, 700, 1200))

    # --- Заглушка: Топ ---
    nodes.append(node("msg-top-wip", "message", 400, 900, {
        "messageText": "🏆 Топ пилотов — в разработке.",
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
        "{pilot.status_text}\n"
        "📦 Трюм: {pilot.cargo_used}/{pilot.cargo_max}\n"
        "⛽ Топливо: <code>{pilot.fuel}</code>\n"
        "🌀 Фрагменты Эфира: <code>{pilot.fragments}</code>\n\n"
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

    # --- /daily — ежедневный бонус ---
    nodes.append(node("cmd-daily", "command_trigger", 100, 1400, {
        "command": "/daily",
        "description": "Ежедневный бонус",
        "showInMenu": True,
        "autoTransitionTo": "tbl-read-pilot-daily",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-read-pilot-daily", "bot_table", 400, 1400, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-daily-check",
        "enableAutoTransition": True,
    }))

    # Вычисляем: текущий timestamp и timestamp когда можно получить бонус (last_daily + 86400)
    nodes.append(node("set-daily-check", "set_variable", 700, 1400, {
        "assignments": [
            {"id": "a-daily-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
            {"id": "a-daily-next", "variable": "daily_next", "value": "{pilot.last_daily} + 86400", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-daily-ready",
        "enableAutoTransition": True,
    }))

    # Условие: now_ts >= daily_next (прошло 24ч) или last_daily пустое (первый раз)
    nodes.append(node("cond-daily-ready", "condition", 1000, 1400, {
        "variable": "pilot.last_daily",
        "branches": [
            branch("br-daily-first", "Первый раз", "is_empty", "", "do-daily-bonus"),
            branch("br-daily-check-time", "Проверить время", "else", "", "cond-daily-time"),
        ],
    }))

    nodes.append(node("cond-daily-time", "condition", 1000, 1600, {
        "variable": "now_ts",
        "branches": [
            branch("br-daily-ready", "Готов", "greater_than", "{daily_next}", "do-daily-bonus"),
            branch("br-daily-wait", "Рано", "else", "", "set-daily-remaining"),
        ],
    }))

    # Вычисляем оставшееся время
    nodes.append(node("set-daily-remaining", "set_variable", 1300, 1600, {
        "assignments": [
            {"id": "a-daily-rem", "variable": "daily_remaining", "value": "{daily_next} - {now_ts}", "mode": "format_duration"},
        ],
        "autoTransitionTo": "msg-daily-wait",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-daily-wait", "message", 1600, 1600, {
        "messageText": "⏳ Ежедневный бонус ещё не готов!\n\n🕐 Осталось: <code>{daily_remaining}</code>",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    # Начисляем бонус
    nodes.append(node("do-daily-bonus", "bot_table", 1300, 1400, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "increment", "value": "500"},
            {"column": "fuel", "op": "increment", "value": "10"},
            {"column": "last_daily", "op": "set", "value": "{now_ts}"},
        ],
        "autoTransitionTo": "msg-daily-ok",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-daily-ok", "message", 1600, 1400, {
        "messageText": "🎁 Ежедневный бонус получен!\n\n💰 +<code>500</code> кредитов\n⛽ +<code>10</code> топлива\n\nВозвращайтесь завтра!",
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
    Содержит подменю торговли, покупку руд (inline), продажу, просмотр трюма.
    Цены берутся из ore_prices (генерируются on-demand через set_variable random).
    @returns словарь листа
    """
    nodes = []

    # --- Подменю торговли (reply) ---
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
        "{pilot.status_text}\n"
        "💰 Кредиты: <code>{pilot.credits}</code>\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>"
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

    # =============================================
    # 🛒 КУПИТЬ — показ руд с ценами (inline)
    # =============================================
    # Цепочка: trig-buy → read pilot → read ores → msg-buy-menu (inline 8 руд)
    nodes.append(node("trig-buy", "text_trigger", 100, 300, {
        "textMatchType": "exact",
        "textSynonyms": ["🛒 Купить"],
        "autoTransitionTo": "tbl-buy-read-pilot",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-buy-read-pilot", "bot_table", 400, 300, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "tbl-buy-read-ores",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-buy-read-ores", "bot_table", 700, 300, {
        "tableName": "ores",
        "operation": "read",
        "where": [],
        "saveResultTo": "ores_list",
        "resultFormat": "all_rows",
        "autoTransitionTo": "buy-set-prices",
        "enableAutoTransition": True,
    }))

    # Вычисляем цены на текущей планете для каждой руды (для кнопок)
    price_assignments = []
    for ore in ORES:
        price_assignments.append({
            "id": f"a-price-{ore['id']}",
            "variable": f"price_{ore['id']}",
            "value": f"{{buy_ore_{ore['id']}.base_price_{{pilot.current_planet}}}}",
            "mode": "text",
        })
    # Нужно сначала прочитать каждую руду — используем lookup из ores_list
    lookup_assignments = []
    for ore in ORES:
        lookup_assignments.append({
            "id": f"a-lk-{ore['id']}",
            "variable": f"price_{ore['id']}",
            "value": "",
            "mode": "lookup",
            "lookupTable": "ores",
            "lookupField": f"base_price_{{pilot.current_planet}}",
            "lookupWhere": [{"field": "id", "value": ore['id']}],
        })

    nodes.append(node("buy-set-prices", "set_variable", 900, 300, {
        "assignments": lookup_assignments,
        "autoTransitionTo": "msg-buy-menu",
        "enableAutoTransition": True,
    }))

    # Сообщение с inline-кнопками для покупки (8 руд с ценами)
    buy_text = (
        f"🛒 {MENTION}, руды на планете <b>{{pilot.current_planet_name}}</b>:\n\n"
        "💰 Кредиты: <code>{pilot.credits}</code>\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>\n\n"
        "Выберите руду для покупки (1 шт):"
    )
    buy_buttons = []
    for ore in ORES:
        buy_buttons.append({
            "id": f"btn-buy-{ore['id']}",
            "text": f"{ore['emoji']} {ore['name']} — {{price_{ore['id']}}} кредитов",
            "action": "goto",
            "target": f"buy-check-{ore['id']}",
        })

    nodes.append(node("msg-buy-menu", "message", 1100, 300, {
        "messageText": buy_text,
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": buy_buttons,
    }))

    # --- Для каждой руды: проверка кредитов → проверка трюма → покупка ---
    for i, ore in enumerate(ORES):
        y_pos = 600 + i * 350

        # Читаем цену руды на текущей планете
        nodes.append(node(f"buy-check-{ore['id']}", "bot_table", 100, y_pos, {
            "tableName": "ores",
            "operation": "read",
            "where": [{"column": "id", "operator": "equals", "value": ore['id']}],
            "saveResultTo": "buy_ore",
            "resultFormat": "first_row",
            "autoTransitionTo": f"buy-set-price-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Вычисляем цену на текущей планете через выражение
        # base_price_{planet} — берём из buy_ore
        nodes.append(node(f"buy-set-price-{ore['id']}", "set_variable", 400, y_pos, {
            "assignments": [
                {"id": f"a-price-{ore['id']}", "variable": "ore_price", "value": "{buy_ore.base_price_{pilot.current_planet}}", "mode": "text"},
            ],
            "autoTransitionTo": f"buy-cond-credits-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Проверка: хватает ли кредитов
        nodes.append(node(f"buy-cond-credits-{ore['id']}", "condition", 700, y_pos, {
            "variable": "pilot.credits",
            "branches": [
                branch(f"br-no-money-{ore['id']}", "Не хватает", "less_than", "{ore_price}", f"msg-buy-no-money-{ore['id']}"),
                branch(f"br-has-money-{ore['id']}", "Хватает", "else", "", f"buy-cond-cargo-{ore['id']}"),
            ],
        }))

        # Не хватает кредитов
        nodes.append(node(f"msg-buy-no-money-{ore['id']}", "message", 1000, y_pos - 100, {
            "messageText": f"❌ Недостаточно кредитов!\n\n{ore['emoji']} {ore['name']}\n💰 Нужно: <code>{{ore_price}}</code> кредитов\n💰 У вас: <code>{{pilot.credits}}</code> кредитов",
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }))

        # Проверка: есть ли место в трюме
        nodes.append(node(f"buy-cond-cargo-{ore['id']}", "condition", 1000, y_pos, {
            "variable": "pilot.cargo_used",
            "branches": [
                branch(f"br-full-{ore['id']}", "Трюм полон", "equals", "{pilot.cargo_max}", f"msg-buy-full-{ore['id']}"),
                branch(f"br-space-{ore['id']}", "Есть место", "else", "", f"buy-do-{ore['id']}"),
            ],
        }))

        # Трюм полон
        nodes.append(node(f"msg-buy-full-{ore['id']}", "message", 1300, y_pos - 100, {
            "messageText": "❌ Трюм полон!\n\n📦 <code>{pilot.cargo_used}/{pilot.cargo_max}</code>\n\nПродайте руду или улучшите трюм.",
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }))

        # Покупка: списание кредитов + увеличение cargo_used
        nodes.append(node(f"buy-do-{ore['id']}", "bot_table", 1300, y_pos, {
            "tableName": "pilots",
            "operation": "update",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "updates": [
                {"column": "credits", "op": "decrement", "value": "{ore_price}"},
                {"column": "cargo_used", "op": "increment", "value": "1"},
            ],
            "autoTransitionTo": f"buy-cargo-count-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Считаем сколько этой руды уже в трюме
        nodes.append(node(f"buy-cargo-count-{ore['id']}", "bot_table", 1600, y_pos, {
            "tableName": "pilot_cargo",
            "operation": "count",
            "where": [
                {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
                {"column": "ore_id", "operator": "equals", "value": ore['id']},
            ],
            "saveResultTo": "cargo_exists",
            "autoTransitionTo": f"buy-cargo-cond-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Условие: уже есть в трюме или нет (count == 0 → insert, иначе → increment)
        nodes.append(node(f"buy-cargo-cond-{ore['id']}", "condition", 1900, y_pos, {
            "variable": "cargo_exists",
            "branches": [
                branch(f"br-cargo-new-{ore['id']}", "Новая", "equals", "0", f"buy-cargo-insert-{ore['id']}"),
                branch(f"br-cargo-exists-{ore['id']}", "Уже есть", "else", "", f"buy-cargo-inc-{ore['id']}"),
            ],
        }))

        # Вставляем новую запись
        nodes.append(node(f"buy-cargo-insert-{ore['id']}", "bot_table", 2200, y_pos - 80, {
            "tableName": "pilot_cargo",
            "operation": "insert",
            "row": {
                "pilot_id": "{user_id}",
                "ore_id": ore['id'],
                "ore_name": ore['name'],
                "ore_emoji": ore['emoji'],
                "quantity": "1",
            },
            "autoTransitionTo": f"buy-reread-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Инкрементим quantity если запись уже существует
        nodes.append(node(f"buy-cargo-inc-{ore['id']}", "bot_table", 2200, y_pos + 80, {
            "tableName": "pilot_cargo",
            "operation": "update",
            "where": [
                {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
                {"column": "ore_id", "operator": "equals", "value": ore['id']},
            ],
            "updates": [
                {"column": "quantity", "op": "increment", "value": "1"},
            ],
            "autoTransitionTo": f"buy-reread-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Перечитываем пилота для актуальных данных
        nodes.append(node(f"buy-reread-{ore['id']}", "bot_table", 2500, y_pos, {
            "tableName": "pilots",
            "operation": "read",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "saveResultTo": "pilot",
            "resultFormat": "first_row",
            "autoTransitionTo": f"msg-buy-ok-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Успешная покупка
        nodes.append(node(f"msg-buy-ok-{ore['id']}", "message", 2800, y_pos, {
            "messageText": f"✅ Куплено: {ore['emoji']} <b>{ore['name']}</b> (1 шт.)\n💰 Цена: <code>{{ore_price}}</code> кредитов\n📍 Планета: <b>{{pilot.current_planet_name}}</b>\n\n💰 Баланс: <code>{{pilot.credits}}</code> кредитов\n📦 Трюм: <code>{{pilot.cargo_used}}/{{pilot.cargo_max}}</code>",
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }))

    # =============================================
    # 💰 ПРОДАТЬ — показ трюма (inline)
    # =============================================
    nodes.append(node("trig-sell", "text_trigger", 100, 4000, {
        "textMatchType": "exact",
        "textSynonyms": ["💰 Продать"],
        "autoTransitionTo": "tbl-sell-read-pilot",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-sell-read-pilot", "bot_table", 400, 4000, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "tbl-sell-read-cargo",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-sell-read-cargo", "bot_table", 700, 4000, {
        "tableName": "pilot_cargo",
        "operation": "read",
        "where": [{"column": "pilot_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "cargo_list",
        "resultFormat": "all_rows",
        "autoTransitionTo": "cond-sell-empty",
        "enableAutoTransition": True,
    }))

    # Проверка: трюм пуст?
    nodes.append(node("cond-sell-empty", "condition", 1000, 4000, {
        "variable": "pilot.cargo_used",
        "branches": [
            branch("br-sell-empty", "Пусто", "equals", "0", "msg-sell-empty"),
            branch("br-sell-has", "Есть руда", "else", "", "sell-set-quantities"),
        ],
    }))

    nodes.append(node("msg-sell-empty", "message", 1300, 3850, {
        "messageText": "📦 Ваш трюм пуст! Нечего продавать.\n\nКупите руду на текущей планете.",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    # Вычисляем количество каждой руды в трюме (для кнопок)
    qty_assignments = []
    for ore in ORES:
        qty_assignments.append({
            "id": f"a-qty-{ore['id']}",
            "variable": f"qty_{ore['id']}",
            "value": "",
            "mode": "lookup",
            "lookupTable": "pilot_cargo",
            "lookupField": "quantity",
            "lookupWhere": [
                {"field": "pilot_id", "value": "{user_id}"},
                {"field": "ore_id", "value": ore['id']},
            ],
        })
    # Заменяем пустые значения на "0"
    for ore in ORES:
        qty_assignments.append({
            "id": f"a-qty-default-{ore['id']}",
            "variable": f"qty_{ore['id']}",
            "value": f"max({{qty_{ore['id']}}}, 0)",
            "mode": "expression",
        })

    nodes.append(node("sell-set-quantities", "set_variable", 1300, 4000, {
        "assignments": qty_assignments,
        "autoTransitionTo": "msg-sell-menu",
        "enableAutoTransition": True,
    }))

    # Меню продажи — inline кнопки с количеством
    sell_text = (
        f"💰 {MENTION}, продажа руд:\n\n"
        "{pilot.status_text}\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>\n\n"
        "Выберите руду для продажи:"
    )
    sell_buttons = []
    for ore in ORES:
        sell_buttons.append({
            "id": f"btn-sell-{ore['id']}",
            "text": f"{ore['emoji']} {ore['name']} x{{qty_{ore['id']}}}",
            "action": "goto",
            "target": f"sell-check-{ore['id']}",
        })

    nodes.append(node("msg-sell-menu", "message", 1600, 4000, {
        "messageText": sell_text,
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": sell_buttons,
    }))

    # --- Для каждой руды: проверка наличия → продажа ---
    for i, ore in enumerate(ORES):
        y_pos = 4400 + i * 300

        # Считаем количество этой руды в трюме (count вернёт "0" если нет)
        nodes.append(node(f"sell-check-{ore['id']}", "bot_table", 100, y_pos, {
            "tableName": "pilot_cargo",
            "operation": "count",
            "where": [
                {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
                {"column": "ore_id", "operator": "equals", "value": ore['id']},
            ],
            "saveResultTo": "sell_ore_exists",
            "autoTransitionTo": f"sell-cond-has-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Проверка: есть ли эта руда (count == 0 → нет)
        nodes.append(node(f"sell-cond-has-{ore['id']}", "condition", 400, y_pos, {
            "variable": "sell_ore_exists",
            "branches": [
                branch(f"br-sell-none-{ore['id']}", "Нет руды", "equals", "0", f"msg-sell-none-{ore['id']}"),
                branch(f"br-sell-ok-{ore['id']}", "Есть", "else", "", f"sell-read-qty-{ore['id']}"),
            ],
        }))

        nodes.append(node(f"msg-sell-none-{ore['id']}", "message", 700, y_pos - 80, {
            "messageText": f"❌ У вас нет {ore['emoji']} {ore['name']} в трюме.",
            "keyboardType": "none",
            "buttons": [],
        }))

        # Читаем количество для расчёта дохода
        nodes.append(node(f"sell-read-qty-{ore['id']}", "bot_table", 700, y_pos, {
            "tableName": "pilot_cargo",
            "operation": "read",
            "where": [
                {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
                {"column": "ore_id", "operator": "equals", "value": ore['id']},
            ],
            "saveResultTo": "sell_item",
            "resultFormat": "first_row",
            "autoTransitionTo": f"sell-calc-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Вычисляем доход: сначала цену, потом income отдельным узлом
        nodes.append(node(f"sell-calc-{ore['id']}", "bot_table", 700, y_pos, {
            "tableName": "ores",
            "operation": "read",
            "where": [{"column": "id", "operator": "equals", "value": ore['id']}],
            "saveResultTo": "sell_ore",
            "resultFormat": "first_row",
            "autoTransitionTo": f"sell-set-price-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Устанавливаем цену и вычисляем доход (в одном узле — assignments последовательны)
        nodes.append(node(f"sell-set-price-{ore['id']}", "set_variable", 1000, y_pos, {
            "assignments": [
                {"id": f"a-sell-price-{ore['id']}", "variable": "sell_price", "value": "{sell_ore.base_price_{pilot.current_planet}}", "mode": "text"},
                {"id": f"a-sell-qty-{ore['id']}", "variable": "sell_qty", "value": "{sell_item.quantity}", "mode": "text"},
                {"id": f"a-sell-income-{ore['id']}", "variable": "sell_income", "value": "{sell_item.quantity} * {sell_price}", "mode": "expression"},
            ],
            "autoTransitionTo": f"sell-do-credits-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Начисляем кредиты
        nodes.append(node(f"sell-do-credits-{ore['id']}", "bot_table", 1600, y_pos, {
            "tableName": "pilots",
            "operation": "update",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "updates": [
                {"column": "credits", "op": "increment", "value": "{sell_income}"},
                {"column": "cargo_used", "op": "decrement", "value": "{sell_qty}"},
            ],
            "autoTransitionTo": f"sell-do-delete-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Удаляем руду из трюма
        nodes.append(node(f"sell-do-delete-{ore['id']}", "bot_table", 1900, y_pos, {
            "tableName": "pilot_cargo",
            "operation": "delete",
            "where": [
                {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
                {"column": "ore_id", "operator": "equals", "value": ore['id']},
            ],
            "autoTransitionTo": f"msg-sell-ok-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Успешная продажа
        nodes.append(node(f"msg-sell-ok-{ore['id']}", "message", 2200, y_pos, {
            "messageText": f"✅ Продано: {ore['emoji']} <b>{ore['name']}</b> x{{sell_item.quantity}}\n\n💰 Получено: <code>{{sell_income}}</code> кредитов\n💰 Баланс: <code>{{pilot.credits}}</code> кредитов",
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }))

    # =============================================
    # 📦 ТРЮМ — просмотр содержимого (через loop)
    # =============================================
    nodes.append(node("trig-cargo", "text_trigger", 100, 7000, {
        "textMatchType": "exact",
        "textSynonyms": ["📦 Трюм"],
        "autoTransitionTo": "tbl-cargo-read-pilot",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-cargo-read-pilot", "bot_table", 400, 7000, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "tbl-cargo-read-items",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-cargo-read-items", "bot_table", 700, 7000, {
        "tableName": "pilot_cargo",
        "operation": "read",
        "where": [{"column": "pilot_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "cargo_items",
        "resultFormat": "all_rows",
        "autoTransitionTo": "cargo-set-text",
        "enableAutoTransition": True,
    }))

    # Форматируем содержимое трюма через json_format
    nodes.append(node("cargo-set-text", "set_variable", 1000, 7000, {
        "assignments": [
            {"id": "a-cargo-fmt", "variable": "cargo_items", "value": "{item.ore_emoji} {item.ore_name} — x{item.quantity}\n", "mode": "json_format"},
        ],
        "autoTransitionTo": "msg-cargo-view",
        "enableAutoTransition": True,
    }))

    cargo_msg = (
        f"📦 {MENTION}, содержимое трюма:\n\n"
        "{cargo_items}\n"
        "📦 Занято: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>"
    )
    nodes.append(node("msg-cargo-view", "message", 1300, 7000, {
        "messageText": cargo_msg,
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-trade",
        "name": "🛒 Торговля",
        "nodes": nodes,
    }


# ============================================================
# Лист 3: 🚀 Полёты (sheet-map)
# ============================================================

def build_map() -> dict:
    """
    Строит лист «🚀 Полёты».
    Содержит подменю карты, перелёты между планетами с delay.
    @returns словарь листа
    """
    nodes = []

    # Данные планет для перелётов
    PLANETS = [
        {"id": "earth", "name": "Земля", "emoji": "🌍", "full": "🌍 Земля"},
        {"id": "mars", "name": "Марс", "emoji": "🔴", "full": "🔴 Марс"},
        {"id": "titan", "name": "Титан", "emoji": "🪐", "full": "🪐 Титан"},
        {"id": "nebula", "name": "Туманность", "emoji": "🌌", "full": "🌌 Туманность"},
    ]

    # Стоимость перелётов (топливо) и время (секунды)
    FLIGHT_COSTS = {
        ("earth", "mars"): (10, 120),
        ("earth", "titan"): (20, 300),
        ("earth", "nebula"): (15, 180),
        ("mars", "titan"): (15, 180),
        ("mars", "nebula"): (25, 360),
        ("titan", "nebula"): (30, 480),
    }

    def get_flight_cost(from_id: str, to_id: str) -> tuple:
        """Возвращает (топливо, секунды) для маршрута."""
        key = (from_id, to_id) if (from_id, to_id) in FLIGHT_COSTS else (to_id, from_id)
        return FLIGHT_COSTS.get(key, (10, 120))

    # --- Подменю карты ---
    nodes.append(node("tbl-read-pilot-map", "bot_table", 100, 0, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "map-set-now",
        "enableAutoTransition": True,
    }))

    # Проверяем в полёте ли мы (для отображения разного текста)
    nodes.append(node("map-set-now", "set_variable", 250, 0, {
        "assignments": [
            {"id": "a-map-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
        ],
        "autoTransitionTo": "map-cond-inflight",
        "enableAutoTransition": True,
    }))

    nodes.append(node("map-cond-inflight", "condition", 400, 0, {
        "variable": "pilot.flight_expires_at",
        "branches": [
            branch("br-map-inflight", "В полёте", "greater_than", "{now_ts}", "set-map-remaining"),
            branch("br-map-free", "Свободен", "else", "", "set-map-routes"),
        ],
    }))

    # Вычисляем оставшееся время для карты в полёте
    nodes.append(node("set-map-remaining", "set_variable", 550, -100, {
        "assignments": [
            {"id": "a-map-rem", "variable": "map_remaining", "value": "{pilot.flight_expires_at} - {now_ts}", "mode": "format_duration"},
            {"id": "a-map-fuel-fmt", "variable": "fuel_fmt", "value": "{pilot.fuel}", "mode": "format_number"},
        ],
        "autoTransitionTo": "msg-map-inflight",
        "enableAutoTransition": True,
    }))

    # Сообщение карты когда В ПОЛЁТЕ
    map_inflight_text = (
        f"🚀 {MENTION}, карта галактики:\n\n"
        "{pilot.status_text}\n"
        "🕐 Оставшееся время: <code>{map_remaining}</code>\n"
        "⛽ Осталось топлива: <code>{fuel_fmt}</code>"
    )
    nodes.append(node("msg-map-inflight", "message", 700, -100, {
        "messageText": map_inflight_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-m-back-inflight", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-m-back-inflight"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # Сообщение карты когда НА ПЛАНЕТЕ — вычисляем время маршрутов с учётом двигателя
    # Базовые времена: earth-mars=120, earth-titan=300, earth-nebula=180, mars-titan=180, mars-nebula=360, titan-nebula=480
    route_times = [
        ("r1", "120"),  # earth-mars
        ("r2", "300"),  # earth-titan
        ("r3", "180"),  # earth-nebula
        ("r4", "180"),  # mars-titan
        ("r5", "360"),  # mars-nebula
        ("r6", "480"),  # titan-nebula
    ]
    route_assignments = []
    for rid, base_time in route_times:
        route_assignments.append(
            {"id": f"a-{rid}-time", "variable": f"{rid}_time", "value": f"{base_time} * (115 - {{pilot.engine_level}} * 15) // 100", "mode": "expression"}
        )
        route_assignments.append(
            {"id": f"a-{rid}-fmt", "variable": f"{rid}_fmt", "value": f"{{{rid}_time}}", "mode": "format_duration"}
        )

    nodes.append(node("set-map-routes", "set_variable", 550, 100, {
        "assignments": route_assignments,
        "autoTransitionTo": "msg-map-menu",
        "enableAutoTransition": True,
    }))

    map_menu_text = (
        f"🗺 {MENTION}, карта галактики:\n\n"
        "{pilot.status_text}\n"
        "⛽ Топливо: <code>{pilot.fuel}</code>\n"
        "🚀 Двигатель: ур. <code>{pilot.engine_level}</code>\n\n"
        "━━━━ Маршруты ━━━━\n\n"
        "🌍↔🔴  Земля — Марс\n"
        "        ⛽ <code>10</code>  🕐 <code>{r1_fmt}</code>\n"
        "🌍↔🪐  Земля — Титан\n"
        "        ⛽ <code>20</code>  🕐 <code>{r2_fmt}</code>\n"
        "🌍↔🌌  Земля — Туманность\n"
        "        ⛽ <code>15</code>  🕐 <code>{r3_fmt}</code>\n"
        "🔴↔🪐  Марс — Титан\n"
        "        ⛽ <code>15</code>  🕐 <code>{r4_fmt}</code>\n"
        "🔴↔🌌  Марс — Туманность\n"
        "        ⛽ <code>25</code>  🕐 <code>{r5_fmt}</code>\n"
        "🪐↔🌌  Титан — Туманность\n"
        "        ⛽ <code>30</code>  🕐 <code>{r6_fmt}</code>"
    )
    nodes.append(node("msg-map-menu", "message", 700, 100, {
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

    # --- Для каждой планеты: триггер → проверки → перелёт ---
    for i, planet in enumerate(PLANETS):
        y_pos = 250 + i * 400

        # Триггер нажатия на планету
        nodes.append(node(f"trig-{planet['id']}", "text_trigger", 100, y_pos, {
            "textMatchType": "exact",
            "textSynonyms": [planet['full']],
            "autoTransitionTo": f"fly-read-pilot-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Читаем пилота
        nodes.append(node(f"fly-read-pilot-{planet['id']}", "bot_table", 400, y_pos, {
            "tableName": "pilots",
            "operation": "read",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "saveResultTo": "pilot",
            "resultFormat": "first_row",
            "autoTransitionTo": f"fly-cond-inflight-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Проверка: уже в полёте? (сравниваем timestamp)
        nodes.append(node(f"fly-cond-inflight-{planet['id']}", "set_variable", 550, y_pos, {
            "assignments": [
                {"id": f"a-now-{planet['id']}", "variable": "now_ts", "value": "0", "mode": "timestamp"},
            ],
            "autoTransitionTo": f"fly-cond-inflight-check-{planet['id']}",
            "enableAutoTransition": True,
        }))

        nodes.append(node(f"fly-cond-inflight-check-{planet['id']}", "condition", 700, y_pos - 60, {
            "variable": "pilot.flight_expires_at",
            "branches": [
                branch(f"br-inflight-{planet['id']}", "В полёте", "greater_than", "{now_ts}", f"fly-reread-inflight-{planet['id']}"),
                branch(f"br-flight-expired-{planet['id']}", "Истёк/нет", "else", "", f"fly-recover-check-{planet['id']}"),
            ],
        }))

        # Проверяем нужно ли восстановление (есть ли flight_target_planet)
        nodes.append(node(f"fly-recover-check-{planet['id']}", "condition", 700, y_pos + 30, {
            "variable": "pilot.flight_target_planet",
            "branches": [
                branch(f"br-need-recover-{planet['id']}", "Нужно восстановить", "is_not_empty", "", f"fly-recover-{planet['id']}"),
                branch(f"br-no-recover-{planet['id']}", "Свободен", "else", "", f"fly-cond-same-{planet['id']}"),
            ],
        }))

        # Восстановление после потерянного delay — обновляем планету на target
        nodes.append(node(f"fly-recover-{planet['id']}", "bot_table", 700, y_pos + 60, {
            "tableName": "pilots",
            "operation": "update",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "updates": [
                {"column": "current_planet", "op": "set", "value": "{pilot.flight_target_planet}"},
                {"column": "current_planet_name", "op": "set", "value": "{pilot.flight_target_name}"},
                {"column": "status_text", "op": "set", "value": "📍 Планета: <b>{pilot.flight_target_name}</b>"},
                {"column": "flight_expires_at", "op": "set", "value": ""},
                {"column": "flight_target_planet", "op": "set", "value": ""},
                {"column": "flight_target_name", "op": "set", "value": ""},
            ],
            "autoTransitionTo": f"fly-cond-same-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Перечитываем пилота перед сообщением "в полёте" (чтобы flight_target_name был актуальным)
        nodes.append(node(f"fly-reread-inflight-{planet['id']}", "bot_table", 700, y_pos - 200, {
            "tableName": "pilots",
            "operation": "read",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "saveResultTo": "pilot",
            "resultFormat": "first_row",
            "autoTransitionTo": f"fly-calc-remaining-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Вычисляем оставшееся время полёта
        nodes.append(node(f"fly-calc-remaining-{planet['id']}", "set_variable", 700, y_pos - 180, {
            "assignments": [
                {"id": f"a-remaining-{planet['id']}", "variable": "flight_remaining", "value": "{pilot.flight_expires_at} - {now_ts}", "mode": "format_duration"},
            ],
            "autoTransitionTo": f"msg-fly-inflight-{planet['id']}",
            "enableAutoTransition": True,
        }))

        nodes.append(node(f"msg-fly-inflight-{planet['id']}", "message", 700, y_pos - 160, {
            "messageText": "🚀 Вы в полёте!\n\n{pilot.status_text}\n🕐 Осталось: <code>{flight_remaining}</code>\n\nДождитесь прибытия.",
            "formatMode": "html",
            "keyboardType": "reply",
            "buttons": [
                btn(f"btn-inflight-turn-{planet['id']}", "🔄 Развернуться"),
                btn(f"btn-inflight-back-{planet['id']}", "⬅️ Меню"),
            ],
            "keyboardLayout": {"autoLayout": False, "columns": 2, "rows": [{"buttonIds": [f"btn-inflight-turn-{planet['id']}", f"btn-inflight-back-{planet['id']}"]}]},
            "resizeKeyboard": True,
        }))

        # Проверка: уже на этой планете?
        nodes.append(node(f"fly-cond-same-{planet['id']}", "condition", 700, y_pos, {
            "variable": "pilot.current_planet",
            "branches": [
                branch(f"br-same-{planet['id']}", "Уже здесь", "equals", planet['id'], f"msg-fly-same-{planet['id']}"),
                branch(f"br-can-fly-{planet['id']}", "Можно лететь", "else", "", f"fly-set-cost-{planet['id']}"),
            ],
        }))

        nodes.append(node(f"msg-fly-same-{planet['id']}", "message", 1000, y_pos - 80, {
            "messageText": f"📍 Вы уже на планете <b>{planet['full']}</b>!",
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }))

        # Вычисляем стоимость перелёта в зависимости от текущей планеты
        # Condition по pilot.current_planet → разные стоимости
        other_planets = [p for p in PLANETS if p['id'] != planet['id']]
        cost_branches = []
        for op in other_planets:
            fuel, seconds = get_flight_cost(op['id'], planet['id'])
            cost_branches.append(
                branch(f"br-from-{op['id']}-to-{planet['id']}", f"С {op['name']}", "equals", op['id'], f"fly-cost-{op['id']}-{planet['id']}")
            )

        nodes.append(node(f"fly-set-cost-{planet['id']}", "condition", 1000, y_pos, {
            "variable": "pilot.current_planet",
            "branches": cost_branches,
        }))

        # Для каждого маршрута — set_variable с конкретной стоимостью
        for j, op in enumerate(other_planets):
            fuel, seconds = get_flight_cost(op['id'], planet['id'])
            nodes.append(node(f"fly-cost-{op['id']}-{planet['id']}", "set_variable", 1300, y_pos - 100 + j * 100, {
                "assignments": [
                    {"id": f"a-fuel-{op['id']}-{planet['id']}", "variable": "flight_fuel", "value": str(fuel), "mode": "text"},
                    {"id": f"a-time-{op['id']}-{planet['id']}", "variable": "flight_time", "value": str(seconds), "mode": "text"},
                    {"id": f"a-fmt-{op['id']}-{planet['id']}", "variable": "flight_time_fmt", "value": str(seconds), "mode": "format_duration"},
                ],
                "autoTransitionTo": f"fly-cond-fuel-{planet['id']}",
                "enableAutoTransition": True,
            }))

        # Проверка топлива
        nodes.append(node(f"fly-cond-fuel-{planet['id']}", "condition", 1300, y_pos, {
            "variable": "pilot.fuel",
            "branches": [
                branch(f"br-no-fuel-{planet['id']}", "Мало топлива", "less_than", "{flight_fuel}", f"msg-fly-no-fuel-{planet['id']}"),
                branch(f"br-has-fuel-{planet['id']}", "Хватает", "else", "", f"fly-set-expires-{planet['id']}"),
            ],
        }))

        nodes.append(node(f"msg-fly-no-fuel-{planet['id']}", "message", 1600, y_pos - 80, {
            "messageText": f"⛽ Недостаточно топлива для перелёта на планету <b>{planet['full']}</b>!\n\nНужно: <code>{{flight_fuel}}</code> ⛽\nУ вас: <code>{{pilot.fuel}}</code> ⛽",
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }))

        # Вычисляем timestamp окончания полёта и списываем топливо
        # Применяем модификатор двигателя: каждый уровень -15% времени
        nodes.append(node(f"fly-set-expires-{planet['id']}", "set_variable", 1500, y_pos, {
            "assignments": [
                {"id": f"a-engine-mod-{planet['id']}", "variable": "flight_time", "value": "{flight_time} * (115 - {pilot.engine_level} * 15) // 100", "mode": "expression"},
                {"id": f"a-fmt-actual-{planet['id']}", "variable": "flight_time_fmt", "value": "{flight_time}", "mode": "format_duration"},
                {"id": f"a-expires-{planet['id']}", "variable": "flight_expires_at", "value": "{flight_time}", "mode": "timestamp"},
            ],
            "autoTransitionTo": f"fly-do-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Атомарный UPDATE через psql_query — защита от race condition
        # Обновляет ТОЛЬКО если flight_expires_at пустое (никто ещё не летит)
        # RETURNING id — если вернул строку, значит update сработал
        nodes.append(node(f"fly-do-{planet['id']}", "psql_query", 1800, y_pos, {
            "query": (
                "UPDATE bot_table_rows SET data = data "
                "|| jsonb_build_object('231', (COALESCE((data->>'231')::int, 0) - {flight_fuel})::text) "
                "|| jsonb_build_object('267', '{flight_expires_at}') "
                f"|| jsonb_build_object('268', '{planet['id']}') "
                f"|| jsonb_build_object('269', '{planet['full']}') "
                "WHERE table_id = 31 "
                "AND data->>'240' = '{user_id}' "
                "AND (data->>'267' IS NULL OR data->>'267' = '') "
                "RETURNING id"
            ),
            "saveResultTo": "fly_result",
            "resultFormat": "first_row",
            "connectionSource": "builtin",
            "autoTransitionTo": f"fly-cond-updated-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Проверяем сработал ли update (fly_result.id > 0 = обновлено, летим)
        nodes.append(node(f"fly-cond-updated-{planet['id']}", "condition", 2100, y_pos, {
            "variable": "fly_result.id",
            "branches": [
                branch(f"br-updated-{planet['id']}", "Обновлено", "greater_than", "0", f"fly-set-status-{planet['id']}"),
                branch(f"br-not-updated-{planet['id']}", "Не обновлено", "else", "", f"fly-reread-inflight-{planet['id']}"),
            ],
        }))

        # Обновляем status_text на "в полёте"
        nodes.append(node(f"fly-set-status-{planet['id']}", "bot_table", 2300, y_pos, {
            "tableName": "pilots",
            "operation": "update",
            "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
            "updates": [
                {"column": "status_text", "op": "set", "value": f"🚀 В полёте на планету <b>{planet['full']}</b>"},
                {"column": "flight_fuel_cost", "op": "set", "value": "{flight_fuel}"},
                {"column": "flight_start_ts", "op": "set", "value": "{now_ts}"},
            ],
            "autoTransitionTo": f"msg-fly-start-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Сообщение "Летим..."
        nodes.append(node(f"msg-fly-start-{planet['id']}", "message", 1900, y_pos, {
            "messageText": f"🚀 Летим на планету <b>{planet['full']}</b>!\n\n⛽ Потрачено: <code>{{flight_fuel}}</code> топлива\n🕐 Оставшееся время: <code>{{flight_time_fmt}}</code>",
            "formatMode": "html",
            "keyboardType": "reply",
            "buttons": [
                btn(f"btn-fly-turn-{planet['id']}", "🔄 Развернуться"),
                btn(f"btn-fly-back-{planet['id']}", "⬅️ Меню"),
            ],
            "keyboardLayout": {"autoLayout": False, "columns": 2, "rows": [{"buttonIds": [f"btn-fly-turn-{planet['id']}", f"btn-fly-back-{planet['id']}"]}]},
            "resizeKeyboard": True,
            "autoTransitionTo": f"fly-delay-{planet['id']}",
            "enableAutoTransition": True,
        }))

        # Delay (background) — ждём время перелёта, затем переход на пиратов
        nodes.append(node(f"fly-delay-{planet['id']}", "delay", 2200, y_pos, {
            "seconds": "{flight_time}",
            "unit": "seconds",
            "mode": "background",
            "autoTransitionTo": "pirate-reread-pilot",
            "enableAutoTransition": True,
        }))

    # =============================================
    # 🔄 РАЗВЕРНУТЬСЯ — отмена полёта
    # =============================================
    nodes.append(node("trig-turn-around", "text_trigger", 100, 2000, {
        "textMatchType": "exact",
        "textSynonyms": ["🔄 Развернуться"],
        "autoTransitionTo": "tbl-read-pilot-turn",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-read-pilot-turn", "bot_table", 400, 2000, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-turn-now",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-turn-now", "set_variable", 700, 2000, {
        "assignments": [
            {"id": "a-turn-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
        ],
        "autoTransitionTo": "cond-turn-inflight",
        "enableAutoTransition": True,
    }))

    # Проверка: в полёте ли?
    nodes.append(node("cond-turn-inflight", "condition", 1000, 2000, {
        "variable": "pilot.flight_expires_at",
        "branches": [
            branch("br-turn-yes", "В полёте", "greater_than", "{now_ts}", "set-turn-penalty"),
            branch("br-turn-no", "Не в полёте", "else", "", "msg-turn-not-flying"),
        ],
    }))

    nodes.append(node("msg-turn-not-flying", "message", 1300, 2150, {
        "messageText": "❌ Вы не в полёте!",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    # Вычисляем штраф: % пройденного пути × потраченное топливо
    nodes.append(node("set-turn-penalty", "set_variable", 1300, 2000, {
        "assignments": [
            {"id": "a-turn-total", "variable": "flight_total_time", "value": "{pilot.flight_expires_at} - {pilot.flight_start_ts}", "mode": "expression"},
            {"id": "a-turn-elapsed", "variable": "flight_elapsed", "value": "{now_ts} - {pilot.flight_start_ts}", "mode": "expression"},
            {"id": "a-turn-progress", "variable": "turn_progress", "value": "{flight_elapsed} * 100 // {flight_total_time}", "mode": "expression"},
            {"id": "a-turn-fuel-penalty", "variable": "turn_fuel_penalty", "value": "max({pilot.flight_fuel_cost} * {turn_progress} // 100, 1)", "mode": "expression"},
        ],
        "autoTransitionTo": "do-turn-around",
        "enableAutoTransition": True,
    }))

    # Выполняем разворот: сбрасываем flight-поля, списываем доп. топливо
    nodes.append(node("do-turn-around", "bot_table", 1600, 2000, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "flight_expires_at", "op": "set", "value": ""},
            {"column": "flight_target_planet", "op": "set", "value": ""},
            {"column": "flight_target_name", "op": "set", "value": ""},
            {"column": "flight_fuel_cost", "op": "set", "value": ""},
            {"column": "flight_start_ts", "op": "set", "value": ""},
            {"column": "status_text", "op": "set", "value": "📍 Планета: <b>{pilot.current_planet_name}</b>"},
            {"column": "fuel", "op": "decrement", "value": "{turn_fuel_penalty}"},
        ],
        "autoTransitionTo": "msg-turn-ok",
        "enableAutoTransition": True,
    }))

    turn_ok_text = (
        "🔄 Вы развернулись!\n\n"
        "📍 Вернулись на планету <b>{pilot.current_planet_name}</b>\n"
        "📊 Пройдено: <code>{turn_progress}</code>% пути\n"
        "⛽ Топливо на возврат: -<code>{turn_fuel_penalty}</code>"
    )
    nodes.append(main_menu_msg("msg-turn-ok", turn_ok_text, 1900, 2000))

    return {
        "id": "sheet-map",
        "name": "🚀 Полёты",
        "nodes": nodes,
    }


# ============================================================
# Лист 4: 🏴‍☠️ Пираты (sheet-pirates)
# ============================================================

def build_pirates() -> dict:
    """
    Строит лист «🏴‍☠️ Пираты».
    Содержит логику случайного нападения пиратов после перелёта:
    30% шанс атаки, выбор драться или откупиться, лут/потери.
    @returns словарь листа
    """
    nodes = []

    # --- Перечитываем пилота после delay ---
    nodes.append(node("pirate-reread-pilot", "bot_table", 100, 0, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "pirate-set-ransom",
        "enableAutoTransition": True,
    }))

    # --- Вычисляем переменные: выкуп, шанс пиратов, порог победы ---
    nodes.append(node("pirate-set-ransom", "set_variable", 400, 0, {
        "assignments": [
            {"id": "a-ransom-raw", "variable": "ransom_raw", "value": "{pilot.credits} * 20 // 100", "mode": "expression"},
            {"id": "a-ransom", "variable": "ransom", "value": "max({ransom_raw}, 50)", "mode": "expression"},
            {"id": "a-pirate-chance", "variable": "pirate_chance", "value": "1", "maxValue": "100", "mode": "random"},
            {"id": "a-win-threshold", "variable": "win_threshold", "value": "{pilot.armor_level} * 15 + 15", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-pirates",
        "enableAutoTransition": True,
    }))

    # --- Условие: пираты нападают (pirate_chance < 31 → 30% шанс) ---
    nodes.append(node("cond-pirates", "condition", 700, 0, {
        "variable": "pirate_chance",
        "branches": [
            branch("br-pirates-attack", "В полёте", "less_than", "31", "msg-pirates"),
            branch("br-pirates-safe", "Безопасно", "else", "", "fly-arrive-generic"),
        ],
    }))

    # --- Безопасное прибытие (общее для всех планет) ---
    nodes.append(node("fly-arrive-generic", "bot_table", 1000, 200, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "current_planet", "op": "set", "value": "{pilot.flight_target_planet}"},
            {"column": "current_planet_name", "op": "set", "value": "{pilot.flight_target_name}"},
            {"column": "flight_expires_at", "op": "set", "value": ""},
            {"column": "flight_target_planet", "op": "set", "value": ""},
            {"column": "flight_target_name", "op": "set", "value": ""},
            {"column": "status_text", "op": "set", "value": "📍 Планета: <b>{pilot.flight_target_name}</b>"},
        ],
        "autoTransitionTo": "msg-arrived-generic",
        "enableAutoTransition": True,
    }))

    nodes.append(main_menu_msg("msg-arrived-generic",
        "✅ Вы прибыли на планету <b>{pilot.flight_target_name}</b>!\n\nТеперь вы можете торговать здесь.",
        1300, 200))

    # --- Сообщение о нападении пиратов (inline кнопки) ---
    pirate_text = (
        f"🏴‍☠️ {MENTION}, на вас напали пираты!\n\n"
        "Они требуют <code>{ransom}</code> кредитов или ваш груз.\n\n"
        "💰 Кредиты: <code>{pilot.credits}</code>\n"
        "🛡 Броня: ур. <code>{pilot.armor_level}</code>\n"
        "📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>"
    )
    nodes.append(node("msg-pirates", "message", 1000, -200, {
        "messageText": pirate_text,
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-fight", "⚔️ Драться", "goto", target="fight-roll"),
            btn("btn-pay", "💰 Откупиться ({ransom} кредитов)", "goto", target="pay-check"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-fight", "btn-pay"]},
            ],
        },
    }))

    # =============================================
    # ⚔️ ДРАТЬСЯ
    # =============================================

    # Бросок боя
    nodes.append(node("fight-roll", "set_variable", 100, -400, {
        "assignments": [
            {"id": "a-fight-roll", "variable": "fight_roll", "value": "1", "maxValue": "100", "mode": "random"},
        ],
        "autoTransitionTo": "cond-fight-result",
        "enableAutoTransition": True,
    }))

    # Условие: победа или поражение
    nodes.append(node("cond-fight-result", "condition", 400, -400, {
        "variable": "fight_roll",
        "branches": [
            branch("br-fight-win", "Победа", "less_than", "{win_threshold}", "fight-win-loot"),
            branch("br-fight-lose", "Поражение", "else", "", "fight-lose-check-cargo"),
        ],
    }))

    # --- Победа: лут ---
    nodes.append(node("fight-win-loot", "set_variable", 700, -600, {
        "assignments": [
            {"id": "a-loot", "variable": "loot", "value": "{ransom} // 2", "mode": "expression"},
            {"id": "a-frag-roll", "variable": "fragment_roll", "value": "1", "maxValue": "100", "mode": "random"},
        ],
        "autoTransitionTo": "fight-win-credits",
        "enableAutoTransition": True,
    }))

    # Начисляем кредиты за победу
    nodes.append(node("fight-win-credits", "bot_table", 1000, -600, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "increment", "value": "{loot}"},
        ],
        "autoTransitionTo": "cond-fragment-drop",
        "enableAutoTransition": True,
    }))

    # Условие: дроп фрагмента (15% шанс)
    nodes.append(node("cond-fragment-drop", "condition", 1300, -600, {
        "variable": "fragment_roll",
        "branches": [
            branch("br-frag-drop", "Дроп", "less_than", "16", "fight-win-fragment"),
            branch("br-frag-no", "Без фрагмента", "else", "", "msg-win-no-fragment"),
        ],
    }))

    # Дроп фрагмента
    nodes.append(node("fight-win-fragment", "bot_table", 1600, -800, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "fragments", "op": "increment", "value": "1"},
        ],
        "autoTransitionTo": "msg-win-with-fragment",
        "enableAutoTransition": True,
    }))

    # Сообщение победы с фрагментом
    nodes.append(node("msg-win-with-fragment", "message", 1900, -800, {
        "messageText": "🎉 Вы победили пиратов!\n\n🏆 Трофей: +<code>{loot}</code> кредитов\n🌀 Фрагмент Эфира: +1",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "fly-arrive-generic",
        "enableAutoTransition": True,
    }))

    # Сообщение победы без фрагмента
    nodes.append(node("msg-win-no-fragment", "message", 1900, -600, {
        "messageText": "🎉 Вы победили пиратов!\n\n🏆 Трофей: +<code>{loot}</code> кредитов",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "fly-arrive-generic",
        "enableAutoTransition": True,
    }))

    # --- Поражение: проверка трюма ---
    nodes.append(node("fight-lose-check-cargo", "condition", 700, -200, {
        "variable": "pilot.cargo_used",
        "branches": [
            branch("br-lose-empty", "Пусто", "equals", "0", "msg-lose-empty"),
            branch("br-lose-steal", "Есть груз", "else", "", "fight-lose-steal"),
        ],
    }))

    # Трюм пуст — пираты ничего не нашли
    nodes.append(node("msg-lose-empty", "message", 1000, -100, {
        "messageText": "💥 Пираты оказались сильнее...\n\nОни обыскали трюм, но ничего не нашли!",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "fly-arrive-generic",
        "enableAutoTransition": True,
    }))

    # Кража: читаем случайную руду из трюма
    nodes.append(node("fight-lose-steal", "bot_table", 1000, -300, {
        "tableName": "pilot_cargo",
        "operation": "read",
        "where": [{"column": "pilot_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "stolen",
        "resultFormat": "random_row",
        "autoTransitionTo": "fight-lose-decrement",
        "enableAutoTransition": True,
    }))

    # Уменьшаем quantity украденной руды
    nodes.append(node("fight-lose-decrement", "bot_table", 1300, -300, {
        "tableName": "pilot_cargo",
        "operation": "update",
        "where": [
            {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
            {"column": "ore_id", "operator": "equals", "value": "{stolen.ore_id}"},
        ],
        "updates": [
            {"column": "quantity", "op": "decrement", "value": "1"},
        ],
        "autoTransitionTo": "fight-lose-cargo-dec",
        "enableAutoTransition": True,
    }))

    # Уменьшаем cargo_used у пилота
    nodes.append(node("fight-lose-cargo-dec", "bot_table", 1600, -300, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "cargo_used", "op": "decrement", "value": "1"},
        ],
        "autoTransitionTo": "fight-lose-cleanup",
        "enableAutoTransition": True,
    }))

    # Удаляем записи с quantity <= 0
    nodes.append(node("fight-lose-cleanup", "psql_query", 1900, -300, {
        "query": "DELETE FROM bot_table_rows WHERE table_id = 35 AND data->>'263' = '{user_id}' AND (data->>'264')::int <= 0",
        "connectionSource": "builtin",
        "autoTransitionTo": "msg-lose-stolen",
        "enableAutoTransition": True,
    }))

    # Сообщение о краже
    nodes.append(node("msg-lose-stolen", "message", 2200, -300, {
        "messageText": "💥 Пираты оказались сильнее...\n\n📦 Украдено: <b>{stolen.ore_emoji} {stolen.ore_name}</b> (1 шт.)",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "fly-arrive-generic",
        "enableAutoTransition": True,
    }))

    # =============================================
    # 💰 ОТКУПИТЬСЯ
    # =============================================

    # Проверка: хватает ли кредитов на выкуп
    nodes.append(node("pay-check", "condition", 100, 400, {
        "variable": "pilot.credits",
        "branches": [
            branch("br-cant-pay", "Не хватает", "less_than", "{ransom}", "msg-cant-pay"),
            branch("br-can-pay", "Хватает", "else", "", "pay-do"),
        ],
    }))

    # Не хватает кредитов — придётся драться
    nodes.append(node("msg-cant-pay", "message", 400, 400, {
        "messageText": "💰 Недостаточно кредитов для откупа!\n\nНужно: <code>{ransom}</code> кредитов\nУ вас: <code>{pilot.credits}</code> кредитов\n\nПридётся драться!",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "fight-roll",
        "enableAutoTransition": True,
    }))

    # Списываем выкуп
    nodes.append(node("pay-do", "bot_table", 400, 600, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "decrement", "value": "{ransom}"},
        ],
        "autoTransitionTo": "msg-paid",
        "enableAutoTransition": True,
    }))

    # Сообщение об откупе
    nodes.append(node("msg-paid", "message", 700, 600, {
        "messageText": "💰 Вы откупились от пиратов.\n\nЗаплачено: <code>{ransom}</code> кредитов",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "fly-arrive-generic",
        "enableAutoTransition": True,
    }))

    return {
        "id": "sheet-pirates",
        "name": "🏴‍☠️ Пираты",
        "nodes": nodes,
    }


# ============================================================
# Лист 5: 🔧 Корабль (sheet-ship)
# ============================================================

def build_ship() -> dict:
    """
    Строит лист «🔧 Корабль».
    Содержит подменю корабля и полную логику улучшений (трюм, двигатель, броня).
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
        "autoTransitionTo": "set-ship-prices",
        "enableAutoTransition": True,
    }))

    # Вычисляем цены и значения для всех трёх модулей
    nodes.append(node("set-ship-prices", "set_variable", 300, 0, {
        "assignments": [
            {"id": "a-ship-hull-next", "variable": "hull_next", "value": "{pilot.hull_level} + 1", "mode": "expression"},
            {"id": "a-ship-engine-next", "variable": "engine_next", "value": "{pilot.engine_level} + 1", "mode": "expression"},
            {"id": "a-ship-armor-next", "variable": "armor_next", "value": "{pilot.armor_level} + 1", "mode": "expression"},
            {"id": "a-ship-armor-cur", "variable": "current_armor_pct", "value": "{pilot.armor_level} * 15 + 15", "mode": "expression"},
            {"id": "a-ship-engine-cur", "variable": "engine_current_pct", "value": "({pilot.engine_level} - 1) * 15", "mode": "expression"},
            {"id": "a-ship-hull-price", "variable": "hull_price", "value": "", "mode": "lookup", "lookupTable": "upgrades", "lookupField": "price", "lookupWhere": [{"field": "level", "value": "{hull_next}"}]},
            {"id": "a-ship-hull-slots", "variable": "hull_next_slots", "value": "", "mode": "lookup", "lookupTable": "upgrades", "lookupField": "hull_slots", "lookupWhere": [{"field": "level", "value": "{hull_next}"}]},
            {"id": "a-ship-engine-price", "variable": "engine_price", "value": "", "mode": "lookup", "lookupTable": "upgrades", "lookupField": "price", "lookupWhere": [{"field": "level", "value": "{engine_next}"}]},
            {"id": "a-ship-armor-price", "variable": "armor_price", "value": "", "mode": "lookup", "lookupTable": "upgrades", "lookupField": "price", "lookupWhere": [{"field": "level", "value": "{armor_next}"}]},
            {"id": "a-ship-armor-next-pct", "variable": "armor_next_pct", "value": "", "mode": "lookup", "lookupTable": "upgrades", "lookupField": "armor_pct", "lookupWhere": [{"field": "level", "value": "{armor_next}"}]},
        ],
        "autoTransitionTo": "msg-ship-menu",
        "enableAutoTransition": True,
    }))

    ship_menu_text = (
        f"🔧 {MENTION}, ваш корабль:\n\n"
        "📦 <b>Трюм</b> — ур. {pilot.hull_level}\n"
        "   Вместимость: <code>{pilot.cargo_max}</code> слотов\n"
        "   Занято: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>\n"
        "   ⬆️ Следующий: <code>{hull_next_slots}</code> слотов за <code>{hull_price}</code> 💰\n\n"
        "🚀 <b>Двигатель</b> — ур. {pilot.engine_level}\n"
        "   Скорость: -<code>{engine_current_pct}</code>% к перелётам\n"
        "   ⬆️ Следующий: ещё -15% за <code>{engine_price}</code> 💰\n\n"
        "🛡 <b>Броня</b> — ур. {pilot.armor_level}\n"
        "   Шанс победы: <code>{current_armor_pct}</code>%\n"
        "   ⬆️ Следующий: <code>{armor_next_pct}</code>% за <code>{armor_price}</code> 💰\n\n"
        "━━━━━━━━━━━━━━━━\n"
        "💰 <code>{pilot.credits}</code> | ⛽ <code>{pilot.fuel}</code>"
    )
    nodes.append(node("msg-ship-menu", "message", 600, 0, {
        "messageText": ship_menu_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-s-hull", "⬆️ Трюм — {hull_price} 💰"),
            btn("btn-s-engine", "⬆️ Двигатель — {engine_price} 💰"),
            btn("btn-s-armor", "⬆️ Броня — {armor_price} 💰"),
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

    # =============================================
    # 📦 ТРЮМ (hull) — улучшение
    # =============================================
    nodes.append(node("trig-hull", "text_trigger", 100, 250, {
        "textMatchType": "contains",
        "textSynonyms": ["⬆️ Трюм"],
        "autoTransitionTo": "do-upgrade-hull-check",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-read-pilot-hull", "bot_table", 400, 250, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-hull-next",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-hull-next", "set_variable", 700, 250, {
        "assignments": [
            {"id": "a-hull-next", "variable": "next_level", "value": "{pilot.hull_level} + 1", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-hull-max",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-hull-max", "condition", 1000, 250, {
        "variable": "pilot.hull_level",
        "branches": [
            branch("br-hull-max", "MAX", "equals", "5", "msg-hull-max"),
            branch("br-hull-not-max", "Можно улучшить", "else", "", "lookup-hull-price"),
        ],
    }))

    nodes.append(node("msg-hull-max", "message", 1300, 100, {
        "messageText": "📦 Трюм: ур. <code>5</code> (MAX)\n\n📦 Вместимость: <code>80</code> слотов\n📦 Занято: <code>{pilot.cargo_used}/80</code>",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("lookup-hull-price", "set_variable", 1300, 250, {
        "assignments": [
            {
                "id": "a-hull-price",
                "variable": "upgrade_price",
                "value": "",
                "mode": "lookup",
                "lookupTable": "upgrades",
                "lookupField": "price",
                "lookupWhere": [{"field": "level", "value": "{next_level}"}],
            },
            {
                "id": "a-hull-slots",
                "variable": "upgrade_slots",
                "value": "",
                "mode": "lookup",
                "lookupTable": "upgrades",
                "lookupField": "hull_slots",
                "lookupWhere": [{"field": "level", "value": "{next_level}"}],
            },
        ],
        "autoTransitionTo": "msg-hull-info",
        "enableAutoTransition": True,
    }))

    hull_info_text = (
        "📦 Трюм вашего корабля:\n\n"
        "📊 Уровень: <code>{pilot.hull_level}</code>\n"
        "📦 Вместимость: <code>{pilot.cargo_max}</code> слотов\n"
        "📦 Занято: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>\n\n"
        "💡 <i>Больше трюм — больше руды за рейс</i>\n\n"
        "⬆️ Следующий уровень:\n"
        "📦 Вместимость: <code>{upgrade_slots}</code> слотов\n"
        "💰 Стоимость: <code>{upgrade_price}</code> кредитов"
    )
    nodes.append(node("msg-hull-info", "message", 1600, 250, {
        "messageText": hull_info_text,
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [
            {
                "id": "btn-upgrade-hull",
                "text": "⬆️ Улучшить за {upgrade_price} кредитов",
                "action": "goto",
                "target": "do-upgrade-hull-check",
            },
        ],
    }))

    nodes.append(node("do-upgrade-hull-check", "condition", 1900, 250, {
        "variable": "pilot.credits",
        "branches": [
            branch("br-hull-no-money", "Не хватает", "less_than", "{hull_price}", "msg-hull-no-money"),
            branch("br-hull-has-money", "Хватает", "else", "", "do-upgrade-hull"),
        ],
    }))

    nodes.append(node("msg-hull-no-money", "message", 2200, 100, {
        "messageText": "❌ Недостаточно кредитов!\n\n💰 Нужно: <code>{hull_price}</code> кредитов\n💰 У вас: <code>{pilot.credits}</code> кредитов",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("do-upgrade-hull", "bot_table", 2200, 250, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "decrement", "value": "{hull_price}"},
            {"column": "hull_level", "op": "increment", "value": "1"},
            {"column": "cargo_max", "op": "set", "value": "{hull_next_slots}"},
        ],
        "autoTransitionTo": "tbl-read-pilot-ship",
        "enableAutoTransition": True,
    }))

    # =============================================
    # 🚀 ДВИГАТЕЛЬ (engine) — улучшение
    # =============================================
    nodes.append(node("trig-engine", "text_trigger", 100, 600, {
        "textMatchType": "contains",
        "textSynonyms": ["⬆️ Двигатель"],
        "autoTransitionTo": "do-upgrade-engine-check",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-read-pilot-engine", "bot_table", 400, 600, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-engine-next",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-engine-next", "set_variable", 700, 600, {
        "assignments": [
            {"id": "a-engine-next", "variable": "next_level", "value": "{pilot.engine_level} + 1", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-engine-max",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-engine-max", "condition", 1000, 600, {
        "variable": "pilot.engine_level",
        "branches": [
            branch("br-engine-max", "MAX", "equals", "5", "msg-engine-max"),
            branch("br-engine-not-max", "Можно улучшить", "else", "", "lookup-engine-price"),
        ],
    }))

    nodes.append(node("msg-engine-max", "message", 1300, 450, {
        "messageText": "🚀 Двигатель: ур. <code>5</code> (MAX)\n\n⛽ Бак: <code>200</code> топлива",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("lookup-engine-price", "set_variable", 1300, 600, {
        "assignments": [
            {
                "id": "a-engine-price",
                "variable": "upgrade_price",
                "value": "",
                "mode": "lookup",
                "lookupTable": "upgrades",
                "lookupField": "price",
                "lookupWhere": [{"field": "level", "value": "{next_level}"}],
            },
            {
                "id": "a-engine-fuel",
                "variable": "upgrade_fuel_max",
                "value": "",
                "mode": "lookup",
                "lookupTable": "upgrades",
                "lookupField": "fuel_max",
                "lookupWhere": [{"field": "level", "value": "{next_level}"}],
            },
        ],
        "autoTransitionTo": "msg-engine-info",
        "enableAutoTransition": True,
    }))

    engine_info_text = (
        "🚀 Двигатель вашего корабля:\n\n"
        "📊 Уровень: <code>{pilot.engine_level}</code>\n"
        "⛽ Топливо: <code>{pilot.fuel}</code>\n\n"
        "💡 <i>Выше уровень — быстрее перелёты (-15% за ур.)</i>\n\n"
        "⬆️ Следующий уровень:\n"
        "🕐 Ещё -15% к времени перелёта\n"
        "💰 Стоимость: <code>{upgrade_price}</code> кредитов"
    )
    nodes.append(node("msg-engine-info", "message", 1600, 600, {
        "messageText": engine_info_text,
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [
            {
                "id": "btn-upgrade-engine",
                "text": "⬆️ Улучшить за {upgrade_price} кредитов",
                "action": "goto",
                "target": "do-upgrade-engine-check",
            },
        ],
    }))

    nodes.append(node("do-upgrade-engine-check", "condition", 1900, 600, {
        "variable": "pilot.credits",
        "branches": [
            branch("br-engine-no-money", "Не хватает", "less_than", "{engine_price}", "msg-engine-no-money"),
            branch("br-engine-has-money", "Хватает", "else", "", "do-upgrade-engine"),
        ],
    }))

    nodes.append(node("msg-engine-no-money", "message", 2200, 450, {
        "messageText": "❌ Недостаточно кредитов!\n\n💰 Нужно: <code>{engine_price}</code> кредитов\n💰 У вас: <code>{pilot.credits}</code> кредитов",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("do-upgrade-engine", "bot_table", 2200, 600, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "decrement", "value": "{engine_price}"},
            {"column": "engine_level", "op": "increment", "value": "1"},
        ],
        "autoTransitionTo": "tbl-read-pilot-ship",
        "enableAutoTransition": True,
    }))

    # =============================================
    # 🛡 БРОНЯ (armor) — улучшение
    # =============================================
    nodes.append(node("trig-armor", "text_trigger", 100, 950, {
        "textMatchType": "contains",
        "textSynonyms": ["⬆️ Броня"],
        "autoTransitionTo": "do-upgrade-armor-check",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-read-pilot-armor", "bot_table", 400, 950, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-armor-next",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-armor-next", "set_variable", 700, 950, {
        "assignments": [
            {"id": "a-armor-next", "variable": "next_level", "value": "{pilot.armor_level} + 1", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-armor-max",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-armor-max", "condition", 1000, 950, {
        "variable": "pilot.armor_level",
        "branches": [
            branch("br-armor-max", "MAX", "equals", "5", "msg-armor-max"),
            branch("br-armor-not-max", "Можно улучшить", "else", "", "lookup-armor-price"),
        ],
    }))

    nodes.append(node("msg-armor-max", "message", 1300, 800, {
        "messageText": "🛡 Броня: ур. <code>5</code> (MAX)\n\n⚔️ Шанс победы: <code>90</code>%",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("lookup-armor-price", "set_variable", 1300, 950, {
        "assignments": [
            {
                "id": "a-armor-cur-pct",
                "variable": "current_armor_pct",
                "value": "{pilot.armor_level} * 15 + 15",
                "mode": "expression",
            },
            {
                "id": "a-armor-price",
                "variable": "upgrade_price",
                "value": "",
                "mode": "lookup",
                "lookupTable": "upgrades",
                "lookupField": "price",
                "lookupWhere": [{"field": "level", "value": "{next_level}"}],
            },
            {
                "id": "a-armor-pct",
                "variable": "upgrade_armor_pct",
                "value": "",
                "mode": "lookup",
                "lookupTable": "upgrades",
                "lookupField": "armor_pct",
                "lookupWhere": [{"field": "level", "value": "{next_level}"}],
            },
        ],
        "autoTransitionTo": "msg-armor-info",
        "enableAutoTransition": True,
    }))

    armor_info_text = (
        "🛡 Броня вашего корабля:\n\n"
        "📊 Уровень: <code>{pilot.armor_level}</code>\n"
        "⚔️ Шанс победы: <code>{current_armor_pct}</code>%\n\n"
        "💡 <i>Выше броня — чаще побеждаете пиратов</i>\n\n"
        "⬆️ Следующий уровень:\n"
        "⚔️ Шанс победы: <code>{upgrade_armor_pct}</code>%\n"
        "💰 Стоимость: <code>{upgrade_price}</code> кредитов"
    )
    nodes.append(node("msg-armor-info", "message", 1600, 950, {
        "messageText": armor_info_text,
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [
            {
                "id": "btn-upgrade-armor",
                "text": "⬆️ Улучшить за {upgrade_price} кредитов",
                "action": "goto",
                "target": "do-upgrade-armor-check",
            },
        ],
    }))

    nodes.append(node("do-upgrade-armor-check", "condition", 1900, 950, {
        "variable": "pilot.credits",
        "branches": [
            branch("br-armor-no-money", "Не хватает", "less_than", "{armor_price}", "msg-armor-no-money"),
            branch("br-armor-has-money", "Хватает", "else", "", "do-upgrade-armor"),
        ],
    }))

    nodes.append(node("msg-armor-no-money", "message", 2200, 800, {
        "messageText": "❌ Недостаточно кредитов!\n\n💰 Нужно: <code>{armor_price}</code> кредитов\n💰 У вас: <code>{pilot.credits}</code> кредитов",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("do-upgrade-armor", "bot_table", 2200, 950, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "decrement", "value": "{armor_price}"},
            {"column": "armor_level", "op": "increment", "value": "1"},
        ],
        "autoTransitionTo": "tbl-read-pilot-ship",
        "enableAutoTransition": True,
    }))

    return {
        "id": "sheet-ship",
        "name": "🔧 Корабль",
        "nodes": nodes,
    }


# ============================================================
# Лист 6: 🌍 Планета (sheet-planet)
# ============================================================

def build_planet() -> dict:
    """
    Строит лист «🌍 Планета».
    Содержит основание планеты, просмотр, сбор руды, смену баффа.
    @returns словарь листа
    """
    nodes = []

    # --- Цепочка входа: читаем пилота → проверяем есть ли планета ---
    nodes.append(node("tbl-read-pilot-planet", "bot_table", 100, 0, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-has-planet",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-has-planet", "condition", 400, 0, {
        "variable": "pilot.planet_id",
        "branches": [
            branch("br-no-planet", "Нет планеты", "equals", "", "msg-no-planet"),
            branch("br-has-planet", "Есть планета", "else", "", "tbl-read-my-planet"),
        ],
    }))

    # --- Если планеты нет ---
    no_planet_text = (
        f"🌍 {MENTION}, у вас нет своей планеты.\n\n"
        "Основание планеты даёт:\n"
        "⛏ Шахта — пассивная добыча руды\n"
        "🎯 Бафф — бонус к продаже одной руды\n"
        "📦 Склад — хранение добытой руды\n\n"
        "💰 Стоимость: <code>1 000 000</code> кредитов\n"
        "💰 Ваш баланс: <code>{pilot.credits}</code>"
    )
    nodes.append(node("msg-no-planet", "message", 700, 200, {
        "messageText": no_planet_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-found-planet", "🌍 Основать планету"),
            btn("btn-planet-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-found-planet"]},
                {"buttonIds": ["btn-planet-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # Триггер для основания планеты
    nodes.append(node("trig-found-planet", "text_trigger", 100, 300, {
        "textMatchType": "exact",
        "textSynonyms": ["🌍 Основать планету"],
        "autoTransitionTo": "cond-found-credits",
        "enableAutoTransition": True,
    }))

    # --- Основание планеты ---
    nodes.append(node("cond-found-credits", "condition", 1000, 200, {
        "variable": "pilot.credits",
        "branches": [
            branch("br-found-no-money", "Не хватает", "less_than", "1000000", "msg-found-no-money"),
            branch("br-found-ok", "Хватает", "else", "", "set-found-planet"),
        ],
    }))

    nodes.append(node("msg-found-no-money", "message", 1300, 100, {
        "messageText": "❌ Недостаточно кредитов!\n\n💰 Нужно: <code>1 000 000</code> кредитов\n💰 У вас: <code>{pilot.credits}</code>",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("set-found-planet", "set_variable", 1300, 200, {
        "assignments": [
            {"id": "a-planet-name-id", "variable": "planet_name_id", "value": "1", "maxValue": "10", "mode": "random"},
            {"id": "a-buff-ore-roll", "variable": "buff_ore_roll", "value": "1", "maxValue": "8", "mode": "random"},
            {"id": "a-buff-pct", "variable": "buff_pct", "value": "1", "maxValue": "100", "mode": "random"},
        ],
        "autoTransitionTo": "lookup-planet-name",
        "enableAutoTransition": True,
    }))

    nodes.append(node("lookup-planet-name", "set_variable", 1600, 200, {
        "assignments": [
            {"id": "a-lookup-pname", "variable": "new_planet_name", "value": "", "mode": "lookup", "lookupTable": "planet_names", "lookupField": "name", "lookupWhere": [{"field": "id", "value": "{planet_name_id}"}]},
        ],
        "autoTransitionTo": "set-buff-ore",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-buff-ore", "set_variable", 1900, 200, {
        "assignments": [
            {"id": "a-buff-ore-id", "variable": "buff_ore_id", "value": "iron,copper,titanium,uranium,crystal,etherite,mithril,nexar", "mode": "random_item"},
            {"id": "a-buff-ore-name", "variable": "buff_ore_name", "value": "", "mode": "lookup", "lookupTable": "ores", "lookupField": "name", "lookupWhere": [{"field": "id", "value": "{buff_ore_id}"}]},
            {"id": "a-buff-ore-emoji", "variable": "buff_ore_emoji", "value": "", "mode": "lookup", "lookupTable": "ores", "lookupField": "emoji", "lookupWhere": [{"field": "id", "value": "{buff_ore_id}"}]},
        ],
        "autoTransitionTo": "do-found-planet",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-found-planet", "bot_table", 2200, 200, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "credits", "op": "decrement", "value": "1000000"},
            {"column": "planet_id", "op": "set", "value": "1"},
        ],
        "autoTransitionTo": "tbl-insert-planet",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-insert-planet", "bot_table", 2500, 200, {
        "tableName": "player_planets",
        "operation": "upsert",
        "key": "owner_id",
        "row": {
            "owner_id": "{user_id}",
            "name": "{new_planet_name}",
            "mine_level": "1",
            "energy_level": "1",
            "storage_level": "1",
            "defense_level": "1",
            "ore_stored": "0",
            "last_harvest": "{now_ts}",
            "buff_ore_id": "{buff_ore_id}",
            "buff_ore_name": "{buff_ore_emoji} {buff_ore_name}",
            "buff_percent": "{buff_pct}",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "msg-planet-founded",
        "enableAutoTransition": True,
    }))

    founded_text = (
        f"🎉 Планета основана!\n\n"
        "🌍 <b>{new_planet_name}</b>\n\n"
        "🎯 Бафф: +<code>{buff_pct}</code>% к продаже <b>{buff_ore_emoji} {buff_ore_name}</b>\n"
        "⛏ Шахта: ур. 1\n"
        "📦 Склад: ур. 1 (0/50)\n\n"
        "💰 Списано: <code>1 000 000</code> кредитов"
    )
    nodes.append(node("msg-planet-founded", "message", 2800, 200, {
        "messageText": founded_text,
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "tbl-read-my-planet",
        "enableAutoTransition": True,
    }))

    # --- Если планета есть: читаем данные планеты ---
    nodes.append(node("tbl-read-my-planet", "bot_table", 400, -200, {
        "tableName": "player_planets",
        "operation": "read",
        "where": [{"column": "owner_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "planet",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-planet-calc",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-planet-calc", "set_variable", 700, -200, {
        "assignments": [
            {"id": "a-pc-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
            {"id": "a-pc-hours", "variable": "hours_passed", "value": "({now_ts} - {planet.last_harvest}) // 3600", "mode": "expression"},
            {"id": "a-pc-mined", "variable": "ore_mined", "value": "{hours_passed} * {planet.mine_level}", "mode": "expression"},
            {"id": "a-pc-max", "variable": "storage_max", "value": "{planet.storage_level} * 50", "mode": "expression"},
            {"id": "a-pc-avail", "variable": "ore_available", "value": "min({planet.ore_stored} + {ore_mined}, {storage_max})", "mode": "expression"},
        ],
        "autoTransitionTo": "msg-my-planet",
        "enableAutoTransition": True,
    }))

    my_planet_text = (
        f"🌍 {MENTION}, ваша планета <b>{{planet.name}}</b>:\n\n"
        "⛏ Шахта: ур. <code>{planet.mine_level}</code> ({planet.mine_level} руды/час)\n"
        "📦 Склад: ур. <code>{planet.storage_level}</code> (<code>{ore_available}</code>/<code>{storage_max}</code>)\n"
        "⚡ Энергия: ур. <code>{planet.energy_level}</code>\n"
        "🛡 Защита: ур. <code>{planet.defense_level}</code>\n\n"
        "🎯 Бафф: +<code>{planet.buff_percent}</code>% к продаже <b>{planet.buff_ore_name}</b>\n"
        "🌀 Фрагменты Эфира: <code>{pilot.fragments}</code>\n\n"
        "━━━━━━━━━━━━━━━━\n"
        "💰 <code>{pilot.credits}</code> | ⛽ <code>{pilot.fuel}</code>"
    )
    nodes.append(node("msg-my-planet", "message", 1000, -200, {
        "messageText": my_planet_text,
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-p-harvest", "⛏ Собрать руду"),
            btn("btn-p-buff", "🌀 Сменить бафф"),
            btn("btn-p-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-p-harvest", "btn-p-buff"]},
                {"buttonIds": ["btn-p-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # =============================================
    # ⛏ СБОР РУДЫ
    # =============================================
    nodes.append(node("trig-harvest", "text_trigger", 100, 500, {
        "textMatchType": "exact",
        "textSynonyms": ["⛏ Собрать руду"],
        "autoTransitionTo": "tbl-harvest-read-pilot",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-harvest-read-pilot", "bot_table", 400, 500, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "tbl-harvest-read-planet",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-harvest-read-planet", "bot_table", 700, 500, {
        "tableName": "player_planets",
        "operation": "read",
        "where": [{"column": "owner_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "planet",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-harvest-calc",
        "enableAutoTransition": True,
    }))

    nodes.append(node("set-harvest-calc", "set_variable", 1000, 500, {
        "assignments": [
            {"id": "a-hc-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
            {"id": "a-hc-hours", "variable": "hours_passed", "value": "({now_ts} - {planet.last_harvest}) // 3600", "mode": "expression"},
            {"id": "a-hc-mined", "variable": "ore_mined", "value": "{hours_passed} * {planet.mine_level}", "mode": "expression"},
            {"id": "a-hc-max", "variable": "storage_max", "value": "{planet.storage_level} * 50", "mode": "expression"},
            {"id": "a-hc-collect", "variable": "ore_to_collect", "value": "min({planet.ore_stored} + {ore_mined}, {storage_max})", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-harvest-empty",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-harvest-empty", "condition", 1300, 500, {
        "variable": "ore_to_collect",
        "branches": [
            branch("br-harvest-empty", "Пусто", "equals", "0", "msg-harvest-empty"),
            branch("br-harvest-has", "Есть руда", "else", "", "cond-harvest-cargo"),
        ],
    }))

    nodes.append(node("msg-harvest-empty", "message", 1600, 400, {
        "messageText": "⛏ Склад пуст!\n\nШахта ещё не добыла руду.",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("cond-harvest-cargo", "condition", 1600, 500, {
        "variable": "pilot.cargo_used",
        "branches": [
            branch("br-harvest-full", "Трюм полон", "equals", "{pilot.cargo_max}", "msg-harvest-full"),
            branch("br-harvest-space", "Есть место", "else", "", "do-harvest"),
        ],
    }))

    nodes.append(node("msg-harvest-full", "message", 1900, 400, {
        "messageText": "❌ Трюм полон!\n\n📦 <code>{pilot.cargo_used}/{pilot.cargo_max}</code>\n\nПродайте руду чтобы освободить место.",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("do-harvest", "set_variable", 1900, 500, {
        "assignments": [
            {"id": "a-h-space", "variable": "space_left", "value": "{pilot.cargo_max} - {pilot.cargo_used}", "mode": "expression"},
            {"id": "a-h-amount", "variable": "harvest_amount", "value": "min({ore_to_collect}, {space_left})", "mode": "expression"},
        ],
        "autoTransitionTo": "do-harvest-update",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-harvest-update", "bot_table", 2200, 500, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "cargo_used", "op": "increment", "value": "{harvest_amount}"},
        ],
        "autoTransitionTo": "do-harvest-planet-update",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-harvest-planet-update", "bot_table", 2500, 500, {
        "tableName": "player_planets",
        "operation": "update",
        "where": [{"column": "owner_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "ore_stored", "op": "set", "value": "0"},
            {"column": "last_harvest", "op": "set", "value": "{now_ts}"},
        ],
        "autoTransitionTo": "do-harvest-cargo-upsert",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-harvest-cargo-upsert", "bot_table", 2800, 500, {
        "tableName": "pilot_cargo",
        "operation": "count",
        "where": [
            {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
            {"column": "ore_id", "operator": "equals", "value": "iron"},
        ],
        "saveResultTo": "harvest_cargo_exists",
        "autoTransitionTo": "cond-harvest-cargo-exists",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-harvest-cargo-exists", "condition", 3100, 500, {
        "variable": "harvest_cargo_exists",
        "branches": [
            branch("br-hc-new", "Новая", "equals", "0", "do-harvest-cargo-insert"),
            branch("br-hc-exists", "Уже есть", "else", "", "do-harvest-cargo-inc"),
        ],
    }))

    nodes.append(node("do-harvest-cargo-insert", "bot_table", 3400, 400, {
        "tableName": "pilot_cargo",
        "operation": "insert",
        "row": {
            "pilot_id": "{user_id}",
            "ore_id": "iron",
            "ore_name": "Железо",
            "ore_emoji": "⚙️",
            "quantity": "{harvest_amount}",
        },
        "autoTransitionTo": "msg-harvest-ok",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-harvest-cargo-inc", "bot_table", 3400, 600, {
        "tableName": "pilot_cargo",
        "operation": "update",
        "where": [
            {"column": "pilot_id", "operator": "equals", "value": "{user_id}"},
            {"column": "ore_id", "operator": "equals", "value": "iron"},
        ],
        "updates": [
            {"column": "quantity", "op": "increment", "value": "{harvest_amount}"},
        ],
        "autoTransitionTo": "msg-harvest-ok",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-harvest-ok", "message", 3700, 500, {
        "messageText": "⛏ Собрано руды!\n\n⚙️ Железо: +<code>{harvest_amount}</code> шт.\n📦 Трюм: <code>{pilot.cargo_used}/{pilot.cargo_max}</code>",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    # =============================================
    # 🌀 СМЕНА БАФФА
    # =============================================
    nodes.append(node("trig-buff", "text_trigger", 100, 900, {
        "textMatchType": "exact",
        "textSynonyms": ["🌀 Сменить бафф"],
        "autoTransitionTo": "tbl-buff-read-pilot",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-buff-read-pilot", "bot_table", 400, 900, {
        "tableName": "pilots",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "pilot",
        "resultFormat": "first_row",
        "autoTransitionTo": "tbl-buff-read-planet",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-buff-read-planet", "bot_table", 700, 900, {
        "tableName": "player_planets",
        "operation": "read",
        "where": [{"column": "owner_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "planet",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-buff-fragments",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-buff-fragments", "condition", 1000, 900, {
        "variable": "pilot.fragments",
        "branches": [
            branch("br-buff-no", "Нет фрагментов", "less_than", "1", "msg-buff-no-fragments"),
            branch("br-buff-ok", "Есть", "else", "", "set-buff-new"),
        ],
    }))

    nodes.append(node("msg-buff-no-fragments", "message", 1300, 800, {
        "messageText": "❌ Нет Фрагментов Эфира!\n\n🌀 У вас: <code>0</code>\n\n💡 Фрагменты выпадают при победе над пиратами (15% шанс).",
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(node("set-buff-new", "set_variable", 1300, 900, {
        "assignments": [
            {"id": "a-new-buff-ore", "variable": "new_buff_ore_id", "value": "iron,copper,titanium,uranium,crystal,etherite,mithril,nexar", "mode": "random_item"},
            {"id": "a-new-buff-pct", "variable": "new_buff_pct", "value": "1", "maxValue": "100", "mode": "random"},
        ],
        "autoTransitionTo": "lookup-buff-new-name",
        "enableAutoTransition": True,
    }))

    nodes.append(node("lookup-buff-new-name", "set_variable", 1600, 900, {
        "assignments": [
            {"id": "a-lk-buff-name", "variable": "new_buff_ore_name", "value": "", "mode": "lookup", "lookupTable": "ores", "lookupField": "name", "lookupWhere": [{"field": "id", "value": "{new_buff_ore_id}"}]},
            {"id": "a-lk-buff-emoji", "variable": "new_buff_ore_emoji", "value": "", "mode": "lookup", "lookupTable": "ores", "lookupField": "emoji", "lookupWhere": [{"field": "id", "value": "{new_buff_ore_id}"}]},
        ],
        "autoTransitionTo": "do-buff-update",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-buff-update", "bot_table", 1900, 900, {
        "tableName": "pilots",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "fragments", "op": "decrement", "value": "1"},
        ],
        "autoTransitionTo": "do-buff-planet-update",
        "enableAutoTransition": True,
    }))

    nodes.append(node("do-buff-planet-update", "bot_table", 2200, 900, {
        "tableName": "player_planets",
        "operation": "update",
        "where": [{"column": "owner_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "buff_ore_id", "op": "set", "value": "{new_buff_ore_id}"},
            {"column": "buff_ore_name", "op": "set", "value": "{new_buff_ore_emoji} {new_buff_ore_name}"},
            {"column": "buff_percent", "op": "set", "value": "{new_buff_pct}"},
        ],
        "autoTransitionTo": "msg-buff-changed",
        "enableAutoTransition": True,
    }))

    buff_changed_text = (
        "🌀 Бафф изменён!\n\n"
        "Было: +<code>{planet.buff_percent}</code>% к продаже <b>{planet.buff_ore_name}</b>\n"
        "Стало: +<code>{new_buff_pct}</code>% к продаже <b>{new_buff_ore_emoji} {new_buff_ore_name}</b>\n\n"
        "🌀 Фрагменты: <code>{pilot.fragments}</code>"
    )
    nodes.append(node("msg-buff-changed", "message", 2500, 900, {
        "messageText": buff_changed_text,
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-planet",
        "name": "🌍 Планета",
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
            build_pirates(),
            build_ship(),
            build_planet(),
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
