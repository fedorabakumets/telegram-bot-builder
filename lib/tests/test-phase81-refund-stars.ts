/**
 * @fileoverview Фазовые тесты узла refund_stars (phase81)
 *
 * Блок A: Генерация refund_star_payment
 * Блок B: Подстановка кода покупки и переход
 * Блок C: Нет дубля хендлера, синтаксис Python
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Собирает минимальный project.json для генерации
 * @param nodes - Узлы листа
 * @returns Объект проекта
 */
function makeCleanProject(nodes: unknown[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код бота
 * @param project - Проект
 * @param label - Метка для имени бота
 * @returns Сгенерированный код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase81_${label}`,
    userDatabaseEnabled: false,
  });
}

/**
 * Проверяет синтаксис Python через py_compile
 * @param code - Код
 * @param label - Метка временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p81_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: e.stderr?.toString() ?? String(e) };
  }
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/**
 * Запускает один тест
 * @param id - Идентификатор
 * @param name - Название
 * @param fn - Тело
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

/**
 * Утверждает условие
 * @param cond - Условие
 * @param msg - Сообщение
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис и падает при ошибке
 * @param code - Код
 * @param label - Метка
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

/**
 * Создаёт узел refund_stars
 * @param id - ID узла
 * @param targetId - ID следующего узла
 * @param extra - Доп. поля data
 * @returns Узел
 */
function makeRefundNode(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'refund_stars',
    position: { x: 0, y: 0 },
    data: {
      refundUserSource: 'current_user',
      refundUserId: '',
      refundChargeId: '{payment_charge_id}',
      ignoreErrors: false,
      autoTransitionTo: targetId,
      enableAutoTransition: true,
      keyboardType: 'none',
      buttons: [],
      ...extra,
    },
  };
}

/**
 * Создаёт узел message
 * @param id - ID узла
 * @returns Узел
 */
function makeMessageNode(id: string) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: 'Звёзды возвращены',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест phase81 — refund_stars (вернуть звёзды)               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Генерация возврата ───────────────────────────────────');

test('A01', 'refund_star_payment и handle_callback', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_ref1'), 'обработчик ref1');
  ok(
    code.includes('refund_star_payment') || code.includes('RefundStarPayment'),
    'вызов refund_star_payment',
  );
  ok(code.includes('telegram_payment_charge_id'), 'параметр charge id');
});

test('A02', 'подстановка кода покупки из переменной', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('payment_charge_id'), 'имя переменной в коде');
  ok(code.includes('replace_variables_in_text'), 'подстановка переменных');
});

test('A03', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a03'), 'a03');
});

console.log('── Блок B: Переход и режимы ─────────────────────────────────────');

test('B01', 'после успеха вызывается handle_callback_msg1', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('handle_callback_msg1'), 'переход на msg1');
  const refundIdx = code.indexOf('refund_star_payment');
  const nextIdx = code.indexOf('handle_callback_msg1', refundIdx);
  ok(nextIdx > refundIdx, 'переход идёт после refund_star_payment');
});

test('B02', 'custom user_id', () => {
  const p = makeCleanProject([
    makeRefundNode('ref1', 'msg1', {
      refundUserSource: 'custom',
      refundUserId: '{target_uid}',
      refundChargeId: 'fixed_charge',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b02');
  ok(code.includes('target_uid'), 'custom user var');
  ok(code.includes('fixed_charge'), 'литеральный charge id');
});

test('B03', 'ignoreErrors оборачивает в try/except', () => {
  const p = makeCleanProject([
    makeRefundNode('ref1', 'msg1', { ignoreErrors: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b03');
  ok(code.includes('except Exception'), 'except при ignoreErrors');
});

test('B04', 'без refund_stars нет refund_star_payment', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'b04');
  ok(!code.includes('refund_star_payment'), 'нет вызова возврата');
});

test('B05', 'в коде есть тексты ошибок возврата (дефолты)', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b05');
  ok(code.includes('CHARGE_ALREADY_REFUNDED'), 'ветка уже возвращено');
  ok(code.includes('Пожалуйста, укажите код покупки'), 'текст пустого кода');
  ok(code.includes('Такой код покупки не найден'), 'текст не найден');
  ok(code.includes('уже ранее был произведён возврат'), 'текст already');
  ok(code.includes('callback_query.message.answer'), 'ответ пользователю');
});

test('B06', 'кастомные refundMsg* попадают в код', () => {
  const p = makeCleanProject([
    makeRefundNode('ref1', 'msg1', {
      refundMsgEmpty: 'Нужен код X',
      refundMsgNotFound: 'Код Y не найден',
      refundMsgAlreadyRefunded: 'Уже вернули Z',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b06');
  ok(code.includes('Нужен код X'), 'кастом empty');
  ok(code.includes('Код Y не найден'), 'кастом not found');
  ok(code.includes('Уже вернули Z'), 'кастом already');
});

test('B07', 'refundNotFoundTarget → переход без answer на этой ветке', () => {
  const p = makeCleanProject([
    makeRefundNode('ref1', 'msg1', { refundNotFoundTarget: 'msg_nf' }),
    makeMessageNode('msg1'),
    {
      id: 'msg_nf',
      type: 'message',
      position: { x: 400, y: 100 },
      data: {
        messageText: 'Код не найден на холсте',
        buttons: [],
        keyboardType: 'none',
        formatMode: 'none',
        markdown: false,
      },
    },
  ]);
  const code = gen(p, 'b07');
  ok(code.includes('handle_callback_msg_nf'), 'переход на msg_nf');
  const nfIdx = code.indexOf('CHARGE_NOT_FOUND');
  ok(nfIdx >= 0, 'ветка CHARGE_NOT_FOUND');
  const slice = code.slice(nfIdx, nfIdx + 350);
  ok(slice.includes('handle_callback_msg_nf'), 'вызов после NOT_FOUND');
  ok(!slice.includes('callback_query.message.answer'), 'нет answer при target');
});

test('B08', 'без error target остаётся fallback answer', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b08');
  ok(code.includes('callback_query.message.answer'), 'fallback answer');
  ok(code.includes('Такой код покупки не найден'), 'дефолт not found');
});

console.log('── Блок C: Дубли и синтаксис ────────────────────────────────────');

test('C01', 'нет дубля callback-хендлера ref1', () => {
  const p = makeCleanProject([makeRefundNode('ref1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  const matches = code.match(/async def handle_callback_ref1\b/g) || [];
  ok(matches.length === 1, `ожидался 1 хендлер ref1, найдено ${matches.length}`);
});

test('C02', 'синтаксис с двумя возвратами OK', () => {
  const p = makeCleanProject([
    makeRefundNode('ref1', 'msg1'),
    makeRefundNode('ref2', 'msg1', {
      refundChargeId: 'other',
      ignoreErrors: true,
      refundUserSource: 'custom',
      refundUserId: '123',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

console.log('\n── Итог ─────────────────────────────────────────────────────────');
const failed = results.filter(r => !r.passed);
console.log(`Пройдено: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('Провалы:');
  for (const f of failed) console.log(`  - ${f.id}: ${f.note}`);
  process.exit(1);
}
console.log('Все тесты phase81 прошли.\n');
process.exit(0);
