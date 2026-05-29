"""
@fileoverview Генератор project.json для бота-анкеты 69 ROOM.
Формат: keyboard-ноды отдельно, input-ноды отдельно (как конструктор).
@module tools/generate_69room_application_bot
"""

import json
import uuid
from pathlib import Path

ADMIN_CHAT_ID = "1612141295"
ADMIN_CHAT_ID_2 = "406719727"


def uid() -> str:
    """
    Генерирует короткий уникальный ID.
    @returns строка-идентификатор
    """
    return uuid.uuid4().hex[:8]


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
    return {"id": node_id, "type": node_type, "position": {"x": x, "y": y}, "data": data}


def make_keyboard_node(parent_id: str, x: int, y: int, buttons: list, layout=None) -> dict:
    """
    Создаёт отдельную keyboard-ноду.
    @param parent_id - ID родительской message-ноды (для генерации ID)
    @param x - позиция X
    @param y - позиция Y
    @param buttons - список кнопок
    @param layout - раскладка кнопок
    @returns словарь keyboard-ноды
    """
    kbd_id = f"{parent_id}_keyboard_{uid()}"
    data = {
        "buttons": buttons,
        "keyboardType": "inline",
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
    }
    if layout:
        data["keyboardLayout"] = layout
    return make_node(kbd_id, "keyboard", x, y, data)


def make_input_node(input_id: str, x: int, y: int, input_type: str,
                    variable: str, target_node_id: str) -> dict:
    """
    Создаёт input-ноду для сбора ответа.
    @param input_id - ID ноды
    @param x - позиция X
    @param y - позиция Y
    @param input_type - тип ввода: text, photo, any
    @param variable - имя переменной для сохранения
    @param target_node_id - ID следующего узла
    @returns словарь input-ноды
    """
    return make_node(input_id, "input", x, y, {
        "inputType": input_type,
        "inputPrompt": "Введите ответ",
        "inputRequired": True,
        "inputVariable": variable,
        "appendVariable": False,
        "saveToDatabase": False,
        "inputTargetNodeId": target_node_id,
    })


def make_button(btn_id: str, text: str, action: str, **kwargs) -> dict:
    """
    Создаёт кнопку.
    @param btn_id - ID кнопки
    @param text - текст кнопки
    @param action - действие кнопки
    @returns словарь кнопки
    """
    btn = {"id": btn_id, "text": text, "action": action,
           "hideAfterClick": False, "skipDataCollection": False}
    btn.update(kwargs)
    return btn


def build_nodes() -> list[dict]:
    """
    Строит все узлы сценария бота-анкеты 69 ROOM.
    @returns список узлов
    """
    nodes = []

    # ID для input-нод
    input_name_id = f"input-{uid()}"
    input_age_id = f"input-{uid()}"
    input_status_id = f"input-{uid()}"
    input_bio_id = f"input-{uid()}"
    input_photo_id = f"input-{uid()}"
    input_interview_id = f"input-{uid()}"
    input_telegram_id = f"input-{uid()}"

    # === 1. Триггер /start ===
    nodes.append(make_node("trigger-start", "command_trigger", 100, 1600, {
        "command": "/start",
        "description": "Подать заявку в 69 ROOM",
        "showInMenu": True,
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "enableAutoTransition": True,
        "autoTransitionTo": "msg-welcome",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))

    # === 2. Приветствие ===
    welcome_kbd = make_keyboard_node("msg-welcome", 750, 1500, [
        make_button("btn-start-form", "📝 Заполнить анкету", "goto", target="input-name"),
    ])
    nodes.append(make_node("msg-welcome", "message", 350, 1500, {
        "messageText": "👋 Привет! Добро пожаловать в систему заявок <b>69 ROOM</b>.\n\n69 ROOM — это digital-экосистема для общения, знакомств, мероприятий и взаимодействия между участниками.\n\nЧтобы попасть в сообщество, заполни короткую анкету ⏱",
        "formatMode": "html",
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": welcome_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "enableTextInput": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(welcome_kbd)

    # === 3. Имя ===
    nodes.append(make_node("input-name", "message", 770, 1740, {
        "messageText": "👤 Как тебя зовут?",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_name",
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": True,
        "oneTimeKeyboard": False,
        "enableAutoTransition": True,
        "autoTransitionTo": input_name_id,
        "collectUserInput": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(make_input_node(input_name_id, 1190, 1650, "text", "user_name", "input-age"))

    # === 4. Возраст ===
    nodes.append(make_node("input-age", "message", 1610, 2050, {
        "messageText": "🎂 Сколько тебе лет?",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_age",
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": True,
        "oneTimeKeyboard": False,
        "enableAutoTransition": True,
        "autoTransitionTo": input_age_id,
        "collectUserInput": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(make_input_node(input_age_id, 2030, 2340, "text", "user_age", "input-status"))

    # === 5. Семейное положение (кнопки) ===
    status_kbd = make_keyboard_node("input-status", 2760, 2840, [
        make_button("btn-status-1", "Холост", "goto", target=input_status_id),
        make_button("btn-status-2", "Женат/Замужем", "goto", target=input_status_id),
        make_button("btn-status-3", "Разведён", "goto", target=input_status_id),
        make_button("btn-status-4", "В активном поиске", "goto", target=input_status_id),
        make_button("btn-status-5", "Всё сложно", "goto", target=input_status_id),
    ], layout={
        "rows": [
            {"buttonIds": ["btn-status-1", "btn-status-2"]},
            {"buttonIds": ["btn-status-3", "btn-status-4"]},
            {"buttonIds": ["btn-status-5"]},
        ],
        "columns": 2,
        "autoLayout": False,
    })
    nodes.append(make_node("input-status", "message", 2340, 2920, {
        "messageText": "💍 Семейное положение:",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": status_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_status",
        "isPrivateOnly": False,
        "enableTextInput": False,
        "variableFilters": {},
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(status_kbd)
    nodes.append(make_input_node(input_status_id, 2870, 2340, "any", "user_status", "input-bio"))

    # === 6. О себе ===
    nodes.append(make_node("input-bio", "message", 3240, 3000, {
        "messageText": "✏️ Расскажи о себе: хобби, род деятельности (до 300 символов):",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "maxLength": 300,
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_bio",
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": True,
        "oneTimeKeyboard": False,
        "variableFilters": {},
        "enableAutoTransition": True,
        "autoTransitionTo": input_bio_id,
        "collectUserInput": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(make_input_node(input_bio_id, 3290, 2380, "text", "user_bio", "input-photo"))

    # === 7. Фото (можно пропустить) ===
    photo_kbd = make_keyboard_node("input-photo", 4100, 2790, [
        make_button("btn-skip-photo", "⏭ Пропустить", "goto", target="input-interview"),
    ])
    nodes.append(make_node("input-photo", "message", 3710, 2790, {
        "messageText": "📸 Отправь своё фото (или нажми «Пропустить»):",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": photo_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_photo",
        "isPrivateOnly": False,
        "enableTextInput": False,
        "enableAutoTransition": True,
        "autoTransitionTo": input_photo_id,
        "collectUserInput": True,
        "enableAudioInput": False,
        "enablePhotoInput": True,
        "enableStatistics": True,
        "enableVideoInput": False,
        "saveMediaMetadata": True,
        "photoInputVariable": "user_photo",
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(photo_kbd)
    nodes.append(make_input_node(input_photo_id, 4130, 2540, "photo", "user_photo", "input-interview"))

    # === 8. Интервью (кнопки) ===
    interview_kbd = make_keyboard_node("input-interview", 4920, 3120, [
        make_button("btn-interview-yes", "✅ Да", "goto", target=input_interview_id),
        make_button("btn-interview-no", "❌ Нет", "goto", target=input_interview_id),
    ], layout={
        "rows": [{"buttonIds": ["btn-interview-yes", "btn-interview-no"]}],
        "columns": 2,
        "autoLayout": False,
    })
    nodes.append(make_node("input-interview", "message", 4550, 2790, {
        "messageText": "🎙 Готов(а) ли ты к короткому онлайн-интервью?",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": interview_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_interview",
        "isPrivateOnly": False,
        "enableTextInput": False,
        "collectUserInput": True,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(interview_kbd)
    nodes.append(make_input_node(input_interview_id, 5360, 3040, "any", "user_interview", "input-telegram"))

    # === 9. Telegram ===
    # Кнопка «Использовать текущий» ведёт на set_variable ноду которая
    # записывает @{username} в user_telegram, а потом переходит к msg-thanks
    tg_kbd = make_keyboard_node("input-telegram", 5360, 2740, [
        make_button("btn-use-current-tg", "📎 Использовать текущий", "goto", target="set-tg-from-username"),
    ])
    nodes.append(make_node("input-telegram", "message", 4970, 2740, {
        "messageText": "📱 Укажи свой Telegram (@username или номер):",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": tg_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "inputVariable": "user_telegram",
        "isPrivateOnly": False,
        "enableTextInput": True,
        "variableFilters": {},
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableAutoTransition": False,
        "enableConditionalMessages": False,
    }))
    nodes.append(tg_kbd)
    nodes.append(make_input_node(input_telegram_id, 5360, 3200, "text", "user_telegram", "msg-thanks"))

    # === 9b. set_variable: записать @{username} в user_telegram ===
    nodes.append(make_node("set-tg-from-username", "set_variable", 5700, 2500, {
        "assignments": [
            {
                "id": "assign_1",
                "variable": "user_telegram",
                "value": "@{username}",
                "mode": "text",
            }
        ],
        "enableAutoTransition": True,
        "autoTransitionTo": "msg-thanks",
    }))

    # === 10. Спасибо ===
    nodes.append(make_node("msg-thanks", "message", 5810, 2790, {
        "messageText": "✅ Спасибо! Твоя заявка отправлена на рассмотрение.\n\nМы свяжемся с тобой, когда администратор примет решение. Обычно это занимает до 24 часов ⏳",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "enableAutoTransition": True,
        "autoTransitionTo": "condition-has-photo",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
    }))

    # === 11. Условие: есть ли фото? ===
    nodes.append(make_node("condition-has-photo", "condition", 6230, 2890, {
        "variable": "user_photo",
        "branches": [
            {"id": "branch-has-photo", "label": "Есть фото", "operator": "not_empty", "value": "", "target": "msg-admin-notify-photo"},
            {"id": "branch-no-photo", "label": "Нет фото", "operator": "else", "value": "", "target": "msg-admin-notify-text"},
        ],
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": True,
    }))

    # Общий текст для уведомления
    admin_text = "📋 <b>Новая заявка в 69 ROOM</b>\n\n👤 Имя: {user_name}\n🎂 Возраст: {user_age}\n💍 Статус: {user_status}\n✏️ О себе: {user_bio}\n🎙 Интервью: {user_interview}\n📱 Telegram: {user_telegram}\n🆔 ID: {user_id} (@{username})"
    admin_recipients = [
        {"id": "recipient-admin-1", "type": "chat_id", "chatId": ADMIN_CHAT_ID},
        {"id": "recipient-admin-2", "type": "chat_id", "chatId": ADMIN_CHAT_ID_2},
    ]

    # === 12. Уведомление С ФОТО ===
    photo_notify_kbd = make_keyboard_node("msg-admin-notify-photo", 6980, 3050, [
        make_button("btn-approve", "✅ Подтвердить", "goto", target="msg-approved"),
        make_button("btn-reject", "❌ Отклонить", "goto", target="msg-rejected"),
    ], layout={"rows": [{"buttonIds": ["btn-approve", "btn-reject"]}], "columns": 2, "autoLayout": False})

    nodes.append(make_node("msg-admin-notify-photo", "message", 6580, 2790, {
        "messageText": admin_text,
        "formatMode": "html",
        "imageUrl": "{user_photo.value}",
        "attachedMedia": [],
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": photo_notify_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "enableTextInput": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
        "messageSendRecipients": admin_recipients,
    }))
    nodes.append(photo_notify_kbd)

    # === 13. Уведомление БЕЗ ФОТО ===
    text_notify_kbd = make_keyboard_node("msg-admin-notify-text", 6980, 3630, [
        make_button("btn-approve-2", "✅ Подтвердить", "goto", target="msg-approved"),
        make_button("btn-reject-2", "❌ Отклонить", "goto", target="msg-rejected"),
    ], layout={"rows": [{"buttonIds": ["btn-approve-2", "btn-reject-2"]}], "columns": 2, "autoLayout": False})

    nodes.append(make_node("msg-admin-notify-text", "message", 6580, 3260, {
        "messageText": admin_text,
        "formatMode": "html",
        "buttons": [],
        "keyboardType": "none",
        "keyboardNodeId": text_notify_kbd["id"],
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "enableTextInput": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
        "messageSendRecipients": admin_recipients,
    }))
    nodes.append(text_notify_kbd)

    # === 14. Одобрено ===
    nodes.append(make_node("msg-approved", "message", 7000, 2600, {
        "messageText": "🎉 <b>Твоя заявка одобрена!</b>\n\nДобро пожаловать в 69 ROOM! 🏠\n\nВот ссылка для вступления:\n👉 https://t.me/+XXXXXXXXXXXXXX\n\nПеред началом общения ознакомься с правилами. Увидимся внутри! 🙌",
        "formatMode": "html",
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
        "messageSendRecipients": [
            {"id": "recipient-user-approve", "type": "chat_id", "chatId": "{user_id}"},
        ],
    }))

    # === 15. Отклонено ===
    nodes.append(make_node("msg-rejected", "message", 7000, 3280, {
        "messageText": "😔 К сожалению, твоя заявка отклонена.\n\nТы можешь попробовать подать заявку повторно чуть позже.\nЕсли есть вопросы — пиши @r_kkkkk",
        "formatMode": "none",
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "adminOnly": False,
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "enableTextInput": False,
        "oneTimeKeyboard": False,
        "enableAutoTransition": False,
        "autoTransitionTo": "",
        "collectUserInput": False,
        "enableAudioInput": False,
        "enablePhotoInput": False,
        "enableStatistics": True,
        "enableVideoInput": False,
        "conditionalMessages": [],
        "enableDocumentInput": False,
        "enableConditionalMessages": False,
        "messageSendRecipients": [
            {"id": "recipient-user-reject", "type": "chat_id", "chatId": "{user_id}"},
        ],
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
    print("=== 69 ROOM — Бот-анкета v3 (native format) ===\n")
    for sheet in project.get("sheets", []):
        print(f"Лист: [{sheet['id']}] {sheet['name']}")
        print(f"Узлов: {len(sheet['nodes'])}\n")
        types_count = {}
        for node in sheet["nodes"]:
            t = node["type"]
            types_count[t] = types_count.get(t, 0) + 1
            nid = node["id"]
            x = node["position"]["x"]
            y = node["position"]["y"]
            print(f"  ✓ {nid:<45} тип={t:<18} pos=({x}, {y})")
        print(f"\n  По типам: {types_count}")
    print()
    print("Сценарий:")
    print("  /start → Приветствие [kbd] → Имя [input] → Возраст [input]")
    print("  → Сем.положение [kbd+input] → О себе [input] → Фото [kbd+input]")
    print("  → Интервью [kbd+input] → Telegram [kbd+input | set_variable]")
    print("  → Спасибо → condition(фото?) → admin-notify-photo / admin-notify-text")
    print("  → ✅ msg-approved / ❌ msg-rejected")
    print(f"\n  Кнопка «Использовать текущий» → set_variable(user_telegram = @{{username}}) → msg-thanks")
    print(f"\n  Admin IDs: {ADMIN_CHAT_ID}, {ADMIN_CHAT_ID_2}")
    print()


if __name__ == "__main__":
    OUTPUT = "bots/69room_application_bot/project.json"

    project = build_project()
    save_project(project, OUTPUT)
    print_report(project)
    print(f"✅ Файл сохранён: {OUTPUT}")
