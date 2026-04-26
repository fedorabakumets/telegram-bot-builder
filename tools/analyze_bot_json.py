"""
@fileoverview Анализатор структуры project.json бота
@module tools/analyze_bot_json
"""

import json
import sys
from pathlib import Path
from collections import defaultdict


def load_project(path: str) -> dict:
    """
    Загружает project.json из файла.
    @param path - путь к файлу
    @returns словарь с данными проекта
    """
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_all_nodes(project: dict) -> list[dict]:
    """
    Возвращает все узлы из всех листов проекта.
    @param project - данные проекта
    @returns список всех узлов
    """
    nodes = []
    for sheet in project.get("sheets", []):
        for node in sheet.get("nodes", []):
            nodes.append({**node, "_sheet": sheet.get("name", "?")})
    return nodes


def build_node_map(nodes: list[dict]) -> dict[str, dict]:
    """
    Строит словарь узлов по ID.
    @param nodes - список узлов
    @returns словарь {id: node}
    """
    return {n["id"]: n for n in nodes}


def get_transitions(node: dict) -> list[tuple[str, str]]:
    """
    Извлекает все переходы из узла.
    @param node - узел
    @returns список кортежей (метка, target_id)
    """
    data = node.get("data", {})
    result = []

    if data.get("autoTransitionTo"):
        result.append(("auto", data["autoTransitionTo"]))

    for btn in data.get("buttons", []):
        if btn.get("target"):
            result.append((f"btn:{btn.get('text','?')}", btn["target"]))

    for branch in data.get("branches", []):
        if branch.get("target"):
            result.append((f"branch:{branch.get('label','?')}", branch["target"]))

    if data.get("keyboardNodeId"):
        result.append(("keyboard", data["keyboardNodeId"]))

    if data.get("inputTargetNodeId"):
        result.append(("input", data["inputTargetNodeId"]))

    return result


def analyze(project: dict) -> None:
    """
    Выводит полный анализ структуры проекта.
    @param project - данные проекта
    """
    sheets = project.get("sheets", [])
    all_nodes = get_all_nodes(project)
    node_map = build_node_map(all_nodes)

    print(f"=== Анализ project.json ===")
    print(f"Версия: {project.get('version', '?')}")
    print(f"Листов: {len(sheets)}")
    print(f"Узлов всего: {len(all_nodes)}\n")

    # Статистика по типам
    type_counts: dict[str, int] = defaultdict(int)
    for n in all_nodes:
        type_counts[n.get("type", "unknown")] += 1

    print("--- Типы узлов ---")
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")

    # Листы и их узлы
    print("\n--- Листы ---")
    for sheet in sheets:
        nodes = sheet.get("nodes", [])
        print(f"  [{sheet['id']}] {sheet['name']} — {len(nodes)} узлов")

    # Граф переходов
    print("\n--- Граф переходов ---")
    for node in all_nodes:
        transitions = get_transitions(node)
        if transitions:
            ntype = node.get("type", "?")
            nid = node["id"]
            for label, target in transitions:
                target_node = node_map.get(target)
                target_type = target_node.get("type", "MISSING") if target_node else "❌ НЕ НАЙДЕН"
                print(f"  {nid} ({ntype}) --[{label}]--> {target} ({target_type})")

    # Недостижимые узлы
    referenced = set()
    for node in all_nodes:
        for _, target in get_transitions(node):
            referenced.add(target)

    triggers = {n["id"] for n in all_nodes if "trigger" in n.get("type", "")}
    unreachable = [
        n for n in all_nodes
        if n["id"] not in referenced and n["id"] not in triggers
    ]
    if unreachable:
        print("\n--- ⚠️ Недостижимые узлы ---")
        for n in unreachable:
            print(f"  {n['id']} ({n.get('type','?')}) на листе '{n['_sheet']}'")

    # HTTP запросы
    http_nodes = [n for n in all_nodes if n.get("type") == "http_request"]
    if http_nodes:
        print("\n--- HTTP запросы ---")
        for n in http_nodes:
            d = n["data"]
            print(f"  [{n['id']}] {d.get('httpRequestMethod','?')} {d.get('httpRequestUrl','?')}")
            if d.get("httpRequestResponseVariable"):
                print(f"    → переменная: {d['httpRequestResponseVariable']}")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "bots/импортированный_проект_2316_157_131/project.json"
    project = load_project(path)
    analyze(project)
