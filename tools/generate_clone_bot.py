"""
@fileoverview Генератор project.json для полного клона RPG-бота.
Создаёт все листы, узлы, кнопки и связи для игрового бота с системой
заработка, кланов, бизнесов, профиля и справки.
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
# Лист 1: ⭐ Старт / Меню (sheet-start-menu)
# ============================================================

def build_start_menu() -> dict:
    """
    Строит лист «⭐ Старт / Меню».
    Содержит /start, upsert пользователя, главное меню и все text_trigger кнопок.
    @returns словарь листа
    """
    nodes = []

    # /start → upsert user → приветствие
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
            "game_id": "",
            "registered_at": "{__now}",
        },
        "onConflict": "ignore",
        "saveResultTo": "user",
        "autoTransitionTo": "msg-welcome",
        "enableAutoTransition": True,
    }))

    nodes.append(node("msg-welcome", "message", 700, 0, {
        "messageText": (
            "👋 Добро пожаловать в игру, {nickname}!\n\n"
            "🎮 Используй меню для навигации."
        ),
        "keyboardType": "reply",
        "buttons": [
            btn("btn-m-earn", "💸 Заработок"),
            btn("btn-m-games", "🎮 Игры"),
            btn("btn-m-prop", "🌇 Имущество"),
            btn("btn-m-prof", "👤 Профиль"),
            btn("btn-m-clan", "🛡 Клан"),
            btn("btn-m-ach", "🏅 Ачивки"),
            btn("btn-m-cmd", "📚 Команды"),
            btn("btn-m-don", "🍩 Донат"),
            btn("btn-m-ref", "🤑 Реферальная система"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-m-earn", "btn-m-games", "btn-m-prop"]},
                {"buttonIds": ["btn-m-prof", "btn-m-clan", "btn-m-ach"]},
                {"buttonIds": ["btn-m-cmd", "btn-m-don"]},
                {"buttonIds": ["btn-m-ref"]},
            ],
        },
        "resizeKeyboard": True,
    }))

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
            btn("btn-e-work", "⚒ Работа"),
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
            btn("btn-p-house", "🏠 Дом"),
            btn("btn-p-car", "🚗 Транспорт"),
            btn("btn-p-pet", "🐕 Питомцы"),
            btn("btn-p-cloth", "👕 Одежда"),
            btn("btn-p-phone", "📱 Телефон"),
            btn("btn-p-acc", "💍 Аксессуары"),
            btn("btn-p-back", "⬅️ Меню"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-p-house", "btn-p-car", "btn-p-pet"]},
                {"buttonIds": ["btn-p-cloth", "btn-p-phone", "btn-p-acc"]},
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
            "🎭 Клан: {user.clan_id}\n"
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
            branch("br-no-clan", "Нет клана", "is_empty", "", "msg-no-clan"),
            branch("br-has-clan", "Есть клан", "else", "", "tbl-read-clan"),
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
    nodes.append(node("tbl-read-clan", "bot_table", 1000, 1050, {
        "tableName": "clans",
        "operation": "read",
        "where": [{"column": "id", "operator": "equals", "value": "{user.clan_id}"}],
        "saveResultTo": "clan",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-clan-info",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-clan-info", "message", 1300, 1050, {
        "messageText": (
            "❓ {user.nickname}, ваш клан:\n\n"
            "🎭 Название: {clan.name} (ID: {clan.id})\n"
            "⭐ Уровень: {clan.level} ({clan.exp}/{clan.exp_to_next})\n"
            "💲 Казна: {clan.treasury}$\n"
            "🏆 Рейтинг: {clan.rating}\n"
            "👥 Участники: {clan.members_count}/{clan.max_members}\n\n"
            "🔓 Вход: {clan.entry_type}\n"
            "👑 Лидер клана: {clan.leader_name}"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-cl-season", "🏆 Сезон", target="msg-clan-season-wip"),
            btn("btn-cl-members", "👥 Участники", target="msg-clan-members-wip"),
            btn("btn-cl-harbor", "⚓ Гавань", target="msg-clan-harbor"),
            btn("btn-cl-bonus", "⭐ Бонусы", target="msg-clan-bonus-wip"),
            btn("btn-cl-mprof", "👤 Профиль участника", target="msg-clan-mprof-wip"),
            btn("btn-cl-leave", "📕 Покинуть клан", target="msg-clan-leave-wip"),
        ],
        "keyboardColumns": 2,
    }))

    # --- text_trigger "🏅 Ачивки" ---
    nodes.append(node("trig-achiev", "text_trigger", 100, 1300, {
        "textMatchType": "exact",
        "textSynonyms": ["🏅 Ачивки"],
        "autoTransitionTo": "msg-achiev-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-achiev-wip", "message", 400, 1300, {
        "messageText": "🏅 Раздел «Ачивки» находится в разработке. Следите за обновлениями!",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "📚 Команды" → /help ---
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
        "autoTransitionTo": "msg-donate-wip",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-donate-wip", "message", 400, 1700, {
        "messageText": "🍩 Раздел «Донат» находится в разработке. Следите за обновлениями!",
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
        "autoTransitionTo": "msg-referral-info",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-referral-info", "message", 700, 1900, {
        "messageText": (
            "🤑 {user.nickname}, реферальная система:\n\n"
            "Приглашайте друзей и получайте бонусы!\n\n"
            "🔗 Ваша реферальная ссылка: t.me/botname?start=ref_{user_id}\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "⬅️ Меню" → возврат ---
    nodes.append(node("trig-back-menu", "text_trigger", 100, 2100, {
        "textMatchType": "exact",
        "textSynonyms": ["⬅️ Меню"],
        "autoTransitionTo": "msg-main-menu",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-main-menu", "message", 400, 2100, {
        "messageText": "⬅️ Главное меню:",
        "keyboardType": "reply",
        "buttons": [
            btn("btn-mm-earn", "💸 Заработок"),
            btn("btn-mm-games", "🎮 Игры"),
            btn("btn-mm-prop", "🌇 Имущество"),
            btn("btn-mm-prof", "👤 Профиль"),
            btn("btn-mm-clan", "🛡 Клан"),
            btn("btn-mm-ach", "🏅 Ачивки"),
            btn("btn-mm-cmd", "📚 Команды"),
            btn("btn-mm-don", "🍩 Донат"),
            btn("btn-mm-ref", "🤑 Реферальная система"),
        ],
        "keyboardLayout": {
            "autoLayout": False,
            "columns": 3,
            "rows": [
                {"buttonIds": ["btn-mm-earn", "btn-mm-games", "btn-mm-prop"]},
                {"buttonIds": ["btn-mm-prof", "btn-mm-clan", "btn-mm-ach"]},
                {"buttonIds": ["btn-mm-cmd", "btn-mm-don"]},
                {"buttonIds": ["btn-mm-ref"]},
            ],
        },
        "resizeKeyboard": True,
    }))

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
    Строит лист «💸 Заработок» с работой (мини-игра 3 раунда),
    шахтой, рыбалкой, ранчо, ящиками и бизнесом.
    @returns словарь листа
    """
    nodes = []

    # === ⚒ Работа ===
    nodes.append(node("trig-work", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["⚒ Работа"],
        "autoTransitionTo": "tbl-read-cd-work",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-cd-work", "bot_table", 400, 0, {
        "tableName": "cooldowns",
        "operation": "read",
        "where": [
            {"column": "user_id", "operator": "equals", "value": "{user_id}"},
            {"column": "action_type", "operator": "equals", "value": "work"},
        ],
        "saveResultTo": "cd",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-work-cd",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-work-cd", "condition", 700, 0, {
        "variable": "cd.expires_at",
        "branches": [
            branch("br-cd-active", "Кулдаун активен", "greater_than", "{__now}", "msg-work-cd"),
            branch("br-cd-off", "Можно работать", "else", "", "msg-work-r1"),
        ],
    }))
    nodes.append(node("msg-work-cd", "message", 1000, 100, {
        "messageText": (
            "😨 {nickname}, следующая смена через: ...\n\n"
            "⏳ Дождитесь окончания кулдауна."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Раунд 1
    nodes.append(node("msg-work-r1", "message", 1000, -100, {
        "messageText": "🏖 {nickname}, рабочая смена началась!\n\n❓ Нажмите на смайлик «⚒»:",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-r1-1", "🎯", target="msg-work-fail"),
            btn("btn-r1-2", "🌟", target="msg-work-fail"),
            btn("btn-r1-3", "⚒", target="msg-work-r2"),
            btn("btn-r1-4", "🎪", target="msg-work-fail"),
            btn("btn-r1-5", "🏀", target="msg-work-fail"),
            btn("btn-r1-6", "⚽", target="msg-work-fail"),
            btn("btn-r1-7", "🎵", target="msg-work-fail"),
            btn("btn-r1-8", "🎸", target="msg-work-fail"),
            btn("btn-r1-9", "🎹", target="msg-work-fail"),
            btn("btn-r1-10", "🎺", target="msg-work-fail"),
            btn("btn-r1-11", "🎻", target="msg-work-fail"),
            btn("btn-r1-12", "🥁", target="msg-work-fail"),
            btn("btn-r1-13", "🎤", target="msg-work-fail"),
            btn("btn-r1-14", "🎧", target="msg-work-fail"),
            btn("btn-r1-15", "🎬", target="msg-work-fail"),
            btn("btn-r1-16", "📷", target="msg-work-fail"),
        ],
        "keyboardColumns": 4,
    }))

    # Раунд 2
    nodes.append(node("msg-work-r2", "message", 1300, -100, {
        "messageText": "✅ Верно! Раунд 2/3\n\n❓ {nickname}, нажмите на «💡»:",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-r2-1", "🌙", target="msg-work-fail"),
            btn("btn-r2-2", "☀️", target="msg-work-fail"),
            btn("btn-r2-3", "🌈", target="msg-work-fail"),
            btn("btn-r2-4", "💡", target="msg-work-r3"),
            btn("btn-r2-5", "💫", target="msg-work-fail"),
            btn("btn-r2-6", "✨", target="msg-work-fail"),
            btn("btn-r2-7", "🌟", target="msg-work-fail"),
            btn("btn-r2-8", "🔥", target="msg-work-fail"),
            btn("btn-r2-9", "❄️", target="msg-work-fail"),
            btn("btn-r2-10", "🌊", target="msg-work-fail"),
            btn("btn-r2-11", "🍀", target="msg-work-fail"),
            btn("btn-r2-12", "🌸", target="msg-work-fail"),
            btn("btn-r2-13", "🌺", target="msg-work-fail"),
            btn("btn-r2-14", "🌻", target="msg-work-fail"),
            btn("btn-r2-15", "🌼", target="msg-work-fail"),
            btn("btn-r2-16", "🌷", target="msg-work-fail"),
        ],
        "keyboardColumns": 4,
    }))

    # Раунд 3
    nodes.append(node("msg-work-r3", "message", 1600, -100, {
        "messageText": "✅ Верно! Раунд 3/3\n\n❓ {nickname}, нажмите на «🎯»:",
        "keyboardType": "inline",
        "buttons": [
            btn("btn-r3-1", "🏆", target="msg-work-fail"),
            btn("btn-r3-2", "🥇", target="msg-work-fail"),
            btn("btn-r3-3", "🥈", target="msg-work-fail"),
            btn("btn-r3-4", "🥉", target="msg-work-fail"),
            btn("btn-r3-5", "🎯", target="set-work-reward"),
            btn("btn-r3-6", "🎳", target="msg-work-fail"),
            btn("btn-r3-7", "🏓", target="msg-work-fail"),
            btn("btn-r3-8", "🏸", target="msg-work-fail"),
            btn("btn-r3-9", "🥊", target="msg-work-fail"),
            btn("btn-r3-10", "🥋", target="msg-work-fail"),
            btn("btn-r3-11", "⛳", target="msg-work-fail"),
            btn("btn-r3-12", "🎿", target="msg-work-fail"),
            btn("btn-r3-13", "🛷", target="msg-work-fail"),
            btn("btn-r3-14", "🥌", target="msg-work-fail"),
            btn("btn-r3-15", "🤺", target="msg-work-fail"),
            btn("btn-r3-16", "🏇", target="msg-work-fail"),
        ],
        "keyboardColumns": 4,
    }))

    # Награда
    nodes.append(node("set-work-reward", "set_variable", 1900, -100, {
        "assignments": [
            {"id": "a-salary", "variable": "salary", "value": "700", "mode": "text"},
            {"id": "a-exp", "variable": "exp_gained", "value": "12", "mode": "text"},
        ],
        "autoTransitionTo": "tbl-work-update",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-work-update", "bot_table", 2200, -100, {
        "tableName": "users",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "balance", "op": "increment", "value": "{salary}"},
            {"column": "exp", "op": "increment", "value": "{exp_gained}"},
        ],
        "autoTransitionTo": "tbl-work-upsert-cd",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-work-upsert-cd", "bot_table", 2500, -100, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "{user_id}",
            "action_type": "work",
            "expires_at": "{__now_plus_5400}",
        },
        "onConflict": "update",
        "autoTransitionTo": "tbl-read-user-after-work",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-after-work", "bot_table", 2800, -100, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-work-success",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-work-success", "message", 3100, -100, {
        "messageText": (
            "🤩 {nickname}, смена завершена!\n\n"
            "💲 Зарплата: {salary}$\n"
            "⭐ Уровень: {user.level} ({user.exp}/{user.exp_to_next}) +{exp_gained} exp\n\n"
            "😨 Следующая смена через: 01:30"
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Неправильный ответ
    nodes.append(node("msg-work-fail", "message", 1300, 200, {
        "messageText": (
            "😢 {nickname}, к сожалению, вы нажали на неверный смайлик.\n"
            "Рабочая смена завершена\n"
            "😨 Начать новую смену можно через: 01:30"
        ),
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "tbl-work-upsert-cd-fail",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-work-upsert-cd-fail", "bot_table", 1600, 200, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "{user_id}",
            "action_type": "work",
            "expires_at": "{__now_plus_5400}",
        },
        "onConflict": "update",
    }))

    # === 🌋 Шахта ===
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
            "😢 {nickname}, 🌋 шахта станет доступна после достижения "
            "⭐3-го уровня. Уровень можно повысить выполняя разную активность."
        ),
        "keyboardType": "inline",
        "buttons": [btn("btn-how-lvl-m", "📖 Как повысить уровень?", target="msg-how-level")],
    }))
    nodes.append(node("msg-mine-wip", "message", 1000, 350, {
        "messageText": "🌋 Шахта — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🎣 Рыбалка ===
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
            "😓 {nickname}, 🎣 Рыбалка станет доступна после достижения "
            "⭐7-го уровня. Уровень можно повысить выполняя разную активность."
        ),
        "keyboardType": "inline",
        "buttons": [btn("btn-how-lvl-f", "📖 Как повысить уровень?", target="msg-how-level")],
    }))
    nodes.append(node("msg-fish-wip", "message", 1000, 550, {
        "messageText": "🎣 Рыбалка — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 🏞 Ранчо ===
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
            "😔 {nickname}, 🏞 ранчо станет доступно после достижения "
            "⭐15-го уровня. Уровень можно повысить выполняя разную активность."
        ),
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
        "autoTransitionTo": "msg-crates-empty",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-crates-empty", "message", 400, 1000, {
        "messageText": "😓 {nickname}, к сожалению, у вас еще нет ящиков. Их можно получить за разные активности.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === 💹 Бизнес ===
    nodes.append(node("trig-business", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["💹 Бизнес"],
        "autoTransitionTo": "tbl-read-user-biz",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-biz", "bot_table", 400, 1200, {
        "tableName": "user_businesses",
        "operation": "read",
        "where": [{"column": "user_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "biz",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-has-biz",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-has-biz", "condition", 700, 1200, {
        "variable": "biz.business_id",
        "branches": [
            branch("br-has-biz", "Есть бизнес", "is_not_empty", "", "msg-biz-info-wip"),
            branch("br-no-biz", "Нет бизнеса", "else", "", "msg-no-biz"),
        ],
    }))
    nodes.append(node("msg-no-biz", "message", 1000, 1300, {
        "messageText": "😢 {nickname}, У вас нет бизнеса.",
        "keyboardType": "inline",
        "buttons": [btn("btn-biz-cat", "🛍 Каталог бизнесов", target="msg-biz-catalog")],
    }))
    nodes.append(node("msg-biz-info-wip", "message", 1000, 1150, {
        "messageText": "💹 Информация о вашем бизнесе — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # === Как повысить уровень ===
    nodes.append(node("msg-how-level", "message", 1300, 600, {
        "messageText": (
            "📈 {nickname}, как повысить уровень?\n\n"
            "💡 Как работает система уровней?\n"
            " - Чтобы повысить уровень, вам нужно набрать очки опыта (EXP).\n"
            " - С каждым новым уровнем потребуется все больше EXP для перехода на следующий.\n\n"
            "🍥 Где получить EXP?\n"
            "1️⃣ Выполнение рабочих смен – работайте и зарабатывайте опыт.\n"
            "2️⃣ Открытие ящиков – в ящиках можно найти дополнительный опыт.\n"
            "3️⃣ Участие в специальных событиях – принимайте участие в мероприятиях и получайте щедрые награды.\n\n"
            "🔓 Что дает повышение уровня?\n"
            " - С каждым новым уровнем вы получаете доступ к новым работам, активностям и уникальным возможностям, которых нет на начальных этапах игры."
        ),
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
# Лист 3: 💹 Бизнес (sheet-business)
# ============================================================

def build_business() -> dict:
    """
    Строит лист «💹 Бизнес» с каталогом бизнесов и покупкой.
    @returns словарь листа
    """
    nodes = []

    # Каталог бизнесов (inline callback)
    nodes.append(node("msg-biz-catalog", "message", 100, 0, {
        "messageText": (
            "☕ {nickname}, информация о бизнесе:\n\n"
            "📈 Макс. прибыль: 500$/час\n"
            "⭐ Макс. уровень прокачки: 10\n\n"
            "💰 Стоимость: 5000$\n\n"
            "Используйте кнопки для навигации по каталогу."
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-biz-buy", "✅ Приобрести", target="tbl-check-balance-biz"),
            btn("btn-biz-prev", "<", target="msg-biz-catalog"),
            btn("btn-biz-page", "1/14", target="msg-biz-catalog"),
            btn("btn-biz-next", ">", target="msg-biz-catalog"),
        ],
        "keyboardColumns": 4,
    }))

    # Проверка баланса для покупки
    nodes.append(node("tbl-check-balance-biz", "bot_table", 400, 0, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-biz-afford",
        "enableAutoTransition": True,
    }))
    nodes.append(node("cond-biz-afford", "condition", 700, 0, {
        "variable": "user.balance",
        "branches": [
            branch("br-biz-can", "Хватает денег", "greater_than", "4999", "tbl-buy-biz"),
            branch("br-biz-cant", "Не хватает", "else", "", "msg-biz-no-money"),
        ],
    }))
    nodes.append(node("msg-biz-no-money", "answer_callback_query", 1000, 100, {
        "messageText": "😢 Вам не хватает денег на покупку бизнеса.",
        "showAlert": True,
    }))
    nodes.append(node("tbl-buy-biz", "bot_table", 1000, -100, {
        "tableName": "user_businesses",
        "operation": "insert",
        "row": {
            "user_id": "{user_id}",
            "business_id": "1",
            "business_name": "Кофейня",
            "level": "1",
            "profit_rate": "50",
            "purchased_at": "{__now}",
        },
        "autoTransitionTo": "tbl-biz-decrement",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-biz-decrement", "bot_table", 1300, -100, {
        "tableName": "users",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "balance", "op": "decrement", "value": "5000"},
        ],
        "autoTransitionTo": "msg-biz-bought",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-biz-bought", "message", 1600, -100, {
        "messageText": "🎉 {nickname}, бизнес «Кофейня» приобретён! Поздравляем!",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-business",
        "name": "💹 Бизнес",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


# ============================================================
# Лист 4: 🛡 Клан (sheet-clan)
# ============================================================

def build_clan() -> dict:
    """
    Строит лист «🛡 Клан» с информацией о клане, гаванью и заглушками.
    @returns словарь листа
    """
    nodes = []

    # Заглушки кнопок клана
    nodes.append(node("msg-clan-season-wip", "message", 100, 0, {
        "messageText": "🏆 Сезон клана — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-clan-members-wip", "message", 100, 200, {
        "messageText": "👥 Список участников — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-clan-bonus-wip", "message", 100, 400, {
        "messageText": "⭐ Бонусы клана — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-clan-mprof-wip", "message", 100, 600, {
        "messageText": "👤 Введите ID участника — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-clan-leave-wip", "message", 100, 800, {
        "messageText": "📕 Покинуть клан — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # Гавань клана
    nodes.append(node("msg-clan-harbor", "message", 400, 0, {
        "messageText": (
            "⚓ {nickname}, гавань клана:\n\n"
            "🔥 Уровень: {clan.harbor_level}\n"
            "🏖 Склад: {clan.harbor_storage} ед./{clan.harbor_max} ед.\n"
            "🚢 Добыча: {clan.harbor_rate} ед./мин\n\n"
            "⚙ Используйте кнопки ниже для управления гаванью!"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-h-upgrade", "🆙 Улучшение", target="msg-harbor-upgrade-wip"),
            btn("btn-h-invest", "🏆 Инвесторы", target="msg-harbor-invest-wip"),
            btn("btn-h-prod", "🚢 Добыча", target="msg-harbor-prod-wip"),
            btn("btn-h-storage", "🏖 Склад", target="msg-harbor-storage-wip"),
            btn("btn-h-raid", "🏴 Рейд", target="msg-harbor-raid-wip"),
            btn("btn-h-back", "⬅ Назад", target="msg-clan-info"),
        ],
        "keyboardColumns": 2,
    }))

    # Заглушки гавани
    nodes.append(node("msg-harbor-upgrade-wip", "message", 700, 0, {
        "messageText": "🆙 Улучшение гавани — раздел в разработке.",
        "keyboardType": "inline",
        "buttons": [btn("btn-hb1", "⬅ Назад", target="msg-clan-harbor")],
    }))
    nodes.append(node("msg-harbor-invest-wip", "message", 700, 200, {
        "messageText": "🏆 Инвесторы гавани — раздел в разработке.",
        "keyboardType": "inline",
        "buttons": [btn("btn-hb2", "⬅ Назад", target="msg-clan-harbor")],
    }))
    nodes.append(node("msg-harbor-prod-wip", "message", 700, 400, {
        "messageText": "🚢 Добыча гавани — раздел в разработке.",
        "keyboardType": "inline",
        "buttons": [btn("btn-hb3", "⬅ Назад", target="msg-clan-harbor")],
    }))
    nodes.append(node("msg-harbor-storage-wip", "message", 700, 600, {
        "messageText": "🏖 Склад гавани — раздел в разработке.",
        "keyboardType": "inline",
        "buttons": [btn("btn-hb4", "⬅ Назад", target="msg-clan-harbor")],
    }))
    nodes.append(node("msg-harbor-raid-wip", "message", 700, 800, {
        "messageText": "🏴 Рейд — раздел в разработке.",
        "keyboardType": "inline",
        "buttons": [btn("btn-hb5", "⬅ Назад", target="msg-clan-harbor")],
    }))

    return {
        "id": "sheet-clan",
        "name": "🛡 Клан",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 5: 📖 Справка (sheet-help)
# ============================================================

def build_help() -> dict:
    """
    Строит лист «📖 Справка» с /help, /faq и разделами команд.
    @returns словарь листа
    """
    nodes = []

    # Общие inline-кнопки навигации по разделам
    help_nav_buttons = [
        btn("btn-nav-star", "⭐️", target="msg-help-basic"),
        btn("btn-nav-earn", "💸", target="msg-help-earning"),
        btn("btn-nav-game", "🎮", target="msg-help-games"),
        btn("btn-nav-prop", "🌆", target="msg-help-property"),
        btn("btn-nav-misc", "☁️", target="msg-help-misc"),
    ]

    # Ручная раскладка для навигации help: 3 + 2
    help_nav_layout = {
        "autoLayout": False,
        "columns": 3,
        "rows": [
            {"buttonIds": ["btn-nav-star", "btn-nav-earn", "btn-nav-game"]},
            {"buttonIds": ["btn-nav-prop", "btn-nav-misc"]},
        ],
    }

    # /help
    nodes.append(node("cmd-help", "command_trigger", 100, 0, {
        "command": "/help",
        "description": "Список команд",
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
    nodes.append(node("msg-help", "message", 700, 0, {
        "messageText": (
            "📚 {user.nickname}, выберите раздел с командами:\n"
            "- ⭐️ Основное\n"
            "- 💸 Заработок\n"
            "- 🎮 Игры\n"
            "- 🌆 Имущество\n"
            "- ☁️ Прочее\n\n"
            "✅ Добавить бота в чат"
        ),
        "keyboardType": "inline",
        "buttons": help_nav_buttons[:],
        "keyboardLayout": help_nav_layout,
    }))

    # Раздел ⭐ Основное
    nodes.append(node("msg-help-basic", "message", 100, 300, {
        "messageText": (
            "⭐️ {nickname}, список команд из раздела \"Основное\":\n"
            "- 👤 Профиль - ваш профиль\n"
            "- 🛡 Клан - ваш клан\n"
            "- 👥 Рефералы - деньги за друзей\n"
            "- 💸 Передать - перевод денег\n"
            "- 🎁 Бонус - ежедневный подарок\n"
            "- 🔮 Артефакты - ваши артефакты\n"
            "- 🐧 Чат - деньги за чат\n\n"
            "- 🛡 Клан вступить [ид клана]\n"
            "- 🏅 Достижения\n"
            "- 🍩 Донат\n"
            "- 📕 Правила"
        ),
        "keyboardType": "inline",
        "buttons": help_nav_buttons[:],
        "keyboardLayout": help_nav_layout,
    }))

    # Раздел 💸 Заработок
    nodes.append(node("msg-help-earning", "message", 100, 500, {
        "messageText": (
            "💸 {nickname}, список команд из раздела \"Заработок\":\n"
            "- ⚒ Работа - заработать деньги\n"
            "- 🌋 Шахта - добыча ресурсов (с 3 ур.)\n"
            "- 🎣 Рыбалка - ловля рыбы (с 7 ур.)\n"
            "- 🏞 Ранчо - фермерство (с 15 ур.)\n"
            "- 📦 Ящики - открытие ящиков\n"
            "- 💹 Бизнес - пассивный доход"
        ),
        "keyboardType": "inline",
        "buttons": help_nav_buttons[:],
        "keyboardLayout": help_nav_layout,
    }))

    # Раздел 🎮 Игры
    nodes.append(node("msg-help-games", "message", 100, 700, {
        "messageText": (
            "🎮 {nickname}, список команд из раздела \"Игры\":\n"
            "- Раздел в разработке. Следите за обновлениями!"
        ),
        "keyboardType": "inline",
        "buttons": help_nav_buttons[:],
        "keyboardLayout": help_nav_layout,
    }))

    # Раздел 🌆 Имущество
    nodes.append(node("msg-help-property", "message", 100, 900, {
        "messageText": (
            "🌆 {nickname}, список команд из раздела \"Имущество\":\n"
            "- Раздел в разработке. Следите за обновлениями!"
        ),
        "keyboardType": "inline",
        "buttons": help_nav_buttons[:],
        "keyboardLayout": help_nav_layout,
    }))

    # Раздел ☁️ Прочее
    nodes.append(node("msg-help-misc", "message", 100, 1100, {
        "messageText": (
            "☁️ {nickname}, список команд из раздела \"Прочее\":\n"
            "- /faq - справочник\n"
            "- /help - список команд\n"
            "- 📕 Правила - правила бота"
        ),
        "keyboardType": "inline",
        "buttons": help_nav_buttons[:],
        "keyboardLayout": help_nav_layout,
    }))

    # /faq
    nodes.append(node("cmd-faq", "command_trigger", 400, 1300, {
        "command": "/faq",
        "description": "Справочник",
        "showInMenu": True,
        "autoTransitionTo": "msg-faq",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-faq", "message", 700, 1300, {
        "messageText": (
            "📒 {nickname}, меню справочника:\n\n"
            "Здесь вы найдёте ответы на все вопросы об игровых системах.\n"
            "🔒 Некоторые разделы становятся доступны только после достижения определённого уровня.\n\n"
            "🔽 Выбери интересующий раздел с помощью кнопок ниже:"
        ),
        "keyboardType": "inline",
        "buttons": [
            btn("btn-faq-vip", "💎 VIP", target="msg-faq-vip-wip"),
            btn("btn-faq-harbor", "⚓ Гавань", target="msg-faq-harbor-wip"),
        ],
        "keyboardColumns": 2,
    }))
    nodes.append(node("msg-faq-vip-wip", "message", 1000, 1300, {
        "messageText": "💎 VIP — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))
    nodes.append(node("msg-faq-harbor-wip", "message", 1000, 1500, {
        "messageText": "⚓ Гавань — раздел справочника в разработке.",
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
# Лист 6: 👤 Основное (sheet-basic-commands)
# ============================================================

def build_basic_commands() -> dict:
    """
    Строит лист «👤 Основное» с текстовыми командами:
    Рефералы, Передать, Бонус, Артефакты, Чат, Достижения, Правила.
    @returns словарь листа
    """
    nodes = []

    # Рефералы
    nodes.append(node("trig-referals", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["Рефералы", "👥 Рефералы"],
        "autoTransitionTo": "tbl-read-user-refs",
        "enableAutoTransition": True,
    }))
    nodes.append(node("tbl-read-user-refs", "bot_table", 400, 0, {
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
            "🤑 {user.nickname}, реферальная система:\n\n"
            "Приглашайте друзей и получайте бонусы!\n\n"
            "🔗 Ваша реферальная ссылка: t.me/botname?start=ref_{user_id}\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Передать
    nodes.append(node("trig-transfer", "text_trigger", 100, 200, {
        "textMatchType": "exact",
        "textSynonyms": ["Передать", "💸 Передать"],
        "autoTransitionTo": "msg-transfer",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-transfer", "message", 400, 200, {
        "messageText": (
            "💸 {nickname}, перевод денег:\n\n"
            "Ответьте на сообщение пользователя и напишите: Передать [сумма]\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Бонус
    nodes.append(node("trig-bonus", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["Бонус", "🎁 Бонус"],
        "autoTransitionTo": "msg-bonus",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-bonus", "message", 400, 400, {
        "messageText": (
            "🎁 {nickname}, ежедневный бонус:\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Артефакты
    nodes.append(node("trig-artifacts", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["Артефакты", "🔮 Артефакты"],
        "autoTransitionTo": "msg-artifacts",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-artifacts", "message", 400, 600, {
        "messageText": (
            "🔮 {nickname}, ваши артефакты:\n\n"
            "У вас пока нет артефактов.\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Чат
    nodes.append(node("trig-chat-earn", "text_trigger", 100, 800, {
        "textMatchType": "exact",
        "textSynonyms": ["Чат", "🐧 Чат"],
        "autoTransitionTo": "msg-chat-earn",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-chat-earn", "message", 400, 800, {
        "messageText": (
            "🐧 {nickname}, деньги за чат:\n\n"
            "Пишите в чат и получайте монеты за активность!\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Достижения
    nodes.append(node("trig-achieve", "text_trigger", 100, 1000, {
        "textMatchType": "exact",
        "textSynonyms": ["Достижения", "🏅 Достижения"],
        "autoTransitionTo": "msg-achieve",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-achieve", "message", 400, 1000, {
        "messageText": (
            "🏅 {nickname}, ваши достижения:\n\n"
            "У вас пока нет достижений.\n\n"
            "— Раздел в разработке."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    # Правила
    nodes.append(node("trig-rules", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["Правила", "📕 Правила"],
        "autoTransitionTo": "msg-rules",
        "enableAutoTransition": True,
    }))
    nodes.append(node("msg-rules", "message", 400, 1200, {
        "messageText": (
            "📕 Правила бота:\n\n"
            "1. Запрещено использование багов\n"
            "2. Запрещён мультиаккаунтинг\n"
            "3. Запрещена реклама\n"
            "4. Уважайте других игроков\n\n"
            "Нарушение правил ведёт к бану."
        ),
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-basic-commands",
        "name": "👤 Основное",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }



# ============================================================
# Лист 7: 🎮 Игры (sheet-games)
# ============================================================

def build_games() -> dict:
    """
    Строит лист «🎮 Игры» с заглушками для каждой мини-игры.
    @returns словарь листа
    """
    nodes = []

    games = [
        ("trig-slots", "🎰 Слоты", "msg-slots-wip", 0),
        ("trig-mines", "💣 Мины", "msg-mines-wip", 200),
        ("trig-safe", "🔑 Сейф", "msg-safe-wip", 400),
        ("trig-crash", "🚀 Краш", "msg-crash-wip", 600),
        ("trig-tower", "🗼 Башня", "msg-tower-wip", 800),
        ("trig-blackjack", "♠️ Блекджек", "msg-bj-wip", 1000),
        ("trig-basketball", "🏀 Баскетбол", "msg-basket-wip", 1200),
        ("trig-penalty", "⚽ Пенальти", "msg-penalty-wip", 1400),
        ("trig-darts", "🎯 Дартс", "msg-darts-wip", 1600),
    ]

    for trig_id, text, msg_id, y_pos in games:
        nodes.append(node(trig_id, "text_trigger", 100, y_pos, {
            "textMatchType": "exact",
            "textSynonyms": [text],
            "autoTransitionTo": msg_id,
            "enableAutoTransition": True,
        }))
        nodes.append(node(msg_id, "message", 400, y_pos, {
            "messageText": f"{text} — раздел в разработке. Следите за обновлениями!",
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
# Лист 8: 🌇 Имущество (sheet-property)
# ============================================================

def build_property() -> dict:
    """
    Строит лист «🌇 Имущество» с заглушками для каждого раздела.
    @returns словарь листа
    """
    nodes = []

    items = [
        ("trig-house", "🏠 Дом", "msg-house-wip", 0),
        ("trig-car", "🚗 Транспорт", "msg-car-wip", 200),
        ("trig-pets", "🐕 Питомцы", "msg-pets-wip", 400),
        ("trig-clothes", "👕 Одежда", "msg-clothes-wip", 600),
        ("trig-phone", "📱 Телефон", "msg-phone-wip", 800),
        ("trig-accessories", "💍 Аксессуары", "msg-acc-wip", 1000),
    ]

    for trig_id, text, msg_id, y_pos in items:
        nodes.append(node(trig_id, "text_trigger", 100, y_pos, {
            "textMatchType": "exact",
            "textSynonyms": [text],
            "autoTransitionTo": msg_id,
            "enableAutoTransition": True,
        }))
        nodes.append(node(msg_id, "message", 400, y_pos, {
            "messageText": f"{text} — раздел в разработке. Следите за обновлениями!",
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
# Главная функция: сборка и запись project.json
# ============================================================

def main():
    """
    Собирает все листы в единый project.json и записывает на диск.
    Выводит статистику по листам и узлам.
    """
    sheets = [
        build_start_menu(),
        build_earning(),
        build_business(),
        build_clan(),
        build_help(),
        build_basic_commands(),
        build_games(),
        build_property(),
    ]

    project = {
        "version": 2,
        "activeSheetId": "sheet-start-menu",
        "sheets": sheets,
    }

    # Путь для записи
    output_dir = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\клон")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "project.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Статистика
    total_nodes = 0
    print("=" * 50)
    print("📊 СТАТИСТИКА ГЕНЕРАЦИИ RPG-БОТА")
    print("=" * 50)
    for sheet in sheets:
        count = len(sheet["nodes"])
        total_nodes += count
        print(f"  📄 {sheet['name']}: {count} узлов")
    print("-" * 50)
    print(f"  📁 Всего листов: {len(sheets)}")
    print(f"  🔗 Всего узлов: {total_nodes}")
    print(f"  💾 Файл: {output_path}")
    print("=" * 50)
    print("✅ Генерация завершена успешно!")


if __name__ == "__main__":
    main()
