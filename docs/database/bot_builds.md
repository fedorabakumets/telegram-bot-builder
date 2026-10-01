# bot_builds

## bot_builds

Сборка бота: сжатый сгенерированный `.py` лежит в хранилище (local/S3),  
здесь — только метаданные. Одна сборка на пару (токен, отпечаток).

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор сборки |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Проект, для которого собран код |
| token_id | integer | - | NO | - | [bot_tokens.id](./bot_tokens.md) | Токен бота, для которого собран код |
| fingerprint | text | - | NO | - | - | Отпечаток входных данных генерации (sha256 hex) |
| storage_config_id | text | - | NO | - | - | ID хранилища (storage_configs.id или служебный локальный) |
| object_key | text | - | NO | - | - | Ключ объекта в хранилище |
| file_name | text | - | NO | - | - | Имя основного файла бота (например, bot.py) |
| size | integer | - | NO | - | - | Размер несжатого кода в байтах |
| sha256 | text | - | NO | - | - | sha256 несжатого кода (hex) — проверка целостности при загрузке |
| generator_version | text | - | NO | - | - | Версия генератора на момент сборки |
| created_at | timestamp | `now()` | NO | - | - | Дата создания сборки |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |
| fk_token_id_bot_tokens | FOREIGN KEY | (token_id) → bot_tokens(id) |

### Indexes

| Name | Columns | Unique | Type |
|------|---------|--------|------|
| uq_bot_builds_token_fingerprint | token_id, fingerprint | YES | - |
| idx_bot_builds_token_created | token_id, created_at | NO | - |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_projects.id](./bot_projects.md) | **[bot_builds.project_id](./bot_builds.md)** | Many to One |
| [bot_tokens.id](./bot_tokens.md) | **[bot_builds.token_id](./bot_builds.md)** | Many to One |
