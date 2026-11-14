"""@fileoverview Обезличенные данные фоновых ролей для изолированной локальной базы стресс-теста."""
import json
import time


async def seed_background(connection, project_id, role_tokens):
    """Создаёт синтетические таблицы, контент84 и file_id29 только в тестовой базе."""
    database = await connection.fetchval('SELECT current_database()')
    if not str(database).startswith('tbb_full_probe_'):
        raise ValueError('Фоновая фикстура разрешена только в изолированной тестовой базе')
    await connection.execute('''CREATE TABLE IF NOT EXISTS schedule_state (
        id serial PRIMARY KEY, project_id integer NOT NULL, token_id integer NOT NULL,
        node_id text NOT NULL, last_run_at timestamptz, next_run_at timestamptz,
        run_count integer NOT NULL DEFAULT 0, last_duration_ms integer, last_error text,
        last_status text NOT NULL DEFAULT 'idle', enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
        UNIQUE(project_id,token_id,node_id));''')
    # Размер неизвестных production-значений не выдумываем: это явный синтетический нижний профиль.
    for table_index, (name, count) in enumerate((('_content', 84), ('fixture_items', 32), ('fixture_flags', 2))):
        table_id = 71001 + table_index
        await connection.execute('INSERT INTO bot_tables(id,project_id,name) VALUES($1,$2,$3)', table_id, project_id, name)
        columns = [(72000 + table_index * 10 + column, table_id, f'column_{column}', column) for column in range(1, 5)]
        await connection.executemany('INSERT INTO bot_table_columns(id,table_id,name,position) VALUES($1,$2,$3,$4)', columns)
        rows = []
        for row in range(count):
            data = {str(columns[0][0]): f'fixture_{table_index}_{row}',
                    str(columns[1][0]): 'обезличено', str(columns[2][0]): str(row),
                    str(columns[3][0]): 'Синтетическое значение ' + 'я' * 64}
            rows.append((table_id, json.dumps(data, ensure_ascii=False), row))
        await connection.executemany('INSERT INTO bot_table_rows(table_id,data,row_index) VALUES($1,$2::jsonb,$3)', rows)
    media_token = role_tokens['5']
    for index in range(29):
        media_id = 73000 + index
        await connection.execute('INSERT INTO media_files(id,project_id,url) VALUES($1,$2,$3)', media_id, project_id, f'https://fixture.invalid/media/{index}')
        await connection.execute('INSERT INTO media_file_tokens(media_file_id,token_id,file_id) VALUES($1,$2,$3)', media_id, media_token, f'fixture-file-id-{index}')
    return {'synthetic': True, 'contentRows': 84, 'tableRows': [84, 32, 2], 'fileIds': 29,
            'scheduleIntervalSeconds': 60, 'telethon': 'не включён: наличие в исходных четырёх схемах не подтверждено'}


async def warm_background(namespace, role):
    """Прогревает реальные таблицы и flatten у роли11, не выполняя сообщений Telegram."""
    if role != '11':
        return
    for user_id in (91001, 91002):
        namespace['user_data'][user_id] = {'fixture_nested': {'value': 'обезличено', 'items': [{'value': str(index)} for index in range(8)]}}
        namespace['_user_last_seen'][user_id] = time.monotonic()
        variables = await namespace['init_all_user_vars'](user_id)
        if 'fixture_nested.value' not in variables or len(namespace.get('_bot_tables_cache') or {}) != 3:
            raise AssertionError('Настоящие таблицы и flatten не прогреты')
    if len(namespace.get('_content_cache') or {}) != 84:
        raise AssertionError('Контент84 не загружен настоящим main')


def _encoded_bytes(value):
    """Считает сериализованный размер значений, не выдавая его за глубинный размер Python-объектов."""
    return len(json.dumps(value, ensure_ascii=False, default=str).encode('utf-8'))


def background_snapshot(namespace):
    """Возвращает только агрегаты кешей и состояние фоновых задач без данных пользователей."""
    tables = namespace.get('_bot_tables_cache') or {}
    return {'contentKeys': len(namespace.get('_content_cache') or {}),
            'contentUtf8Bytes': _encoded_bytes(namespace.get('_content_cache') or {}),
            'tableKeys': len(tables), 'tableRows': sum(len(value) for value in tables.values() if isinstance(value, list)),
            'tableUtf8Bytes': _encoded_bytes(tables),
            'userCount': len(namespace.get('user_data') or {}),
            'userUtf8Bytes': _encoded_bytes(namespace.get('user_data') or {}),
            'fileIds': len(namespace.get('_media_file_id_cache') or {}),
            'scheduleTasks': sum(not task.done() for task in namespace.get('_schedule_tasks', [])),
            'scheduleRuns': sum(value for name, value in namespace.items() if name.startswith('_sched_count_') and isinstance(value, int)),
            'telethonConfigured': namespace.get('userbot_client') is not None}
