"""
@fileoverview Скрипт добавления ветки /export в лист «Админка» проекта.
              Добавляет 4 узла: trigger-export, sql-export-users,
              convert-users-csv, msg-export-done.
@module scripts/add_export_to_admin_sheet
"""

import json
from pathlib import Path

# Путь к целевому project.json
PROJECT_PATH = Path("bots/новый_бот_2_239_151/project.json")


def load_project(path: Path) -> dict:
    """
    Загружает project.json из файла.
    @param path - путь к файлу проекта
    @returns словарь с данными проекта
    """
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_project(project: dict, path: Path) -> None:
    """
    Сохраняет обновлённый project.json на диск.
    @param project - данные проекта
    @param path - путь к файлу
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)


def make_node(node_id: str, node_type: str, x: int, y: int, data: dict) -> dict:
    """
    Создаёт узел сценария бота.
    @param node_id - уникальный идентификатор узла
    @param node_type - тип узла
    @param x - позиция по горизонтали на холсте
    @param y - позиция по вертикали на холсте
    @param data - данные узла
    @returns словарь с полным описанием узла
    """
    return {"id": node_id, "type": node_type, "position": {"x": x, "y": y}, "data": data}


def build_trigger_export() -> dict:
    """
    Создаёт узел command_trigger для команды /export.
    @returns узел trigger-export
    """
    return make_node("trigger-export", "command_trigger", 100, 500, {
        "command": "/export",
        "description": "Выгрузка базы пользователей",
        "showInMenu": False,
        "adminOnly": True,
        "requiresAuth": False,
        "isPrivateOnly": True,
        "autoTransitionTo": "sql-export-users",
        "enableAutoTransition": True,
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": True,
    })


def build_sql_export_users() -> dict:
    """
    Создаёт узел psql_query для выборки всех пользователей проекта.
    @returns узел sql-export-users
    """
    return make_node("sql-export-users", "psql_query", 450, 500, {
        "query": (
            "SELECT user_id, username, referrer_id, "
            "user_data->>'subscribed_at' as subscribed_at, registered_at "
            "FROM bot_users "
            "WHERE project_id = {project_id} AND token_id = {token_id} "
            "ORDER BY registered_at DESC"
        ),
        "saveResultTo": "users_data",
        "resultFormat": "json",
        "textTemplate": "",
        "autoTransitionTo": "convert-users-csv",
        "enableAutoTransition": True,
    })


def build_convert_users_csv() -> dict:
    """
    Создаёт узел convert_file для конвертации данных пользователей в CSV.
    @returns узел convert-users-csv
    """
    return make_node("convert-users-csv", "convert_file", 900, 500, {
        "convertFileMode": "toFile",
        "convertFileInputVariable": "users_data",
        "convertFileFormat": "csv",
        "convertFileFileName": "users_{date}.csv",
        "convertFileCsvDelimiter": ",",
        "convertFileIncludeHeaderRow": True,
        "convertFileOutputVariable": "export_file",
        "autoTransitionTo": "msg-export-done",
        "enableAutoTransition": True,
    })


def build_msg_export_done() -> dict:
    """
    Создаёт узел message для отправки готового CSV-файла администратору.
    enableDocumentInput — строка с именем переменной типа file.
    @returns узел msg-export-done
    """
    return make_node("msg-export-done", "message", 1350, 500, {
        "messageText": "📥 База пользователей готова",
        "keyboardType": "none",
        "buttons": [],
        "markdown": False,
        "adminOnly": True,
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
        "enableDocumentInput": "export_file",
        "conditionalMessages": [],
        "enableConditionalMessages": False,
    })


def add_export_to_admin_sheet(project: dict) -> dict:
    """
    Основная функция патча: добавляет ветку /export в лист sheet-admin.
    Идемпотентна — повторный запуск пропускает уже существующие узлы.
    @param project - данные проекта
    @returns словарь с описанием изменений {узел: действие}
    """
    changes = {}

    # Находим лист «Админка»
    admin_sheet = next(
        (s for s in project["sheets"] if s["id"] == "sheet-admin"), None
    )
    if admin_sheet is None:
        return {"sheet-admin": "❌ лист не найден, патч не применён"}

    # Проверка идемпотентности
    existing_ids = {n["id"] for n in admin_sheet["nodes"]}
    if "trigger-export" in existing_ids:
        return {"trigger-export": "уже существует, пропущено"}

    # Добавляем четыре новых узла
    new_nodes = [
        build_trigger_export(),
        build_sql_export_users(),
        build_convert_users_csv(),
        build_msg_export_done(),
    ]
    for node in new_nodes:
        admin_sheet["nodes"].append(node)
        changes[node["id"]] = f"добавлен (тип={node['type']})"

    return changes


def print_report(changes: dict) -> None:
    """
    Выводит отчёт об изменениях в project.json.
    @param changes - словарь {узел: описание действия}
    """
    print("=" * 55)
    print("  Отчёт: add_export_to_admin_sheet")
    print("=" * 55)
    print("\n📋 Изменения в sheet-admin:")
    for key, val in changes.items():
        print(f"  ✓ {key}: {val}")
    print(f"\n✅ Файл сохранён: {PROJECT_PATH}")
    print("=" * 55)


if __name__ == "__main__":
    project = load_project(PROJECT_PATH)
    changes = add_export_to_admin_sheet(project)
    save_project(project, PROJECT_PATH)
    print_report(changes)
