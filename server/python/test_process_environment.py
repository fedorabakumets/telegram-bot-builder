"""@fileoverview Проверяет домашний каталог Windows в изолированном окружении обработчика."""
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from process_handler_io import child_environment


class ProcessEnvironmentTests(unittest.TestCase):
    """Проверяет технические настройки, не разрешая наследование секретов панели."""

    def test_profile_allowed_secrets_denied(self):
        """Сохраняет профиль Windows и не передаёт токены и подключения."""
        values = {"USERPROFILE": "C:\\Users\\example", "HOMEDRIVE": "C:", "HOMEPATH": "\\Users\\example",
                  "APPDATA": "C:\\Users\\example\\AppData", "DATABASE_URL": "secret-db", "BOT_TOKEN": "secret-token"}
        with patch.dict(os.environ, values, clear=True):
            env = child_environment()
        for key in ("USERPROFILE", "HOMEDRIVE", "HOMEPATH", "APPDATA"):
            self.assertEqual(env[key], values[key])
        self.assertNotIn("DATABASE_URL", env)
        self.assertNotIn("BOT_TOKEN", env)

    @unittest.skipUnless(os.name == "nt", "Проверка pathlib Windows")
    def test_real_child_home(self):
        """Настоящий дочерний Python определяет тот же домашний каталог без полного environ."""
        result = subprocess.run([sys.executable, "-c", "import pathlib,json;print(json.dumps(str(pathlib.Path.home())))"],
                                env=child_environment(), capture_output=True, text=True, timeout=15, check=True)
        self.assertEqual(Path(json.loads(result.stdout)), Path.home())


if __name__ == "__main__":
    unittest.main()
