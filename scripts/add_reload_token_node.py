#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@fileoverview Скрипт добавления ноды reload-token и обновления кнопок.
Решает проблему: кнопка "К токену" из карточки пользователя передаёт
callback_data="fetch-token-status" вместо tokenId, что ломает запросы.
Решение: добавить ноду reload-token-status которая использует
{token_status.instance.tokenId} вместо {callback_data}.
"""
import json
import sys

PATH = "bots/импортированный_проект_2316_157_131/project.json"


def main() -> None:
    """
    Точка входа: добавляет ноду reload-token-status и обновляет кнопки.
    @returns None
    """
    print(f"Читаю файл: {PATH}")
    with open(PATH, encoding="utf-8") as f:
        project = json.load(f)

    # Ищем лист sheet-token-card
    token_sheet = next(
        (s for s in project["sheets"] if s.get("id") == "sheet-token-card"), None
    )
    if token_sheet is None:
        print("ОШИБКА: лист sheet-token-card не найден!")
        sys.exit(1)

    existing_ids = {n["id"] for n in token_sheet.get("nodes", [])}

    # --- Добавляем ноду reload-token-status ---
    # Это копия fetch-token-status но с {token_status.instance.tokenId} вместо {callback_data}
    reload_node_id = "reload-token-status"
    if reload_node_id not in existing_ids:
        reload_node = {
            "id": reload_node_id,
            "type": "http_request",
            "data": {
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
                    "sourceVariable": "", "callbackTemplate": ""
                },
                "httpRequestUrl": (
                    "http://localhost:5000/api/bot/tokens/"
                    "{token_status.instance.tokenId}/status?telegram_id={user_id}"
                ),
                "resizeKeyboard": True,
                "enableTextInput": False,
                "httpRequestBody": "",
                "oneTimeKeyboard": False,
                "autoTransitionTo": "reload-token-photo",
                "collectUserInput": False,
                "enableAudioInput": False,
                "enablePhotoInput": False,
                "enableStatistics": False,
                "enableVideoInput": False,
                "httpRequestMethod": "GET",
                "audioInputVariable": "",
                "httpRequestHeaders": "{}",
                "httpRequestTimeout": 10,
                "photoInputVariable": "",
                "videoInputVariable": "",
                "conditionalMessages": [],
                "enableDocumentInput": False,
                "enableAutoTransition": True,
                "enableDynamicButtons": False,
                "documentInputVariable": "",
                "enableConditionalMessages": False,
                "httpRequestStatusVariable": "token_status_code",
                "httpRequestResponseVariable": "token_status"
            },
            "position": {"x": 456, "y": 3400}
        }
        token_sheet["nodes"].append(reload_node)
        print(f"  + {reload_node_id}")
    else:
        print(f"  ~ {reload_node_id} (уже существует)")

    # --- Добавляем ноду reload-token-photo ---
    # Копия fetch-bot-photo но с {token_status.instance.tokenId}
    reload_photo_id = "reload-token-photo"
    if reload_photo_id not in existing_ids:
        reload_photo = {
            "id": reload_photo_id,
            "type": "http_request",
            "data": {
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
                    "sourceVariable": "", "callbackTemplate": ""
                },
                "httpRequestUrl": (
                    "http://localhost:5000/api/bot/tokens/"
                    "{token_status.instance.tokenId}/photo?telegram_id={user_id}"
                ),
                "resizeKeyboard": True,
                "enableTextInput": False,
                "httpRequestBody": "",
                "oneTimeKeyboard": False,
                "autoTransitionTo": "check-photo-exists",
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
                "httpRequestResponseFormat": "autodetect",
                "httpRequestStatusVariable": "bot_photo_status",
                "httpRequestResponseVariable": "bot_photo"
            },
            "position": {"x": 856, "y": 3400}
        }
        token_sheet["nodes"].append(reload_photo)
        print(f"  + {reload_photo_id}")
    else:
        print(f"  ~ {reload_photo_id} (уже существует)")

    # --- Обновляем кнопки "К токену" во всех листах ---
    # Меняем target с "fetch-token-status" на "reload-token-status"
    updated_buttons = 0
    for sheet in project["sheets"]:
        for node in sheet.get("nodes", []):
            for btn in node.get("data", {}).get("buttons", []):
                if btn.get("target") == "fetch-token-status" and btn.get("text", "").endswith("К токену"):
                    btn["target"] = "reload-token-status"
                    updated_buttons += 1
                    print(f"  ✓ Кнопка '{btn['text']}' в ноде '{node['id']}' → reload-token-status")

    print(f"Обновлено кнопок: {updated_buttons}")

    # Сохраняем
    output = json.dumps(project, ensure_ascii=False, indent=2)
    json.loads(output)  # валидация
    print("JSON валиден.")

    with open(PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(output)

    print(f"Файл успешно сохранён: {PATH}")


if __name__ == "__main__":
    main()
    sys.exit(0)
