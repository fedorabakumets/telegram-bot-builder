"""@fileoverview Проверка повторной установки фильтра без удержания выгруженных сценариев."""

import gc
import logging
import sys
import unittest
import weakref
from pathlib import Path

source = Path(sys.argv.pop()).read_text(encoding='utf-8')
source = source[:source.index('\ndef _analytics_event(')]


class Payload:
    """Представляет данные сценария, которые должны исчезать после выгрузки."""


class FilterResourcesTest(unittest.TestCase):
    """Проверяет реальные функции сгенерированного фильтра и сохранение маскирования."""

    def setUp(self):
        """Изолирует обработчики теста от внешнего процесса."""
        self.root = logging.getLogger()
        self.previous = self.root.handlers[:]
        self.handler = logging.NullHandler()
        self.root.handlers = [self.handler]

    def tearDown(self):
        """Возвращает прежние обработчики журнала."""
        self.root.handlers = self.previous

    def install(self):
        """Выполняет сгенерированный код в независимом пространстве имён."""
        namespace = {'logging': logging}
        exec(compile(source, '<generated-analytics-filter>', 'exec'), namespace)
        namespace['_analytics_install_log_filter']()
        return namespace

    def test_repeated_loads_release_namespaces(self):
        """Сорок запусков не удерживают данные ботов и не умножают фильтры."""
        references = []
        for _ in range(40):
            namespace = self.install()
            namespace['payload'] = Payload()
            references.append(weakref.ref(namespace['payload']))
            del namespace
        gc.collect()
        self.assertEqual(len(self.handler.filters), 1)
        self.assertTrue(all(reference() is None for reference in references))

    def test_shared_filter_masks_messages_and_exceptions(self):
        """Общий фильтр сохраняет маскирование сообщения, стека и исключения."""
        self.install()
        try:
            raise ValueError('link_exception')
        except ValueError:
            record = logging.LogRecord('test', logging.ERROR, '', 0, '%s', ('link_message',), sys.exc_info())
        record.stack_info = 'trace link_stack'
        self.assertTrue(self.handler.filter(record))
        self.assertEqual(record.getMessage(), 'link_[скрыто]')
        self.assertNotIn('link_exception', record.exc_text)
        self.assertNotIn('link_stack', record.stack_info)

    def test_new_handlers_reuse_same_filter(self):
        """Новый обработчик получает тот же фильтр без повторной установки на прежний."""
        self.install()
        extra = logging.NullHandler()
        self.root.addHandler(extra)
        self.install()
        self.assertEqual(len(self.handler.filters), 1)
        self.assertEqual(extra.filters, self.handler.filters)


if __name__ == '__main__':
    unittest.main()
