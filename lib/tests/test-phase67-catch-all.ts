/**
 * @fileoverview Фаза 67 — Переключатель «Catch-all обработчики»
 *
 * Catch-all обработчики (`handle_unhandled_message`, `handle_unhandled_photo`,
 * `fallback_callback_handler`) генерируются в секции universalHandlers. Они
 * обязательны, когда в проекте есть incoming-триггеры (`incoming_message_trigger`,
 * `incoming_callback_trigger`) или динамические кнопки — в aiogram 3 middleware
 * не срабатывает без подходящего хендлера.
 *
 * Формула генерации (предохранитель-автодетект):
 *   generateCatchAll = (catchAllHandlers !== 0) || hasIncomingTriggersOrDynamicButtons
 *
 * То есть флаг `catchAllHandlers` управляет генерацией, НО при наличии
 * incoming-триггеров/динамических кнопок catch-all генерируются принудительно.
 *
 * Блоки:
 *  A. catchAllHandlers=true/не задан + простой проект → catch-all ЕСТЬ
 *  B. catchAllHandlers=false + простой проект БЕЗ триггеров → catch-all НЕТ
 *  C. catchAllHandlers=false + incoming-триггеры → catch-all ВСЁ РАВНО ЕСТЬ (предохранитель)
 *  D. Синтаксис Python OK
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа message
 * @param id - Идентификатор узла
 * @param text - Текст сообщения
 */
function makeMessageNode(id: string, text = 'Новое сообщение') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 300 },
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
    position: { x: 100, y: 300 },
    data: {
      command,
      description: 'Запустить бота',
      sourceNodeId: targetId,
      autoTransitionTo: targetId,
    },
  };
}

/**
 * Создаёт узел incoming_message_trigger
 * @param id - Идентификатор узла
 * @param targetId - ID целевого узла
 */
function makeIncomingMessageTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел incoming_callback_trigger
 * @param id - Идентификатор узла
 * @param targetId - ID целевого узла
 */
function makeIncomingCallbackTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_callback_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

// ─── Утилиты генерации ───────────────────────────────────────────────────────

/**
 * Создаёт минимальный project.json с заданными узлами
 * @param nodes - Массив узлов
 */
function makeCleanProject(nodes: any[]) {
  return {
    version: 2,
    activeSheetId: 'sheet-ca',
    sheets: [{
      id: 'sheet-ca',
      name: 'Лист 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/** Простой проект «/start → одно сообщение» (без incoming-триггеров) */
function startProject() {
  return makeCleanProject([
    makeMessageNode('start-message'),
    makeCommandTriggerNode('start-command-trigger', '/start', 'start-message'),
  ]);
}

/** Проект с incoming_message_trigger */
function incomingMessageProject() {
  return makeCleanProject([
    makeMessageNode('start-message'),
    makeCommandTriggerNode('start-command-trigger', '/start', 'start-message'),
    makeIncomingMessageTriggerNode('imt1', 'start-message'),
  ]);
}

/** Проект с incoming_callback_trigger */
function incomingCallbackProject() {
  return makeCleanProject([
    makeMessageNode('start-message'),
    makeCommandTriggerNode('start-command-trigger', '/start', 'start-message'),
    makeIncomingCallbackTriggerNode('ict1', 'start-message'),
  ]);
}

/**
 * Генерирует Python-код с заданным значением catchAllHandlers
 * @param label - Метка для имени бота
 * @param project - Объект проекта
 * @param catchAllHandlers - Значение опции (undefined → дефолт true)
 */
function gen(label: string, project: any, catchAllHandlers?: boolean): string {
  const options: any = {
    botName: `CatchAll_${label}`,
    enableComments: false,
    userDatabaseEnabled: false,
  };
  if (catchAllHandlers !== undefined) options.catchAllHandlers = catchAllHandlers;
  return generatePythonCode(project, options);
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_ca_${label}.py`;
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

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 67 — Переключатель «Catch-all обработчики»          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: catchAllHandlers=true/не задан + простой проект → catch-all ЕСТЬ
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: catch-all включены по умолчанию ─────────────────────');

test('A01', 'catchAllHandlers не задан → есть handle_unhandled_message', () => {
  const code = gen('A01', startProject());
  ok(code.includes('async def handle_unhandled_message'),
    'handle_unhandled_message должен присутствовать при дефолтном флаге');
});

test('A02', 'catchAllHandlers не задан → есть fallback_callback_handler', () => {
  const code = gen('A02', startProject());
  ok(code.includes('async def fallback_callback_handler'),
    'fallback_callback_handler должен присутствовать при дефолтном флаге');
});

test('A03', 'catchAllHandlers не задан → есть handle_unhandled_photo', () => {
  const code = gen('A03', startProject());
  ok(code.includes('async def handle_unhandled_photo'),
    'handle_unhandled_photo должен присутствовать при дефолтном флаге');
});

test('A04', 'catchAllHandlers=true → есть handle_unhandled_message и fallback_callback_handler', () => {
  const code = gen('A04', startProject(), true);
  ok(code.includes('async def handle_unhandled_message'), 'handle_unhandled_message должен быть');
  ok(code.includes('async def fallback_callback_handler'), 'fallback_callback_handler должен быть');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: catchAllHandlers=false + простой проект БЕЗ триггеров → catch-all НЕТ
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: catch-all выключены без зависимостей ────────────────');

test('B01', 'catchAllHandlers=false → НЕТ handle_unhandled_message', () => {
  const code = gen('B01', startProject(), false);
  ok(!code.includes('async def handle_unhandled_message'),
    'handle_unhandled_message НЕ должен присутствовать при catchAllHandlers=false');
});

test('B02', 'catchAllHandlers=false → НЕТ fallback_callback_handler', () => {
  const code = gen('B02', startProject(), false);
  ok(!code.includes('async def fallback_callback_handler'),
    'fallback_callback_handler НЕ должен присутствовать при catchAllHandlers=false');
});

test('B03', 'catchAllHandlers=false → НЕТ handle_unhandled_photo', () => {
  const code = gen('B03', startProject(), false);
  ok(!code.includes('async def handle_unhandled_photo'),
    'handle_unhandled_photo НЕ должен присутствовать при catchAllHandlers=false');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: catchAllHandlers=false + incoming-триггеры → catch-all ВСЁ РАВНО ЕСТЬ
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: предохранитель-автодетект (incoming-триггеры) ───────');

test('C01', 'catchAllHandlers=false + incoming_message_trigger → есть handle_unhandled_message', () => {
  const code = gen('C01', incomingMessageProject(), false);
  ok(code.includes('async def handle_unhandled_message'),
    'предохранитель: handle_unhandled_message должен быть при incoming_message_trigger');
});

test('C02', 'catchAllHandlers=false + incoming_message_trigger → есть fallback_callback_handler', () => {
  const code = gen('C02', incomingMessageProject(), false);
  ok(code.includes('async def fallback_callback_handler'),
    'предохранитель: fallback_callback_handler должен быть при incoming_message_trigger');
});

test('C03', 'catchAllHandlers=false + incoming_callback_trigger → есть fallback_callback_handler', () => {
  const code = gen('C03', incomingCallbackProject(), false);
  ok(code.includes('async def fallback_callback_handler'),
    'предохранитель: fallback_callback_handler должен быть при incoming_callback_trigger');
});

test('C04', 'catchAllHandlers=false + incoming_callback_trigger → есть handle_unhandled_message', () => {
  const code = gen('C04', incomingCallbackProject(), false);
  ok(code.includes('async def handle_unhandled_message'),
    'предохранитель: handle_unhandled_message должен быть при incoming_callback_trigger');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Синтаксис Python OK
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Синтаксис Python ────────────────────────────────────');

test('D01', 'Синтаксис OK: catchAllHandlers=false простой проект', () => {
  syntax(gen('D01', startProject(), false), 'D01');
});

test('D02', 'Синтаксис OK: catchAllHandlers=true простой проект', () => {
  syntax(gen('D02', startProject(), true), 'D02');
});

test('D03', 'Синтаксис OK: catchAllHandlers=false + incoming-триггеры (предохранитель)', () => {
  syntax(gen('D03', incomingMessageProject(), false), 'D03');
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
