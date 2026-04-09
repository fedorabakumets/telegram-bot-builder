"""
Исправляет тексты сообщений в project.json:
1. Опечатки
2. Пробелы после эмодзи в начале строки
3. formatMode: html для всех message-узлов
"""
import json, re

PATH = "bots/обменники_133_126/project.json"

# Точечные замены (старое -> новое)
REPLACEMENTS = [
    ("отзвов",          "отзывов"),
    ("Встроенный кошеле\n", "Встроенный кошелёк\n"),
    ("познакомишся",    "познакомишься"),
    ("Лояльны комиссии","Лояльные комиссии"),
    ("NYC и AML",       "KYC и AML"),
    ("Capitali%t",      "Capitalist"),
    ("SANCHEZ EXCHANGE - ЭТО:", "SANCHEZ EXCHANGE — ЭТО:"),
]

# Эмодзи которые идут без пробела перед текстом
EMOJI_NO_SPACE = re.compile(
    r'([\U0001F300-\U0001FFFF\u2600-\u27BF\u2300-\u23FF'
    r'\u24C2-\u24FF\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF'
    r'\uFE00-\uFE0F\u20D0-\u20FF\u231A-\u231B\u23E9-\u23F3'
    r'\u23F8-\u23FA\u25AA-\u25AB\u25B6\u25C0\u25FB-\u25FE'
    r'\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB'
    r'\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3'
    r'\u26F5\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F'
    r'\u2712\u2714\u2716\u271D\u2721\u2728\u2733-\u2734'
    r'\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763-\u2764'
    r'\u2795-\u2797\u27A1\u27B0\u27BF\u2934-\u2935'
    r'\u2B05-\u2B07\u2B1B-\u2B1C\u2B50\u2B55\u3030\u303D'
    r'\u3297\u3299])'
    r'([^\s\n])',
    re.UNICODE
)

def fix_emoji_spaces(text):
    """Добавляет пробел после эмодзи если его нет, только в начале строки"""
    lines = text.split('\n')
    fixed = []
    for line in lines:
        stripped = line.lstrip()
        # Если строка начинается с эмодзи и сразу текст — добавляем пробел
        new_line = EMOJI_NO_SPACE.sub(r'\1 \2', stripped)
        # Восстанавливаем отступ
        indent = line[:len(line) - len(stripped)]
        fixed.append(indent + new_line)
    return '\n'.join(fixed)

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d
typo_fixes = 0
space_fixes = 0
format_fixes = 0

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "message":
            continue
        data = node["data"]
        text = data.get("messageText", "")
        if not text.strip():
            continue

        # 1. Опечатки
        for old, new in REPLACEMENTS:
            if old in text:
                text = text.replace(old, new)
                typo_fixes += 1
                print(f"  typo: '{old}' → '{new}'")

        # 2. Пробелы после эмодзи
        fixed = fix_emoji_spaces(text)
        if fixed != text:
            space_fixes += 1
            text = fixed

        data["messageText"] = text

        # 3. formatMode html
        if data.get("formatMode", "none") == "none":
            data["formatMode"] = "html"
            format_fixes += 1

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"\nОпечатки исправлены: {typo_fixes}")
print(f"Пробелы после эмодзи: {space_fixes} сообщений")
print(f"formatMode=html: {format_fixes} узлов")
print(f"Готово → {PATH}")
