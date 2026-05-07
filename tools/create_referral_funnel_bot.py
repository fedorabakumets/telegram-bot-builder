"""
@fileoverview Генератор project.json для бота с реферальной воронкой и проверкой подписки
@module tools/create_referral_funnel_bot
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
    @param label - метка ветки для отображения
    @param operator - оператор сравнения (equals, is_subscribed, else и т.д.)
    @param value - значение для сравнения
    @param target - ID узла-цели при совпадении
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
    @param node_type - тип узла (command_trigger, message, condition, media и т.д.)
    @param x - позиция по горизонтали на холсте
    @param y - позиция по вертикали на холсте
    @param data - данные узла (зависят от типа)
    @returns словарь с полным описанием узла
    """
    return {
        "id": node_id,
        "type": node_type,
        "position": {"x": x, "y": y},
        "data": data,
    }


def build_nodes() -> list[dict]:
    """
    Строит список всех узлов воронки.
    @returns список узлов сценария
    """
    # Узел 1: триггер /start с deep link для реферальной системы
    trigger_start = make_node(
        "trigger-start", "command_trigger", 100, 300,
        {
            "command": "/start",
            "description": "Запустить бота",
            "showInMenu": True,
            "adminOnly": False,
            "requiresAuth": False,
            "isPrivateOnly": False,
            "deepLinkParam": "ref_",
            "deepLinkMatchMode": "startsWith",
            "deepLinkSaveToVar": True,
            "deepLinkVarName": "referrer_id",
            "autoTransitionTo": "msg-video",
            "enableStatistics": True,
            "buttons": [],
            "keyboardType": "none",
            "markdown": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
        },
    )

    # Узел 2: медиа с CTA-кнопками (подписаться / проверить)
    msg_video = make_node(
        "msg-video", "media", 440, 300,
        {
            "attachedMedia": [],
            "keyboardType": "inline",
            "buttons": [
                make_button("btn-subscribe", "📢 Подписаться", "url",
                            url="https://t.me/your_channel"),
                make_button("btn-check", "✅ Проверить подписку", "goto",
                            target="check-subscription"),
            ],
            "enableAutoTransition": False,
            "autoTransitionTo": "",
            "enableStatistics": True,
            "markdown": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
        },
    )

    # Узел 3: условие — проверка подписки на канал
    check_subscription = make_node(
        "check-subscription", "condition", 800, 300,
        {
            "variable": "",
            "branches": [
                make_branch("branch-subscribed", "Подписан",
                            "is_subscribed", "@your_channel", "msg-final"),
                make_branch("branch-else", "Не подписан",
                            "else", "", "msg-not-subscribed"),
            ],
            "enableStatistics": True,
            "buttons": [],
            "keyboardType": "none",
            "markdown": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
        },
    )

    # Узел 4: сообщение — пользователь ещё не подписался
    msg_not_subscribed = make_node(
        "msg-not-subscribed", "message", 1160, 480,
        {
            "messageText": (
                "❌ Вы ещё не подписались на канал.\n\n"
                "Подпишитесь и нажмите «Проверить подписку»:"
            ),
            "keyboardType": "inline",
            "buttons": [
                make_button("btn-subscribe-2", "📢 Подписаться", "url",
                            url="https://t.me/your_channel"),
                make_button("btn-check-2", "✅ Проверить подписку", "goto",
                            target="check-subscription"),
            ],
            "markdown": False,
            "adminOnly": False,
            "requiresAuth": False,
            "isPrivateOnly": False,
            "enableStatistics": True,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "enableAutoTransition": False,
            "autoTransitionTo": "",
            "collectUserInput": False,
            "enableTextInput": False,
            "enablePhotoInput": False,
            "enableVideoInput": False,
            "enableAudioInput": False,
            "enableDocumentInput": False,
            "conditionalMessages": [],
            "enableConditionalMessages": False,
        },
    )

    # Узел 5: финальное сообщение с reply-меню разделов
    msg_final = make_node(
        "msg-final", "message", 1160, 120,
        {
            "messageText": "🎉 Отлично! Вы подписались.\n\nДобро пожаловать! Выберите раздел:",
            "keyboardType": "reply",
            "buttons": [
                make_button("btn-menu-1", "📋 Раздел 1", "goto", target=""),
                make_button("btn-menu-2", "💡 Раздел 2", "goto", target=""),
                make_button("btn-menu-3", "📞 Раздел 3", "goto", target=""),
                make_button("btn-menu-4", "ℹ️ Раздел 4", "goto", target=""),
            ],
            "markdown": False,
            "adminOnly": False,
            "requiresAuth": False,
            "isPrivateOnly": False,
            "enableStatistics": True,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "enableAutoTransition": False,
            "autoTransitionTo": "",
            "collectUserInput": False,
            "enableTextInput": False,
            "enablePhotoInput": False,
            "enableVideoInput": False,
            "enableAudioInput": False,
            "enableDocumentInput": False,
            "conditionalMessages": [],
            "enableConditionalMessages": False,
        },
    )

    return [trigger_start, msg_video, check_subscription, msg_not_subscribed, msg_final]


def build_project() -> dict:
    """
    Собирает полную структуру project.json.
    @returns словарь верхнего уровня проекта
    """
    nodes = build_nodes()
    sheet = {
        "id": "sheet-main",
        "name": "Воронка",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }
    return {
        "version": 2,
        "activeSheetId": "sheet-main",
        "sheets": [sheet],
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
    print("=== Реферальная воронка — отчёт ===\n")
    for sheet in project.get("sheets", []):
        print(f"Лист: [{sheet['id']}] {sheet['name']}")
        print(f"Узлов: {len(sheet['nodes'])}\n")
        for node in sheet["nodes"]:
            nid = node["id"]
            ntype = node["type"]
            x = node["position"]["x"]
            y = node["position"]["y"]
            print(f"  ✓ {nid:<25} тип={ntype:<20} pos=({x}, {y})")
    print()


if __name__ == "__main__":
    OUTPUT = "bots/реферальная_воронка/project.json"

    project = build_project()
    save_project(project, OUTPUT)
    print_report(project)
    print(f"✅ Файл сохранён: {OUTPUT}")
