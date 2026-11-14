"""@fileoverview Регрессии удержания Update и ботов кешем определения типа события aiogram."""
import asyncio
import functools
import gc
import os
from pathlib import Path
import subprocess
import sys
import unittest
import weakref
from unittest.mock import patch

if '--mode' in sys.argv:
    mode = sys.argv[sys.argv.index('--mode') + 1]
    del sys.argv[sys.argv.index('--mode'):]
    if mode == 'lazy':
        import lazy_aiogram
        if not lazy_aiogram.enable():
            raise AssertionError('Ленивая загрузка должна включиться до импорта aiogram')
    from aiogram import Bot
    from aiogram.types import Update
    import aiogram_update_cache


@unittest.skipUnless('mode' in globals(), 'Сценарии исполняются в отдельных eager/lazy процессах')
class EventCacheCases(unittest.TestCase):
    """Проверяет семантику событий и освобождение графа Update → Bot."""
    def setUp(self):
        """Сохраняет исходный некеширующий алгоритм до установки исправления."""
        getter = Update.event_type.fget
        self.reference = getattr(getter, '__wrapped__', getter)
        self.assertTrue(aiogram_update_cache.apply())

    def test_all_supported_event_fields_keep_semantics(self):
        """Все поля событий и порядок выбора совпадают с оригинальным алгоритмом."""
        names = [name for name in Update.model_fields if name != 'update_id']
        for index, name in enumerate(names):
            with self.subTest(event=name):
                update = Update.model_construct(update_id=index, **{name: object()})
                self.assertEqual(update.event_type, self.reference(update))
                self.assertEqual(update.event_type, name)
        update = Update.model_construct(update_id=100, message=object(), inline_query=object())
        self.assertEqual(update.event_type, self.reference(update))
        self.assertEqual(update.event_type, 'message')

    def test_validated_queries_and_message(self):
        """Настоящие валидированные Telegram payload сохраняют классификацию запросов."""
        user = {'id': 42, 'is_bot': False, 'first_name': 'Тест'}
        message = {'message_id': 1, 'date': 1700000000, 'chat': {'id': 42, 'type': 'private'}, 'text': '/start'}
        cases = {
            'message': message,
            'inline_query': {'id': 'inline', 'from': user, 'query': 'поиск', 'offset': ''},
            'chosen_inline_result': {'result_id': 'result', 'from': user, 'query': 'поиск'},
            'callback_query': {'id': 'callback', 'from': user, 'chat_instance': 'chat', 'data': 'start'},
            'shipping_query': {'id': 'ship', 'from': user, 'invoice_payload': 'invoice', 'shipping_address': {'country_code': 'RU', 'state': '', 'city': 'Москва', 'street_line1': 'ул', 'street_line2': '', 'post_code': '123456'}},
            'pre_checkout_query': {'id': 'pay', 'from': user, 'currency': 'RUB', 'total_amount': 100, 'invoice_payload': 'invoice'},
        }
        for index, (kind, payload) in enumerate(cases.items()):
            with self.subTest(event=kind):
                update = Update.model_validate({'update_id': index, kind: payload})
                self.assertEqual(update.event_type, kind)
                self.assertEqual(update.event_type, self.reference(update))

    def test_unknown_event_has_same_error(self):
        """Неизвестный тип сохраняет класс и текст исходного исключения."""
        update = Update(update_id=1)
        try:
            self.reference(update)
        except Exception as reference_error:
            with self.assertRaises(type(reference_error)) as actual:
                _ = update.event_type
            self.assertEqual(str(actual.exception), str(reference_error))
        else:
            self.fail('Оригинальный алгоритм должен отклонять пустое событие')

    def test_more_than_cache_capacity_releases_all_bots(self):
        """256 Update и привязанных настоящих Bot освобождаются без глобального cache_clear."""
        def activation(index):
            """Создаёт отдельный граф бота и возвращает только слабые ссылки."""
            bot = Bot(token=f'{100000 + index}:' + 'a' * 35)
            update = Update.model_validate({'update_id': index, 'message': {'message_id': index, 'date': 1700000000, 'chat': {'id': index + 1, 'type': 'private'}, 'text': '/start'}}, context={'bot': bot})
            self.assertIs(update.bot, bot)
            self.assertEqual(update.event_type, 'message')
            asyncio.run(bot.session.close())
            return weakref.ref(update), weakref.ref(bot)

        references = [activation(index) for index in range(256)]
        gc.collect()
        self.assertEqual(sum(ref() is not None for pair in references for ref in pair), 0)

    def test_idempotent_and_custom_getter_untouched(self):
        """Повторная установка стабильна, чужой getter не заменяется."""
        descriptor = Update.event_type
        self.assertTrue(aiogram_update_cache.apply())
        self.assertIs(Update.event_type, descriptor)

        def custom(update):
            """Изображает пользовательский алгоритм определения события."""
            return 'custom'

        try:
            Update.event_type = property(custom)
            custom_descriptor = Update.event_type
            self.assertFalse(aiogram_update_cache.apply())
            self.assertIs(Update.event_type, custom_descriptor)
        finally:
            Update.event_type = descriptor

    def test_unknown_version_does_not_change_cached_descriptor(self):
        """Непроверенная версия сохраняет исходное кеширующее свойство без очистки."""
        import aiogram
        descriptor = Update.event_type
        cached = functools.lru_cache()(self.reference)
        cached.__dict__.pop('_tbb_uncached_update_event_type', None)
        try:
            Update.event_type = property(cached)
            unknown = Update.event_type
            update = Update.model_construct(update_id=10, message=object())
            self.assertEqual(update.event_type, 'message')
            with patch.object(aiogram, '__version__', '3.999.0'):
                self.assertFalse(aiogram_update_cache.apply())
            self.assertIs(Update.event_type, unknown)
            self.assertEqual(cached.cache_info().currsize, 1)
        finally:
            cached.cache_clear()
            Update.event_type = descriptor

    def test_mutated_update_is_not_stale(self):
        """Повторное чтение отражает изменённое событие вместо устаревшего результата."""
        update = Update.model_construct(update_id=11, message=object())
        self.assertEqual(update.event_type, 'message')
        # Модели aiogram заморожены; явно моделируем внутреннее изменение поля.
        object.__setattr__(update, 'message', None)
        object.__setattr__(update, 'inline_query', object())
        self.assertEqual(update.event_type, 'inline_query')


@unittest.skipIf('mode' in globals(), 'Матрица запускается только родительским процессом')
class EventCacheModes(unittest.TestCase):
    """Запускает независимые процессы для двух порядков импорта aiogram."""
    def test_eager_and_lazy(self):
        """Оба режима выполняют одинаковые регрессионные сценарии."""
        for selected in ('eager', 'lazy'):
            with self.subTest(mode=selected):
                environment = os.environ.copy()
                environment['AIOGRAM_LAZY_MODELS'] = 'true' if selected == 'lazy' else 'false'
                subprocess.run([sys.executable, str(Path(__file__).resolve()), '--mode', selected], check=True, env=environment)
if __name__ == '__main__':
    unittest.main()
