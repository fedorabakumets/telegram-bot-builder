"""Исправляет отсутствующий пробел после pocket-exchange.com: в текстах сообщений."""
import json

path = "bots/обменники_240_153/project.json"

with open(path, "r", encoding="utf-8") as f:
    raw = f.read()

count = raw.count("pocket-exchange.com:<b>")
raw = raw.replace("pocket-exchange.com:<b>", "pocket-exchange.com: <b>")

with open(path, "w", encoding="utf-8") as f:
    f.write(raw)

print(f"✅ Исправлено {count} мест")
