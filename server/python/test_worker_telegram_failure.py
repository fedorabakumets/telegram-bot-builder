"""@fileoverview Проверки доверенной заморозки из исключений aiogram и идентичности запуска источника."""
import asyncio
import hashlib
import logging
import unittest
from unittest.mock import patch

from aiogram.exceptions import TelegramBadRequest
from aiogram.methods import SendMessage
from worker_telegram_failure import current_failure_identity, frozen_event


class WorkerTelegramFailureTest(unittest.TestCase):
    """Отличает настоящую ошибку Telegram от текста терминала и запоздалых событий запуска."""

    def error(self, message="FROZEN_METHOD_INVALID"):
        """Создаёт настоящий тип исключения aiogram без сетевого запроса."""
        return TelegramBadRequest(method=SendMessage(chat_id=1, text="test"), message=message)

    def test_real_exception_has_source_launch_and_fingerprint(self):
        """Событие содержит исходный запуск и отпечаток, но не секрет."""
        event = frozen_event(self.error(), 58, "12345:old-secret", "123")
        self.assertEqual(event["code"], "telegram_frozen")
        self.assertEqual(event["launch_id"], 123)
        self.assertEqual(event["method"], "sendMessage")
        self.assertEqual(event["tokenFingerprint"], hashlib.sha256(b"12345:old-secret").hexdigest())
        self.assertNotIn("old-secret", str(event))

    def test_arbitrary_logs_and_bad_request_text_are_not_confirmation(self):
        """Текст и неточные совпадения не становятся управляющими событиями."""
        for error in (RuntimeError("FROZEN_METHOD_INVALID"), self.error("FROZEN_METHOD_INVALID_EXTRA"),
                      self.error("Third-party says FROZEN_METHOD_INVALID")):
            self.assertIsNone(frozen_event(error, 58, "token", "123"))
        for launch_id in (None, "", "0", "-1", "bad"):
            self.assertIsNone(frozen_event(self.error(), 58, "token", launch_id))

    def test_log_handler_uses_exception_and_task_source_identity(self):
        """Обработчик не доверяет строке и сохраняет запуск контекста задачи."""
        import worker
        identity = current_failure_identity.set(("12345:old-secret", "123"))
        token = worker.iso.current_token_id.set(58)
        events = []
        try:
            with patch.object(worker, "emit_runtime_error", events.append), patch.object(worker, "emit_log"):
                handler = worker.WorkerLogHandler()
                handler.emit(logging.LogRecord("aiogram", logging.ERROR, "", 1, "FROZEN_METHOD_INVALID", (), None))
                self.assertEqual(events, [])
                exc = self.error()
                handler.emit(logging.LogRecord("aiogram", logging.ERROR, "", 1, "Ошибка доставки", (), (type(exc), exc, None)))
                self.assertEqual(events[0]["launch_id"], 123)
                self.assertEqual(events[0]["token_id"], 58)
        finally:
            worker.iso.current_token_id.reset(token)
            current_failure_identity.reset(identity)

    def test_task_identity_does_not_change_after_new_launch(self):
        """Дочерняя задача старого запуска не получает идентичность нового запуска того же бота."""
        async def scenario():
            token = current_failure_identity.set(("old", "123"))
            gate = asyncio.Event()
            async def late_error():
                """Ждёт смены внешнего контекста и читает собственный исходный запуск."""
                await gate.wait()
                return current_failure_identity.get()
            task = asyncio.create_task(late_error())
            current_failure_identity.reset(token)
            new = current_failure_identity.set(("new", "456"))
            try:
                gate.set()
                self.assertEqual(await task, ("old", "123"))
            finally:
                current_failure_identity.reset(new)
        asyncio.run(scenario())


if __name__ == "__main__":
    unittest.main()
