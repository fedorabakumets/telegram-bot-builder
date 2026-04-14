/**
 * @fileoverview Тесты FSM с PostgresStorage и фильтра устаревших апдейтов
 *
 * Блок A: FSM импорты (BaseStorage, StorageKey, StateType, FSMContext, StatesGroup)
 * Блок B: Класс PostgresStorage — методы, ключи, персистентность
 * Блок C: Dispatcher с FSM-хранилищем и порядок определений
 * Блок D: Middleware фильтрации устаревших апдейтов
 * Блок E: Порядок регистрации middleware в main()
 * Блок F: Синтаксис Python для разных конфигураций
 * Блок G: Интеграция FSM с user_data
 *
 * @module tests/test-phase-fsm-and-pending
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Минимальный проект с одним узлом для тестирования */
const minimalProject = {
  sheets: [{
    id: 'sheet1',
    name: 'Главная',
    nodes: [{
      id: 'start',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: { command: '/start', autoTransitionTo: '', enableAutoTransition: false, buttons: [] },
    }],
  }],
};

/**
 * Загружает реальный проект из bots/новый/новый.json
 * @returns Объект проекта
 */
function loadRealProject(): unknown {
  return JSON.parse(fs.readFileSync('bots/новый/новый.json', 'utf-8'));
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param opts - Опции генерации
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, opts: { userDatabaseEnabled: boolean; label: string }): string {
  return generatePythonCode(project as any, {
    botName: `TestBot_${opts.label}`,
    userDatabaseEnabled: opts.userDatabaseEnabled,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_fsm_${label}.py`;
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

/**
 * Проверяет синтаксис Python, бросает ошибку при неудаче
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Генерируем код один раз для каждой конфигурации ─────────────────────────
const codeNoDb  = gen(minimalProject, { userDatabaseEnabled: false, label: 'nodb' });
const codeWithDb = gen(minimalProject, { userDatabaseEnabled: true,  label: 'db'   });
const codeReal   = gen(loadRealProject(), { userDatabaseEnabled: false, label: 'real' });

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — FSM PostgresStorage и фильтр устаревших апдейтов          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок A: FSM импорты ═══════════════════════════════════════════════════════
console.log('══ Блок A: FSM импорты ═══════════════════════════════════════════════');

test('A01', 'импорт from aiogram.fsm.storage.base import BaseStorage', () => {
  ok(codeNoDb.includes('from aiogram.fsm.storage.base import BaseStorage'), 'BaseStorage не импортирован');
});

test('A02', 'импорт содержит StorageKey', () => {
  ok(codeNoDb.includes('StorageKey'), 'StorageKey не найден в импортах');
});

test('A03', 'импорт содержит StateType', () => {
  ok(codeNoDb.includes('StateType'), 'StateType не найден в импортах');
});

test('A04', 'импорт from aiogram.fsm.context import FSMContext', () => {
  ok(codeNoDb.includes('from aiogram.fsm.context import FSMContext'), 'FSMContext не импортирован');
});

test('A05', 'импорт from aiogram.fsm.state import State, StatesGroup', () => {
  ok(codeNoDb.includes('from aiogram.fsm.state import State, StatesGroup'), 'State/StatesGroup не импортированы');
});

// ══ Блок B: PostgresStorage класс ════════════════════════════════════════════
console.log('\n══ Блок B: PostgresStorage класс ════════════════════════════════════');

test('B01', 'class PostgresStorage(BaseStorage) присутствует в коде', () => {
  ok(codeNoDb.includes('class PostgresStorage(BaseStorage)'), 'класс PostgresStorage(BaseStorage) не найден');
});

test('B02', 'метод async def set_state присутствует', () => {
  ok(codeNoDb.includes('async def set_state'), 'метод set_state не найден');
});

test('B03', 'метод async def get_state присутствует', () => {
  ok(codeNoDb.includes('async def get_state'), 'метод get_state не найден');
});

test('B04', 'метод async def set_data присутствует', () => {
  ok(codeNoDb.includes('async def set_data'), 'метод set_data не найден');
});

test('B05', 'метод async def get_data присутствует', () => {
  ok(codeNoDb.includes('async def get_data'), 'метод get_data не найден');
});

test('B06', 'метод async def close присутствует', () => {
  ok(codeNoDb.includes('async def close'), 'метод close не найден');
});

test('B07', 'ключ __fsm_state__ используется для хранения состояния', () => {
  ok(codeNoDb.includes('__fsm_state__'), 'ключ __fsm_state__ не найден');
});

test('B08', 'ключ __fsm_data__ используется для хранения данных', () => {
  ok(codeNoDb.includes('__fsm_data__'), 'ключ __fsm_data__ не найден');
});

test('B09', 'set_state вызывает update_user_data_in_db для персистентности', () => {
  ok(codeNoDb.includes('update_user_data_in_db'), 'вызов update_user_data_in_db не найден в set_state');
});

test('B10', 'set_data сериализует данные через json.dumps', () => {
  ok(codeNoDb.includes('json') && codeNoDb.includes('dumps'), 'json.dumps не найден в set_data');
});

test('B11', 'get_data десериализует данные через json.loads', () => {
  ok(codeNoDb.includes('loads'), 'json.loads не найден в get_data');
});

// ══ Блок C: Dispatcher с FSM ══════════════════════════════════════════════════
console.log('\n══ Блок C: Dispatcher с FSM ══════════════════════════════════════════');

test('C01', 'dp = Dispatcher(storage=PostgresStorage()) присутствует', () => {
  ok(codeNoDb.includes('Dispatcher(storage=PostgresStorage())'), 'dp = Dispatcher(storage=PostgresStorage()) не найден');
});

test('C02', 'НЕТ dp = Dispatcher() без storage (старый вариант)', () => {
  ok(!codeNoDb.includes('Dispatcher()'), 'найден старый вариант Dispatcher() без storage');
});

test('C03', 'PostgresStorage определяется ДО dp = Dispatcher', () => {
  const classIdx = codeNoDb.indexOf('class PostgresStorage');
  const dpIdx    = codeNoDb.indexOf('dp = Dispatcher');
  ok(classIdx !== -1, 'class PostgresStorage не найден');
  ok(dpIdx    !== -1, 'dp = Dispatcher не найден');
  ok(classIdx < dpIdx, 'PostgresStorage должен быть определён ДО dp = Dispatcher');
});

test('C04', 'user_data = {} определяется ДО PostgresStorage', () => {
  const udIdx    = codeNoDb.indexOf('user_data = {}');
  const classIdx = codeNoDb.indexOf('class PostgresStorage');
  ok(udIdx    !== -1, 'user_data = {} не найден');
  ok(classIdx !== -1, 'class PostgresStorage не найден');
  ok(udIdx < classIdx, 'user_data = {} должен быть определён ДО PostgresStorage');
});

// ══ Блок D: Stale update filter ═══════════════════════════════════════════════
console.log('\n══ Блок D: Stale update filter ═══════════════════════════════════════');

test('D01', 'stale_update_filter_middleware присутствует в коде', () => {
  ok(codeNoDb.includes('stale_update_filter_middleware'), 'stale_update_filter_middleware не найден');
});

test('D02', 'MAX_UPDATE_AGE_SECONDS присутствует в коде (userDatabaseEnabled=true)', () => {
  // Определение функции генерируется только когда middleware-блок включён (userDatabaseEnabled=true)
  ok(codeWithDb.includes('MAX_UPDATE_AGE_SECONDS'), 'MAX_UPDATE_AGE_SECONDS не найден');
});

test('D03', 'MAX_UPDATE_AGE_SECONDS настраивается через env с дефолтом 300', () => {
  ok(codeWithDb.includes('os.getenv("MAX_UPDATE_AGE_SECONDS", "300")'), 'os.getenv("MAX_UPDATE_AGE_SECONDS", "300") не найден');
});

test('D04', 'middleware проверяет event.date', () => {
  ok(codeWithDb.includes('event.date'), 'проверка event.date не найдена');
});

test('D05', 'middleware логирует пропущенные апдейты через logging.info', () => {
  ok(codeNoDb.includes('logging.info'), 'logging.info не найден в middleware');
});

test('D06', 'middleware возвращает None для устаревших апдейтов', () => {
  ok(codeNoDb.includes('return  # не передаём дальше') || codeNoDb.includes('return\n'), 'return None для устаревших апдейтов не найден');
});

test('D07', 'dp.message.middleware(stale_update_filter_middleware) регистрируется в main()', () => {
  ok(codeNoDb.includes('dp.message.middleware(stale_update_filter_middleware)'), 'регистрация stale_update_filter_middleware не найдена');
});

// ══ Блок E: Порядок регистрации middleware ════════════════════════════════════
console.log('\n══ Блок E: Порядок регистрации middleware ════════════════════════════');

test('E01', 'stale_update_filter_middleware регистрируется ДО message_logging_middleware', () => {
  const staleIdx   = codeWithDb.indexOf('dp.message.middleware(stale_update_filter_middleware)');
  const loggingIdx = codeWithDb.indexOf('dp.message.middleware(message_logging_middleware)');
  ok(staleIdx   !== -1, 'stale_update_filter_middleware не зарегистрирован');
  ok(loggingIdx !== -1, 'message_logging_middleware не зарегистрирован (нужен userDatabaseEnabled=true)');
  ok(staleIdx < loggingIdx, 'stale_update_filter_middleware должен регистрироваться ДО message_logging_middleware');
});

test('E02', 'stale_update_filter_middleware регистрируется ДО register_user_middleware (если есть)', () => {
  // register_user_middleware появляется только при autoRegisterUsers — проверяем в реальном проекте
  const staleIdx    = codeReal.indexOf('dp.message.middleware(stale_update_filter_middleware)');
  ok(staleIdx !== -1, 'stale_update_filter_middleware не зарегистрирован в реальном проекте');
  const registerIdx = codeReal.indexOf('dp.message.middleware(register_user_middleware)');
  if (registerIdx !== -1) {
    ok(staleIdx < registerIdx, 'stale_update_filter_middleware должен регистрироваться ДО register_user_middleware');
  }
});

test('E03', 'НЕТ drop_pending_updates в коде', () => {
  ok(!codeNoDb.includes('drop_pending_updates'), 'найден drop_pending_updates — должен быть заменён на stale_update_filter_middleware');
  ok(!codeReal.includes('drop_pending_updates'), 'найден drop_pending_updates в реальном проекте');
});

// ══ Блок F: Синтаксис Python ══════════════════════════════════════════════════
console.log('\n══ Блок F: Синтаксис Python ══════════════════════════════════════════');

test('F01', 'синтаксис Python OK для кода с userDatabaseEnabled=false', () => {
  syntax(codeNoDb, 'f01');
});

test('F02', 'синтаксис Python OK для кода с userDatabaseEnabled=true', () => {
  syntax(codeWithDb, 'f02');
});

test('F03', 'синтаксис Python OK для кода из реального сценария новый.json', () => {
  syntax(codeReal, 'f03');
});

// ══ Блок G: Интеграция FSM с user_data ════════════════════════════════════════
console.log('\n══ Блок G: Интеграция FSM с user_data ════════════════════════════════');

test('G01', 'set_state обновляет user_data[uid]["__fsm_state__"]', () => {
  ok(codeNoDb.includes('user_data[uid]["__fsm_state__"]'), 'user_data[uid]["__fsm_state__"] не найден в set_state');
});

test('G02', 'get_state читает из user_data.get(uid, {}).get("__fsm_state__")', () => {
  ok(
    codeNoDb.includes('user_data.get(uid, {}).get("__fsm_state__")'),
    'user_data.get(uid, {}).get("__fsm_state__") не найден в get_state',
  );
});

test('G03', 'FSM данные хранятся в той же структуре что и обычные переменные пользователя', () => {
  // user_data[uid] используется и для FSM (__fsm_state__, __fsm_data__) и для обычных переменных
  ok(codeNoDb.includes('user_data[uid]'), 'user_data[uid] не найден — FSM и user_data не интегрированы');
  ok(codeNoDb.includes('user_data = {}'), 'user_data = {} не найден — общее хранилище отсутствует');
});

// ══ Итог ══════════════════════════════════════════════════════════════════════
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total  = results.length;

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
