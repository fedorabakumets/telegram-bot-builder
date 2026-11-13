"""@fileoverview Проверки маскировки секретов без повреждения портов и публичных адресов."""
import unittest
from process_handler_io import redact, secret_environment_key


class LogRedactionTest(unittest.TestCase):
    """Проверяет одинаковую классификацию настроек в Python-обработчике."""

    def test_public_fields_and_secrets(self):
        """Идентификаторы остаются читаемыми, секреты доступа скрываются."""
        public = {"TOKEN_ID": "58", "PROJECT_ID": "12", "WEBHOOK_PORT": "9058",
                  "WEBHOOK_URL": "https://example.com/api/webhook/12/58", "AUTH_MODE": "dev"}
        private = {"BOT_TOKEN": "private-token", "WEBHOOK_SECRET_TOKEN": "private-webhook",
                   "USERBOT_API_HASH": "private-hash", "USERBOT_SESSION_STRING": "private-session",
                   "REDIS_URL": "redis://user:password@redis/0"}
        self.assertTrue(all(not secret_environment_key(key) for key in public))
        self.assertTrue(all(secret_environment_key(key) for key in private))
        line = "Порт 9058; бот 58; https://example.com/api/webhook/12/58"
        self.assertEqual(redact(line, list(private.values())), line)
        for value in private.values():
            self.assertEqual(redact(value, list(private.values())), "[скрыто]")


if __name__ == "__main__":
    unittest.main()
