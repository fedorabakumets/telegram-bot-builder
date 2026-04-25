"""Финальный фикс: users_offset как отдельная переменная."""
import json

path = 'bots/импортированный_проект_2316_157_131/project.json'

with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

sheet = next(s for s in data['sheets'] if s['id'] == 'sheet-users')
nodes = sheet['nodes']

# 1. fetch-bot-users — возвращаем {users_offset} в URL
fetch = next(n for n in nodes if n['id'] == 'fetch-bot-users')
fetch['data']['httpRequestUrl'] = (
    'http://localhost:5000/api/bot/tokens/{token_status.instance.tokenId}'
    '/users?telegram_id={user_id}&limit=10&offset={users_offset}'
)
fetch['data']['httpRequestPaginationOffsetVar'] = 'users_offset'

# 2. incoming-pagination-trigger — сохраняем в users_offset
trigger = next(n for n in nodes if n['id'] == 'incoming-pagination-trigger')
trigger['data']['callbackDataSaveAs'] = 'users_offset'
trigger['data']['callbackDataStripPrefix'] = 'pg_'
trigger['data']['callbackPattern'] = 'pg_'
trigger['data']['callbackMatchType'] = 'startsWith'
trigger['data']['autoTransitionTo'] = 'fetch-bot-users'
trigger['data']['enableAutoTransition'] = True

sheet['updatedAt'] = '2026-04-25T16:00:00.000Z'

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open(path, 'r', encoding='utf-8') as f:
    json.load(f)
print('JSON валидный')
print(f'fetch URL: {fetch["data"]["httpRequestUrl"]}')
print(f'paginationOffsetVar: {fetch["data"]["httpRequestPaginationOffsetVar"]}')
print(f'trigger callbackDataSaveAs: {trigger["data"]["callbackDataSaveAs"]}')
print(f'trigger callbackDataStripPrefix: {trigger["data"]["callbackDataStripPrefix"]}')
print(f'trigger callbackPattern: {trigger["data"]["callbackPattern"]}')
