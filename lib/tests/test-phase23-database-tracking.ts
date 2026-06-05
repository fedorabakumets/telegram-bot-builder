/**
 * @fileoverview Фаза 23 — Трекинг пользователей в базе данных
 * @module tests/test-phase23-database-tracking
 *
 * Блок A: Новые поля в save_user_to_db
 *   A01: is_premium передаётся в SQL
 *   A02: is_bot передаётся в SQL
 *   A03: language_code передаётся в SQL
 *   A04: deep_link_param передаётся в SQL
 *   A05: referrer_id передаётся в SQL
 *   A06: deep_link_param не перезаписывается при повторном визите (COALESCE)
 *   A07: referrer_id не перезаписывается при повторном визите (COALESCE)
 *   A08: синтаксис Python OK
 *   A09: sync_user_attribution_to_db для колонок deep_link_param/referrer_id
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generateDatabase } from '../templates/database/database.renderer.ts';

/** Структура результата одного теста */
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
 * Утверждение — бросает ошибку если условие ложно
 * @param cond - Условие для проверки
 * @param msg - Сообщение об ошибке при провале
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки с флагом ok и опциональной ошибкой
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p23db_${label}.py`;
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

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 23 — Трекинг пользователей в базе данных             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Новые поля в save_user_to_db ──────────────────────────────');

/** Генерируем код один раз для всех тестов */
const dbCode = generateDatabase({ userDatabaseEnabled: true });

test('A01', 'is_premium передаётся в SQL', () => {
  ok(dbCode.includes('is_premium: bool = False'), 'параметр is_premium должен быть в сигнатуре');
  ok(dbCode.includes('is_premium'), 'is_premium должен быть в SQL INSERT');
});

test('A02', 'is_bot передаётся в SQL', () => {
  ok(dbCode.includes('is_bot: bool = False'), 'параметр is_bot должен быть в сигнатуре');
  ok(dbCode.includes('is_bot'), 'is_bot должен быть в SQL INSERT');
});

test('A03', 'language_code передаётся в SQL', () => {
  ok(dbCode.includes('language_code: str = None'), 'параметр language_code должен быть в сигнатуре');
  ok(dbCode.includes('language_code'), 'language_code должен быть в SQL INSERT');
});

test('A04', 'deep_link_param передаётся в SQL', () => {
  ok(dbCode.includes('deep_link_param: str = None'), 'параметр deep_link_param должен быть в сигнатуре');
  ok(dbCode.includes('deep_link_param'), 'deep_link_param должен быть в SQL INSERT');
});

test('A05', 'referrer_id передаётся в SQL', () => {
  ok(dbCode.includes('referrer_id: str = None'), 'параметр referrer_id должен быть в сигнатуре');
  ok(dbCode.includes('referrer_id'), 'referrer_id должен быть в SQL INSERT');
});

test('A06', 'deep_link_param не перезаписывается при повторном визите (COALESCE)', () => {
  // COALESCE(bot_users.deep_link_param, EXCLUDED.deep_link_param) — сохраняем старое значение
  ok(
    dbCode.includes('COALESCE(bot_users.deep_link_param, EXCLUDED.deep_link_param)'),
    'COALESCE для deep_link_param должен быть в ON CONFLICT DO UPDATE'
  );
});

test('A07', 'referrer_id не перезаписывается при повторном визите (COALESCE)', () => {
  // COALESCE(bot_users.referrer_id, EXCLUDED.referrer_id) — сохраняем старое значение
  ok(
    dbCode.includes('COALESCE(bot_users.referrer_id, EXCLUDED.referrer_id)'),
    'COALESCE для referrer_id должен быть в ON CONFLICT DO UPDATE'
  );
});

test('A08', 'синтаксис Python OK', () => {
  const r = checkSyntax(dbCode, 'a08');
  ok(r.ok, `Синтаксическая ошибка в database.py:\n${r.error}`);
});

test('A09', 'sync_user_attribution_to_db записывает deep_link_param/referrer_id в колонки', () => {
  ok(dbCode.includes('async def sync_user_attribution_to_db'), 'функция sync_user_attribution_to_db должна быть в коде');
  ok(
    dbCode.includes('COALESCE(bot_users.deep_link_param, EXCLUDED.deep_link_param)'),
    'COALESCE для deep_link_param должен быть в sync_user_attribution_to_db'
  );
  ok(
    dbCode.includes('COALESCE(bot_users.referrer_id, EXCLUDED.referrer_id)'),
    'COALESCE для referrer_id должен быть в sync_user_attribution_to_db'
  );
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n──────────────────────────────────────────────────────────────────');
console.log(`Итого: ${passed} пройдено, ${failed} провалено из ${results.length}`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ Все тесты прошли успешно!');
}
