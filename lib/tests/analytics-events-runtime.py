"""@fileoverview Исполняемые проверки классификации, успешной отправки и атомарной записи аналитики."""

import asyncio
import json
import logging
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace as NS

generated_code = Path(sys.argv.pop()).read_text(encoding='utf-8')


def load_runtime():
    """Загружает новое пространство имён как отдельный запуск сгенерированного бота."""
    runtime = {'PROJECT_ID': 12, 'TOKEN_ID': 3, 'json': json, 'asyncio': asyncio, 'logging': logging, 'os': os,
               'types': NS(Message=object, CallbackQuery=object), 'BaseMiddleware': object}
    exec(compile(generated_code, '<generated>', 'exec'), runtime)
    return runtime


scope = load_runtime()


class Bot:
    """Подставляет профиль текущего бота без сети."""
    id = 99

    async def me(self):
        """Возвращает username для проверки явной команды."""
        return NS(username='current_bot')


def message(chat_type='private', text='Привет', **changes):
    """Создаёт Telegram-подобное сообщение с настоящей идентичностью."""
    values = dict(from_user=NS(id=7, is_bot=False), sender_chat=None,
                  chat=NS(id=7 if chat_type == 'private' else -100, type=chat_type),
                  text=text, caption=None, content_type='text', message_id=8,
                  date=datetime(2026, 11, 2, tzinfo=timezone.utc), reply_to_message=None)
    values.update(changes)
    return NS(**values)


class Transaction:
    """Эмулирует откат всей транзакции и вложенного savepoint."""
    def __init__(self, conn):
        self.conn = conn

    async def __aenter__(self):
        self.snapshot = (dict(self.conn.events), list(self.conn.rows), self.conn.counters)
        self.conn.depth += 1
        return self

    async def __aexit__(self, kind, value, traceback):
        self.conn.depth -= 1
        if kind:
            self.conn.events, self.conn.rows, self.conn.counters = self.snapshot


class Connection:
    """Проверяет контракт транзакции и поведение повторной доставки."""
    def __init__(self):
        self.events, self.rows, self.counters, self.depth = {}, [], 0, 0
        self.fail_insert = False
        self.fail_resolver = False
        self.discard_reason = None
        self.resolver_inputs = []

    def transaction(self):
        return Transaction(self)

    async def fetchval(self, sql, *args):
        event = json.loads(args[0])
        if self.discard_reason:
            return {'inserted': False, 'discarded': True, 'reason': self.discard_reason, 'event_id': None, 'revision': None}
        if event.get('observed_tag'):
            self.resolver_inputs.append(event['observed_tag'])
            if self.fail_resolver:
                raise ConnectionError('Реестр временно недоступен')
            event.update(attribution_status='resolved', source_id=4)
        key = event['event_key']
        inserted = key not in self.events
        self.events.setdefault(key, event)
        return json.dumps({'event_id': '1', 'revision': '1', 'inserted': inserted})

    async def fetchrow(self, sql, *args):
        if sql.startswith('SELECT'):
            return self.rows[0] if self.rows else None
        if self.fail_insert:
            raise ConnectionError('Разрыв при записи')
        row = {'id': len(self.rows) + 1, 'user_id': args[2], 'message_type': args[3],
               'message_text': args[4], 'message_data': json.loads(args[6]),
               'created_at': datetime.now(timezone.utc)}
        self.rows.append(row)
        return row

    async def execute(self, sql, *args):
        if 'INSERT INTO message_activity_daily' in sql:
            self.counters += 1


class Pool:
    """Выдаёт одно соединение для последовательных сценариев теста."""
    def __init__(self, connection):
        self.connection = connection

    def acquire(self):
        return self

    async def __aenter__(self):
        return self.connection

    async def __aexit__(self, *args):
        return None


class AnalyticsRuntimeTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет бизнес-правила на исполняемом сгенерированном Python."""

    async def asyncSetUp(self):
        self.conn = Connection()
        scope['db_pool'], scope['_redis_client'] = Pool(self.conn), None
        scope['_analytics_scope_deleted'] = False
        self.spool = tempfile.TemporaryDirectory()
        self.old_spool = os.environ.get('ANALYTICS_SPOOL_DIR')
        os.environ['ANALYTICS_SPOOL_DIR'] = self.spool.name

    async def asyncTearDown(self):
        """Удаляет только тестовую очередь и возвращает настройку окружения."""
        self.spool.cleanup()
        if self.old_spool is None:
            os.environ.pop('ANALYTICS_SPOOL_DIR', None)
        else:
            os.environ['ANALYTICS_SPOOL_DIR'] = self.old_spool

    async def test_private_group_commands_replies(self):
        classify = scope['_analytics_classify_message']
        self.assertTrue((await classify(message(), {'bot': Bot()}))['directed'])
        self.assertFalse((await classify(message('supergroup'), {'bot': Bot()}))['directed'])
        self.assertTrue((await classify(message('group', '/buy'), {'bot': Bot(), 'command': object()}))['directed'])
        self.assertFalse((await classify(message('group', '/buy'), {'bot': Bot()}))['directed'])
        self.assertTrue((await classify(message('group', '/buy@CURRENT_BOT'), {'bot': Bot()}))['directed'])
        self.assertFalse((await classify(message('group', '/buy@another_bot'), {'bot': Bot()}))['directed'])
        self.assertTrue((await classify(message('group', reply_to_message=NS(from_user=NS(id=99))), {'bot': Bot()}))['directed'])
        self.assertFalse((await classify(message('group', '@current_bot'), {'bot': Bot()}))['directed'])

    async def test_non_humans_and_service_messages(self):
        classify = scope['_analytics_classify_message']
        for event in [message(from_user=None), message(from_user=NS(id=5, is_bot=True)),
                      message(sender_chat=NS(id=-2)), message(content_type='new_chat_members'), message(_is_fake=True)]:
            self.assertIsNone(await classify(event, {'bot': Bot()}))

    async def test_callback_identity_and_fake_exclusion(self):
        classify = scope['_analytics_classify_callback']
        event = NS(id='987', from_user=NS(id=7, is_bot=False), message=message('group'))
        payload = classify(event)
        self.assertEqual(payload['kind'], 'callback')
        self.assertEqual(payload['event_key'], 'cb:987')
        self.assertTrue(payload['directed'])
        event._is_fake = True
        self.assertIsNone(classify(event))

    async def test_atomic_duplicate_and_rollback(self):
        payload = await scope['_analytics_classify_message'](message(), {'bot': Bot()})
        save = scope['_save_message_once']
        await save('7', 'user', 'Привет', message_data={'message_id': 8}, analytics_event=payload)
        await save('7', 'user', 'Привет', message_data={'message_id': 8}, analytics_event=payload)
        self.assertEqual((len(self.conn.events), len(self.conn.rows), self.conn.counters), (1, 1, 1))
        payload = dict(payload, event_key='msg:7:9')
        self.conn.fail_insert = True
        with self.assertRaises(ConnectionError):
            await save('7', 'user', 'Привет', message_data={'message_id': 9}, analytics_event=payload)
        self.assertNotIn('msg:7:9', self.conn.events)

    async def test_login_secret_never_reaches_storage_or_resolver(self):
        event = message(text='/start link_Sensitive-123')
        payload = await scope['_analytics_classify_message'](event, {'bot': Bot()})
        await scope['_save_message_once']('7', 'user', event.text,
            message_data={'message_id': 8, 'url': 'https://t.me/bot?start=link_Sensitive-123'},
            analytics_event=payload, start_payload=scope['_analytics_start_payload'](event))
        serialized = str(self.conn.rows) + str(self.conn.events) + str(self.conn.resolver_inputs)
        self.assertNotIn('Sensitive-123', serialized)
        self.assertEqual(self.conn.events['msg:7:8']['attribution_status'], 'auth_candidate')
        self.assertEqual(self.conn.resolver_inputs, [])

    async def test_spool_recovers_after_restart_and_acknowledges_commit(self):
        """Отказ PostgreSQL сохраняет факт; новый процесс доставляет его и не удваивает повтор."""
        event = await scope['_analytics_classify_message'](message(), {'bot': Bot()})
        scope['db_pool'] = None
        await scope['save_message_to_api']('7', 'user', 'Текст не сохраняется в очереди',
            message_data={'message_id': 8, 'callback_data': 'закрытые данные'}, analytics_event=event)
        restarted = load_runtime()
        restarted['db_pool'], restarted['_redis_client'] = Pool(self.conn), None
        self.assertEqual(await restarted['_analytics_spool_flush'](force=True), 1)
        self.assertIn('msg:7:8', self.conn.events)
        self.assertEqual(await restarted['_analytics_spool_flush'](force=True), 0)
        restarted['_analytics_spool_store'](event)
        await restarted['_analytics_spool_flush'](force=True)
        self.assertEqual(len(self.conn.events), 1)
        self.assertEqual(len(self.conn.rows), 0)

    async def test_registry_failure_retries_same_public_tag_without_becoming_direct(self):
        """Недоступный реестр не превращает рекламную метку в прямой переход."""
        event = await scope['_analytics_classify_message'](message(text='/start bc_public'), {'bot': Bot()})
        self.conn.fail_resolver = True
        await scope['save_message_to_api']('7', 'user', '/start bc_public', analytics_event=event, start_payload='bc_public')
        self.assertEqual(self.conn.events, {})
        self.assertEqual(await scope['_analytics_spool_flush'](force=True), 1)
        self.assertEqual(await scope['_analytics_spool_flush'](), 0)
        self.conn.fail_resolver = False
        await scope['_analytics_spool_flush'](force=True)
        self.assertEqual(self.conn.events['msg:7:8']['attribution_status'], 'resolved')
        self.assertEqual(self.conn.events['msg:7:8']['observed_tag'], 'bc_public')

    async def test_spool_contains_only_minimal_safe_data(self):
        """На диске нет текста, callback payload или одноразового кода входа."""
        self.assertEqual(scope['_analytics_safe_value']({'link_Secret': {'nested': 'link_Secret'}}),
                         {'link_[скрыто]': {'nested': 'link_[скрыто]'}})
        event = await scope['_analytics_classify_message'](message(), {'bot': Bot()})
        event.update(message_text='личная переписка', callback_data='secret-callback')
        event['metadata'] = {'button_label': 'Вход link_Secret', 'raw': 'личная переписка'}
        scope['_analytics_spool_store'](event, 'link_Secret')
        content = b''.join(path.read_bytes() for path in Path(self.spool.name).rglob('*') if path.is_file())
        for secret in ['Secret', 'личная переписка', 'secret-callback']:
            self.assertNotIn(secret.encode('utf-8'), content)
        await scope['_analytics_spool_flush'](force=True)
        self.assertEqual(self.conn.events['msg:7:8']['attribution_status'], 'auth_candidate')
        self.assertNotIn('observed_tag', self.conn.events['msg:7:8'])

    async def test_system_rollback_keeps_spool_and_success_removes_it(self):
        """Служебное событие остаётся в очереди при отказе обработчика."""
        event = scope['_analytics_event']('system', 'membership:7:42:kicked', 7, message().chat)
        @scope['_analytics_guard_system']
        async def handler():
            """Имитирует откат после локальной фиксации факта."""
            scope['_analytics_spool_store'](event)
            raise ConnectionError('Нет соединения')
        await handler()
        self.assertEqual(await scope['_analytics_spool_flush'](force=True), 1)
        self.assertEqual(self.conn.events['membership:7:42:kicked']['kind'], 'system')

    async def test_worker_reconnects_when_database_was_missing_at_start(self):
        """Фоновая доставка самостоятельно восстанавливает отсутствовавший при запуске пул."""
        restarted = load_runtime()
        restarted['db_pool'] = None
        event = await restarted['_analytics_classify_message'](message(), {'bot': Bot()})
        restarted['_analytics_spool_store'](event)
        drained = asyncio.Event()
        original_flush = restarted['_analytics_spool_flush']
        async def reconnect():
            """Имитирует восстановление PostgreSQL без перезапуска процесса."""
            restarted['db_pool'] = Pool(self.conn)
        async def flush(force=False):
            """Сообщает тесту об окончании первой пачки."""
            result = await original_flush(force)
            drained.set()
            return result
        restarted['init_database'], restarted['_analytics_spool_flush'] = reconnect, flush
        task = asyncio.create_task(restarted['_analytics_spool_worker']())
        try:
            await asyncio.wait_for(drained.wait(), timeout=2)
            self.assertIn('msg:7:8', self.conn.events)
        finally:
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)

    async def test_spool_disk_failure_is_explicit_and_database_is_still_attempted(self):
        """Отказ локального диска не мешает работающей БД и не выдаётся за отложенную доставку."""
        event = await scope['_analytics_classify_message'](message(), {'bot': Bot()})
        original_store = scope['_analytics_spool_store']
        def fail_store(*args):
            """Имитирует недоступный постоянный том."""
            raise PermissionError('Каталог закрыт')
        scope['_analytics_spool_store'] = fail_store
        try:
            with self.assertLogs(level='CRITICAL'):
                await scope['save_message_to_api']('7', 'user', 'Текст', analytics_event=event)
            self.assertIn('msg:7:8', self.conn.events)
            scope['db_pool'] = None
            with self.assertLogs(level='CRITICAL') as logs:
                await scope['save_message_to_api']('7', 'user', 'Текст', analytics_event=dict(event, event_key='msg:7:9'))
            self.assertTrue(any('одновременно' in entry for entry in logs.output))
        finally:
            scope['_analytics_spool_store'] = original_store

    async def test_deleted_person_is_acknowledged_without_restoring_facts_or_history(self):
        """Сохранённый cutoff удалённого человека предотвращает повторное создание истории."""
        self.conn.discard_reason = 'person_deleted'
        event = await scope['_analytics_classify_message'](message(), {'bot': Bot()})
        await scope['save_message_to_api']('7', 'user', 'Старая доставка', analytics_event=event)
        self.assertEqual((self.conn.events, self.conn.rows), ({}, []))
        self.assertEqual(await scope['_analytics_spool_flush'](force=True), 0)
        self.assertFalse(scope['_analytics_scope_deleted'])

    async def test_deleted_resource_purges_scope_while_permission_error_stays_retryable(self):
        """Только явный resource_deleted очищает область; недоступные права не теряют очередь."""
        self.conn.discard_reason = 'resource_deleted'
        event = await scope['_analytics_classify_message'](message(text='/start bc_public'), {'bot': Bot()})
        scope['_analytics_spool_store'](event, 'bc_public')
        scope['_analytics_spool_store'](dict(event, event_key='msg:7:9'), 'bc_other')
        await scope['_analytics_spool_flush'](force=True)
        self.assertTrue(scope['_analytics_scope_deleted'])
        self.assertEqual(list(Path(self.spool.name).rglob('pending.sqlite3')), [])
        self.assertEqual(self.conn.resolver_inputs, [])
        scope['_analytics_scope_deleted'] = False
        self.conn.discard_reason = None
        original = self.conn.fetchval
        async def deny(*args):
            """Имитирует недостаточные временные grants без сообщения об удалении."""
            raise PermissionError('42501')
        self.conn.fetchval = deny
        try:
            await scope['save_message_to_api']('7', 'user', 'Сохранить для повтора', analytics_event=event)
            self.assertFalse(scope['_analytics_scope_deleted'])
            self.assertEqual(len(list(Path(self.spool.name).rglob('pending.sqlite3'))), 1)
        finally:
            self.conn.fetchval = original

    async def test_all_successful_media_and_album_chat(self):
        """Все поддержанные отправки считают только успешный ответ и сохраняют настоящий чат."""
        request = scope['_analytics_outgoing_request']
        methods = ['sendMessage', 'sendPhoto', 'sendVideo', 'sendAudio', 'sendDocument', 'sendSticker',
            'sendVoice', 'sendAnimation', 'sendMediaGroup', 'sendVideoNote', 'sendLocation', 'sendVenue',
            'sendContact', 'sendPoll', 'sendDice', 'sendGame', 'sendInvoice', 'sendPaidMedia', 'sendChecklist']
        for index, method in enumerate(methods, 1):
            async def success(bot, request):
                result = message('supergroup', message_id=index)
                return [result] if method == 'sendMediaGroup' else result
            await request(success, Bot(), NS(__api_method__=method))
        self.assertEqual(len(self.conn.events), len(methods))
        for event in self.conn.events.values():
            self.assertEqual(event['kind'], 'message_out')
            self.assertEqual((event['chat_type'], event['chat_id']), ('supergroup', '-100'))
            self.assertIsNone(event['user_id'])
        async def failure(bot, request):
            raise RuntimeError('Telegram отказал')
        with self.assertRaises(RuntimeError):
            await request(failure, Bot(), NS(__api_method__='sendVoice'))
        self.assertEqual(len(self.conn.events), len(methods))


if __name__ == '__main__':
    unittest.main()
