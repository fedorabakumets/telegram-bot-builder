/**
 * @fileoverview Фазовые тесты триггера successful_payment_trigger (phase82)
 *
 * Блок A: только триггер — successful_payment без pre_checkout
 * Блок B: фильтры exact / starts_with / all
 * Блок C: счёт + триггер — известный payload → счёт; чужой → триггер
 * Блок D: без узлов оплаты — нет хендлера
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Собирает минимальный project.json
 * @param nodes - Узлы
 * @returns Проект
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
 * Генерирует Python-код
 * @param project - Проект
 * @param label - Метка
 * @returns Код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase82_${label}`,
    userDatabaseEnabled: false,
  });
}

/**
 * Проверяет синтаксис Python
 * @param code - Код
 * @param label - Метка файла
 * @returns Результат
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p82_${label}.py`;
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
 * Запускает тест
 * @param id - ID
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
 * Утверждение
 * @param cond - Условие
 * @param msg - Сообщение
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Синтаксис Python
 * @param code - Код
 * @param label - Метка
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

/**
 * Узел message
 * @param id - ID
 * @param text - Текст
 * @returns Узел
 */
function makeMessage(id: string, text = 'ok') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

/**
 * Узел successful_payment_trigger
 * @param id - ID
 * @param targetId - Цель
 * @param extra - Поля data
 * @returns Узел
 */
function makeTrigger(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'successful_payment_trigger',
    position: { x: 0, y: 0 },
    data: {
      payloadFilter: 'all',
      payloadValue: '',
      savePaymentAmountTo: 'payment_amount',
      savePaymentChargeIdTo: 'payment_charge_id',
      autoTransitionTo: targetId,
      enableAutoTransition: true,
      ...extra,
    },
  };
}

/**
 * Узел send_invoice
 * @param id - ID
 * @param targetId - Цель после оплаты
 * @param extra - Поля data
 * @returns Узел
 */
function makeInvoice(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'send_invoice',
    position: { x: 0, y: 100 },
    data: {
      invoiceTitle: 'Товар',
      invoiceDescription: 'Описание',
      invoiceAmount: '5',
      invoicePhotoUrl: '',
      invoicePayload: '',
      savePaymentAmountTo: 'inv_amount',
      savePaymentChargeIdTo: 'inv_charge',
      autoTransitionTo: targetId,
      enableAutoTransition: true,
      keyboardType: 'none',
      buttons: [],
      ...extra,
    },
  };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест phase82 — successful_payment_trigger                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: только триггер ───────────────────────────────────────');

test('A01', 'successful_payment без pre_checkout и LabeledPrice', () => {
  const p = makeCleanProject([makeTrigger('spt1', 'msg1'), makeMessage('msg1', 'внешняя оплата')]);
  const code = gen(p, 'a01');
  ok(code.includes('F.successful_payment') || code.includes('successful_payment'), 'хендлер successful_payment');
  ok(code.includes('on_successful_payment_stars'), 'имя хендлера');
  ok(!code.includes('on_pre_checkout_query_stars'), 'нет pre_checkout без счёта');
  ok(!code.includes('LabeledPrice'), 'нет LabeledPrice без счёта');
  ok(code.includes('handle_callback_msg1'), 'переход на msg1');
  ok(code.includes('payment_amount'), 'сохранение суммы');
  ok(code.includes('payment_charge_id'), 'сохранение кода');
});

test('A02', 'синтаксис Python OK (только триггер)', () => {
  const p = makeCleanProject([makeTrigger('spt1', 'msg1'), makeMessage('msg1')]);
  syntax(gen(p, 'a02'), 'a02');
});

test('A03', 'есть _stars_payment_targets и ветка триггера', () => {
  const p = makeCleanProject([makeTrigger('spt1', 'msg1'), makeMessage('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('_stars_payment_targets'), 'пустая карта счёта');
  ok(code.includes('successful_payment_trigger') || code.includes('_spt'), 'ветка триггера');
});

console.log('── Блок B: фильтры метки ────────────────────────────────────────');

test('B01', 'exact — сравнение payload == value', () => {
  const p = makeCleanProject([
    makeTrigger('spt_ex', 'msg_ex', { payloadFilter: 'exact', payloadValue: 'donate_1' }),
    makeMessage('msg_ex', 'exact'),
  ]);
  const code = gen(p, 'b01');
  ok(code.includes('donate_1'), 'значение метки');
  ok(code.includes('payload ==') || code.includes("payload =="), 'точное сравнение');
  ok(code.includes('handle_callback_msg_ex'), 'цель exact');
});

test('B02', 'starts_with — startswith', () => {
  const p = makeCleanProject([
    makeTrigger('spt_sw', 'msg_sw', { payloadFilter: 'starts_with', payloadValue: 'donate_' }),
    makeMessage('msg_sw', 'prefix'),
  ]);
  const code = gen(p, 'b02');
  ok(code.includes('startswith'), 'startswith');
  ok(code.includes('donate_'), 'префикс');
  ok(code.includes('handle_callback_msg_sw'), 'цель prefix');
});

test('B03', 'порядок: exact раньше starts_with раньше all', () => {
  const p = makeCleanProject([
    makeTrigger('spt_all', 'msg_all', { payloadFilter: 'all' }),
    makeTrigger('spt_sw', 'msg_sw', { payloadFilter: 'starts_with', payloadValue: 'x_' }),
    makeTrigger('spt_ex', 'msg_ex', { payloadFilter: 'exact', payloadValue: 'x_1' }),
    makeMessage('msg_all'),
    makeMessage('msg_sw'),
    makeMessage('msg_ex'),
  ]);
  const code = gen(p, 'b03');
  const blockStart = code.indexOf('_spt = None');
  ok(blockStart >= 0, 'блок _spt найден');
  const block = code.slice(blockStart, blockStart + 2500);
  const iEx = block.indexOf('"x_1"') >= 0 ? block.indexOf('"x_1"') : block.indexOf("'x_1'");
  const iSw = block.indexOf('startswith');
  const iAll = block.indexOf('"spt_all"') >= 0 ? block.indexOf('"spt_all"') : block.indexOf("'spt_all'");
  ok(iEx >= 0 && iSw >= 0 && iAll >= 0, 'все три фильтра в блоке _spt');
  ok(iEx < iSw && iSw < iAll, `порядок exact(${iEx}) < starts_with(${iSw}) < all(${iAll})`);
});

console.log('── Блок C: счёт + триггер ───────────────────────────────────────');

test('C01', 'известный payload счёта → handle_callback счёта, не только триггер', () => {
  const p = makeCleanProject([
    makeInvoice('inv1', 'msg_inv'),
    makeTrigger('spt1', 'msg_trg', { payloadFilter: 'all' }),
    makeMessage('msg_inv', 'счёт'),
    makeMessage('msg_trg', 'триггер'),
  ]);
  const code = gen(p, 'c01');
  ok(code.includes('on_pre_checkout_query_stars'), 'есть pre_checkout со счётом');
  ok(code.includes('handle_callback_msg_inv'), 'цель счёта');
  ok(code.includes('handle_callback_msg_trg'), 'цель триггера');
  ok((code.match(/@dp\.message\(F\.successful_payment\)/g) || []).length === 1, 'ровно один successful_payment');
});

test('C02', 'синтаксис Python OK (счёт + триггер)', () => {
  const p = makeCleanProject([
    makeInvoice('inv1', 'msg_inv'),
    makeTrigger('spt1', 'msg_trg'),
    makeMessage('msg_inv'),
    makeMessage('msg_trg'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'чужой payload уходит в ветку _spt (триггер)', () => {
  const p = makeCleanProject([
    makeInvoice('inv1', 'msg_inv'),
    makeTrigger('spt1', 'msg_trg', { payloadFilter: 'exact', payloadValue: 'external_pay' }),
    makeMessage('msg_inv'),
    makeMessage('msg_trg'),
  ]);
  const code = gen(p, 'c03');
  ok(code.includes('_route = _stars_payment_targets.get'), 'сначала карта счёта');
  ok(code.includes('external_pay'), 'фильтр триггера');
  ok(code.includes('_spt'), 'переменная ветки триггера');
});

console.log('── Блок D: без узлов оплаты ─────────────────────────────────────');

test('D01', 'без invoice и trigger — нет successful_payment хендлера', () => {
  const p = makeCleanProject([makeMessage('msg1')]);
  const code = gen(p, 'd01');
  ok(!code.includes('on_successful_payment_stars'), 'нет хендлера оплаты');
  ok(!code.includes('_stars_payment_targets'), 'нет карты');
  ok(!code.includes('on_pre_checkout_query_stars'), 'нет pre_checkout');
});

test('D01b', 'синтаксис без оплаты OK', () => {
  syntax(gen(makeCleanProject([makeMessage('msg1')]), 'd01b'), 'd01b');
});

console.log('\n── Итог ─────────────────────────────────────────────────────────');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed);
console.log(`Пройдено: ${passed}/${results.length}`);
if (failed.length) {
  failed.forEach(f => console.log(`  FAIL ${f.id}: ${f.note}`));
  process.exit(1);
}
console.log('phase82 OK\n');
