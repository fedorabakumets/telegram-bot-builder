"""@fileoverview Регрессии закрытия SQLite-очереди при ошибках SQL, чтения и завершения транзакции."""
import asyncio
import json
import logging
import os
from pathlib import Path
from types import SimpleNamespace as NS
import sys
import tempfile
import unittest

GENERATED = Path(sys.argv.pop()).read_text(encoding='utf-8')


class BrokenConnection:
    """Имитирует сбой в выбранной фазе и считает освобождение соединения."""
    def __init__(self, failure='execute', rows=()):
        self.failure, self.rows, self.closed = failure, rows, 0

    def __enter__(self):
        """Возвращает контекст транзакции."""
        return self

    def __exit__(self, *args):
        """Имитирует ошибку фиксации, которую тоже должен пережить closing."""
        if self.failure == 'commit':
            raise OSError('Ошибка фиксации')

    def execute(self, *args):
        """Возвращает курсор либо имитирует SQL-ошибку."""
        if self.failure == 'execute':
            raise OSError('Ошибка SQL')
        return self

    def fetchall(self):
        """Возвращает пачку либо имитирует ошибку чтения курсора."""
        if self.failure == 'fetchall':
            raise OSError('Ошибка чтения')
        return self.rows

    def close(self):
        """Фиксирует ровно одно закрытие ресурса."""
        self.closed += 1


class SpoolResourcesTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет все пути SQLite без зависимости от PostgreSQL и Telegram."""
    async def asyncSetUp(self):
        """Создаёт отдельный runtime и безопасный временный путь очереди."""
        self.directory = tempfile.TemporaryDirectory()
        self.runtime = {'PROJECT_ID': 12, 'TOKEN_ID': 3, 'json': json, 'asyncio': asyncio,
                        'logging': logging, 'os': os, 'types': NS(Message=object, CallbackQuery=object),
                        'BaseMiddleware': object}
        exec(compile(GENERATED, '<generated>', 'exec'), self.runtime)
        self.runtime['_analytics_spool_directory'] = lambda: Path(self.directory.name)
        self.runtime['_analytics_prepare_event'] = lambda *args: ({'event_key': 'test'}, None)

    async def asyncTearDown(self):
        """Освобождает только временные файлы этого теста."""
        self.directory.cleanup()

    async def test_store_ack_and_read_failures_close_connection(self):
        """SQL, commit и fetchall не удерживают ни дескриптор, ни кеш соединения."""
        for name, arguments in (('_analytics_spool_store', ({'kind': 'test'},)),
                                ('_analytics_spool_ack', ('test',)),
                                ('_analytics_spool_flush', ())):
            for failure in ('execute', 'commit', 'fetchall'):
                if failure == 'fetchall' and name != '_analytics_spool_flush':
                    continue
                with self.subTest(operation=name, failure=failure):
                    connection = BrokenConnection(failure)
                    self.runtime['_analytics_spool_connection'] = lambda: connection
                    with self.assertRaises(OSError):
                        result = self.runtime[name](*arguments)
                        if asyncio.iscoroutine(result):
                            await result
                    self.assertEqual(connection.closed, 1)

    async def test_retry_metadata_failure_closes_connection(self):
        """Повтор после сбоя PostgreSQL закрывает SQLite даже при ошибке UPDATE."""
        read = BrokenConnection(None, [('test', '{}', None, 0)])
        retry = BrokenConnection()
        connections = iter((read, retry))
        self.runtime['_analytics_spool_connection'] = lambda: next(connections)
        self.runtime['db_pool'] = None
        with self.assertRaises(OSError):
            await self.runtime['_analytics_spool_flush']()
        self.assertEqual((read.closed, retry.closed), (1, 1))

    async def test_initialization_failure_closes_connection(self):
        """Неуспешная подготовка SQLite освобождает ещё не выданное соединение."""
        connection = BrokenConnection()
        self.runtime['_AnalyticsSqlite'] = NS(connect=lambda *args, **kwargs: connection)
        with self.assertRaises(OSError):
            self.runtime['_analytics_spool_connection']()
        self.assertEqual(connection.closed, 1)


if __name__ == '__main__':
    unittest.main()
