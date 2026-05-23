"""
@fileoverview Детальный анализ бота новый_бот_1_242_159
Выводит: тексты сообщений, кнопки, переходы, логику set_variable, userbot-ноды
"""

import json
from pathlib import Path


def load():
    path = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def short_id(nid):
    return nid[:30] + "..." if len(nid) > 30 else nid


def analyze_sheet_detail(sheet):
    name = sheet.get('name', 'Без имени')
    nodes = sheet.get('nodes', [])
    print(f"\n{'═'*70}")
    print(f"  📄 {name}")
    print(f"{'═'*70}")

    for node in nodes:
        ntype = node['type']
        data = node.get('data', {})
        nid = node['id']

        if ntype == 'message':
            text = data.get('messageText', '')[:100]
            kbd_id = data.get('keyboardNodeId', '')
            auto = data.get('autoTransitionTo', '')
            print(f"\n  💬 message [{short_id(nid)}]")
            if text:
                print(f"     Текст: {text}")
            if kbd_id:
                print(f"     Клавиатура: {short_id(kbd_id)}")
            if auto:
                print(f"     Авто-переход → {short_id(auto)}")

        elif ntype == 'keyboard':
            buttons = data.get('buttons', [])
            layout = data.get('keyboardLayout', {})
            print(f"\n  ⌨️  keyboard [{short_id(nid)}] ({len(buttons)} кнопок)")
            for btn in buttons:
                action = btn.get('action', '?')
                text = btn.get('text', '')
                target = btn.get('target', '')
                url = btn.get('url', '')
                if action == 'url':
                    print(f"     [{text}] → URL: {url[:50]}")
                elif action == 'goto':
                    print(f"     [{text}] → goto: {short_id(target)}")
                else:
                    print(f"     [{text}] → {action}")

        elif ntype == 'command_trigger':
            cmd = data.get('command', '')
            auto = data.get('autoTransitionTo', '')
            print(f"\n  🎯 command_trigger [{short_id(nid)}]")
            print(f"     Команда: {cmd}")
            if auto:
                print(f"     → {short_id(auto)}")

        elif ntype == 'callback_trigger':
            pattern = data.get('callbackPattern', data.get('pattern', ''))
            auto = data.get('autoTransitionTo', '')
            print(f"\n  📞 callback_trigger [{short_id(nid)}]")
            print(f"     Паттерн: {pattern}")
            if auto:
                print(f"     → {short_id(auto)}")

        elif ntype == 'set_variable':
            var_name = data.get('variableName', '')
            var_value = data.get('variableValue', '')
            mode = data.get('mode', 'set')
            auto = data.get('autoTransitionTo', '')
            print(f"\n  📝 set_variable [{short_id(nid)}]")
            print(f"     {var_name} = {str(var_value)[:80]} (mode: {mode})")
            if auto:
                print(f"     → {short_id(auto)}")

        elif ntype == 'input':
            var = data.get('inputVariable', data.get('variableName', ''))
            prompt = data.get('messageText', '')[:80]
            auto = data.get('autoTransitionTo', '')
            print(f"\n  📥 input [{short_id(nid)}]")
            print(f"     Переменная: {var}")
            if prompt:
                print(f"     Промпт: {prompt}")
            if auto:
                print(f"     → {short_id(auto)}")

        elif ntype == 'condition':
            conditions = data.get('conditions', [])
            print(f"\n  🔀 condition [{short_id(nid)}]")
            for c in conditions:
                var = c.get('variable', '')
                op = c.get('operator', '')
                val = c.get('value', '')
                target = c.get('target', '')
                print(f"     if {var} {op} {val} → {short_id(target)}")
            default = data.get('defaultTarget', '')
            if default:
                print(f"     else → {short_id(default)}")

        elif ntype == 'loop':
            print(f"\n  🔄 loop [{short_id(nid)}]")
            print(f"     data: {json.dumps(data, ensure_ascii=False)[:200]}")

        elif ntype == 'http_request':
            url = data.get('url', '')
            method = data.get('method', 'GET')
            print(f"\n  🌐 http_request [{short_id(nid)}]")
            print(f"     {method} {url[:80]}")
            resp_var = data.get('responseVariable', '')
            if resp_var:
                print(f"     → сохранить в: {resp_var}")

        elif ntype == 'bot_table':
            table = data.get('tableName', data.get('table', ''))
            op = data.get('operation', '')
            print(f"\n  🗄️  bot_table [{short_id(nid)}]")
            print(f"     Таблица: {table}, операция: {op}")

        elif ntype.startswith('userbot'):
            print(f"\n  🤖 {ntype} [{short_id(nid)}]")
            bot_username = data.get('botUsername', data.get('targetBot', ''))
            msg = data.get('messageText', data.get('message', ''))[:80]
            auto = data.get('autoTransitionTo', '')
            if bot_username:
                print(f"     Бот: {bot_username}")
            if msg:
                print(f"     Сообщение: {msg}")
            if auto:
                print(f"     → {short_id(auto)}")
            # Показать остальные ключевые поля
            for key in ['buttonText', 'buttonIndex', 'query', 'waitTimeout', 'responseVariable', 'parseMode']:
                if data.get(key):
                    print(f"     {key}: {data[key]}")

        else:
            print(f"\n  ❓ {ntype} [{short_id(nid)}]")


def main():
    data = load()
    sheets = data.get('sheets', [])

    print("="*70)
    print("  ДЕТАЛЬНЫЙ АНАЛИЗ: новый_бот_1_242_159")
    print("="*70)
    print(f"  Листов: {len(sheets)}")
    print(f"  Имена: {[s['name'] for s in sheets]}")

    for sheet in sheets:
        analyze_sheet_detail(sheet)


if __name__ == '__main__':
    main()
