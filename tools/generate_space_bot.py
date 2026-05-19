"""
@fileoverview Генератор project.json для бота «Космический Торговец».
Создаёт 4 листа: Старт/Меню, Торговля, Карта, Корабль.
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
        # Следующий узел в цепочке
        if i < len(ORES) - 1:
            next_id = f"tbl-init-ores-{ORES[i + 1]['id']}"
        else:
            next_id = "msg-welcome"

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

    # --- Приветственное сообщение с главным меню ---
    welcome_text = (
        "🚀 Добро пожаловать на борт, пилот!\n\n"
        "Вы на планете: 🌍 Земля\n"
        "💰 Кредиты: 500\n"
        "⛽ Топливо: 50\n"
        "📦 Трюм: 0/10"
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
        "autoTransitionTo": "msg-buy-menu",
        "enableAutoTransition": True,
    }))

    # Сообщение с inline-кнопками для покупки (8 руд)
    # Цены показываются из base_price_{planet} — в будущем заменим на ore_prices
    buy_text = (
        f"🛒 {MENTION}, руды на планете {{pilot.current_planet}}:\n\n"
        "📦 Трюм: {pilot.cargo_used}/{pilot.cargo_max}\n"
        "💰 Кредиты: {pilot.credits}\n\n"
        "Выберите руду для покупки (1 шт):"
    )
    buy_buttons = []
    for ore in ORES:
        buy_buttons.append({
            "id": f"btn-buy-{ore['id']}",
            "text": f"{ore['emoji']} {ore['name']}",
            "action": "goto",
            "target": f"buy-check-{ore['id']}",
        })

    nodes.append(node("msg-buy-menu", "message", 1000, 300, {
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
            "messageText": f"❌ Недостаточно кредитов для покупки {ore['emoji']} {ore['name']}!\n\n💰 Нужно: {{ore_price}} кр.\n💰 У вас: {{pilot.credits}} кр.",
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
            "messageText": "❌ Трюм полон! 📦 {pilot.cargo_used}/{pilot.cargo_max}\n\nПродайте руду или улучшите трюм.",
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
                "quantity": "1",
            },
            "autoTransitionTo": f"msg-buy-ok-{ore['id']}",
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
            "autoTransitionTo": f"msg-buy-ok-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Успешная покупка
        nodes.append(node(f"msg-buy-ok-{ore['id']}", "message", 2500, y_pos, {
            "messageText": f"✅ Куплено: {ore['emoji']} {ore['name']} (1 шт.)\n\n💰 Списано: {{ore_price}} кр.\n📦 Трюм: {{pilot.cargo_used}}/{{pilot.cargo_max}}",
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
            branch("br-sell-has", "Есть руда", "else", "", "msg-sell-menu"),
        ],
    }))

    nodes.append(node("msg-sell-empty", "message", 1300, 3850, {
        "messageText": "📦 Ваш трюм пуст! Нечего продавать.\n\nКупите руду на текущей планете.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # Меню продажи — inline кнопки для каждой руды
    sell_text = (
        f"💰 {MENTION}, продажа руд:\n\n"
        "🌍 Планета: {pilot.current_planet}\n"
        "📦 Трюм: {pilot.cargo_used}/{pilot.cargo_max}\n\n"
        "Выберите руду для продажи (всё количество):"
    )
    sell_buttons = []
    for ore in ORES:
        sell_buttons.append({
            "id": f"btn-sell-{ore['id']}",
            "text": f"{ore['emoji']} {ore['name']}",
            "action": "goto",
            "target": f"sell-check-{ore['id']}",
        })

    nodes.append(node("msg-sell-menu", "message", 1300, 4000, {
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

        # Устанавливаем цену продажи
        nodes.append(node(f"sell-set-price-{ore['id']}", "set_variable", 1000, y_pos, {
            "assignments": [
                {"id": f"a-sell-price-{ore['id']}", "variable": "sell_price", "value": "{sell_ore.base_price_{pilot.current_planet}}", "mode": "text"},
            ],
            "autoTransitionTo": f"sell-set-income-{ore['id']}",
            "enableAutoTransition": True,
        }))

        # Вычисляем доход (отдельный узел чтобы sell_price уже был установлен)
        nodes.append(node(f"sell-set-income-{ore['id']}", "set_variable", 1300, y_pos, {
            "assignments": [
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
            "messageText": f"✅ Продано: {ore['emoji']} {ore['name']} x{{sell_item.quantity}}\n\n💰 Получено: {{sell_income}} кр.\n💰 Баланс: {{pilot.credits}} кр.",
            "keyboardType": "none",
            "buttons": [],
        }))

    # =============================================
    # 📦 ТРЮМ — просмотр содержимого
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
        "autoTransitionTo": "msg-cargo-view",
        "enableAutoTransition": True,
    }))

    cargo_text = (
        f"📦 {MENTION}, содержимое трюма:\n\n"
        "📦 Занято: {pilot.cargo_used}/{pilot.cargo_max}\n\n"
        "Используйте «💰 Продать» для продажи руд."
    )
    nodes.append(node("msg-cargo-view", "message", 1000, 7000, {
        "messageText": cargo_text,
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
