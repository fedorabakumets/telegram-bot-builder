"""@fileoverview Проверка сохранения клавиатур при последовательности middleware → обёртка отправки."""

import asyncio
import json
import runpy
import unittest
from pathlib import Path
from types import SimpleNamespace as NS

runtime = runpy.run_path(str(Path(__file__).with_name('analytics-events-runtime.py')))
scope = runtime['scope']


class MetadataConnection(runtime['Connection']):
    """Воспроизводит атомарное дополнение JSONB без повторной записи сообщения."""

    async def execute(self, sql, *args):
        """Объединяет недостающие поля с приоритетом ранее сохранённых данных."""
        if 'UPDATE bot_messages SET' in sql:
            assert 'jsonb_strip_nulls($2::jsonb)' in sql
            row = next(row for row in self.rows if row['id'] == args[2])
            additions = {key: value for key, value in json.loads(args[1]).items() if value is not None}
            row['message_data'] = {**additions, **row['message_data']}
            row['node_id'] = row.get('node_id') or args[0]
        await super().execute(sql, *args)


class ReplyHistoryTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет реальные обёртки поверх успешного ответа session middleware."""

    async def asyncSetUp(self):
        """Создаёт изолированную БД и локальную очередь для каждого сценария."""
        await runtime['AnalyticsRuntimeTests'].asyncSetUp(self)
        self.conn = MetadataConnection()
        scope['db_pool'] = runtime['Pool'](self.conn)

    async def asyncTearDown(self):
        """Завершает фоновые записи до удаления временной очереди."""
        await asyncio.gather(*tuple(scope['_analytics_persistence_tasks']))
        await runtime['AnalyticsRuntimeTests'].asyncTearDown(self)

    async def send(self, markup, response_markup=None):
        """Отправляет сообщение через настоящий порядок middleware → send_message wrapper."""
        response = runtime['message'](message_id=15, reply_markup=response_markup)

        async def original(chat_id, text, **kwargs):
            """Имитирует Telegram, который не возвращает reply-клавиатуру в Message."""
            async def success(bot, method):
                return response
            result = await scope['_analytics_outgoing_request'](success, runtime['Bot'](),
                NS(__api_method__='sendMessage', reply_markup=kwargs.get('reply_markup')))
            self.assertIn('keyboard_type', self.conn.rows[0]['message_data'])
            return result

        bot = NS(send_message=original)
        scope['_wrap_bot_send_message'](bot)
        await bot.send_message(7, 'Проверка', node_id='reply-test', reply_markup=markup)
        await asyncio.gather(*tuple(scope['_analytics_persistence_tasks']))
        return response

    async def test_reply_is_present_in_first_write_and_survives_repeats(self):
        """Первая запись содержит reply; повторная обёртка не меняет счётчики и идентичность."""
        from aiogram.types import KeyboardButton, ReplyKeyboardMarkup
        markup = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text='Проверить reply', request_contact=True)]])
        await self.send(markup)
        self.assertEqual((len(self.conn.events), len(self.conn.rows), self.conn.counters), (1, 1, 1))
        row = self.conn.rows[0]
        self.assertEqual(row['message_data']['keyboard_type'], 'reply')
        self.assertTrue(row['message_data']['buttons'][0]['request_contact'])
        self.assertEqual(row['node_id'], 'reply-test')
        await scope['_save_message_once']('7', 'bot', 'Проверка', message_data={'message_id': 15})
        self.assertEqual(row['message_data']['buttons'][0]['text'], 'Проверить reply')
        self.assertEqual(self.conn.counters, 1)

    async def test_message_answer_wrapper_completes_keyboard(self):
        """Обёртка Message.answer дополняет раннюю запись, не создавая вторую отправку."""
        from aiogram.types import Message, KeyboardButton, ReplyKeyboardMarkup
        originals = {name: getattr(Message, name) for name in
            ('answer', 'answer_photo', 'answer_video', 'answer_audio', 'answer_document')}

        async def original_answer(message, text, **kwargs):
            """Сохраняет минимальный ответ так же, как ранний session middleware."""
            await scope['_save_message_once']('7', 'bot', text, message_data={'message_id': 15})
            return runtime['message'](message_id=15)

        try:
            Message.answer = original_answer
            scope['_wrap_message_answer'](NS())
            await Message.answer(runtime['message'](), 'Проверка', node_id='answer-test',
                reply_markup=ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text='Ответ')]]))
            await asyncio.gather(*tuple(scope['_analytics_persistence_tasks']))
            self.assertEqual(self.conn.rows[0]['message_data']['buttons'], [{'text': 'Ответ'}])
            self.assertEqual(self.conn.rows[0]['node_id'], 'answer-test')
            self.assertEqual((len(self.conn.events), len(self.conn.rows), self.conn.counters), (1, 1, 1))
        finally:
            for name, value in originals.items():
                setattr(Message, name, value)

    async def test_inline_response_remains_authoritative(self):
        """Повторная обёртка не обрезает дополнительные поля inline-кнопки Telegram."""
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
        markup = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text='Открыть', callback_data='next', style='primary')]])
        await self.send(markup, markup)
        self.assertEqual(self.conn.rows[0]['message_data']['buttons'][0]['style'], 'primary')
        self.assertEqual(self.conn.rows[0]['message_data']['keyboard_type'], 'inline')
        self.assertEqual((len(self.conn.rows), self.conn.counters), (1, 1))

    async def test_late_metadata_completes_existing_row_without_node(self):
        """Даже запись только с message_id дополняется клавиатурой без обязательной ноды."""
        await scope['_save_message_once']('7', 'bot', 'Проверка', message_data={'message_id': 15, 'photo': {'file_id': 'saved'}})
        await scope['_save_message_once']('7', 'bot', 'Проверка', message_data={'message_id': 15,
            'keyboard_type': 'reply', 'buttons': [{'text': 'Кнопка'}], 'photo': {'file_id': 'short'}})
        row = self.conn.rows[0]
        self.assertEqual(row['message_data']['keyboard_type'], 'reply')
        self.assertEqual(row['message_data']['photo'], {'file_id': 'saved'})
        self.assertEqual((len(self.conn.events), len(self.conn.rows), self.conn.counters), (1, 1, 1))


if __name__ == '__main__':
    unittest.main()
