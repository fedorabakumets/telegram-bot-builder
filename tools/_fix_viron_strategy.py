"""
@fileoverview Исправляет VIRON — меняет стратегию на first для получения текста капчи.
Проблема: longest берёт старое сообщение с курсом вместо новой капчи.
Решение: убираем saveResponseTextTo, добавляем промежуточный click_button
который просто читает последнее сообщение (без нажатия) через saveResultTo.
Или проще: меняем responseStrategy на 'first'.
"""

import json
import requests
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")


def find_node(sheets, node_id):
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            if node['id'] == node_id:
                return node
    return None


def main():
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sheets = data['sheets']

    # Исправление: bot-ub-viron-start должен сохранять текст ПЕРВОГО ответа
    # Меняем responseStrategy на 'first'
    node = find_node(sheets, 'bot-ub-viron-start')
    if node:
        node['data']['responseStrategy'] = 'first'
        print(f"bot-ub-viron-start: responseStrategy = 'first'")

    # Также нужно убедиться что regex для капчи работает
    # Текст капчи: "🤖 **Проверка безопасности**\n\nНажмите на кнопку с эмодзи: **🍀**"
    # В Telethon text (без markdown): "🤖 Проверка безопасности\n\nНажмите на кнопку с эмодзи: 🍀"
    # Но saveResponseTextTo сохраняет raw text с ** — нужно учесть
    # Regex: эмодзи:\s*\*{0,2}([^\s*]+)\*{0,2} — уже правильный

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"API: {r.status_code}")


if __name__ == '__main__':
    main()
