"""@fileoverview Локальный HTTP, Redis и два цикла пробуждения для memory-probe.py."""

import json
import os
from pathlib import Path
import queue
import subprocess
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


def exercise(root, memory):
    """Замеряет настоящий воркер, его ребёнка и отсутствие ребёнка после простоя."""
    redis_url = os.environ.get("LOCAL_PROCESS_TEST_REDIS_URL", "redis://127.0.0.1:6379/15")
    if urlparse(redis_url).hostname not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("Измерение разрешено только с локальным Redis")
    updates, messages = queue.Queue(), queue.Queue()

    class Handler(BaseHTTPRequestHandler):
        """Имитирует только getUpdates, никогда не соединяясь с Telegram."""

        def log_message(self, *args):
            """Отключает служебный HTTP-вывод с синтетическим токеном."""

        def do_POST(self):
            """Возвращает искусственное обновление или пустой короткий long poll."""
            self.rfile.read(int(self.headers.get("Content-Length", "0")))
            try:
                result = [updates.get(timeout=0.3)]
            except queue.Empty:
                result = []
            data = json.dumps({"ok": True, "result": result}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            try:
                self.wfile.write(data)
            except OSError:
                pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    allowed = ("SYSTEMROOT", "WINDIR", "PATH", "TEMP", "TMP", "TMPDIR", "COMSPEC")
    env = {key: os.environ[key] for key in allowed if key in os.environ}
    env.update(PYTHONIOENCODING="utf-8", PROJECT_ID="987654")
    probe = Path(__file__).with_name("memory-probe.py")
    process = subprocess.Popen([sys.executable, str(probe), "--worker"], env=env,
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, text=True, encoding="utf-8")

    def reader():
        """Передаёт протокол воркера в очередь без сохранения секретов."""
        for line in process.stdout:
            try:
                messages.put(json.loads(line))
            except ValueError:
                pass

    threading.Thread(target=reader, daemon=True).start()

    def wait_for(predicate, timeout=30):
        """Ограниченно ждёт ожидаемое событие протокола либо сообщает последние события."""
        deadline = time.monotonic() + timeout
        recent = []
        while time.monotonic() < deadline:
            try:
                message = messages.get(timeout=0.2)
            except queue.Empty:
                continue
            recent = [*recent[-7:], message]
            if predicate(message):
                return message
        raise AssertionError(f"Событие воркера не получено: {recent}")

    def send(command):
        """Посылает одну локальную JSON-команду настоящему воркеру."""
        process.stdin.write(json.dumps(command) + "\n")
        process.stdin.flush()

    results = []
    bot_id = 980000000 + os.getpid()
    fixture_dir = tempfile.TemporaryDirectory(prefix="tbb-process-memory-")
    fixture = Path(fixture_dir.name) / "bot.py"
    fixture.write_bytes(Path(__file__).with_name("memory-fixture.py").read_bytes())
    try:
        parent = wait_for(lambda message: "probe_parent_pid" in message)["probe_parent_pid"]
        wait_for(lambda message: message.get("content") == "worker_ready")
        results.append({"stage": "worker_ready", "parent": memory(parent)})
        send({"cmd": "start_bot", "token_id": bot_id,
              "token": f"{bot_id}:LOCAL_MEMORY_PROBE_NO_TELEGRAM",
              "bot_file": str(fixture),
              "env": {"BOT_POLLING_MODE": "process",
                      "BOT_ON_DEMAND_IDLE_SECONDS": "1", "BOT_ON_DEMAND_MAX_ACTIVE": "1",
                      "REDIS_URL": redis_url,
                      "TELEGRAM_BOT_API_URL": f"http://127.0.0.1:{server.server_port}"}})
        wait_for(lambda message: message.get("content") == f"bot_started:{bot_id}")
        results.append({"stage": "receiver_armed", "parent": memory(parent)})
        for cycle in (1, 2):
            updates.put({"update_id": cycle})
            marker = wait_for(lambda message: "MEMORY_PROBE:" in message.get("content", ""))
            marker_data = json.loads(marker["content"].split("MEMORY_PROBE:", 1)[1])
            child = marker_data["pid"]
            assert child != parent, "Обработчик остался внутри родительского процесса"
            active_parent, active_child = memory(parent), memory(child)
            assert active_child, "Ребёнок завершился до измерения"
            launcher_pid = marker_data["parent_pid"]
            launcher = memory(launcher_pid) if launcher_pid != parent else None
            results.append({"stage": f"cycle_{cycle}_active", "parent": active_parent,
                            "child": active_child, "child_pid": child,
                            "launcher": launcher,
                            "sum_rss_kib": active_parent["rss_kib"] + active_child["rss_kib"]
                                + (launcher["rss_kib"] if launcher else 0)})
            deadline = time.monotonic() + 30
            while memory(child) is not None and time.monotonic() < deadline:
                time.sleep(0.1)
            assert memory(child) is None, "Процесс обработчика не завершился после простоя"
            results.append({"stage": f"cycle_{cycle}_idle", "parent": memory(parent),
                            "child_exists": False, "child_pid": child})
        send({"cmd": "shutdown"})
        process.wait(timeout=20)
        assert process.returncode == 0
        print(json.dumps({"platform": sys.platform, "synthetic": True,
                          "allocation_mib": 64, "snapshots": results}, ensure_ascii=False, indent=2))
    finally:
        if process.poll() is None:
            process.kill()
            process.wait(timeout=10)
        server.shutdown()
        server.server_close()
        fixture_dir.cleanup()
        from redis import Redis
        with Redis.from_url(redis_url, socket_timeout=3) as client:
            own_keys = list(client.scan_iter(f"tbb:demand:{{{bot_id}}}:*"))
            if own_keys:
                client.delete(*own_keys)
