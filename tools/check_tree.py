import json

with open('tree.json', 'r', encoding='utf-8') as f:
    tree = json.load(f)

for e in tree:
    print(f"{e['path']}: {e['title']}")
