"""
@fileoverview Скрипт обновления реферальной воронки: добавляет psql_query узлы
              для инкремента счётчика подписок и листа «Админка» со статистикой.
@module scripts/update_referral_funnel_psql
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


def build_sql_increment_node() -> dict:
    """
    Создаёт узел psql_query для инкремента счётчика подписок по рефералам.
    @returns узел sql-increment-subscribed
    """
    return make_node("sql-increment-subscribed", "psql_query", 1400, 292, {
        "query": (
            "INSERT INTO referral_stats (ref_id, subscribed_count) "
            "VALUES ('{referrer_id}', 1) "
            "ON CONFLICT (ref_id) DO UPDATE SET "
            "subscribed_count = referral_stats.subscribed_count + 1, "
            "last_subscribed_at = NOW()"
        ),
        "saveResultTo": "",
        "resultFormat": "affected",
        "textTemplate": "",
        "autoTransitionTo": "msg-final",
        "enableAutoTransition": True,
    })


def build_admin_sheet_nodes() -> list[dict]:
    """
    Создаёт список узлов для листа «Админка».
    @returns список узлов: trigger-stats, sql-total, sql-stats, msg-stats
    """
    trigger_stats = make_node("trigger-stats", "command_trigger", 100, 300, {
        "command": "/stats",
        "description": "Статистика по рефералам",
        "showInMenu": False,
        "adminOnly": True,
        "requiresAuth": False,
        "isPrivateOnly": True,
        "autoTransitionTo": "sql-total",
        "enableAutoTransition": True,
        "buttons": [],
        "keyboardType": "none",
        "markdown": False,
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
    })

    sql_total = make_node("sql-total", "psql_query", 450, 500, {
        "query": "SELECT COUNT(*) as total FROM bot_users WHERE project_id = 0",
        "saveResultTo": "total_users",
        "resultFormat": "first_row",
        "textTemplate": "",
        "autoTransitionTo": "sql-stats",
        "enableAutoTransition": True,
    })

    sql_stats = make_node("sql-stats", "psql_query", 450, 300, {
        "query": (
            "SELECT COALESCE(referrer_id, '(прямой вход)') as src, "
            "COUNT(*) as cnt FROM bot_users "
            "WHERE project_id = 0 "
            "GROUP BY referrer_id ORDER BY cnt DESC LIMIT 20"
        ),
        "saveResultTo": "stats_rows",
        "resultFormat": "text",
        "textTemplate": "{src} — {cnt} чел.",
        "autoTransitionTo": "msg-stats",
        "enableAutoTransition": True,
    })

    msg_stats = make_node("msg-stats", "message", 800, 300, {
        "messageText": (
            "📊 Статистика бота\n\n"
            "Всего пользователей: {total_users.total}\n\n"
            "📌 По рефералам:\n{stats_rows}"
        ),
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
        "enableDocumentInput": False,
        "conditionalMessages": [],
        "enableConditionalMessages": False,
    })

    return [trigger_stats, sql_total, sql_stats, msg_stats]


def patch_sheet_main(project: dict) -> dict:
    """
    Обновляет лист sheet-main: добавляет sql-increment-subscribed
    и перенаправляет sv-mark-subscribed на него.
    @param project - данные проекта
    @returns словарь с описанием изменений {узел: действие}
    """
    changes = {}
    for sheet in project["sheets"]:
        if sheet["id"] != "sheet-main":
            continue

        # Добавляем узел инкремента
        sheet["nodes"].append(build_sql_increment_node())
        changes["sql-increment-subscribed"] = "добавлен в sheet-main"

        # Перенаправляем sv-mark-subscribed → sql-increment-subscribed
        for node in sheet["nodes"]:
            if node["id"] == "sv-mark-subscribed":
                old_target = node["data"].get("autoTransitionTo", "")
                node["data"]["autoTransitionTo"] = "sql-increment-subscribed"
                changes["sv-mark-subscribed.autoTransitionTo"] = (
                    f"'{old_target}' → 'sql-increment-subscribed'"
                )
                break

    return changes


def add_admin_sheet(project: dict) -> dict:
    """
    Добавляет новый лист «Админка» с узлами статистики.
    @param project - данные проекта
    @returns словарь с описанием изменений
    """
    # Проверяем, не существует ли уже лист
    existing_ids = {s["id"] for s in project["sheets"]}
    if "sheet-admin" in existing_ids:
        return {"sheet-admin": "уже существует, пропущено"}

    admin_sheet = {
        "id": "sheet-admin",
        "name": "Админка",
        "nodes": build_admin_sheet_nodes(),
        "updatedAt": "2026-05-07T22:45:30.394Z",
        "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
    }
    project["sheets"].append(admin_sheet)

    return {
        "sheet-admin": "добавлен",
        "trigger-stats": "добавлен (команда /stats, adminOnly=true)",
        "sql-total": "добавлен (COUNT всех пользователей)",
        "sql-stats": "добавлен (статистика по рефералам)",
        "msg-stats": "добавлен (итоговое сообщение)",
    }


def print_report(main_changes: dict, admin_changes: dict) -> None:
    """
    Выводит отчёт об изменениях в project.json.
    @param main_changes - изменения в sheet-main
    @param admin_changes - изменения при добавлении sheet-admin
    """
    print("=" * 55)
    print("  Отчёт: update_referral_funnel_psql")
    print("=" * 55)

    print("\n📋 Изменения в sheet-main:")
    for key, val in main_changes.items():
        print(f"  ✓ {key}: {val}")

    print("\n📋 Добавление sheet-admin:")
    for key, val in admin_changes.items():
        print(f"  ✓ {key}: {val}")

    print(f"\n✅ Файл сохранён: {PROJECT_PATH}")
    print("=" * 55)


if __name__ == "__main__":
    project = load_project(PROJECT_PATH)

    main_changes = patch_sheet_main(project)
    admin_changes = add_admin_sheet(project)

    save_project(project, PROJECT_PATH)
    print_report(main_changes, admin_changes)
