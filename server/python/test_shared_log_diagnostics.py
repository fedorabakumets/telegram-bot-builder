"""@fileoverview Проверяет передачу Python logging через установленные shared/unified маршрутизаторы."""
import io
import json
import logging
import sys
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

import process_startup_timing
import worker
import worker_isolation as iso
from shared_protocol import SharedProtocol
from unified_sessions import UnifiedProtocol


class SharedLogDiagnosticsTests(unittest.TestCase):
    """Воспроизводит настоящий вызов четырёх аргументов после подмены worker.emit_log."""

    def test_logging_survives_installed_protocols(self):
        """Оба режима сохраняют INFO/WARNING/ERROR, токен и идентичность активации."""
        for protocol_type in (SharedProtocol, UnifiedProtocol):
            for activation in (None, "activation-five"):
                with self.subTest(protocol=protocol_type.__name__, activation=activation):
                    protocol = protocol_type()
                    if activation is not None:
                        protocol.active[5] = activation
                    output = io.StringIO()
                    context = iso.current_token_id.set(5)
                    try:
                        with patch.object(worker, "emit_log", worker.emit_log), \
                                patch.object(worker, "emit_system", worker.emit_system), \
                                patch.object(worker, "emit_runtime_error", worker.emit_runtime_error), \
                                patch.object(process_startup_timing, "mark", process_startup_timing.mark), \
                                patch.object(sys, "stderr", sys.stderr), redirect_stdout(output):
                            protocol.install()
                            for level in (logging.INFO, logging.WARNING, logging.ERROR):
                                record = logging.LogRecord("bot", level, "bot.py", 1, "Запись бота", (), None)
                                worker.WorkerLogHandler().emit(record)
                            # Служебные вызовы с прежними тремя аргументами также остаются рабочими.
                            worker.emit_log(5, "Вызов main()...", "stdout")
                    finally:
                        iso.current_token_id.reset(context)
                    frames = [json.loads(line) for line in output.getvalue().splitlines()]
                    self.assertEqual(len(frames), 4)
                    self.assertEqual([frame.get("level") for frame in frames[:3]], ["INFO", "WARNING", "ERROR"])
                    self.assertEqual([frame["type"] for frame in frames[:3]], ["stdout", "stderr", "stderr"])
                    for frame in frames:
                        self.assertEqual(frame["token_id"], 5)
                        self.assertEqual(frame["activation_id"], activation)


if __name__ == "__main__":
    unittest.main()
