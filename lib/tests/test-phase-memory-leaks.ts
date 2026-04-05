/**
 * @fileoverview Фаза — Утечки памяти (Memory Leaks)
 *
 * Тестирует три исправления утечек памяти:
 *  1. USER_DATA_TTL + _user_last_seen + cleanup_user_data (utils.py.jinja2)
 *  2. asyncio.create_task(cleanup_user_data()) в main() (main.py.jinja2)
 *  3. signal_handler использует loop.stop() вместо sys.exit(0) (main.py.jinja2)
 *  4. templateCache ограничен MAX_CACHE_SIZE = 100 (template-renderer.ts)
 *
 * Блоки:
 *  A. USER_DATA_TTL константа (10 тестов)
 *  B. _user_last_seen словарь (10 тестов)
 *  C. cleanup_user_data функция (15 тестов)
 *  D. asyncio.create_task(cleanup_user_data()) в main() (10 тестов)
 *  E. signal_handler — loop.stop() вместо sys.exit() (15 тестов)
 *  F. finally блок — корректное закрытие соединений (10 тестов)
 *  G. templateCache ограничение (10 тестов)
 *  H. Комбинации — полные проекты (15 тестов)
 *  I. Регрессия — старые паттерны отсутствуют (10 тестов)
 *  J. Граничные случаи (10 тестов)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { renderPartialTemplate } from '../templates/template-renderer.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

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
 * Создаёт узел типа text_trigger
 * @param id - Идентификатор узла
 * @param synonyms - Список синонимов
 * @param targetId - ID целевого узла
 */
function makeTextTriggerNode(id: string, synonyms: string[], targetId: string) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: synonyms,
      textMatchType: 'exact',
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

/**
 * Создаёт узел типа media
 * @param id - Идентификатор узла
 * @param media - Список медиафайлов
 */
function makeMediaNode(id: string, media: string[]) {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: { attachedMedia: media, buttons: [], keyboardType: 'none', enableAutoTransition: false, autoTransitionTo: '' },
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
    activeSheetId: 'sheet-ml',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-ml',
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
 * @param userDatabaseEnabled - Включить БД
 */
function gen(project: any, label: string, userDatabaseEnabled = false): string {
  return generatePythonCode(project, {
    botName: `MemLeak_${label}`,
    userDatabaseEnabled,
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
    botName: `MemLeakDB_${label}`,
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
  const tmp = `_tmp_ml_${label}.py`;
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

// ─── Четыре ключевых фикса ───────────────────────────────────────────────────

/** Проверяет наличие всех четырёх исправлений утечек памяти в коде */
function hasFourFixes(code: string): void {
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует');
  ok(code.includes('cleanup_user_data'), 'cleanup_user_data отсутствует');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'asyncio.create_task(cleanup_user_data()) отсутствует');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'asyncio.get_running_loop().stop() отсутствует');
}

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: USER_DATA_TTL константа
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║       Фаза — Утечки памяти (Memory Leaks)                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: USER_DATA_TTL константа ─────────────────────────────');

test('A01', 'USER_DATA_TTL = 3600 присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'A01');
  ok(code.includes('USER_DATA_TTL = 3600'), 'USER_DATA_TTL = 3600 не найдено');
});

test('A02', 'USER_DATA_TTL присутствует при userDatabaseEnabled: true', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'A02');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при DB=true');
});

test('A03', 'USER_DATA_TTL присутствует при userDatabaseEnabled: false', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'A03');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при DB=false');
});

test('A04', 'USER_DATA_TTL присутствует при проекте с inline кнопками', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'A04');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при inline кнопках');
});

test('A05', 'USER_DATA_TTL присутствует при проекте с reply кнопками', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: 'Меню', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'A05');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при reply кнопках');
});

test('A06', 'USER_DATA_TTL присутствует при проекте с command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'A06');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при command_trigger');
});

test('A07', 'USER_DATA_TTL присутствует при проекте с text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет', 'hello'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'A07');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при text_trigger');
});

test('A08', 'USER_DATA_TTL присутствует при проекте с condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'user_name', [
      { value: 'admin', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Привет, admin!'),
    makeMessageNode('msg2', 'Привет!'),
  ]);
  const code = gen(p, 'A08');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при condition');
});

test('A09', 'USER_DATA_TTL присутствует при проекте с media узлом', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['photo_id_123']),
  ]);
  const code = gen(p, 'A09');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует при media узле');
});

test('A10', 'Синтаксис Python OK при наличии USER_DATA_TTL', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'A10');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL отсутствует');
  syntax(code, 'A10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: _user_last_seen словарь
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: _user_last_seen словарь ─────────────────────────────');

test('B01', '_user_last_seen: dict[int, float] = {} присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B01');
  ok(code.includes('_user_last_seen: dict[int, float] = {}'), '_user_last_seen: dict[int, float] = {} не найдено');
});

test('B02', '_user_last_seen присутствует при DB включён', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'B02');
  ok(code.includes('_user_last_seen'), '_user_last_seen отсутствует при DB=true');
});

test('B03', '_user_last_seen присутствует при DB выключен', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'B03');
  ok(code.includes('_user_last_seen'), '_user_last_seen отсутствует при DB=false');
});

test('B04', '_user_last_seen[user_id] = time.monotonic() присутствует в init_user_variables', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B04');
  ok(code.includes('_user_last_seen[user_id] = time.monotonic()'), '_user_last_seen[user_id] = time.monotonic() не найдено');
});

test('B05', '_user_last_seen обновляется в теле init_user_variables', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B05');
  const initIdx = code.indexOf('async def init_user_variables');
  ok(initIdx !== -1, 'init_user_variables не найдена');
  const afterInit = code.slice(initIdx, initIdx + 600);
  ok(afterInit.includes('_user_last_seen'), '_user_last_seen не найден в теле init_user_variables');
});

test('B06', '_user_last_seen.items() используется в cleanup_user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B06');
  ok(code.includes('_user_last_seen.items()'), '_user_last_seen.items() не найдено');
});

test('B07', '_user_last_seen.pop(uid, None) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B07');
  ok(code.includes('_user_last_seen.pop(uid, None)'), '_user_last_seen.pop(uid, None) не найдено');
});

test('B08', '_user_last_seen присутствует при проекте с adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'B08');
  ok(code.includes('_user_last_seen'), '_user_last_seen отсутствует при adminOnly');
});

test('B09', '_user_last_seen присутствует при проекте с requiresAuth', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'B09');
  ok(code.includes('_user_last_seen'), '_user_last_seen отсутствует при requiresAuth');
});

test('B10', 'Синтаксис Python OK при наличии _user_last_seen', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B10');
  ok(code.includes('_user_last_seen'), '_user_last_seen отсутствует');
  syntax(code, 'B10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: cleanup_user_data функция
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: cleanup_user_data функция ───────────────────────────');

test('C01', 'async def cleanup_user_data() присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C01');
  ok(code.includes('async def cleanup_user_data()'), 'async def cleanup_user_data() не найдено');
});

test('C02', 'cleanup_user_data содержит while True:', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C02');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data не найдена');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('while True:'), 'while True: не найдено в cleanup_user_data');
});

test('C03', 'cleanup_user_data содержит await asyncio.sleep(USER_DATA_TTL)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C03');
  ok(code.includes('await asyncio.sleep(USER_DATA_TTL)'), 'await asyncio.sleep(USER_DATA_TTL) не найдено');
});

test('C04', 'cleanup_user_data содержит time.monotonic()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C04');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data не найдена');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('time.monotonic()'), 'time.monotonic() не найдено в cleanup_user_data');
});

test('C05', 'cleanup_user_data содержит user_data.pop(uid, None)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C05');
  ok(code.includes('user_data.pop(uid, None)'), 'user_data.pop(uid, None) не найдено');
});

test('C06', 'cleanup_user_data содержит _user_last_seen.pop(uid, None)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C06');
  ok(code.includes('_user_last_seen.pop(uid, None)'), '_user_last_seen.pop(uid, None) не найдено');
});

test('C07', 'cleanup_user_data содержит logging.debug', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C07');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data не найдена');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('logging.debug'), 'logging.debug не найдено в cleanup_user_data');
});

test('C08', 'cleanup_user_data содержит TTL-очистка user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C08');
  ok(code.includes('TTL-очистка user_data'), 'TTL-очистка user_data не найдено');
});

test('C09', 'cleanup_user_data присутствует при DB включён', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'C09');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует при DB=true');
});

test('C10', 'cleanup_user_data присутствует при DB выключен', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'C10');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует при DB=false');
});

test('C11', 'cleanup_user_data присутствует при проекте с inline кнопками', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'C11');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует при inline кнопках');
});

test('C12', 'cleanup_user_data присутствует при проекте с 10 узлами', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 9; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `Сообщение ${i}`));
  }
  const p = makeCleanProject(nodes);
  const code = gen(p, 'C12');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует при 10 узлах');
});

test('C13', 'cleanup_user_data присутствует при проекте с command_trigger + message', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Привет!'),
  ]);
  const code = gen(p, 'C13');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует при command_trigger');
});

test('C14', 'cleanup_user_data присутствует при проекте с condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'score', [
      { value: '100', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Победа!'),
    makeMessageNode('msg2', 'Попробуй ещё'),
  ]);
  const code = gen(p, 'C14');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует при condition');
});

test('C15', 'Синтаксис Python OK при наличии cleanup_user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C15');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data отсутствует');
  syntax(code, 'C15');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: asyncio.create_task(cleanup_user_data()) в main()
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: asyncio.create_task(cleanup_user_data()) в main() ───');

test('D01', 'asyncio.create_task(cleanup_user_data()) присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D01');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'asyncio.create_task(cleanup_user_data()) не найдено');
});

test('D02', 'Вызов находится внутри async def main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D02');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() не найдена');
  const mainBody = code.slice(mainIdx, mainIdx + 2000);
  ok(mainBody.includes('asyncio.create_task(cleanup_user_data())'), 'create_task не найден внутри main()');
});

test('D03', 'Вызов присутствует при DB включён', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'D03');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при DB=true');
});

test('D04', 'Вызов присутствует при DB выключен', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'D04');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при DB=false');
});

test('D05', 'Вызов присутствует при проекте с inline кнопками', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'D05');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при inline кнопках');
});

test('D06', 'Вызов присутствует при проекте с command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'D06');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при command_trigger');
});

test('D07', 'Вызов присутствует при проекте с text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['да', 'нет'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'D07');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при text_trigger');
});

test('D08', 'Вызов присутствует при проекте с adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'D08');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при adminOnly');
});

test('D09', 'Вызов присутствует при проекте с requiresAuth', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'D09');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует при requiresAuth');
});

test('D10', 'Синтаксис Python OK при наличии create_task', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D10');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task отсутствует');
  syntax(code, 'D10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК E: signal_handler — loop.stop() вместо sys.exit()
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: signal_handler — loop.stop() вместо sys.exit() ─────');

test('E01', 'asyncio.get_running_loop().stop() присутствует в коде', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E01');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'asyncio.get_running_loop().stop() не найдено');
});

test('E02', 'sys.exit(0) НЕ присутствует в signal_handler', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E02');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler не найден');
  // Берём тело функции (до следующей def на том же уровне)
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(!handlerBody.includes('sys.exit(0)'), 'sys.exit(0) найдено в signal_handler — регрессия!');
});

test('E03', 'signal_handler содержит try: блок', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E03');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler не найден');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(handlerBody.includes('try:'), 'try: не найдено в signal_handler');
});

test('E04', 'signal_handler содержит except RuntimeError:', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E04');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler не найден');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(handlerBody.includes('except RuntimeError:'), 'except RuntimeError: не найдено в signal_handler');
});

test('E05', 'signal_handler содержит pass после except', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E05');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler не найден');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(handlerBody.includes('pass'), 'pass не найдено в signal_handler');
});

test('E06', 'signal.signal(signal.SIGTERM, signal_handler) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E06');
  ok(code.includes('signal.signal(signal.SIGTERM, signal_handler)'), 'SIGTERM регистрация не найдена');
});

test('E07', 'signal.signal(signal.SIGINT, signal_handler) присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E07');
  ok(code.includes('signal.signal(signal.SIGINT, signal_handler)'), 'SIGINT регистрация не найдена');
});

test('E08', 'signal_handler присутствует при DB включён', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'E08');
  ok(code.includes('def signal_handler'), 'signal_handler отсутствует при DB=true');
});

test('E09', 'signal_handler присутствует при DB выключен', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'E09');
  ok(code.includes('def signal_handler'), 'signal_handler отсутствует при DB=false');
});

test('E10', 'asyncio.get_running_loop().stop() присутствует при inline кнопках', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'E10');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'loop.stop() отсутствует при inline кнопках');
});

test('E11', 'asyncio.get_running_loop().stop() присутствует при command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'E11');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'loop.stop() отсутствует при command_trigger');
});

test('E12', 'asyncio.get_running_loop().stop() присутствует при text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['стоп', 'stop'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'E12');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'loop.stop() отсутствует при text_trigger');
});

test('E13', 'asyncio.get_running_loop().stop() присутствует при condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'level', [
      { value: '1', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Уровень 1'),
    makeMessageNode('msg2', 'Другой уровень'),
  ]);
  const code = gen(p, 'E13');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'loop.stop() отсутствует при condition');
});

test('E14', 'asyncio.get_running_loop().stop() присутствует при media', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['AgACAgIAAxkBAAIBcmJ']),
  ]);
  const code = gen(p, 'E14');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'loop.stop() отсутствует при media');
});

test('E15', 'Синтаксис Python OK при наличии signal_handler с loop.stop()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E15');
  ok(code.includes('asyncio.get_running_loop().stop()'), 'loop.stop() отсутствует');
  syntax(code, 'E15');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК F: finally блок — корректное закрытие соединений
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: finally блок — корректное закрытие соединений ───────');

test('F01', 'finally: присутствует в main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F01');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() не найдена');
  const mainBody = code.slice(mainIdx, mainIdx + 3000);
  ok(mainBody.includes('finally:'), 'finally: не найдено в main()');
});

test('F02', 'await bot.session.close() присутствует в finally', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F02');
  ok(code.includes('await bot.session.close()'), 'await bot.session.close() не найдено');
});

test('F03', 'При DB включён: await db_pool.close() присутствует в finally', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'F03');
  ok(code.includes('await db_pool.close()'), 'await db_pool.close() не найдено при DB=true');
});

test('F04', 'При DB выключен: db_pool.close() НЕ присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'F04');
  ok(!code.includes('db_pool.close()'), 'db_pool.close() найдено при DB=false — лишний код');
});

test('F05', 'finally идёт ПОСЛЕ except блоков (порядок индексов)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F05');
  const exceptIdx = code.indexOf('except KeyboardInterrupt:');
  const finallyIdx = code.indexOf('finally:');
  ok(exceptIdx !== -1, 'except KeyboardInterrupt: не найдено');
  ok(finallyIdx !== -1, 'finally: не найдено');
  ok(finallyIdx > exceptIdx, 'finally должен идти после except');
});

test('F06', 'finally присутствует при проекте с inline кнопками', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'F06');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: отсутствует при inline кнопках');
});

test('F07', 'finally присутствует при проекте с command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'F07');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: отсутствует при command_trigger');
});

test('F08', 'finally присутствует при проекте с text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'F08');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: отсутствует при text_trigger');
});

test('F09', 'finally присутствует при проекте с adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'F09');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: отсутствует при adminOnly');
});

test('F10', 'Синтаксис Python OK при наличии finally блока', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'F10');
  ok(code.includes('finally:'), 'finally: отсутствует');
  syntax(code, 'F10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК G: templateCache ограничение
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: templateCache ограничение ───────────────────────────');

test('G01', 'MAX_CACHE_SIZE = 100 присутствует в исходнике template-renderer.ts', () => {
  const src = fs.readFileSync('lib/templates/template-renderer.ts', 'utf-8');
  ok(src.includes('MAX_CACHE_SIZE = 100'), 'MAX_CACHE_SIZE = 100 не найдено в template-renderer.ts');
});

test('G02', 'renderPartialTemplate 5 раз с разными шаблонами не падает', () => {
  const templates = [
    ['utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false }],
    ['utils/utils.py.jinja2', { adminOnly: true, userDatabaseEnabled: false }],
    ['utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: true }],
    ['main/main.py.jinja2', { userDatabaseEnabled: false, menuCommands: [], autoRegisterUsers: false, incomingMessageTriggerMiddlewares: [], hasInlineButtons: false }],
    ['main/main.py.jinja2', { userDatabaseEnabled: true, menuCommands: [], autoRegisterUsers: false, incomingMessageTriggerMiddlewares: [], hasInlineButtons: false }],
  ] as const;
  for (const [tmpl, ctx] of templates) {
    const result = renderPartialTemplate(tmpl, ctx as any);
    ok(typeof result === 'string' && result.length > 0, `renderPartialTemplate(${tmpl}) вернул пустой результат`);
  }
});

test('G03', 'renderPartialTemplate с одним шаблоном дважды возвращает одинаковый результат', () => {
  const ctx = { adminOnly: false, userDatabaseEnabled: false };
  const r1 = renderPartialTemplate('utils/utils.py.jinja2', ctx);
  const r2 = renderPartialTemplate('utils/utils.py.jinja2', ctx);
  ok(r1 === r2, 'Два вызова с одинаковым контекстом вернули разные результаты');
});

test('G04', 'renderPartialTemplate utils/utils.py.jinja2 содержит cleanup_user_data', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('cleanup_user_data'), 'cleanup_user_data не найдено в utils.py.jinja2');
});

test('G05', 'renderPartialTemplate utils/utils.py.jinja2 с adminOnly:true содержит is_admin', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: true, userDatabaseEnabled: false });
  ok(result.includes('is_admin'), 'is_admin не найдено при adminOnly:true');
});

test('G06', 'renderPartialTemplate main/main.py.jinja2 содержит cleanup_user_data', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(result.includes('cleanup_user_data'), 'cleanup_user_data не найдено в main.py.jinja2');
});

test('G07', 'renderPartialTemplate main/main.py.jinja2 содержит asyncio.get_running_loop().stop()', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(result.includes('asyncio.get_running_loop().stop()'), 'loop.stop() не найдено в main.py.jinja2');
});

test('G08', 'renderPartialTemplate main/main.py.jinja2 НЕ содержит sys.exit(0)', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(!result.includes('sys.exit(0)'), 'sys.exit(0) найдено в main.py.jinja2 — регрессия!');
});

test('G09', 'renderPartialTemplate utils/utils.py.jinja2 содержит USER_DATA_TTL', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('USER_DATA_TTL'), 'USER_DATA_TTL не найдено в utils.py.jinja2');
});

test('G10', 'renderPartialTemplate utils/utils.py.jinja2 содержит _user_last_seen', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('_user_last_seen'), '_user_last_seen не найдено в utils.py.jinja2');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК H: Комбинации — полные проекты
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок H: Комбинации — полные проекты ─────────────────────────');

test('H01', 'Проект: start + message → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H01'));
});

test('H02', 'Проект: command_trigger + message → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  hasFourFixes(gen(p, 'H02'));
});

test('H03', 'Проект: text_trigger + message → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет', 'hi'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  hasFourFixes(gen(p, 'H03'));
});

test('H04', 'Проект: start + condition + message → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'age', [
      { value: '18', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Взрослый'),
    makeMessageNode('msg2', 'Несовершеннолетний'),
  ]);
  hasFourFixes(gen(p, 'H04'));
});

test('H05', 'Проект: start + inline keyboard + message → все 4 фикса присутствуют', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H05'));
});

test('H06', 'Проект: start + reply keyboard + message → все 4 фикса присутствуют', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: 'Меню', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H06'));
});

test('H07', 'Проект с DB: start + message → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  hasFourFixes(genDB(p, 'H07'));
});

test('H08', 'Проект с DB: command_trigger + message → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ], true);
  hasFourFixes(genDB(p, 'H08'));
});

test('H09', 'Проект с DB + inline: start + message → все 4 фикса присутствуют', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')], true);
  hasFourFixes(genDB(p, 'H09'));
});

test('H10', 'Проект: 5 command_trigger + 5 message → все 4 фикса присутствуют', () => {
  const nodes: any[] = [];
  for (let i = 1; i <= 5; i++) {
    nodes.push(makeCommandTriggerNode(`cmd${i}`, `/cmd${i}`, `msg${i}`));
    nodes.push(makeMessageNode(`msg${i}`, `Ответ на команду ${i}`));
  }
  const p = makeCleanProject(nodes);
  hasFourFixes(gen(p, 'H10'));
});

test('H11', 'Проект: adminOnly + requiresAuth → все 4 фикса присутствуют', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/secret', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1', 'Секретный раздел')]);
  hasFourFixes(gen(p, 'H11'));
});

test('H12', 'Проект: media узел → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['photo_id_abc123']),
  ]);
  hasFourFixes(gen(p, 'H12'));
});

test('H13', 'Проект: forward_message → все 4 фикса присутствуют', () => {
  const fwd = {
    id: 'fwd1',
    type: 'forward_message',
    position: { x: 400, y: 0 },
    data: { fromChatId: '-100123456789', messageId: '42', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([makeStartNode(), fwd]);
  hasFourFixes(gen(p, 'H13'));
});

test('H14', 'Проект: incoming_message_trigger → все 4 фикса присутствуют', () => {
  const trigger = {
    id: 'imt1',
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { variableName: 'user_input', autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([makeStartNode(), trigger, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H14'));
});

test('H15', 'Проект: все типы узлов вместе → синтаксис OK + все 4 фикса', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg1' }],
  } as any;
  const nodes: any[] = [
    start,
    makeMessageNode('msg1', 'Привет!'),
    makeCommandTriggerNode('cmd1', '/help', 'msg2'),
    makeMessageNode('msg2', 'Помощь'),
    makeTextTriggerNode('txt1', ['стоп'], 'msg3'),
    makeMessageNode('msg3', 'Стоп'),
    makeConditionNode('cond1', 'score', [
      { value: '10', targetNodeId: 'msg4' },
      { value: '__else__', targetNodeId: 'msg5' },
    ]),
    makeMessageNode('msg4', 'Победа'),
    makeMessageNode('msg5', 'Проигрыш'),
    makeMediaNode('media1', ['photo_id_xyz']),
  ];
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'H15');
  hasFourFixes(code);
  syntax(code, 'H15');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК I: Регрессия — старые паттерны отсутствуют
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок I: Регрессия — старые паттерны отсутствуют ─────────────');

test('I01', 'sys.exit(0) НЕ присутствует нигде в сгенерированном коде', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I01');
  ok(!code.includes('sys.exit(0)'), 'sys.exit(0) найдено в коде — регрессия!');
});

test('I02', 'import sys внутри signal_handler НЕ присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I02');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler не найден');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(!handlerBody.includes('import sys'), 'import sys найдено внутри signal_handler — регрессия!');
});

test('I03', 'user_data не используется без _user_last_seen (нет бесконечного роста)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I03');
  ok(code.includes('user_data'), 'user_data не найдено в коде');
  ok(code.includes('_user_last_seen'), '_user_last_seen не найдено — нет защиты от утечки');
});

test('I04', 'cleanup_user_data НЕ отсутствует ни в одном из 5 разных проектов', () => {
  const projects = [
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')]),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/start', 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeTextTriggerNode('txt1', ['привет'], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMediaNode('media1', ['photo_id'])]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true),
  ];
  for (let i = 0; i < projects.length; i++) {
    const code = i === 4 ? genDB(projects[i], `I04_${i}`) : gen(projects[i], `I04_${i}`);
    ok(code.includes('cleanup_user_data'), `cleanup_user_data отсутствует в проекте #${i + 1}`);
  }
});

test('I05', 'asyncio.create_task вызывается ровно 1 раз в main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I05');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() не найдена');
  const mainBody = code.slice(mainIdx, mainIdx + 3000);
  const count = (mainBody.match(/asyncio\.create_task\(cleanup_user_data\(\)\)/g) || []).length;
  ok(count === 1, `asyncio.create_task(cleanup_user_data()) вызывается ${count} раз(а), ожидается 1`);
});

test('I06', 'signal_handler определён ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I06');
  const count = (code.match(/def signal_handler/g) || []).length;
  ok(count === 1, `signal_handler определён ${count} раз(а), ожидается 1`);
});

test('I07', 'USER_DATA_TTL определён ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I07');
  const count = (code.match(/USER_DATA_TTL = 3600/g) || []).length;
  ok(count === 1, `USER_DATA_TTL = 3600 определён ${count} раз(а), ожидается 1`);
});

test('I08', '_user_last_seen определён ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I08');
  const count = (code.match(/_user_last_seen: dict\[int, float\] = \{\}/g) || []).length;
  ok(count === 1, `_user_last_seen: dict[int, float] = {} определён ${count} раз(а), ожидается 1`);
});

test('I09', 'cleanup_user_data определён ровно 1 раз', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I09');
  const count = (code.match(/async def cleanup_user_data\(\)/g) || []).length;
  ok(count === 1, `async def cleanup_user_data() определён ${count} раз(а), ожидается 1`);
});

test('I10', 'Синтаксис Python OK для 10 разных проектов подряд', () => {
  const projects = [
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')]),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/start', 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeTextTriggerNode('txt1', ['привет'], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMediaNode('media1', ['photo_id'])]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/help', 'msg1'), makeMessageNode('msg1')], true),
    makeCleanProject([
      makeStartNode(),
      makeConditionNode('cond1', 'x', [{ value: '1', targetNodeId: 'msg1' }, { value: '__else__', targetNodeId: 'msg2' }]),
      makeMessageNode('msg1', 'Да'),
      makeMessageNode('msg2', 'Нет'),
    ]),
    makeCleanProject([makeTextTriggerNode('txt1', ['стоп', 'stop', 'выход'], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1', '🎉 Привет!')]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1', 'Текст с "кавычками" и \'апострофами\'')]),
  ];
  for (let i = 0; i < projects.length; i++) {
    const code = i === 4 || i === 5 ? genDB(projects[i], `I10_${i}`) : gen(projects[i], `I10_${i}`);
    syntax(code, `I10_${i}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК J: Граничные случаи
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок J: Граничные случаи ────────────────────────────────────');

test('J01', 'Пустой проект (нет узлов) → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([]);
  hasFourFixes(gen(p, 'J01'));
});

test('J02', 'Проект только с keyboard узлом → все 4 фикса присутствуют', () => {
  const kbd = {
    id: 'kbd1',
    type: 'keyboard',
    position: { x: 0, y: 0 },
    data: { keyboardType: 'reply', buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'kbd1' }] },
  };
  const p = makeCleanProject([kbd]);
  hasFourFixes(gen(p, 'J02'));
});

test('J03', 'Проект с 20 узлами → синтаксис OK + все 4 фикса', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 19; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `Сообщение номер ${i}`));
  }
  const p = makeCleanProject(nodes);
  const code = gen(p, 'J03');
  hasFourFixes(code);
  syntax(code, 'J03');
});

test('J04', 'Проект с Unicode в текстах → все 4 фикса присутствуют', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMessageNode('msg1', '🎉 Привет! 你好 مرحبا 🚀 Ñoño'),
    makeMessageNode('msg2', '日本語テスト한국어테스트'),
  ]);
  hasFourFixes(gen(p, 'J04'));
});

test('J05', 'Проект с очень длинными ID узлов → все 4 фикса присутствуют', () => {
  const longId1 = 'node_' + 'a'.repeat(50);
  const longId2 = 'node_' + 'b'.repeat(50);
  const p = makeCleanProject([
    makeStartNode(longId1),
    makeMessageNode(longId2, 'Ответ'),
  ]);
  hasFourFixes(gen(p, 'J05'));
});

test('J06', 'Проект с adminOnly на всех узлах → все 4 фикса присутствуют', () => {
  const cmd1 = makeCommandTriggerNode('cmd1', '/admin1', 'msg1');
  const cmd2 = makeCommandTriggerNode('cmd2', '/admin2', 'msg2');
  cmd1.data = { ...cmd1.data, adminOnly: true } as any;
  cmd2.data = { ...cmd2.data, adminOnly: true } as any;
  const p = makeCleanProject([
    cmd1, makeMessageNode('msg1', 'Раздел 1'),
    cmd2, makeMessageNode('msg2', 'Раздел 2'),
  ]);
  hasFourFixes(gen(p, 'J06'));
});

test('J07', 'Проект с requiresAuth на всех узлах → все 4 фикса присутствуют', () => {
  const cmd1 = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  const cmd2 = makeCommandTriggerNode('cmd2', '/settings', 'msg2');
  cmd1.data = { ...cmd1.data, requiresAuth: true } as any;
  cmd2.data = { ...cmd2.data, requiresAuth: true } as any;
  const p = makeCleanProject([
    cmd1, makeMessageNode('msg1', 'Профиль'),
    cmd2, makeMessageNode('msg2', 'Настройки'),
  ]);
  hasFourFixes(gen(p, 'J07'));
});

test('J08', 'Проект с DB + 10 узлов → синтаксис OK + все 4 фикса', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 9; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `Сообщение ${i}`));
  }
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'J08');
  hasFourFixes(code);
  syntax(code, 'J08');
});

test('J09', 'Проект с multi-sheet (несколько листов) → все 4 фикса присутствуют', () => {
  const p = {
    version: 2,
    activeSheetId: 'sheet1',
    userDatabaseEnabled: false,
    sheets: [
      {
        id: 'sheet1',
        name: 'Лист 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { zoom: 1, position: { x: 0, y: 0 } },
        nodes: [makeStartNode(), makeMessageNode('msg1', 'Лист 1')],
      },
      {
        id: 'sheet2',
        name: 'Лист 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { zoom: 1, position: { x: 0, y: 0 } },
        nodes: [makeCommandTriggerNode('cmd1', '/help', 'msg2'), makeMessageNode('msg2', 'Помощь')],
      },
    ],
  };
  hasFourFixes(gen(p, 'J09'));
});

test('J10', 'Финальный мегатест: все типы + DB + adminOnly + requiresAuth → синтаксис OK + все 4 фикса', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg1' }],
  } as any;
  const cmdAdmin = makeCommandTriggerNode('cmd_admin', '/admin', 'msg_admin');
  cmdAdmin.data = { ...cmdAdmin.data, adminOnly: true } as any;
  const cmdAuth = makeCommandTriggerNode('cmd_auth', '/profile', 'msg_auth');
  cmdAuth.data = { ...cmdAuth.data, requiresAuth: true } as any;
  const nodes: any[] = [
    start,
    makeMessageNode('msg1', 'Добро пожаловать! 🎉'),
    cmdAdmin,
    makeMessageNode('msg_admin', 'Панель администратора'),
    cmdAuth,
    makeMessageNode('msg_auth', 'Ваш профиль'),
    makeTextTriggerNode('txt1', ['помощь', 'help', '?'], 'msg_help'),
    makeMessageNode('msg_help', 'Справка по боту'),
    makeConditionNode('cond1', 'user_level', [
      { value: 'vip', targetNodeId: 'msg_vip' },
      { value: '__else__', targetNodeId: 'msg_regular' },
    ]),
    makeMessageNode('msg_vip', '⭐ VIP-раздел'),
    makeMessageNode('msg_regular', 'Обычный раздел'),
    makeMediaNode('media1', ['photo_id_welcome_banner']),
  ];
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'J10');
  hasFourFixes(code);
  syntax(code, 'J10');
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
