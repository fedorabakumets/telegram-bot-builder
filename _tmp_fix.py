import json
with open('bots/импортированный_проект_2316_157_131/project.json', encoding='utf-8') as f:
    data = json.load(f)

for sheet in data['sheets']:
    for node in sheet.get('nodes', []):
        if node['id'] == 'import-create-project':
            # Отправляем json_data как строку в поле — но теперь сервер умеет принимать raw body
            # Меняем Content-Type на text/plain чтобы Express не пытался парсить как JSON
            node['data']['httpRequestBody'] = '{import_json_data}'
            node['data']['httpRequestHeaders'] = '{"Content-Type": "text/plain"}'
            print(f"✅ import-create-project: body = {{import_json_data}}, Content-Type = text/plain")

with open('bots/импортированный_проект_2316_157_131/project.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("✅ Сохранено")
