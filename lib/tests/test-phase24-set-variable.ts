/**
 * @fileoverview Фаза 24 — Интеграционный тест узла set_variable
 * @module tests/test-phase24-set-variable
 *
 * Точка входа: запускает все блоки тестов и выводит итоговый отчёт.
 *
 * Блок A: Базовая генерация (A01–A08)
 * Блок B: Режим text — resolve_var (B01–B07)
 * Блок C: Режим expression — eval_expr (C01–C06)
 * Блок D: Автопереход (D01–D05)
 * Блок E: Несколько присваиваний (E01–E05)
 * Блок F: Граничные случаи (F01–F05)
 * Блок G: Интеграция (G01–G04)
 * Блок H: Производительность (H01–H02)
 */

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 24 — Узел set_variable                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─── Запуск блоков ────────────────────────────────────────────────────────────

/** Блоки A–C: базовая генерация, text, expression */
import './test-phase24-set-variable-a.ts';

/** Блоки D–F: автопереход, несколько присваиваний, граничные случаи */
import './test-phase24-set-variable-b.ts';

/** Блоки G–H: интеграция и производительность */
import './test-phase24-set-variable-c.ts';

// ─── Итоги ───────────────────────────────────────────────────────────────────

import { results } from './test-phase24-set-variable-helpers.ts';

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n${'─'.repeat(64)}`);
console.log(`Фаза 24 — Итого: ${passed} ✅  ${failed} ❌  из ${results.length}`);
if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`);
  });
  process.exit(1);
}
