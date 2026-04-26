"""
@fileoverview Извлечение всех переменных из project.json
@module tools/extract_variables
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict


# Паттерн для поиска {переменных} в строках
VAR_PATTERN = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_.]*)\}")

# Системные переменные Telegram
SYSTEM_VARS = {
    "user_id", "username", "first_name", "last_name",
    "callback_data", "bot_token", "message_id", "chat_id",
}

# Поля узла, в которых могут быть переменные
VAR_FIELDS = [
    "messageText", "httpRequestUrl", "httpRequestBody",
    "httpRequestHeaders", "mediaCaption", "inputVariable",
    "httpRequestResponseVariable", "httpRequestStatusVariable",
    "documentInputVariable", "photoInputVariable",
    "videoInputVariable", "audioInputVariable",
]


def extract_vars_from_str(s: str) -> set[str]:
    """
    Извлекает имена переменных из строки вида {var}.
    @param s - строка для поиска
    @returns множество имён переменных
    """
    return set(VAR_PATTERN.findall(s))


def scan_node(node: dict) -> dict[str, list[str]]:
    """
    Сканирует узел и возвращает переменные по полям.
    @param node - узел проекта
    @returns словарь {поле: [переменные]}
    """
    data = node.get("data", {})
    found: dict[str, list[str]] = {}

    for field in VAR_FIELDS:
        val = data.get(field, "")
        if isinstance(val, str):
            vars_ = extract_vars_from_str(val)
            if vars_:
                found[field] = sorted(vars_)

    # Кнопки
    for btn in data.get("buttons", []):
        for field in ("url", "webAppUrl", "copyText"):
            val = btn.get(field, "")
            if isinstance(val, str):
                vars_ = extract_vars_from_str(val)
                if vars_:
                    found[f"btn[{btn.get('text','?')}].{field}"] = sorted(vars_)

    return found


def analyze_variables(project: dict) -> None:
    """
    Выводит все переменные, используемые в проекте.
    @param project - данные проекта
    """
    all_used: set[str] = set()
    all_written: set[str] = set()
    node_vars: list[tuple[str, str, dict]] = []

    for sheet in project.get("sheets", []):
        for node in sheet.get("nodes", []):
            data = node.get("data", {})
            found = scan_node(node)

            if found:
                node_vars.append((node["id"], node.get("type", "?"), found))
                for vars_ in found.values():
                    all_used.update(vars_)

            # Переменные, в которые пишем
            for write_field in (
                "httpRequestResponseVariable",
                "httpRequestStatusVariable",
                "inputVariable",
                "documentInputVariable",
                "photoInputVariable",
                "videoInputVariable",
                "audioInputVariable",
            ):
                val = data.get(write_field, "")
                if val:
                    all_written.add(val)

    print("=== Переменные проекта ===\n")

    print("--- Использование по узлам ---")
    for nid, ntype, fields in node_vars:
        print(f"  [{nid}] ({ntype})")
        for field, vars_ in fields.items():
            print(f"    {field}: {', '.join(vars_)}")

    print(f"\n--- Все используемые переменные ({len(all_used)}) ---")
    for v in sorted(all_used):
        tag = "🔧 системная" if v in SYSTEM_VARS else ""
        print(f"  {{{v}}} {tag}")

    print(f"\n--- Переменные, в которые пишем ({len(all_written)}) ---")
    for v in sorted(all_written):
        print(f"  {v}")

    undefined = all_used - all_written - SYSTEM_VARS
    if undefined:
        print(f"\n--- ⚠️ Возможно неопределённые переменные ({len(undefined)}) ---")
        for v in sorted(undefined):
            print(f"  {{{v}}}")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "bots/импортированный_проект_2316_157_131/project.json"
    with open(path, encoding="utf-8") as f:
        project = json.load(f)
    analyze_variables(project)
