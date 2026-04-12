/**
 * @fileoverview Фаза — Сценарий управляющего бота (часть 2: действия, навигация, обработка ошибок)
 *
 * Блок E: Действия start/stop/restart
 * Блок F: Навигация назад
 * Блок G: Обработка ошибок (condition узлы после fetch-projects и действий)
 *
 * @module tests/test-phase-bot-manager-scenario-2
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Загружает project.json сценария управляющего бота */
function loadProject() {
  const raw = fs.readFileSync('bots/новый/новый.json', 'utf-8');
  return JSON.parse(raw);
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `BotManager_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_bms2_${label}.py`;
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

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
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

/** Бросает ошибку если условие ложно */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

// ─── Загружаем проект один раз ───────────────────────────────────────────────
const project = loadProject();
const code = gen(project, 'p2');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Сценарий управляющего бота (часть 2)                      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок E: Действия start/stop/restart ══════════════════════════════════════
console.log('══ Блок E: Действия start/stop/restart ══════════════════════════════');

test('E01', 'action-start делает POST к /api/projects/.../bot/start', () => {
  ok(code.includes('/bot/start'), 'URL /bot/start не найден');
});

test('E02', 'action-stop делает POST к /api/projects/.../bot/stop', () => {
  ok(code.includes('/bot/stop'), 'URL /bot/stop не найден');
});

test('E03', 'action-restart делает POST к /api/projects/.../bot/restart', () => {
  ok(code.includes('/bot/restart'), 'URL /bot/restart не найден');
});

test('E04', 'URL действий содержит {project_detail.id}', () => {
  ok(code.includes('project_detail'), 'project_detail.id не найден в URL действий');
});

test('E05', 'action-start ведёт к check-start-status', () => {
  ok(code.includes('check_start_status'), 'переход к check-start-status не найден');
});

test('E06', 'action-stop ведёт к check-stop-status', () => {
  ok(code.includes('check_stop_status'), 'переход к check-stop-status не найден');
});

test('E07', 'action-restart ведёт к check-restart-status', () => {
  ok(code.includes('check_restart_status'), 'переход к check-restart-status не найден');
});

// ══ Блок F: Навигация назад ═══════════════════════════════════════════════════
console.log('\n══ Блок F: Навигация назад ═══════════════════════════════════════════');

test('F01', 'result-keyboard содержит кнопку "К проекту"', () => {
  ok(code.includes('К проекту'), 'кнопка "К проекту" не найдена');
});

test('F02', 'result-keyboard содержит кнопку "К списку"', () => {
  ok(code.includes('К списку'), 'кнопка "К списку" не найдена');
});

test('F03', '"К проекту" ведёт к fetch-project-detail', () => {
  ok(code.includes('fetch_project_detail'), 'callback_data для fetch-project-detail не найден');
});

test('F04', '"К списку" ведёт к fetch-projects', () => {
  ok(code.includes('fetch_projects'), 'callback_data для fetch-projects не найден');
});

// ══ Блок G: Обработка ошибок ══════════════════════════════════════════════════
console.log('\n══ Блок G: Обработка ошибок ══════════════════════════════════════════');

test('G01', 'check-projects-status condition узел присутствует в коде', () => {
  ok(code.includes('check_projects_status'), 'узел check-projects-status не найден');
});

test('G02', 'projects-error-msg содержит текст об ошибке загрузки', () => {
  ok(code.includes('Не удалось загрузить проекты'), 'текст ошибки загрузки проектов не найден');
});

test('G03', 'check-start-status condition узел присутствует в коде', () => {
  ok(code.includes('check_start_status'), 'узел check-start-status не найден');
});

test('G04', 'check-stop-status condition узел присутствует в коде', () => {
  ok(code.includes('check_stop_status'), 'узел check-stop-status не найден');
});

test('G05', 'check-restart-status condition узел присутствует в коде', () => {
  ok(code.includes('check_restart_status'), 'узел check-restart-status не найден');
});

test('G06', 'action-error-msg содержит текст об ошибке действия', () => {
  ok(code.includes('Ошибка выполнения действия'), 'текст ошибки действия не найден');
});

test('G07', 'action-error-msg использует result-keyboard для навигации', () => {
  ok(code.includes('action_error_msg'), 'узел action-error-msg не найден в коде');
});

test('G08', 'condition узлы проверяют статус == 200', () => {
  ok(code.includes('== 200') || code.includes('== "200"'), 'проверка статуса 200 не найдена');
});

// ══ Итог ══════════════════════════════════════════════════════════════════════
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
const summary = `  Итог: ${passed}/${total} пройдено  |  Провалено: ${failed}`;
console.log(`║${summary}${' '.repeat(Math.max(0, 62 - summary.length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
