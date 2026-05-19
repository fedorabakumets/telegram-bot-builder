"""
@fileoverview Генератор project.json для полного клона RPG-бота.
Создаёт все листы, узлы, кнопки и связи на основе данных из scrape_log_v3.json.
Точное воспроизведение текстов, эмодзи и структуры оригинального бота.
@module tools/generate_clone_bot
"""

import json
import os
from pathlib import Path


# ============================================================
# Вспомогательные функции
# ============================================================

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
# Главная reply-клавиатура
# ============================================================

MAIN_KB_BUTTONS = [
    btn("btn-m-earn", "💸 Заработок"),
    btn("btn-m-games", "🎮 Игры"),
    btn("btn-m-prop", "🌇 Имущество"),
    btn("btn-m-prof", "👤 Профиль"),
    btn("btn-m-clan", "🛡 Клан"),
    btn("btn-m-ach", "🏅 Ачивки"),
    btn("btn-m-cmd", "📚 Команды"),
    btn("btn-m-don", "🍩 Донат"),
    btn("btn-m-ref", "🤑 Реферальная система"),
]

MAIN_KB_LAYOUT = {
    "autoLayout": False,
    "columns": 3,
    "rows": [
        {"buttonIds": ["btn-m-earn", "btn-m-games", "btn-m-prop"]},
        {"buttonIds": ["btn-m-prof", "btn-m-clan", "btn-m-ach"]},
        {"buttonIds": ["btn-m-cmd", "btn-m-don"]},
        {"buttonIds": ["btn-m-ref"]},
    ],
}


def main_menu_msg(msg_id: str, text: str, x: int, y: int) -> dict:
    """
    Создаёт сообщение с главной reply-клавиатурой.
    @param msg_id - ID узла
    @param text - текст сообщения
    @param x - позиция X
    @param y - позиция Y
    @returns узел сообщения
    """
    return node(msg_id, "message", x, y, {
        "messageText": text,
        "keyboardType": "reply",
        "buttons": [
            btn(f"{msg_id}-earn", "💸 Заработок"),
            btn(f"{msg_id}-games", "🎮 Игры"),
            btn(f"{msg_id}-prop", "🌇 Имущество"),
            btn(f"{msg_id}-prof", "👤 Профиль"),
            btn(f"{msg_id}-clan", "🛡 Клан"),
            btn(f"{msg_id}-ach", "🏅 Ачивки"),
            btn(f"{msg_id}-cmd", "📚 Команды"),
            btn(f"{msg_id}-don", "🍩 Донат"),
            btn(f"{msg_id}-ref", "🤑 Реферальная система"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": [f"{msg_id}-earn", f"{msg_id}-games", f"{msg_id}-prop"]},
                {"buttonIds": [f"{msg_id}-prof", f"{msg_id}-clan", f"{msg_id}-ach"]},
                {"buttonIds": [f"{msg_id}-cmd", f"{msg_id}-don"]},
                {"buttonIds": [f"{msg_id}-ref"]},
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
    Содержит /start, upsert пользователя, главное меню, профиль, клан, ачивки,
    донат, реферальная система, возврат в меню.
    @returns словарь листа
    """
    nodes = []

    # --- /start → upsert user → приветствие с главным меню ---
    nodes.append(node("cmd-start", "command_trigger", 100, 0, {
        "command": "/start",
        "description": "Запустить бота",
        "showInMenu": True,
        "autoTransitionTo": "tbl-upsert-user",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-upsert-user", "bot_table", 400, 0, {
        "tableName": "users",
        "operation": "upsert",
        "key": "telegram_id",
        "row": {
            "telegram_id": "{user_id}",
            "nickname": "{first_name}",
            "balance": "1000",
            "level": "1",
            "exp": "0",
            "exp_to_next": "64",
            "profession": "Безработный",
            "clan_id": "",
            "game_id": "{user_id}",
            "registered_at": "{__now}",
        },
        "onConflict": "ignore",
        "saveResultTo": "user",
        "autoTransitionTo": "tbl-init-clans",
        "enableAutoTransition": True,
    }))

    # === Цепочка инициализации таблиц (при первом /start) ===
    nodes.append(node("tbl-init-clans", "bot_table", 700, -200, {
        "tableName": "clans",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "0",
            "name": "_init",
            "level": "1",
            "exp": "0",
            "exp_to_next": "100",
            "treasury": "0",
            "rating": "0",
            "members_count": "0",
            "max_members": "10",
            "entry_type": "Открыт",
            "leader_name": "",
            "harbor_level": "1",
            "harbor_storage": "0",
            "harbor_max": "1000",
            "harbor_rate": "10",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-cooldowns",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-cooldowns", "bot_table", 1000, -200, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "0",
            "action_type": "_init",
            "expires_at": "0",
            "notified": "true",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-user-cars",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-user-cars", "bot_table", 1300, -200, {
        "tableName": "user_cars",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "0",
            "car_id": "0",
            "car_name": "_init",
            "horsepower": "0",
            "max_speed": "0",
            "purchased_at": "",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-user-houses",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-user-houses", "bot_table", 1600, -200, {
        "tableName": "user_houses",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "0",
            "house_id": "0",
            "house_name": "_init",
            "rooms": "0",
            "purchased_at": "",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-user-biz",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-user-biz", "bot_table", 1900, -200, {
        "tableName": "user_businesses",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "0",
            "business_id": "0",
            "business_name": "_init",
            "level": "0",
            "profit_rate": "0",
            "purchased_at": "",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-achievements",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-achievements", "bot_table", 2200, -200, {
        "tableName": "achievements",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "0",
            "achievement_id": "_init",
            "progress": "0",
            "max_progress": "100",
            "completed": "false",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-referrals",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-referrals", "bot_table", 2500, -200, {
        "tableName": "referrals",
        "operation": "upsert",
        "key": "referrer_id",
        "row": {
            "referrer_id": "0",
            "referred_id": "0",
            "reward_earned": "0",
            "created_at": "",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "tbl-init-transactions",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-init-transactions", "bot_table", 2800, -200, {
        "tableName": "transactions",
        "operation": "upsert",
        "key": "id",
        "row": {
            "id": "0",
            "from_user_id": "0",
            "to_user_id": "0",
            "amount": "0",
            "type": "_init",
            "created_at": "",
        },
        "onConflict": "ignore",
        "autoTransitionTo": "msg-welcome",
        "enableAutoTransition": True,
    }))

    nodes.append(main_menu_msg("msg-welcome", "🚀", 700, 0))

    # --- text_trigger "💸 Заработок" ---
    nodes.append(node("trig-earning", "text_trigger", 100, 300, {
        "textMatchType": "exact",
        "textSynonyms": ["💸 Заработок"],
        "autoTransitionTo": "tbl-read-user-earn",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-earn", "bot_table", 400, 300, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-earn-menu",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-earn-menu", "message", 700, 300, {
        "messageText": "💸 {user.nickname}, меню заработка:",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-e-work", "🛠 Работа"),
            btn("btn-e-mine", "🌋 Шахта"),
            btn("btn-e-fish", "🎣 Рыбалка"),
            btn("btn-e-ranch", "🏞 Ранчо"),
            btn("btn-e-crate", "📦 Ящики"),
            btn("btn-e-biz", "💹 Бизнес"),
            btn("btn-e-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-e-work", "btn-e-mine", "btn-e-fish"]},
                {"buttonIds": ["btn-e-ranch", "btn-e-crate", "btn-e-biz"]},
                {"buttonIds": ["btn-e-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # --- text_trigger "🎮 Игры" ---
    nodes.append(node("trig-games", "text_trigger", 100, 500, {
        "textMatchType": "exact",
        "textSynonyms": ["🎮 Игры"],
        "autoTransitionTo": "tbl-read-user-games",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-games", "bot_table", 400, 500, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-games-menu",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-games-menu", "message", 700, 500, {
        "messageText": (
            "🎮 {user.nickname}, меню игр:\n\n"
            "🎲 💡 В чатах можно сыграть с другими игроками — Кости, Дуэль, Рулетка и др."
        ),
        "formatMode": "html",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-g-slots", "🎰 Слоты"),
            btn("btn-g-mines", "💣 Мины"),
            btn("btn-g-safe", "🔑 Сейф"),
            btn("btn-g-crash", "🚀 Краш"),
            btn("btn-g-tower", "🗼 Башня"),
            btn("btn-g-bj", "♠️ Блекджек"),
            btn("btn-g-basket", "🏀 Баскетбол"),
            btn("btn-g-penalty", "⚽ Пенальти"),
            btn("btn-g-darts", "🎯 Дартс"),
            btn("btn-g-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-g-slots", "btn-g-mines", "btn-g-safe"]},
                {"buttonIds": ["btn-g-crash", "btn-g-tower", "btn-g-bj"]},
                {"buttonIds": ["btn-g-basket", "btn-g-penalty", "btn-g-darts"]},
                {"buttonIds": ["btn-g-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # --- text_trigger "🌇 Имущество" ---
    nodes.append(node("trig-property", "text_trigger", 100, 700, {
        "textMatchType": "exact",
        "textSynonyms": ["🌇 Имущество"],
        "autoTransitionTo": "tbl-read-user-prop",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-prop", "bot_table", 400, 700, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-prop-menu",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-prop-menu", "message", 700, 700, {
        "messageText": "🌇 {user.nickname}, меню имущества:",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-p-car", "🚘 Машина"),
            btn("btn-p-house", "🏠 Дом"),
            btn("btn-p-biz", "💹 Бизнес"),
            btn("btn-p-mining", "🪫 Майнинг ферма"),
            btn("btn-p-shop", "🛒 Магазин"),
            btn("btn-p-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-p-car", "btn-p-house", "btn-p-biz"]},
                {"buttonIds": ["btn-p-mining"]},
                {"buttonIds": ["btn-p-shop"]},
                {"buttonIds": ["btn-p-back"]},
            ],
        },
        "resizeKeyboard": True,
    }))

    # --- text_trigger "👤 Профиль" ---
    nodes.append(node("trig-profile", "text_trigger", 100, 900, {
        "textMatchType": "exact",
        "textSynonyms": ["👤 Профиль"],
        "autoTransitionTo": "tbl-read-profile",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-profile", "bot_table", 400, 900, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-profile",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-profile", "message", 700, 900, {
        "messageText": (
            "🧢 {user.nickname}, ваш профиль:\n\n"
            "🌟 Уровень: {user.level} ({user.exp}/{user.exp_to_next})\n"
            "💰 Баланс: {user.balance}$\n\n"
            "👨\u200d🏭 Профессия: {user.profession}\n\n"
            "🎭 Клан: {user.clan_id} (👤)\n"
            "🆔 Игровой ид: {user.game_id}\n"
            "📚 Дата регистрации: {user.registered_at}"
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🛡 Клан" ---
    nodes.append(node("trig-clan", "text_trigger", 100, 1100, {
        "textMatchType": "exact",
        "textSynonyms": ["🛡 Клан"],
        "autoTransitionTo": "tbl-read-user-clan",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-clan", "bot_table", 400, 1100, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-has-clan",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-has-clan", "condition", 700, 1100, {
        "variable": "user.clan_id",
        "branches": [
            branch("br-has-clan", "Есть клан", "is_not_empty", "", "msg-clan-info"),
            branch("br-no-clan", "Нет клана", "else", "", "msg-no-clan"),
        ],
    }))
    nodes.append(node("msg-no-clan", "message", 1000, 1200, {
        "messageText": (
            "😢 {user.nickname}, вы не состоите в клане.\n\n"
            "Используйте команду: 🛡 Клан вступить [ид клана]"
        ),
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-clan-info", "message", 1300, 1050, {
        "messageText": (
            "❔ {user.nickname}, ваш клан:\n\n"
            "🎭 Название: {clan.name} (ID: {clan.id})\n"
            "⭐️ Уровень: {clan.level} ({clan.exp}/{clan.exp_to_next})\n"
            "💰 Казна: {clan.treasury}$\n"
            "🏆 Рейтинг: {clan.rating}\n"
            "👥 Участники: {clan.members_count}/{clan.max_members}\n\n"
            "🔓 Вход: {clan.entry_type}\n"
            "👑 Лидер клана: {clan.leader_name}"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-cl-season", "🏆 Сезон", target="msg-clan-season-wip"),
            btn("btn-cl-members", "👥 Участники", target="msg-clan-members-wip"),
            btn("btn-cl-harbor", "⚓️ Гавань", target="msg-clan-harbor-wip"),
            btn("btn-cl-bonus", "⭐️ Бонусы", target="msg-clan-bonus-wip"),
            btn("btn-cl-mprof", "👤 Профиль участника", target="msg-clan-mprof-wip"),
            btn("btn-cl-leave", "🚪 Покинуть клан", target="msg-clan-leave-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-cl-season", "btn-cl-members"]},
                {"buttonIds": ["btn-cl-harbor", "btn-cl-bonus"]},
                {"buttonIds": ["btn-cl-mprof"]},
                {"buttonIds": ["btn-cl-leave"]},
            ],
        },
    }))

    # Заглушки кнопок клана
    for wip_id, wip_text in [
        ("msg-clan-season-wip", "🏆 Раздел «Сезон» в разработке."),
        ("msg-clan-members-wip", "👥 Раздел «Участники» в разработке."),
        ("msg-clan-harbor-wip", "⚓️ Раздел «Гавань» в разработке."),
        ("msg-clan-bonus-wip", "⭐️ Раздел «Бонусы» в разработке."),
        ("msg-clan-mprof-wip", "👤 Раздел «Профиль участника» в разработке."),
        ("msg-clan-leave-wip", "🚪 Вы покинули клан. (заглушка)"),
    ]:
        nodes.append(node(wip_id, "message", 1600, 1050, {
            "messageText": wip_text,
            "keyboardType": "none",
            "buttons": [],
        }))

    # --- text_trigger "🏅 Ачивки" ---
    nodes.append(node("trig-achiev", "text_trigger", 100, 1300, {
        "textMatchType": "exact",
        "textSynonyms": ["🏅 Ачивки"],
        "autoTransitionTo": "tbl-read-user-ach",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-ach", "bot_table", 400, 1300, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-achiev",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-achiev", "message", 700, 1300, {
        "messageText": "🏅 {user.nickname}, прогресс ваших достижений:",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-ach-1", "🤺 Стажер года (0% / 100%)", target="msg-ach-wip"),
            btn("btn-ach-2", "🎰 Мечта (0% / 100%)", target="msg-ach-wip"),
            btn("btn-ach-3", "💣 Сапёр (0% / 100%)", target="msg-ach-wip"),
            btn("btn-ach-4", "🌋 Шахтер (0% / 100%)", target="msg-ach-wip"),
            btn("btn-ach-5", "🏎 Шумахер (0% / 100%)", target="msg-ach-wip"),
            btn("btn-ach-prev", "<", target="msg-ach-wip"),
            btn("btn-ach-page", "1 / 3", action="goto", target="msg-ach-wip"),
            btn("btn-ach-next", ">", target="msg-ach-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-ach-1"]},
                {"buttonIds": ["btn-ach-2"]},
                {"buttonIds": ["btn-ach-3"]},
                {"buttonIds": ["btn-ach-4"]},
                {"buttonIds": ["btn-ach-5"]},
                {"buttonIds": ["btn-ach-prev", "btn-ach-page", "btn-ach-next"]},
            ],
        },
    }))
    nodes.append(node("msg-ach-wip", "message", 1000, 1300, {
        "messageText": "🏅 Достижения — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "📚 Команды" ---
    nodes.append(node("trig-commands", "text_trigger", 100, 1500, {
        "textMatchType": "exact",
        "textSynonyms": ["📚 Команды"],
        "autoTransitionTo": "tbl-read-user-help",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-help", "bot_table", 400, 1500, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-help",
        "enableAutoTransition": True,
    }))

    # --- text_trigger "🍩 Донат" ---
    nodes.append(node("trig-donate", "text_trigger", 100, 1700, {
        "textMatchType": "exact",
        "textSynonyms": ["🍩 Донат"],
        "autoTransitionTo": "tbl-read-user-donate",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-donate", "bot_table", 400, 1700, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-donate",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-donate", "message", 700, 1700, {
        "messageText": (
            "🍩 {user.nickname}, меню доната:\n\n"
            "💶 Ваш баланс: 0 QC\n\n"
            "❗ Приглашайте друзей и получайте 5% от их пополнений!\n"
            "❔ Пополните баланс или перейдите к выбору товара:"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-don-items", "🛍 Товары", target="msg-don-items-wip"),
            btn("btn-don-topup", "💷 Пополнить баланс", target="msg-don-topup-wip"),
            btn("btn-don-gift", "🎁 Подарить QC", target="msg-don-gift-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-don-items"]},
                {"buttonIds": ["btn-don-topup"]},
                {"buttonIds": ["btn-don-gift"]},
            ],
        },
    }))
    for wip_id, wip_text in [
        ("msg-don-items-wip", "🛍 Товары — раздел в разработке."),
        ("msg-don-topup-wip", "💷 Пополнение баланса — раздел в разработке."),
        ("msg-don-gift-wip", "🎁 Подарить QC — раздел в разработке."),
    ]:
        nodes.append(node(wip_id, "message", 1000, 1700, {
            "messageText": wip_text,
            "keyboardType": "none",
            "buttons": [],
        }))

    # --- text_trigger "🤑 Реферальная система" ---
    nodes.append(node("trig-referral", "text_trigger", 100, 1900, {
        "textMatchType": "exact",
        "textSynonyms": ["🤑 Реферальная система"],
        "autoTransitionTo": "tbl-read-user-ref",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-ref", "bot_table", 400, 1900, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-referral",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-referral", "message", 700, 1900, {
        "messageText": (
            "🫶 {user.nickname}, зарабатывай, приглашая друзей:\n\n"
            "💰 Баланс: 0$\n"
            "💸 Всего заработано: 0$\n"
            "🧲 Приглашено друзей: 0\n\n"
            "🔗 Твоя реферальная ссылка:\n"
            "⠀- https://t.me/botname?start=rl{user.game_id}\n\n"
            "🎁 Что ты получаешь:\n"
            "• 🤑 7,500$ — за регистрацию друга\n"
            "• 🌟 45,000$ — за каждый уровень друга\n"
            "• 🏖 1% — с каждой зарплаты друга\n"
            "• 💎 5% — с каждого доната друга"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-ref-share", "↪️ Поделиться", action="url",
                url="https://t.me/share/url?url=https://t.me/botname?start=rl{user.game_id}"),
            btn("btn-ref-withdraw", "💸 Снять баланс", target="msg-ref-withdraw-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-ref-share"]},
                {"buttonIds": ["btn-ref-withdraw"]},
            ],
        },
    }))
    nodes.append(node("msg-ref-withdraw-wip", "message", 1000, 1900, {
        "messageText": "💸 Снятие баланса — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "⬅️ Меню" → возврат ---
    nodes.append(node("trig-back-menu", "text_trigger", 100, 2100, {
        "textMatchType": "exact",
        "textSynonyms": ["⬅️ Меню"],
        "autoTransitionTo": "tbl-read-user-back",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-back", "bot_table", 400, 2100, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-main-menu",
        "enableAutoTransition": True,
    }))
    nodes.append(main_menu_msg("msg-main-menu", "📖 {user.nickname}, вы вернулись в меню:", 700, 2100))

    return {
        "id": "sheet-start-menu",
        "name": "⭐ Старт / Меню",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 2: 💸 Заработок (sheet-earning)
# ============================================================

def build_earning() -> dict:
    """
    Строит лист «💸 Заработок» с работой (мини-игра 4x4 + кулдаун + level up),
    шахтой, рыбалкой, ранчо, ящиками и бизнесом.
    @returns словарь листа
    """
    nodes = []

    # === 🛠 Работа ===
    # Цепочка: trig-work → tbl-read-cd-work → cond-work-cd
    #   ├─ кулдаун активен → msg-work-cd
    #   └─ можно работать → tbl-read-user-work → msg-work-game (сетка 4x4)
    #        ├─ правильная → set-work-reward (random) → tbl-work-update ({salary},{exp_gained})
    #        │    → set-work-cd (timestamp 90) → tbl-work-save-cd (upsert)
    #        │    → tbl-read-user-lvl → cond-level-up
    #        │        ├─ level up → tbl-level-up → msg-level-up → msg-work-success
    #        │        └─ нет → msg-work-success
    #        └─ неправильная → set-work-cd-fail (timestamp 90) → tbl-work-save-cd-fail → msg-work-fail

    nodes.append(node("trig-work", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["🛠 Работа"],
        "autoTransitionTo": "tbl-read-cd-work",
        "enableAutoTransition": True,
    }))

    # Читаем кулдаун работы
    nodes.append(node("tbl-read-cd-work", "bot_table", 400, 0, {
        "tableName": "cooldowns",
        "operation": "read",
        "where": [
            {"column": "user_id", "operator": "equals", "value": "{user_id}"},
            {"column": "action_type", "operator": "equals", "value": "work"},
        ],
        "saveResultTo": "cd",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-now-ts",
        "enableAutoTransition": True,
    }))

    # Проверяем: кулдаун ещё активен? Сначала получаем текущий timestamp
    nodes.append(node("set-now-ts", "set_variable", 650, 0, {
        "assignments": [
            {"id": "a-now", "variable": "now_ts", "value": "0", "mode": "timestamp"},
        ],
        "autoTransitionTo": "cond-work-cd",
        "enableAutoTransition": True,
    }))

    nodes.append(node("cond-work-cd", "condition", 900, 0, {
        "variable": "cd.expires_at",
        "branches": [
            branch("br-cd-active", "Кулдаун активен", "greater_than", "{now_ts}", "msg-work-cd"),
            branch("br-cd-expired", "Можно работать", "else", "", "tbl-read-user-work"),
        ],
    }))

    # Сообщение о кулдауне
    nodes.append(node("msg-work-cd", "message", 1000, -200, {
        "messageText": (
            "😨 {user.nickname}, следующая смена через: ...\n\n"
            "⏳ Подождите окончания кулдауна."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Читаем пользователя для мини-игры
    nodes.append(node("tbl-read-user-work", "bot_table", 1000, 0, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-work-emojis",
        "enableAutoTransition": True,
    }))

    # Выбираем случайный целевой эмодзи и формируем массив кнопок
    emojis_json = '[{"emoji":"🔧"},{"emoji":"💥"},{"emoji":"💡"},{"emoji":"⚡"},{"emoji":"🔨"},{"emoji":"🌋"},{"emoji":"🪛"},{"emoji":"🧯"},{"emoji":"⛓️"},{"emoji":"🚧"},{"emoji":"💎"},{"emoji":"🪤"},{"emoji":"⚙️"},{"emoji":"🔥"},{"emoji":"🛠"},{"emoji":"🔧"}]'
    nodes.append(node("set-work-emojis", "set_variable", 1150, 0, {
        "assignments": [
            {"id": "a-target", "variable": "target_emoji", "value": "🔧,💥,💡,⚡,🔨,🌋,🪛,🧯,⛓️,🚧,💎,🪤,⚙️,🔥,🛠,🔧", "mode": "random_item"},
            {"id": "a-emojis", "variable": "emojis_json", "value": emojis_json, "mode": "text"},
        ],
        "autoTransitionTo": "msg-work-game",
        "enableAutoTransition": True,
    }))

    # Мини-игра: сообщение с динамическими кнопками (shuffle + 4 колонки)
    nodes.append(node("msg-work-game", "message", 1300, 0, {
        "messageText": "🏖 {user.nickname}, рабочая смена началась!\n\n❔ Нажмите на смайлик «{target_emoji}»:",
        "keyboardType": "inline",
        "shuffleButtons": True,
        "enableDynamicButtons": True,
        "dynamicButtons": {
            "sourceVariable": "emojis_json",
            "arrayPath": "",
            "textTemplate": "{emoji}",
            "callbackTemplate": "work_{emoji}",
            "columns": 4,
        },
    }))

    # Триггер нажатия кнопки мини-игры (перехватывает все work_*)
    nodes.append(node("trig-work-callback", "incoming_callback_trigger", 1600, -200, {
        "callbackData": "work_",
        "matchType": "startswith",
        "autoTransitionTo": "set-check-work-answer",
        "enableAutoTransition": True,
    }))

    # Извлекаем нажатый эмодзи из callback_data
    nodes.append(node("set-check-work-answer", "set_variable", 1800, -200, {
        "assignments": [
            {"id": "a-pressed", "variable": "pressed_emoji", "value": "{callback_data}", "mode": "text"},
        ],
        "autoTransitionTo": "cond-work-answer",
        "enableAutoTransition": True,
    }))

    # Проверяем: нажатый эмодзи == целевой?
    nodes.append(node("cond-work-answer", "condition", 2000, -200, {
        "variable": "pressed_emoji",
        "branches": [
            branch("br-correct", "Правильно", "equals", "work_{target_emoji}", "set-work-reward"),
            branch("br-wrong", "Неправильно", "else", "", "set-work-cd-fail"),
        ],
    }))

    # === Правильная кнопка: начисление награды ===
    nodes.append(node("set-work-reward", "set_variable", 1500, -100, {
        "assignments": [
            {"id": "a-salary", "variable": "salary", "value": "700", "mode": "text"},
            {"id": "a-exp", "variable": "exp_gained", "value": "12", "mode": "text"},
        ],
        "autoTransitionTo": "tbl-work-update",
        "enableAutoTransition": True,
    }))

    # Начисление награды (фиксированные значения для increment)
    nodes.append(node("tbl-work-update", "bot_table", 1600, 0, {
        "tableName": "users",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "balance", "op": "increment", "value": "700"},
            {"column": "exp", "op": "increment", "value": "12"},
        ],
        "autoTransitionTo": "set-work-cd",
        "enableAutoTransition": True,
    }))

    # Кулдаун через timestamp (текущее время + 90 секунд)
    nodes.append(node("set-work-cd", "set_variable", 1800, 0, {
        "assignments": [
            {"id": "a-cd", "variable": "work_cooldown_until", "value": "90", "mode": "timestamp"},
        ],
        "autoTransitionTo": "tbl-work-save-cd",
        "enableAutoTransition": True,
    }))

    # Сохраняем кулдаун в таблицу
    nodes.append(node("tbl-work-save-cd", "bot_table", 2100, 0, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "{user_id}",
            "action_type": "work",
            "expires_at": "{work_cooldown_until}",
            "notified": "false",
        },
        "onConflict": "update",
        "autoTransitionTo": "tbl-read-user-lvl",
        "enableAutoTransition": True,
    }))

    # Читаем обновлённого пользователя для проверки level up
    nodes.append(node("tbl-read-user-lvl", "bot_table", 2200, 0, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "set-check-lvl",
        "enableAutoTransition": True,
    }))

    # Вычисляем разницу exp - exp_to_next для проверки level up
    nodes.append(node("set-check-lvl", "set_variable", 2500, 0, {
        "assignments": [
            {"id": "a-exp-diff", "variable": "exp_diff",
             "value": "{user.exp} - {user.exp_to_next}", "mode": "expression"},
        ],
        "autoTransitionTo": "cond-level-up",
        "enableAutoTransition": True,
    }))

    # Проверяем level up: exp_diff >= 0 означает level up
    nodes.append(node("cond-level-up", "condition", 2800, 0, {
        "variable": "exp_diff",
        "branches": [
            branch("br-lvl-up", "Level up", "greater_than", "-1", "set-calc-next-lvl"),
            branch("br-no-lvl", "Нет level up", "else", "", "msg-work-success"),
        ],
    }))

    # Вычисляем новый exp_to_next через set_variable (exp_to_next * 2)
    nodes.append(node("set-calc-next-lvl", "set_variable", 2800, -200, {
        "assignments": [
            {"id": "a-new-exp-next", "variable": "new_exp_to_next",
             "value": "{user.exp_to_next} * 2", "mode": "expression"},
        ],
        "autoTransitionTo": "tbl-level-up",
        "enableAutoTransition": True,
    }))

    # Обновляем пользователя: level+1, exp - exp_to_next, exp_to_next = новое значение
    nodes.append(node("tbl-level-up", "bot_table", 3100, -200, {
        "tableName": "users",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "level", "op": "increment", "value": "1"},
            {"column": "exp", "op": "decrement", "value": "{user.exp_to_next}"},
            {"column": "exp_to_next", "op": "set", "value": "{new_exp_to_next}"},
        ],
        "autoTransitionTo": "tbl-read-user-after-lvl",
        "enableAutoTransition": True,
    }))

    # Перечитываем пользователя после level up для актуальных данных
    nodes.append(node("tbl-read-user-after-lvl", "bot_table", 3400, -200, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-level-up",
        "enableAutoTransition": True,
    }))

    # Сообщение о повышении уровня
    nodes.append(node("msg-level-up", "message", 3700, -200, {
        "messageText": "🎉 {user.nickname}, поздравляем! Вы достигли {user.level} уровня!",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "msg-work-success",
        "enableAutoTransition": True,
    }))

    # Сообщение об успешной работе
    nodes.append(node("msg-work-success", "message", 2800, 0, {
        "messageText": (
            "🤩 {user.nickname}, смена завершена!\n\n"
            "💲 Зарплата: 700$\n"
            "⭐ Уровень: {user.level} ({user.exp}/{user.exp_to_next}) +12 exp\n\n"
            "😨 Следующая смена через: 01:30"
        ),
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "delay-cd-notify",
        "enableAutoTransition": True,
    }))

    # Фоновый таймер — уведомление через 90 секунд
    nodes.append(node("delay-cd-notify", "delay", 3100, 0, {
        "seconds": "90",
        "unit": "seconds",
        "mode": "background",
        "autoTransitionTo": "msg-cd-notify",
        "enableAutoTransition": True,
    }))

    # Уведомление после кулдауна
    nodes.append(node("msg-cd-notify", "message", 3400, 0, {
        "messageText": "🔔 {user.nickname}, вы можете начать новую рабочую смену.",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-work-again", "🏖 Работать", target="set-now-ts"),
        ],
    }))

    # === Неправильная кнопка: кулдаун через timestamp + сообщение об ошибке ===
    nodes.append(node("set-work-cd-fail", "set_variable", 1500, 300, {
        "assignments": [
            {"id": "a-cd-f", "variable": "work_cooldown_until", "value": "90", "mode": "timestamp"},
        ],
        "autoTransitionTo": "tbl-work-save-cd-fail",
        "enableAutoTransition": True,
    }))

    nodes.append(node("tbl-work-save-cd-fail", "bot_table", 1800, 300, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "{user_id}",
            "action_type": "work",
            "expires_at": "{work_cooldown_until}",
            "notified": "false",
        },
        "onConflict": "update",
        "autoTransitionTo": "msg-work-fail",
        "enableAutoTransition": True,
    }))

    # Неправильный ответ
    nodes.append(node("msg-work-fail", "message", 1900, 200, {
        "messageText": (
            "😢 {user.nickname}, к сожалению, вы нажали на неверный смайлик.\n"
            "Рабочая смена завершена\n"
            "😨 Начать новую смену можно через: 01:30"
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🌋 Шахта (lvl 3) ===
    nodes.append(node("trig-mine", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["🌋 Шахта"],
        "autoTransitionTo": "tbl-read-user-mine",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-mine", "bot_table", 400, 400, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-mine-lvl",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-mine-lvl", "condition", 700, 400, {
        "variable": "user.level",
        "branches": [
            branch("br-mine-ok", "Уровень >= 3", "greater_than", "2", "msg-mine-wip"),
            branch("br-mine-low", "Уровень < 3", "else", "", "msg-mine-locked"),
        ],
    }))
    nodes.append(node("msg-mine-locked", "message", 1000, 500, {
        "messageText": (
            "😢 {user.nickname}, <b>🌋 шахта</b> станет доступна после достижения "
            "<b>⭐3-го уровня</b>. Уровень можно повысить выполняя разную активность."
        ),
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [btn("btn-how-lvl-m", "📖 Как повысить уровень?", target="msg-how-level")],
    }))
    nodes.append(node("msg-mine-wip", "message", 1000, 350, {
        "messageText": "🌋 Шахта — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🎣 Рыбалка (lvl 7) ===
    nodes.append(node("trig-fish", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["🎣 Рыбалка"],
        "autoTransitionTo": "tbl-read-user-fish",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-fish", "bot_table", 400, 600, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-fish-lvl",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-fish-lvl", "condition", 700, 600, {
        "variable": "user.level",
        "branches": [
            branch("br-fish-ok", "Уровень >= 7", "greater_than", "6", "msg-fish-wip"),
            branch("br-fish-low", "Уровень < 7", "else", "", "msg-fish-locked"),
        ],
    }))
    nodes.append(node("msg-fish-locked", "message", 1000, 700, {
        "messageText": (
            "☹️ {user.nickname}, <b>🎣 Рыбалка</b> станет доступна после достижения "
            "<b>⭐7-го уровня</b>. Уровень можно повысить выполняя разную активность."
        ),
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [btn("btn-how-lvl-f", "📖 Как повысить уровень?", target="msg-how-level")],
    }))
    nodes.append(node("msg-fish-wip", "message", 1000, 550, {
        "messageText": "🎣 Рыбалка — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🏞 Ранчо (lvl 15) ===
    nodes.append(node("trig-ranch", "text_trigger", 100, 800, {
        "textMatchType": "exact",
        "textSynonyms": ["🏞 Ранчо"],
        "autoTransitionTo": "tbl-read-user-ranch",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-ranch", "bot_table", 400, 800, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-ranch-lvl",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-ranch-lvl", "condition", 700, 800, {
        "variable": "user.level",
        "branches": [
            branch("br-ranch-ok", "Уровень >= 15", "greater_than", "14", "msg-ranch-wip"),
            branch("br-ranch-low", "Уровень < 15", "else", "", "msg-ranch-locked"),
        ],
    }))
    nodes.append(node("msg-ranch-locked", "message", 1000, 900, {
        "messageText": (
            "☹️ {user.nickname}, <b>🏞 ранчо</b> станет доступно после достижения "
            "<b>⭐15-го уровня</b>. Уровень можно повысить выполняя разную активность."
        ),
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [btn("btn-how-lvl-r", "📖 Как повысить уровень?", target="msg-how-level")],
    }))
    nodes.append(node("msg-ranch-wip", "message", 1000, 750, {
        "messageText": "🏞 Ранчо — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 📦 Ящики ===
    nodes.append(node("trig-crates", "text_trigger", 100, 1000, {
        "textMatchType": "exact",
        "textSynonyms": ["📦 Ящики"],
        "autoTransitionTo": "tbl-read-user-crates",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-crates", "bot_table", 400, 1000, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-crates",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-crates", "message", 700, 1000, {
        "messageText": "😔 {user.nickname}, к сожалению, у вас еще нет ящиков. Их можно получить за разные активности.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 💹 Бизнес ===
    nodes.append(node("trig-biz", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["💹 Бизнес"],
        "autoTransitionTo": "tbl-read-user-biz",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-biz", "bot_table", 400, 1200, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-no-biz",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-no-biz", "message", 700, 1200, {
        "messageText": "😓 {user.nickname}, У вас нет бизнеса.",
        "keyboardType": "inline",
        "buttons": [btn("btn-biz-catalog", "🛍 Каталог бизнесов", target="msg-biz-catalog-wip")],
    }))
    nodes.append(node("msg-biz-catalog-wip", "message", 1000, 1200, {
        "messageText": "🛍 Каталог бизнесов — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === Общая заглушка «Как повысить уровень» ===
    nodes.append(node("msg-how-level", "message", 1300, 600, {
        "messageText": (
            "📈 {user.nickname}, как повысить уровень?\n\n"
            "💡 <b>Как работает система уровней?</b>\n"
            "⠀- Чтобы повысить уровень, вам нужно набрать <b>очки опыта (EXP)</b>.\n"
            "⠀- С каждым новым уровнем потребуется все больше EXP для перехода на следующий.\n\n"
            "🎯 <b>Где получить EXP?</b>\n"
            "⠀1️⃣ <b>Выполнение рабочих смен</b> – работайте и зарабатывайте опыт.\n"
            "⠀2️⃣ <b>Открытие ящиков</b> – в ящиках можно найти дополнительный опыт.\n"
            "⠀3️⃣ <b>Участие в специальных событиях</b> – принимайте участие в мероприятиях и получайте щедрые награды.\n\n"
            "🔓 <b>Что дает повышение уровня?</b>\n"
            "⠀- С каждым новым уровнем вы получаете доступ к новым <b>работам, активностям</b> и <b>уникальным возможностям</b>, которых нет на начальных этапах игры."
        ),
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-earning",
        "name": "💸 Заработок",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 3: 🎮 Игры (sheet-games)
# ============================================================

def build_games() -> dict:
    """
    Строит лист «🎮 Игры» с заглушками для каждой игры.
    @returns словарь листа
    """
    nodes = []

    games = [
        ("trig-slots", "🎰 Слоты", "msg-slots-wip", "🎰 Слоты — раздел в разработке."),
        ("trig-mines", "💣 Мины", "msg-mines-wip", "💣 Мины — раздел в разработке."),
        ("trig-safe", "🔑 Сейф", "msg-safe-wip", "🔑 Сейф — раздел в разработке."),
        ("trig-crash", "🚀 Краш", "msg-crash-wip", "🚀 Краш — раздел в разработке."),
        ("trig-tower", "🗼 Башня", "msg-tower-wip", "🗼 Башня — раздел в разработке."),
        ("trig-bj", "♠️ Блекджек", "msg-bj-wip", "♠️ Блекджек — раздел в разработке."),
        ("trig-basket", "🏀 Баскетбол", "msg-basket-wip", "🏀 Баскетбол — раздел в разработке."),
        ("trig-penalty", "⚽ Пенальти", "msg-penalty-wip", "⚽ Пенальти — раздел в разработке."),
        ("trig-darts", "🎯 Дартс", "msg-darts-wip", "🎯 Дартс — раздел в разработке."),
    ]

    for i, (trig_id, trigger_text, msg_id, msg_text) in enumerate(games):
        y = i * 200
        nodes.append(node(trig_id, "text_trigger", 100, y, {
            "textMatchType": "exact",
            "textSynonyms": [trigger_text],
            "autoTransitionTo": msg_id,
            "enableAutoTransition": True,
        }))
        nodes.append(node(msg_id, "message", 400, y, {
            "messageText": msg_text,
            "keyboardType": "none",
            "buttons": [],
        }))

    return {
        "id": "sheet-games",
        "name": "🎮 Игры",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


# ============================================================
# Лист 4: 🌇 Имущество (sheet-property)
# ============================================================

def build_property() -> dict:
    """
    Строит лист «🌇 Имущество» с машиной, домом, бизнесом,
    майнинг фермой и магазином.
    @returns словарь листа
    """
    nodes = []

    # === 🚘 Машина ===
    nodes.append(node("trig-car", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["🚘 Машина"],
        "autoTransitionTo": "msg-car-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-car-wip", "message", 400, 0, {
        "messageText": "🚘 У вас нет машины. Купите в магазине!",
        "keyboardType": "inline",
        "buttons": [btn("btn-car-shop", "🛒 Магазин", target="msg-shop")],
    }))

    # === 🏠 Дом ===
    nodes.append(node("trig-house", "text_trigger", 100, 200, {
        "textMatchType": "exact",
        "textSynonyms": ["🏠 Дом"],
        "autoTransitionTo": "msg-house-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-house-wip", "message", 400, 200, {
        "messageText": "🏠 У вас нет дома. Купите в магазине!",
        "keyboardType": "inline",
        "buttons": [btn("btn-house-shop", "🛒 Магазин", target="msg-shop")],
    }))

    # === 🪫 Майнинг ферма ===
    nodes.append(node("trig-mining", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["🪫 Майнинг ферма"],
        "autoTransitionTo": "msg-mining-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-mining-wip", "message", 400, 400, {
        "messageText": "🪫 Майнинг ферма — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🛒 Магазин ===
    nodes.append(node("trig-shop", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["🛒 Магазин"],
        "autoTransitionTo": "tbl-read-user-shop",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-shop", "bot_table", 400, 600, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-shop",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-shop", "message", 700, 600, {
        "messageText": (
            "🛒 {user.nickname}, разделы магазина:\n"
            "⠀⠀- 🚘 Машины\n"
            "⠀⠀- 🏡 Дома\n"
            "⠀⠀- 💼 Бизнесы"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-shop-cars", "🚘 Машины", target="msg-shop-cars-wip"),
            btn("btn-shop-houses", "🏡 Дома", target="msg-shop-houses-wip"),
            btn("btn-shop-biz", "💼 Бизнесы", target="msg-shop-biz-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-shop-cars", "btn-shop-houses"]},
                {"buttonIds": ["btn-shop-biz"]},
            ],
        },
    }))
    for wip_id, wip_text in [
        ("msg-shop-cars-wip", "🚘 Машины — каталог в разработке."),
        ("msg-shop-houses-wip", "🏡 Дома — каталог в разработке."),
        ("msg-shop-biz-wip", "💼 Бизнесы — каталог в разработке."),
    ]:
        nodes.append(node(wip_id, "message", 1000, 600, {
            "messageText": wip_text,
            "keyboardType": "none",
            "buttons": [],
        }))

    return {
        "id": "sheet-property",
        "name": "🌇 Имущество",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 5: 🛡 Клан (sheet-clan)
# ============================================================

def build_clan() -> dict:
    """
    Строит лист «🛡 Клан» с гаванью (заглушка).
    Таблицы инициализируются в цепочке /start на листе Старт/Меню.
    @returns словарь листа
    """
    nodes = []

    # Гавань (заглушка)
    nodes.append(node("trig-harbor-info", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["⚓️ Гавань"],
        "autoTransitionTo": "msg-harbor-info",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-harbor-info", "message", 400, 0, {
        "messageText": "⚓️ Гавань — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-clan",
        "name": "🛡 Клан",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


# ============================================================
# Лист 6: 📖 Справка (sheet-help)
# ============================================================

def build_help() -> dict:
    """
    Строит лист «📖 Справка» с /help, разделами команд (edit_message) и /faq.
    Разделы (⭐️💸🎮🌆☁️) обновляют текст и кнопки того же сообщения
    через edit_message ноды вместо отдельных message-нод.
    @returns словарь листа
    """
    nodes = []

    # === /help ===
    nodes.append(node("cmd-help", "command_trigger", 100, 0, {
        "command": "/help",
        "description": "Справка по командам",
        "showInMenu": True,
        "autoTransitionTo": "tbl-read-user-help2",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-help2", "bot_table", 400, 0, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-help",
        "enableAutoTransition": True,
    }))

    # --- Первое сообщение с inline-кнопками (target → edit_message ноды) ---
    nodes.append(node("msg-help", "message", 700, 0, {
        "messageText": (
            "📚 {user.nickname}, выберите раздел с командами:\n"
            "⠀- ⭐️ <b>Основное</b>\n"
            "⠀- 💸 <b>Заработок</b>\n"
            "⠀- 🎮 <b>Игры</b>\n"
            "⠀- 🌆 <b>Имущество</b>\n"
            "⠀- ☁️ <b>Прочее</b>\n\n"
            "<a href=\"https://t.me/botname?startgroup=new\"><b>✅ Добавить бота в чат</b></a>"
        ),
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-help-basic", "⭐️", target="edit-help-basic"),
            btn("btn-help-earn", "💸", target="edit-help-earning"),
            btn("btn-help-games", "🎮", target="edit-help-games"),
            btn("btn-help-prop", "🌆", target="edit-help-property"),
            btn("btn-help-other", "☁️", target="edit-help-other"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-help-basic", "btn-help-earn", "btn-help-games"]},
                {"buttonIds": ["btn-help-prop", "btn-help-other"]},
            ],
        },
    }))

    # --- Keyboard-нода с навигационными кнопками (переиспользуется edit_message нодами) ---
    nodes.append(node("kbd-help-nav", "keyboard", 1000, -200, {
        "keyboardType": "inline",
        "buttons": [
            btn("btn-nav-star", "⭐️", target="edit-help-basic"),
            btn("btn-nav-earn", "💸", target="edit-help-earning"),
            btn("btn-nav-game", "🎮", target="edit-help-games"),
            btn("btn-nav-prop", "🌆", target="edit-help-property"),
            btn("btn-nav-misc", "☁️", target="edit-help-other"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-nav-star", "btn-nav-earn", "btn-nav-game"]},
                {"buttonIds": ["btn-nav-prop", "btn-nav-misc"]},
            ],
        },
    }))

    # === edit_message: ⭐️ Основное ===
    nodes.append(node("edit-help-basic", "edit_message", 1000, 0, {
        "editMode": "both",
        "editMessageText": (
            "⭐️ {user.nickname}, список команд из раздела \"<b>Основное</b>\":\n"
            "⠀- 👤 <b>Профиль</b> - <code>ваш профиль</code>\n"
            "⠀- 🛡 <b>Клан</b> - <code>ваш клан</code>\n"
            "⠀- 👥 <b>Рефералы</b> - <code>деньги за друзей</code>\n"
            "⠀- 💸 <b>Передать</b> - <code>перевод денег</code>\n"
            "⠀- 🎁 <b>Бонус</b> - <code>ежедневный подарок</code>\n"
            "⠀- 🔮 <b>Артефакты</b> - <code>ваши артефакты</code>\n"
            "⠀- 💭 <b>Чат</b> - <code>деньги за чат</code>\n\n"
            "⠀- 🛡 <b>Клан вступить</b> <code>[ид клана]</code>\n"
            "⠀- 🏅 <b>Достижения</b>\n"
            "⠀- 🍩 <b>Донат</b>\n"
            "⠀- 📜 <b>Правила</b>"
        ),
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "keep",
        "editKeyboardNodeId": "",
        "autoTransitionTo": "",
        "enableAutoTransition": False,
    }))

    # === edit_message: 💸 Заработок ===
    nodes.append(node("edit-help-earning", "edit_message", 1000, 200, {
        "editMode": "both",
        "editMessageText": (
            "💸 {user.nickname}, список команд из раздела \"<b>Заработок</b>\":\n"
            "⠀- 🛠 <b>Работать</b> - <code>начать работу</code>\n"
            "⠀- 👔 <b>Работы</b> - <code>список работ</code>\n"
            "⠀- 🌋 <b>Шахта</b> - <code>сходить в шахту</code>\n"
            "⠀- 🎣 <b>Рыбалка</b> - <code>порыбачить</code>\n"
            "⠀- 📦 <b>Ящики</b> - <code>открыть ящик</code>\n"
            "⠀- 🪫 <b>Майнинг</b> - <code>майнинг-ферма</code>\n"
            "⠀- 🏞 <b>Ранчо</b> - <code>выращивать урожай</code>\n"
            "⠀- 💹 <b>Бизнес</b> - <code>меню бизнеса</code>\n"
            "⠀- 🏦 <b>Вклады</b> - <code>открыть вклад</code>"
        ),
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "keep",
        "editKeyboardNodeId": "",
        "autoTransitionTo": "",
        "enableAutoTransition": False,
    }))

    # === edit_message: 🎮 Игры ===
    nodes.append(node("edit-help-games", "edit_message", 1000, 400, {
        "editMode": "both",
        "editMessageText": (
            "🎮 {user.nickname}, список команд из раздела \"<b>Игры</b>\":\n"
            "⠀- 🎰 <b>Слоты</b>\n"
            "⠀- 💣 <b>Мины</b>\n"
            "⠀- 🪙 <b>Монетка</b>\n"
            "⠀- 🏁 <b>Гонки</b>\n"
            "⠀- 🎡 <b>Рулетка</b>\n"
            "⠀- ✂ <b>КНБ</b>\n"
            "⠀- 🔫 <b>Дуэль</b>\n"
            "⠀- 🎲 <b>Кости</b>\n"
            "⠀- 🕵️ <b>Прятки</b>\n"
            "⠀- 🏀 <b>Баскетбол</b>\n"
            "⠀- ⚽ <b>Пенальти</b>\n"
            "⠀- 🎯 <b>Дартс</b>\n"
            "⠀- 🚀 <b>Краш</b>\n"
            "⠀- ♠️ <b>Блекджек</b>\n"
            "⠀- 🗼 <b>Башня</b>\n"
            "⠀- 🔑 <b>Сейф</b> <code>[10-99]</code>"
        ),
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "keep",
        "editKeyboardNodeId": "",
        "autoTransitionTo": "",
        "enableAutoTransition": False,
    }))

    # === edit_message: 🌆 Имущество ===
    nodes.append(node("edit-help-property", "edit_message", 1000, 600, {
        "editMode": "both",
        "editMessageText": (
            "🌆 {user.nickname}, список команд из раздела \"<b>Имущество</b>\":\n"
            "⠀- 🚘 <b>Машина</b>\n"
            "⠀- 🏠 <b>Дом</b>\n"
            "⠀- 💹 <b>Бизнес</b>\n"
            "⠀- 🪫 <b>Ферма</b>"
        ),
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "keep",
        "editKeyboardNodeId": "",
        "autoTransitionTo": "",
        "enableAutoTransition": False,
    }))

    # === edit_message: ☁️ Прочее ===
    nodes.append(node("edit-help-other", "edit_message", 1000, 800, {
        "editMode": "both",
        "editMessageText": (
            "☁️ {user.nickname}, список команд из раздела \"<b>Прочее</b>\":\n"
            "⠀- 🏆 <b>Топ</b> - <code>богатые игроки</code>\n"
            "⠀- ✏️ <b>Ник</b> - <code>изменить имя</code>\n"
            "⠀- 💰 <b>Баланс</b> - <code>ваш баланс</code>\n\n"
            "⠀- ⚡️ <b>Бусты</b>\n"
            "⠀- 🛒 <b>Магазин</b>\n"
            "⠀- 🎁 <b>Промокод</b>\n"
            "⠀- 🌀 <b>Упоминания</b> <code>[вкл/выкл]</code>"
        ),
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "keep",
        "editKeyboardNodeId": "",
        "autoTransitionTo": "",
        "enableAutoTransition": False,
    }))

    # === /faq ===
    nodes.append(node("cmd-faq", "command_trigger", 100, 1000, {
        "command": "/faq",
        "description": "Справочник",
        "showInMenu": True,
        "autoTransitionTo": "tbl-read-user-faq",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-faq", "bot_table", 400, 1000, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-faq",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-faq", "message", 700, 1000, {
        "messageText": (
            "📒 {user.nickname}, меню справочника:\n\n"
            "Здесь вы найдёте ответы на все вопросы об игровых системах.\n"
            "🔓 Некоторые разделы становятся доступны только после достижения определённого уровня.\n\n"
            "🔽 Выбери интересующий раздел с помощью кнопок ниже:"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-faq-vip", "💎 VIP", target="msg-faq-vip-wip"),
            btn("btn-faq-harbor", "⚓ Гавань", target="msg-faq-harbor-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 2,
            "rows": [
                {"buttonIds": ["btn-faq-vip", "btn-faq-harbor"]},
            ],
        },
    }))
    nodes.append(node("msg-faq-vip-wip", "message", 1000, 1000, {
        "messageText": "💎 VIP — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-faq-harbor-wip", "message", 1000, 1100, {
        "messageText": "⚓ Гавань — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-help",
        "name": "📖 Справка",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 7: 👤 Основное (sheet-basic)
# ============================================================

def build_basic() -> dict:
    """
    Строит лист «👤 Основное» с рефералами, бонусом, правилами
    и прочими extra-командами.
    @returns словарь листа
    """
    nodes = []

    # === 👥 Рефералы ===
    nodes.append(node("trig-referals", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["👥 Рефералы"],
        "autoTransitionTo": "tbl-read-user-referals",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-referals", "bot_table", 400, 0, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-referals",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-referals", "message", 700, 0, {
        "messageText": (
            "🫶 {user.nickname}, зарабатывай, приглашая друзей:\n\n"
            "💰 Баланс: 0$\n"
            "💸 Всего заработано: 0$\n"
            "🧲 Приглашено друзей: 0\n\n"
            "🔗 Твоя реферальная ссылка:\n"
            "⠀- https://t.me/botname?start=rl{user.game_id}\n\n"
            "🎁 Что ты получаешь:\n"
            "• 🤑 7,500$ — за регистрацию друга\n"
            "• 🌟 45,000$ — за каждый уровень друга\n"
            "• 🏖 1% — с каждой зарплаты друга\n"
            "• 💎 5% — с каждого доната друга"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-ref2-share", "↪️ Поделиться", action="url",
                url="https://t.me/share/url?url=https://t.me/botname?start=rl{user.game_id}"),
            btn("btn-ref2-withdraw", "💸 Снять баланс", target="msg-ref2-withdraw-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-ref2-share"]},
                {"buttonIds": ["btn-ref2-withdraw"]},
            ],
        },
    }))
    nodes.append(node("msg-ref2-withdraw-wip", "message", 1000, 0, {
        "messageText": "💸 Снятие баланса — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🎁 Бонус ===
    nodes.append(node("trig-bonus", "text_trigger", 100, 200, {
        "textMatchType": "exact",
        "textSynonyms": ["🎁 Бонус"],
        "autoTransitionTo": "tbl-read-user-bonus",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-bonus", "bot_table", 400, 200, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-bonus",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-bonus", "message", 700, 200, {
        "messageText": "😓 {user.nickname}, необходимо подписаться на наш канал, чтобы получать ежедневный бонус:",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-bonus-sub", "✅ Подписаться", action="url", url="https://t.me/qalais_news"),
            btn("btn-bonus-check", "🔄 Проверить", target="msg-bonus-check-wip"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 1,
            "rows": [
                {"buttonIds": ["btn-bonus-sub"]},
                {"buttonIds": ["btn-bonus-check"]},
            ],
        },
    }))
    nodes.append(node("msg-bonus-check-wip", "message", 1000, 200, {
        "messageText": "🔄 Проверка подписки — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 📜 Правила ===
    nodes.append(node("trig-rules", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["📜 Правила"],
        "autoTransitionTo": "msg-rules-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-rules-wip", "message", 400, 400, {
        "messageText": "📜 Правила — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 💸 Передать ===
    nodes.append(node("trig-transfer", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["💸 Передать"],
        "autoTransitionTo": "msg-transfer-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-transfer-wip", "message", 400, 600, {
        "messageText": "💸 Передача денег — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🔮 Артефакты ===
    nodes.append(node("trig-artifacts", "text_trigger", 100, 800, {
        "textMatchType": "exact",
        "textSynonyms": ["🔮 Артефакты"],
        "autoTransitionTo": "msg-artifacts-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-artifacts-wip", "message", 400, 800, {
        "messageText": "🔮 Артефакты — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 💭 Чат ===
    nodes.append(node("trig-chat", "text_trigger", 100, 1000, {
        "textMatchType": "exact",
        "textSynonyms": ["💭 Чат"],
        "autoTransitionTo": "msg-chat-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-chat-wip", "message", 400, 1000, {
        "messageText": "💭 Чат — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🏆 Топ ===
    nodes.append(node("trig-top", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["🏆 Топ"],
        "autoTransitionTo": "msg-top-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-top-wip", "message", 400, 1200, {
        "messageText": "🏆 Топ — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === ✏️ Ник ===
    nodes.append(node("trig-nick", "text_trigger", 100, 1400, {
        "textMatchType": "exact",
        "textSynonyms": ["✏️ Ник"],
        "autoTransitionTo": "msg-nick-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-nick-wip", "message", 400, 1400, {
        "messageText": "✏️ Ник — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🎁 Промокод ===
    nodes.append(node("trig-promo", "text_trigger", 100, 1600, {
        "textMatchType": "exact",
        "textSynonyms": ["🎁 Промокод"],
        "autoTransitionTo": "msg-promo-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-promo-wip", "message", 400, 1600, {
        "messageText": "🎁 Промокод — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-basic",
        "name": "👤 Основное",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 8: ⏰ Уведомления (sheet-notifications)
# ============================================================

def build_notifications() -> dict:
    """
    Строит лист «⏰ Уведомления».
    Содержит schedule_trigger (1 мин) → чтение истёкших кулдаунов →
    цикл → проверка → отправка уведомления → пометка notified=true.
    @returns словарь листа
    """
    nodes = []

    # Триггер по расписанию: каждую минуту
    nodes.append(node("sched-cd-check", "schedule_trigger", 100, 0, {
        "rules": [{"mode": "interval", "intervalMinutes": 1}],
        "timezone": "Europe/Moscow",
        "autoTransitionTo": "tbl-read-expired-cds",
        "enabled": True,
        "runOnStart": False,
        "maxConcurrent": 1,
    }))

    # Читаем кулдауны, которые ещё не уведомлены
    nodes.append(node("tbl-read-expired-cds", "bot_table", 400, 0, {
        "tableName": "cooldowns",
        "operation": "read",
        "where": [
            {"column": "action_type", "operator": "equals", "value": "work"},
            {"column": "notified", "operator": "not_equals", "value": "true"},
        ],
        "saveResultTo": "expired_cds",
        "resultFormat": "all_rows",
        "autoTransitionTo": "loop-notify",
        "enableAutoTransition": True,
    }))

    # Цикл по результатам
    nodes.append(node("loop-notify", "loop", 700, 0, {
        "sourceVariable": "expired_cds",
        "itemVariable": "cd_item",
        "indexVariable": "cd_index",
        "parallel": False,
        "delaySeconds": 0,
        "maxIterations": 100,
        "autoTransitionTo": "cond-cd-expired",
        "afterLoopTo": "",
        "enableAutoTransition": True,
    }))

    # Проверяем что expires_at < __now (кулдаун истёк)
    nodes.append(node("cond-cd-expired", "condition", 1000, 0, {
        "variable": "cd_item.expires_at",
        "branches": [
            branch("br-expired", "Кулдаун истёк", "less_than", "{__now}", "msg-cd-notify"),
            branch("br-not-expired", "Ещё активен", "else", "", ""),
        ],
    }))

    # Отправляем уведомление пользователю
    nodes.append(node("msg-cd-notify", "message", 1300, 0, {
        "messageText": "🔔 {cd_item.user_id}, вы можете начать новую рабочую смену.",
        "targetChatIdSource": "variable",
        "targetChatVariableName": "cd_item.user_id",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-work-again", "🏖 Работать", target="trig-work"),
        ],
        "autoTransitionTo": "tbl-mark-notified",
        "enableAutoTransition": True,
    }))

    # Помечаем кулдаун как уведомлённый
    nodes.append(node("tbl-mark-notified", "bot_table", 1600, 0, {
        "tableName": "cooldowns",
        "operation": "update",
        "where": [
            {"column": "user_id", "operator": "equals", "value": "{cd_item.user_id}"},
            {"column": "action_type", "operator": "equals", "value": "work"},
        ],
        "updates": [
            {"column": "notified", "op": "set", "value": "true"},
        ],
    }))

    return {
        "id": "sheet-notifications",
        "name": "⏰ Уведомления",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Сборка и запись project.json
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
            build_earning(),
            build_games(),
            build_property(),
            build_clan(),
            build_help(),
            build_basic(),
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
