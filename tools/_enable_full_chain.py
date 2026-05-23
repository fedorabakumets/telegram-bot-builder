"""
@fileoverview Включает полную цепочку всех 16 ботов для сравнения.
Цепочка: bot-setv-init → scooby → capitalist → 24crypto → shaxta → bitmixer → litebit → sanchez → imperia → viron → cf → vortex → crazy → infinity → lucky → love → casper → bot-setv-calc
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

    # Восстанавливаем начало цепочки
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        init_node['data']['autoTransitionTo'] = 'bot-ub-scooby'
        print("✅ bot-setv-init → bot-ub-scooby")

    # Проверяем всю цепочку
    chain = [
        ('bot-setv-parse-scooby', 'bot-ub-capitalist-start'),
        ('bot-setv-parse-capitalist', 'bot-ub-24crypto-start'),
        ('bot-setv-parse-24crypto', 'bot-setv-24crypto-clean'),
        ('bot-setv-24crypto-clean', 'bot-ub-shaxta-start'),
        ('bot-setv-parse-shaxta', 'bot-setv-shaxta-clean'),
        ('bot-setv-shaxta-clean', 'bot-ub-bitmixer'),
        ('bot-setv-parse-bitmixer', 'bot-ub-litebit-start'),
        ('bot-setv-parse-litebit', 'bot-ub-sanchez-start'),
        ('bot-setv-parse-sanchez', 'bot-ub-imperia-start'),
        ('bot-setv-parse-imperia', 'bot-ub-viron-start'),
        ('bot-setv-parse-viron', 'bot-ub-cf-start'),
        ('bot-setv-parse-cf', 'bot-ub-vortex-start'),
        ('bot-setv-parse-vortex', 'bot-ub-crazy-start'),
        ('bot-setv-parse-crazy', 'bot-ub-inf-start'),
        ('bot-setv-parse-inf', 'bot-ub-lucky-start'),
        ('bot-setv-parse-lucky', 'bot-ub-love-start'),
        ('bot-setv-parse-love', 'bot-ub-casper-start'),
        ('bot-setv-parse-casper', 'bot-setv-calc'),
    ]

    for node_id, target in chain:
        node = find_node(sheets, node_id)
        if node:
            current = node['data'].get('autoTransitionTo', '')
            if current != target:
                node['data']['autoTransitionTo'] = target
                print(f"  ✏️ {node_id} → {target} (было: {current})")
            else:
                print(f"  ✅ {node_id} → {target}")
        else:
            print(f"  ❌ {node_id} НЕ НАЙДЕН!")

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    r = requests.put('http://localhost:5000/api/projects/242', json={'data': data})
    print(f"\n✅ API: {r.status_code}")
    print("\n🚀 Полная цепочка из 16 ботов включена!")


if __name__ == '__main__':
    main()
