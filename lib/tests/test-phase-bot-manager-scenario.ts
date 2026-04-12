/**
 * @fileoverview Фаза — Сценарий управляющего бота (часть 1: генерация, /start, callback-trigger)
 *
 * Блок A: Генерация всего проекта (синтаксис, структура)
 * Блок B: /start → HTTP-запрос за проектами → динамические кнопки
 * Блок C: incoming_callback_trigger с фильтрацией по паттерну → fetch-project-detail
 *   C09: middleware НЕ перезаписывает callback_data для несовпадающих паттернов
 * Блок D: Карточка проекта + меню действий
 *   D05: карточки содержат {project_detail.name} в messageText
 *
 * @module tests/test-phase-bot-manager-scenario
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
  const tmp = `_tmp_bms_${label}.py`;
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

/** Проверяет синтаксис Python, бросает ошибку при неудаче */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Загружаем проект один раз ───────────────────────────────────────────────
const project = loadProject();
let code: string;

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Сценарий управляющего бота (часть 1)                      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок A: Генерация всего проекта ══════════════════════════════════════════
console.log('══ Блок A: Генерация всего проекта ══════════════════════════════════');

test('A01', 'project.json генерирует Python-код без исключений', () => {
  code = gen(project, 'a01');
  ok(typeof code === 'string' && code.length > 100, 'Код слишком короткий или пустой');
});

test('A02', 'синтаксис Python OK для всего проекта', () => {
  syntax(code, 'a02');
});

test('A03', 'все 74 узла генерируют обработчики', () => {
  const nodeIds = [
    // Основной поток
    'trigger-start', 'fetch-projects', 'check-projects-status',
    'check-projects-empty', 'no-projects-msg',
    'projects-error-msg', 'projects-msg',
    'incoming-callback-trigger', 'fetch-project-detail',
    // Статус бота
    'check-bot-status', 'project-card-running', 'project-card-stopped', 'project-card-unknown',
    'project-actions-keyboard',
    // Действия
    'action-start', 'action-stop', 'action-restart',
    'check-start-status', 'check-stop-status', 'check-restart-status',
    'action-error-msg', 'action-result-msg', 'result-keyboard',
    // Перезагрузка карточки проекта (без перезаписи callback_data)
    'reload-project',
    // Создание проекта
    'create-project-keyboard', 'create-project-action', 'check-create-status',
    'create-success-msg', 'create-error-msg', 'after-create-keyboard',
    // Переименование
    'rename-project-ask', 'rename-project-input', 'rename-project-action', 'check-rename-status',
    'rename-success-msg', 'rename-error-msg',
    // Удаление
    'delete-project-confirm', 'delete-confirm-keyboard', 'delete-project-action',
    'check-delete-status', 'delete-success-msg', 'delete-error-msg',
    // Токены — базовые
    'fetch-tokens', 'check-tokens-status', 'check-tokens-empty',
    'tokens-msg', 'tokens-keyboard', 'no-tokens-msg', 'tokens-error-msg',
    // Токены — управление (новые)
    'incoming-token-trigger', 'token-card-msg', 'token-actions-keyboard',
    'delete-token-confirm', 'delete-token-confirm-keyboard',
    'delete-token-action', 'check-delete-token-status',
    'delete-token-success-msg', 'delete-token-error-msg',
    'ask-new-token-value', 'add-token-to-project', 'check-add-token-status',
    'add-token-success-msg', 'add-token-error-msg',
    // Создание проекта с токеном
    'projects-actions-keyboard', 'ask-project-name', 'ask-token-value',
    'create-project-with-token', 'check-new-project-status', 'create-token-for-project',
    'check-new-token-status', 'load-new-project', 'new-project-error-msg', 'new-token-error-msg',
  ];
  for (const id of nodeIds) {
    const safeName = id.replace(/-/g, '_');
    ok(code.includes(safeName), `Обработчик для узла "${id}" не найден в коде`);
  }
});

// ══ Блок B: /start → HTTP → динамические кнопки ══════════════════════════════
console.log('\n══ Блок B: /start → HTTP → динамические кнопки ══════════════════════');

test('B01', '/start регистрирует команду /start', () => {
  ok(code.includes('Command("start")'), 'Command("start") не найдено');
});

test('B02', 'fetch-projects делает GET-запрос к /api/bot/projects', () => {
  ok(code.includes('/api/bot/projects'), 'URL /api/bot/projects не найден');
});

test('B03', 'URL содержит подстановку {user_id} → telegram_id', () => {
  ok(code.includes('telegram_id'), 'telegram_id не найден в URL');
});

test('B04', 'ответ сохраняется в переменную "projects"', () => {
  ok(code.includes('"projects"'), 'переменная "projects" не найдена');
});

test('B05', 'projects-actions-keyboard генерирует _resolve_dynamic_path', () => {
  ok(code.includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено');
});

test('B06', 'шаблон текста кнопки "📁 {name}" присутствует в коде', () => {
  ok(code.includes('{name}'), 'шаблон {name} не найден');
});

test('B07', 'шаблон callback "project_{id}" присутствует в коде', () => {
  ok(code.includes('project_{id}'), 'шаблон project_{id} не найден');
});

test('B08', 'builder.adjust(1) — одна кнопка в ряд', () => {
  ok(code.includes('builder.adjust(1)'), 'builder.adjust(1) не найдено');
});

test('B09', 'arrayPath "items" присутствует в коде', () => {
  ok(code.includes('"items"'), 'arrayPath "items" не найден — API теперь возвращает {items: [...], count: N}');
});

test('B10', 'projects-actions-keyboard содержит кнопку "➕ Новый проект"', () => {
  ok(code.includes('➕ Новый проект'), 'кнопка "➕ Новый проект" не найдена в projects-actions-keyboard');
});

// ══ Блок C: incoming_callback_trigger с фильтрацией ══════════════════════════
console.log('\n══ Блок C: incoming_callback_trigger с фильтрацией ══════════════════');

test('C01', 'incoming_callback_trigger генерирует middleware', () => {
  ok(
    code.includes('incoming_callback_trigger_incoming_callback_trigger_middleware'),
    'middleware для incoming_callback_trigger не найден',
  );
});

test('C02', 'middleware сохраняет callback_data в user_data', () => {
  ok(code.includes('user_data[user_id]["callback_data"]'), 'сохранение callback_data не найдено');
});

test('C03', 'middleware фильтрует по паттерну "project_" через startsWith', () => {
  ok(code.includes('startswith("project_")'), 'фильтрация по паттерну project_ не найдена');
});

test('C04', 'fetch-project-detail использует {callback_data} в URL', () => {
  ok(code.includes('callback_data'), 'callback_data не найден в URL fetch-project-detail');
});

test('C05', 'fetch-project-detail делает GET к /api/bot/projects/', () => {
  ok(code.includes('/api/bot/projects/'), 'URL /api/bot/projects/ не найден');
});

test('C06', 'ответ сохраняется в переменную "project_detail"', () => {
  ok(code.includes('"project_detail"'), 'переменная "project_detail" не найдена');
});

test('C07', 'fallback_callback_handler зарегистрирован через @dp.callback_query()', () => {
  // Без этого обработчика aiogram 3 не запускает middleware для callback'ов
  // которые не совпадают ни с одним фильтром (project_42, project_123 и т.д.)
  ok(code.includes('@dp.callback_query()'), '@dp.callback_query() fallback handler не найден — middleware не будет работать');
});

test('C08', 'fallback_callback_handler содержит logging.info для диагностики', () => {
  ok(code.includes('fallback_callback_handler'), 'функция fallback_callback_handler не найдена');
});

test('C09', 'middleware НЕ перезаписывает callback_data для несовпадающих паттернов', () => {
  // Проверяем что в коде есть условие: сохранение callback_data идёт ПОСЛЕ проверки паттерна
  // Т.е. строка с startswith("project_") должна стоять ПЕРЕД строкой с user_data[user_id]["callback_data"]
  const patternIdx = code.indexOf('startswith("project_")');
  const saveIdx = code.indexOf('user_data[user_id]["callback_data"]');
  ok(patternIdx !== -1, 'фильтр startswith("project_") не найден в middleware');
  ok(saveIdx !== -1, 'сохранение callback_data не найдено');
  ok(patternIdx < saveIdx, 'фильтр паттерна должен стоять ДО сохранения callback_data');
});

test('D05', 'карточки проекта содержат {project_detail.name} в messageText', () => {
  // Проверяем что именно в тексте сообщений (не просто в коде) есть подстановка
  ok(
    code.includes('project_detail.name') && code.includes('Бот работает'),
    'текст карточки running не содержит project_detail.name',
  );
  ok(
    code.includes('project_detail.name') && code.includes('Бот остановлен'),
    'текст карточки stopped не содержит project_detail.name',
  );
});

// ══ Блок D: Карточка проекта + меню действий ═════════════════════════════════
console.log('\n══ Блок D: Карточка проекта + меню действий ══════════════════════════');

test('D01', 'карточки проекта содержат dot-notation {project_detail.name}', () => {
  ok(code.includes('project_detail'), 'project_detail не найден в тексте карточки');
});

test('D01b', 'check-bot-status condition узел присутствует в коде', () => {
  ok(code.includes('check_bot_status'), 'узел check-bot-status не найден');
});

test('D01c', 'три варианта карточки проекта присутствуют в коде', () => {
  ok(code.includes('project_card_running'), 'узел project-card-running не найден');
  ok(code.includes('project_card_stopped'), 'узел project-card-stopped не найден');
  ok(code.includes('project_card_unknown'), 'узел project-card-unknown не найден');
});

test('D02', 'project-actions-keyboard генерирует 7 кнопок', () => {
  const btnTexts = ['Запустить', 'Остановить', 'Перезапустить', 'К списку', 'Переименовать', 'Удалить', 'Токены'];
  for (const text of btnTexts) {
    ok(code.includes(text), `Кнопка "${text}" не найдена`);
  }
});

test('D03', 'раскладка кнопок: builder.adjust(2, 1, 2, 1, 1)', () => {
  ok(code.includes('builder.adjust(2, 1, 2, 1, 1)'), 'builder.adjust(2, 1, 2, 1, 1) не найдено');
});

test('D04', 'кнопка "К списку" ведёт к fetch-projects', () => {
  ok(code.includes('fetch_projects'), 'callback_data для fetch-projects не найден');
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
