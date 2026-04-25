#!/usr/bin/env python3
"""
@fileoverview Скрипт добавления листа управления пользователями в project.json.
Этап 1: список пользователей + кнопка в карточке токена.
Добавляет кнопку "👤 Пользователи" в клавиатуры токена и новый лист sheet-users.
"""
import json
import sys

PATH = "bots/импортированный_проект_2316_157_131/project.json"


def make_node(node_id: str, node_type: str, data: dict, position: dict) -> dict:
    """
    Создаёт структуру ноды для project.json.
    @param node_id - Уникальный идентификатор ноды
    @param node_type - Тип ноды (http_request, condition, message, keyboard)
    @param data - Данные ноды
    @param position - Позиция ноды на холсте {x, y}
    @returns Словарь с полями id, type, data, position
    """
    return {"id": node_id, "type": node_type, "data": data, "position": position}


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
        "dynamicButtons": {
            "columns": 2,
            "arrayPath": "",
            "styleMode": "none",
            "styleField": "",
            "textTemplate": "",
            "styleTemplate": "",
            "sourceVariable": "",
            "callbackTemplate": "",
        },
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


def build_users_sheet() -> dict:
    """
    Строит полный лист "Пользователи" со всеми нодами.
    @returns Словарь листа с id, name и массивом nodes
    """
    nodes = []

    # --- Нода 1: fetch-bot-users (http_request) ---
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
        "dynamicButtons": {
            "columns": 2, "arrayPath": "", "styleMode": "none",
            "styleField": "", "textTemplate": "", "styleTemplate": "",
            "sourceVariable": "", "callbackTemplate": "",
        },
        "httpRequestUrl": (
            "http://localhost:5000/api/projects/{project_detail.id}"
            "/users?tokenId={token_status.instance.tokenId}&limit=10&offset=0"
        ),
        "resizeKeyboard": True,
        "enableTextInput": False,
        "httpRequestBody": "",
        "oneTimeKeyboard": False,
        "autoTransitionTo": "check-users-status",
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
        "httpRequestStatusVariable": "users_status",
        "httpRequestResponseVariable": "users_data",
    }
    nodes.append(make_node("fetch-bot-users", "http_request", fetch_data, {"x": 100, "y": 600}))

    # --- Нода 2: check-users-status (condition) ---
    check_status_data = {
        "buttons": [],
        "branches": [
            {"id": "ok", "label": "= 200", "value": "200",
             "target": "check-users-empty", "operator": "equals"},
            {"id": "else", "label": "Иначе", "value": "",
             "target": "users-error-msg", "operator": "else"},
        ],
        "markdown": False,
        "variable": "users_status",
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "dynamicButtons": {
            "columns": 2, "arrayPath": "", "styleMode": "none",
            "styleField": "", "textTemplate": "", "styleTemplate": "",
            "sourceVariable": "", "callbackTemplate": "",
        },
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": False,
        "conditionalMessages": [],
        "enableDynamicButtons": False,
        "enableConditionalMessages": False,
    }
    nodes.append(make_node("check-users-status", "condition", check_status_data, {"x": 500, "y": 600}))

    # --- Нода 3: check-users-empty (condition) ---
    check_empty_data = {
        "buttons": [],
        "branches": [
            {"id": "has-users", "label": "> 0", "value": "0",
             "target": "users-list-msg", "operator": "greater_than"},
            {"id": "else", "label": "Иначе", "value": "",
             "target": "no-users-msg", "operator": "else"},
        ],
        "markdown": False,
        "variable": "users_data.length",
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "dynamicButtons": {
            "columns": 2, "arrayPath": "", "styleMode": "none",
            "styleField": "", "textTemplate": "", "styleTemplate": "",
            "sourceVariable": "", "callbackTemplate": "",
        },
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": False,
        "conditionalMessages": [],
        "enableDynamicButtons": False,
        "enableConditionalMessages": False,
    }
    nodes.append(make_node("check-users-empty", "condition", check_empty_data, {"x": 900, "y": 600}))

    # --- Нода 4: users-list-msg (message) ---
    list_msg_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "messageText": (
            "\U0001f465 <b>\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438 "
            "\u0431\u043e\u0442\u0430:</b>\n\n"
            "\u0412\u0441\u0435\u0433\u043e: {users_data.length}\n\n"
            "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043e\u043b\u044c\u0437\u043e"
            "\u0432\u0430\u0442\u0435\u043b\u044f \u0438\u0437 \u0441\u043f\u0438\u0441\u043a\u0430:"
        ),
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": {
            "columns": 2, "arrayPath": "", "styleMode": "none",
            "styleField": "", "textTemplate": "", "styleTemplate": "",
            "sourceVariable": "", "callbackTemplate": "",
        },
        "keyboardNodeId": "users-list-keyboard",
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
    nodes.append(make_node("users-list-msg", "message", list_msg_data, {"x": 1300, "y": 600}))

    # --- Нода 5: users-list-keyboard (keyboard) ---
    list_kb_data = make_keyboard_base()
    list_kb_data["buttons"] = [
        {
            "id": "btn-back-to-token",
            "text": "\u25c0\ufe0f \u041a \u0442\u043e\u043a\u0435\u043d\u0443",
            "action": "goto",
            "target": "fetch-token-status",
            "hideAfterClick": False,
            "skipDataCollection": False,
        }
    ]
    list_kb_data["enableDynamicButtons"] = True
    list_kb_data["dynamicButtons"] = {
        "columns": 1,
        "arrayPath": "",
        "styleMode": "none",
        "styleField": "",
        "textTemplate": "{firstName} {lastName} (@{userName})",
        "styleTemplate": "",
        "sourceVariable": "users_data",
        "callbackTemplate": "user_{userId}",
    }
    nodes.append(make_node("users-list-keyboard", "keyboard", list_kb_data, {"x": 1700, "y": 600}))

    # --- Нода 6: no-users-msg (message) ---
    no_users_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "messageText": (
            "\U0001f464 \u0423 \u044d\u0442\u043e\u0433\u043e \u0431\u043e\u0442\u0430 "
            "\u043f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043f\u043e\u043b\u044c\u0437\u043e"
            "\u0432\u0430\u0442\u0435\u043b\u0435\u0439."
        ),
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": {
            "columns": 2, "arrayPath": "", "styleMode": "none",
            "styleField": "", "textTemplate": "", "styleTemplate": "",
            "sourceVariable": "", "callbackTemplate": "",
        },
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
    nodes.append(make_node("no-users-msg", "message", no_users_data, {"x": 1300, "y": 900}))

    # --- Нода 7: users-error-msg (message) ---
    error_msg_data = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "messageText": (
            "\u274c \u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440"
            "\u0443\u0437\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442"
            "\u0435\u043b\u0435\u0439. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 "
            "\u043f\u043e\u0437\u0436\u0435."
        ),
        "keyboardType": "none",
        "requiresAuth": False,
        "inputVariable": "",
        "isPrivateOnly": False,
        "dynamicButtons": {
            "columns": 2, "arrayPath": "", "styleMode": "none",
            "styleField": "", "textTemplate": "", "styleTemplate": "",
            "sourceVariable": "", "callbackTemplate": "",
        },
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
    nodes.append(make_node("users-error-msg", "message", error_msg_data, {"x": 900, "y": 900}))

    # --- Нода 8: users-back-keyboard (keyboard) ---
    back_kb_data = make_keyboard_base()
    back_kb_data["buttons"] = [
        {
            "id": "btn-users-back-to-token",
            "text": "\u25c0\ufe0f \u041a \u0442\u043e\u043a\u0435\u043d\u0443",
            "action": "goto",
            "target": "fetch-token-status",
            "hideAfterClick": False,
            "skipDataCollection": False,
        }
    ]
    nodes.append(make_node("users-back-keyboard", "keyboard", back_kb_data, {"x": 1700, "y": 900}))

    return {
        "id": "sheet-users",
        "name": "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438",
        "nodes": nodes,
        "createdAt": "2026-04-21T18:00:00.000Z",
        "updatedAt": "2026-04-21T18:00:00.000Z",
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }


def add_users_button_to_keyboard(keyboard_node: dict, btn_id: str) -> None:
    """
    Добавляет кнопку "👤 Пользователи" в клавиатуру токена перед кнопкой Администраторы.
    @param keyboard_node - Нода клавиатуры из project.json
    @param btn_id - ID новой кнопки (running или stopped вариант)
    """
    data = keyboard_node["data"]
    buttons: list = data["buttons"]

    # Определяем id кнопки Администраторы для данной клавиатуры
    admins_btn_id = btn_id.replace("users", "admins")

    new_button = {
        "id": btn_id,
        "text": "\U0001f464 \u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438",
        "action": "goto",
        "target": "fetch-bot-users",
        "hideAfterClick": False,
        "skipDataCollection": False,
    }

    # Вставляем перед кнопкой Администраторы
    admins_index = next(
        (i for i, b in enumerate(buttons) if b.get("id") == admins_btn_id), len(buttons)
    )
    buttons.insert(admins_index, new_button)

    # Обновляем keyboardLayout.rows — вставляем строку перед строкой с admins_btn_id
    layout = data.get("keyboardLayout")
    if layout and "rows" in layout:
        rows: list = layout["rows"]
        admins_row_index = next(
            (i for i, r in enumerate(rows) if admins_btn_id in r.get("buttonIds", [])),
            len(rows),
        )
        rows.insert(admins_row_index, {"buttonIds": [btn_id]})


def main() -> None:
    """
    Точка входа: читает project.json, вносит изменения и сохраняет файл.
    @returns None
    """
    print(f"Читаю файл: {PATH}")
    with open(PATH, encoding="utf-8") as f:
        project = json.load(f)

    sheets: list = project["sheets"]

    # Проверяем, не добавлен ли лист уже
    if any(s.get("id") == "sheet-users" for s in sheets):
        print("Лист sheet-users уже существует — пропускаю добавление листа.")
    else:
        sheets.append(build_users_sheet())
        print("Лист 'Пользователи' добавлен.")

    # Обновляем клавиатуры токена во всех листах
    running_updated = False
    stopped_updated = False

    for sheet in sheets:
        for node in sheet.get("nodes", []):
            nid = node.get("id")
            if nid == "token-actions-keyboard-running" and not running_updated:
                # Проверяем, не добавлена ли кнопка уже
                existing_ids = [b["id"] for b in node["data"]["buttons"]]
                if "btn-token-users-running" not in existing_ids:
                    add_users_button_to_keyboard(node, "btn-token-users-running")
                    print("Кнопка 'Пользователи' добавлена в token-actions-keyboard-running.")
                else:
                    print("Кнопка btn-token-users-running уже существует — пропускаю.")
                running_updated = True

            elif nid == "token-actions-keyboard-stopped" and not stopped_updated:
                existing_ids = [b["id"] for b in node["data"]["buttons"]]
                if "btn-token-users-stopped" not in existing_ids:
                    add_users_button_to_keyboard(node, "btn-token-users-stopped")
                    print("Кнопка 'Пользователи' добавлена в token-actions-keyboard-stopped.")
                else:
                    print("Кнопка btn-token-users-stopped уже существует — пропускаю.")
                stopped_updated = True

    if not running_updated:
        print("ПРЕДУПРЕЖДЕНИЕ: нода token-actions-keyboard-running не найдена!")
    if not stopped_updated:
        print("ПРЕДУПРЕЖДЕНИЕ: нода token-actions-keyboard-stopped не найдена!")

    # Сохраняем файл
    output = json.dumps(project, ensure_ascii=False, indent=2)

    # Проверяем валидность JSON перед записью
    json.loads(output)
    print("JSON валиден.")

    with open(PATH, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Файл успешно сохранён: {PATH}")


if __name__ == "__main__":
    main()
    sys.exit(0)
