"""
@fileoverview Проверяем URL в json_push ботов — ищем проблемы с реф-ссылками
"""
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

with open(PROJECT_PATH, "r", encoding="utf-8") as f:
    project = json.load(f)

# Находим bot-setv-calc
for sheet in project["sheets"]:
    for node in sheet["nodes"]:
        if node["id"] == "bot-setv-calc":
            assignments = node["data"]["assignments"]
            print("=== json_push URLs в bot-setv-calc ===\n")
            for a in assignments:
                if a.get("mode") == "json_push":
                    # Парсим JSON value чтобы извлечь name и url
                    try:
                        obj = json.loads(a["value"].replace("'", '"'))
                        name = obj.get("name", "?")
                        url = obj.get("url", "?")
                    except:
                        # value содержит {переменные}, парсим вручную
                        val = a["value"]
                        name_start = val.find('"name": "') + 9
                        name_end = val.find('"', name_start)
                        name = val[name_start:name_end] if name_start > 8 else "?"
                        
                        url_start = val.find('"url": "') + 8
                        url_end = val.find('"', url_start)
                        url = val[url_start:url_end] if url_start > 7 else "?"
                    
                    # Проверяем есть ли реф-параметр
                    has_ref = "?start=" in url or "?ref=" in url or "start=" in url
                    ref_mark = "✅ реф" if has_ref else "❌ нет рефа"
                    print(f"  {a['id']:<20} {name:<16} {url:<50} {ref_mark}")

# Также проверим экраны обменников — какие реф-ссылки там
print("\n\n=== Реф-ссылки на экранах обменников (кнопки) ===\n")
for sheet in project["sheets"]:
    for node in sheet["nodes"]:
        if node.get("type") == "keyboard":
            for btn in node["data"].get("buttons", []):
                if btn.get("action") == "url" and "t.me" in btn.get("url", ""):
                    url = btn["url"]
                    text = btn["text"]
                    has_ref = "?start=" in url or "start=" in url
                    if has_ref:
                        print(f"  {text:<22} {url}")
