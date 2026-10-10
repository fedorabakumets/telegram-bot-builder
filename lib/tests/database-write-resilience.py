"""@fileoverview Исполняемые проверки записи пользователя с имитацией обрывов БД."""

import ast
import asyncio
import io
import json
import logging
import sys
import types


class PostgresConnectionError(Exception):
    """Временная ошибка соединения PostgreSQL."""


class InterfaceError(Exception):
    """Ошибка интерфейса соединения."""


class SqlError(Exception):
    """Ошибка PostgreSQL с кодом состояния."""

    def __init__(self, state):
        """Сохраняет код для проверки классификации ошибок."""
        self.sqlstate = state


class Pool:
    """Имитирует пул, отдельные соединения и JSONB-сохранение."""

    def __init__(self, failures=(), fail_acquire=False, lose_response=False):
        """Задаёт сбои до записи и начальные данные пользователя."""
        self.failures = list(failures)
        self.acquired = 0
        self.released = 0
        self.executed = 0
        self.rows = {(7, 289, 301): {"existing": "keep"}}
        self.fail_acquire = fail_acquire
        self.lose_response = lose_response

    def acquire(self):
        """Создаёт новый контекст подключения для каждой попытки."""
        pool = self

        class Connection:
            """Контекст отдельного подключения."""

            async def __aenter__(self):
                """Имитирует получение соединения или его обрыв."""
                pool.acquired += 1
                if pool.fail_acquire and pool.failures:
                    raise pool.failures.pop(0)
                return self

            async def __aexit__(self, *args):
                """Фиксирует освобождение соединения."""
                pool.released += 1

            async def execute(self, query, *args):
                """Проверяет атомарный запрос и имитирует слияние JSONB."""
                pool.executed += 1
                if pool.failures and not pool.lose_response:
                    raise pool.failures.pop(0)
                sql = " ".join(query.upper().split())
                assert sql.startswith("INSERT INTO BOT_USERS")
                assert "ON CONFLICT (USER_ID, PROJECT_ID, TOKEN_ID) DO UPDATE" in sql
                assert "|| EXCLUDED.USER_DATA" in sql
                assert "LAST_INTERACTION" in sql
                assert len(args) == 4
                user, project, token, payload = args
                key = (user, project, token)
                pool.rows[key] = {**pool.rows.get(key, {}), **json.loads(payload)}
                if pool.failures:
                    raise pool.failures.pop(0)
                return "INSERT 0 1"

        return Connection()


async def verify(source):
    """Проверяет сгенерированные функции без реальной БД и задержек."""
    tree = ast.parse(source)
    selected = [node for node in tree.body
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                and (node.name == "update_user_data_in_db" or node.name.startswith("_"))]
    delays = []

    async def sleep(delay):
        """Записывает задержки повторных попыток без ожидания."""
        delays.append(delay)

    output = io.StringIO()
    logger = logging.getLogger("resilience-test")
    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler(output)
    handler.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    logger.handlers = [handler]
    namespace = {
        "asyncio": types.SimpleNamespace(sleep=sleep, TimeoutError=asyncio.TimeoutError),
        "asyncpg": types.SimpleNamespace(PostgresConnectionError=PostgresConnectionError,
                                         InterfaceError=InterfaceError),
        "json": json, "logging": logger, "PROJECT_ID": 289, "TOKEN_ID": 301,
    }
    exec(compile(ast.Module(body=selected, type_ignores=[]), "generated.py", "exec"), namespace)
    update = namespace["update_user_data_in_db"]

    async def run(failures=(), acquire=False, expected=True, attempts=1, lose_response=False):
        """Проверяет результат, число подключений и безопасные сообщения."""
        delays.clear()
        output.seek(0)
        output.truncate(0)
        pool = Pool(failures, acquire, lose_response)
        namespace["db_pool"] = pool
        assert await update(7, "private_key", "private_value") is expected
        assert pool.acquired == attempts, (pool.acquired, attempts)
        assert len(delays) == attempts - 1
        assert all(delay > 0 for delay in delays)
        logs = output.getvalue()
        assert "private_key" not in logs and "private_value" not in logs
        assert "sensitive-error" not in logs
        if attempts > 1 or not expected:
            assert "update_user_data_in_db" in logs
            assert f"{attempts}/3" in logs
        if expected and attempts > 1:
            assert "WARNING" in logs and "ERROR" not in logs
            assert "восстановлена" in logs
        if not expected:
            assert "ERROR" in logs
        if expected:
            assert pool.rows[(7, 289, 301)] == {"existing": "keep", "private_key": "private_value"}
        else:
            assert pool.rows[(7, 289, 301)] == {"existing": "keep"}
        return pool

    pool = await run()
    assert pool.executed == 1
    assert await update(8, "new", {"nested": [1, 2]}) is True
    assert pool.rows[(8, 289, 301)] == {"new": {"nested": [1, 2]}}
    assert await update(7, "private_key", None) is True
    assert pool.rows[(7, 289, 301)] == {"existing": "keep", "private_key": None}
    for error in [ConnectionError("sensitive-error"), PostgresConnectionError(),
                  asyncio.TimeoutError(), SqlError("08006"), SqlError("57P01"),
                  SqlError("57P02"), SqlError("57P03"), InterfaceError("connection is closed")]:
        await run([error], attempts=2)
    await run([ConnectionError(), ConnectionError()], attempts=3)
    await run([ConnectionResetError()], attempts=2, lose_response=True)
    await run([ConnectionError()] * 3, expected=False, attempts=3)
    await run([ConnectionError()], acquire=True, attempts=2)
    for error in [ValueError("sensitive-error"), SqlError("23505"),
                  InterfaceError("another operation is in progress")]:
        await run([error], expected=False)
    namespace["db_pool"] = None
    assert await update(7, "private_key", "private_value") is False
    print("Проверки атомарности, восстановления, отказа и безопасных логов пройдены")


asyncio.run(verify(sys.stdin.read()))
