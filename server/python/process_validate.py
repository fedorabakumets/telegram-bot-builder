"""@fileoverview Короткоживущая AST-проверка process-сборки без исполнения кода бота."""

import json
import sys

from demand_settings import validate_build


def main():
    """Читает путь из stdin и выдаёт только фиксированный результат без содержимого сборки."""
    try:
        frame = sys.stdin.buffer.readline(65537)
        if len(frame) > 65536 or not frame.endswith(b"\n"):
            raise ValueError("Недопустимый размер команды")
        payload = json.loads(frame)
        if not isinstance(payload, dict) or not isinstance(payload.get("bot_file"), str):
            raise ValueError("Отсутствует путь сборки")
        validate_build(payload["bot_file"])
        print(json.dumps({"type": "validate", "event": "ready"}), flush=True)
        return 0
    except BaseException:
        print(json.dumps({"type": "validate", "event": "error"}), flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
