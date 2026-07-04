# storage_configs

## storage_configs

Таблица реестра хранилищ: несколько S3 (разные бакеты/endpoint'ы/креды)  
и несколько локальных папок. Одно хранилище помечено активным для новых  
загрузок; читать можно из всех.

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | text | - | NO | [media_files.storage_config_id](./media_files.md) | - | Стабильный строковый идентификатор (используется в media_files.storageConfigId) |
| name | text | - | NO | - | - | Человекочитаемое имя («Локально: uploads», «S3: backups») |
| backend | text | - | NO | - | - | Тип бэкенда: "local" \| "s3" |
| is_active | boolean | `false` | NO | - | - | Активно для новых загрузок (ровно одно активное на инстанс) |
| config | jsonb | - | NO | - | - | Несекретные параметры (jsonb): local → { rootPath }; s3 → { endpointUrl, region, bucket, forcePathStyle, publicUrlBase } |
| secrets_enc | text | - | YES | - | - | Зашифрованные креды S3 (accessKeyId/secretAccessKey); null для local |
| read_only | boolean | `false` | NO | - | - | Доступно только для чтения (нельзя выбрать для записи) |
| created_at | timestamp | `now()` | YES | - | - | Дата создания |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[storage_configs.id](./storage_configs.md)** | [media_files.storage_config_id](./media_files.md) | Many to One |
