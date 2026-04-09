/**
 * @fileoverview Фаза — HTTP Request узел
 *
 * Тестирует генерацию Python-кода для узла http_request:
 *  A. Базовая генерация (10 тестов)
 *  B. HTTP методы (10 тестов)
 *  C. Заголовки (10 тестов)
 *  D. Тело запроса (10 тестов)
 *  E. Сохранение ответа (10 тестов)
 *  F. Таймаут (8 тестов)
 *  G. Логирование (8 тестов)
 *  H. Автопереход (10 тестов)
 *  I. Интеграция с полным проектом (12 тестов)
 *  J. Граничные случаи (10 тестов)
 *  K. Регрессия — отсутствие дублей обработчиков (5 тестов)
 *  L. Dot-notation переменные (4 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа http_request
 * @param id - Идентификатор узла
 * @param data - Дополнительные данные узла
 */
function makeHttpRequestNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'http_request',
    position: { x: 400, y: 0 },
    data: {
      httpRequestUrl: 'https://api.example.com/data',
      httpRequestMethod: 'GET',
      httpRequestTimeout: 30,
      httpRequestResponseVariable: 'response',
      httpRequestStatusVariable: '',
      httpRequestHeaders: '',
      httpRequestBody: '',
      autoTransitionTo: '',
      ...data,
    },
  };
}

/**
 * Создаёт узел типа start
 * @param id - Идентификатор узла
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
 * @param userDatabaseEnabled - Включить БД
 */
function makeCleanProject(nodes: any[], userDatabaseEnabled = false) {
  return {
    version: 2,
    activeSheetId: 'sheet-hr',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-hr',
      name: 'Основной поток',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 */
function gen(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `HttpReq_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Генерирует Python-код с включённой БД
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 */
function genDB(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `HttpReqDB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_hr_${label}.py`;
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
console.log('║       Фаза — HTTP Request узел                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ────────────────────────────────────');

test('A01', '@dp.callback_query(lambda c: c.data == "nodeId") присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A01');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "http1")'),
    '@dp.callback_query с nodeId "http1" не найден');
});

test('A02', 'async def handle_callback_<safeName> присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A02');
  ok(code.includes('async def handle_callback_http1('),
    'async def handle_callback_http1 не найдено');
});

test('A03', 'init_user_variables вызывается в обработчике', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A03');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 1000);
  ok(fnBody.includes('init_user_variables'), 'init_user_variables не найден в теле обработчика');
});

test('A04', 'init_all_user_vars вызывается в обработчике', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A04');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 1000);
  ok(fnBody.includes('init_all_user_vars'), 'init_all_user_vars не найден в теле обработчика');
});

test('A05', '_url = "https://api.example.com/data" присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A05');
  ok(code.includes('_url = "https://api.example.com/data"'),
    '_url = "https://api.example.com/data" не найдено');
});

test('A06', 'replace_variables_in_text(_url, _all_vars, {}) присутствует (подстановка переменных в URL)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A06');
  ok(code.includes('replace_variables_in_text(_url, _all_vars, {})'),
    'replace_variables_in_text(_url, _all_vars, {}) не найдено');
});

test('A07', '_response_data = None присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A07');
  ok(code.includes('_response_data = None'), '_response_data = None не найдено');
});

test('A08', '_status_code = 0 присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A08');
  ok(code.includes('_status_code = 0'), '_status_code = 0 не найдено');
});

test('A09', 'set_user_var(user_id, "response", _response_data) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A09');
  ok(code.includes('set_user_var(user_id, "response", _response_data)'),
    'set_user_var(user_id, "response", _response_data) не найдено');
});

test('A10', 'Синтаксис Python OK для базового GET узла', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'A10');
  syntax(code, 'A10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: HTTP методы
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: HTTP методы ─────────────────────────────────────────');

test('B01', 'GET метод → _session.get( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestMethod: 'GET' })]);
  const code = gen(p, 'B01');
  ok(code.includes('_session.get('), '_session.get( не найдено для GET метода');
});

test('B02', 'POST метод → _session.post( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestMethod: 'POST' })]);
  const code = gen(p, 'B02');
  ok(code.includes('_session.post('), '_session.post( не найдено для POST метода');
});

test('B03', 'PUT метод → _session.put( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestMethod: 'PUT' })]);
  const code = gen(p, 'B03');
  ok(code.includes('_session.put('), '_session.put( не найдено для PUT метода');
});

test('B04', 'PATCH метод → _session.patch( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestMethod: 'PATCH' })]);
  const code = gen(p, 'B04');
  ok(code.includes('_session.patch('), '_session.patch( не найдено для PATCH метода');
});

test('B05', 'DELETE метод → _session.delete( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestMethod: 'DELETE' })]);
  const code = gen(p, 'B05');
  ok(code.includes('_session.delete('), '_session.delete( не найдено для DELETE метода');
});

test('B06', 'GET метод → НЕТ _body_raw_str (тело не генерируется)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'GET',
    httpRequestBody: '{"key": "value"}',
  })]);
  const code = gen(p, 'B06');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('_body_raw_str'), '_body_raw_str найдено для GET — тело не должно генерироваться');
});

test('B07', 'POST метод → ЕСТЬ _body_raw (тело генерируется)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"name": "test"}',
  })]);
  const code = gen(p, 'B07');
  ok(code.includes('_body_raw'), '_body_raw не найдено для POST с телом');
});

test('B08', 'PUT метод → ЕСТЬ _body_raw', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'PUT',
    httpRequestBody: '{"id": 1, "name": "updated"}',
  })]);
  const code = gen(p, 'B08');
  ok(code.includes('_body_raw'), '_body_raw не найдено для PUT с телом');
});

test('B09', 'PATCH метод → ЕСТЬ _body_raw', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'PATCH',
    httpRequestBody: '{"status": "active"}',
  })]);
  const code = gen(p, 'B09');
  ok(code.includes('_body_raw'), '_body_raw не найдено для PATCH с телом');
});

test('B10', 'Синтаксис OK для всех HTTP методов', () => {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  for (const method of methods) {
    const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
      httpRequestMethod: method,
      httpRequestBody: method !== 'GET' && method !== 'DELETE' ? '{"key": "val"}' : '',
    })]);
    const code = gen(p, `B10_${method}`);
    syntax(code, `B10_${method}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: Заголовки
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Заголовки ───────────────────────────────────────────');

test('C01', 'Без заголовков → _headers = {} присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestHeaders: '' })]);
  const code = gen(p, 'C01');
  ok(code.includes('_headers = {}'), '_headers = {} не найдено при пустых заголовках');
});

test('C02', 'Без заголовков → НЕТ _headers_raw', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestHeaders: '' })]);
  const code = gen(p, 'C02');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('_headers_raw'), '_headers_raw найдено при пустых заголовках — не должно быть');
});

test('C03', 'С заголовками → _headers_raw присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"Authorization": "Bearer token123"}',
  })]);
  const code = gen(p, 'C03');
  ok(code.includes('_headers_raw'), '_headers_raw не найдено при заданных заголовках');
});

test('C04', 'С заголовками → _json_mod.loads(_headers_raw) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"Content-Type": "application/json"}',
  })]);
  const code = gen(p, 'C04');
  ok(code.includes('_json_mod.loads(_headers_raw)'),
    '_json_mod.loads(_headers_raw) не найдено при заданных заголовках');
});

test('C05', 'С заголовками → подстановка переменных (_headers_raw.replace()', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"X-User": "{user_id}"}',
  })]);
  const code = gen(p, 'C05');
  ok(code.includes('_headers_raw.replace('), '_headers_raw.replace( не найдено — подстановка переменных отсутствует');
});

test('C06', 'С заголовками → обработка ошибок парсинга (logging.warning)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"Authorization": "Bearer token"}',
  })]);
  const code = gen(p, 'C06');
  ok(code.includes('logging.warning'), 'logging.warning не найдено — обработка ошибок заголовков отсутствует');
});

test('C07', 'С заголовками → _headers or None передаётся в запрос', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"Accept": "application/json"}',
  })]);
  const code = gen(p, 'C07');
  ok(code.includes('_headers or None'), '_headers or None не найдено в вызове запроса');
});

test('C08', 'Заголовок с переменной {api_key} → подстановка работает', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"X-API-Key": "{api_key}"}',
  })]);
  const code = gen(p, 'C08');
  ok(code.includes('_headers_raw.replace('), 'Подстановка переменной {api_key} в заголовках не найдена');
});

test('C09', 'Синтаксис OK с заголовками', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"Authorization": "Bearer token", "Content-Type": "application/json"}',
  })]);
  const code = gen(p, 'C09');
  syntax(code, 'C09');
});

test('C10', 'Синтаксис OK без заголовков', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestHeaders: '' })]);
  const code = gen(p, 'C10');
  syntax(code, 'C10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Тело запроса
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Тело запроса ────────────────────────────────────────');

test('D01', 'POST с телом → _body_raw присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"name": "Alice", "age": 30}',
  })]);
  const code = gen(p, 'D01');
  ok(code.includes('_body_raw'), '_body_raw не найдено для POST с телом');
});

test('D02', 'POST с телом → _json_mod.loads(_body_raw_str) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"email": "test@example.com"}',
  })]);
  const code = gen(p, 'D02');
  ok(code.includes('_json_mod.loads(_body_raw_str)'),
    '_json_mod.loads(_body_raw_str) не найдено для POST с телом');
});

test('D03', 'POST с телом → подстановка переменных replace_variables_in_text(_body_raw_str, _all_vars, {})', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"user_id": "{user_id}", "name": "{user_name}"}',
  })]);
  const code = gen(p, 'D03');
  ok(code.includes('replace_variables_in_text(_body_raw_str, _all_vars, {})'),
    'replace_variables_in_text(_body_raw_str, _all_vars, {}) не найдено — подстановка переменных в теле отсутствует');
});

test('D04', 'POST с телом → обработка ошибок парсинга тела', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"key": "value"}',
  })]);
  const code = gen(p, 'D04');
  ok(code.includes('logging.warning'), 'logging.warning не найдено — обработка ошибок тела отсутствует');
});

test('D05', 'POST без тела → _body = None присутствует, НЕТ _body_raw_str', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '',
  })]);
  const code = gen(p, 'D05');
  ok(code.includes('_body = None'), '_body = None не найдено для POST без тела');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('_body_raw_str'), '_body_raw_str найдено для POST без тела — не должно быть');
});

test('D06', 'GET с телом → тело игнорируется (НЕТ _body_raw_str)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'GET',
    httpRequestBody: '{"should": "be ignored"}',
  })]);
  const code = gen(p, 'D06');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('_body_raw_str'), '_body_raw_str найдено для GET — тело должно игнорироваться');
});

test('D07', 'DELETE с телом → тело игнорируется (НЕТ _body_raw_str)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'DELETE',
    httpRequestBody: '{"id": 42}',
  })]);
  const code = gen(p, 'D07');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(!fnBody.includes('_body_raw_str'), '_body_raw_str найдено для DELETE — тело должно игнорироваться');
});

test('D08', 'Тело с переменной {user_id} → replace_variables_in_text(_body_raw_str, _all_vars, {}) работает', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"telegram_id": "{user_id}"}',
  })]);
  const code = gen(p, 'D08');
  ok(code.includes('replace_variables_in_text(_body_raw_str, _all_vars, {})'),
    'replace_variables_in_text(_body_raw_str, _all_vars, {}) не найдено — подстановка переменной {user_id} в теле отсутствует');
});

test('D09', 'json=_body передаётся в запрос', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"data": "test"}',
  })]);
  const code = gen(p, 'D09');
  ok(code.includes('json=_body'), 'json=_body не найдено в вызове запроса');
});

test('D10', 'Синтаксис OK с телом запроса', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"name": "test", "value": 42}',
  })]);
  const code = gen(p, 'D10');
  syntax(code, 'D10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК E: Сохранение ответа
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Сохранение ответа ───────────────────────────────────');

test('E01', 'set_user_var(user_id, "response", _response_data) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'response',
  })]);
  const code = gen(p, 'E01');
  ok(code.includes('set_user_var(user_id, "response", _response_data)'),
    'set_user_var(user_id, "response", _response_data) не найдено');
});

test('E02', 'Кастомная переменная my_result → set_user_var(user_id, "my_result", _response_data)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'my_result',
  })]);
  const code = gen(p, 'E02');
  ok(code.includes('set_user_var(user_id, "my_result", _response_data)'),
    'set_user_var с кастомной переменной my_result не найдено');
});

test('E03', 'Без statusVariable → НЕТ set_user_var(user_id, "", _status_code)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestStatusVariable: '',
  })]);
  const code = gen(p, 'E03');
  ok(!code.includes('set_user_var(user_id, "", _status_code)'),
    'set_user_var с пустой statusVariable найдено — не должно быть');
});

test('E04', 'С statusVariable http_status → set_user_var(user_id, "http_status", str(_status_code))', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestStatusVariable: 'http_status',
  })]);
  const code = gen(p, 'E04');
  ok(code.includes('set_user_var(user_id, "http_status", str(_status_code))'),
    'set_user_var(user_id, "http_status", str(_status_code)) не найдено');
});

test('E05', '_response_data = await _resp.json(content_type=None) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'E05');
  ok(code.includes('_response_data = await _resp.json(content_type=None)'),
    '_response_data = await _resp.json(content_type=None) не найдено');
});

test('E06', 'Fallback на text при ошибке JSON → _response_data = await _resp.text()', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'E06');
  ok(code.includes('_response_data = await _resp.text()'),
    '_response_data = await _resp.text() не найдено — fallback отсутствует');
});

test('E07', '_status_code = _resp.status присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'E07');
  ok(code.includes('_status_code = _resp.status'), '_status_code = _resp.status не найдено');
});

test('E08', 'При ошибке запроса → _response_data = None (дефолт)', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'E08');
  ok(code.includes('_response_data = None'), '_response_data = None не найдено — дефолт при ошибке отсутствует');
});

test('E09', 'await callback_query.answer() присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'E09');
  ok(code.includes('await callback_query.answer()'), 'await callback_query.answer() не найдено');
});

test('E10', 'Синтаксис OK при сохранении ответа и статуса', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'api_result',
    httpRequestStatusVariable: 'api_status',
  })]);
  const code = gen(p, 'E10');
  syntax(code, 'E10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК F: Таймаут
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Таймаут ─────────────────────────────────────────────');

test('F01', 'Дефолтный таймаут 30 → ClientTimeout(total=30) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestTimeout: 30 })]);
  const code = gen(p, 'F01');
  ok(code.includes('ClientTimeout(total=30)'), 'ClientTimeout(total=30) не найдено');
});

test('F02', 'Кастомный таймаут 10 → ClientTimeout(total=10) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestTimeout: 10 })]);
  const code = gen(p, 'F02');
  ok(code.includes('ClientTimeout(total=10)'), 'ClientTimeout(total=10) не найдено');
});

test('F03', 'Кастомный таймаут 60 → ClientTimeout(total=60) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestTimeout: 60 })]);
  const code = gen(p, 'F03');
  ok(code.includes('ClientTimeout(total=60)'), 'ClientTimeout(total=60) не найдено');
});

test('F04', 'aiohttp.ClientTimeout присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'F04');
  ok(code.includes('ClientTimeout'), 'ClientTimeout не найдено в коде');
});

test('F05', '_aiohttp.ClientTimeout(total= присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'F05');
  ok(code.includes('_aiohttp.ClientTimeout(total='), '_aiohttp.ClientTimeout(total= не найдено');
});

test('F06', 'Таймаут 1 → ClientTimeout(total=1) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestTimeout: 1 })]);
  const code = gen(p, 'F06');
  ok(code.includes('ClientTimeout(total=1)'), 'ClientTimeout(total=1) не найдено');
});

test('F07', 'Таймаут 300 → ClientTimeout(total=300) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestTimeout: 300 })]);
  const code = gen(p, 'F07');
  ok(code.includes('ClientTimeout(total=300)'), 'ClientTimeout(total=300) не найдено');
});

test('F08', 'Синтаксис OK с разными таймаутами', () => {
  const timeouts = [1, 5, 10, 30, 60, 120, 300];
  for (const t of timeouts) {
    const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestTimeout: t })]);
    const code = gen(p, `F08_${t}`);
    syntax(code, `F08_${t}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК G: Логирование
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: Логирование ─────────────────────────────────────────');

test('G01', 'logging.info( присутствует в обработчике', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'G01');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('logging.info('), 'logging.info( не найдено в обработчике');
});

test('G02', 'logging.error( присутствует в обработчике', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'G02');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('logging.error('), 'logging.error( не найдено в обработчике');
});

test('G03', 'logging.warning( присутствует при заголовках', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{"X-Token": "abc"}',
  })]);
  const code = gen(p, 'G03');
  ok(code.includes('logging.warning'), 'logging.warning не найдено при заголовках');
});

test('G04', '🌐 http_request [http1] присутствует в логе', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'G04');
  ok(code.includes('🌐 http_request [http1]'), '🌐 http_request [http1] не найдено в логе');
});

test('G05', '✅ http_request [http1]: статус= присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'G05');
  ok(code.includes('✅ http_request [http1]: статус='), '✅ http_request [http1]: статус= не найдено');
});

test('G06', '❌ http_request [http1]: ошибка запроса присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'G06');
  ok(code.includes('❌ http_request [http1]: ошибка запроса'), '❌ http_request [http1]: ошибка запроса не найдено');
});

test('G07', 'user_id={user_id} присутствует в логах', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'G07');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 2000);
  ok(fnBody.includes('user_id={user_id}'), 'user_id={user_id} не найдено в логах');
});

test('G08', 'Синтаксис OK при наличии всех логов', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestHeaders: '{"Content-Type": "application/json"}',
    httpRequestBody: '{"test": true}',
  })]);
  const code = gen(p, 'G08');
  syntax(code, 'G08');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК H: Автопереход
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок H: Автопереход ─────────────────────────────────────────');

test('H01', 'Без autoTransitionTo → НЕТ await handle_callback_ в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { autoTransitionTo: '' })]);
  const code = gen(p, 'H01');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  // Ищем следующую функцию чтобы ограничить тело
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(!fnBody.includes('await handle_callback_'), 'await handle_callback_ найдено без autoTransitionTo');
});

test('H02', 'С autoTransitionTo + узел существует → await handle_callback_next_node(callback_query)', () => {
  const nextNode = makeMessageNode('next-node', 'Следующий шаг');
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'next-node' });
  const p = makeCleanProject([makeStartNode(), httpNode, nextNode]);
  const code = gen(p, 'H02');
  ok(code.includes('await handle_callback_next_node(callback_query)'),
    'await handle_callback_next_node(callback_query) не найдено');
});

test('H03', 'С autoTransitionTo + узел НЕ существует → logging.warning с "узел автоперехода не найден"', () => {
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'nonexistent-node' });
  const p = makeCleanProject([makeStartNode(), httpNode]);
  const code = gen(p, 'H03');
  ok(code.includes('узел автоперехода не найден'),
    'Предупреждение "узел автоперехода не найден" не найдено');
});

test('H04', 'autoTransitionTo с дефисами → safe_name применяется (next-node → next_node)', () => {
  const nextNode = makeMessageNode('next-node', 'Следующий');
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'next-node' });
  const p = makeCleanProject([makeStartNode(), httpNode, nextNode]);
  const code = gen(p, 'H04');
  ok(code.includes('handle_callback_next_node'), 'handle_callback_next_node не найдено — safe_name не применяется');
});

test('H05', 'autoTransitionTo с точками → safe_name применяется', () => {
  const nextNode = makeMessageNode('step.two', 'Шаг 2');
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'step.two' });
  const p = makeCleanProject([makeStartNode(), httpNode, nextNode]);
  const code = gen(p, 'H05');
  ok(code.includes('handle_callback_step_two'), 'handle_callback_step_two не найдено — safe_name для точек не применяется');
});

test('H06', 'Автопереход к message узлу → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg-next', 'Ответ после запроса');
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'msg-next' });
  const p = makeCleanProject([makeStartNode(), httpNode, msgNode]);
  const code = gen(p, 'H06');
  syntax(code, 'H06');
});

test('H07', 'Автопереход к condition узлу → синтаксис OK', () => {
  const condNode = makeConditionNode('cond1', 'response', [
    { value: 'ok', targetNodeId: 'msg1' },
    { value: '__else__', targetNodeId: 'msg2' },
  ]);
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'cond1' });
  const p = makeCleanProject([
    makeStartNode(), httpNode, condNode,
    makeMessageNode('msg1', 'Успех'), makeMessageNode('msg2', 'Ошибка'),
  ]);
  const code = gen(p, 'H07');
  syntax(code, 'H07');
});

test('H08', 'Цепочка: http_request → http_request → message → синтаксис OK', () => {
  const http1 = makeHttpRequestNode('http1', { autoTransitionTo: 'http2' });
  const http2 = makeHttpRequestNode('http2', { autoTransitionTo: 'msg1' });
  const p = makeCleanProject([makeStartNode(), http1, http2, makeMessageNode('msg1', 'Готово')]);
  const code = gen(p, 'H08');
  syntax(code, 'H08');
});

test('H09', 'Несколько http_request узлов с разными autoTransitionTo → синтаксис OK', () => {
  const http1 = makeHttpRequestNode('http1', { autoTransitionTo: 'msg1' });
  const http2 = makeHttpRequestNode('http2', { autoTransitionTo: 'msg2' });
  const http3 = makeHttpRequestNode('http3', { autoTransitionTo: '' });
  const p = makeCleanProject([
    makeStartNode(), http1, http2, http3,
    makeMessageNode('msg1', 'Ответ 1'), makeMessageNode('msg2', 'Ответ 2'),
  ]);
  const code = gen(p, 'H09');
  syntax(code, 'H09');
});

test('H10', 'Синтаксис OK при автопереходе', () => {
  const nextNode = makeMessageNode('result', 'Результат запроса');
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'result' });
  const p = makeCleanProject([makeStartNode(), httpNode, nextNode]);
  const code = gen(p, 'H10');
  syntax(code, 'H10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК I: Интеграция с полным проектом
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок I: Интеграция с полным проектом ────────────────────────');

test('I01', 'command_trigger → http_request → синтаксис OK', () => {
  const httpNode = makeHttpRequestNode('http1');
  const cmd = makeCommandTriggerNode('cmd1', '/fetch', 'http1');
  const p = makeCleanProject([cmd, httpNode]);
  syntax(gen(p, 'I01'), 'I01');
});

test('I02', 'command_trigger → http_request → message → синтаксис OK', () => {
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'msg1' });
  const cmd = makeCommandTriggerNode('cmd1', '/fetch', 'http1');
  const p = makeCleanProject([cmd, httpNode, makeMessageNode('msg1', 'Данные получены')]);
  syntax(gen(p, 'I02'), 'I02');
});

test('I03', 'start → http_request → condition → message → синтаксис OK', () => {
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'cond1' });
  const condNode = makeConditionNode('cond1', 'response', [
    { value: 'success', targetNodeId: 'msg_ok' },
    { value: '__else__', targetNodeId: 'msg_err' },
  ]);
  const p = makeCleanProject([
    makeStartNode(), httpNode, condNode,
    makeMessageNode('msg_ok', '✅ Успех'), makeMessageNode('msg_err', '❌ Ошибка'),
  ]);
  syntax(gen(p, 'I03'), 'I03');
});

test('I04', 'http_request с DB включён → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')], true);
  syntax(genDB(p, 'I04'), 'I04');
});

test('I05', 'http_request с DB выключен → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')], false);
  syntax(gen(p, 'I05'), 'I05');
});

test('I06', '3 http_request узла в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeHttpRequestNode('http1', { httpRequestResponseVariable: 'res1' }),
    makeHttpRequestNode('http2', { httpRequestResponseVariable: 'res2', httpRequestMethod: 'POST', httpRequestBody: '{"x":1}' }),
    makeHttpRequestNode('http3', { httpRequestResponseVariable: 'res3', httpRequestMethod: 'PUT', httpRequestBody: '{"y":2}' }),
  ]);
  syntax(gen(p, 'I06'), 'I06');
});

test('I07', 'http_request + inline кнопки → синтаксис OK', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Запрос', action: 'goto', target: 'http1' }],
  } as any;
  const p = makeCleanProject([start, makeHttpRequestNode('http1')]);
  syntax(gen(p, 'I07'), 'I07');
});

test('I08', 'http_request + adminOnly → синтаксис OK', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin_fetch', 'http1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeHttpRequestNode('http1')]);
  syntax(gen(p, 'I08'), 'I08');
});

test('I09', 'http_request + requiresAuth → синтаксис OK', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/user_fetch', 'http1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeHttpRequestNode('http1')]);
  syntax(gen(p, 'I09'), 'I09');
});

test('I10', 'http_request с POST + заголовками + телом → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestHeaders: '{"Authorization": "Bearer {token}", "Content-Type": "application/json"}',
    httpRequestBody: '{"user": "{user_id}", "action": "register"}',
  })]);
  syntax(gen(p, 'I10'), 'I10');
});

test('I11', 'http_request с переменными в URL → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestUrl: 'https://api.example.com/users/{user_id}/profile?lang={lang}',
  })]);
  syntax(gen(p, 'I11'), 'I11');
});

test('I12', 'Мегатест: все типы узлов + http_request → синтаксис OK', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Запрос', action: 'goto', target: 'http1' }],
  } as any;
  const httpNode = makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestHeaders: '{"X-Token": "{api_token}"}',
    httpRequestBody: '{"id": "{user_id}"}',
    httpRequestResponseVariable: 'api_data',
    httpRequestStatusVariable: 'api_status',
    autoTransitionTo: 'cond1',
  });
  const condNode = makeConditionNode('cond1', 'api_status', [
    { value: '200', targetNodeId: 'msg_ok' },
    { value: '__else__', targetNodeId: 'msg_err' },
  ]);
  const cmd = makeCommandTriggerNode('cmd1', '/help', 'msg_help');
  const p = makeCleanProject([
    start, httpNode, condNode,
    makeMessageNode('msg_ok', '✅ Данные получены'),
    makeMessageNode('msg_err', '❌ Ошибка API'),
    cmd, makeMessageNode('msg_help', 'Справка'),
  ], true);
  syntax(genDB(p, 'I12'), 'I12');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК J: Граничные случаи
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок J: Граничные случаи ────────────────────────────────────');

test('J01', 'Пустой URL → генерация не падает, синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', { httpRequestUrl: '' })]);
  const code = gen(p, 'J01');
  ok(typeof code === 'string' && code.length > 0, 'Генерация вернула пустой результат');
  syntax(code, 'J01');
});

test('J02', 'URL только из переменной {api_url} → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestUrl: '{api_url}',
  })]);
  syntax(gen(p, 'J02'), 'J02');
});

test('J03', 'Очень длинный URL → синтаксис OK', () => {
  const longUrl = 'https://api.example.com/' + 'path/'.repeat(50) + '?param=' + 'x'.repeat(200);
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestUrl: longUrl,
  })]);
  syntax(gen(p, 'J03'), 'J03');
});

test('J04', 'URL с Unicode → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestUrl: 'https://api.example.com/данные/пользователь?имя=тест',
  })]);
  syntax(gen(p, 'J04'), 'J04');
});

test('J05', 'Пустые заголовки {} → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{}',
  })]);
  syntax(gen(p, 'J05'), 'J05');
});

test('J06', 'Невалидный JSON в заголовках → обработка ошибок есть', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestHeaders: '{invalid json here',
  })]);
  const code = gen(p, 'J06');
  ok(code.includes('logging.warning'), 'logging.warning не найдено — обработка невалидного JSON в заголовках отсутствует');
  syntax(code, 'J06');
});

test('J07', 'Невалидный JSON в теле → обработка ошибок есть', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{invalid json body',
  })]);
  const code = gen(p, 'J07');
  ok(code.includes('logging.warning'), 'logging.warning не найдено — обработка невалидного JSON в теле отсутствует');
  syntax(code, 'J07');
});

test('J08', 'nodeId с дефисами → safeName корректный, синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http-request-node-1')]);
  const code = gen(p, 'J08');
  ok(code.includes('async def handle_callback_http_request_node_1('),
    'handle_callback_http_request_node_1 не найдено — safe_name для дефисов не работает');
  syntax(code, 'J08');
});

test('J09', 'nodeId с цифрами в начале → синтаксис OK', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('1http_node')]);
  const code = gen(p, 'J09');
  ok(typeof code === 'string' && code.length > 0, 'Генерация вернула пустой результат');
  syntax(code, 'J09');
});

test('J10', 'Финальный мегатест: POST + заголовки + тело + переменные + статус + автопереход + DB → синтаксис OK', () => {
  const httpNode = makeHttpRequestNode('mega-http-node', {
    httpRequestUrl: 'https://api.example.com/v2/users/{user_id}/orders',
    httpRequestMethod: 'POST',
    httpRequestHeaders: '{"Authorization": "Bearer {auth_token}", "X-Request-ID": "{request_id}", "Content-Type": "application/json"}',
    httpRequestBody: '{"user_id": "{user_id}", "product": "{selected_product}", "quantity": "{qty}", "currency": "RUB"}',
    httpRequestTimeout: 45,
    httpRequestResponseVariable: 'order_result',
    httpRequestStatusVariable: 'order_status',
    autoTransitionTo: 'check-order',
  });
  const checkNode = makeConditionNode('check-order', 'order_status', [
    { value: '201', targetNodeId: 'msg_created' },
    { value: '400', targetNodeId: 'msg_bad_request' },
    { value: '__else__', targetNodeId: 'msg_error' },
  ]);
  const cmd = makeCommandTriggerNode('cmd_order', '/order', 'mega-http-node');
  const p = makeCleanProject([
    makeStartNode(),
    cmd,
    httpNode,
    checkNode,
    makeMessageNode('msg_created', '✅ Заказ создан! ID: {order_result}'),
    makeMessageNode('msg_bad_request', '⚠️ Неверные данные заказа'),
    makeMessageNode('msg_error', '❌ Ошибка сервера. Попробуйте позже'),
  ], true);
  const code = genDB(p, 'J10');
  // Проверяем ключевые элементы
  ok(code.includes('mega_http_node'), 'safe_name для mega-http-node не применён');
  ok(code.includes('ClientTimeout(total=45)'), 'ClientTimeout(total=45) не найдено');
  ok(code.includes('set_user_var(user_id, "order_result", _response_data)'),
    'set_user_var для order_result не найдено');
  ok(code.includes('set_user_var(user_id, "order_status", str(_status_code))'),
    'set_user_var для order_status не найдено');
  ok(code.includes('_headers_raw'), '_headers_raw не найдено');
  ok(code.includes('_body_raw'), '_body_raw не найдено');
  ok(code.includes('await handle_callback_check_order(callback_query)'),
    'await handle_callback_check_order не найдено');
  syntax(code, 'J10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК K: Регрессия — отсутствие дублей обработчиков
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок K: Регрессия — отсутствие дублей обработчиков ──────────');

test('K01', 'handle_callback_http1 определён ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'K01');
  const count = (code.match(/async def handle_callback_http1\(/g) || []).length;
  ok(count === 1, `handle_callback_http1 определён ${count} раз(а), ожидается 1 — дубль обработчика!`);
});

test('K02', '@dp.callback_query для http1 регистрируется ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'K02');
  const count = (code.match(/@dp\.callback_query\(lambda c: c\.data == "http1"\)/g) || []).length;
  ok(count === 1, `@dp.callback_query для http1 зарегистрирован ${count} раз(а), ожидается 1`);
});

test('K03', '3 http_request узла — каждый обработчик определён ровно 1 раз', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeHttpRequestNode('req1', { httpRequestResponseVariable: 'r1' }),
    makeHttpRequestNode('req2', { httpRequestResponseVariable: 'r2' }),
    makeHttpRequestNode('req3', { httpRequestResponseVariable: 'r3' }),
  ]);
  const code = gen(p, 'K03');
  for (const id of ['req1', 'req2', 'req3']) {
    const safeName = id.replace(/[^a-zA-Z0-9_]/g, '_');
    const count = (code.match(new RegExp(`async def handle_callback_${safeName}\\(`, 'g')) || []).length;
    ok(count === 1, `handle_callback_${safeName} определён ${count} раз(а), ожидается 1`);
  }
});

test('K04', 'http_request с autoTransitionTo — обработчик цели не дублируется', () => {
  const msgNode = makeMessageNode('result', 'Готово');
  const httpNode = makeHttpRequestNode('http1', { autoTransitionTo: 'result' });
  const p = makeCleanProject([makeStartNode(), httpNode, msgNode]);
  const code = gen(p, 'K04');
  const count = (code.match(/async def handle_callback_result\(/g) || []).length;
  ok(count === 1, `handle_callback_result определён ${count} раз(а), ожидается 1`);
});

test('K05', 'http_request с дефисами в nodeId — обработчик определён ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http-request-node')]);
  const code = gen(p, 'K05');
  const count = (code.match(/async def handle_callback_http_request_node\(/g) || []).length;
  ok(count === 1, `handle_callback_http_request_node определён ${count} раз(а), ожидается 1`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК L: Dot-notation переменные
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок L: Dot-notation переменные ─────────────────────────────');

test('L01', 'URL с dot-notation {validate_response.result.user_id} → replace_variables_in_text вызывается для URL', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestUrl: 'https://api.example.com/users/{validate_response.result.user_id}/profile',
  })]);
  const code = gen(p, 'L01');
  ok(code.includes('replace_variables_in_text(_url, _all_vars, {})'),
    'replace_variables_in_text(_url, _all_vars, {}) не найдено — подстановка dot-notation в URL отсутствует');
});

test('L02', 'Тело с dot-notation {validate_response.result.first_name} → replace_variables_in_text вызывается для тела', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"name": "{validate_response.result.first_name}", "id": "{auth.user.id}"}',
  })]);
  const code = gen(p, 'L02');
  ok(code.includes('replace_variables_in_text(_body_raw_str, _all_vars, {})'),
    'replace_variables_in_text(_body_raw_str, _all_vars, {}) не найдено — подстановка dot-notation в теле отсутствует');
});

test('L03', 'Синтаксис Python OK для узла с dot-notation в URL', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestUrl: 'https://api.example.com/v1/{auth.token}/data/{user.profile.id}',
    httpRequestMethod: 'GET',
  })]);
  syntax(gen(p, 'L03'), 'L03');
});

test('L04', 'Синтаксис Python OK для узла с dot-notation в теле', () => {
  const p = makeCleanProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestMethod: 'POST',
    httpRequestBody: '{"user": "{auth.result.user_id}", "token": "{login.response.access_token}"}',
  })]);
  syntax(gen(p, 'L04'), 'L04');
});

// ─── Итог ────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
const summary = `  Итог: ${passed}/${total} пройдено  |  Провалено: ${failed}`;
const padding = ' '.repeat(Math.max(0, 62 - summary.length));
console.log(`║${summary}${padding}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
