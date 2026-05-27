"""
@fileoverview Исправляет съеденные буквы в project.json.
Проблема: эмодзи с variation selector (◀️, 📋, 🤖) при записи через
Python one-liner в консоли обрезают следующий символ.
Этот скрипт находит все такие случаи и исправляет.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)

# Известные проблемные тексты и их исправления
FIXES = {
    "◀️ азад": "◀️ Назад",
    "◀️ азад в меню": "◀️ Назад в меню",
    "🤖 оты": "🤖 Боты",
    "📋 равнение через сайты": "📋 Сравнение через сайты",
    "📋 айты": "📋 Сайты",
}


def fix_text(text):
    """
    Исправляет съеденные буквы в тексте
    @param text - исходный текст
    @returns исправленный текст
    """
    if not text:
        return text
    fixed = text
    for broken, correct in FIXES.items():
        if broken in fixed:
            fixed = fixed.replace(broken, correct)
    return fixed


def main():
    """
    Основная функция: ищет и исправляет съеденные буквы во всём project.json
    """
    print(f"Читаю: {PROJECT_PATH}")
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))

    fixes_count = 0

    for sheet in data["sheets"]:
        for node in sheet["nodes"]:
            node_data = node.get("data", {})

            # Проверяем messageText
            msg = node_data.get("messageText", "")
            fixed_msg = fix_text(msg)
            if fixed_msg != msg:
                node_data["messageText"] = fixed_msg
                fixes_count += 1
                print(f"  [{node['id']}] messageText: fixed")

            # Проверяем кнопки
            for btn in node_data.get("buttons", []):
                btn_text = btn.get("text", "")
                fixed_btn = fix_text(btn_text)
                if fixed_btn != btn_text:
                    btn["text"] = fixed_btn
                    fixes_count += 1
                    print(f"  [{node['id']}] button '{btn_text}' -> '{fixed_btn}'")

            # Проверяем assignments (value)
            for assignment in node_data.get("assignments", []):
                val = assignment.get("value", "")
                fixed_val = fix_text(val)
                if fixed_val != val:
                    assignment["value"] = fixed_val
                    fixes_count += 1
                    print(f"  [{node['id']}] assignment '{assignment.get('id','')}': fixed")

    # Сохраняем
    PROJECT_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\nИсправлено: {fixes_count}")
    print("Saved")


if __name__ == "__main__":
    main()
