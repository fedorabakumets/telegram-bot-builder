"""
@fileoverview Скрипт анализа project.json бота
Выводит структуру: листы, ноды, кнопки, связи
"""

import json
import sys
from pathlib import Path
from collections import Counter


def load_project(path: str) -> dict:
    """
    Загружает project.json
    @param path - путь к файлу
    @returns словарь проекта
    """
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def analyze_project(data: dict) -> None:
    """
    Анализирует и выводит сводку по project.json
    @param data - словарь проекта
    """
    sheets = data.get('sheets', [])
    print(f"{'='*60}")
    print(f"  АНАЛИЗ PROJECT.JSON")
    print(f"{'='*60}")
    print(f"\n📋 Листов (sheets): {len(sheets)}")

    total_nodes = 0
    total_buttons = 0
    node_types = Counter()
    all_targets = []

    for sheet in sheets:
        nodes = sheet.get('nodes', [])
        total_nodes += len(nodes)
        print(f"\n{'─'*60}")
        print(f"📄 Лист: {sheet.get('name', 'Без имени')} (id: {sheet['id'][:8]}...)")
        print(f"   Нод: {len(nodes)}")

        sheet_types = Counter()
        for node in nodes:
            ntype = node.get('type', 'unknown')
            node_types[ntype] += 1
            sheet_types[ntype] += 1

            buttons = node.get('data', {}).get('buttons', [])
            total_buttons += len(buttons)

            for btn in buttons:
                if btn.get('action') == 'goto' and btn.get('target'):
                    all_targets.append(btn['target'])

        print(f"   Типы нод: {dict(sheet_types)}")

    print(f"\n{'='*60}")
    print(f"  ИТОГО")
    print(f"{'='*60}")
    print(f"  Нод всего: {total_nodes}")
    print(f"  Кнопок всего: {total_buttons}")
    print(f"  Переходов (goto): {len(all_targets)}")
    print(f"\n  Типы нод:")
    for ntype, count in node_types.most_common():
        print(f"    {ntype}: {count}")

    # Проверка битых ссылок
    all_node_ids = set()
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            all_node_ids.add(node['id'])

    broken = [t for t in all_targets if t not in all_node_ids]
    if broken:
        print(f"\n⚠️  Битые ссылки (target не найден): {len(broken)}")
        for b in set(broken):
            print(f"    → {b[:40]}...")
    else:
        print(f"\n✅ Битых ссылок нет")

    # Переменные
    variables = set()
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            d = node.get('data', {})
            if d.get('inputVariable'):
                variables.add(d['inputVariable'])
            if d.get('audioInputVariable'):
                variables.add(d['audioInputVariable'])
            if d.get('photoInputVariable'):
                variables.add(d['photoInputVariable'])
            if d.get('videoInputVariable'):
                variables.add(d['videoInputVariable'])
            if d.get('documentInputVariable'):
                variables.add(d['documentInputVariable'])

    if variables:
        print(f"\n📦 Переменные ({len(variables)}):")
        for v in sorted(variables):
            print(f"    • {v}")
    else:
        print(f"\n📦 Переменные: не используются")


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_157\project.json"
    data = load_project(path)
    analyze_project(data)
