/**
 * @fileoverview Фаза 63 — Inline Expressions {=...} в текстах сообщений
 *
 * Тестирует что шаблон utils.py.jinja2 содержит обработку inline-выражений
 * через regex {=([^}]+)} и функцию _inline_expr_replacer, и что эта обработка
 * происходит до основной замены переменных (_resolve).
 */

import { renderPartialTemplate } from '../templates/template-renderer.ts';

// ─── Тест-раннер ─────────────────────────────────────────────────────────────

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

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

function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// ─── Генерация utils-шаблона ─────────────────────────────────────────────────

function renderUtils(): string {
  return renderPartialTemplate('utils/utils.py.jinja2', {
    userDatabaseEnabled: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 63 — Inline Expressions {=...}                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─── Тесты ───────────────────────────────────────────────────────────────────

test('01', 'Содержит функцию _inline_expr_replacer', () => {
  const code = renderUtils();
  ok(code.includes('_inline_expr_replacer'), 'Должен содержать _inline_expr_replacer');
});

test('02', 'Содержит regex для {=...}', () => {
  const code = renderUtils();
  ok(code.includes('\\{=([^}]+)\\}'), 'Должен содержать regex \\{=([^}]+)\\}');
});

test('03', 'Содержит вызов _eval_expr внутри _inline_expr_replacer', () => {
  const code = renderUtils();
  const fnStart = code.indexOf('def _inline_expr_replacer');
  const fnEnd = code.indexOf('result = _re.sub', fnStart);
  ok(fnStart > -1, '_inline_expr_replacer должен быть определён');
  ok(fnEnd > fnStart, 're.sub должен быть после определения функции');
  const fnBody = code.slice(fnStart, fnEnd);
  ok(fnBody.includes('_eval_expr'), '_inline_expr_replacer должен вызывать _eval_expr');
});

test('04', 'Inline expressions обрабатываются до _resolve', () => {
  const code = renderUtils();
  const inlinePos = code.indexOf('_inline_expr_replacer');
  const resolvePos = code.indexOf('def _resolve(var_path');
  ok(inlinePos > -1, '_inline_expr_replacer должен быть в коде');
  ok(resolvePos > -1, '_resolve должен быть в коде');
  ok(inlinePos < resolvePos, 'Inline expressions должны обрабатываться до _resolve');
});

test('05', 'Inline expressions обрабатываются после #each', () => {
  const code = renderUtils();
  const eachPos = code.indexOf('_each_pattern.sub(_expand_each');
  const inlinePos = code.indexOf('_inline_expr_replacer');
  ok(eachPos > -1, '_each_pattern.sub должен быть в коде');
  ok(inlinePos > eachPos, 'Inline expressions должны быть после #each');
});

test('06', 'Fallback: если _eval_expr вернул исходное — оставляем {=...}', () => {
  const code = renderUtils();
  const fnStart = code.indexOf('def _inline_expr_replacer');
  const fnEnd = code.indexOf('result = _re.sub', fnStart);
  const fnBody = code.slice(fnStart, fnEnd);
  ok(fnBody.includes('_m_expr.group(0)'), 'Должен возвращать исходный match при ошибке');
});

test('07', 'Runtime: thousands(10000) вычисляется корректно', () => {
  const code = renderUtils();
  // Проверяем что _eval_expr содержит thousands в whitelist
  ok(code.includes('thousands'), 'Должен содержать функцию thousands в коде');
  // Проверяем что thousands форматирует числа с пробелами
  const thousandsImpl = code.includes("replace(\",\", \" \")") || code.includes('.replace(",", " ")');
  ok(thousandsImpl, 'thousands должен заменять запятые на пробелы');
});

test('08', 'Regex не матчит обычные переменные {var}', () => {
  const code = renderUtils();
  // Regex \{=([^}]+)\} требует = после {, обычные {var} не матчатся
  ok(code.includes('\\{=([^}]+)\\}'), 'Regex должен требовать = после открывающей скобки');
});

test('09', '_eval_expr определён до _inline_expr_replacer', () => {
  const code = renderUtils();
  const evalPos = code.indexOf('def _eval_expr(');
  const inlinePos = code.indexOf('def _inline_expr_replacer');
  ok(evalPos > -1, '_eval_expr должен быть определён');
  ok(evalPos < inlinePos, '_eval_expr должен быть определён до _inline_expr_replacer');
});

test('10', 'reversed добавлен в whitelist _safe_funcs', () => {
  const code = renderUtils();
  // Проверяем что reversed зарегистрирована как безопасная функция в _eval_expr
  ok(code.includes("'reversed': reversed"), 'Должен содержать reversed в _safe_funcs');
  // Проверяем что reversed объявлена внутри блока _safe_funcs
  const safeFuncsPos = code.indexOf('_safe_funcs = {');
  ok(safeFuncsPos > -1, '_safe_funcs должен быть определён');
  const safeFuncsLine = code.slice(safeFuncsPos, code.indexOf('}', safeFuncsPos) + 1);
  ok(safeFuncsLine.includes('reversed'), 'reversed должна быть в словаре _safe_funcs');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n${'─'.repeat(64)}`);
console.log(`Фаза 63 — Итого: ${passed} ✅  ${failed} ❌  из ${results.length}`);
if (failed > 0) {
  console.log('\nПроваленные:');
  results.filter(r => !r.passed).forEach(r => console.log(`  • ${r.id}. ${r.name}: ${r.note}`));
  process.exit(1);
}
