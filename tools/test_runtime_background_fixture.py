"""@fileoverview Адресные проверки изоляции фоновых данных и исполнения настоящих шаблонов кешей."""
import ast
import asyncio
import json
import logging
from pathlib import Path
import sys
from types import SimpleNamespace as NS
import unittest

from runtime_background_fixture import seed_background, warm_background, background_snapshot

SOURCES = json.loads(Path(sys.argv.pop()).read_text(encoding='utf-8')) if len(sys.argv) > 1 and sys.argv[-1].endswith('.json') else {}


class Connection:
    """Хранит только синтетические записи seed, подменяя транспорт PostgreSQL в адресном тесте."""
    def __init__(self, database='tbb_full_probe_fixture'):
        """Создаёт независимое хранилище и журнал изменяющих операций."""
        self.database, self.writes = database, []
        self.tables, self.columns, self.rows, self.media, self.tokens = [], [], [], [], []

    async def fetchval(self, query, *args):
        """Возвращает имя тестовой базы для проверки seed-ограничения."""
        return self.database

    async def execute(self, query, *args):
        """Учитывает SQL и сохраняет объекты таблиц и медиа без пользовательских данных."""
        self.writes.append((query, args))
        if query.startswith('INSERT INTO bot_tables('):
            self.tables.append(args)
        elif query.startswith('INSERT INTO media_files('):
            self.media.append(args)
        elif query.startswith('INSERT INTO media_file_tokens('):
            self.tokens.append(args)

    async def executemany(self, query, rows):
        """Сохраняет колонки или строки для настоящего чтения шаблона кеша."""
        self.writes.append((query, ()))
        (self.columns if 'bot_table_columns' in query else self.rows).extend(rows)

    async def fetchrow(self, query, *args):
        """Находит синтетическую таблицу контента или пустую запись пользователя."""
        if 'bot_tables' in query:
            return {'id': self.tables[0][0]}
        return None

    async def fetch(self, query, *args):
        """Возвращает форму Record, которую ожидают настоящие сгенерированные функции."""
        if 'media_file_tokens' in query:
            urls = {row[0]: row[2] for row in self.media}
            return [{'url': urls[media], 'file_id': file_id} for media, token, file_id in self.tokens if token == args[1]]
        if 'SELECT data FROM bot_table_rows' in query:
            return [{'data': data} for table, data, _ in self.rows if table == args[0]]
        if 'JOIN bot_table_columns' in query:
            return [{'table_id': table, 'col_name': name, 'col_id': column} for column, table, name, _ in self.columns]
        names = {table: name for table, _, name in self.tables}
        return [{'table_id': table, 'table_name': names[table], 'data': data, 'row_index': index} for table, data, index in self.rows]

    def acquire(self):
        """Возвращает независимый асинхронный контекст подключения."""
        return self

    async def __aenter__(self):
        """Передаёт тестовое подключение шаблону."""
        return self

    async def __aexit__(self, *args):
        """Не подавляет ошибки настоящего алгоритма."""
        return False


def namespace(source, connection):
    """Исполняет выбранные функции настоящего generated-кода без startup и Telegram."""
    selected = {'_refresh_bot_tables_cache', 'init_all_user_vars', 'load_content', 'reload_content',
                '_load_media_file_id_cache', '_schedule_execute_scheduled', 'handle_callback_scheduled_value'}
    nodes = [node for node in ast.parse(source).body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in selected]
    for node in nodes:
        node.decorator_list = []
    values = dict(asyncio=asyncio, logging=logging, db_pool=connection, PROJECT_ID=987654321,
                  TOKEN_ID=18004, BOT_TOKEN='fixture', user_data={}, _user_last_seen={},
                  _bot_tables_cache=None, _bot_tables_cache_ts=0, _bot_tables_cache_lock=asyncio.Lock(),
                  _content_cache={}, _content_table_id=None, _media_file_id_cache={},
                  _sched_running_scheduled=False, _sched_count_scheduled=0,
                  types=NS(User=lambda **args: NS(**args), CallbackQuery=object), FSMContext=object,
                  replace_variables_in_text=lambda text, variables: text)

    async def persist(user, key, value):
        """Сохраняет эффект set_variable без дополнительного фонового транспорта."""
        values['user_data'].setdefault(user, {})[key] = value

    values['set_user_var'] = persist
    exec(compile(ast.Module(body=nodes, type_ignores=[]), '<настоящие фоновые шаблоны>', 'exec'), values)
    return values


class BackgroundFixtureTest(unittest.IsolatedAsyncioTestCase):
    """Отделяет проверку fixture от длинного PostgreSQL/Redis прогона."""
    async def test_seed_rejects_other_database_before_any_write(self):
        """Имя обычной базы блокирует все изменяющие операции."""
        connection = Connection('production')
        with self.assertRaises(ValueError):
            await seed_background(connection, 987654321, {'5': 18003})
        self.assertEqual(connection.writes, [])

    @unittest.skipUnless(SOURCES, 'Нужны исходники, сгенерированные TypeScript-проверкой')
    async def test_seed_and_actual_cache_flatten_and_media(self):
        """Настоящие шаблоны читают все118 synthetic rows,84контента и29file_id."""
        connection = Connection()
        metadata = await seed_background(connection, 987654321, {'5': 18003})
        self.assertTrue(metadata['synthetic'])
        self.assertEqual(len(connection.rows), 118)
        values = namespace(SOURCES['11'], connection)
        await values['load_content'](connection)
        await warm_background(values, '11')
        snapshot = background_snapshot(values)
        self.assertEqual((snapshot['contentKeys'], snapshot['tableKeys'], snapshot['tableRows'], snapshot['userCount']), (84, 3, 118, 2))
        variables = await values['init_all_user_vars'](91001)
        self.assertEqual(variables['fixture_nested.items[-1].value'], '7')
        self.assertEqual(variables['table.fixture_items[31].column_3'], '31')
        self.assertGreater(snapshot['tableUtf8Bytes'], snapshot['contentUtf8Bytes'])
        # Повторная перезагрузка заменяет кеш, сохраняя его размер и значения.
        previous = values['_content_cache']
        await values['reload_content'](connection)
        self.assertEqual(previous, values['_content_cache'])
        self.assertIsNot(previous, values['_content_cache'])
        media = namespace(SOURCES['5'], connection)
        media['TOKEN_ID'] = 18003
        await media['_load_media_file_id_cache']()
        self.assertEqual(background_snapshot(media)['fileIds'], 29)
        media['TOKEN_ID'] = 18002
        media['_media_file_id_cache'].clear()
        await media['_load_media_file_id_cache']()
        self.assertEqual(background_snapshot(media)['fileIds'], 0)

    @unittest.skipUnless(SOURCES, 'Нужны исходники, сгенерированные TypeScript-проверкой')
    async def test_actual_schedule_counter_and_assignment(self):
        """Два настоящих выполнения schedule увеличивают счётчик и исполняют set_variable."""
        connection = Connection()
        await seed_background(connection, 987654321, {'5': 18003})
        values = namespace(SOURCES['26'], connection)
        await values['_schedule_execute_scheduled']()
        await values['_schedule_execute_scheduled']()
        self.assertEqual(background_snapshot(values)['scheduleRuns'], 2)
        self.assertFalse(values['_sched_running_scheduled'])
        self.assertEqual(values['user_data'][0]['fixture_tick'], '1')
        self.assertEqual(sum('UPDATE schedule_state' in query for query, _ in connection.writes), 2)

    async def test_snapshot_counts_live_tasks_without_exposing_payload(self):
        """Завершённые задачи исключаются, а данные представлены только агрегатами."""
        done = asyncio.create_task(asyncio.sleep(0))
        pending = asyncio.create_task(asyncio.sleep(60))
        await done
        try:
            snapshot = background_snapshot({'_schedule_tasks': [done, pending],
                '_sched_count_first': 2, '_sched_count_second': 3,
                'user_data': {1: {'private': 'synthetic-marker'}}})
            self.assertEqual(snapshot['scheduleTasks'], 1)
            self.assertEqual(snapshot['scheduleRuns'], 5)
            self.assertEqual(snapshot['userCount'], 1)
            self.assertNotIn('synthetic-marker', json.dumps(snapshot))
        finally:
            pending.cancel()
            await asyncio.gather(pending, return_exceptions=True)


if __name__ == '__main__':
    unittest.main()
