/** @fileoverview Проверяет настоящую ноду объединения на сохранённых результатах двух ботов без сети. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import fixture from './combined-summary.fixture.mjs';
import recordings from './combined-summary-results.fixture.mjs';
import { patchCombinedSummary } from './combined-summary-patch.mjs';

const python = process.platform === 'win32' ? resolve('.venv-botcraft/Scripts/python.exe') : 'python3';
const fixed = patchCombinedSummary(fixture);
/** Исполняет рабочий код ноды с изолированным окружением и запрещённой сетью. */
function calculate(bots, sites, notice = '') {
  const script = `import json, logging, socket, sys
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
def no_network(*args, **kwargs):
    """Ни один тест не может подключиться к Telegram или другой внешней службе."""
    raise AssertionError('Сеть запрещена')
socket.socket.connect = no_network
data = json.load(sys.stdin)
state = {'compare_summary': 'Устаревший итог только ботов', 'compare_limit_notice': data['notice']}
scope = {'user_data': {'bot_compare_results_arr': json.dumps(data['bots']), 'compare_results_arr': data['sites']}, '_ns': state, 'logging': logging}
exec(compile(data['code'], 'combined-production-node', 'exec'), scope)
print(json.dumps(state, ensure_ascii=False))`;
  return JSON.parse(execFileSync(python, ['-I', '-c', script], {
    input: JSON.stringify({ code: fixed.nodes[0].data.code, bots, sites, notice }), encoding: 'utf8',
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP,
      TMP: process.env.TMP, PYTHONIOENCODING: 'utf-8' },
  }));
}

/** Создаёт публичную строку результата в сохранённом формате сценария. */
function row(name, payment_label, type = '🤖') {
  return { name, payment_label, type, url: 'https://example.com/' + name };
}

for (const recording of recordings) {
  test(`сохранённый полный ответ production-бота ${recording.tokenId}: корректная общая сводка`, () => {
    const expected = recording.tokenId === 5 ? [5789, 7190, 1401] : [5790, 6745, 955];
    const result = calculate(recording.bots, recording.sites, recording.notice);
    assert.deepEqual([result.compare_min_pay, result.compare_max_pay, result.compare_savings], expected);
    assert.match(result.bot_rates_text, /metka.cc/);
    assert.match(result.bot_rates_text, /LiteBit/);
    assert.equal(result.compare_summary.startsWith('⏸'), Boolean(recording.notice));
  });
}

for (const token of [5, 62]) {
  test(`бот ${token}: сайт дешевле ботов, минимум и экономия соответствуют общей таблице`, () => {
    const result = calculate([row('Sanchez', '5 950 ₽'), row('Scooby', '7 190 ₽'), row('VIRON', '⚠️ нет данных')],
      [row('metka.cc', '5 789 ₽', '🌐'), row('sova.is', '5 912 ₽', '🌐')]);
    assert.equal(result.compare_min_pay, 5789);
    assert.equal(result.compare_max_pay, 7190);
    assert.equal(result.compare_savings, 1401);
    assert.match(result.compare_summary, /5 789 ₽/);
    assert.match(result.compare_summary, /1 401 ₽/);
    assert.ok(result.bot_rates_text.indexOf('metka.cc') < result.bot_rates_text.indexOf('Sanchez'));
  });
  test(`бот ${token}: частичный результат FloodWait учитывает сайты и сохраняет предупреждение один раз`, () => {
    const notice = '⏸ Telegram временно ограничил запросы аккаунта.';
    const result = calculate([row('LiteBit', '6 745 ₽')], [row('metka.cc', '5 790 ₽', '🌐')], notice);
    assert.equal(result.compare_min_pay, 5790);
    assert.equal(result.compare_savings, 955);
    assert.match(result.compare_summary, /955 ₽/);
    assert.equal(result.compare_summary.split(notice).length, 2);
    assert.ok(result.compare_summary.startsWith(notice));
  });
  test(`бот ${token}: отсутствие цен не создаёт фиктивный минимум и экономию`, () => {
    const result = calculate([row('one', '⚠️ нет данных')], [row('two', '', '🌐')]);
    assert.equal(result.compare_min_pay, 0);
    assert.equal(result.compare_max_pay, 0);
    assert.equal(result.compare_savings, 0);
    assert.match(result.compare_summary, /Пока нет доступных цен/);
    assert.doesNotMatch(result.compare_summary, /Дешевле всего|1 000 000 000 000/);
  });
  test(`бот ${token}: один сайт без ответивших ботов даёт честный минимум и нулевой разброс`, () => {
    const result = calculate([], [row('site', '5\u202f790 ₽', '🌐')]);
    assert.equal(result.compare_min_pay, 5790);
    assert.equal(result.compare_savings, 0);
    assert.match(result.compare_summary, /5 790 ₽/);
    assert.match(result.compare_summary, /до <b>0 ₽/);
  });
  test(`бот ${token}: бот дешевле сайтов и обратный порядок входа не меняют итог`, () => {
    const result = calculate([row('bot', '5000 ₽')], [row('site', '6500 ₽', '🌐')]);
    assert.equal(result.compare_min_pay, 5000);
    assert.equal(result.compare_savings, 1500);
  });
}

test('патч повторяем и не изменяет исходный сценарий, связи, сообщения и настройки', () => {
  const original = structuredClone(fixture);
  const patched = patchCombinedSummary(original);
  assert.deepEqual(original, fixture);
  assert.deepEqual(patchCombinedSummary(patched), patched);
  patched.nodes[0].data.code = original.nodes[0].data.code;
  assert.deepEqual(patched, original);
});
