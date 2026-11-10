"""@fileoverview Проверка передачи подтверждённого отказа токена без секретов в тексте."""
import ast
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch


class WorkerTokenErrorTest(unittest.TestCase):
    """Проверяет настоящую функцию форматирования без запуска ботов и импорта aiogram."""

    def test_authorization_evidence_and_redaction(self):
        """Только тип aiogram даёт признак отказа; текст исключения не попадает в ответ."""
        source = Path(__file__).with_name('worker.py').read_text(encoding='utf-8')
        tree = ast.parse(source)
        function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'format_bot_error')
        namespace = {'sys': sys, '_ERROR_HINTS': []}
        exec(compile(ast.Module(body=[function], type_ignores=[]), 'worker.py', 'exec'), namespace)
        unauthorized = type('TelegramUnauthorizedError', (Exception,), {})
        module = types.ModuleType('aiogram.exceptions')
        module.TelegramUnauthorizedError = unauthorized
        with patch.dict(sys.modules, {'aiogram.exceptions': module}):
            result = namespace['format_bot_error'](unauthorized('secret-token-value'))
            self.assertTrue(result.startswith('TelegramUnauthorizedError:'))
            self.assertNotIn('secret-token-value', result)
            for error in ['Unauthorized external API', '403 Forbidden', '429 RetryAfter', 'FROZEN_METHOD_INVALID']:
                self.assertNotIn('TelegramUnauthorizedError:', namespace['format_bot_error'](RuntimeError(error)))


if __name__ == '__main__':
    unittest.main()
