"""
@fileoverview Генератор project.json для бота-анкеты 69 ROOM.
Сценарий: /start → имя → возраст → сем.положение (кнопки) → о себе → фото (пропуск) → интервью (кнопки) → телеграм → уведомление админу.
@module tools/generate_69room_application_bot
"""

import json
import uuid
from pathlib import Path

ADMIN_CHAT_ID = "1612141295"


def uid() -> str:
    """
    Генерирует короткий уникальный ID.
    @returns строка-идентификатор
    """
    return str(uuid.uuid4())[:8]


def make_node(node_id: str, node_type: str, x: int, y: int, data: dict) -> dict:
    """
    Создаёт узел сценария.
    @param node_id - уникальный идентификатор узла
    @param node_type - тип узла
    @param x - позиция X на холсте
    @param y - позиция Y на холсте
    @param data - данные узла
    @returns словарь узла
    """
    return {
        "id": node_id,
        "type": node_type,
        "position": {"x": x, "y": y},
        "data": data,
    }


def make_button(btn_id: str, text: str, action: str, **kwargs) -> dict:
    """
    Создаёт кнопку.
    @param btn_id - ID кнопки
    @param text - текст кнопки
    @param action - действие кнопки
    @returns словарь кнопки
    """
    btn = {"id": btn_id, "text": text, "action": action, "hideAfterClick": False, "skipDataCollection": False}
    btn.update(kwargs)
    return btn


def msg_defaults() -> dict:
    """
    Возвращает дефолтные поля для message-ноды.
    @returns словарь дефолтных полей
    """
    return {
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
    }


def build_nodes() -> list[dict]:
    """
    Строит все узлы сценария бота-анкеты 69 ROOM.
    @returns список узлов
    """
    nodes = []

    # === 1. Триггер /start ===
    nodes.append(make_node("trigger-start", "command_trigger", 100, 300, {
        "command": "/start",
        "description": "Подать заявку в 69 ROOM",
        "showInMenu": True,
        "autoTransitionTo": "msg-welcome",
        "buttons": [],
        "keyboardType": "none",
        **msg_defaults(),
    }))

    # === 2. Приветствие ===
    nodes.append(make_node("msg-welcome", "message", 400, 300, {
        "messageText": (
            "👋 Привет! Добро пожаловать в систему заявок <b>69 ROOM</b>.\n\n"
            "69 ROOM — это digital-экосистема для общения, знакомств, "
            "мероприятий и взаимодействия между участниками.\n\n"
            "Чтобы попасть в сообщество, заполни короткую анкету ⏱"
        ),
        "formatMode": "html",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-start-form", "📝 Заполнить анкету", "goto", target="input-name"),
        ],
        **msg_defaults(),
    }))

    # === 3. Вопрос: Имя ===
    nodes.append(make_node("input-name", "message", 700, 300, {
        "messageText": "👤 Как тебя зовут?",
        "formatMode": "none",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "input-age",
        "collectUserInput": True,
        "enableTextInput": True,
        "inputVariable": "user_name",
        **{k: v for k, v in msg_defaults().items() if k not in ("autoTransitionTo", "collectUserInput", "enableTextInput")},
    }))

    # === 4. Вопрос: Возраст ===
    nodes.append(make_node("input-age", "message", 1000, 300, {
        "messageText": "🎂 Сколько тебе лет?",
        "formatMode": "none",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "input-status",
        "collectUserInput": True,
        "enableTextInput": True,
        "inputVariable": "user_age",
        **{k: v for k, v in msg_defaults().items() if k not in ("autoTransitionTo", "collectUserInput", "enableTextInput")},
    }))

    # === 5. Вопрос: Семейное положение (кнопки) ===
    status_buttons = [
        make_button("btn-status-1", "Холост", "goto", target="input-bio", callbackData="status_single"),
        make_button("btn-status-2", "Женат/Замужем", "goto", target="input-bio", callbackData="status_married"),
        make_button("btn-status-3", "Разведён", "goto", target="input-bio", callbackData="status_divorced"),
        make_button("btn-status-4", "В активном поиске", "goto", target="input-bio", callbackData="status_searching"),
        make_button("btn-status-5", "Всё сложно", "goto", target="input-bio", callbackData="status_complicated"),
    ]
    nodes.append(make_node("input-status", "message", 1300, 300, {
        "messageText": "💍 Семейное положение:",
        "formatMode": "none",
        "keyboardType": "inline",
        "buttons": status_buttons,
        "keyboardLayout": {
            "rows": [
                {"buttonIds": ["btn-status-1", "btn-status-2"]},
                {"buttonIds": ["btn-status-3", "btn-status-4"]},
                {"buttonIds": ["btn-status-5"]},
            ],
            "columns": 2,
            "autoLayout": False,
        },
        "collectUserInput": True,
        "enableTextInput": False,
        "inputVariable": "user_status",
        **{k: v for k, v in msg_defaults().items() if k not in ("collectUserInput", "enableTextInput")},
    }))

    # === 6. Вопрос: О себе ===
    nodes.append(make_node("input-bio", "message", 1600, 300, {
        "messageText": "✏️ Расскажи о себе: хобби, род деятельности (до 300 символов):",
        "formatMode": "none",
        "keyboardType": "none",
        "buttons": [],
        "autoTransitionTo": "input-photo",
        "collectUserInput": True,
        "enableTextInput": True,
        "inputVariable": "user_bio",
        "maxLength": 300,
        **{k: v for k, v in msg_defaults().items() if k not in ("autoTransitionTo", "collectUserInput", "enableTextInput")},
    }))

    # === 7. Вопрос: Фото (можно пропустить) ===
    nodes.append(make_node("input-photo", "message", 1900, 300, {
        "messageText": "📸 Отправь своё фото (или нажми «Пропустить»):",
        "formatMode": "none",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-skip-photo", "⏭ Пропустить", "goto", target="input-interview"),
        ],
        "autoTransitionTo": "input-interview",
        "collectUserInput": True,
        "enableTextInput": False,
        "enablePhotoInput": True,
        "inputVariable": "user_photo",
        "photoInputVariable": "user_photo",
        "saveMediaMetadata": True,
        **{k: v for k, v in msg_defaults().items() if k not in ("autoTransitionTo", "collectUserInput", "enableTextInput", "enablePhotoInput")},
    }))

    # === 8. Вопрос: Готовы к интервью (кнопки) ===
    interview_buttons = [
        make_button("btn-interview-yes", "✅ Да", "goto", target="input-telegram", callbackData="interview_yes"),
        make_button("btn-interview-no", "❌ Нет", "goto", target="input-telegram", callbackData="interview_no"),
    ]
    nodes.append(make_node("input-interview", "message", 2200, 300, {
        "messageText": "🎙 Готов(а) ли ты к короткому онлайн-интервью?",
        "formatMode": "none",
        "keyboardType": "inline",
        "buttons": interview_buttons,
        "keyboardLayout": {
            "rows": [
                {"buttonIds": ["btn-interview-yes", "btn-interview-no"]},
            ],
            "columns": 2,
            "autoLayout": False,
        },
        "collectUserInput": True,
        "enableTextInput": False,
        "inputVariable": "user_interview",
        **{k: v for k, v in msg_defaults().items() if k not in ("collectUserInput", "enableTextInput")},
    }))

    # === 9. Вопрос: Телеграм ===
    nodes.append(make_node("input-telegram", "message", 2500, 300, {
        "messageText": "📱 Укажи свой Telegram (или нажми «Использовать текущий»):",
        "formatMode": "none",
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-use-current-tg", "📎 Использовать @{username}", "goto", target="msg-thanks"),
        ],
        "autoTransitionTo": "msg-thanks",
        "collectUserInput": True,
        "enableTextInput": True,
        "inputVariable": "user_telegram",
        **{k: v for k, v in msg_defaults().items() if k not in ("autoTransitionTo", "collectUserInput", "enableTextInput")},
    }))

    # === 10. Спасибо, заявка на рассмотрении ===
    nodes.append(make_node("msg-thanks", "message", 2800, 300, {
        "messageText": (
            "✅ Спасибо! Твоя заявка отправлена на рассмотрение.\n\n"
            "Мы свяжемся с тобой, когда администратор примет решение. "
            "Обычно это занимает до 24 часов ⏳"
        ),
        "formatMode": "none",
        "keyboardType": "none",
        "buttons": [],
        "enableAutoTransition": True,
        "autoTransitionTo": "msg-admin-notify",
        **{k: v for k, v in msg_defaults().items() if k not in ("enableAutoTransition", "autoTransitionTo")},
    }))

    # === 11. Уведомление админу (с фото если есть) ===
    nodes.append(make_node("msg-admin-notify", "message", 3100, 300, {
        "messageText": (
            "📋 <b>Новая заявка в 69 ROOM</b>\n\n"
            "👤 Имя: {user_name}\n"
            "🎂 Возраст: {user_age}\n"
            "💍 Статус: {user_status}\n"
            "✏️ О себе: {user_bio}\n"
            "🎙 Интервью: {user_interview}\n"
            "📱 Telegram: {user_telegram}\n"
            "🆔 ID: {user_id} (@{username})"
        ),
        "formatMode": "html",
        "imageUrl": "{user_photo.value}",
        "attachedMedia": [],
        "keyboardType": "inline",
        "buttons": [
            make_button("btn-approve", "✅ Подтвердить", "goto", target="msg-approved"),
            make_button("btn-reject", "❌ Отклонить", "goto", target="msg-rejected"),
        ],
        "keyboardLayout": {
            "rows": [
                {"buttonIds": ["btn-approve", "btn-reject"]},
            ],
            "columns": 2,
            "autoLayout": False,
        },
        "messageSendRecipients": [
            {
                "id": "recipient-admin",
                "type": "chat_id",
                "chatId": ADMIN_CHAT_ID,
            }
        ],
        **{k: v for k, v in msg_defaults().items()},
    }))

    # === 12. Одобрено → юзеру ссылка ===
    nodes.append(make_node("msg-approved", "message", 3400, 150, {
        "messageText": (
            "🎉 <b>Твоя заявка одобрена!</b>\n\n"
            "Добро пожаловать в 69 ROOM! 🏠\n\n"
            "Вот ссылка для вступления:\n"
            "👉 https://t.me/+XXXXXXXXXXXXXX\n\n"
            "Перед началом общения ознакомься с правилами. Увидимся внутри! 🙌"
        ),
        "formatMode": "html",
        "keyboardType": "none",
        "buttons": [],
        "messageSendRecipients": [
            {
                "id": "recipient-user-approve",
                "type": "chat_id",
                "chatId": "{user_id}",
            }
        ],
        **{k: v for k, v in msg_defaults().items()},
    }))

    # === 13. Отклонено → юзеру отказ ===
    nodes.append(make_node("msg-rejected", "message", 3400, 450, {
        "messageText": (
            "😔 К сожалению, твоя заявка отклонена.\n\n"
            "Ты можешь попробовать подать заявку повторно чуть позже.\n"
            "Если есть вопросы — пиши @r_kkkkk"
        ),
        "formatMode": "none",
        "keyboardType": "none",
        "buttons": [],
        "messageSendRecipients": [
            {
                "id": "recipient-user-reject",
                "type": "chat_id",
                "chatId": "{user_id}",
            }
        ],
        **{k: v for k, v in msg_defaults().items()},
    }))

    return nodes


def build_project() -> dict:
    """
    Собирает полную структуру project.json.
    @returns словарь проекта
    """
    nodes = build_nodes()
    sheet = {
        "id": "sheet-application",
        "name": "📋 Анкета 69 ROOM",
        "nodes": nodes,
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }
    return {
        "version": 2,
        "activeSheetId": "sheet-application",
        "sheets": [sheet],
    }


def save_project(project: dict, output_path: str) -> None:
    """
    Сохраняет project.json на диск.
    @param project - данные проекта
    @param output_path - путь к файлу
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)


def print_report(project: dict) -> None:
    """
    Выводит отчёт о сгенерированных узлах.
    @param project - данные проекта
    """
    print("=== 69 ROOM — Бот-анкета v2 — Отчёт ===\n")
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
    print("Сценарий:")
    print("  /start → Приветствие → Имя → Возраст → Сем.положение (кнопки)")
    print("  → О себе → Фото (пропуск) → Интервью (да/нет) → Telegram")
    print("  → «Заявка на рассмотрении» → Админу (фото + данные + ✅/❌)")
    print("  → ✅ Одобрено: юзеру ссылка | ❌ Отклонено: попробуй позже")
    print(f"\n  Admin chat_id: {ADMIN_CHAT_ID}")
    print()


if __name__ == "__main__":
    OUTPUT = "bots/69room_application_bot/project.json"

    project = build_project()
    save_project(project, OUTPUT)
    print_report(project)
    print(f"✅ Файл сохранён: {OUTPUT}")
