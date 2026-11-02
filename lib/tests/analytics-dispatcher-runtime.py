"""@fileoverview Проверки настоящей маршрутизации Aiogram и исходящих ответов без сети и Telegram."""

import asyncio
import os
import re
import runpy
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace as NS
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command

fixture = runpy.run_path(str(Path(__file__).with_name('analytics-events-runtime.py')))


class AnalyticsDispatcherTests(unittest.IsolatedAsyncioTestCase):
    """Исполняет реальные фильтры и middleware, подменяя только сеть и PostgreSQL."""

    async def asyncSetUp(self):
        """Подготавливает изолированную очередь и запрещает любые сетевые обращения."""
        self.scope = fixture['load_runtime']()
        self.conn = fixture['Connection']()
        self.spool = tempfile.TemporaryDirectory()
        self.old_spool = os.environ.get('ANALYTICS_SPOOL_DIR')
        os.environ['ANALYTICS_SPOOL_DIR'] = self.spool.name
        self.profiles = []
        async def save_profile(*args, **kwargs):
            """Запоминает только признак личного взаимодействия."""
            self.profiles.append(kwargs.get('private_interaction'))
        self.scope.update(db_pool=fixture['Pool'](self.conn), _redis_client=None,
                          re=re, user_data={}, save_user_to_db=save_profile)
        self.bot = Bot('99:OFFLINE_TEST_WITHOUT_NETWORK')
        self.bot._me = types.User(id=99, is_bot=True, first_name='Тест', username='current_bot')
        async def no_network(bot, method, **kwargs):
            """Разрешает локальный квиток кнопки; любой другой запрос завершает тест ошибкой."""
            if method.__api_method__ == 'answerCallbackQuery':
                return True
            raise AssertionError('Сеть запрещена в проверке генератора')
        self.bot.session.make_request = no_network
        self.dp = Dispatcher()
        self.dp.message.outer_middleware(self.scope['_analytics_observe_message'])
        self.dp.message.middleware(self.scope['message_logging_middleware'])
        self.dp.callback_query.outer_middleware(self.scope['callback_query_logging_middleware'])

    async def asyncTearDown(self):
        """Дожидается локальных записей профиля и закрывает тестовые ресурсы."""
        await asyncio.sleep(0)
        await self.bot.session.close()
        await self.dp.storage.close()
        self.spool.cleanup()
        if self.old_spool is None:
            os.environ.pop('ANALYTICS_SPOOL_DIR', None)
        else:
            os.environ['ANALYTICS_SPOOL_DIR'] = self.old_spool

    def message(self, identity, text='Привет', chat_type='supergroup', **extra):
        """Создаёт валидное сообщение Telegram с контролируемой идентичностью."""
        return types.Message.model_validate(dict(message_id=identity, date=datetime.now(timezone.utc),
            chat={'id': 7 if chat_type == 'private' else -100, 'type': chat_type},
            from_user={'id': 7, 'is_bot': False, 'first_name': 'Тест'}, text=text, **extra))

    async def deliver(self, event):
        """Подаёт один искусственный update локальному диспетчеру, не отправляя его в Telegram."""
        key = 'callback_query' if isinstance(event, types.CallbackQuery) else 'message'
        await self.dp.feed_update(self.bot, types.Update(update_id=100, **{key: event}))
        await asyncio.sleep(0)

    async def test_registered_and_unhandled_commands_and_replies(self):
        """CommandObject появляется только у принятой команды; observer сохраняет остальные сообщения."""
        async def accepted(message, command):
            """Обработчик зарегистрированной команды ничего не отправляет."""
            return None
        self.dp.message.register(accepted, Command('buy'))
        replies = {'message_id': 2, 'date': datetime.now(timezone.utc),
            'chat': {'id': -100, 'type': 'supergroup'}, 'from_user': self.bot._me.model_dump(), 'text': 'Ответьте'}
        cases = [(self.message(1, chat_type='private'), True), (self.message(2), False),
            (self.message(3, '/buy'), True), (self.message(4, '/unknown'), False),
            (self.message(5, '/unknown@CURRENT_BOT'), True), (self.message(6, '/buy@another_bot'), False),
            (self.message(7, reply_to_message=replies), True), (self.message(8, '@current_bot'), False),
            (self.message(9, '/bad!@current_bot'), False),
            (self.message(10, '/buy@another_bot', reply_to_message=replies), False)]
        for event, directed in cases:
            with self.subTest(text=event.text, identity=event.message_id):
                await self.deliver(event)
                self.assertEqual(self.conn.events[f'msg:{event.chat.id}:{event.message_id}']['directed'], directed)
        self.assertEqual(len(self.conn.events), len(cases))
        self.assertEqual(self.profiles.count(True), 1)
        self.assertEqual(self.profiles.count(False), len(cases) - 1)

    async def test_callback_is_real_once_and_preserves_canonical_identity(self):
        """Доставка повторного callback и переходы по нодам не создают повторного факта."""
        called = []
        async def node(callback):
            """Имитирует несколько прямых переходов в сценарии без повторной доставки update."""
            called.append(callback.id)
        async def accepted(callback):
            """Передаёт callback нескольким нодам напрямую, как делает генератор."""
            await node(callback)
            await node(NS(id='reply_nav', _is_fake=True))
        self.dp.callback_query.register(accepted)
        event = types.CallbackQuery(id='987654321', from_user=types.User(id=7, is_bot=False, first_name='Тест'),
            chat_instance='test', data='menu', message=self.message(2))
        await self.deliver(event)
        await self.deliver(event)
        self.assertEqual(len(called), 4)
        self.assertEqual(list(self.conn.events), ['cb:987654321'])
        self.assertEqual(len(self.conn.rows), 1)
        self.assertEqual(self.conn.rows[0]['message_data']['callback_query_id'], '987654321')

    async def test_media_album_and_duplicate_wrappers(self):
        """Каждый успешный элемент альбома считается один раз при повторном журналировании обёрткой."""
        async def success(bot, method):
            """Возвращает две настоящие модели Message без сетевой отправки."""
            return [self.message(41, text=None, caption='Альбом', photo=[{'file_id': 'a', 'file_unique_id': 'b', 'width': 1, 'height': 1}]), self.message(42)]
        result = await self.scope['_analytics_outgoing_request'](success, self.bot, NS(__api_method__='sendMediaGroup'))
        for event in result:
            await self.scope['save_message_to_api']('-100', 'bot', 'Повтор обёртки', node_id='node',
                message_data={'message_id': event.message_id}, chat_type='supergroup', chat_id='-100')
        self.assertEqual(set(self.conn.events), {'msg_out:-100:41', 'msg_out:-100:42'})
        self.assertEqual(len(self.conn.rows), 2)
        self.assertEqual(self.conn.counters, 2)

    async def test_forward_and_copy_message_ids_are_outgoing_events(self):
        """Пересылки и копии учитываются по возвращённым MessageId, включая массовые операции."""
        for index, name in enumerate(['forwardMessage', 'copyMessage', 'forwardMessages', 'copyMessages'], 50):
            async def success(bot, method):
                """Возвращает реальную форму ответа соответствующего Telegram-метода."""
                if name == 'forwardMessage':
                    return self.message(index)
                item = types.MessageId(message_id=index)
                return [item] if name.endswith('Messages') else item
            await self.scope['_analytics_outgoing_request'](success, self.bot, NS(__api_method__=name, chat_id=-100))
        self.assertEqual(len(self.conn.events), 4)
        self.assertTrue(all(item['kind'] == 'message_out' and item['chat_id'] == '-100' for item in self.conn.events.values()))

    async def test_node_logging_reuses_real_incoming_identity(self):
        """Повторное сохранение медиа из нескольких нод использует событие внешнего middleware."""
        async def accepted(message, command):
            """Имитирует два дополнительных вызова журналирования внутри маршрута."""
            for node_id in ['first', 'second']:
                await self.scope['save_message_to_api']('7', 'user', 'Сохранение ноды', node_id=node_id)
        self.dp.message.register(accepted, Command('buy'))
        await self.deliver(self.message(61, '/buy'))
        self.assertEqual(list(self.conn.events), ['msg:-100:61'])
        self.assertEqual((len(self.conn.rows), self.conn.counters), (1, 1))

    async def test_non_human_and_service_updates_do_not_create_audience(self):
        """Настоящие модели бота, анонимного отправителя и служебного сообщения не дают фактов людей."""
        events = [self.message(70).model_copy(update={'from_user': self.bot._me}),
            self.message(71, sender_chat={'id': -300, 'type': 'channel'}),
            self.message(72, text=None, new_chat_title='Новая группа')]
        for event in events:
            await self.deliver(event)
        self.assertEqual(self.conn.events, {})

    async def test_username_copy_lookup_runs_after_success_once_per_batch(self):
        """Для массовой копии адрес разрешается один раз после успешного ответа Telegram."""
        order = []
        async def success(bot, method):
            """Возвращает идентичности двух успешно скопированных сообщений."""
            order.append('sent')
            return [types.MessageId(message_id=81), types.MessageId(message_id=82)]
        async def lookup(target):
            """Возвращает точную идентичность канала без сети."""
            order.append('lookup')
            return types.Chat(id=-200, type='channel')
        self.bot.get_chat = lookup
        await self.scope['_analytics_outgoing_request'](success, self.bot, NS(__api_method__='copyMessages', chat_id='@test_channel'))
        self.assertEqual(order, ['sent', 'lookup'])
        self.assertEqual(set(self.conn.events), {'msg_out:-200:81', 'msg_out:-200:82'})
        self.assertTrue(all(event['chat_type'] == 'channel' for event in self.conn.events.values()))

    async def test_copy_lookup_failure_does_not_break_successful_send(self):
        """Ошибка определения @username сохраняет успешный результат и явно сообщает о пропуске учёта."""
        expected = types.MessageId(message_id=90)
        async def success(bot, method):
            """Возвращает результат уже выполненного копирования."""
            return expected
        async def failure(target):
            """Имитирует отказ последующего getChat."""
            raise ConnectionError('Недоступно')
        self.bot.get_chat = failure
        with self.assertLogs(level='WARNING'):
            result = await self.scope['_analytics_outgoing_request'](success, self.bot, NS(__api_method__='copyMessage', chat_id='@test_channel'))
        self.assertIs(result, expected)
        self.assertEqual(self.conn.events, {})

    async def test_edit_is_not_new_message_and_media_metadata_error_keeps_fact(self):
        """Правка не считается отправкой, а необязательные метаданные не могут потерять успешную отправку."""
        async def edited(bot, method):
            """Имитирует успешную правку ранее отправленного сообщения."""
            return self.message(95)
        await self.scope['_analytics_outgoing_request'](edited, self.bot, NS(__api_method__='editMessageText'))
        self.assertEqual(self.conn.events, {})
        async def sent(bot, method):
            """Возвращает сообщение с некорректной дополнительной моделью медиа."""
            return NS(message_id=96, chat=NS(id=-100, type='supergroup'), photo=[object()])
        with self.assertLogs(level='WARNING'):
            result = await self.scope['_analytics_outgoing_request'](sent, self.bot, NS(__api_method__='sendPhoto'))
        self.assertEqual(result.message_id, 96)
        self.assertIn('msg_out:-100:96', self.conn.events)


if __name__ == '__main__':
    unittest.main()
