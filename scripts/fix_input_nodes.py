"""
@fileoverview Скрипт замены message-узлов с collectUserInput на input-узлы.

Заменяет 3 некорректных message-узла на input-узлы и добавляет новый
input-узел rename-project-input после rename-project-ask.

Запуск из корня проекта:
    python scripts/fix_input_nodes.py
"""

import json
import shutil
from pathlib import Path

# Пути к файлам
BOT_FILE = Path("bots/новый/новый.json")
BACKUP_FILE = Path("bots/новый/новый.json.bak")


def создать_input_узел(node_id: str, variable: str, target_id: str) -> dict:
    """
    Создаёт input-узел с заданными параметрами.

    @param node_id - Идентификатор узла
    @param variable - Переменная для сохранения ввода пользователя
    @param target_id - Идентификатор следующего узла
    @returns Словарь с данными input-узла
    """
    return {
        "id": node_id,
        "type": "input",
        "position": {"x": 0, "y": 0},
        "data": {
            "inputType": "text",
            "inputVariable": variable,
            "inputTargetNodeId": target_id,
            "inputPrompt": "Введите ответ",
            "inputRequired": True,
            "saveToDatabase": False,
            "appendVariable": False,
            "enableAutoTransition": False,
            "collectUserInput": False,
            "keyboardType": "none",
            "buttons": [],
            "markdown": False,
            "enableConditionalMessages": False,
            "conditionalMessages": [],
            "variableFilters": {},
        },
    }


def заменить_узел_в_листе(лист: dict, node_id: str, новый_узел: dict) -> bool:
    """
    Заменяет узел по id в листе.

    @param лист - Лист с узлами
    @param node_id - Идентификатор заменяемого узла
    @param новый_узел - Новый узел для замены
    @returns True если узел найден и заменён
    """
    for i, узел in enumerate(лист["nodes"]):
        if узел["id"] == node_id:
            лист["nodes"][i] = новый_узел
            return True
    return False


def вставить_узел_после(лист: dict, после_id: str, новый_узел: dict) -> bool:
    """
    Вставляет новый узел сразу после узла с указанным id.

    @param лист - Лист с узлами
    @param после_id - Идентификатор узла, после которого вставляем
    @param новый_узел - Новый узел для вставки
    @returns True если узел-якорь найден и вставка выполнена
    """
    for i, узел in enumerate(лист["nodes"]):
        if узел["id"] == после_id:
            лист["nodes"].insert(i + 1, новый_узел)
            return True
    return False


def обновить_rename_project_ask(лист: dict) -> bool:
    """
    Обновляет узел rename-project-ask: убирает поля сбора ввода,
    устанавливает autoTransitionTo на rename-project-input.

    @param лист - Лист с узлами
    @returns True если узел найден и обновлён
    """
    for узел in лист["nodes"]:
        if узел["id"] == "rename-project-ask":
            data = узел["data"]
            # Убираем поля сбора ввода
            data.pop("inputVariable", None)
            data.pop("enableTextInput", None)
            data["collectUserInput"] = False
            # Устанавливаем автопереход на input-узел
            data["autoTransitionTo"] = "rename-project-input"
            data["enableAutoTransition"] = True
            return True
    return False


def найти_лист_с_узлом(данные: dict, node_id: str) -> dict | None:
    """
    Ищет лист, содержащий узел с указанным id.

    @param данные - Данные всего проекта
    @param node_id - Идентификатор искомого узла
    @returns Лист или None если не найден
    """
    for лист in данные["sheets"]:
        for узел in лист["nodes"]:
            if узел["id"] == node_id:
                return лист
    return None


def main():
    """
    Основная функция: читает JSON, выполняет замены, сохраняет результат.
    """
    if not BOT_FILE.exists():
        print(f"❌ Файл не найден: {BOT_FILE}")
        return

    with BOT_FILE.open(encoding="utf-8") as f:
        данные = json.load(f)

    # Делаем бэкап
    shutil.copy2(BOT_FILE, BACKUP_FILE)
    print(f"💾 Бэкап сохранён: {BACKUP_FILE}")

    # ── 1. Замена ask-project-name ────────────────────────────────────────────
    лист = найти_лист_с_узлом(данные, "ask-project-name")
    if лист:
        новый = создать_input_узел("ask-project-name", "new_project_name", "ask-token-value")
        if заменить_узел_в_листе(лист, "ask-project-name", новый):
            print("  ✅ ask-project-name → input-узел")
        else:
            print("  ⚠️  ask-project-name: замена не выполнена")
    else:
        print("  ⚠️  ask-project-name: лист не найден")

    # ── 2. Замена ask-token-value ─────────────────────────────────────────────
    лист = найти_лист_с_узлом(данные, "ask-token-value")
    if лист:
        новый = создать_input_узел("ask-token-value", "new_token_value", "create-project-with-token")
        if заменить_узел_в_листе(лист, "ask-token-value", новый):
            print("  ✅ ask-token-value → input-узел")
        else:
            print("  ⚠️  ask-token-value: замена не выполнена")
    else:
        print("  ⚠️  ask-token-value: лист не найден")

    # ── 3. Замена ask-new-token-value ─────────────────────────────────────────
    лист = найти_лист_с_узлом(данные, "ask-new-token-value")
    if лист:
        новый = создать_input_узел("ask-new-token-value", "new_token_value", "add-token-to-project")
        if заменить_узел_в_листе(лист, "ask-new-token-value", новый):
            print("  ✅ ask-new-token-value → input-узел")
        else:
            print("  ⚠️  ask-new-token-value: замена не выполнена")
    else:
        print("  ⚠️  ask-new-token-value: лист не найден")

    # ── 4. rename-project-ask: обновление + добавление rename-project-input ──
    лист = найти_лист_с_узлом(данные, "rename-project-ask")
    if лист:
        if обновить_rename_project_ask(лист):
            print("  ✅ rename-project-ask: обновлён (autoTransitionTo → rename-project-input)")
        else:
            print("  ⚠️  rename-project-ask: обновление не выполнено")

        новый_input = создать_input_узел("rename-project-input", "new_project_name", "rename-project-action")
        # Проверяем, не добавлен ли уже
        уже_есть = any(у["id"] == "rename-project-input" for у in лист["nodes"])
        if уже_есть:
            print("  ℹ️  rename-project-input: уже существует, пропускаем")
        elif вставить_узел_после(лист, "rename-project-ask", новый_input):
            print("  ✅ rename-project-input: добавлен после rename-project-ask")
        else:
            print("  ⚠️  rename-project-input: вставка не выполнена")
    else:
        print("  ⚠️  rename-project-ask: лист не найден")

    # Сохраняем результат
    with BOT_FILE.open("w", encoding="utf-8") as f:
        json.dump(данные, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Файл сохранён: {BOT_FILE}")


if __name__ == "__main__":
    main()
