"""@fileoverview Проверка изоляции журналирования Message и освобождения сценариев."""
import asyncio
import gc
import logging
from pathlib import Path
from types import SimpleNamespace
import unittest
import weakref

from aiogram.types import Message


class Payload:
    """Контрольный объект для проверки освобождения словаря модуля."""


class MessageAnswerLifecycle(unittest.IsolatedAsyncioTestCase):
    """Проверяет общий маршрутизатор на настоящем классе aiogram Message."""

    async def asyncSetUp(self):
        """Устанавливает безопасную отправку без сети и сохраняет исходные методы."""
        self.names = ('answer', 'answer_photo', 'answer_video', 'answer_audio', 'answer_document')
        self.originals = {name: getattr(Message, name) for name in self.names}
        self.old_shared = getattr(Message, '_botcraft_answer_router_v1', None)
        if self.old_shared is not None:
            delattr(Message, '_botcraft_answer_router_v1')
        self.sent = []
        for name in self.names:
            async def send(message, *args, _name=name, **kwargs):
                """Записывает единственную фактическую отправку текущего сообщения."""
                self.sent.append((_name, message.bot.id, args, kwargs))
                return SimpleNamespace(message_id=1)
            setattr(Message, name, send)
        template = Path(__file__).resolve().parents[2] / 'templates/middleware/wrap-bot-answer.py.jinja2'
        self.source = template.read_text(encoding='utf-8').split('#}', 1)[1]

    async def asyncTearDown(self):
        """Возвращает глобальный класс aiogram в исходное состояние."""
        for name, original in self.originals.items():
            setattr(Message, name, original)
        delattr(Message, '_botcraft_answer_router_v1')
        if self.old_shared is not None:
            Message._botcraft_answer_router_v1 = self.old_shared

    def module(self, owner_id):
        """Выполняет шаблон в независимом словаре, как загрузчик сценария."""
        logs, outgoing = [], []
        async def emit(*args):
            """Запоминает вызов исходящего триггера владельца."""
            outgoing.append(args)
        namespace = {'logging': logging, '_fire_save_message': lambda **data: logs.append(data),
                     '_emit_outgoing_message_trigger': emit, 'payload': Payload()}
        exec(self.source, namespace)
        namespace['_wrap_message_answer'](SimpleNamespace(id=owner_id))
        return namespace, logs, outgoing

    def message(self, owner_id):
        """Создаёт минимальное сообщение с привязкой к нужному боту."""
        return SimpleNamespace(bot=SimpleNamespace(id=owner_id),
                               chat=SimpleNamespace(id=70, type='private'), from_user=None)

    async def test_two_bots_all_methods_and_node_id(self):
        """Пять методов вызывают только журнал и триггер собственного сценария."""
        first, first_logs, first_outgoing = self.module(1)
        second, second_logs, second_outgoing = self.module(2)
        for name in self.names:
            await getattr(Message, name)(self.message(1), 'данные', node_id='узел')
        self.assertEqual(len(self.sent), 5)
        self.assertEqual(len(first_logs), 5)
        self.assertEqual(len(first_outgoing), 5)
        self.assertEqual([item['node_id'] for item in first_logs], ['узел'] * 5)
        self.assertEqual(second_logs, [])
        self.assertEqual(second_outgoing, [])
        first['_unwrap_message_answer']()
        await Message.answer(self.message(2), 'сосед')
        self.assertEqual(len(second_logs), 1)
        self.assertEqual(len(second_outgoing), 1)
        second['_unwrap_message_answer']()

    async def test_repeated_install_and_old_cleanup(self):
        """Повторная установка не наращивает цепочку; старое завершение не стирает новую активацию."""
        old, _, _ = self.module(1)
        router = Message.answer
        current, logs, _ = self.module(1)
        old['_unwrap_message_answer']()
        for _ in range(30):
            current['_wrap_message_answer'](SimpleNamespace(id=1))
        self.assertIs(Message.answer, router)
        self.assertEqual(len(Message._botcraft_answer_router_v1[1]), 1)
        await Message.answer(self.message(1), 'одна запись')
        self.assertEqual(len(logs), 1)
        self.assertEqual(len(self.sent), 1)
        current['_unwrap_message_answer']()

    async def test_cleanup_releases_module_globals(self):
        """Общие методы не удерживают словари выгруженных активаций после очистки."""
        refs = []
        for _ in range(30):
            namespace, _, _ = self.module(1)
            refs.append(weakref.ref(namespace['payload']))
            namespace['_unwrap_message_answer']()
            del namespace
        gc.collect()
        self.assertTrue(all(reference() is None for reference in refs))
        self.assertEqual(Message._botcraft_answer_router_v1[1], {})
        await Message.answer(self.message(1), 'без регистрации', node_id='служебное')
        self.assertNotIn('node_id', self.sent[-1][3])


if __name__ == '__main__':
    unittest.main()
