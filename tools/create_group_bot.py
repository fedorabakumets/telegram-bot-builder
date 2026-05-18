"""
@fileoverview Генератор project.json для группового бота с профилями, репутацией и взаимодействиями
@module tools/create_group_bot
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


def make_bot_table_node(node_id: str, x: int, y: int, table_name: str, operation: str, **kwargs) -> dict:
    """
    Создаёт узел bot_table для работы с внутренними таблицами.
    @param node_id - уникальный идентификатор узла
    @param x - позиция по горизонтали
    @param y - позиция по вертикали
    @param table_name - имя таблицы
    @param operation - операция: read, insert, update, upsert, delete
    @param kwargs - дополнительные поля (where, updates, row, key и т.д.)
    @returns словарь с полным описанием узла bot_table
    """
    data = {
        "tableName": table_name,
        "operation": operation,
        "where": kwargs.get("where", []),
        "updates": kwargs.get("updates", []),
        "row": kwargs.get("row", {}),
        "key": kwargs.get("key", ""),
        "onConflict": kwargs.get("on_conflict", "ignore"),
        "saveResultTo": kwargs.get("save_to", ""),
        "resultFormat": kwargs.get("result_format", "first_row"),
        "returnColumns": kwargs.get("return_columns", []),
        "orderBy": kwargs.get("order_by", ""),
        "orderDirection": kwargs.get("order_direction", "desc"),
        "limit": kwargs.get("limit", 0),
        "autoTransitionTo": kwargs.get("target", ""),
        "enableAutoTransition": bool(kwargs.get("target", "")),
        "buttons": [],
        "keyboardType": "none",
    }
    return make_node(node_id, "bot_table", x, y, data)


def build_sheet_start() -> dict:
    """
    Строит лист 1: Старт / Профиль.
    @returns словарь листа с узлами
    """
    nodes = [
        # /start → регистрация → приветствие
        make_node("cmd-start", "command_trigger", 100, 100, {
            "command": "/start",
            "description": "Запустить бота",
            "showInMenu": True,
            "autoTransitionTo": "tbl-register",
        }),
        make_bot_table_node("tbl-register", 400, 100, "profiles", "upsert",
            key="telegram_id",
            row={
                "telegram_id": "{user_id}",
                "username": "{username}",
                "first_name": "{first_name}",
                "balance": "100",
                "reputation": "100",
                "age": "",
                "bio": "",
                "status": "",
                "rank": "user",
                "prefix": "",
            },
            on_conflict="ignore",
            target="msg-welcome",
        ),
        make_node("msg-welcome", "message", 700, 100, {
            "messageText": "👋 Добро пожаловать, {first_name}!\n\nВаш профиль создан.\nБаланс: 100 🍪\nРепутация: 100\n\nИспользуйте /profile для просмотра.",
            "keyboardType": "none",
            "buttons": [],
        }),

        # /profile → чтение → вывод
        make_node("cmd-profile", "command_trigger", 100, 300, {
            "command": "/profile",
            "description": "Мой профиль",
            "showInMenu": True,
            "autoTransitionTo": "tbl-read-profile",
        }),
        make_bot_table_node("tbl-read-profile", 400, 300, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="msg-profile",
        ),
        make_node("msg-profile", "message", 700, 300, {
            "messageText": (
                "👤 Профиль {first_name}\n\n"
                "⭐ Репутация: {me.reputation}\n"
                "💰 Баланс: {me.balance} 🍪\n"
                "🎂 Возраст: {me.age}\n"
                "📝 Био: {me.bio}\n"
                "💬 Статус: {me.status}\n"
                "🏅 Ранг: {me.rank}\n"
                "🏷 Префикс: {me.prefix}"
            ),
            "keyboardType": "none",
            "buttons": [],
        }),

        # /setage → запрос возраста → обновление → подтверждение
        make_node("cmd-setage", "command_trigger", 100, 500, {
            "command": "/setage",
            "description": "Установить возраст",
            "showInMenu": False,
            "autoTransitionTo": "msg-ask-age",
        }),
        make_node("msg-ask-age", "message", 400, 500, {
            "messageText": "🎂 Введите ваш возраст (число от 1 до 120):",
            "keyboardType": "none",
            "buttons": [],
            "collectUserInput": True,
            "enableTextInput": True,
            "inputVariable": "user_age",
            "inputTargetNodeId": "tbl-setage",
        }),
        make_bot_table_node("tbl-setage", 700, 500, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "age", "op": "set", "value": "{user_age}"}],
            target="msg-age-ok",
        ),
        make_node("msg-age-ok", "message", 700, 500, {
            "messageText": "✅ Возраст сохранён.",
            "keyboardType": "none",
            "buttons": [],
        }),

        # /setbio → запрос био → обновление → подтверждение
        make_node("cmd-setbio", "command_trigger", 100, 700, {
            "command": "/setbio",
            "description": "Установить био",
            "showInMenu": False,
            "autoTransitionTo": "msg-ask-bio",
        }),
        make_node("msg-ask-bio", "message", 400, 700, {
            "messageText": "📝 Введите текст о себе (до 300 символов):",
            "keyboardType": "none",
            "buttons": [],
            "collectUserInput": True,
            "enableTextInput": True,
            "inputVariable": "user_bio",
            "inputTargetNodeId": "tbl-setbio",
        }),
        make_bot_table_node("tbl-setbio", 700, 700, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "bio", "op": "set", "value": "{user_bio}"}],
            target="msg-bio-ok",
        ),
        make_node("msg-bio-ok", "message", 700, 700, {
            "messageText": "✅ Био обновлено.",
            "keyboardType": "none",
            "buttons": [],
        }),

        # /setstatus → запрос статуса → обновление → подтверждение
        make_node("cmd-setstatus", "command_trigger", 100, 900, {
            "command": "/setstatus",
            "description": "Установить статус",
            "showInMenu": False,
            "autoTransitionTo": "msg-ask-status",
        }),
        make_node("msg-ask-status", "message", 400, 900, {
            "messageText": "💬 Введите ваш статус (до 50 символов):",
            "keyboardType": "none",
            "buttons": [],
            "collectUserInput": True,
            "enableTextInput": True,
            "inputVariable": "user_status",
            "inputTargetNodeId": "tbl-setstatus",
        }),
        make_bot_table_node("tbl-setstatus", 700, 900, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "status", "op": "set", "value": "{user_status}"}],
            target="msg-status-ok",
        ),
        make_node("msg-status-ok", "message", 700, 900, {
            "messageText": "✅ Статус обновлён.",
            "keyboardType": "none",
            "buttons": [],
        }),

        # /setphoto → запрос фото → сохранение file_id → подтверждение
        make_node("cmd-setphoto", "command_trigger", 100, 1100, {
            "command": "/setphoto",
            "description": "Установить фото профиля",
            "showInMenu": False,
            "autoTransitionTo": "msg-ask-photo",
        }),
        make_node("msg-ask-photo", "message", 400, 1100, {
            "messageText": "📷 Отправьте фото для профиля:",
            "keyboardType": "none",
            "buttons": [],
            "collectUserInput": True,
            "enableTextInput": False,
            "enablePhotoInput": True,
            "inputVariable": "photo_file_id",
            "inputTargetNodeId": "tbl-setphoto",
        }),
        make_bot_table_node("tbl-setphoto", 700, 1100, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "photo", "op": "set", "value": "{photo_file_id}"}],
            target="msg-photo-ok",
        ),
        make_node("msg-photo-ok", "message", 1000, 1100, {
            "messageText": "✅ Фото профиля обновлено!",
            "keyboardType": "none",
            "buttons": [],
        }),

        # /help → справка по всем командам
        make_node("cmd-help", "command_trigger", 100, 1300, {
            "command": "/help",
            "description": "Справка по командам",
            "showInMenu": True,
            "autoTransitionTo": "msg-help",
        }),
        make_node("msg-help", "message", 400, 1300, {
            "messageText": (
                "📖 <b>Команды бота</b>\n\n"
                "👤 <b>Профиль:</b>\n"
                "/profile — посмотреть профиль\n"
                "/setage — установить возраст\n"
                "/setbio — установить био\n"
                "/setstatus — установить статус\n"
                "/setphoto — установить фото (реплай на фото)\n\n"
                "⭐ <b>Репутация:</b>\n"
                "+реп / плюс реп — повысить (реплай)\n"
                "-реп / дизреп — понизить (реплай)\n\n"
                "🤝 <b>Взаимодействия (реплай):</b>\n"
                "обнять, поцеловать, погладить, поблагодарить\n"
                "пнуть, ударить, оскорбить\n"
                "— +5 или -5 к отношениям\n"
                "— +5 🍪 инициатору\n"
                "— Лимит: 3 действия / 12 часов\n"
                "— Нужна репутация ≥ 80\n\n"
                "🛒 <b>Магазин:</b>\n"
                "/shop — открыть магазин\n"
                "— +10 реп — 50 🍪\n"
                "— Сброс лимитов реп — 100 🍪\n"
                "— Сброс лимитов взаимодействий — 100 🍪\n"
                "— Кастомный префикс — 200 🍪\n\n"
                "💰 <b>Валюта:</b>\n"
                "Начальный баланс: 100 🍪\n"
                "Зарабатывайте через взаимодействия\n\n"
                "⏰ <b>Автоматика:</b>\n"
                "Репутация ниже 50 → сброс до 50 в 00:00 МСК"
            ),
            "formatMode": "html",
            "keyboardType": "none",
            "buttons": [],
        }),
    ]
    return {"id": "sheet-start", "name": "🏠 Старт / Профиль", "nodes": nodes}


def build_sheet_reputation() -> dict:
    """
    Строит лист 2: Репутация (+реп / -реп).
    @returns словарь листа с узлами
    """
    nodes = [
        # +реп
        make_node("trig-plus-rep", "text_trigger", 100, 100, {
            "textMatchType": "exact",
            "textSynonyms": ["+реп", "плюс реп"],
            "autoTransitionTo": "tbl-read-me-rep-plus",
        }),
        make_bot_table_node("tbl-read-me-rep-plus", 400, 100, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-rep-check-plus",
        ),
        make_node("cond-rep-check-plus", "condition", 700, 100, {
            "variable": "me.reputation",
            "branches": [
                make_branch("br-rep-ok-plus", "Реп >= 50", "greater_than", "49", "tbl-add-rep"),
                make_branch("br-rep-fail-plus", "Иначе", "else", "", "msg-rep-low"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-add-rep", 1000, 100, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{reply_to_user_id}"}],
            updates=[{"column": "reputation", "op": "increment", "value": "10"}],
            target="msg-rep-plus-ok",
        ),
        make_node("msg-rep-plus-ok", "message", 1300, 100, {
            "messageText": "✅ +10 реп для @{reply_to_username}",
            "keyboardType": "none",
            "buttons": [],
        }),

        # -реп
        make_node("trig-minus-rep", "text_trigger", 100, 400, {
            "textMatchType": "exact",
            "textSynonyms": ["-реп", "дизреп"],
            "autoTransitionTo": "tbl-read-me-rep-minus",
        }),
        make_bot_table_node("tbl-read-me-rep-minus", 400, 400, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-rep-check-minus",
        ),
        make_node("cond-rep-check-minus", "condition", 700, 400, {
            "variable": "me.reputation",
            "branches": [
                make_branch("br-rep-ok-minus", "Реп >= 50", "greater_than", "49", "tbl-sub-rep"),
                make_branch("br-rep-fail-minus", "Иначе", "else", "", "msg-rep-low"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-sub-rep", 1000, 400, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{reply_to_user_id}"}],
            updates=[{"column": "reputation", "op": "decrement", "value": "10"}],
            target="msg-rep-minus-ok",
        ),
        make_node("msg-rep-minus-ok", "message", 1300, 400, {
            "messageText": "⬇️ -10 реп для @{reply_to_username}",
            "keyboardType": "none",
            "buttons": [],
        }),

        # Общее сообщение об ошибке
        make_node("msg-rep-low", "message", 1000, 600, {
            "messageText": "❌ Недостаточно репутации (нужно ≥ 50).",
            "keyboardType": "none",
            "buttons": [],
        }),
    ]
    return {"id": "sheet-reputation", "name": "⭐ Репутация", "nodes": nodes}


def build_sheet_interactions() -> dict:
    """
    Строит лист 3: Взаимодействия (обнять, пнуть и т.д.).
    @returns словарь листа с узлами
    """
    nodes = [
        # Позитивные взаимодействия
        make_node("trig-positive", "text_trigger", 100, 100, {
            "textMatchType": "exact",
            "textSynonyms": ["обнять", "поцеловать", "погладить", "поблагодарить"],
            "autoTransitionTo": "tbl-read-me-pos",
        }),
        make_bot_table_node("tbl-read-me-pos", 400, 100, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-rep-pos",
        ),
        make_node("cond-rep-pos", "condition", 700, 100, {
            "variable": "me.reputation",
            "branches": [
                make_branch("br-pos-ok", "Реп >= 80", "greater_than", "79", "tbl-upsert-rel-pos"),
                make_branch("br-pos-fail", "Иначе", "else", "", "msg-int-low-rep"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-upsert-rel-pos", 1000, 100, "relationships", "upsert",
            key="pair_id",
            row={
                "pair_id": "{user_id}_{reply_to_user_id}",
                "user_a": "{user_id}",
                "user_b": "{reply_to_user_id}",
                "score": "0",
                "actions_today": "0",
            },
            on_conflict="ignore",
            target="tbl-read-rel-pos",
        ),
        make_bot_table_node("tbl-read-rel-pos", 1300, 100, "relationships", "read",
            where=[{"column": "pair_id", "value": "{user_id}_{reply_to_user_id}"}],
            save_to="rel",
            target="cond-limit-pos",
        ),
        make_node("cond-limit-pos", "condition", 1600, 100, {
            "variable": "rel.actions_today",
            "branches": [
                make_branch("br-lim-ok-pos", "< 3", "less_than", "3", "tbl-update-rel-pos"),
                make_branch("br-lim-fail-pos", "Иначе", "else", "", "msg-int-limit"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-update-rel-pos", 1900, 100, "relationships", "update",
            where=[{"column": "pair_id", "value": "{user_id}_{reply_to_user_id}"}],
            updates=[
                {"column": "score", "op": "increment", "value": "5"},
                {"column": "actions_today", "op": "increment", "value": "1"},
            ],
            target="tbl-bonus-pos",
        ),
        make_bot_table_node("tbl-bonus-pos", 2200, 100, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "balance", "op": "increment", "value": "5"}],
            target="msg-pos-ok",
        ),
        make_node("msg-pos-ok", "message", 2500, 100, {
            "messageText": "🤗 Вы обняли @{reply_to_username}! Отношения: {rel.score} | +5 🍪",
            "keyboardType": "none",
            "buttons": [],
        }),

        # Негативные взаимодействия
        make_node("trig-negative", "text_trigger", 100, 500, {
            "textMatchType": "exact",
            "textSynonyms": ["пнуть", "ударить", "оскорбить"],
            "autoTransitionTo": "tbl-read-me-neg",
        }),
        make_bot_table_node("tbl-read-me-neg", 400, 500, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-rep-neg",
        ),
        make_node("cond-rep-neg", "condition", 700, 500, {
            "variable": "me.reputation",
            "branches": [
                make_branch("br-neg-ok", "Реп >= 80", "greater_than", "79", "tbl-upsert-rel-neg"),
                make_branch("br-neg-fail", "Иначе", "else", "", "msg-int-low-rep"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-upsert-rel-neg", 1000, 500, "relationships", "upsert",
            key="pair_id",
            row={
                "pair_id": "{user_id}_{reply_to_user_id}",
                "user_a": "{user_id}",
                "user_b": "{reply_to_user_id}",
                "score": "0",
                "actions_today": "0",
            },
            on_conflict="ignore",
            target="tbl-read-rel-neg",
        ),
        make_bot_table_node("tbl-read-rel-neg", 1300, 500, "relationships", "read",
            where=[{"column": "pair_id", "value": "{user_id}_{reply_to_user_id}"}],
            save_to="rel",
            target="cond-limit-neg",
        ),
        make_node("cond-limit-neg", "condition", 1600, 500, {
            "variable": "rel.actions_today",
            "branches": [
                make_branch("br-lim-ok-neg", "< 3", "less_than", "3", "tbl-update-rel-neg"),
                make_branch("br-lim-fail-neg", "Иначе", "else", "", "msg-int-limit"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-update-rel-neg", 1900, 500, "relationships", "update",
            where=[{"column": "pair_id", "value": "{user_id}_{reply_to_user_id}"}],
            updates=[
                {"column": "score", "op": "decrement", "value": "5"},
                {"column": "actions_today", "op": "increment", "value": "1"},
            ],
            target="tbl-bonus-neg",
        ),
        make_bot_table_node("tbl-bonus-neg", 2200, 500, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "balance", "op": "increment", "value": "5"}],
            target="msg-neg-ok",
        ),
        make_node("msg-neg-ok", "message", 2500, 500, {
            "messageText": "👊 Вы пнули @{reply_to_username}! Отношения: {rel.score} | +5 🍪",
            "keyboardType": "none",
            "buttons": [],
        }),

        # Общие сообщения об ошибках
        make_node("msg-int-low-rep", "message", 1000, 800, {
            "messageText": "❌ Нужна репутация ≥ 80 для взаимодействий.",
            "keyboardType": "none",
            "buttons": [],
        }),
        make_node("msg-int-limit", "message", 1900, 800, {
            "messageText": "⏳ Лимит исчерпан (3/3). Попробуйте позже.",
            "keyboardType": "none",
            "buttons": [],
        }),
    ]
    return {"id": "sheet-interactions", "name": "🤝 Взаимодействия", "nodes": nodes}


def build_sheet_shop() -> dict:
    """
    Строит лист 4: Магазин.
    @returns словарь листа с узлами
    """
    nodes = [
        # /shop → сообщение с кнопками
        make_node("cmd-shop", "command_trigger", 100, 100, {
            "command": "/shop",
            "description": "Магазин",
            "showInMenu": True,
            "autoTransitionTo": "msg-shop",
        }),
        make_node("msg-shop", "message", 400, 100, {
            "messageText": (
                "🛒 Магазин:\n\n"
                "1️⃣ +10 репутации — 50 🍪\n"
                "2️⃣ Сброс лимитов (реп) — 100 🍪\n"
                "3️⃣ Сброс лимитов (взаимодействия) — 100 🍪\n"
                "4️⃣ Кастомный префикс — 200 🍪"
            ),
            "keyboardType": "inline",
            "buttons": [
                make_button("btn-buy-rep", "💫 +10 реп (50🍪)", "goto", target="tbl-shop-read-rep"),
                make_button("btn-buy-reset-rep", "🔄 Сброс реп (100🍪)", "goto", target="tbl-shop-read-reset-rep"),
                make_button("btn-buy-reset-int", "🔄 Сброс взаим. (100🍪)", "goto", target="tbl-shop-read-reset-int"),
                make_button("btn-buy-prefix", "🏷 Префикс (200🍪)", "goto", target="tbl-shop-read-prefix"),
            ],
        }),

        # Покупка +10 реп за 50🍪
        make_bot_table_node("tbl-shop-read-rep", 100, 400, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-buy-rep",
        ),
        make_node("cond-buy-rep", "condition", 400, 400, {
            "variable": "me.balance",
            "branches": [
                make_branch("br-buy-rep-ok", "≥ 50", "greater_than", "49", "tbl-buy-rep"),
                make_branch("br-buy-rep-fail", "Иначе", "else", "", "msg-no-money"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-buy-rep", 700, 400, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[
                {"column": "balance", "op": "decrement", "value": "50"},
                {"column": "reputation", "op": "increment", "value": "10"},
            ],
            target="msg-buy-ok",
        ),

        # Покупка сброса лимитов реп за 100🍪
        make_bot_table_node("tbl-shop-read-reset-rep", 100, 700, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-buy-reset-rep",
        ),
        make_node("cond-buy-reset-rep", "condition", 400, 700, {
            "variable": "me.balance",
            "branches": [
                make_branch("br-reset-rep-ok", "≥ 100", "greater_than", "99", "tbl-buy-reset-rep"),
                make_branch("br-reset-rep-fail", "Иначе", "else", "", "msg-no-money"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-buy-reset-rep", 700, 700, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[
                {"column": "balance", "op": "decrement", "value": "100"},
                {"column": "reputation", "op": "set", "value": "100"},
            ],
            target="msg-buy-ok",
        ),

        # Покупка сброса лимитов взаимодействий за 100🍪
        make_bot_table_node("tbl-shop-read-reset-int", 100, 1000, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-buy-reset-int",
        ),
        make_node("cond-buy-reset-int", "condition", 400, 1000, {
            "variable": "me.balance",
            "branches": [
                make_branch("br-reset-int-ok", "≥ 100", "greater_than", "99", "tbl-buy-reset-int"),
                make_branch("br-reset-int-fail", "Иначе", "else", "", "msg-no-money"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-buy-reset-int", 700, 1000, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[{"column": "balance", "op": "decrement", "value": "100"}],
            target="tbl-reset-actions",
        ),
        make_bot_table_node("tbl-reset-actions", 1000, 1000, "relationships", "update",
            where=[{"column": "user_a", "value": "{user_id}"}],
            updates=[{"column": "actions_today", "op": "set", "value": "0"}],
            target="msg-buy-ok",
        ),

        # Покупка кастомного префикса за 200🍪
        make_bot_table_node("tbl-shop-read-prefix", 100, 1300, "profiles", "read",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            save_to="me",
            target="cond-buy-prefix",
        ),
        make_node("cond-buy-prefix", "condition", 400, 1300, {
            "variable": "me.balance",
            "branches": [
                make_branch("br-prefix-ok", "≥ 200", "greater_than", "199", "tbl-buy-prefix"),
                make_branch("br-prefix-fail", "Иначе", "else", "", "msg-no-money"),
            ],
            "buttons": [],
            "keyboardType": "none",
        }),
        make_bot_table_node("tbl-buy-prefix", 700, 1300, "profiles", "update",
            where=[{"column": "telegram_id", "value": "{user_id}"}],
            updates=[
                {"column": "balance", "op": "decrement", "value": "200"},
                {"column": "prefix", "op": "set", "value": "{user_input}"},
            ],
            target="msg-buy-ok",
        ),

        # Общие сообщения
        make_node("msg-buy-ok", "message", 1000, 400, {
            "messageText": "✅ Покупка совершена!",
            "keyboardType": "none",
            "buttons": [],
        }),
        make_node("msg-no-money", "message", 1000, 600, {
            "messageText": "❌ Недостаточно 🍪 для покупки.",
            "keyboardType": "none",
            "buttons": [],
        }),
    ]
    return {"id": "sheet-shop", "name": "🛒 Магазин", "nodes": nodes}


def build_sheet_automation() -> dict:
    """
    Строит лист 5: Автоматизация (ежедневные сбросы).
    @returns словарь листа с узлами
    """
    nodes = [
        # Ежедневный сброс репутации до 50 (если < 50)
        make_node("sched-reset-rep", "schedule_trigger", 100, 100, {
            "rules": [{"mode": "weekday", "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "hour": 0, "minute": 0}],
            "timezone": "Europe/Moscow",
            "autoTransitionTo": "tbl-reset-rep-daily",
            "runOnStart": False,
            "enabled": True,
            "maxConcurrent": 1,
        }),
        make_bot_table_node("tbl-reset-rep-daily", 400, 100, "profiles", "update",
            where=[{"column": "reputation", "value": "50", "operator": "less_than"}],
            updates=[{"column": "reputation", "op": "set", "value": "50"}],
        ),

        # Ежедневный сброс лимитов взаимодействий
        make_node("sched-reset-actions", "schedule_trigger", 100, 400, {
            "rules": [{"mode": "weekday", "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "hour": 0, "minute": 0}],
            "timezone": "Europe/Moscow",
            "autoTransitionTo": "tbl-reset-actions-daily",
            "runOnStart": False,
            "enabled": True,
            "maxConcurrent": 1,
        }),
        make_bot_table_node("tbl-reset-actions-daily", 400, 400, "relationships", "update",
            where=[{"column": "actions_today", "value": "0", "operator": "greater_than"}],
            updates=[{"column": "actions_today", "op": "set", "value": "0"}],
        ),
    ]
    return {"id": "sheet-automation", "name": "⏰ Автоматизация", "nodes": nodes}


def build_project() -> dict:
    """
    Собирает полную структуру project.json.
    @returns словарь верхнего уровня проекта
    """
    sheets = [
        build_sheet_start(),
        build_sheet_reputation(),
        build_sheet_interactions(),
        build_sheet_shop(),
        build_sheet_automation(),
    ]
    return {
        "version": 2,
        "activeSheetId": "sheet-start",
        "sheets": sheets,
    }


def save_project(project: dict, output_path: str) -> None:
    """
    Сохраняет project.json на диск, создавая папку при необходимости.
    @param project - данные проекта
    @param output_path - путь к выходному файлу
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)


def print_report(project: dict) -> None:
    """
    Выводит краткий отчёт о созданных узлах.
    @param project - данные проекта
    """
    total = 0
    print("=== Групповой бот — отчёт ===\n")
    for sheet in project.get("sheets", []):
        count = len(sheet["nodes"])
        total += count
        print(f"Лист: [{sheet['id']}] {sheet['name']} — {count} узлов")
        for node in sheet["nodes"]:
            nid = node["id"]
            ntype = node["type"]
            x, y = node["position"]["x"], node["position"]["y"]
            print(f"  ✓ {nid:<30} тип={ntype:<20} pos=({x}, {y})")
        print()
    print(f"Всего узлов: {total}\n")


if __name__ == "__main__":
    OUTPUT = r"bots\сценарий\бот\project.json"

    project = build_project()
    save_project(project, OUTPUT)
    print_report(project)
    print(f"✅ Файл сохранён: {OUTPUT}")
