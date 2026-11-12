"""@fileoverview Временный Windows-сторож: закрывает Job Object при исчезновении Node."""

import json
import os
import subprocess
import sys
import threading
from pathlib import Path

from process_job import attach_job, close_job
from process_guard_memory import GuardOutput


def run_guard(child_path=None):
    """Передаёт закрытый IPC обработчику и уничтожает всё дерево после его выхода или EOF."""
    if os.name != "nt":
        raise RuntimeError("Сторож Job Object предназначен только для Windows")
    target = child_path or str(Path(__file__).with_name("process_child.py"))
    child = subprocess.Popen([sys.executable, "-u", target],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    job = None
    disconnected = threading.Event()
    output = GuardOutput(child, disconnected)
    try:
        # До первого init ребёнок ждёт stdin и ещё не запускает пользовательский код.
        job = attach_job(child.pid)

        def relay():
            """Передаёт ограниченные кадры; EOF родителя требует немедленного уничтожения дерева."""
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
        if job is not None:
            close_job(job)
        elif child.poll() is None:
            child.kill()
        child.wait(timeout=5)
        output.finish()


def main():
    """Публикует безопасную ошибку и избегает финализации заблокированного stdin-потока."""
    try:
        return run_guard(sys.argv[1] if len(sys.argv) > 1 else None)
    except BaseException:
        print(json.dumps({"type": "process", "event": "error", "pid": os.getpid()}), flush=True)
        return 1


if __name__ == "__main__":
    os._exit(main())
