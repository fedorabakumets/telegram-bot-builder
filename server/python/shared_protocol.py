"""@fileoverview Изолированная маршрутизация событий общего обработчика по активациям."""

import json
import os
import sys
import time


class SharedProtocol:
    """Помечает события идентификатором запуска без публикации конфигурации."""

    def __init__(self):
        """Создаёт таблицу только активных обработчиков."""
        self.active = {}
        self.timing = {}

    def event(self, event, token_id=None, **values):
        """Пишет отдельный JSON-кадр с необязательной привязкой к боту."""
        frame = {"type": "process", "event": event, "pid": os.getpid(), **values}
        if token_id is not None:
            frame.update(token_id=token_id, activation_id=self.active.get(token_id))
        print(json.dumps(frame, ensure_ascii=False), flush=True)

    def install(self):
        """Перехватывает штатные события воркера и числовые этапы запуска."""
        import worker
        import worker_isolation as iso
        import process_startup_timing
        original_runtime_error = worker.emit_runtime_error

        def runtime_error(frame):
            """Сохраняет идентичность активации источника доверенной ошибки Telegram."""
            token_id = frame.get("token_id")
            original_runtime_error({**frame, "activation_id": self.active.get(token_id)})

        def log(token_id, content, stream="stdout"):
            """Передаёт лог только владельцу соответствующего запуска."""
            print(json.dumps({"type": stream, "content": content,
                              "token_id": token_id,
                              "activation_id": self.active.get(token_id)},
                             ensure_ascii=False), flush=True)

        def system(content):
            """Переводит готовность модуля в событие конкретной активации."""
            if content.startswith("bot_started:"):
                self.event("ready", int(content.split(":")[1]))

        def mark(stage):
            """Измеряет этапы независимо для одновременно работающих ботов."""
            token_id = iso.current_token_id.get()
            if token_id not in self.active:
                return
            now = time.perf_counter()
            started, previous = self.timing.get(token_id, (now, now))
            self.timing[token_id] = (started, now)
            self.event("startup_timing", token_id, stage=stage,
                       stage_ms=round((now - previous) * 1000, 3),
                       elapsed_ms=round((now - started) * 1000, 3))

        original_stderr = sys.stderr

        class RoutedStderr:
            """Привязывает прямые traceback к контексту выполняющегося бота."""

            encoding = "utf-8"
            errors = "strict"

            def reconfigure(self, *, encoding=None, errors=None, **kwargs):
                """Принимает настройку UTF-8 бота, сохраняя общий маршрутизируемый поток."""
                import codecs
                if encoding is not None and codecs.lookup(encoding).name != "utf-8":
                    raise ValueError("Общий поток ошибок использует UTF-8")
                if errors is not None:
                    codecs.lookup_error(errors)

            def isatty(self):
                """Обозначает протокольный поток без управления терминалом."""
                return False

            def write(self, content):
                """Передаёт сообщение текущему боту без смешивания активаций."""
                token_id = iso.current_token_id.get()
                if token_id in self.active_protocol.active:
                    if content.strip():
                        log(token_id, content, "stderr")
                    return len(content)
                return original_stderr.write(content)

            def flush(self):
                """Сохраняет совместимость со стандартным потоком ошибок."""
                original_stderr.flush()

        RoutedStderr.active_protocol = self
        sys.stderr = RoutedStderr()

        worker.emit_log = log
        worker.emit_system = system
        worker.emit_runtime_error = runtime_error
        process_startup_timing.mark = mark
