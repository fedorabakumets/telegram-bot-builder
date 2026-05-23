"""
@fileoverview Временно упрощает bot-setv-calc — оставляет только Sanchez.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")


def main():
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sheets = data['sheets']

    # Находим bot-setv-calc
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            if node['id'] == 'bot-setv-calc':
                # Оставляем только sanchez + user_amount_fmt
                new_assignments = [
                    {
                        "id": "calc5",
                        "mode": "expression",
                        "value": "round({user_amount} / float({sanchez_rate}), 8) if float({sanchez_rate}) > 0 else 0",
                        "variable": "sanchez_btc"
                    },
                    {
                        "id": "fmt8",
                        "mode": "format_number",
                        "value": "{sanchez_rate}",
                        "variable": "sanchez_rate_fmt"
                    },
                    {
                        "id": "fmt4",
                        "mode": "format_number",
                        "value": "{user_amount}",
                        "variable": "user_amount_fmt"
                    },
                    # Заглушки для остальных (чтобы шаблон результата не падал)
                    {
                        "id": "stub1",
                        "mode": "set",
                        "value": "0",
                        "variable": "scooby_btc"
                    },
                    {
                        "id": "stub2",
                        "mode": "set",
                        "value": "0",
                        "variable": "scooby_rate_fmt"
                    },
                    {
                        "id": "stub3",
                        "mode": "set",
                        "value": "0",
                        "variable": "capitalist_btc"
                    },
                    {
                        "id": "stub4",
                        "mode": "set",
                        "value": "0",
                        "variable": "capitalist_rate_fmt"
                    },
                    {
                        "id": "stub5",
                        "mode": "set",
                        "value": "0",
                        "variable": "crypto24_btc"
                    },
                    {
                        "id": "stub6",
                        "mode": "set",
                        "value": "0",
                        "variable": "crypto24_rate_fmt"
                    },
                    {
                        "id": "stub7",
                        "mode": "set",
                        "value": "0",
                        "variable": "shaxta_btc"
                    },
                    {
                        "id": "stub8",
                        "mode": "set",
                        "value": "0",
                        "variable": "shaxta_rate_fmt"
                    },
                    {
                        "id": "stub9",
                        "mode": "set",
                        "value": "0",
                        "variable": "bitmixer_btc"
                    },
                    {
                        "id": "stub10",
                        "mode": "set",
                        "value": "0",
                        "variable": "bitmixer_rate_fmt"
                    },
                    {
                        "id": "stub11",
                        "mode": "set",
                        "value": "0",
                        "variable": "litebit_btc"
                    },
                    {
                        "id": "stub12",
                        "mode": "set",
                        "value": "0",
                        "variable": "litebit_rate_fmt"
                    },
                ]
                node['data']['assignments'] = new_assignments
                print(f"✅ bot-setv-calc: оставлен только Sanchez + заглушки")
                break

    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Сохранено: {PROJECT_PATH}")


if __name__ == '__main__':
    main()
