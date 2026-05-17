"""
@fileoverview Скрипт для добавления функции "Сравнить курс" в бота новый_бот_1
@module tools/add_compare_rates

Добавляет:
1. Кнопку "💱 Сравнить курс" в главное меню
2. Новый лист "💱 Сравнение курсов" с полным флоу:
   - Выбор валютной пары (динамические кнопки из table.pairs)
   - Ввод суммы
   - Цикл по обменникам с HTTP-запросами
   - Вывод результатов
"""

import json
import sys
from pathlib import Path


def load_project(path: str) -> dict:
    """
    Загружает project.json
    @param path - путь к файлу
    @returns данные проекта
    """
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_project(path: str, project: dict) -> None:
    """
    Сохраняет project.json
    @param path - путь к файлу
    @param project - данные проекта
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)


def create_compare_rates_sheet() -> dict:
    """
    Создаёт лист "Сравнение курсов" с полным флоу
    @returns объект листа
    """
    return {
        "id": "sheet-compare-rates",
        "name": "💱 Сравнение курсов",
        "nodes": [
            {
                "id": "msg-compare-menu",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "formatMode": "html",
                    "showInMenu": False,
                    "messageText": "💱 <b>Сравнение курсов обменников</b>\n\nВыбери валютную пару для сравнения:",
                    "keyboardType": "none",
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
                        "callbackTemplate": ""
                    },
                    "keyboardNodeId": "kb-compare-menu",
                    "resizeKeyboard": True,
                    "enableTextInput": False,
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "",
                    "collectUserInput": False,
                    "enableAudioInput": False,
                    "enablePhotoInput": False,
                    "enableStatistics": True,
                    "enableVideoInput": False,
                    "audioInputVariable": "",
                    "photoInputVariable": "",
                    "videoInputVariable": "",
                    "conditionalMessages": [],
                    "enableDocumentInput": False,
                    "enableAutoTransition": False,
                    "enableDynamicButtons": False,
                    "documentInputVariable": "",
                    "enableConditionalMessages": False
                },
                "type": "message",
                "position": {"x": 400, "y": 300}
            },
            {
                "id": "kb-compare-menu",
                "data": {
                    "buttons": [
                        {
                            "id": "btn-compare-back",
                            "text": "◀️ Назад в меню",
                            "action": "goto",
                            "target": "start_dup_1775330630988_2w4z6c8t9",
                            "buttonType": "normal",
                            "hideAfterClick": False,
                            "skipDataCollection": False
                        }
                    ],
                    "markdown": False,
                    "adminOnly": False,
                    "showInMenu": False,
                    "messageText": "",
                    "keyboardType": "inline",
                    "requiresAuth": False,
                    "isPrivateOnly": False,
                    "dynamicButtons": {
                        "columns": 2,
                        "arrayPath": "",
                        "styleMode": "none",
                        "styleField": "",
                        "textTemplate": "{emoji_from} {from_name} → {emoji_to} {to_name}",
                        "styleTemplate": "",
                        "sourceVariable": "table.pairs",
                        "callbackTemplate": "compare_{from_id}_{to_id}"
                    },
                    "keyboardLayout": {
                        "rows": [
                            {
                                "buttonIds": ["__dynamic__", "btn-compare-back"]
                            }
                        ],
                        "columns": 2,
                        "autoLayout": True
                    },
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "enableStatistics": False,
                    "enableDynamicButtons": True
                },
                "type": "keyboard",
                "position": {"x": 800, "y": 300}
            },
            {
                "id": "cb-compare-pair",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "matchType": "startswith",
                    "showInMenu": False,
                    "messageText": "",
                    "callbackData": "compare_",
                    "keyboardType": "none",
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
                        "callbackTemplate": ""
                    },
                    "resizeKeyboard": True,
                    "callbackPattern": "compare_",
                    "enableTextInput": False,
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "msg-compare-ask-amount",
                    "collectUserInput": False,
                    "enableAudioInput": False,
                    "enablePhotoInput": False,
                    "enableStatistics": False,
                    "enableVideoInput": False,
                    "callbackMatchMode": "startsWith",
                    "conditionalMessages": [],
                    "enableDocumentInput": False,
                    "enableAutoTransition": True,
                    "enableDynamicButtons": False,
                    "callbackParseTemplate": "compare_{from_id}_{to_id}",
                    "callbackSaveVariables": [
                        {"saveAs": "selected_from_id", "templateVar": "from_id"},
                        {"saveAs": "selected_to_id", "templateVar": "to_id"}
                    ],
                    "enableConditionalMessages": False
                },
                "type": "callback_trigger",
                "position": {"x": 400, "y": 600}
            },
            {
                "id": "msg-compare-ask-amount",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "formatMode": "html",
                    "showInMenu": False,
                    "messageText": "💰 Введи сумму для сравнения:\n\nНапример: <b>10000</b> (в рублях)",
                    "keyboardType": "none",
                    "requiresAuth": False,
                    "inputVariable": "user_amount",
                    "isPrivateOnly": False,
                    "dynamicButtons": {
                        "columns": 2,
                        "arrayPath": "",
                        "styleMode": "none",
                        "styleField": "",
                        "textTemplate": "",
                        "styleTemplate": "",
                        "sourceVariable": "",
                        "callbackTemplate": ""
                    },
                    "resizeKeyboard": True,
                    "enableTextInput": True,
                    "oneTimeKeyboard": False,
                    "variableFilters": {},
                    "autoTransitionTo": "input-compare-amount",
                    "collectUserInput": True,
                    "enableAudioInput": False,
                    "enablePhotoInput": False,
                    "enableStatistics": False,
                    "enableVideoInput": False,
                    "conditionalMessages": [],
                    "enableDocumentInput": False,
                    "enableAutoTransition": True,
                    "enableDynamicButtons": False,
                    "enableConditionalMessages": False
                },
                "type": "message",
                "position": {"x": 800, "y": 600}
            },
            {
                "id": "input-compare-amount",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "inputType": "text",
                    "showInMenu": False,
                    "inputPrompt": "Введите сумму",
                    "messageText": "",
                    "keyboardType": "none",
                    "requiresAuth": False,
                    "inputRequired": True,
                    "inputVariable": "user_amount",
                    "isPrivateOnly": False,
                    "appendVariable": False,
                    "resizeKeyboard": True,
                    "saveToDatabase": False,
                    "oneTimeKeyboard": False,
                    "enableStatistics": True,
                    "inputTargetNodeId": "setv-compare-init"
                },
                "type": "input",
                "position": {"x": 1200, "y": 600}
            },
            {
                "id": "setv-compare-init",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "showInMenu": False,
                    "assignments": [
                        {
                            "id": "cmp1",
                            "mode": "text",
                            "value": "",
                            "variable": "rates_text"
                        }
                    ],
                    "messageText": "",
                    "keyboardType": "none",
                    "requiresAuth": False,
                    "isPrivateOnly": False,
                    "dynamicButtons": {
                        "columns": 2,
                        "arrayPath": "",
                        "styleMode": "none",
                        "styleField": "",
                        "textTemplate": "",
                        "styleTemplate": "",
                        "sourceVariable": "",
                        "callbackTemplate": ""
                    },
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "loop-compare-exchangers",
                    "enableStatistics": False,
                    "conditionalMessages": [],
                    "enableAutoTransition": True,
                    "enableDynamicButtons": False,
                    "enableConditionalMessages": False
                },
                "type": "set_variable",
                "position": {"x": 1600, "y": 600}
            },
            {
                "id": "loop-compare-exchangers",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "parallel": False,
                    "adminOnly": False,
                    "showInMenu": False,
                    "afterLoopTo": "msg-compare-result",
                    "messageText": "",
                    "delaySeconds": 0,
                    "itemVariable": "exchanger",
                    "keyboardType": "none",
                    "requiresAuth": False,
                    "indexVariable": "exch_index",
                    "isPrivateOnly": False,
                    "maxIterations": 0,
                    "resizeKeyboard": True,
                    "sourceVariable": "table.exchangers",
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "fetch-compare-rate",
                    "enableStatistics": True
                },
                "type": "loop",
                "position": {"x": 2000, "y": 600}
            },
            {
                "id": "fetch-compare-rate",
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
                        "columns": 2,
                        "arrayPath": "",
                        "styleMode": "none",
                        "styleField": "",
                        "textTemplate": "",
                        "styleTemplate": "",
                        "sourceVariable": "",
                        "callbackTemplate": ""
                    },
                    "httpRequestUrl": "{exchanger.url}",
                    "resizeKeyboard": True,
                    "enableTextInput": False,
                    "httpRequestBody": "",
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "setv-compare-extract",
                    "collectUserInput": False,
                    "enableAudioInput": False,
                    "enablePhotoInput": False,
                    "enableStatistics": False,
                    "enableVideoInput": False,
                    "httpRequestMethod": "GET",
                    "httpRequestHeaders": "",
                    "httpRequestTimeout": 15,
                    "conditionalMessages": [],
                    "enableDocumentInput": False,
                    "httpRequestAuthType": "none",
                    "enableAutoTransition": True,
                    "enableDynamicButtons": False,
                    "httpRequestIgnoreSsl": False,
                    "httpRequestBodyFormat": "json",
                    "enableConditionalMessages": False,
                    "httpRequestResponseFormat": "autodetect",
                    "httpRequestStatusVariable": "s_exch",
                    "httpRequestFollowRedirects": True,
                    "httpRequestIgnoreHttpErrors": True,
                    "httpRequestResponseVariable": "r_exch"
                },
                "type": "http_request",
                "position": {"x": 2400, "y": 600}
            },
            {
                "id": "setv-compare-extract",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "showInMenu": False,
                    "assignments": [
                        {
                            "id": "cmp2",
                            "mode": "text",
                            "value": "{r_exch.exchange.{selected_from_id}.to.{selected_to_id}}",
                            "variable": "current_rate"
                        },
                        {
                            "id": "cmp3",
                            "mode": "expression",
                            "value": "{current_rate} * {user_amount}",
                            "variable": "exchange_result"
                        },
                        {
                            "id": "cmp4",
                            "mode": "text",
                            "value": "{rates_text}🔸 <b>{exchanger.name}</b>: {exchange_result} ₽\n",
                            "variable": "rates_text"
                        }
                    ],
                    "messageText": "",
                    "keyboardType": "none",
                    "requiresAuth": False,
                    "isPrivateOnly": False,
                    "dynamicButtons": {
                        "columns": 2,
                        "arrayPath": "",
                        "styleMode": "none",
                        "styleField": "",
                        "textTemplate": "",
                        "styleTemplate": "",
                        "sourceVariable": "",
                        "callbackTemplate": ""
                    },
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "",
                    "enableStatistics": False,
                    "conditionalMessages": [],
                    "enableAutoTransition": False,
                    "enableDynamicButtons": False,
                    "enableConditionalMessages": False
                },
                "type": "set_variable",
                "position": {"x": 2800, "y": 600}
            },
            {
                "id": "msg-compare-result",
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "formatMode": "html",
                    "showInMenu": False,
                    "messageText": "💱 <b>Сравнение курсов</b>\n\n💰 Сумма: <b>{user_amount}</b> ₽\n\n{rates_text}\n<i>Данные получены от подключённых обменников</i>",
                    "keyboardType": "none",
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
                        "callbackTemplate": ""
                    },
                    "keyboardNodeId": "kb-compare-result",
                    "resizeKeyboard": True,
                    "enableTextInput": False,
                    "oneTimeKeyboard": False,
                    "autoTransitionTo": "",
                    "collectUserInput": False,
                    "enableAudioInput": False,
                    "enablePhotoInput": False,
                    "enableStatistics": True,
                    "enableVideoInput": False,
                    "audioInputVariable": "",
                    "photoInputVariable": "",
                    "videoInputVariable": "",
                    "conditionalMessages": [],
                    "enableDocumentInput": False,
                    "enableAutoTransition": False,
                    "enableDynamicButtons": False,
                    "documentInputVariable": "",
                    "enableConditionalMessages": False
                },
                "type": "message",
                "position": {"x": 2000, "y": 900}
            },
            {
                "id": "kb-compare-result",
                "data": {
                    "buttons": [
                        {
                            "id": "btn-compare-another",
                            "text": "🔄 Другая пара",
                            "action": "goto",
                            "target": "msg-compare-menu",
                            "buttonType": "normal",
                            "hideAfterClick": False,
                            "skipDataCollection": False
                        },
                        {
                            "id": "btn-compare-back-menu",
                            "text": "◀️ В главное меню",
                            "action": "goto",
                            "target": "start_dup_1775330630988_2w4z6c8t9",
                            "buttonType": "normal",
                            "hideAfterClick": False,
                            "skipDataCollection": False
                        }
                    ],
                    "markdown": False,
                    "adminOnly": False,
                    "showInMenu": False,
                    "messageText": "",
                    "keyboardType": "inline",
                    "requiresAuth": False,
                    "isPrivateOnly": False,
                    "dynamicButtons": {
                        "columns": 2,
                        "arrayPath": "",
                        "styleMode": "none",
                        "styleField": "",
                        "textTemplate": "",
                        "styleTemplate": "",
                        "sourceVariable": "",
                        "callbackTemplate": ""
                    },
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "enableStatistics": False,
                    "enableDynamicButtons": False
                },
                "type": "keyboard",
                "position": {"x": 2400, "y": 900}
            }
        ],
        "createdAt": "2026-05-17T10:00:00.000Z",
        "updatedAt": "2026-05-17T10:00:00.000Z",
        "viewState": {
            "zoom": 0.7,
            "position": {"x": 0, "y": 0}
        }
    }


def add_compare_button(project: dict) -> None:
    """
    Добавляет кнопку "Сравнить курс" в главное меню
    @param project - данные проекта (мутируется)
    """
    main_sheet = project["sheets"][0]
    for node in main_sheet["nodes"]:
        if node["id"] == "start_keyboard_1774974624659_mvun7q4ps_dup_1775330630989_e14cws36e":
            # Добавляем кнопку
            new_button = {
                "id": "btn-compare-rates",
                "text": "💱 Сравнить курс",
                "style": "success",
                "action": "goto",
                "target": "msg-compare-menu",
                "buttonType": "normal",
                "hideAfterClick": False,
                "skipDataCollection": False
            }
            node["data"]["buttons"].append(new_button)

            # Добавляем ряд в layout перед последним рядом (Crypto Pay)
            layout = node["data"]["keyboardLayout"]
            # Вставляем новый ряд перед последним
            new_row = {"buttonIds": ["btn-compare-rates"]}
            layout["rows"].append(new_row)

            print("✅ Кнопка 'Сравнить курс' добавлена в главное меню")
            return

    print("❌ Не найден keyboard главного меню")


def main():
    """
    Основная функция — модифицирует project.json
    """
    path = sys.argv[1] if len(sys.argv) > 1 else "bots/новый_бот_1_242_154/project.json"

    project = load_project(path)

    # 1. Добавляем кнопку в главное меню
    add_compare_button(project)

    # 2. Добавляем новый лист
    compare_sheet = create_compare_rates_sheet()
    project["sheets"].append(compare_sheet)
    print(f"✅ Лист '{compare_sheet['name']}' добавлен ({len(compare_sheet['nodes'])} узлов)")

    # 3. Сохраняем
    save_project(path, project)
    print(f"✅ Файл сохранён: {path}")


if __name__ == "__main__":
    main()
