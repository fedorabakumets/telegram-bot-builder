"""@fileoverview Временный сторож дерева обработчика при EOF Node и раннем выходе лидера."""

import contextlib
import json
import os
import signal
import subprocess
import sys
import threading
from pathlib import Path

from process_guard_memory import GuardOutput


def run_guard(child_path=None):
    """На POSIX владеет отдельной группой child, на Windows использует Job Object."""
    if os.name == "nt":
        from process_child_windows import run_guard as windows_guard
        return windows_guard(child_path)
    target = child_path or str(Path(__file__).with_name("process_child.py"))
    child = subprocess.Popen([sys.executable, "-u", target],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             start_new_session=True)
    disconnected = threading.Event()
    output = GuardOutput(child, disconnected)
    try:
        def relay():
            """Передаёт ограниченные кадры; закрытие stdin требует завершения всей группы."""
            try:
                while True:
                    frame = sys.stdin.buffer.readline(1024 * 1024 + 1)
                    if not frame or len(frame) > 1024 * 1024 or not frame.endswith(b"\n"):
                        return
                    child.stdin.write(frame)
                    child.stdin.flush()
            except (OSError, ValueError):
                pass
            finally:
                disconnected.set()

        threading.Thread(target=relay, daemon=True).start()
        while child.poll() is None and not disconnected.wait(0.05):
            output.sample()
        return child.poll() if child.poll() is not None else 70
    finally:
        # Лидер уже мог завершиться, однако его потомки всё ещё принадлежат группе.
        with contextlib.suppress(ProcessLookupError):
            os.killpg(child.pid, signal.SIGKILL)
        child.wait(timeout=5)
        output.finish()


def main():
    """Возвращает только фиксированную ошибку и избегает финализации stdin daemon-потока."""
    try:
        return run_guard(sys.argv[1] if len(sys.argv) > 1 else None)
    except BaseException:
        print(json.dumps({"type": "process", "event": "error", "pid": os.getpid()}), flush=True)
        return 1


if __name__ == "__main__":
    os._exit(main())
