/** @fileoverview Обезличенная рабочая нода объединения production-сценария обменников. */
export default {
  "nodes": [
    {
      "id": "bot-code-merge-all",
      "data": {
        "code": "import json\n\n\ndef _arr(_name):\n    \"\"\"Читает JSON-массив из переменной пользователя.\"\"\"\n    _raw = user_data.get(_name) or '[]'\n    try:\n        _v = json.loads(_raw) if isinstance(_raw, str) else _raw\n    except Exception:\n        return []\n    return _v if isinstance(_v, list) else []\n\n\ndef _pay(_it):\n    \"\"\"Сумма к оплате в рублях из payment_label (0 = нет данных).\"\"\"\n    _d = ''.join(_c for _c in str(_it.get('payment_label') or '') if _c.isdigit())\n    return int(_d) if _d else 0\n\n\ndef _row(_mark, _it):\n    \"\"\"Строка итогового списка в HTML.\"\"\"\n    return (_mark + ' ' + str(_it.get('type') or '') + ' <a href=\"' + str(_it.get('url') or '')\n            + '\">' + str(_it.get('name') or '') + '</a>: к оплате <b>'\n            + str(_it.get('payment_label') or '') + '</b>')\n\n\n_items = _arr('bot_compare_results_arr') + _arr('compare_results_arr')\n_ok = sorted([_i for _i in _items if _pay(_i) > 0], key=_pay)\n_bad = [_i for _i in _items if _pay(_i) <= 0]\n_MED = ['🥇', '🥈', '🥉']\n_lines = [_row(_MED[_n] if _n < 3 else '🔸', _it) for _n, _it in enumerate(_ok)]\n_lines += [_row('🔸', _it) for _it in _bad]\n_ns['bot_rates_text'] = '\\n'.join(_lines) + '\\n'\n_ns['compare_min_pay'] = _pay(_ok[0]) if _ok else 0\n_ns['compare_max_pay'] = _pay(_ok[-1]) if _ok else 0\n_ns['compare_savings'] = (_pay(_ok[-1]) - _pay(_ok[0])) if _ok else 0\nlogging.info('merge-all: с ценой ' + str(len(_ok)) + ', без цены ' + str(len(_bad)) + ', min=' + str(_ns['compare_min_pay']) + ', max=' + str(_ns['compare_max_pay']))",
        "autoTransitionTo": "bot-delete-loading",
        "enableAutoTransition": true
      },
      "type": "code",
      "position": {
        "x": 3060,
        "y": 840
      }
    }
  ]
};
