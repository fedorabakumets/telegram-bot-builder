/**
 * @fileoverview Фазовый тест для узла answer_callback_query
 *
 * Блок A: Базовая генерация (6 тестов)
 * Блок B: Сценарии (4 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные утилиты ─────────────────────────────────────────────────

/**
 * Создаёт минимальный проект с заданными узлами
 * @param nodes - Массив узлов
 * @returns Объект проекта
 */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1', name: 'Test', nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код для проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `PhaseACQ_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_acq_${label}.py`;
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

/** Тип результата теста */
type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Функция теста
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
 * Проверяет условие, бросает ошибку если не выполнено
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/**
 * Проверяет синтаксис Python, бросает ошибку при неверном синтаксисе
 * @param code - Python-код
 * @param label - Метка
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Вспомогательные функции для создания узлов ──────────────────────────────

/**
 * Создаёт узел answer_callback_query
 * @param id - ID узла
 * @param targetId - ID следующего узла
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа answer_callback_query
 */
function makeAnswerCallbackQueryNode(id: string, targetId: string, extra: Record<string, any> = {}) {
  return {
    id, type: 'answer_callback_query',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, callbackNotificationText: '', callbackShowAlert: false, callbackCacheTime: 0, buttons: [], keyboardType: 'none', ...extra },
  };
}

/**
 * Создаёт message-узел
 * @param id - ID узла
 * @param text - Текст сообщения
 * @returns Объект узла типа message
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id, type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт узел callback_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа callback_trigger
 */
function makeCallbackTriggerNode(id: string, targetId: string) {
  return {
    id, type: 'callback_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, callbackData: id, matchType: 'exact', adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел ban_user
 * @param id - ID узла
 * @returns Объект узла типа ban_user
 */
function makeBanUserNode(id: string) {
  return {
    id, type: 'ban_user',
    position: { x: 0, y: 0 },
    data: { userIdSource: 'last_message', targetGroupId: '-100123', buttons: [], keyboardType: 'none' },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел answer_callback_query                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'генерирует @dp.callback_query декоратор', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.callback_query('), '@dp.callback_query должен быть в коде');
});

test('A02', 'имя функции содержит nodeId (handle_callback_acq_1)', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('handle_callback_acq_1'), 'handle_callback_acq_1 должен быть в коде');
});

test('A03', 'вызывает callback_query.answer() с текстом', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Принято!' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a03');
  ok(code.includes('callback_query.answer('), 'callback_query.answer() должен быть в коде');
  ok(code.includes('Принято!'), 'текст уведомления должен быть в коде');
});

test('A04', 'show_alert=True когда callbackShowAlert: true', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Внимание!', callbackShowAlert: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a04');
  ok(code.includes('show_alert=True'), 'show_alert=True должен быть в коде');
});

test('A05', 'вызывает handle_callback_{targetId} для перехода', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'a05');
  ok(code.includes('await handle_callback_msg_target('), 'вызов handle_callback_msg_target должен быть в коде');
});

test('A06', 'синтаксис Python OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'OK', callbackShowAlert: false, callbackCacheTime: 10 }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'a06'), 'a06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Сценарии ──────────────────────────────────────────────');

test('B01', 'пустой текст → await callback_query.answer() без аргументов', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('await callback_query.answer()'), 'await callback_query.answer() без аргументов должен быть в коде');
});

test('B02', 'callback_trigger → answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_trigger', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Готово' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b02'), 'b02');
});

test('B03', 'answer_callback_query с переменной {user_name} в тексте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Привет, {user_name}!' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'answer_callback_query + ban_user в одном сценарии → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_trigger', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'ban1', { callbackNotificationText: 'Заблокирован' }),
    makeBanUserNode('ban1'),
  ]);
  syntax(gen(p, 'b04'), 'b04');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║   Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ''}${' '.repeat(Math.max(0, 40 - String(passed).length - String(total).length - (failed > 0 ? String(failed).length + 10 : 0)))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('✅ Все тесты пройдены!\n');
  process.exit(0);
}
