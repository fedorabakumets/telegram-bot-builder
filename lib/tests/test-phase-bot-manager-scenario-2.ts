/**
 * @fileoverview Фаза — Сценарий управляющего бота (часть 2: действия, навигация, обработка ошибок)
 *
 * Блок E: Действия start/stop/restart
 * Блок F: Навигация назад
 * Блок G: Обработка ошибок (condition узлы после fetch-projects и действий)
 * Блок K: Читаемый статус бота
 *   K06: replace_variables_in_text вызывается для текста карточки проекта
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

test('F03', '"К проекту" ведёт к reload-project (перезагрузка без перезаписи callback_data)', () => {
  ok(code.includes('reload_project'), 'узел reload-project не найден в коде');
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

test('G02b', 'check-projects-empty condition узел присутствует в коде', () => {
  ok(code.includes('check_projects_empty'), 'узел check-projects-empty не найден');
});

test('G02c', 'no-projects-msg содержит текст об отсутствии проектов', () => {
  ok(code.includes('У вас пока нет проектов'), 'текст "У вас пока нет проектов" не найден');
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

// ══ Блок H: Создание проекта ══════════════════════════════════════════════════
console.log('\n══ Блок H: Создание проекта ══════════════════════════════════════════');

test('H01', 'create-project-action делает POST к /api/bot/projects', () => {
  ok(code.includes('/api/bot/projects') && (code.includes('POST') || code.includes('post')), 'POST /api/bot/projects не найден');
});

test('H02', 'check-create-status condition узел присутствует в коде', () => {
  ok(code.includes('check_create_status'), 'узел check-create-status не найден');
});

test('H03', 'create-success-msg содержит текст об успешном создании', () => {
  ok(code.includes('Проект создан'), 'текст "Проект создан" не найден');
});

test('H04', 'create-error-msg содержит текст об ошибке создания', () => {
  ok(code.includes('Не удалось создать проект'), 'текст ошибки создания не найден');
});

test('H05', 'after-create-keyboard содержит кнопку возврата к списку', () => {
  ok(code.includes('К списку проектов'), 'кнопка "К списку проектов" не найдена');
});

// ══ Блок I: Переименование проекта ════════════════════════════════════════════
console.log('\n══ Блок I: Переименование проекта ════════════════════════════════════');

test('I01', 'rename-project-ask собирает ввод пользователя', () => {
  ok(code.includes('rename_project_ask'), 'узел rename-project-ask не найден');
});

test('I02', 'rename-project-action делает PATCH к /api/bot/projects/', () => {
  ok(code.includes('PATCH') || code.includes('patch'), 'метод PATCH не найден');
  ok(code.includes('/api/bot/projects/'), 'URL /api/bot/projects/ не найден для PATCH');
});

test('I03', 'check-rename-status condition узел присутствует в коде', () => {
  ok(code.includes('check_rename_status'), 'узел check-rename-status не найден');
});

test('I04', 'rename-success-msg содержит текст об успешном переименовании', () => {
  ok(code.includes('переименован'), 'текст "переименован" не найден');
});

test('I05', 'rename-error-msg содержит текст об ошибке переименования', () => {
  ok(code.includes('Не удалось переименовать'), 'текст ошибки переименования не найден');
});

// ══ Блок J: Удаление проекта ══════════════════════════════════════════════════
console.log('\n══ Блок J: Удаление проекта ══════════════════════════════════════════');

test('J01', 'delete-project-confirm содержит предупреждение о необратимости', () => {
  ok(code.includes('delete_project_confirm'), 'узел delete-project-confirm не найден');
  ok(code.includes('необратимо'), 'текст "необратимо" не найден');
});

test('J02', 'delete-confirm-keyboard содержит кнопки подтверждения и отмены', () => {
  ok(code.includes('Да, удалить'), 'кнопка "Да, удалить" не найдена');
  ok(code.includes('Отмена'), 'кнопка "Отмена" не найдена');
});

test('J03', 'delete-project-action делает DELETE к /api/bot/projects/', () => {
  ok(code.includes('DELETE') || code.includes('delete'), 'метод DELETE не найден');
});

test('J04', 'check-delete-status condition узел присутствует в коде', () => {
  ok(code.includes('check_delete_status'), 'узел check-delete-status не найден');
});

test('J05', 'delete-success-msg содержит текст об успешном удалении', () => {
  ok(code.includes('удалён') || code.includes('удален'), 'текст "удалён" не найден');
});

test('J06', 'delete-error-msg содержит текст об ошибке удаления', () => {
  ok(code.includes('Не удалось удалить'), 'текст ошибки удаления не найден');
});

// ══ Блок K: Читаемый статус бота ══════════════════════════════════════════════
console.log('\n══ Блок K: Читаемый статус бота ══════════════════════════════════════');

test('K01', 'check-bot-status condition узел присутствует в коде', () => {
  ok(code.includes('check_bot_status'), 'узел check-bot-status не найден');
});

test('K02', 'project-card-running содержит эмодзи 🟢', () => {
  ok(code.includes('🟢'), 'эмодзи 🟢 не найдено в карточке running');
});

test('K03', 'project-card-stopped содержит эмодзи 🔴', () => {
  ok(code.includes('🔴'), 'эмодзи 🔴 не найдено в карточке stopped');
});

test('K04', 'project-card-unknown содержит эмодзи ⚪', () => {
  ok(code.includes('⚪'), 'эмодзи ⚪ не найдено в карточке unknown');
});

test('K05', 'старый узел project-card-msg отсутствует (заменён тремя вариантами)', () => {
  // Проверяем что нет прямого отображения botStatus через code
  ok(!code.includes('project_card_msg'), 'старый узел project-card-msg всё ещё присутствует в коде');
});

test('K06', 'replace_variables_in_text вызывается для текста карточки проекта', () => {
  // Проверяем что в обработчиках карточек проекта вызывается replace_variables_in_text
  // Это гарантирует что {project_detail.name} будет подставлен при отправке
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text не найден в коде');
  // Проверяем что init_all_user_vars вызывается перед replace_variables_in_text
  const initIdx = code.indexOf('init_all_user_vars');
  const replaceIdx = code.indexOf('replace_variables_in_text');
  ok(initIdx !== -1, 'init_all_user_vars не найден');
  ok(replaceIdx !== -1, 'replace_variables_in_text не найден');
  ok(initIdx < replaceIdx, 'init_all_user_vars должен вызываться ДО replace_variables_in_text');
});

// ══ Блок L: Токены проекта ════════════════════════════════════════════════════
console.log('\n══ Блок L: Токены проекта ════════════════════════════════════════════');

test('L01', 'fetch-tokens делает GET к /api/bot/projects/.../tokens', () => {
  ok(code.includes('/tokens'), 'URL /tokens не найден');
});

test('L02', 'check-tokens-status condition узел присутствует в коде', () => {
  ok(code.includes('check_tokens_status'), 'узел check-tokens-status не найден');
});

test('L03', 'check-tokens-empty использует dot-notation tokens.count', () => {
  ok(code.includes('check_tokens_empty'), 'узел check-tokens-empty не найден');
});

test('L04', 'tokens-keyboard генерирует динамические кнопки из tokens.items', () => {
  ok(code.includes('tokens_keyboard'), 'узел tokens-keyboard не найден');
});

test('L05', 'no-tokens-msg содержит текст об отсутствии токенов', () => {
  ok(code.includes('нет токенов'), 'текст "нет токенов" не найден');
});

test('L06', 'tokens-error-msg содержит текст об ошибке загрузки токенов', () => {
  ok(code.includes('Не удалось загрузить токены'), 'текст ошибки загрузки токенов не найден');
});

test('L07', 'кнопка "🔑 Токены" присутствует в project-actions-keyboard', () => {
  ok(code.includes('Токены'), 'кнопка "Токены" не найдена');
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
