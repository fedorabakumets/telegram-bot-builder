/**
 * @fileoverview Фаза 2 — Deep Link поддержка в узле command_trigger
 *
 * Блок P: Deep Link обработчики
 *   P01: deepLinkParam заполнен → генерируется @dp.message(CommandStart(deep_link=True))
 *   P02: режим exact → if command.args == "ref":
 *   P03: режим startsWith → if command.args and command.args.startswith("ref_"):
 *   P04: deepLinkSaveToVar=true + deepLinkVarName → await set_user_var(...)
 *   P05: deepLinkSaveToVar=false → нет set_user_var в deep link обработчике
 *   P06: deepLinkParam пустой → нет CommandStart(deep_link=True)
 *   P07: deepLinkParam не задан → нет CommandStart(deep_link=True)
 *   P08: синтаксис Python OK с deep link
 *   P09: основной обработчик /start сохраняется рядом с deep link обработчиком
 *   P10: CommandObject импортируется когда есть deep link триггер
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Создаёт минимальный проект с заданными узлами
 * @param nodes - Массив узлов проекта
 * @returns Объект проекта для генерации
 */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код для проекта
 * @param project - Проект для генерации
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase2DL_${label}`,
    userDatabaseEnabled: false,
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
  const tmp = `_tmp_p2dl_${label}.py`;
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

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Функция теста
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
 * Создаёт узел command_trigger с поддержкой deep link полей
 * @param id - ID узла
 * @param command - Команда, например "/start"
 * @param targetId - ID целевого узла
 * @param opts - Дополнительные опции включая deep link поля
 * @returns Объект узла
 */
function makeTriggerNode(id: string, command: string, targetId: string, opts: {
  adminOnly?: boolean;
  requiresAuth?: boolean;
  showInMenu?: boolean;
  description?: string;
  deepLinkMatchMode?: 'exact' | 'startsWith';
  deepLinkParam?: string;
  deepLinkSaveToVar?: boolean;
  deepLinkVarName?: string;
} = {}) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: opts.description ?? 'Команда',
      showInMenu: opts.showInMenu ?? true,
      adminOnly: opts.adminOnly ?? false,
      requiresAuth: opts.requiresAuth ?? false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
      deepLinkMatchMode: opts.deepLinkMatchMode,
      deepLinkParam: opts.deepLinkParam,
      deepLinkSaveToVar: opts.deepLinkSaveToVar,
      deepLinkVarName: opts.deepLinkVarName,
    },
  };
}

/**
 * Создаёт узел message
 * @param id - ID узла
 * @param text - Текст сообщения
 * @returns Объект узла
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 2 — Deep Link в command_trigger                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок P: Deep Link обработчики ─────────────────────────────────');

test('P01', 'deepLinkParam заполнен → генерируется @dp.message(CommandStart(deep_link=True))', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: 'ref' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p01');
  ok(code.includes('CommandStart(deep_link=True)'), 'CommandStart(deep_link=True) должен быть в коде');
});

test('P02', 'режим exact → if command.args == "ref":', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref',
      deepLinkMatchMode: 'exact',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p02');
  ok(code.includes('command.args == "ref"'), 'if command.args == "ref": должен быть в коде');
});

test('P03', 'режим startsWith → if command.args and command.args.startswith("ref_"):', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref_',
      deepLinkMatchMode: 'startsWith',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p03');
  ok(code.includes('command.args.startswith("ref_")'), 'command.args.startswith("ref_") должен быть в коде');
  ok(code.includes('command.args and'), 'проверка command.args and должна быть в коде');
});

test('P04', 'deepLinkSaveToVar=true + deepLinkVarName → await set_user_var(user_id, "referrer_id", command.args)', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref',
      deepLinkMatchMode: 'exact',
      deepLinkSaveToVar: true,
      deepLinkVarName: 'referrer_id',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p04');
  ok(code.includes('set_user_var(user_id, "referrer_id", command.args)'), 'await set_user_var(...) должен быть в коде');
});

test('P05', 'deepLinkSaveToVar=false → нет set_user_var в deep link обработчике', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref',
      deepLinkMatchMode: 'exact',
      deepLinkSaveToVar: false,
      deepLinkVarName: 'referrer_id',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p05');
  // Ищем тело deep link обработчика (от его def до следующего async def)
  const dlDefMarker = 'command_trigger_t1_deeplink_handler';
  const dlIdx = code.indexOf(dlDefMarker);
  ok(dlIdx !== -1, 'deep link обработчик должен быть в коде');
  // Ищем следующий async def после начала deep link обработчика
  const nextAsyncDef = code.indexOf('\nasync def ', dlIdx + dlDefMarker.length);
  const dlBody = nextAsyncDef > 0
    ? code.substring(dlIdx, nextAsyncDef)
    : code.substring(dlIdx, dlIdx + 800);
  ok(!dlBody.includes('set_user_var('), 'set_user_var НЕ должен вызываться в теле deep link обработчика');
});

test('P06', 'deepLinkParam пустой → нет CommandStart(deep_link=True)', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: '' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p06');
  ok(!code.includes('CommandStart(deep_link=True)'), 'CommandStart(deep_link=True) НЕ должен быть при пустом deepLinkParam');
});

test('P07', 'deepLinkParam не задан → нет CommandStart(deep_link=True)', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p07');
  ok(!code.includes('CommandStart(deep_link=True)'), 'CommandStart(deep_link=True) НЕ должен быть без deepLinkParam');
});

test('P08', 'синтаксис Python OK с deep link', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref_',
      deepLinkMatchMode: 'startsWith',
      deepLinkSaveToVar: true,
      deepLinkVarName: 'referrer_id',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p08');
  const r = checkSyntax(code, 'p08');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

test('P09', 'основной обработчик /start сохраняется рядом с deep link обработчиком', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: 'ref' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p09');
  ok(code.includes('command_trigger_t1_handler'), 'основной обработчик command_trigger_t1_handler должен быть');
  ok(code.includes('command_trigger_t1_deeplink_handler'), 'deep link обработчик command_trigger_t1_deeplink_handler должен быть');
  // Основной обработчик должен идти перед deep link
  const mainIdx = code.indexOf('command_trigger_t1_handler');
  const dlIdx = code.indexOf('command_trigger_t1_deeplink_handler');
  ok(mainIdx < dlIdx, 'основной обработчик должен быть ДО deep link обработчика');
});

test('P10', 'CommandObject импортируется когда есть deep link триггер', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: 'ref' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p10');
  ok(code.includes('CommandObject'), 'CommandObject должен быть импортирован');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n──────────────────────────────────────────────────────────────────');
console.log(`Итого: ${passed} пройдено, ${failed} провалено из ${results.length}`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ Все тесты прошли успешно!');
}
