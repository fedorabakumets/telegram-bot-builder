#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@fileoverview Скрипт добавления карточки пользователя в project.json.
Этап 2: карточка пользователя с аватаркой, кнопки действий.
Добавляет ноды в лист sheet-users: триггер, запрос деталей,
условия, сообщения с фото и без, клавиатуры.
"""
import json
import sys

PATH = "bots/импортированный_проект_2316_157_131/project.json"


def make_node(node_id: str, node_type: str, data: dict, position: dict) -> dict:
    """
    Создаёт структуру ноды для project.json.
    @param node_id - Уникальный идентификатор ноды
    @param node_type - Тип ноды
    @param data - Данные ноды
    @param position - Позиция на холсте {x, y}
    @returns Словарь с полями id, type, data, position
    """
    return {"id": node_id, "type": node_type, "data": data, "position": position}


def make_dynamic_buttons_base() -> dict:
    """
    Возвращает базовую структуру dynamicButtons.
    @returns Словарь с дефолтными полями динамических кнопок
    """
    return {
        "columns": 2,
        "arrayPath": "",
        "styleMode": "none",
        "styleField": "",
        "textTemplate": "",
        "styleTemplate": "",
        "sourceVariable": "",
        "callbackTemplate": "",
    }


def make_keyboard_base() -> dict:
    """
    Возвращает базовую структуру данных для ноды типа keyboard.
    @returns Словарь с дефолтными полями клавиатуры
    """
    return {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "inline",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": False,
        "enableVideoInput": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": False,
        "enableDynamicButtons": False,
        "documentInputVariable": "",
        "enableConditionalMessages": False,
    }


def build_user_card_nodes() -> list:
    """
    Строит список нод карточки пользователя (этап 2).
    @returns Список нод для добавления в лист sheet-users
    """
    nodes = []

    # --- Нода 1: incoming-user-trigger (incoming_callback_trigger) ---
    trigger_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "callbackPattern": "user_",
        "callbackMatchType": "startsWith",
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "autoTransitionTo": "fetch-user-detail",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": False,
        "enableVideoInput": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": True,
        "enableDynamicButtons": False,
        "documentInputVariable": "",
        "enableConditionalMessages": False,
    }
    nodes.append(make_node(
        "incoming-user-trigger",
        "incoming_callback_trigger",
        trigger_data,
        {"x": 100, "y": 1200},
    ))

    # --- Нода 2: fetch-user-detail (http_request) ---
    fetch_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "httpRequestUrl": (
            "http://localhost:5000/api/bot/tokens/"
            "{token_status.instance.tokenId}/users/{callback_data}"
            "?telegram_id={user_id}"
        ),
        "resizeKeyboard": True,
        "enableTextInput": False,
        "httpRequestBody": "",
        "oneTimeKeyboard": False,
        "autoTransitionTo": "check-user-detail-status",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": False,
        "enableVideoInput": False,
        "httpRequestMethod": "GET",
        "audioInputVariable": "",
        "httpRequestHeaders": "{}",
        "httpRequestTimeout": 15,
        "photoInputVariable": "",
        "videoInputVariable": "",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": True,
        "enableDynamicButtons": False,
        "documentInputVariable": "",
        "enableConditionalMessages": False,
        "httpRequestStatusVariable": "user_detail_status",
        "httpRequestResponseVariable": "user_detail",
    }
    nodes.append(make_node(
        "fetch-user-detail",
        "http_request",
        fetch_data,
        {"x": 500, "y": 1200},
    ))

    # --- Нода 3: check-user-detail-status (condition) ---
    check_status_data = {
        "buttons": [],
        "branches": [
            {
                "id": "ok",
                "label": "= 200",
                "value": "200",
                "target": "check-user-photo",
                "operator": "equals",
            },
            {
                "id": "else",
                "label": "Иначе",
                "value": "",
                "target": "user-detail-error-msg",
                "operator": "else",
            },
        ],
        "markdown": False,
        "variable": "user_detail_status",
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": False,
        "conditionalMessages": [],
        "enableDynamicButtons": False,
        "enableConditionalMessages": False,
    }
    nodes.append(make_node(
        "check-user-detail-status",
        "condition",
        check_status_data,
        {"x": 900, "y": 1200},
    ))

    # --- Нода 4: check-user-photo (condition) ---
    check_photo_data = {
        "buttons": [],
        "branches": [
            {
                "id": "no-photo",
                "label": "= \"\"",
                "value": "",
                "target": "user-card-msg",
                "operator": "equals",
            },
            {
                "id": "has-photo",
                "label": "Иначе",
                "value": "",
                "target": "user-card-with-photo",
                "operator": "else",
            },
        ],
        "markdown": False,
        "variable": "user_detail.photoUrl",
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": False,
        "conditionalMessages": [],
        "enableDynamicButtons": False,
        "enableConditionalMessages": False,
    }
    nodes.append(make_node(
        "check-user-photo",
        "condition",
        check_photo_data,
        {"x": 1300, "y": 1200},
    ))

    # Текст карточки пользователя (общий для обеих нод сообщений)
    card_text = (
        "👤 <b>{user_detail.firstName} (@{user_detail.userName})</b>\n\n"
        "📅 Зарегистрирован: {user_detail.registeredAt}\n"
        "🕐 Последняя активность: {user_detail.lastInteraction}\n"
        "💬 Взаимодействий: {user_detail.interactionCount}\n"
        "✅ Статус: Активен"
    )

    # --- Нода 5: user-card-with-photo (message, с фото) ---
    card_photo_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "messageText": card_text,
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "imageUrl": "{user_detail.photoUrl}",
        "keyboardNodeId": "user-actions-keyboard",
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "variableFilters": {},
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enablePhotoAttachment": True,
        "enableStatistics": False,
        "enableVideoInput": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": False,
        "enableDynamicButtons": False,
        "documentInputVariable": "",
        "enableConditionalMessages": False,
    }
    nodes.append(make_node(
        "user-card-with-photo",
        "message",
        card_photo_data,
        {"x": 1700, "y": 1000},
    ))

    # --- Нода 6: user-card-msg (message, без фото) ---
    card_msg_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "messageText": card_text,
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "keyboardNodeId": "user-actions-keyboard",
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "variableFilters": {},
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": False,
        "enableVideoInput": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": False,
        "enableDynamicButtons": False,
        "documentInputVariable": "",
        "enableConditionalMessages": False,
    }
    nodes.append(make_node(
        "user-card-msg",
        "message",
        card_msg_data,
        {"x": 1700, "y": 1300},
    ))

    # --- Нода 7: user-actions-keyboard (keyboard) ---
    actions_kb_data = make_keyboard_base()
    actions_kb_data["buttons"] = [
        {
            "id": "btn-back-to-users",
            "text": "◀️ К списку",
            "action": "goto",
            "target": "fetch-bot-users",
            "hideAfterClick": False,
            "skipDataCollection": False,
        }
    ]
    nodes.append(make_node(
        "user-actions-keyboard",
        "keyboard",
        actions_kb_data,
        {"x": 2100, "y": 1200},
    ))

    # --- Нода 8: user-detail-error-msg (message) ---
    error_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "messageText": "❌ Не удалось загрузить данные пользователя.",
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": make_dynamic_buttons_base(),
        "keyboardNodeId": "users-back-keyboard",
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "variableFilters": {},
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": False,
        "enableVideoInput": False,
        "audioInputVariable": "",
        "photoInputVariable": "",
        "videoInputVariable": "",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": False,
        "enableDynamicButtons": False,
        "documentInputVariable": "",
        "enableConditionalMessages": False,
    }
    nodes.append(make_node(
        "user-detail-error-msg",
        "message",
        error_data,
        {"x": 900, "y": 1400},
    ))

    return nodes


def main() -> None:
    """
    Точка входа: читает project.json, добавляет ноды этапа 2 в sheet-users.
    @returns None
    """
    print(f"Читаю файл: {PATH}")
    with open(PATH, encoding="utf-8") as f:
        project = json.load(f)

    sheets: list = project["sheets"]

    # Ищем лист sheet-users
    users_sheet = next((s for s in sheets if s.get("id") == "sheet-users"), None)
    if users_sheet is None:
        print("ОШИБКА: лист sheet-users не найден!")
        sys.exit(1)

    existing_ids = {n["id"] for n in users_sheet.get("nodes", [])}
    print(f"Существующие ноды в sheet-users: {sorted(existing_ids)}")

    new_nodes = build_user_card_nodes()
    added = []
    skipped = []

    for node in new_nodes:
        if node["id"] in existing_ids:
            skipped.append(node["id"])
        else:
            users_sheet["nodes"].append(node)
            added.append(node["id"])

    if added:
        print(f"Добавлено нод: {len(added)}")
        for nid in added:
            print(f"  + {nid}")
    if skipped:
        print(f"Пропущено (уже существуют): {len(skipped)}")
        for nid in skipped:
            print(f"  ~ {nid}")

    # Сохраняем с ensure_ascii=False
    output = json.dumps(project, ensure_ascii=False, indent=2)

    # Валидация перед записью
    json.loads(output)
    print("JSON валиден.")

    with open(PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(output)

    print(f"Файл успешно сохранён: {PATH}")


if __name__ == "__main__":
    main()
    sys.exit(0)
