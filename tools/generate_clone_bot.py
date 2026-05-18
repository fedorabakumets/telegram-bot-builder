"""
@fileoverview Генератор project.json для клон-бота с системой заработка, кланов и бизнесов
@module tools/generate_clone_bot
"""

import json
from pathlib import Path


def make_button(btn_id: str, text: str, action: str, **kwargs) -> dict:
    """
    Создаёт объект кнопки для клавиатуры.
    @param btn_id - уникальный идентификатор кнопки
    @param text - текст кнопки
    @param action - действие: "goto", "url" и т.д.
    @param kwargs - дополнительные поля (target, url и т.д.)
    @returns словарь с данными кнопки
    """
    btn = {"id": btn_id, "text": text, "action": action}
    btn.update(kwargs)
    return btn


def make_node(node_id: str, node_type: str, x: int, y: int, data: dict) -> dict:
    """
    Создаёт узел сценария бота.
    @param node_id - уникальный идентификатор узла
    @param node_type - тип узла
    @param x - позиция по горизонтали
    @param y - позиция по вертикали
    @param data - данные узла
    @returns словарь с полным описанием узла
    """
    return {
        "id": node_id,
        "type": node_type,
        "position": {"x": x, "y": y},
        "data": data,
    }


def make_branch(branch_id: str, label: str, operator: str, value: str, target: str) -> dict:
    """
    Создаёт ветку условного узла.
    @param branch_id - уникальный идентификатор ветки
    @param label - метка ветки
    @param operator - оператор сравнения
    @param value - значение для сравнения
    @param target - ID узла-цели
    @returns словарь с данными ветки
    """
    return {
        "id": branch_id,
        "label": label,
        "operator": operator,
        "value": value,
        "target": target,
    }


def build_sheet_start_menu() -> dict:
    """
    Строит лист "⭐ Старт / Меню" с командой /start, регистрацией и главным меню.
    @returns словарь листа с узлами
    """
    nodes = []

    # --- /start → upsert профиля → приветствие ---
    nodes.append(make_node("cmd-start", "command_trigger", 100, 0, {
        "command": "/start",
        "description": "Запустить бота",
        "showInMenu": True,
        "autoTransitionTo": "tbl-upsert-user",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-upsert-user", "bot_table", 400, 0, {
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

    nodes.append(make_node("msg-welcome", "message", 700, 0, {
        "messageText": "👋 Добро пожаловать, {first_name}!\n\n🎮 Это игровой бот с системой заработка, кланов и бизнесов.\n💰 Ваш стартовый баланс: 1000$\n\nИспользуйте меню ниже для навигации:",
        "keyboardType": "reply",
        "buttons": [
            make_button("btn-earning", "🐾 Заработок", "goto", target=""),
            make_button("btn-games", "🎮 Игры", "goto", target=""),
            make_button("btn-property", "🏪 Имущество", "goto", target=""),
            make_button("btn-profile", "👤 Профиль", "goto", target=""),
            make_button("btn-clan", "🏆 Клан", "goto", target=""),
            make_button("btn-achievements", "🏅 Ачивки", "goto", target=""),
            make_button("btn-commands", "📦 Команды", "goto", target=""),
            make_button("btn-donate", "🍩 Донат", "goto", target=""),
            make_button("btn-referral", "🤑 Реферальная система", "goto", target=""),
        ],
        "keyboardColumns": 3,
        "resizeKeyboard": True,
    }))

    # --- text_trigger "🐾 Заработок" → переход на подменю ---
    nodes.append(make_node("trig-earning", "text_trigger", 100, 200, {
        "textMatchType": "exact",
        "textSynonyms": ["🐾 Заработок"],
        "autoTransitionTo": "tbl-read-user-earning",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-user-earning", "bot_table", 400, 200, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "user",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-earning-menu",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-earning-menu", "message", 700, 200, {
        "messageText": "🐾 {user.nickname}, меню заработка:",
        "keyboardType": "reply",
        "buttons": [
            make_button("btn-work", "⚒ Работа", "goto", target=""),
            make_button("btn-mine", "🥕 Шахта", "goto", target=""),
            make_button("btn-fishing", "🎣 Рыбалка", "goto", target=""),
            make_button("btn-ranch", "🏞 Ранчо", "goto", target=""),
            make_button("btn-crates", "📦 Ящики", "goto", target=""),
            make_button("btn-business", "💹 Бизнес", "goto", target=""),
            make_button("btn-back-menu", "🐾 Меню", "goto", target=""),
        ],
        "keyboardColumns": 3,
        "resizeKeyboard": True,
    }))

    # --- text_trigger "🎮 Игры" → в разработке ---
    nodes.append(make_node("trig-games", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["🎮 Игры"],
        "autoTransitionTo": "msg-games-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-games-wip", "message", 400, 400, {
        "messageText": "🎮 Раздел «Игры» находится в разработке. Следите за обновлениями!",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🏪 Имущество" → в разработке ---
    nodes.append(make_node("trig-property", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["🏪 Имущество"],
        "autoTransitionTo": "msg-property-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-property-wip", "message", 400, 600, {
        "messageText": "🏪 Раздел «Имущество» находится в разработке. Следите за обновлениями!",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "👤 Профиль" → чтение из users → вывод ---
    nodes.append(make_node("trig-profile", "text_trigger", 100, 800, {
        "textMatchType": "exact",
        "textSynonyms": ["👤 Профиль"],
        "autoTransitionTo": "tbl-read-profile",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-profile", "bot_table", 400, 800, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "profile",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-profile",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-profile", "message", 700, 800, {
        "messageText": "👤 Профиль игрока:\n\n🎭 Ник: {profile.nickname}\n💲 Баланс: {profile.balance}$\n⭐ Уровень: {profile.level} ({profile.exp}/{profile.exp_to_next} exp)\n🔨 Профессия: {profile.profession}\n🏆 Клан: {profile.clan_id}\n📅 Регистрация: {profile.registered_at}",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🏆 Клан" → чтение клана ---
    nodes.append(make_node("trig-clan", "text_trigger", 100, 1000, {
        "textMatchType": "exact",
        "textSynonyms": ["🏆 Клан"],
        "autoTransitionTo": "tbl-read-user-clan",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-user-clan", "bot_table", 400, 1000, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "u",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-has-clan",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("cond-has-clan", "condition", 700, 1000, {
        "variable": "u.clan_id",
        "branches": [
            make_branch("br-no-clan", "Нет клана", "is_empty", "", "msg-no-clan"),
            make_branch("br-has-clan", "Есть клан", "else", "", "tbl-read-clan-info"),
        ],
    }))

    nodes.append(make_node("msg-no-clan", "message", 1000, 1100, {
        "messageText": "😢 {first_name}, вы не состоите в клане.\n\nИспользуйте команду: 🏆 Клан вступить [ид клана]",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("tbl-read-clan-info", "bot_table", 1000, 900, {
        "tableName": "clans",
        "operation": "read",
        "where": [{"column": "id", "operator": "equals", "value": "{u.clan_id}"}],
        "saveResultTo": "clan",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-clan-info",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-clan-info", "message", 1300, 900, {
        "messageText": "❓ {first_name}, ваш клан:\n\n🎭 Название: {clan.name} (ID: {clan.id})\n⭐ Уровень: {clan.level} ({clan.exp}/{clan.exp_to_next})\n💲 Казна: {clan.treasury}$\n🏆 Рейтинг: {clan.rating}\n👥 Участники: /{clan.max_members}\n\n🔓 Вход: {clan.entry_type}\n👑 Лидер клана: {clan.leader_id}",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-clan-season", "🏆 Сезон", "goto", target="msg-clan-season-wip"),
            make_button("btn-clan-members", "👥 Участники", "goto", target="msg-clan-members-wip"),
            make_button("btn-clan-harbor", "⚓ Гавань", "goto", target="msg-clan-harbor"),
            make_button("btn-clan-bonuses", "⭐ Бонусы", "goto", target="msg-clan-bonuses-wip"),
            make_button("btn-clan-profile", "👤 Профиль участника", "goto", target="msg-clan-profile-wip"),
            make_button("btn-clan-leave", "📕 Покинуть клан", "goto", target="msg-clan-leave-wip"),
        ],
    }))

    # --- text_trigger "🏅 Ачивки" → в разработке ---
    nodes.append(make_node("trig-achievements", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["🏅 Ачивки"],
        "autoTransitionTo": "msg-achievements-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-achievements-wip", "message", 400, 1200, {
        "messageText": "🏅 Раздел «Ачивки» находится в разработке. Следите за обновлениями!",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "📦 Команды" → /help ---
    nodes.append(make_node("trig-commands", "text_trigger", 100, 1400, {
        "textMatchType": "exact",
        "textSynonyms": ["📦 Команды"],
        "autoTransitionTo": "msg-help",
        "enableAutoTransition": True,
    }))

    # --- text_trigger "🍩 Донат" → в разработке ---
    nodes.append(make_node("trig-donate", "text_trigger", 100, 1600, {
        "textMatchType": "exact",
        "textSynonyms": ["🍩 Донат"],
        "autoTransitionTo": "msg-donate-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-donate-wip", "message", 400, 1600, {
        "messageText": "🍩 Раздел «Донат» находится в разработке. Следите за обновлениями!",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🤑 Реферальная система" → в разработке ---
    nodes.append(make_node("trig-referral", "text_trigger", 100, 1800, {
        "textMatchType": "exact",
        "textSynonyms": ["🤑 Реферальная система"],
        "autoTransitionTo": "msg-referral-wip",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-referral-wip", "message", 400, 1800, {
        "messageText": "🤑 Раздел «Реферальная система» находится в разработке. Следите за обновлениями!",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🐾 Меню" → возврат в главное меню ---
    nodes.append(make_node("trig-back-menu", "text_trigger", 100, 2000, {
        "textMatchType": "exact",
        "textSynonyms": ["🐾 Меню"],
        "autoTransitionTo": "msg-welcome-back",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-welcome-back", "message", 400, 2000, {
        "messageText": "🐾 Главное меню:",
        "keyboardType": "reply",
        "buttons": [
            make_button("btn-earning2", "🐾 Заработок", "goto", target=""),
            make_button("btn-games2", "🎮 Игры", "goto", target=""),
            make_button("btn-property2", "🏪 Имущество", "goto", target=""),
            make_button("btn-profile2", "👤 Профиль", "goto", target=""),
            make_button("btn-clan2", "🏆 Клан", "goto", target=""),
            make_button("btn-achievements2", "🏅 Ачивки", "goto", target=""),
            make_button("btn-commands2", "📦 Команды", "goto", target=""),
            make_button("btn-donate2", "🍩 Донат", "goto", target=""),
            make_button("btn-referral2", "🤑 Реферальная система", "goto", target=""),
        ],
        "keyboardColumns": 3,
        "resizeKeyboard": True,
    }))

    return {
        "id": "sheet-start-menu",
        "name": "⭐ Старт / Меню",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


def build_sheet_earning() -> dict:
    """
    Строит лист "🐾 Заработок" с мини-играми, проверками уровня и кулдаунами.
    @returns словарь листа с узлами
    """
    nodes = []

    # --- text_trigger "⚒ Работа" → проверка кулдауна ---
    nodes.append(make_node("trig-work", "text_trigger", 100, 0, {
        "textMatchType": "exact",
        "textSynonyms": ["⚒ Работа"],
        "autoTransitionTo": "tbl-read-work-cd",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-work-cd", "bot_table", 400, 0, {
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

    nodes.append(make_node("cond-work-cd", "condition", 700, 0, {
        "variable": "cd.expires_at",
        "branches": [
            make_branch("br-on-cd", "На кулдауне", "greater_than", "{__now}", "msg-work-cooldown"),
            make_branch("br-no-cd", "Кулдаун прошёл", "else", "", "msg-work-start"),
        ],
    }))

    nodes.append(make_node("msg-work-cooldown", "message", 1000, 100, {
        "messageText": "😨 {first_name}, следующая смена через: {cd.expires_at}\n\n⏳ Дождитесь окончания кулдауна.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Мини-игра "Работа" - раунд 1 ---
    nodes.append(make_node("msg-work-start", "message", 1000, -100, {
        "messageText": "🏖 {first_name}, рабочая смена началась!\n\n❓ Нажмите на смайлик «🔨»:",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-w1-1", "🎯", "goto", target="msg-work-wrong"),
            make_button("btn-w1-2", "🔨", "goto", target="msg-work-round2"),
            make_button("btn-w1-3", "🎲", "goto", target="msg-work-wrong"),
            make_button("btn-w1-4", "🎪", "goto", target="msg-work-wrong"),
            make_button("btn-w1-5", "🏀", "goto", target="msg-work-wrong"),
            make_button("btn-w1-6", "⚽", "goto", target="msg-work-wrong"),
            make_button("btn-w1-7", "🎵", "goto", target="msg-work-wrong"),
            make_button("btn-w1-8", "🎸", "goto", target="msg-work-wrong"),
            make_button("btn-w1-9", "🎹", "goto", target="msg-work-wrong"),
            make_button("btn-w1-10", "🎺", "goto", target="msg-work-wrong"),
            make_button("btn-w1-11", "🎻", "goto", target="msg-work-wrong"),
            make_button("btn-w1-12", "🥁", "goto", target="msg-work-wrong"),
            make_button("btn-w1-13", "🎤", "goto", target="msg-work-wrong"),
            make_button("btn-w1-14", "🎧", "goto", target="msg-work-wrong"),
            make_button("btn-w1-15", "🎬", "goto", target="msg-work-wrong"),
            make_button("btn-w1-16", "📷", "goto", target="msg-work-wrong"),
        ],
        "keyboardColumns": 4,
    }))

    # --- Раунд 2 ---
    nodes.append(make_node("msg-work-round2", "message", 1300, -100, {
        "messageText": "✅ Верно! Раунд 2/3\n\n❓ Нажмите на смайлик «⭐»:",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-w2-1", "🌙", "goto", target="msg-work-wrong"),
            make_button("btn-w2-2", "☀️", "goto", target="msg-work-wrong"),
            make_button("btn-w2-3", "🌈", "goto", target="msg-work-wrong"),
            make_button("btn-w2-4", "⭐", "goto", target="msg-work-round3"),
            make_button("btn-w2-5", "💫", "goto", target="msg-work-wrong"),
            make_button("btn-w2-6", "✨", "goto", target="msg-work-wrong"),
            make_button("btn-w2-7", "🌟", "goto", target="msg-work-wrong"),
            make_button("btn-w2-8", "🔥", "goto", target="msg-work-wrong"),
            make_button("btn-w2-9", "❄️", "goto", target="msg-work-wrong"),
            make_button("btn-w2-10", "🌊", "goto", target="msg-work-wrong"),
            make_button("btn-w2-11", "🍀", "goto", target="msg-work-wrong"),
            make_button("btn-w2-12", "🌸", "goto", target="msg-work-wrong"),
            make_button("btn-w2-13", "🌺", "goto", target="msg-work-wrong"),
            make_button("btn-w2-14", "🌻", "goto", target="msg-work-wrong"),
            make_button("btn-w2-15", "🌼", "goto", target="msg-work-wrong"),
            make_button("btn-w2-16", "🌷", "goto", target="msg-work-wrong"),
        ],
        "keyboardColumns": 4,
    }))

    # --- Раунд 3 ---
    nodes.append(make_node("msg-work-round3", "message", 1600, -100, {
        "messageText": "✅ Верно! Раунд 3/3\n\n❓ Нажмите на смайлик «🎯»:",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-w3-1", "🏆", "goto", target="msg-work-wrong"),
            make_button("btn-w3-2", "🥇", "goto", target="msg-work-wrong"),
            make_button("btn-w3-3", "🥈", "goto", target="msg-work-wrong"),
            make_button("btn-w3-4", "🥉", "goto", target="msg-work-wrong"),
            make_button("btn-w3-5", "🎯", "goto", target="set-work-reward"),
            make_button("btn-w3-6", "🎳", "goto", target="msg-work-wrong"),
            make_button("btn-w3-7", "🏓", "goto", target="msg-work-wrong"),
            make_button("btn-w3-8", "🏸", "goto", target="msg-work-wrong"),
            make_button("btn-w3-9", "🥊", "goto", target="msg-work-wrong"),
            make_button("btn-w3-10", "🥋", "goto", target="msg-work-wrong"),
            make_button("btn-w3-11", "⛳", "goto", target="msg-work-wrong"),
            make_button("btn-w3-12", "🎿", "goto", target="msg-work-wrong"),
            make_button("btn-w3-13", "🛷", "goto", target="msg-work-wrong"),
            make_button("btn-w3-14", "🥌", "goto", target="msg-work-wrong"),
            make_button("btn-w3-15", "🤺", "goto", target="msg-work-wrong"),
            make_button("btn-w3-16", "🏇", "goto", target="msg-work-wrong"),
        ],
        "keyboardColumns": 4,
    }))

    # --- Награда за работу ---
    nodes.append(make_node("set-work-reward", "set_variable", 1900, -100, {
        "assignments": [
            {"id": "asgn-salary", "variable": "salary", "value": "150", "mode": "text"},
            {"id": "asgn-exp-gain", "variable": "exp_gained", "value": "12", "mode": "text"},
        ],
        "autoTransitionTo": "tbl-work-add-balance",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-work-add-balance", "bot_table", 2200, -100, {
        "tableName": "users",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "balance", "op": "increment", "value": "{salary}"},
            {"column": "exp", "op": "increment", "value": "{exp_gained}"},
        ],
        "autoTransitionTo": "tbl-work-set-cd",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-work-set-cd", "bot_table", 2500, -100, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "{user_id}",
            "action_type": "work",
            "expires_at": "{__now_plus_3600}",
        },
        "onConflict": "update",
        "autoTransitionTo": "msg-work-success",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-work-success", "message", 2800, -100, {
        "messageText": "🤩 {first_name}, смена завершена!\n\n💲 Зарплата: {salary}$\n⭐ Уровень: +{exp_gained} exp\n\n😨 Следующая смена через: 1 час",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Неправильный ответ ---
    nodes.append(make_node("msg-work-wrong", "message", 1300, 200, {
        "messageText": "😢 {first_name}, к сожалению, вы нажали на неверный смайлик.\nРабочая смена завершена.\n\n😨 Начать новую смену можно через: 30 мин",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "tbl-work-set-cd-fail",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-work-set-cd-fail", "bot_table", 1600, 200, {
        "tableName": "cooldowns",
        "operation": "upsert",
        "key": "user_id",
        "row": {
            "user_id": "{user_id}",
            "action_type": "work",
            "expires_at": "{__now_plus_1800}",
        },
        "onConflict": "update",
    }))

    # --- text_trigger "🥕 Шахта" → проверка уровня >= 3 ---
    nodes.append(make_node("trig-mine", "text_trigger", 100, 400, {
        "textMatchType": "exact",
        "textSynonyms": ["🥕 Шахта"],
        "autoTransitionTo": "tbl-read-user-mine",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-user-mine", "bot_table", 400, 400, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "u",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-mine-level",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("cond-mine-level", "condition", 700, 400, {
        "variable": "u.level",
        "branches": [
            make_branch("br-mine-ok", "Уровень >= 3", "greater_than", "2", "msg-mine-wip"),
            make_branch("br-mine-low", "Уровень < 3", "else", "", "msg-mine-locked"),
        ],
    }))

    nodes.append(make_node("msg-mine-locked", "message", 1000, 500, {
        "messageText": "😴 {first_name}, 🥕 шахта станет доступна после достижения ⭐3-го уровня.\nУровень можно повысить выполняя разную активность.",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-how-level", "🏫 Как повысить уровень?", "goto", target="msg-how-level"),
        ],
    }))

    nodes.append(make_node("msg-mine-wip", "message", 1000, 350, {
        "messageText": "🥕 Шахта — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🎣 Рыбалка" → проверка уровня >= 7 ---
    nodes.append(make_node("trig-fishing", "text_trigger", 100, 600, {
        "textMatchType": "exact",
        "textSynonyms": ["🎣 Рыбалка"],
        "autoTransitionTo": "tbl-read-user-fish",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-user-fish", "bot_table", 400, 600, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "u",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-fish-level",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("cond-fish-level", "condition", 700, 600, {
        "variable": "u.level",
        "branches": [
            make_branch("br-fish-ok", "Уровень >= 7", "greater_than", "6", "msg-fish-wip"),
            make_branch("br-fish-low", "Уровень < 7", "else", "", "msg-fish-locked"),
        ],
    }))

    nodes.append(make_node("msg-fish-locked", "message", 1000, 700, {
        "messageText": "😴 {first_name}, 🎣 рыбалка станет доступна после достижения ⭐7-го уровня.\nУровень можно повысить выполняя разную активность.",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-how-level2", "🏫 Как повысить уровень?", "goto", target="msg-how-level"),
        ],
    }))

    nodes.append(make_node("msg-fish-wip", "message", 1000, 550, {
        "messageText": "🎣 Рыбалка — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "🏞 Ранчо" → проверка уровня >= 15 ---
    nodes.append(make_node("trig-ranch", "text_trigger", 100, 800, {
        "textMatchType": "exact",
        "textSynonyms": ["🏞 Ранчо"],
        "autoTransitionTo": "tbl-read-user-ranch",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-user-ranch", "bot_table", 400, 800, {
        "tableName": "users",
        "operation": "read",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "u",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-ranch-level",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("cond-ranch-level", "condition", 700, 800, {
        "variable": "u.level",
        "branches": [
            make_branch("br-ranch-ok", "Уровень >= 15", "greater_than", "14", "msg-ranch-wip"),
            make_branch("br-ranch-low", "Уровень < 15", "else", "", "msg-ranch-locked"),
        ],
    }))

    nodes.append(make_node("msg-ranch-locked", "message", 1000, 900, {
        "messageText": "😴 {first_name}, 🏞 ранчо станет доступно после достижения ⭐15-го уровня.\nУровень можно повысить выполняя разную активность.",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-how-level3", "🏫 Как повысить уровень?", "goto", target="msg-how-level"),
        ],
    }))

    nodes.append(make_node("msg-ranch-wip", "message", 1000, 750, {
        "messageText": "🏞 Ранчо — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "📦 Ящики" ---
    nodes.append(make_node("trig-crates", "text_trigger", 100, 1000, {
        "textMatchType": "exact",
        "textSynonyms": ["📦 Ящики"],
        "autoTransitionTo": "msg-crates-empty",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-crates-empty", "message", 400, 1000, {
        "messageText": "😕 {first_name}, к сожалению, у вас еще нет ящиков.\nИх можно получить за разные активности.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- text_trigger "💹 Бизнес" → проверка наличия бизнеса ---
    nodes.append(make_node("trig-business", "text_trigger", 100, 1200, {
        "textMatchType": "exact",
        "textSynonyms": ["💹 Бизнес"],
        "autoTransitionTo": "tbl-read-user-biz",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-user-biz", "bot_table", 400, 1200, {
        "tableName": "user_businesses",
        "operation": "read",
        "where": [{"column": "user_id", "operator": "equals", "value": "{user_id}"}],
        "saveResultTo": "biz",
        "resultFormat": "first_row",
        "autoTransitionTo": "cond-has-biz",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("cond-has-biz", "condition", 700, 1200, {
        "variable": "biz.business_id",
        "branches": [
            make_branch("br-has-biz", "Есть бизнес", "is_not_empty", "", "msg-biz-info-wip"),
            make_branch("br-no-biz", "Нет бизнеса", "else", "", "msg-no-biz"),
        ],
    }))

    nodes.append(make_node("msg-no-biz", "message", 1000, 1300, {
        "messageText": "😢 {first_name}, У вас нет бизнеса.",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-biz-catalog", "🛍 Каталог бизнесов", "goto", target="msg-biz-catalog"),
        ],
    }))

    nodes.append(make_node("msg-biz-info-wip", "message", 1000, 1150, {
        "messageText": "💹 Информация о вашем бизнесе — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Inline callback "Как повысить уровень?" ---
    nodes.append(make_node("msg-how-level", "message", 1300, 600, {
        "messageText": "🏫 Система уровней:\n\n⭐ Уровень повышается при накоплении опыта (EXP).\n\nСпособы получить EXP:\n• ⚒ Работа — 12 exp за смену\n• 🥕 Шахта — 20 exp (с 3 уровня)\n• 🎣 Рыбалка — 25 exp (с 7 уровня)\n• 🏞 Ранчо — 35 exp (с 15 уровня)\n• 🎮 Мини-игры — разный exp\n\nФормула: каждый следующий уровень требует x1.5 exp от предыдущего.\nСтарт: 64 exp для 2-го уровня.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-earning",
        "name": "🐾 Заработок",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


def build_sheet_business() -> dict:
    """
    Строит лист "💹 Бизнес" с каталогом бизнесов и покупкой.
    @returns словарь листа с узлами
    """
    nodes = []

    # --- Каталог бизнесов (по callback от кнопки "🛍 Каталог бизнесов") ---
    nodes.append(make_node("msg-biz-catalog", "message", 100, 0, {
        "messageText": "🛍 Каталог бизнесов:\n\nИспользуйте кнопки для навигации.",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-biz-page-info", "1/5", "goto", target=""),
            make_button("btn-biz-prev", "<", "goto", target="msg-biz-catalog"),
            make_button("btn-biz-next", ">", "goto", target="msg-biz-item"),
        ],
        "autoTransitionTo": "tbl-read-biz-catalog",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-biz-catalog", "bot_table", 400, 0, {
        "tableName": "businesses_catalog",
        "operation": "read",
        "where": [],
        "saveResultTo": "catalog",
        "resultFormat": "all_rows",
        "limit": 1,
        "autoTransitionTo": "msg-biz-item",
        "enableAutoTransition": True,
    }))

    # --- Отображение бизнеса ---
    nodes.append(make_node("msg-biz-item", "photo", 700, 0, {
        "imageUrl": "{catalog.image_url}",
        "mediaCaption": "☕ {first_name}, информация о бизнесе \"{catalog.name}\":\n\n📈 Макс. прибыль: {catalog.max_profit}$/час\n⭐ Макс. уровень прокачки: {catalog.max_level}\n\n💰 Стоимость: {catalog.price}$",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-biz-buy", "✅ Приобрести", "goto", target="cond-biz-balance"),
            make_button("btn-biz-prev2", "<", "goto", target="msg-biz-item"),
            make_button("btn-biz-page2", "1/5", "goto", target=""),
            make_button("btn-biz-next2", ">", "goto", target="msg-biz-item"),
        ],
    }))

    # --- Проверка баланса при покупке ---
    nodes.append(make_node("cond-biz-balance", "condition", 1000, 0, {
        "variable": "profile.balance",
        "branches": [
            make_branch("br-biz-afford", "Хватает денег", "greater_than", "{catalog.price}", "tbl-biz-buy"),
            make_branch("br-biz-poor", "Не хватает", "else", "", "msg-biz-no-money"),
        ],
    }))

    nodes.append(make_node("msg-biz-no-money", "answer_callback_query", 1300, 100, {
        "messageText": "😢 Вам не хватает денег на покупку этого бизнеса.",
        "showAlert": True,
    }))

    # --- Покупка бизнеса ---
    nodes.append(make_node("tbl-biz-buy", "bot_table", 1300, -100, {
        "tableName": "user_businesses",
        "operation": "insert",
        "row": {
            "user_id": "{user_id}",
            "business_id": "{catalog.id}",
            "level": "1",
            "last_collected": "{__now}",
        },
        "autoTransitionTo": "tbl-biz-deduct",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-biz-deduct", "bot_table", 1600, -100, {
        "tableName": "users",
        "operation": "update",
        "where": [{"column": "telegram_id", "operator": "equals", "value": "{user_id}"}],
        "updates": [
            {"column": "balance", "op": "decrement", "value": "{catalog.price}"},
        ],
        "autoTransitionTo": "msg-biz-bought",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-biz-bought", "message", 1900, -100, {
        "messageText": "🎉 {first_name}, вы успешно приобрели бизнес \"{catalog.name}\"!\n\n💹 Теперь вы можете собирать прибыль.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-business",
        "name": "💹 Бизнес",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


def build_sheet_clan() -> dict:
    """
    Строит лист "🏆 Клан" с информацией о клане и гаванью.
    @returns словарь листа с узлами
    """
    nodes = []

    # --- Заглушки для кнопок клана ---
    nodes.append(make_node("msg-clan-season-wip", "message", 100, 0, {
        "messageText": "🏆 Сезон клана — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-clan-members-wip", "message", 100, 200, {
        "messageText": "👥 Участники клана — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-clan-bonuses-wip", "message", 100, 400, {
        "messageText": "⭐ Бонусы клана — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-clan-profile-wip", "message", 100, 600, {
        "messageText": "👤 Профиль участника — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-clan-leave-wip", "message", 100, 800, {
        "messageText": "📕 Покинуть клан — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    # --- Гавань клана ---
    nodes.append(make_node("msg-clan-harbor", "message", 400, 0, {
        "messageText": "",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "tbl-read-harbor",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("tbl-read-harbor", "bot_table", 700, 0, {
        "tableName": "clan_harbor",
        "operation": "read",
        "where": [{"column": "clan_id", "operator": "equals", "value": "{u.clan_id}"}],
        "saveResultTo": "harbor",
        "resultFormat": "first_row",
        "autoTransitionTo": "msg-harbor-info",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-harbor-info", "message", 1000, 0, {
        "messageText": "⚓ {first_name}, гавань клана:\n\n🔥 Уровень: {harbor.level}\n🏖 Склад: {harbor.storage_current} ед./{harbor.storage_max} ед.\n🚢 Добыча: {harbor.production_rate} ед./мин\n\n⚙ Используйте кнопки ниже для управления гаванью!",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-harbor-upgrade", "🆙 Улучшение", "goto", target="msg-harbor-upgrade-wip"),
            make_button("btn-harbor-investors", "🏆 Инвесторы", "goto", target="msg-harbor-investors-wip"),
            make_button("btn-harbor-production", "🚢 Добыча", "goto", target="msg-harbor-production-wip"),
            make_button("btn-harbor-storage", "🏖 Склад", "goto", target="msg-harbor-storage-wip"),
            make_button("btn-harbor-raid", "🏴 Рейд", "goto", target="msg-harbor-raid-wip"),
            make_button("btn-harbor-back", "⬅ Назад", "goto", target="msg-clan-info"),
        ],
    }))

    # --- Заглушки гавани ---
    nodes.append(make_node("msg-harbor-upgrade-wip", "message", 1300, -100, {
        "messageText": "🆙 Улучшение гавани — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-harbor-investors-wip", "message", 1300, 100, {
        "messageText": "🏆 Инвесторы — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-harbor-production-wip", "message", 1300, 300, {
        "messageText": "🚢 Добыча — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-harbor-storage-wip", "message", 1300, 500, {
        "messageText": "🏖 Склад — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-harbor-raid-wip", "message", 1300, 700, {
        "messageText": "🏴 Рейд — раздел в разработке.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-clan",
        "name": "🏆 Клан",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


def build_sheet_help() -> dict:
    """
    Строит лист "📖 Справка" с командами /help и /faq.
    @returns словарь листа с узлами
    """
    nodes = []

    # --- /help → список разделов ---
    nodes.append(make_node("cmd-help", "command_trigger", 100, 0, {
        "command": "/help",
        "description": "Список команд",
        "showInMenu": True,
        "autoTransitionTo": "msg-help",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-help", "message", 400, 0, {
        "messageText": "📚 {first_name}, выберите раздел с командами:\n- ⭐ Основное\n- 🐾 Заработок\n- 🎮 Игры\n- 🏪 Имущество\n- ☁ Прочее\n\n✅ Добавить бота в чат",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-help-main", "⭐", "goto", target="msg-help-main"),
            make_button("btn-help-earn", "🐾", "goto", target="msg-help-earn"),
            make_button("btn-help-games", "🎮", "goto", target="msg-help-games"),
            make_button("btn-help-prop", "🏪", "goto", target="msg-help-prop"),
            make_button("btn-help-other", "☁", "goto", target="msg-help-other"),
        ],
    }))

    # --- Раздел ⭐ Основное ---
    nodes.append(make_node("msg-help-main", "message", 700, 0, {
        "messageText": "⭐ {first_name}, список команд из раздела \"Основное\":\n- 👤 Профиль - ваш профиль\n- 🏆 Клан - ваш клан\n- 👥 Рефералы - деньги за друзей\n- 🐾 Передать - перевод денег\n- 🎁 Бонус - ежедневный подарок\n- 🔮 Артефакты - ваши артефакты\n- 🐧 Чат - деньги за чат\n\n- 🏆 Клан вступить [ид клана]\n- 🏅 Достижения\n- 🍩 Донат\n- 📕 Правила",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-help-main2", "⭐", "goto", target="msg-help-main"),
            make_button("btn-help-earn2", "🐾", "goto", target="msg-help-earn"),
            make_button("btn-help-games2", "🎮", "goto", target="msg-help-games"),
            make_button("btn-help-prop2", "🏪", "goto", target="msg-help-prop"),
            make_button("btn-help-other2", "☁", "goto", target="msg-help-other"),
        ],
    }))

    # --- Раздел 🐾 Заработок ---
    nodes.append(make_node("msg-help-earn", "message", 700, 200, {
        "messageText": "🐾 {first_name}, список команд из раздела \"Заработок\":\n- ⚒ Работа - заработать деньги\n- 🥕 Шахта - добыча ресурсов (с 3 ур.)\n- 🎣 Рыбалка - ловля рыбы (с 7 ур.)\n- 🏞 Ранчо - фермерство (с 15 ур.)\n- 📦 Ящики - открытие ящиков\n- 💹 Бизнес - пассивный доход",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-help-main3", "⭐", "goto", target="msg-help-main"),
            make_button("btn-help-earn3", "🐾", "goto", target="msg-help-earn"),
            make_button("btn-help-games3", "🎮", "goto", target="msg-help-games"),
            make_button("btn-help-prop3", "🏪", "goto", target="msg-help-prop"),
            make_button("btn-help-other3", "☁", "goto", target="msg-help-other"),
        ],
    }))

    # --- Раздел 🎮 Игры ---
    nodes.append(make_node("msg-help-games", "message", 700, 400, {
        "messageText": "🎮 {first_name}, список команд из раздела \"Игры\":\n- Раздел в разработке",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-help-main4", "⭐", "goto", target="msg-help-main"),
            make_button("btn-help-earn4", "🐾", "goto", target="msg-help-earn"),
            make_button("btn-help-games4", "🎮", "goto", target="msg-help-games"),
            make_button("btn-help-prop4", "🏪", "goto", target="msg-help-prop"),
            make_button("btn-help-other4", "☁", "goto", target="msg-help-other"),
        ],
    }))

    # --- Раздел 🏪 Имущество ---
    nodes.append(make_node("msg-help-prop", "message", 700, 600, {
        "messageText": "🏪 {first_name}, список команд из раздела \"Имущество\":\n- Раздел в разработке",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-help-main5", "⭐", "goto", target="msg-help-main"),
            make_button("btn-help-earn5", "🐾", "goto", target="msg-help-earn"),
            make_button("btn-help-games5", "🎮", "goto", target="msg-help-games"),
            make_button("btn-help-prop5", "🏪", "goto", target="msg-help-prop"),
            make_button("btn-help-other5", "☁", "goto", target="msg-help-other"),
        ],
    }))

    # --- Раздел ☁ Прочее ---
    nodes.append(make_node("msg-help-other", "message", 700, 800, {
        "messageText": "☁ {first_name}, список команд из раздела \"Прочее\":\n- /faq - справочник\n- /help - список команд",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-help-main6", "⭐", "goto", target="msg-help-main"),
            make_button("btn-help-earn6", "🐾", "goto", target="msg-help-earn"),
            make_button("btn-help-games6", "🎮", "goto", target="msg-help-games"),
            make_button("btn-help-prop6", "🏪", "goto", target="msg-help-prop"),
            make_button("btn-help-other6", "☁", "goto", target="msg-help-other"),
        ],
    }))

    # --- /faq → справочник ---
    nodes.append(make_node("cmd-faq", "command_trigger", 100, 1000, {
        "command": "/faq",
        "description": "Справочник",
        "showInMenu": True,
        "autoTransitionTo": "msg-faq",
        "enableAutoTransition": True,
    }))

    nodes.append(make_node("msg-faq", "message", 400, 1000, {
        "messageText": "📖 {first_name}, меню справочника:\n\nЗдесь вы найдёте ответы на все вопросы об игровых системах.\n🔒 Некоторые разделы становятся доступны только после достижения определённого уровня.\n\n🔽 Выбери интересующий раздел с помощью кнопок ниже:",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-faq-vip", "💎 VIP", "goto", target="msg-faq-vip"),
            make_button("btn-faq-harbor", "⬇ Гавань", "goto", target="msg-faq-harbor"),
        ],
    }))

    nodes.append(make_node("msg-faq-vip", "message", 700, 1000, {
        "messageText": "💎 VIP-статус:\n\n• Увеличенная зарплата на работе\n• Сниженные кулдауны\n• Эксклюзивные предметы\n• Бонус к опыту x1.5\n\nПодробности в разделе 🍩 Донат.",
        "keyboardType": "none",
        "buttons": [],
    }))

    nodes.append(make_node("msg-faq-harbor", "message", 700, 1200, {
        "messageText": "⬇ Гавань клана:\n\n• Гавань — источник ресурсов для клана\n• Улучшайте уровень для увеличения добычи\n• Склад хранит ресурсы до сбора\n• Рейды позволяют атаковать другие кланы\n\nДоступно после вступления в клан.",
        "keyboardType": "none",
        "buttons": [],
    }))

    return {
        "id": "sheet-help",
        "name": "📖 Справка",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


def build_project() -> dict:
    """
    Собирает полный project.json из всех листов.
    @returns словарь с полной структурой проекта
    """
    return {
        "version": 2,
        "activeSheetId": "sheet-start-menu",
        "sheets": [
            build_sheet_start_menu(),
            build_sheet_earning(),
            build_sheet_business(),
            build_sheet_clan(),
            build_sheet_help(),
        ],
    }


def main():
    """
    Точка входа: генерирует project.json и записывает в файл.
    """
    output_path = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\клон\project.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    project = build_project()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Статистика
    total_nodes = sum(len(sheet["nodes"]) for sheet in project["sheets"])
    total_sheets = len(project["sheets"])
    print(f"✅ Сгенерирован project.json")
    print(f"   📁 Путь: {output_path}")
    print(f"   📄 Листов: {total_sheets}")
    print(f"   🔗 Узлов: {total_nodes}")


if __name__ == "__main__":
    main()
