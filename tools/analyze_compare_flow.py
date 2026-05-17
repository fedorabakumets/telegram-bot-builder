"""
@fileoverview Скрипт анализа потока «Сравнение курсов» в project.json.
Выводит цепочку нод: loop → http_request → set_variable,
показывает URL, json_path, формулы и переменные.
"""

import json
import sys


def load_project(path: str) -> dict:
    """
    Загружает project.json
    @param path - путь к файлу
    @returns словарь проекта
    """
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def find_sheet(data: dict, name_part: str) -> dict | None:
    """
    Ищет лист по подстроке в имени
    @param data - словарь проекта
    @param name_part - подстрока для поиска
    @returns найденный лист или None
    """
    for sheet in data.get('sheets', []):
        if name_part.lower() in sheet.get('name', '').lower():
            return sheet
    return None


def analyze_compare_sheet(sheet: dict) -> None:
    """
    Анализирует лист сравнения курсов
    @param sheet - словарь листа
    """
    nodes = sheet.get('nodes', [])
    print(f"{'='*60}")
    print(f"  ЛИСТ: {sheet['name']}")
    print(f"  Нод: {len(nodes)}")
    print(f"{'='*60}")

    # Индексируем ноды по id
    node_map = {n['id']: n for n in nodes}

    for node in nodes:
        ntype = node.get('type', '')
        nid = node.get('id', '')
        data = node.get('data', {})

        print(f"\n{'─'*60}")
        print(f"  [{ntype.upper()}] id: {nid}")

        if ntype == 'message':
            text = data.get('messageText', '')
            print(f"  Текст: {text[:120]}{'...' if len(text) > 120 else ''}")
            if data.get('keyboardNodeId'):
                print(f"  Клавиатура: {data['keyboardNodeId']}")
            if data.get('autoTransitionTo'):
                print(f"  Автопереход → {data['autoTransitionTo']}")

        elif ntype == 'keyboard':
            buttons = data.get('buttons', [])
            print(f"  Кнопок: {len(buttons)}")
            for btn in buttons:
                action = btn.get('action', '')
                text = btn.get('text', '')
                target = btn.get('target', '')
                url = btn.get('url', '')
                if action == 'url':
                    print(f"    [{text}] → URL: {url}")
                elif action == 'goto':
                    print(f"    [{text}] → goto: {target}")
                elif action == 'callback':
                    print(f"    [{text}] → callback: {target}")

        elif ntype == 'callback_trigger':
            print(f"  Callback data: {data.get('callbackData', '')}")
            print(f"  Автопереход → {data.get('autoTransitionTo', '')}")

        elif ntype == 'input':
            print(f"  Переменная: {data.get('inputVariable', '')}")
            print(f"  Prompt: {data.get('messageText', '')[:80]}")
            print(f"  Автопереход → {data.get('autoTransitionTo', '')}")

        elif ntype == 'set_variable':
            assignments = data.get('assignments', [])
            print(f"  Присваиваний: {len(assignments)}")
            for a in assignments:
                mode = a.get('mode', 'template')
                var = a.get('variable', '')
                val = a.get('value', '')
                print(f"    {var} = {val} (mode: {mode})")
                if mode == 'lookup':
                    print(f"      lookup: table={a.get('lookupTable')}, field={a.get('lookupField')}")
                    print(f"      where: {a.get('lookupWhere', [])}")
            print(f"  Автопереход → {data.get('autoTransitionTo', '')}")

        elif ntype == 'loop':
            print(f"  Источник: {data.get('sourceVariable', '')}")
            print(f"  Элемент: {data.get('itemVariable', '')}")
            print(f"  Индекс: {data.get('indexVariable', '')}")
            print(f"  Max итераций: {data.get('maxIterations', 0)}")
            print(f"  Задержка: {data.get('delaySeconds', 0)}с")
            print(f"  Параллельно: {data.get('parallel', False)}")
            print(f"  Тело (autoTransitionTo) → {data.get('autoTransitionTo', '')}")
            print(f"  После цикла (afterLoopTo) → {data.get('afterLoopTo', '')}")

        elif ntype == 'http_request':
            print(f"  URL: {data.get('httpRequestUrl', '')}")
            print(f"  Метод: {data.get('httpRequestMethod', 'GET')}")
            print(f"  Timeout: {data.get('httpRequestTimeout', 30)}с")
            print(f"  Response var: {data.get('httpRequestResponseVariable', '')}")
            print(f"  Status var: {data.get('httpRequestStatusVariable', '')}")
            print(f"  Response format: {data.get('httpRequestResponseFormat', 'autodetect')}")
            print(f"  JSON Path: {data.get('httpRequestResponseJsonPath', '')}")
            print(f"  Extract to: {data.get('httpRequestResponseExtractTo', '')}")
            headers = data.get('httpRequestHeaders', '')
            if headers:
                print(f"  Headers: {headers[:100]}")
            body = data.get('httpRequestBody', '')
            if body:
                print(f"  Body: {body[:100]}")
            print(f"  Автопереход → {data.get('autoTransitionTo', '')}")

        else:
            print(f"  (неизвестный тип)")

    # Восстанавливаем цепочку переходов
    print(f"\n{'='*60}")
    print(f"  ЦЕПОЧКА ПЕРЕХОДОВ")
    print(f"{'='*60}")

    # Ищем точку входа (callback_trigger или message без входящих)
    entry_nodes = [n for n in nodes if n.get('type') in ('callback_trigger', 'command_trigger')]
    if not entry_nodes:
        entry_nodes = [n for n in nodes if n.get('type') == 'message' and 'compare' in n.get('id', '').lower()]

    for entry in entry_nodes:
        print(f"\n  Вход: [{entry['type']}] {entry['id']}")
        current_id = entry.get('data', {}).get('autoTransitionTo', '')
        visited = set()
        depth = 0
        while current_id and current_id not in visited and depth < 20:
            visited.add(current_id)
            depth += 1
            node = node_map.get(current_id)
            if not node:
                print(f"  {'  '*depth}→ ??? {current_id} (не найден)")
                break
            ntype = node.get('type', '')
            print(f"  {'  '*depth}→ [{ntype}] {current_id}")
            current_id = node.get('data', {}).get('autoTransitionTo', '')
            if not current_id and ntype == 'loop':
                after = node.get('data', {}).get('afterLoopTo', '')
                if after:
                    print(f"  {'  '*(depth+1)}(после цикла) → {after}")


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_157\project.json"
    data = load_project(path)
    sheet = find_sheet(data, 'сравнен')
    if sheet:
        analyze_compare_sheet(sheet)
    else:
        print("❌ Лист 'Сравнение курсов' не найден")
