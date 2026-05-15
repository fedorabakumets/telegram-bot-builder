/**
 * @fileoverview Фаза 25 — узел psql_query
 *
 * Многогранный интеграционный тест генерации Python-кода для узла psql_query:
 *  A. Базовая генерация (10 тестов)
 *  B. Форматы результата (10 тестов)
 *  C. Сохранение результата (8 тестов)
 *  D. Подстановка переменных в SQL (8 тестов)
 *  E. Автопереход (8 тестов)
 *  F. Логирование (8 тестов)
 *  G. Граничные случаи (8 тестов)
 *  H. Интеграция с полным проектом (10 тестов)
 *  I. Регрессия — отсутствие дублей (5 тестов)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа psql_query
 * @param id - Идентификатор узла
 * @param data - Дополнительные данные узла
 * @returns Объект узла psql_query
 */
function makePsqlQueryNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'psql_query',
    position: { x: 400, y: 0 },
    data: {
      query: 'SELECT * FROM bot_users WHERE user_id = {user_id}',
      saveResultTo: 'user_row',
      resultFormat: 'first_row',
      textTemplate: '',
      autoTransitionTo: '',
      enableAutoTransition: false,
      ...data,
    },
  };
}

/**
 * Создаёт узел типа start
 * @param id - Идентификатор узла
 * @returns Объект узла start
 */
function makeStartNode(id = 'start1') {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] },
  };
}

/**
 * Создаёт узел типа message
 * @param id - Идентификатор узла
 * @param text - Текст сообщения
 * @returns Объект узла message
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт узел типа command_trigger
 * @param id - Идентификатор узла
 * @param command - Команда бота
 * @param targetId - ID целевого узла
 * @returns Объект узла command_trigger
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: 'Команда',
      showInMenu: true,
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт узел типа condition
 * @param id - Идентификатор узла
 * @param variable - Переменная условия
 * @param branches - Ветки условия
 * @returns Объект узла condition
 */
function makeConditionNode(id: string, variable: string, branches: any[]) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: { variable, branches },
  };
}

// ─── Утилиты генерации ───────────────────────────────────────────────────────

/**
 * Создаёт минимальный project.json с заданными узлами
 * @param nodes - Массив узлов
 * @param userDatabaseEnabled - Включить поддержку БД
 * @returns Объект проекта
 */
function makeCleanProject(nodes: any[], userDatabaseEnabled = false) {
  return {
    version: 2,
    activeSheetId: 'sheet-pq',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-pq',
      name: 'Основной поток',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/**
 * Генерирует Python-код из проекта без БД
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `PsqlQuery_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Генерирует Python-код с включённой БД
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код с поддержкой БД
 */
function genDB(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `PsqlQueryDB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Объект с результатом проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_pq_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    const err = e.stderr?.toString() ?? String(e);
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: err };
  }
}

// ─── Тест-раннер ─────────────────────────────────────────────────────────────

/** Результат одного теста */
type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Запускает один тест и записывает результат
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

/**
 * Утверждение — бросает ошибку если условие ложно
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис Python и бросает ошибку при неудаче
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка Python:\n${r.error}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ЗАГОЛОВОК
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║       Фаза 25 — psql_query узел                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ────────────────────────────────────');

test('A01', '@dp.callback_query(lambda c: c.data == "pq1") присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A01');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "pq1")'),
    '@dp.callback_query с nodeId "pq1" не найден');
});

test('A02', 'async def handle_callback_pq1( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A02');
  ok(code.includes('async def handle_callback_pq1('),
    'async def handle_callback_pq1( не найдено');
});

test('A03', 'db_pool is None присутствует в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A03');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('db_pool is None'), 'db_pool is None не найден в теле обработчика');
});

test('A04', 'replace_variables_in_text( присутствует (подстановка переменных в SQL)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A04');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('replace_variables_in_text('), 'replace_variables_in_text( не найден в теле обработчика');
});

test('A05', 'init_all_user_vars(user_id) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A05');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('init_all_user_vars(user_id)'), 'init_all_user_vars(user_id) не найден в теле обработчика');
});

test('A06', 'logging.info( присутствует (начало выполнения)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A06');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('logging.info('), 'logging.info( не найден в теле обработчика');
});

test('A07', 'logging.warning( присутствует (предупреждение при отсутствии пула)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A07');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('logging.warning('), 'logging.warning( не найден в теле обработчика');
});

test('A08', 'logging.error( присутствует (обработка ошибок)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A08');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('logging.error('), 'logging.error( не найден в теле обработчика');
});

test('A09', 'async with db_pool.acquire() as _conn: присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'A09');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('async with db_pool.acquire() as _conn:'),
    'async with db_pool.acquire() as _conn: не найден в теле обработчика');
});

test('A10', 'Синтаксис Python OK (с userDatabaseEnabled: true)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')], true);
  const code = genDB(p, 'A10');
  syntax(code, 'A10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: Форматы результата
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Форматы результата ──────────────────────────────────');

test('B01', 'resultFormat: first_row → _conn.fetchrow( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'first_row' })]);
  const code = gen(p, 'B01');
  ok(code.includes('_conn.fetchrow('), '_conn.fetchrow( не найдено для first_row');
});

test('B02', 'resultFormat: first_row → dict(_row) if _row else {} присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'first_row' })]);
  const code = gen(p, 'B02');
  ok(code.includes('dict(_row) if _row else {}'), 'dict(_row) if _row else {} не найдено для first_row');
});

test('B03', 'resultFormat: json → _conn.fetch( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'json' })]);
  const code = gen(p, 'B03');
  ok(code.includes('_conn.fetch('), '_conn.fetch( не найдено для json');
});

test('B04', 'resultFormat: json → [dict(r) for r in _rows] присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'json' })]);
  const code = gen(p, 'B04');
  ok(code.includes('[dict(r) for r in _rows]'), '[dict(r) for r in _rows] не найдено для json');
});

test('B05', 'resultFormat: affected → _conn.execute( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'affected' })]);
  const code = gen(p, 'B05');
  ok(code.includes('_conn.execute('), '_conn.execute( не найдено для affected');
});

test('B06', 'resultFormat: affected → НЕТ fetchrow и НЕТ fetch( (только execute)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'affected' })]);
  const code = gen(p, 'B06');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('_conn.fetchrow('), '_conn.fetchrow( найдено для affected — не должно быть');
  ok(!fnBody.includes('_conn.fetch('), '_conn.fetch( найдено для affected — не должно быть');
});

test('B07', 'resultFormat: text → _conn.fetch( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: 'text' })]);
  const code = gen(p, 'B07');
  ok(code.includes('_conn.fetch('), '_conn.fetch( не найдено для text');
});

test('B08', 'resultFormat: text → _lines = [] присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    resultFormat: 'text',
    saveResultTo: 'text_out',
  })]);
  const code = gen(p, 'B08');
  ok(code.includes('_lines = []'), '_lines = [] не найдено для text');
});

test('B09', 'resultFormat: text → "\\n".join(_lines) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    resultFormat: 'text',
    saveResultTo: 'text_out',
  })]);
  const code = gen(p, 'B09');
  ok(code.includes('"\\n".join(_lines)'), '"\\n".join(_lines) не найдено для text');
});

test('B10', 'Синтаксис OK для всех 4 форматов', () => {
  const formats = ['first_row', 'json', 'affected', 'text'];
  for (const fmt of formats) {
    const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
      resultFormat: fmt,
      saveResultTo: 'result',
      textTemplate: fmt === 'text' ? '{name}' : '',
    })], true);
    const code = genDB(p, `B10_${fmt}`);
    syntax(code, `B10_${fmt}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: Сохранение результата
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Сохранение результата ───────────────────────────────');

test('C01', 'saveResultTo: stats_result → user_data[user_id]["stats_result"] присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { saveResultTo: 'stats_result' })]);
  const code = gen(p, 'C01');
  ok(code.includes('user_data[user_id]["stats_result"]'),
    'user_data[user_id]["stats_result"] не найдено');
});

test('C02', 'saveResultTo: stats_result → set_user_var(user_id, "stats_result", присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { saveResultTo: 'stats_result' })]);
  const code = gen(p, 'C02');
  ok(code.includes('set_user_var(user_id, "stats_result",'),
    'set_user_var(user_id, "stats_result", не найдено');
});

test('C03', 'saveResultTo: "" (пустое) → НЕТ set_user_var( в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { saveResultTo: '' })]);
  const code = gen(p, 'C03');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(!fnBody.includes('set_user_var('), 'set_user_var( найдено при пустом saveResultTo — не должно быть');
});

test('C04', 'saveResultTo: profile + first_row → user_data[user_id]["profile"] = _result присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: 'profile',
    resultFormat: 'first_row',
  })]);
  const code = gen(p, 'C04');
  ok(code.includes('user_data[user_id]["profile"] = _result'),
    'user_data[user_id]["profile"] = _result не найдено');
});

test('C05', 'saveResultTo: rows + json → user_data[user_id]["rows"] = _result присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: 'rows',
    resultFormat: 'json',
  })]);
  const code = gen(p, 'C05');
  ok(code.includes('user_data[user_id]["rows"] = _result'),
    'user_data[user_id]["rows"] = _result не найдено');
});

test('C06', 'saveResultTo: count + affected → user_data[user_id]["count"] = _result присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: 'count',
    resultFormat: 'affected',
  })]);
  const code = gen(p, 'C06');
  ok(code.includes('user_data[user_id]["count"] = _result'),
    'user_data[user_id]["count"] = _result не найдено');
});

test('C07', 'saveResultTo: text_result + text + textTemplate → replace_variables_in_text("{name} — {score}" присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: 'text_result',
    resultFormat: 'text',
    textTemplate: '{name} — {score}',
  })]);
  const code = gen(p, 'C07');
  ok(code.includes('replace_variables_in_text("{name} — {score}"') ||
     code.includes("replace_variables_in_text('{name} — {score}'"),
    'replace_variables_in_text с шаблоном "{name} — {score}" не найдено');
});

test('C08', 'Синтаксис OK при сохранении результата', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: 'my_result',
    resultFormat: 'first_row',
  })], true);
  const code = genDB(p, 'C08');
  syntax(code, 'C08');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Подстановка переменных в SQL
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Подстановка переменных в SQL ────────────────────────');

test('D01', 'query с {user_id} → replace_variables_in_text("SELECT * FROM bot_users WHERE user_id = {user_id}" присутствует', () => {
  const q = 'SELECT * FROM bot_users WHERE user_id = {user_id}';
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { query: q })]);
  const code = gen(p, 'D01');
  ok(code.includes(`replace_variables_in_text("${q}"`),
    `replace_variables_in_text с запросом не найдено`);
});

test('D02', 'query с {referrer_id} → строка запроса присутствует в коде', () => {
  const q = 'SELECT * FROM orders WHERE ref = {referrer_id}';
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { query: q })]);
  const code = gen(p, 'D02');
  ok(code.includes(q) || code.includes(q.replace(/"/g, '\\"')),
    `Строка запроса "${q}" не найдена в коде`);
});

test('D03', 'query UPDATE → строка запроса присутствует в коде', () => {
  const q = 'UPDATE stats SET cnt = cnt + 1 WHERE id = {user_id}';
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { query: q })]);
  const code = gen(p, 'D03');
  ok(code.includes(q) || code.includes(q.replace(/"/g, '\\"')),
    `Строка запроса UPDATE не найдена в коде`);
});

test('D04', 'Переменная _query используется в вызове _conn. (не сырая строка)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'D04');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('_query'), '_query не найден в теле обработчика');
  ok(fnBody.includes('_conn.') && (
    fnBody.includes('_conn.fetchrow(_query)') ||
    fnBody.includes('_conn.fetch(_query)') ||
    fnBody.includes('_conn.execute(_query)')
  ), '_query не передаётся в _conn. — используется сырая строка');
});

test('D05', '_all_vars = await init_all_user_vars(user_id) вызывается ДО _query =', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'D05');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  const allVarsIdx = fnBody.indexOf('_all_vars = await init_all_user_vars(user_id)');
  const queryIdx = fnBody.indexOf('_query =');
  ok(allVarsIdx !== -1, '_all_vars = await init_all_user_vars(user_id) не найден');
  ok(queryIdx !== -1, '_query = не найден');
  ok(allVarsIdx < queryIdx, '_all_vars должен вызываться ДО _query =');
});

test('D06', '_query передаётся в _conn.fetchrow/_conn.fetch/_conn.execute', () => {
  const formats = ['first_row', 'json', 'affected'];
  const expected = ['_conn.fetchrow(_query)', '_conn.fetch(_query)', '_conn.execute(_query)'];
  for (let i = 0; i < formats.length; i++) {
    const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { resultFormat: formats[i] })]);
    const code = gen(p, `D06_${formats[i]}`);
    ok(code.includes(expected[i]), `${expected[i]} не найдено для resultFormat=${formats[i]}`);
  }
});

test('D07', 'Синтаксис OK с переменными в запросе', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    query: 'SELECT * FROM users WHERE id = {user_id} AND name = {username}',
  })], true);
  const code = genDB(p, 'D07');
  syntax(code, 'D07');
});

test('D08', 'Пустой query "" → код генерируется без ошибок, синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { query: '' })], true);
  const code = genDB(p, 'D08');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден при пустом query');
  syntax(code, 'D08');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК E: Автопереход
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Автопереход ─────────────────────────────────────────');

test('E01', 'autoTransitionTo: msg-stats → class FakeCallback: присутствует в теле', () => {
  const msgNode = makeMessageNode('msg-stats', 'Статистика');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'msg-stats' }), msgNode]);
  const code = gen(p, 'E01');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(fnBody.includes('class FakeCallback:'), 'class FakeCallback: не найден в теле обработчика');
});

test('E02', 'autoTransitionTo: msg-stats → fake_cb = FakeCallback("msg-stats", присутствует', () => {
  const msgNode = makeMessageNode('msg-stats', 'Статистика');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'msg-stats' }), msgNode]);
  const code = gen(p, 'E02');
  ok(code.includes('fake_cb = FakeCallback("msg-stats",'),
    'fake_cb = FakeCallback("msg-stats", не найдено');
});

test('E03', 'autoTransitionTo: msg-stats → await handle_callback_msg_stats(fake_cb присутствует', () => {
  const msgNode = makeMessageNode('msg-stats', 'Статистика');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'msg-stats' }), msgNode]);
  const code = gen(p, 'E03');
  ok(code.includes('await handle_callback_msg_stats(fake_cb'),
    'await handle_callback_msg_stats(fake_cb не найдено');
});

test('E04', 'autoTransitionTo: "" (пустое) → НЕТ FakeCallback в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: '' })]);
  const code = gen(p, 'E04');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(!fnBody.includes('FakeCallback'), 'FakeCallback найден при пустом autoTransitionTo — не должно быть');
});

test('E05', 'autoTransitionTo: msg-stats → logging.info( с упоминанием автоперехода присутствует', () => {
  const msgNode = makeMessageNode('msg-stats', 'Статистика');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'msg-stats' }), msgNode]);
  const code = gen(p, 'E05');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(fnBody.includes('logging.info(') && (
    fnBody.includes('автопереход') || fnBody.includes('msg-stats')
  ), 'logging.info с упоминанием автоперехода не найден');
});

test('E06', 'Автопереход к message-узлу → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg-next', 'Следующий');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'msg-next' }), msgNode], true);
  const code = genDB(p, 'E06');
  syntax(code, 'E06');
});

test('E07', 'Автопереход к condition-узлу → синтаксис OK', () => {
  const condNode = makeConditionNode('cond1', 'score', [
    { value: '100', targetNodeId: 'msg-win' },
    { value: '', targetNodeId: 'msg-lose' },
  ]);
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'cond1' }), condNode], true);
  const code = genDB(p, 'E07');
  syntax(code, 'E07');
});

test('E08', 'Несколько psql_query с разными autoTransitionTo → оба обработчика присутствуют', () => {
  const msg1 = makeMessageNode('msg-a', 'A');
  const msg2 = makeMessageNode('msg-b', 'B');
  const pq1 = makePsqlQueryNode('pq1', { autoTransitionTo: 'msg-a' });
  const pq2 = makePsqlQueryNode('pq2', { autoTransitionTo: 'msg-b' });
  const p = makeCleanProject([makeStartNode(), pq1, pq2, msg1, msg2]);
  const code = gen(p, 'E08');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  ok(code.includes('async def handle_callback_pq2('), 'handle_callback_pq2 не найден');
  ok(code.includes('await handle_callback_msg_a(fake_cb'), 'автопереход к msg-a не найден');
  ok(code.includes('await handle_callback_msg_b(fake_cb'), 'автопереход к msg-b не найден');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК F: Логирование
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Логирование ─────────────────────────────────────────');

test('F01', 'logging.info(f"🗄️ psql_query [pq1]: начало выполнения присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'F01');
  ok(code.includes('logging.info(f"🗄️ psql_query [pq1]: начало выполнения'),
    'logging.info с началом выполнения не найден');
});

test('F02', 'logging.warning(f"⚠️ psql_query [pq1]: db_pool недоступен присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'F02');
  ok(code.includes('logging.warning(f"⚠️ psql_query [pq1]: db_pool недоступен'),
    'logging.warning с db_pool недоступен не найден');
});

test('F03', 'logging.info(f"🗄️ psql_query [pq1]: выполняем запрос присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'F03');
  ok(code.includes('logging.info(f"🗄️ psql_query [pq1]: выполняем запрос'),
    'logging.info с выполняем запрос не найден');
});

test('F04', 'logging.info(f"✅ psql_query [pq1]: выполнено присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'F04');
  ok(code.includes('logging.info(f"✅ psql_query [pq1]: выполнено'),
    'logging.info с выполнено не найден');
});

test('F05', 'saveResultTo: result → logging.info( с упоминанием «result» присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { saveResultTo: 'result' })]);
  const code = gen(p, 'F05');
  ok(code.includes('«result»') || code.includes('"result"'),
    'logging.info с упоминанием «result» не найден');
});

test('F06', 'autoTransitionTo: next → logging.info( с упоминанием автоперехода присутствует', () => {
  const msgNode = makeMessageNode('next', 'Следующий');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'next' }), msgNode]);
  const code = gen(p, 'F06');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(fnBody.includes('logging.info(') && (
    fnBody.includes('автопереход') || fnBody.includes('next')
  ), 'logging.info с упоминанием автоперехода не найден');
});

test('F07', 'logging.error(f"❌ Ошибка в psql_query [pq1]: присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'F07');
  ok(code.includes('logging.error(f"❌ Ошибка в psql_query [pq1]:'),
    'logging.error с ❌ Ошибка в psql_query [pq1]: не найден');
});

test('F08', 'Синтаксис OK с полным логированием', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: 'result',
    resultFormat: 'first_row',
  })], true);
  const code = genDB(p, 'F08');
  syntax(code, 'F08');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК G: Граничные случаи
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: Граничные случаи ────────────────────────────────────');

test('G01', 'Узел без saveResultTo и без autoTransitionTo → генерируется корректно, синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    saveResultTo: '',
    autoTransitionTo: '',
  })], true);
  const code = genDB(p, 'G01');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  syntax(code, 'G01');
});

test('G02', 'Два psql_query узла → оба обработчика присутствуют, нет дублей', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1'), makePsqlQueryNode('pq2')]);
  const code = gen(p, 'G02');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  ok(code.includes('async def handle_callback_pq2('), 'handle_callback_pq2 не найден');
  // Проверяем отсутствие дублей
  const count1 = (code.match(/async def handle_callback_pq1\(/g) || []).length;
  const count2 = (code.match(/async def handle_callback_pq2\(/g) || []).length;
  ok(count1 === 1, `handle_callback_pq1 встречается ${count1} раз — ожидается 1`);
  ok(count2 === 1, `handle_callback_pq2 встречается ${count2} раз — ожидается 1`);
});

test('G03', 'psql_query + message + condition → обработчики psql_query и message присутствуют, condition зарегистрирован', () => {
  const condNode = makeConditionNode('cond1', 'score', [{ value: '10', targetNodeId: 'msg1' }]);
  const msgNode = makeMessageNode('msg1', 'Привет');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1'), msgNode, condNode]);
  const code = gen(p, 'G03');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  ok(code.includes('async def handle_callback_msg1('), 'handle_callback_msg1 не найден');
  // condition-узел регистрируется через middleware (handle_callback_cond1 вызывается внутри)
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 не упоминается в коде');
});

test('G04', "query с одинарными кавычками → синтаксис OK", () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    query: "SELECT * FROM t WHERE name = 'test'",
  })], true);
  const code = genDB(p, 'G04');
  syntax(code, 'G04');
});

test('G05', 'query с кириллицей → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    query: 'SELECT имя, возраст FROM пользователи WHERE id = {user_id}',
  })], true);
  const code = genDB(p, 'G05');
  syntax(code, 'G05');
});

test('G06', 'textTemplate: {username} — {score} очков → шаблон присутствует в коде', () => {
  const tmpl = '{username} — {score} очков';
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    resultFormat: 'text',
    saveResultTo: 'out',
    textTemplate: tmpl,
  })]);
  const code = gen(p, 'G06');
  ok(code.includes(tmpl) || code.includes(tmpl.replace(/"/g, '\\"')),
    `Шаблон "${tmpl}" не найден в коде`);
});

test('G07', 'resultFormat: text без textTemplate (пустой) → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    resultFormat: 'text',
    saveResultTo: 'out',
    textTemplate: '',
  })], true);
  const code = genDB(p, 'G07');
  syntax(code, 'G07');
});

test('G08', 'id с дефисами sql-stats-node → handle_callback_sql_stats_node (дефисы → _)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('sql-stats-node')]);
  const code = gen(p, 'G08');
  ok(code.includes('async def handle_callback_sql_stats_node('),
    'handle_callback_sql_stats_node не найден — дефисы не заменены на _');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "sql-stats-node")'),
    '@dp.callback_query с оригинальным id не найден');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК H: Интеграция с полным проектом
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок H: Интеграция с полным проектом ────────────────────────');

test('H01', 'Полный сценарий: command_trigger → psql_query (first_row) → message → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg1', 'Результат');
  const pqNode = makePsqlQueryNode('pq1', { resultFormat: 'first_row', saveResultTo: 'row', autoTransitionTo: 'msg1' });
  const cmdNode = makeCommandTriggerNode('cmd1', '/stats', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, msgNode], true);
  const code = genDB(p, 'H01');
  syntax(code, 'H01');
});

test('H02', 'Полный сценарий: command_trigger → psql_query (json) → message → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg1', 'Список');
  const pqNode = makePsqlQueryNode('pq1', { resultFormat: 'json', saveResultTo: 'rows', autoTransitionTo: 'msg1' });
  const cmdNode = makeCommandTriggerNode('cmd1', '/list', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, msgNode], true);
  const code = genDB(p, 'H02');
  syntax(code, 'H02');
});

test('H03', 'Полный сценарий: command_trigger → psql_query (affected) → message → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg1', 'Обновлено');
  const pqNode = makePsqlQueryNode('pq1', { resultFormat: 'affected', saveResultTo: 'cnt', autoTransitionTo: 'msg1' });
  const cmdNode = makeCommandTriggerNode('cmd1', '/update', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, msgNode], true);
  const code = genDB(p, 'H03');
  syntax(code, 'H03');
});

test('H04', 'Полный сценарий: command_trigger → psql_query (text) → message → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg1', 'Текст');
  const pqNode = makePsqlQueryNode('pq1', {
    resultFormat: 'text',
    saveResultTo: 'txt',
    textTemplate: '{name}: {value}',
    autoTransitionTo: 'msg1',
  });
  const cmdNode = makeCommandTriggerNode('cmd1', '/report', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, msgNode], true);
  const code = genDB(p, 'H04');
  syntax(code, 'H04');
});

test('H05', 'userDatabaseEnabled: true → db_pool объявлен в коде', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')], true);
  const code = genDB(p, 'H05');
  ok(code.includes('db_pool'), 'db_pool не найден в коде при userDatabaseEnabled: true');
});

test('H06', 'userDatabaseEnabled: true → DATABASE_URL присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')], true);
  const code = genDB(p, 'H06');
  ok(code.includes('DATABASE_URL'), 'DATABASE_URL не найден в коде при userDatabaseEnabled: true');
});

test('H07', 'userDatabaseEnabled: false → db_pool is None всё равно присутствует в обработчике (защита)', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')], false);
  const code = gen(p, 'H07');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('db_pool is None'), 'db_pool is None не найден при userDatabaseEnabled: false — защита отсутствует');
});

test('H08', 'psql_query + http_request в одном проекте → оба обработчика присутствуют, нет конфликтов', () => {
  const httpNode = {
    id: 'http1',
    type: 'http_request',
    position: { x: 400, y: 200 },
    data: {
      httpRequestUrl: 'https://api.example.com/data',
      httpRequestMethod: 'GET',
      httpRequestTimeout: 30,
      httpRequestResponseVariable: 'response',
      httpRequestStatusVariable: '',
      httpRequestHeaders: '',
      httpRequestBody: '',
      autoTransitionTo: '',
    },
  };
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1'), httpNode], true);
  const code = genDB(p, 'H08');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  ok(code.includes('async def handle_callback_http1('), 'handle_callback_http1 не найден');
  syntax(code, 'H08');
});

test('H09', 'psql_query + set_variable в одном проекте → оба обработчика присутствуют', () => {
  const setVarNode = {
    id: 'sv1',
    type: 'set_variable',
    position: { x: 400, y: 200 },
    data: { variable: 'my_var', value: '42', autoTransitionTo: '' },
  };
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1'), setVarNode], true);
  const code = genDB(p, 'H09');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  ok(code.includes('async def handle_callback_sv1('), 'handle_callback_sv1 не найден');
});

test('H10', 'Синтаксис OK для полного проекта с psql_query и userDatabaseEnabled: true', () => {
  const msgNode = makeMessageNode('msg1', 'Готово');
  const condNode = makeConditionNode('cond1', 'user_row', [
    { value: '', targetNodeId: 'msg1' },
  ]);
  const pqNode = makePsqlQueryNode('pq1', {
    resultFormat: 'first_row',
    saveResultTo: 'user_row',
    autoTransitionTo: 'cond1',
  });
  const cmdNode = makeCommandTriggerNode('cmd1', '/check', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, condNode, msgNode], true);
  const code = genDB(p, 'H10');
  syntax(code, 'H10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК I: Регрессия — отсутствие дублей
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок I: Регрессия — отсутствие дублей ───────────────────────');

test('I01', 'Один psql_query узел → ровно одно вхождение async def handle_callback_pq1(', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'I01');
  const count = (code.match(/async def handle_callback_pq1\(/g) || []).length;
  ok(count === 1, `handle_callback_pq1 встречается ${count} раз — ожидается ровно 1`);
});

test('I02', 'psql_query узел → НЕТ дублирующего пустого обработчика от interactive-callback-handlers', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'I02');
  // Пустой обработчик выглядит как функция с только pass или только return
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  // Тело должно содержать реальную логику, а не только pass
  ok(fnBody.includes('db_pool is None') || fnBody.includes('async with db_pool'),
    'Обработчик pq1 выглядит как пустой заглушка — реальная логика отсутствует');
});

test('I03', 'psql_query с autoTransitionTo → целевой узел не генерирует дублирующий обработчик psql_query', () => {
  const msgNode = makeMessageNode('msg1', 'Ответ');
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { autoTransitionTo: 'msg1' }), msgNode]);
  const code = gen(p, 'I03');
  // Целевой узел msg1 должен иметь свой обработчик, но не дублировать pq1
  const pqCount = (code.match(/async def handle_callback_pq1\(/g) || []).length;
  ok(pqCount === 1, `handle_callback_pq1 встречается ${pqCount} раз после автоперехода — ожидается 1`);
});

test('I04', 'Два psql_query узла → ровно два разных handle_callback_ для них', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1'), makePsqlQueryNode('pq2')]);
  const code = gen(p, 'I04');
  const count1 = (code.match(/async def handle_callback_pq1\(/g) || []).length;
  const count2 = (code.match(/async def handle_callback_pq2\(/g) || []).length;
  ok(count1 === 1, `handle_callback_pq1 встречается ${count1} раз — ожидается 1`);
  ok(count2 === 1, `handle_callback_pq2 встречается ${count2} раз — ожидается 1`);
});

test('I05', 'psql_query узел → НЕТ "# Нет обработчика для узла типа psql_query" в коде', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'I05');
  ok(!code.includes('# Нет обработчика для узла типа psql_query'),
    'Найден комментарий "# Нет обработчика для узла типа psql_query" — узел не обрабатывается генератором');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК J: Подключение к внешней БД (connectionSource)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок J: Подключение к внешней БД ───────────────────────────');

test('J01', 'connectionSource: builtin (по умолчанию) → db_pool.acquire() присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1')]);
  const code = gen(p, 'J01');
  ok(code.includes('db_pool.acquire()'), 'db_pool.acquire() не найден для builtin');
});

test('J02', 'connectionSource: builtin → db_pool is None проверка присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', { connectionSource: 'builtin' })]);
  const code = gen(p, 'J02');
  ok(code.includes('db_pool is None'), 'db_pool is None не найден для builtin');
});

test('J03', 'connectionSource: env → asyncpg.create_pool(os.environ.get("MY_DB" присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'env',
    connectionEnvVar: 'MY_DB',
  })]);
  const code = gen(p, 'J03');
  ok(code.includes('asyncpg.create_pool(os.environ.get("MY_DB"'),
    'asyncpg.create_pool(os.environ.get("MY_DB" не найден для env');
});

test('J04', 'connectionSource: env → НЕТ db_pool is None проверки', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'env',
    connectionEnvVar: 'EXTERNAL_DB',
  })]);
  const code = gen(p, 'J04');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('db_pool is None'), 'db_pool is None найден для env — не должно быть');
});

test('J05', 'connectionSource: env → _custom_pool.close() присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'env',
    connectionEnvVar: 'MY_DB',
  })]);
  const code = gen(p, 'J05');
  ok(code.includes('_custom_pool.close()'), '_custom_pool.close() не найден для env');
});

test('J06', 'connectionSource: custom → asyncpg.create_pool("postgresql://user:pass@host:5432/db" присутствует', () => {
  const connStr = 'postgresql://user:pass@host:5432/db';
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'custom',
    connectionString: connStr,
  })]);
  const code = gen(p, 'J06');
  ok(code.includes(connStr), `Connection string "${connStr}" не найден для custom`);
});

test('J07', 'connectionSource: custom → НЕТ db_pool is None проверки', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'custom',
    connectionString: 'postgresql://u:p@h:5432/d',
  })]);
  const code = gen(p, 'J07');
  const fnIdx = code.indexOf('async def handle_callback_pq1(');
  ok(fnIdx !== -1, 'handle_callback_pq1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('db_pool is None'), 'db_pool is None найден для custom — не должно быть');
});

test('J08', 'connectionSource: custom → _custom_pool.close() присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'custom',
    connectionString: 'postgresql://u:p@h:5432/d',
  })]);
  const code = gen(p, 'J08');
  ok(code.includes('_custom_pool.close()'), '_custom_pool.close() не найден для custom');
});

test('J09', 'connectionSource: env → синтаксис Python OK', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'env',
    connectionEnvVar: 'ANALYTICS_DB',
    saveResultTo: 'data',
    resultFormat: 'json',
  })], true);
  const code = genDB(p, 'J09');
  syntax(code, 'J09');
});

test('J10', 'connectionSource: custom → синтаксис Python OK', () => {
  const p = makeCleanProject([makeStartNode(), makePsqlQueryNode('pq1', {
    connectionSource: 'custom',
    connectionString: 'postgresql://admin:secret@db.neon.tech:5432/myapp?sslmode=require',
    saveResultTo: 'orders',
    resultFormat: 'first_row',
  })], true);
  const code = genDB(p, 'J10');
  syntax(code, 'J10');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n${'─'.repeat(64)}`);
console.log(`Фаза 25 psql_query — Итого: ${passed} ✅  ${failed} ❌  из ${results.length}`);
if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`);
  });
  process.exit(1);
}
