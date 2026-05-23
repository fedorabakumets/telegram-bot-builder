"""
@fileoverview Отключает все боты кроме VIRON для тестирования.
"""

import json
import requests
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")


def main():
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sheets = data['sheets']

    for s in sheets:
        for n in s.get('nodes', []):
            if n['id'] == 'bot-setv-init':
                n['data']['autoTransitionTo'] = 'bot-ub-viron-start'
                print('bot-setv-init -> bot-ub-viron-start')
            if n['id'] == 'bot-setv-parse-viron':
                target = n['data'].get('autoTransitionTo', '')
                print(f'bot-setv-parse-viron -> {target}')

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f'API: {r.status_code}')


if __name__ == '__main__':
    main()
