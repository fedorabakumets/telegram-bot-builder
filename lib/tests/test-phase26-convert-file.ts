/**
 * @fileoverview Фаза 26 — узел convert_file
 *
 * Многогранный интеграционный тест генерации Python-кода для узла convert_file:
 *  A. Базовая генерация (8 тестов)
 *  B. Форматы файлов (8 тестов)
 *  C. Сохранение в переменную (6 тестов)
 *  D. Имя файла и {date} (5 тестов)
 *  E. Автопереход (6 тестов)
 *  F. Граничные случаи (5 тестов)
 *  G. Интеграция (4 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа convert_file
 * @param id - Идентификатор узла
 * @param data - Дополнительные данные узла
 * @returns Объект узла convert_file
 */
function makeConvertFileNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'convert_file',
    position: { x: 400, y: 0 },
    data: {
      convertFileInputVariable: 'users_data',
      convertFileFormat: 'csv',
      convertFileFileName: 'export_{date}.csv',
      convertFileCsvDelimiter: ',',
      convertFileIncludeHeaderRow: true,
      convertFileOutputVariable: 'export_file',
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
    activeSheetId: 'sheet-cf',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-cf',
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
    botName: `ConvertFile_${label}`,
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
    botName: `ConvertFileDB_${label}`,
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
  const tmp = `_tmp_cf_${label}.py`;
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
console.log('║       Фаза 26 — convert_file узел                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ────────────────────────────────────');

test('A01', '@dp.callback_query(lambda c: c.data == "cf1") присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A01');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "cf1")'),
    '@dp.callback_query с nodeId "cf1" не найден');
});

test('A02', 'async def handle_callback_cf1( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A02');
  ok(code.includes('async def handle_callback_cf1('),
    'async def handle_callback_cf1( не найдено');
});

test('A03', 'import csv присутствует в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A03');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('import csv'), 'import csv не найден в теле обработчика');
});

test('A04', 'import base64 присутствует в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A04');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('import base64'), 'import base64 не найден в теле обработчика');
});

test('A05', 'init_all_user_vars(user_id) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A05');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('init_all_user_vars(user_id)'),
    'init_all_user_vars(user_id) не найден в теле обработчика');
});

test('A06', 'logging.info( присутствует в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A06');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('logging.info('), 'logging.info( не найден в теле обработчика');
});

test('A07', 'logging.error( присутствует в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'A07');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('logging.error('), 'logging.error( не найден в теле обработчика');
});

test('A08', 'Синтаксис Python OK (с userDatabaseEnabled: true)', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')], true);
  const code = genDB(p, 'A08');
  syntax(code, 'A08');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: Форматы файлов
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Форматы файлов ──────────────────────────────────────');

test('B01', 'format: csv → csv.DictWriter( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { convertFileFormat: 'csv' })]);
  const code = gen(p, 'B01');
  ok(code.includes('csv.DictWriter('), 'csv.DictWriter( не найдено для format=csv');
});

test('B02', 'format: csv → _buf.getvalue().encode("utf-8") присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { convertFileFormat: 'csv' })]);
  const code = gen(p, 'B02');
  ok(code.includes('_buf.getvalue().encode("utf-8")'),
    '_buf.getvalue().encode("utf-8") не найдено для format=csv');
});

test('B03', 'format: csv + includeHeaderRow: true → _writer.writeheader() присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileFormat: 'csv',
    convertFileIncludeHeaderRow: true,
  })]);
  const code = gen(p, 'B03');
  ok(code.includes('_writer.writeheader()'),
    '_writer.writeheader() не найдено при includeHeaderRow=true');
});

test('B04', 'format: csv + includeHeaderRow: false → _writer.writeheader() ОТСУТСТВУЕТ', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileFormat: 'csv',
    convertFileIncludeHeaderRow: false,
  })]);
  const code = gen(p, 'B04');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(!fnBody.includes('_writer.writeheader()'),
    '_writer.writeheader() найдено при includeHeaderRow=false — не должно быть');
});

test('B05', 'format: json → json.dumps( или _json.dumps( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { convertFileFormat: 'json' })]);
  const code = gen(p, 'B05');
  ok(code.includes('json.dumps(') || code.includes('_json.dumps('),
    'json.dumps( или _json.dumps( не найдено для format=json');
});

test('B06', 'format: json → application/json присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { convertFileFormat: 'json' })]);
  const code = gen(p, 'B06');
  ok(code.includes('application/json'), 'application/json не найдено для format=json');
});

test('B07', 'format: csv → text/csv присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { convertFileFormat: 'csv' })]);
  const code = gen(p, 'B07');
  ok(code.includes('text/csv'), 'text/csv не найдено для format=csv');
});

test('B08', 'Синтаксис OK для обоих форматов', () => {
  for (const fmt of ['csv', 'json'] as const) {
    const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { convertFileFormat: fmt })], true);
    const code = genDB(p, `B08_${fmt}`);
    syntax(code, `B08_${fmt}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: Сохранение в переменную
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Сохранение в переменную ─────────────────────────────');

test('C01', 'outputVariable: export_file → user_data[user_id]["export_file"] присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileOutputVariable: 'export_file',
  })]);
  const code = gen(p, 'C01');
  ok(code.includes('user_data[user_id]["export_file"]'),
    'user_data[user_id]["export_file"] не найдено');
});

test('C02', 'outputVariable: export_file → set_user_var(user_id, "export_file", присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileOutputVariable: 'export_file',
  })]);
  const code = gen(p, 'C02');
  ok(code.includes('set_user_var(user_id, "export_file",'),
    'set_user_var(user_id, "export_file", не найдено');
});

test('C03', 'outputVariable: "" (пустое) → НЕТ set_user_var( в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileOutputVariable: '',
  })]);
  const code = gen(p, 'C03');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(!fnBody.includes('set_user_var('),
    'set_user_var( найдено при пустом outputVariable — не должно быть');
});

test('C04', '"type": "file" присутствует в теле (структура file-объекта)', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'C04');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('"type": "file"') || fnBody.includes("'type': 'file'"),
    '"type": "file" не найдено в теле обработчика');
});

test('C05', 'base64.b64encode( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'C05');
  ok(code.includes('base64.b64encode('), 'base64.b64encode( не найдено');
});

test('C06', 'Синтаксис OK при сохранении результата', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileOutputVariable: 'my_file',
  })], true);
  const code = genDB(p, 'C06');
  syntax(code, 'C06');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Имя файла и {date}
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Имя файла и {date} ──────────────────────────────────');

test('D01', '_date_str = datetime.now().strftime( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'D01');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('_date_str = datetime.now().strftime('),
    '_date_str = datetime.now().strftime( не найдено');
});

test('D02', 'replace("{date}", _date_str) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'D02');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('replace("{date}", _date_str)'),
    'replace("{date}", _date_str) не найдено');
});

test('D03', 'fileName: report_{date}.xlsx → строка report_{date}.xlsx присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileFileName: 'report_{date}.xlsx',
  })]);
  const code = gen(p, 'D03');
  ok(code.includes('report_{date}.xlsx'),
    'Строка report_{date}.xlsx не найдена в коде');
});

test('D04', 'from datetime import datetime присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'D04');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('from datetime import datetime'),
    'from datetime import datetime не найдено в теле обработчика');
});

test('D05', 'Синтаксис OK с кастомным именем файла', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileFileName: 'my_report_{date}.csv',
  })], true);
  const code = genDB(p, 'D05');
  syntax(code, 'D05');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК E: Автопереход
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Автопереход ─────────────────────────────────────────');

test('E01', 'autoTransitionTo: msg-export → class FakeCallback: присутствует в теле', () => {
  const msgNode = makeMessageNode('msg-export', 'Файл готов');
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { autoTransitionTo: 'msg-export' }), msgNode]);
  const code = gen(p, 'E01');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(fnBody.includes('class FakeCallback:'), 'class FakeCallback: не найден в теле обработчика');
});

test('E02', 'autoTransitionTo: msg-export → fake_cb = FakeCallback("msg-export", присутствует', () => {
  const msgNode = makeMessageNode('msg-export', 'Файл готов');
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { autoTransitionTo: 'msg-export' }), msgNode]);
  const code = gen(p, 'E02');
  ok(code.includes('fake_cb = FakeCallback("msg-export",'),
    'fake_cb = FakeCallback("msg-export", не найдено');
});

test('E03', 'autoTransitionTo: msg-export → await handle_callback_msg_export(fake_cb присутствует', () => {
  const msgNode = makeMessageNode('msg-export', 'Файл готов');
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { autoTransitionTo: 'msg-export' }), msgNode]);
  const code = gen(p, 'E03');
  ok(code.includes('await handle_callback_msg_export(fake_cb'),
    'await handle_callback_msg_export(fake_cb не найдено');
});

test('E04', 'autoTransitionTo: "" (пустое) → НЕТ FakeCallback в теле обработчика', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { autoTransitionTo: '' })]);
  const code = gen(p, 'E04');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(!fnBody.includes('FakeCallback'),
    'FakeCallback найден при пустом autoTransitionTo — не должно быть');
});

test('E05', 'autoTransitionTo: msg-export → logging.info( с упоминанием автоперехода', () => {
  const msgNode = makeMessageNode('msg-export', 'Файл готов');
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { autoTransitionTo: 'msg-export' }), msgNode]);
  const code = gen(p, 'E05');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 3000);
  ok(fnBody.includes('logging.info(') && (
    fnBody.includes('автопереход') || fnBody.includes('msg-export')
  ), 'logging.info с упоминанием автоперехода не найден');
});

test('E06', 'Синтаксис OK с автопереходом', () => {
  const msgNode = makeMessageNode('msg-next', 'Следующий');
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', { autoTransitionTo: 'msg-next' }), msgNode], true);
  const code = genDB(p, 'E06');
  syntax(code, 'E06');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК F: Граничные случаи
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Граничные случаи ────────────────────────────────────');

test('F01', 'пустой convertFileInputVariable: "" → код генерируется без ошибок', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileInputVariable: '',
  })]);
  const code = gen(p, 'F01');
  ok(code.includes('async def handle_callback_cf1('),
    'handle_callback_cf1 не найден при пустом inputVariable');
});

test('F02', 'if not isinstance(_input_data, list): присутствует (защита от не-списка)', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'F02');
  const fnIdx = code.indexOf('async def handle_callback_cf1(');
  ok(fnIdx !== -1, 'handle_callback_cf1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 3000);
  ok(fnBody.includes('if not isinstance(_input_data, list):'),
    'if not isinstance(_input_data, list): не найдено — защита от не-списка отсутствует');
});

test('F03', 'несколько convert_file узлов → оба обработчика присутствуют', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1'), makeConvertFileNode('cf2', {
    convertFileFormat: 'json',
    convertFileOutputVariable: 'json_out',
  })]);
  const code = gen(p, 'F03');
  ok(code.includes('async def handle_callback_cf1('), 'handle_callback_cf1 не найден');
  ok(code.includes('async def handle_callback_cf2('), 'handle_callback_cf2 не найден');
});

test('F04', 'convert_file без других узлов → код генерируется', () => {
  const p = makeCleanProject([makeConvertFileNode('cf1')]);
  const code = gen(p, 'F04');
  ok(code.includes('async def handle_callback_cf1('),
    'handle_callback_cf1 не найден при одиночном узле');
});

test('F05', 'Синтаксис OK при пустом inputVariable', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1', {
    convertFileInputVariable: '',
  })], true);
  const code = genDB(p, 'F05');
  syntax(code, 'F05');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК G: Интеграция
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: Интеграция ──────────────────────────────────────────');

test('G01', 'полный flow /export → psql_query → convert_file → message → все три обработчика присутствуют', () => {
  const msgNode = makeMessageNode('msg-done', 'Готово');
  const cfNode = makeConvertFileNode('cf1', { autoTransitionTo: 'msg-done' });
  const pqNode = {
    id: 'pq1',
    type: 'psql_query',
    position: { x: 200, y: 0 },
    data: {
      query: 'SELECT * FROM users',
      saveResultTo: 'users_data',
      resultFormat: 'json',
      textTemplate: '',
      autoTransitionTo: 'cf1',
      enableAutoTransition: true,
    },
  };
  const cmdNode = makeCommandTriggerNode('cmd-export', '/export', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, cfNode, msgNode], true);
  const code = genDB(p, 'G01');
  ok(code.includes('async def handle_callback_pq1('), 'handle_callback_pq1 не найден');
  ok(code.includes('async def handle_callback_cf1('), 'handle_callback_cf1 не найден');
  ok(code.includes('async def handle_callback_msg_done('), 'handle_callback_msg_done не найден');
});

test('G02', 'тот же flow → синтаксис OK', () => {
  const msgNode = makeMessageNode('msg-done', 'Готово');
  const cfNode = makeConvertFileNode('cf1', { autoTransitionTo: 'msg-done' });
  const pqNode = {
    id: 'pq1',
    type: 'psql_query',
    position: { x: 200, y: 0 },
    data: {
      query: 'SELECT * FROM users',
      saveResultTo: 'users_data',
      resultFormat: 'json',
      textTemplate: '',
      autoTransitionTo: 'cf1',
      enableAutoTransition: true,
    },
  };
  const cmdNode = makeCommandTriggerNode('cmd-export', '/export', 'pq1');
  const p = makeCleanProject([makeStartNode(), cmdNode, pqNode, cfNode, msgNode], true);
  const code = genDB(p, 'G02');
  syntax(code, 'G02');
});

test('G03', 'convert_file + command_trigger → оба обработчика присутствуют', () => {
  const cfNode = makeConvertFileNode('cf1');
  const cmdNode = makeCommandTriggerNode('cmd1', '/convert', 'cf1');
  const p = makeCleanProject([makeStartNode(), cmdNode, cfNode]);
  const code = gen(p, 'G03');
  ok(code.includes('async def handle_callback_cf1('), 'handle_callback_cf1 не найден');
  ok(code.includes('/convert'), 'команда /convert не найдена');
});

test('G04', 'convert_file не генерирует дублирующий обработчик через interactive-callback-handlers', () => {
  const p = makeCleanProject([makeStartNode(), makeConvertFileNode('cf1')]);
  const code = gen(p, 'G04');
  const count = (code.match(/async def handle_callback_cf1\(/g) || []).length;
  ok(count === 1, `handle_callback_cf1 встречается ${count} раз — ожидается ровно 1`);
  ok(!code.includes('# Нет обработчика для узла типа convert_file'),
    'Найден комментарий "# Нет обработчика для узла типа convert_file" — узел не обрабатывается генератором');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
console.log(`║  Итого: ${passed} прошло / ${failed} провалено из ${results.length} тестов`);
console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
if (failed > 0) process.exit(1);
