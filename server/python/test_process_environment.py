"""@fileoverview Проверяет домашний каталог и путь очереди изолированного обработчика."""
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

    def test_real_child_preserves_analytics_spool_without_bot_override(self):
        """Сохраняет путь очереди в дочернем процессе без наследования секретов панели."""
        values = {"ANALYTICS_SPOOL_DIR": str(Path.cwd() / "private-analytics-spool"),
                  "DATABASE_URL": "secret-db", "BOT_TOKEN": "secret-token",
                  "SESSION_SECRET": "secret-session"}
        with patch.dict(os.environ, values):
            env = child_environment()
        # В настройках конкретного бота пути может не быть: его даёт исполнитель.
        env.update({"PROJECT_ID": "12", "TOKEN_ID": "8"})
        script = ("import os,json;print(json.dumps({'spool':os.getenv('ANALYTICS_SPOOL_DIR'),"
                  "'secrets':[key for key in ('DATABASE_URL','BOT_TOKEN','SESSION_SECRET') if key in os.environ]}))")
        result = subprocess.run([sys.executable, "-c", script], env=env,
                                capture_output=True, text=True, timeout=15, check=True)
        self.assertEqual(json.loads(result.stdout),
                         {"spool": values["ANALYTICS_SPOOL_DIR"], "secrets": []})


if __name__ == "__main__":
    unittest.main()
