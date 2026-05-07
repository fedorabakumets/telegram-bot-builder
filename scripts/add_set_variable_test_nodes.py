#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@fileoverview Скрипт добавления узлов set_variable для тестирования в project.json реферального бота.
Добавляет счётчик заходов (sv-track-visit) и фиксацию подписки (sv-mark-subscribed),
обновляет переходы между узлами и удаляет висящий узел с переменной «ааа».
@module scripts/add_set_variable_test_nodes
"""

import json
import sys

PATH = "bots/новый_бот_2_239_151/project.json"


def make_node(node_id, node_type, data, position):
    """
    Создаёт структуру узла для project.json.
    @param node_id - Уникальный идентификатор узла
    @param node_type - Тип узла (например, set_variable)
    @param data - Словарь с данными узла
    @param position - Словарь с координатами {"x": ..., "y": ...}
    @returns Словарь, представляющий узел графа
    """
    return {
        "id": node_id,
        "type": node_type,
        "position": position,
        "data": data,
    }


def build_sv_track_visit():
    """
    Формирует узел sv-track-visit — счётчик заходов и фиксация активности.
    @returns Словарь узла set_variable
    """
    return make_node(
        node_id="sv-track-visit",
        node_type="set_variable",
        position={"x": 174, "y": 804},
        data={
            "assignments": [
                {
                    "id": "sv1",
                    "variable": "visit_count",
                    "value": "{visit_count} + 1",
                    "mode": "expression",
                },
                {
                    "id": "sv2",
                    "variable": "last_seen",
                    "value": "active",
                    "mode": "text",
                },
            ],
            "autoTransitionTo": "check-subscription",
            "enableAutoTransition": True,
        },
    )


def build_sv_mark_subscribed():
    """
    Формирует узел sv-mark-subscribed — фиксация факта подписки и источника.
    @returns Словарь узла set_variable
    """
    return make_node(
        node_id="sv-mark-subscribed",
        node_type="set_variable",
        position={"x": 560, "y": 680},
        data={
            "assignments": [
                {
                    "id": "sv3",
                    "variable": "is_subscribed",
                    "value": "true",
                    "mode": "text",
                },
                {
                    "id": "sv4",
                    "variable": "subscribed_source",
                    "value": "{referrer_id}",
                    "mode": "text",
                },
            ],
            "autoTransitionTo": "msg-final",
            "enableAutoTransition": True,
        },
    )


def main():
    """
    Читает project.json, вносит все изменения и сохраняет файл.
    Порядок операций:
      1. Загрузить JSON
      2. Найти лист sheet-main
      3. Удалить узел kfmQbAAb0Z800BRQc_kfU
      4. Добавить sv-track-visit и sv-mark-subscribed
      5. Обновить autoTransitionTo у trigger-start и PF6Zj00y9kIH7wMtPw2_U
      6. Обновить target в ветке branch-subscribed узла check-subscription
      7. Обновить messageText у msg-final
      8. Валидировать JSON
      9. Сохранить файл
    @returns None
    """
    print(f"Читаю файл: {PATH}")
    with open(PATH, encoding="utf-8") as f:
        project = json.load(f)

    # Шаг 2: найти лист sheet-main
    sheet = next(
        (s for s in project["sheets"] if s.get("id") == "sheet-main"), None
    )
    if sheet is None:
        print("ОШИБКА: лист sheet-main не найден!")
        sys.exit(1)

    nodes = sheet["nodes"]
    existing_ids = {n["id"] for n in nodes}

    # Шаг 3: удалить висящий узел с переменной «ааа»
    dead_id = "kfmQbAAb0Z800BRQc_kfU"
    before = len(nodes)
    sheet["nodes"] = [n for n in nodes if n["id"] != dead_id]
    nodes = sheet["nodes"]
    if len(nodes) < before:
        print(f"  - Удалён узел: {dead_id}")
    else:
        print(f"  ~ Узел {dead_id} не найден (уже удалён?)")

    # Шаг 4: добавить новые узлы (если ещё не существуют)
    for new_node in [build_sv_track_visit(), build_sv_mark_subscribed()]:
        nid = new_node["id"]
        if nid not in existing_ids:
            nodes.append(new_node)
            print(f"  + Добавлен узел: {nid}")
        else:
            print(f"  ~ Узел {nid} уже существует, пропускаю")

    # Шаг 5: обновить autoTransitionTo у trigger-start и PF6Zj00y9kIH7wMtPw2_U
    trigger_ids = {"trigger-start", "PF6Zj00y9kIH7wMtPw2_U"}
    for node in nodes:
        if node["id"] in trigger_ids:
            old = node["data"].get("autoTransitionTo")
            node["data"]["autoTransitionTo"] = "sv-track-visit"
            print(f"  ✓ {node['id']}: autoTransitionTo {old!r} → 'sv-track-visit'")

    # Шаг 6: обновить target ветки branch-subscribed в check-subscription
    for node in nodes:
        if node["id"] == "check-subscription":
            for branch in node["data"].get("branches", []):
                if branch.get("id") == "branch-subscribed":
                    old = branch.get("target")
                    branch["target"] = "sv-mark-subscribed"
                    print(
                        f"  ✓ check-subscription / branch-subscribed: "
                        f"target {old!r} → 'sv-mark-subscribed'"
                    )

    # Шаг 7: обновить messageText у msg-final
    suffix = "\n\nЗаходов: {visit_count} | Источник: {subscribed_source}"
    for node in nodes:
        if node["id"] == "msg-final":
            current = node["data"].get("messageText", "")
            if suffix not in current:
                node["data"]["messageText"] = current + suffix
                print(f"  ✓ msg-final: messageText дополнен суффиксом")
            else:
                print(f"  ~ msg-final: суффикс уже присутствует")

    # Шаг 8: валидация JSON
    output = json.dumps(project, ensure_ascii=False, indent=2)
    json.loads(output)
    print("JSON валиден.")

    # Шаг 9: сохранить файл
    with open(PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(output)

    print(f"Файл успешно сохранён: {PATH}")


if __name__ == "__main__":
    main()
    sys.exit(0)
