"""@fileoverview Проверяет передачу уровня журналирования без запуска воркера и внешних сервисов."""
import ast
from contextlib import redirect_stdout
from datetime import datetime
import io
import json
import logging
from pathlib import Path
from types import SimpleNamespace
import unittest


class WorkerLogDiagnosticsTest(unittest.TestCase):
    """Проверяет реальные функции журналирования, выделенные из модуля без его побочных эффектов."""

    def test_warning_keeps_severity_separate_from_message(self):
        """Безобидная строка со словом Error сохраняет WARNING в структурированном кадре."""
        source = Path(__file__).with_name('worker.py')
        tree = ast.parse(source.read_text(encoding='utf-8'))
        selected = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef))
                    and node.name in ('emit_log', 'WorkerLogHandler')]
        namespace = {'datetime': datetime, 'json': json, 'logging': logging,
                     'sys': __import__('sys'),
                     'iso': SimpleNamespace(current_token_id=SimpleNamespace(get=lambda: 5))}
        exec(compile(ast.Module(body=selected, type_ignores=[]), str(source), 'exec'), namespace)
        output = io.StringIO()
        record = logging.LogRecord('bot', logging.WARNING, 'bot.py', 1, 'Temporary Error: повторяем', (), None)
        with redirect_stdout(output):
            namespace['WorkerLogHandler']().emit(record)
        frame = json.loads(output.getvalue())
        self.assertEqual(frame['level'], 'WARNING')
        self.assertEqual(frame['type'], 'stderr')
        self.assertEqual(frame['token_id'], 5)
        self.assertIn('Temporary Error', frame['content'])


if __name__ == '__main__':
    unittest.main()
