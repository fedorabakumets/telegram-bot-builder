"""@fileoverview Проверка AST-допуска сборок без исполнения пользовательского Python."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class ValidateProcessTests(unittest.TestCase):
    """Проверяет короткоживущий IPC-валидатор на безопасных и несовместимых сборках."""

    def execute(self, source):
        """Передаёт временный файл настоящему валидатору и читает ограниченный результат."""
        with tempfile.TemporaryDirectory() as directory:
            bot = Path(directory) / "bot.py"
            bot.write_text(source, encoding="utf-8")
            result = subprocess.run([sys.executable, "-u",
                str(ROOT / "server/python/process_validate.py")],
                input=json.dumps({"bot_file": str(bot)}) + "\n", text=True,
                capture_output=True, timeout=10)
        return result.returncode, json.loads(result.stdout)

    def test_valid_build_is_not_executed(self):
        """Код с ошибкой исполнения допускается только по требуемым статическим маркерам."""
        code, frame = self.execute('"""@fileoverview Тестовая сборка без исполнения."""\n'
            '_WORKER_EXTERNAL_UPDATES_PROTOCOL = True\n'
            '_WORKER_EXTERNAL_UPDATES_SAFE = True\n'
            '_WORKER_EXTERNAL_STATE_PROTOCOL = True\n'
            'raise RuntimeError("Нельзя исполнять код при проверке")\n')
        self.assertEqual(code, 0)
        self.assertEqual(frame, {"type": "validate", "event": "ready"})

    def test_unsafe_build_is_rejected(self):
        """Отсутствующие обязательные маркеры запрещают регистрацию спящего бота."""
        code, frame = self.execute('_WORKER_EXTERNAL_UPDATES_PROTOCOL = True\n')
        self.assertEqual(code, 1)
        self.assertEqual(frame, {"type": "validate", "event": "error"})

    def test_invalid_python_is_rejected(self):
        """Синтаксическая ошибка не раскрывается в IPC вместе с исходным кодом."""
        code, frame = self.execute('secret = "never disclose"\ninvalid python (\n')
        self.assertEqual(code, 1)
        self.assertEqual(frame, {"type": "validate", "event": "error"})


if __name__ == "__main__":
    unittest.main()
