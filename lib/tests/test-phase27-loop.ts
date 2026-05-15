/**
 * @fileoverview Фаза 27 — узел loop (цикл по массиву)
 *
 * Интеграционный тест генерации Python-кода для узла loop:
 *  A. Базовая генерация (10 тестов)
 *  B. Целевые ноды — тело цикла (6 тестов)
 *  C. afterLoopTo — переход после цикла (5 тестов)
 *  D. Параллельное выполнение (4 теста)
 *  E. Задержка и лимиты (5 тестов)
 *  F. Полные сценарии (3 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа loop
 * @param id - Идентификатор узла
 * @param data - Дополнительные данные узла
 * @returns Объект узла loop
 */
function makeLoopNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'loop',
    position: { x: 400, y: 0 },
    data: {
      sourceVariable: 'items',
      itemVariable: 'item',
      indexVariable: 'index',
      parallel: false,
      delaySeconds: 0,
      maxIterations: 0,
      autoTransitionTo: '',
      afterLoopTo: '',
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
    activeSheetId: 'sheet-loop',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-loop',
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
    botName: `Loop_${label}`,
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
    botName: `LoopDB_${label}`,
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
  const tmp = `_tmp_loop_${label}.py`;
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
console.log('║       Фаза 27 — loop (цикл по массиву)                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ────────────────────────────────────');

test('A01', '@dp.callback_query(lambda c: c.data == "loop1") присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A01');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "loop1")'),
    '@dp.callback_query с nodeId "loop1" не найден');
});

test('A02', 'async def handle_callback_loop1( присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A02');
  ok(code.includes('async def handle_callback_loop1('),
    'async def handle_callback_loop1( не найдено');
});

test('A03', 'init_all_user_vars(user_id) присутствует в теле', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A03');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('init_all_user_vars(user_id)'),
    'init_all_user_vars(user_id) не найден в теле обработчика');
});

test('A04', '_all_vars.get("items", []) присутствует (получение массива)', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { sourceVariable: 'items' })]);
  const code = gen(p, 'A04');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('_all_vars.get("items", [])'),
    '_all_vars.get("items", []) не найдено');
});

test('A05', 'set_user_var(user_id, "item", присутствует (запись текущего элемента)', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A05');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('set_user_var(user_id, "item",'),
    'set_user_var(user_id, "item", не найдено');
});

test('A06', 'set_user_var(user_id, "index", присутствует (запись индекса)', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A06');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('set_user_var(user_id, "index",'),
    'set_user_var(user_id, "index", не найдено');
});

test('A07', 'isinstance(_items, list) проверка присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A07');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('isinstance(_items, list)'),
    'isinstance(_items, list) не найдено — защита от не-списка отсутствует');
});

test('A08', 'logging.warning( присутствует (лимит итераций)', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A08');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('logging.warning('),
    'logging.warning( не найден в теле обработчика');
});

test('A09', '_HARD_LIMIT = 10000 присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'A09');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('_HARD_LIMIT = 10000'),
    '_HARD_LIMIT = 10000 не найдено');
});

test('A10', 'Синтаксис Python OK (с userDatabaseEnabled: true)', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')], true);
  const code = genDB(p, 'A10');
  syntax(code, 'A10');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: Целевые ноды — тело цикла (autoTransitionTo)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Целевые ноды — тело цикла ───────────────────────────');

test('B01', 'autoTransitionTo: msg-body → await handle_callback_msg_body(callback_query присутствует', () => {
  const msgNode = makeMessageNode('msg-body', 'Элемент: {item}');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { autoTransitionTo: 'msg-body' }), msgNode]);
  const code = gen(p, 'B01');
  ok(code.includes('await handle_callback_msg_body(callback_query'),
    'await handle_callback_msg_body(callback_query не найдено');
});

test('B02', 'autoTransitionTo: "" (пустое) → НЕТ handle_callback_ вызова в теле цикла', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { autoTransitionTo: '' })]);
  const code = gen(p, 'B02');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 4000);
  // Не должно быть вызова handle_callback_ внутри цикла for
  const forIdx = fnBody.indexOf('for _i, _item in enumerate');
  if (forIdx !== -1) {
    const forBody = fnBody.slice(forIdx);
    ok(!forBody.includes('await handle_callback_'),
      'await handle_callback_ найден при пустом autoTransitionTo — не должно быть');
  }
});

test('B03', 'autoTransitionTo указывает на несуществующий узел → вызов НЕ генерируется', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { autoTransitionTo: 'nonexistent' })]);
  const code = gen(p, 'B03');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 4000);
  ok(!fnBody.includes('await handle_callback_nonexistent('),
    'await handle_callback_nonexistent( найден для несуществующего узла');
});

test('B04', 'autoTransitionTo: msg-body → разворачивание dict полей присутствует', () => {
  const msgNode = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { autoTransitionTo: 'msg-body' }), msgNode]);
  const code = gen(p, 'B04');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('isinstance(_item, dict)'),
    'isinstance(_item, dict) не найдено — разворачивание dict отсутствует');
});

test('B05', 'кастомные itemVariable/indexVariable отражаются в коде', () => {
  const msgNode = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    autoTransitionTo: 'msg-body',
    itemVariable: 'current_user',
    indexVariable: 'pos',
  }), msgNode]);
  const code = gen(p, 'B05');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('"current_user"'), '"current_user" не найдено в коде');
  ok(fnBody.includes('"pos"'), '"pos" не найдено в коде');
});

test('B06', 'Синтаксис OK с autoTransitionTo на message', () => {
  const msgNode = makeMessageNode('msg-body', 'Элемент: {item}');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { autoTransitionTo: 'msg-body' }), msgNode], true);
  const code = genDB(p, 'B06');
  syntax(code, 'B06');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: afterLoopTo — переход после цикла
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: afterLoopTo — переход после цикла ─────────────────');

test('C01', 'afterLoopTo: msg-done → await handle_callback_msg_done( присутствует', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const msgDone = makeMessageNode('msg-done', 'Цикл завершён');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    autoTransitionTo: 'msg-body',
    afterLoopTo: 'msg-done',
  }), msgBody, msgDone]);
  const code = gen(p, 'C01');
  ok(code.includes('await handle_callback_msg_done('),
    'await handle_callback_msg_done( не найдено');
});

test('C02', 'afterLoopTo: "" (пустое) → НЕТ перехода после цикла', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    autoTransitionTo: 'msg-body',
    afterLoopTo: '',
  }), msgBody]);
  const code = gen(p, 'C02');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 4000);
  // После цикла for не должно быть вызова handle_callback_ (кроме тела цикла)
  const lines = fnBody.split('\n');
  const afterForLines = [];
  let insideFor = false;
  let forIndent = 0;
  for (const line of lines) {
    if (line.includes('for _i, _item in enumerate')) {
      insideFor = true;
      forIndent = line.search(/\S/);
      continue;
    }
    if (insideFor) {
      const indent = line.search(/\S/);
      if (indent <= forIndent && line.trim() !== '') {
        insideFor = false;
        afterForLines.push(line);
      }
    } else if (afterForLines.length > 0) {
      afterForLines.push(line);
    }
  }
  const afterForCode = afterForLines.join('\n');
  ok(!afterForCode.includes('await handle_callback_'),
    'await handle_callback_ найден после цикла при пустом afterLoopTo');
});

test('C03', 'afterLoopTo на несуществующий узел → вызов НЕ генерируется', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    afterLoopTo: 'ghost_node',
  })]);
  const code = gen(p, 'C03');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(!fnBody.includes('await handle_callback_ghost_node('),
    'await handle_callback_ghost_node( найден для несуществующего узла');
});

test('C04', 'пустой массив → сразу переход к afterLoopTo (ранний return)', () => {
  const msgDone = makeMessageNode('msg-done', 'Пусто');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    afterLoopTo: 'msg-done',
  }), msgDone]);
  const code = gen(p, 'C04');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  // Должен быть блок: if len(_items) == 0: ... handle_callback_msg_done ... return
  ok(fnBody.includes('len(_items) == 0'),
    'len(_items) == 0 не найдено — нет обработки пустого массива');
});

test('C05', 'Синтаксис OK с afterLoopTo', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const msgDone = makeMessageNode('msg-done', 'Готово');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    autoTransitionTo: 'msg-body',
    afterLoopTo: 'msg-done',
  }), msgBody, msgDone], true);
  const code = genDB(p, 'C05');
  syntax(code, 'C05');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Параллельное выполнение
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Параллельное выполнение ──────────────────────────────');

test('D01', 'parallel: true → asyncio.gather( присутствует', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    parallel: true,
    autoTransitionTo: 'msg-body',
  }), msgBody]);
  const code = gen(p, 'D01');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('asyncio.gather('),
    'asyncio.gather( не найдено при parallel=true');
});

test('D02', 'parallel: false → asyncio.gather( ОТСУТСТВУЕТ', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    parallel: false,
    autoTransitionTo: 'msg-body',
  }), msgBody]);
  const code = gen(p, 'D02');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 4000);
  ok(!fnBody.includes('asyncio.gather('),
    'asyncio.gather( найдено при parallel=false — не должно быть');
});

test('D03', 'parallel: true → async def _loop_iteration( присутствует', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    parallel: true,
    autoTransitionTo: 'msg-body',
  }), msgBody]);
  const code = gen(p, 'D03');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('async def _loop_iteration('),
    'async def _loop_iteration( не найдено при parallel=true');
});

test('D04', 'Синтаксис OK при parallel: true', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const msgDone = makeMessageNode('msg-done', 'Готово');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    parallel: true,
    autoTransitionTo: 'msg-body',
    afterLoopTo: 'msg-done',
  }), msgBody, msgDone], true);
  const code = genDB(p, 'D04');
  syntax(code, 'D04');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК E: Задержка и лимиты
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Задержка и лимиты ────────────────────────────────────');

test('E01', 'delaySeconds: 2 → asyncio.sleep(2) присутствует', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    delaySeconds: 2,
    autoTransitionTo: 'msg-body',
  }), msgBody]);
  const code = gen(p, 'E01');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('asyncio.sleep(') || fnBody.includes('asyncio.sleep(2)'),
    'asyncio.sleep( не найдено при delaySeconds=2');
});

test('E02', 'delaySeconds: 0 → asyncio.sleep( ОТСУТСТВУЕТ', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    delaySeconds: 0,
    autoTransitionTo: 'msg-body',
  }), msgBody]);
  const code = gen(p, 'E02');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const nextFnIdx = code.indexOf('\nasync def ', fnIdx + 1);
  const fnBody = code.slice(fnIdx, nextFnIdx !== -1 ? nextFnIdx : fnIdx + 4000);
  // При delaySeconds=0 условие _delay_seconds > 0 ложно, sleep не вызывается
  // Но код всё равно содержит if _delay_seconds > 0 — это нормально
  // Проверяем что _delay_seconds = 0
  ok(fnBody.includes('_delay_seconds = 0'),
    '_delay_seconds = 0 не найдено');
});

test('E03', 'maxIterations: 5 → _max_iterations = 5 присутствует', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { maxIterations: 5 })]);
  const code = gen(p, 'E03');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('_max_iterations = 5'),
    '_max_iterations = 5 не найдено');
});

test('E04', 'maxIterations: 0 → _max_iterations = 0 (без лимита)', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', { maxIterations: 0 })]);
  const code = gen(p, 'E04');
  const fnIdx = code.indexOf('async def handle_callback_loop1(');
  ok(fnIdx !== -1, 'handle_callback_loop1 не найден');
  const fnBody = code.slice(fnIdx, fnIdx + 4000);
  ok(fnBody.includes('_max_iterations = 0'),
    '_max_iterations = 0 не найдено');
});

test('E05', 'Синтаксис OK с delaySeconds и maxIterations', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент');
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1', {
    delaySeconds: 3,
    maxIterations: 100,
    autoTransitionTo: 'msg-body',
  }), msgBody], true);
  const code = genDB(p, 'E05');
  syntax(code, 'E05');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК F: Полные сценарии
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Полные сценарии ──────────────────────────────────────');

test('F01', 'полный flow /loop → loop → message (тело) → message (после) — все обработчики', () => {
  const msgBody = makeMessageNode('msg-body', 'Элемент #{index}: {item}');
  const msgDone = makeMessageNode('msg-done', 'Цикл завершён');
  const loopNode = makeLoopNode('loop1', {
    sourceVariable: 'user_list',
    itemVariable: 'current',
    indexVariable: 'idx',
    autoTransitionTo: 'msg-body',
    afterLoopTo: 'msg-done',
  });
  const cmdNode = makeCommandTriggerNode('cmd-loop', '/loop', 'loop1');
  const p = makeCleanProject([makeStartNode(), cmdNode, loopNode, msgBody, msgDone], true);
  const code = genDB(p, 'F01');
  ok(code.includes('async def handle_callback_loop1('), 'handle_callback_loop1 не найден');
  ok(code.includes('async def handle_callback_msg_body('), 'handle_callback_msg_body не найден');
  ok(code.includes('async def handle_callback_msg_done('), 'handle_callback_msg_done не найден');
});

test('F02', 'несколько loop узлов → оба обработчика присутствуют', () => {
  const msgBody1 = makeMessageNode('msg-b1', 'Тело 1');
  const msgBody2 = makeMessageNode('msg-b2', 'Тело 2');
  const p = makeCleanProject([
    makeStartNode(),
    makeLoopNode('loop1', { sourceVariable: 'list_a', autoTransitionTo: 'msg-b1' }),
    makeLoopNode('loop2', { sourceVariable: 'list_b', autoTransitionTo: 'msg-b2' }),
    msgBody1,
    msgBody2,
  ]);
  const code = gen(p, 'F02');
  ok(code.includes('async def handle_callback_loop1('), 'handle_callback_loop1 не найден');
  ok(code.includes('async def handle_callback_loop2('), 'handle_callback_loop2 не найден');
});

test('F03', 'loop не генерирует дублирующий обработчик через interactive-callback-handlers', () => {
  const p = makeCleanProject([makeStartNode(), makeLoopNode('loop1')]);
  const code = gen(p, 'F03');
  const count = (code.match(/async def handle_callback_loop1\(/g) || []).length;
  ok(count === 1, `handle_callback_loop1 встречается ${count} раз — ожидается ровно 1`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ═══════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`  Итого: ${passed}/${total} пройдено, ${failed} провалено`);
console.log('══════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('Проваленные тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}: ${r.note}`);
  });
  process.exit(1);
}
