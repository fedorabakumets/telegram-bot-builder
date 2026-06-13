# -*- coding: utf-8 -*-
"""Патч project.json: совместный режим, Lucky, формат вывода."""
import json
import re

PATH = r'c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json'

LINE_TEMPLATE = (
    '🔸 {item.type} <a href="{item.url}">{item.name}</a>: '
    'к оплате <b>{item.payment_label}</b>\n'
)

CHOOSE_CURRENCY_TEXT = (
    '{compare_title}\n\n📊 <b>СБП/Карта → Bitcoin</b>\n\n'
    '💱 <b>В какой валюте указать сумму?</b>\n\n'
    '• <b>₽</b> — сколько рублей готовы потратить\n'
    '• <b>BTC</b> — сколько bitcoin хотите получить\n\n'
    '<i>Обе валюты запускают полное сравнение ботов и сайтов.</i>'
)


def find_node(data, nid):
    """Найти узел и лист по id."""
    for sheet in data['sheets']:
        for node in sheet['nodes']:
            if node['id'] == nid:
                return node, sheet
    return None, None


def patch_node(data, nid, patch_fn):
    """Применить patch_fn к узлу."""
    node, _ = find_node(data, nid)
    if not node:
        raise SystemExit(f'узел не найден: {nid}')
    patch_fn(node)
    return node


def ensure_assignment(assignments, aid, item, before_mode=None):
    """Добавить assignment, если ещё нет."""
    if any(a.get('id') == aid for a in assignments):
        return
    if before_mode:
        for i, a in enumerate(assignments):
            if a.get('mode') == before_mode:
                assignments.insert(i, item)
                return
    assignments.append(item)


def strip_rate_suffix_from_pushes(assignments):
    """Убрать rate_suffix из json_push и лишние suffix-assignment."""
    cleaned = []
    for a in assignments:
        if a.get('id', '').endswith('_rate_suffix') or '_suffix_' in a.get('id', ''):
            continue
        if a.get('mode') == 'json_push' and 'rate_suffix' in a.get('value', ''):
            a['value'] = re.sub(r',"rate_suffix":"\{[^}]+\}"', '', a['value'])
        cleaned.append(a)
    assignments[:] = cleaned


def patch_lucky_sheet(data):
    """Узлы Lucky: клик по тексту, проверка ответа, парсинг."""
    existing_ids = {n['id'] for s in data['sheets'] for n in s['nodes']}
    _, lucky_sheet = find_node(data, 'bot-ub-lucky-start')
    if lucky_sheet is None:
        raise SystemExit('лист Lucky не найден')

    if 'bot-cond-lucky-goto-address' not in existing_ids:
        lucky_sheet['nodes'].append({
            'id': 'bot-cond-lucky-goto-address',
            'data': {
                'buttons': [],
                'branches': [
                    {
                        'id': 'br_min_err',
                        'value': 'Минимальная',
                        'target': 'bot-setv-btc-fail-lucky',
                        'operator': 'contains',
                    },
                    {
                        'id': 'br_zero_err',
                        'value': '0.00',
                        'target': 'bot-setv-btc-fail-lucky',
                        'operator': 'contains',
                    },
                    {
                        'id': 'br_rub_err',
                        'value': 'рублях',
                        'target': 'bot-setv-btc-fail-lucky',
                        'operator': 'contains',
                    },
                    {
                        'id': 'br_ok',
                        'value': '',
                        'target': 'bot-ub-lucky-address',
                        'operator': 'else',
                    },
                ],
                'markdown': False,
                'variable': 'lucky_amount_text',
                'adminOnly': False,
                'showInMenu': False,
                'messageText': '',
                'keyboardType': 'none',
                'requiresAuth': False,
                'isPrivateOnly': False,
                'resizeKeyboard': True,
                'oneTimeKeyboard': False,
                'enableStatistics': False,
            },
            'type': 'condition',
            'position': {'x': 200, 'y': 320},
        })

    patch_node(data, 'bot-cond-lucky-input', lambda n: n['data']['branches'][0].update({
        'target': 'bot-ub-lucky-btc-input',
    }))
    patch_node(data, 'bot-ub-lucky-start', lambda n: n['data'].update({
        # После /start: сначала «🍀», затем меню с кнопкой «Купить» (как scrape_lucky.py)
        'responseStrategy': 'regex_match',
        'responseFilterRegex': 'Купить|Продать|Чистка',
        'responseWaitSeconds': 14,
        'waitSeconds': 2,
        'autoTransitionTo': 'bot-ub-lucky-buy',
    }))
    patch_node(data, 'bot-ub-lucky-buy', lambda n: n['data'].update({
        'clickMode': 'text',
        'clickValue': 'Купить',
        'clickDelivery': 'await',
        'messageId': '',
        'messageIdSource': 'last',
        'responseStrategy': 'new_message',
        'responseFilterRegex': 'криптовалют|Купить BTC',
        'responseWaitSeconds': 14,
        'autoTransitionTo': 'bot-ub-lucky-btc',
    }))
    patch_node(data, 'bot-ub-lucky-btc', lambda n: n['data'].update({
        'clickMode': 'text',
        'clickValue': 'Купить BTC',
        'clickDelivery': 'fire_and_forget',
        'messageIdSource': 'last',
        'responseStrategy': 'new_message',
        'responseFilterRegex': 'метод оплаты|оплат|Альфа|банк',
        'responseWaitSeconds': 14,
        'autoTransitionTo': 'bot-ub-lucky-token',
    }))
    patch_node(data, 'bot-ub-lucky-token', lambda n: n['data'].update({
        'clickMode': 'text',
        'clickValue': 'Альфа',
        'clickDelivery': 'fire_and_forget',
        'messageIdSource': 'last',
        'autoTransitionTo': 'bot-cond-lucky-input',
        'responseStrategy': 'new_message',
        'responseFilterRegex': 'способ ввода|токенах|Введите|укажите',
        'responseWaitSeconds': 16,
    }))
    patch_node(data, 'bot-ub-lucky-btc-input', lambda n: n['data'].update({
        'clickMode': 'index',
        'clickValue': '1',
        'clickDelivery': 'fire_and_forget',
        'messageIdSource': 'last',
        'responseStrategy': 'new_message',
        'autoTransitionTo': 'bot-ub-lucky-amount-btc',
        'responseFilterRegex': 'сумм|Введите|токен|BTC',
        'responseWaitSeconds': 14,
    }))
    patch_node(data, 'bot-ub-lucky-amount-btc', lambda n: n['data'].update({
        'autoTransitionTo': 'bot-ub-lucky-address',
        'responseWaitSeconds': 22,
        'responseFloorMessageIdVar': 'ub_sent_msg_id',
        'responseFilterRegex': 'адрес|кошел|wallet|bc1',
    }))
    patch_node(data, 'bot-ub-lucky-amount-btc', lambda n: n['data'].pop('saveResponseTextTo', None))

    def patch_goto_address(n):
        """Не слать адрес, если сумма не принята или бот на неверном экране."""
        branches = n['data']['branches']
        extra = [
            {
                'id': 'br_empty',
                'value': '',
                'target': 'bot-setv-btc-fail-lucky',
                'operator': 'empty',
            },
            {
                'id': 'br_cmd_err',
                'value': 'не распознана',
                'target': 'bot-setv-btc-fail-lucky',
                'operator': 'contains',
            },
            {
                'id': 'br_pay_screen',
                'value': 'метод оплаты',
                'target': 'bot-setv-btc-fail-lucky',
                'operator': 'contains',
            },
        ]
        for br in extra:
            if not any(b.get('id') == br['id'] for b in branches):
                branches.insert(0, br)

    patch_node(data, 'bot-cond-lucky-goto-address', patch_goto_address)
    patch_node(data, 'bot-ub-lucky-address', lambda n: n['data'].update({
        'responseWaitSeconds': 20,
        'responseFilterRegex': (
            'Подтверждение заказа|Получите|Итого|Комиссия|к оплате|К оплате|Сумма'
        ),
    }))

    def patch_parse_lucky(n):
        """Объединить тексты ответов и расширить regex."""
        assigns = n['data']['assignments']
        pl_source_item = {
            'id': 'pl_source',
            'mode': 'expression',
            'value': "'{lucky_text}\\n{lucky_amount_text}'.strip()",
            'variable': 'lucky_parse_source',
        }
        # pl_source должен быть первым — regex_extract читает lucky_parse_source
        assigns[:] = [a for a in assigns if a.get('id') != 'pl_source']
        assigns.insert(0, pl_source_item)
        for a in assigns:
            if a.get('mode') == 'regex_extract' and a.get('value') == '{lucky_text}':
                a['value'] = '{lucky_parse_source}'
        extra_patterns = [
            ('pl_pay_raw', 'К оплате[^0-9]*([\\d][\\d\\s]*)', 'lucky_pay_raw'),
            ('pl_rub_raw', '([\\d][\\d\\s]*)\\s*(?:₽|RUB)', 'lucky_rub_raw'),
        ]
        for pid, pattern, var in extra_patterns:
            existing = next((x for x in assigns if x.get('id') == pid), None)
            if existing:
                existing['pattern'] = pattern
                existing['value'] = '{lucky_parse_source}'
            else:
                assigns.append({
                    'id': pid,
                    'mode': 'regex_extract',
                    'value': '{lucky_parse_source}',
                    'pattern': pattern,
                    'variable': var,
                    'regexGroup': '1',
                })
        for a in assigns:
            if a.get('id') == 'pl_payment':
                a['value'] = (
                    "int('{lucky_total_raw}'.replace(' ', '')) if '{lucky_total_raw}'.strip() "
                    "and '{lucky_total_raw}'.strip() != '0' else "
                    "int('{lucky_sum_raw}'.replace(' ', '')) if '{lucky_sum_raw}'.strip() "
                    "and '{lucky_sum_raw}'.strip() != '0' else "
                    "int('{lucky_pay_raw}'.replace(' ', '')) if '{lucky_pay_raw}'.strip() "
                    "and '{lucky_pay_raw}'.strip() != '0' else "
                    "int('{lucky_rub_raw}'.replace(' ', '')) if '{lucky_rub_raw}'.strip() "
                    "and '{lucky_rub_raw}'.strip() != '0' else 0"
                )

    patch_node(data, 'bot-setv-parse-lucky', patch_parse_lucky)


def patch_btc_progress_loop(data: dict) -> None:
    """Включить цикл обновления прогресса BTC: split → poll, done → refresh UI."""
    patch_node(data, 'bot-split-btc', lambda n: n['data'].update({
        'enableAutoTransition': True,
        'autoTransitionTo': 'bot-delay-btc-poll',
    }))
    patch_node(data, 'bot-setv-btc-done', lambda n: n['data'].update({
        'enableAutoTransition': True,
        'autoTransitionTo': 'edit-progress-btc-par',
    }))


def main() -> None:
    """Применить все исправления совместного режима."""
    with open(PATH, encoding='utf-8') as f:
        data = json.load(f)

    patch_node(data, 'bot-msg-choose-currency', lambda n: n['data'].update({
        'messageText': CHOOSE_CURRENCY_TEXT,
    }))
    patch_node(data, 'bot-msg-btc-saved', lambda n: n['data'].update({
        'messageText': (
            '{compare_title}\n\n📊 <b>СБП/Карта → Bitcoin</b>\n'
            '₿ Запрос: <b>{user_btc} BTC</b>\n\n'
            '✅ Режим <b>BTC</b> активен. Сумма сохранена — можно запустить сравнение.'
        ),
    }))

    patch_lucky_sheet(data)
    patch_btc_progress_loop(data)

    patch_node(data, 'bot-cond-after-bots', lambda n: n['data']['branches'][0].update({
        'target': 'bot-cond-all-sites-ready',
    }))

    n_init, sheet_cmp = find_node(data, 'setv-compare-init')
    assignments = n_init['data']['assignments']
    if not any(a.get('id') == 'sites_amt' for a in assignments):
        assignments.insert(2, {
            'id': 'sites_amt',
            'mode': 'expression',
            'value': (
                "int(float({user_amount})) if '{compare_input_mode}' != 'btc' else "
                "(int(round(float({user_btc}) * float(str({btc_rub}).replace(' ', '')))) "
                "if float(str({btc_rub}).replace(' ', '')) > 0 "
                "else int(round(float({user_btc}) * 6000000)))"
            ),
            'variable': 'sites_user_amount',
        })

    n_fetch, _ = find_node(data, 'fetch-compare-rate')
    fields = n_fetch['data']['httpRequestBatchResultFields']
    field_map = {f['key']: f for f in fields}
    if 'rate' in field_map:
        field_map['rate']['value'] = (
            "={{round(float({sites_user_amount}) / float({__extracted__}), int({selected_decimals})) "
            "if float({__extracted__}) > 0 and '{compare_input_mode}' != 'btc' else "
            "(round(float({user_btc}), int({selected_decimals})) if float({user_btc}) > 0 else 0)}}"
        )
    if 'raw_rate' in field_map:
        field_map['raw_rate']['value'] = (
            "={{int(round(float({__extracted__}))) if float({__extracted__}) > 0 else "
            "(int(round(int({sites_user_amount}) / float({user_btc}))) "
            "if '{compare_input_mode}' == 'btc' and float({user_btc}) > 0 and int({sites_user_amount}) > 0 "
            "else 0)}}"
        )
    field_map.pop('rate_suffix', None)
    fields[:] = [f for f in fields if f.get('key') != 'rate_suffix']

    n_best, _ = find_node(data, 'setv-compare-best')
    if not any(a.get('id') == 'sites_done_flag' for a in n_best['data']['assignments']):
        n_best['data']['assignments'].append({
            'id': 'sites_done_flag',
            'mode': 'text',
            'value': '1',
            'variable': 'sites_fetch_done',
        })

    for nid in ('all-merge-format',):
        patch_node(data, nid, lambda n: [
            a.update({'value': LINE_TEMPLATE})
            for a in n['data']['assignments']
            if a.get('mode') == 'json_format'
        ])

    def patch_format_btc(n):
        """Обновить шаблон списка ботов для BTC."""
        for a in n['data']['assignments']:
            if a.get('id') == 'btc_fmt_bots':
                a['value'] = LINE_TEMPLATE

    patch_node(data, 'bot-setv-format-btc', patch_format_btc)

    n_calc, _ = find_node(data, 'bot-setv-calc-btc')
    strip_rate_suffix_from_pushes(n_calc['data']['assignments'])

    n_split, _ = find_node(data, 'bot-split-btc')
    branches = n_split['data']['parallelBranches']
    if not any(b.get('id') == 'br_sites' for b in branches):
        branches.insert(-1, {
            'id': 'br_sites',
            'label': 'Сайты',
            'target': 'bot-cond-all-sites-gate',
            'onErrorTarget': 'bot-setv-sites-fail',
        })
    n_split['data']['maxConcurrent'] = 15

    existing_ids = {n['id'] for s in data['sheets'] for n in s['nodes']}
    new_nodes = []
    if 'bot-cond-all-sites-gate' not in existing_ids:
        new_nodes.append({
            'id': 'bot-cond-all-sites-gate',
            'data': {
                'buttons': [],
                'branches': [
                    {'id': 'br_all', 'value': 'all', 'target': 'setv-compare-init', 'operator': 'equals'},
                    {'id': 'br_skip', 'value': '', 'target': 'bot-setv-sites-skip', 'operator': 'else'},
                ],
                'markdown': False,
                'variable': 'compare_mode',
                'adminOnly': False,
                'showInMenu': False,
                'messageText': '',
                'keyboardType': 'none',
                'requiresAuth': False,
                'isPrivateOnly': False,
                'resizeKeyboard': True,
                'oneTimeKeyboard': False,
                'enableStatistics': False,
            },
            'type': 'condition',
            'position': {'x': 1600, 'y': 2180},
        })
    if 'bot-setv-sites-skip' not in existing_ids:
        new_nodes.append({
            'id': 'bot-setv-sites-skip',
            'data': {
                'buttons': [],
                'markdown': False,
                'adminOnly': False,
                'showInMenu': False,
                'assignments': [],
                'messageText': '',
                'keyboardType': 'none',
                'requiresAuth': False,
                'isPrivateOnly': False,
                'resizeKeyboard': True,
                'oneTimeKeyboard': False,
                'enableStatistics': False,
                'enableAutoTransition': False,
            },
            'type': 'set_variable',
            'position': {'x': 1800, 'y': 2280},
        })
    if 'bot-setv-sites-fail' not in existing_ids:
        new_nodes.append({
            'id': 'bot-setv-sites-fail',
            'data': {
                'buttons': [],
                'markdown': False,
                'adminOnly': False,
                'showInMenu': False,
                'assignments': [
                    {'id': 'sites_done_fail', 'mode': 'text', 'value': '1', 'variable': 'sites_fetch_done'},
                ],
                'messageText': '',
                'keyboardType': 'none',
                'requiresAuth': False,
                'isPrivateOnly': False,
                'resizeKeyboard': True,
                'oneTimeKeyboard': False,
                'enableStatistics': False,
                'enableAutoTransition': False,
            },
            'type': 'set_variable',
            'position': {'x': 1800, 'y': 2080},
        })
    if 'bot-cond-all-sites-ready' not in existing_ids:
        new_nodes.append({
            'id': 'bot-cond-all-sites-ready',
            'data': {
                'buttons': [],
                'branches': [
                    {'id': 'br_ready', 'value': '1', 'target': 'all-merge-format', 'operator': 'equals'},
                    {'id': 'br_wait', 'value': '', 'target': 'bot-delay-all-sites', 'operator': 'else'},
                ],
                'markdown': False,
                'variable': 'sites_fetch_done',
                'adminOnly': False,
                'showInMenu': False,
                'messageText': '',
                'keyboardType': 'none',
                'requiresAuth': False,
                'isPrivateOnly': False,
                'resizeKeyboard': True,
                'oneTimeKeyboard': False,
                'enableStatistics': False,
            },
            'type': 'condition',
            'position': {'x': 900, 'y': 600},
        })
    if 'bot-delay-all-sites' not in existing_ids:
        new_nodes.append({
            'id': 'bot-delay-all-sites',
            'data': {
                'buttons': [],
                'markdown': False,
                'adminOnly': False,
                'showInMenu': False,
                'messageText': '',
                'keyboardType': 'none',
                'requiresAuth': False,
                'isPrivateOnly': False,
                'resizeKeyboard': True,
                'oneTimeKeyboard': False,
                'delaySeconds': 2,
                'autoTransitionTo': 'bot-cond-all-sites-ready',
                'enableStatistics': False,
                'enableAutoTransition': True,
                'runInBackground': False,
            },
            'type': 'delay',
            'position': {'x': 1100, 'y': 650},
        })
    if new_nodes:
        sheet_cmp['nodes'].extend(new_nodes)

    n_bot_init, _ = find_node(data, 'bot-setv-init')
    if not any(a.get('id') == 'init_sites_done' for a in n_bot_init['data']['assignments']):
        n_bot_init['data']['assignments'].append({
            'id': 'init_sites_done',
            'mode': 'text',
            'value': '0',
            'variable': 'sites_fetch_done',
        })
    if not any(a.get('id') == 'clr_lucky_amount_text' for a in n_bot_init['data']['assignments']):
        n_bot_init['data']['assignments'].append({
            'id': 'clr_lucky_amount_text',
            'mode': 'text',
            'value': '',
            'variable': 'lucky_amount_text',
        })

    patch_node(data, 'cond-after-sites', lambda n: n['data']['branches'][0].update({
        'target': 'bot-setv-sites-skip',
    }))

    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('patched ok')


if __name__ == '__main__':
    main()
