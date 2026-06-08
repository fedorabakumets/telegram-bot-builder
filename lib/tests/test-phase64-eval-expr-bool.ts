/**
 * @fileoverview Фаза 64 — логические операторы and/or/not в _eval_expr
 */

import { renderPartialTemplate } from '../templates/template-renderer.ts';

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/** @param id - Идентификатор теста @param name - Название @param fn - Проверка */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: unknown) {
    const note = e instanceof Error ? e.message : String(e);
    results.push({ id, name, passed: false, note });
    console.log(`  ❌ ${id}. ${name}\n     → ${note}`);
  }
}

/** @param cond - Условие @param msg - Сообщение об ошибке */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function renderUtils(): string {
  return renderPartialTemplate('utils/utils.py.jinja2', { userDatabaseEnabled: false });
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 64 — _eval_expr: and / or / not                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

test('01', '_eval_expr whitelist содержит BoolOp', () => {
  const code = renderUtils();
  const start = code.indexOf('def _eval_expr(');
  const end = code.indexOf('def replace_variables_in_text', start);
  const body = code.slice(start, end);
  ok(body.includes('_ast_expr.BoolOp'), 'Должен разрешать BoolOp');
});

test('02', '_eval_expr whitelist содержит And и Or', () => {
  const code = renderUtils();
  const start = code.indexOf('def _eval_expr(');
  const end = code.indexOf('def replace_variables_in_text', start);
  const body = code.slice(start, end);
  ok(body.includes('_ast_expr.And'), 'Должен разрешать And');
  ok(body.includes('_ast_expr.Or'), 'Должен разрешать Or');
});

test('03', 'Документация _eval_expr упоминает and/or/not', () => {
  const code = renderUtils();
  const start = code.indexOf('def _eval_expr(');
  const end = code.indexOf('import re as _re_expr', start);
  const doc = code.slice(start, end);
  ok(doc.includes('and, or, not'), 'Docstring должен описывать логические операторы');
});

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
console.log(`\n${'─'.repeat(64)}`);
console.log(`Фаза 64 — Итого: ${passed} ✅  ${failed} ❌  из ${results.length}`);
if (failed > 0) {
  process.exit(1);
}
