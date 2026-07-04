# project_versions

## project_versions

Таблица версий проектов — хранит снимки данных проекта (BotDataWithSheets)

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор версии |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта (ссылка на bot_projects.id) |
| snapshot | jsonb | - | NO | - | - | Снимок данных проекта (BotDataWithSheets) |
| label | text | - | YES | - | - | Опциональная метка версии (например имя проекта на момент снимка) |
| author_id | bigint | - | YES | - | [telegram_users.id](./telegram_users.md) | Идентификатор автора снимка (ссылка на telegram_users.id) |
| kind | text | `'auto'` | NO | - | - | Тип версии: "auto" — авто-снимок при сохранении, "manual" — ручной коммит-чекпоинт |
| author_kind | text | - | YES | - | - | Тип автора снимка: 'agent' — ИИ-агент (MCP), NULL/'user' — обычный пользователь |
| created_at | timestamp | `now()` | YES | - | - | Время создания версии |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_author_id_telegram_users | FOREIGN KEY | (author_id) → telegram_users(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| idx_project_versions_project | project_id | NO | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[project_versions.project_id](./project_versions.md)** | Many to One |
| [telegram_users.id](./telegram_users.md) | **[project_versions.author_id](./project_versions.md)** | Many to One |
