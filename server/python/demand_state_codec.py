"""@fileoverview Безопасный JSON-кодек состояния с сохранением целочисленных ключей."""

import json
import math


class StateSerializationError(ValueError):
    """Состояние нельзя безопасно сохранить или восстановить; выгрузка запрещена."""


def _convert(value, decode=False, depth=0, budget=None):
    """Преобразует поддерживаемые значения с ограничением глубины и числа элементов."""
    budget = [100000] if budget is None else budget
    budget[0] -= 1
    if depth > 64 or budget[0] < 0:
        raise StateSerializationError("Состояние слишком сложное")
    nested = lambda item: _convert(item, decode, depth + 1, budget)
    if value is None or type(value) in (str, bool, int):
        return value
    if type(value) is float and math.isfinite(value):
        return value
    if decode:
        if not isinstance(value, list) or len(value) != 2 or not isinstance(value[1], list):
            raise StateSerializationError("Повреждён формат снимка состояния")
        tag, items = value
        if tag == "l":
            return [nested(item) for item in items]
        if tag == "d":
            result = {}
            for pair in items:
                if not isinstance(pair, list) or len(pair) != 2 or type(pair[0]) not in (str, int):
                    raise StateSerializationError("Повреждён ключ снимка состояния")
                if pair[0] in result:
                    raise StateSerializationError("Повторяющийся ключ снимка состояния")
                result[pair[0]] = nested(pair[1])
            return result
    elif type(value) is list:
        return ["l", [nested(item) for item in value]]
    elif type(value) is dict:
        pairs = []
        for key, item in value.items():
            if type(key) not in (str, int):
                raise StateSerializationError("Неподдерживаемый тип ключа состояния")
            pairs.append([key, nested(item)])
        return ["d", pairs]
    raise StateSerializationError("Неподдерживаемый тип значения состояния")


def encode_state(value, max_bytes):
    """Кодирует словарь без pickle и отклоняет снимки сверх ограничения байтов."""
    if type(value) is not dict:
        raise StateSerializationError("user_data должен быть словарём")
    try:
        tree = _convert(value)
        chunks, size = [], 0
        encoder = json.JSONEncoder(ensure_ascii=False, allow_nan=False, separators=(",", ":"))
        for chunk in encoder.iterencode(tree):
            size += len(chunk.encode("utf-8"))
            if size > max_bytes:
                raise StateSerializationError("Снимок состояния превышает ограничение")
            chunks.append(chunk)
        return "".join(chunks)
    except (RecursionError, UnicodeError, ValueError) as error:
        if isinstance(error, StateSerializationError):
            raise
        raise StateSerializationError("Не удалось сериализовать состояние") from None


def decode_state(payload, max_bytes):
    """Проверяет размер и структуру снимка перед восстановлением словаря."""
    try:
        if len(payload.encode("utf-8")) > max_bytes:
            raise StateSerializationError("Снимок состояния превышает ограничение")
        result = _convert(json.loads(payload), decode=True)
        if type(result) is not dict:
            raise StateSerializationError("Снимок user_data должен быть словарём")
        return result
    except (RecursionError, UnicodeError, ValueError, TypeError):
        raise StateSerializationError("Не удалось восстановить состояние") from None
