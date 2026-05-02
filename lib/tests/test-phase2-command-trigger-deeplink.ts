/**
 * @fileoverview Фаза 2 — Deep Link поддержка в узле command_trigger
 * @module tests/test-phase2-command-trigger-deeplink
 *
 * Блок P: Deep Link обработчики (единый роутер deep_link_router)
 *   P01: deepLinkParam заполнен → генерируется deep_link_router
 *   P02: режим exact → if args == "ref": внутри deep_link_router
 *   P03: режим startsWith → if args and args.startswith("ref_"): внутри deep_link_router
 *   P04: deepLinkSaveToVar=true + deepLinkVarName → оба set_user_var: referrer_id и utm_source
 *   P05: deepLinkSaveToVar=false → нет set_user_var в роутере
 *   P06: deepLinkParam пустой → нет deep_link_router
 *   P07: deepLinkParam не задан → нет deep_link_router
 *   P08: синтаксис Python OK с deep link
 *   P09: два узла /start с разными deepLinkParam → один deep_link_router с двумя ветками
 *   P10: CommandObject импортируется когда есть deep link триггер
 *
 * Блок Q: utm_source — автосохранение при первом визите
 *   Q01: deep link с параметром → utm_source сохраняется как значение параметра
 *   Q02: deep link без совпадения → utm_source всё равно сохраняется до веток
 *   Q03: обычный /start без deep link → utm_source = "direct" сохраняется
 *   Q04: utm_source не перезаписывается — проверка условия user_data.get в коде
 *   Q05: синтаксис Python OK с utm_source логикой
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
 * @returns Результат проверки с флагом ok и опциональной ошибкой
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

/** Структура результата одного теста */
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
 * @param cond - Условие для проверки
 * @param msg - Сообщение об ошибке при провале
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
 * @returns Объект узла command_trigger
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
 * @returns Объект узла message
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

test('P01', 'deepLinkParam заполнен → генерируется deep_link_router', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: 'ref' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p01');
  ok(code.includes('async def deep_link_router'), 'deep_link_router должен быть в коде');
  ok(code.includes('CommandStart(deep_link=True)'), 'CommandStart(deep_link=True) должен быть в коде');
});

test('P02', 'режим exact → if args == "ref": внутри deep_link_router', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref',
      deepLinkMatchMode: 'exact',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p02');
  ok(code.includes('args == "ref"'), 'if args == "ref": должен быть в коде');
});

test('P03', 'режим startsWith → if args and args.startswith("ref_"): внутри deep_link_router', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref_',
      deepLinkMatchMode: 'startsWith',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p03');
  ok(code.includes('args.startswith("ref_")'), 'args.startswith("ref_") должен быть в коде');
  ok(code.includes('args and'), 'проверка args and должна быть в коде');
});

test('P04', 'deepLinkSaveToVar=true + deepLinkVarName → оба set_user_var: referrer_id и utm_source', () => {
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
  // Кастомная переменная сохраняется дополнительно к utm_source, а не вместо него
  ok(code.includes('set_user_var(user_id, "referrer_id", args)'), 'кастомная переменная должна быть');
  ok(code.includes('"utm_source"'), 'utm_source тоже должен сохраняться');
});

test('P05', 'deepLinkSaveToVar=false → кастомная переменная НЕ сохраняется, utm_source сохраняется', () => {
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
  // utm_source всегда сохраняется — это ожидаемое поведение
  ok(code.includes('"utm_source"'), 'utm_source должен сохраняться в роутере');
  // Кастомная переменная referrer_id НЕ должна сохраняться при deepLinkSaveToVar=false
  ok(!code.includes('set_user_var(user_id, "referrer_id"'), 'кастомная переменная referrer_id НЕ должна вызываться');
});

test('P06', 'deepLinkParam пустой → нет deep_link_router', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: '' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p06');
  ok(!code.includes('deep_link_router'), 'deep_link_router НЕ должен быть при пустом deepLinkParam');
  ok(!code.includes('CommandStart(deep_link=True)'), 'CommandStart(deep_link=True) НЕ должен быть при пустом deepLinkParam');
});

test('P07', 'deepLinkParam не задан → нет deep_link_router', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p07');
  ok(!code.includes('deep_link_router'), 'deep_link_router НЕ должен быть без deepLinkParam');
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

test('P09', 'два /start с разными deepLinkParam → один deep_link_router с двумя ветками', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: 'ref', deepLinkMatchMode: 'exact' }),
    makeTriggerNode('t2', '/start', 'msg2', { deepLinkParam: 'promo', deepLinkMatchMode: 'exact' }),
    makeMessageNode('msg1', 'Реф'),
    makeMessageNode('msg2', 'Промо'),
  ]);
  const code = gen(p, 'p09');
  // Должен быть ровно один роутер
  const routerCount = (code.match(/async def deep_link_router/g) || []).length;
  ok(routerCount === 1, `Должен быть ровно 1 deep_link_router, найдено: ${routerCount}`);
  // Обе ветки должны быть внутри
  ok(code.includes('args == "ref"'), 'ветка ref должна быть');
  ok(code.includes('args == "promo"'), 'ветка promo должна быть');
  // Синтаксис OK
  const r = checkSyntax(code, 'p09');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

test('P10', 'CommandObject импортируется когда есть deep link триггер', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', { deepLinkParam: 'ref' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'p10');
  ok(code.includes('CommandObject'), 'CommandObject должен быть импортирован');
});

// ─── Блок Q: utm_source ───────────────────────────────────────────────────────

console.log('\n── Блок Q: utm_source — автосохранение при первом визите ─────────────');

test('Q01', 'deep link с параметром → utm_source сохраняется как значение параметра', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref_123',
      deepLinkMatchMode: 'exact',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'q01');
  // utm_source должен сохраняться через args if args else "direct"
  ok(code.includes('"utm_source"'), 'utm_source должен быть в коде роутера');
  ok(code.includes('args if args else "direct"'), 'логика args if args else "direct" должна быть');
});

test('Q02', 'deep link без совпадения → utm_source всё равно сохраняется до веток', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'known_param',
      deepLinkMatchMode: 'exact',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'q02');
  // utm_source должен быть ДО первой ветки if args ==
  const utmIdx = code.indexOf('"utm_source"');
  const firstBranchIdx = code.indexOf('if args ==');
  ok(utmIdx !== -1, 'utm_source должен быть в коде');
  ok(firstBranchIdx !== -1, 'ветка if args == должна быть в коде');
  ok(utmIdx < firstBranchIdx, 'utm_source должен сохраняться ДО веток маршрутизации');
});

test('Q03', 'обычный /start без deep link → utm_source = "direct" сохраняется', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'q03');
  // В обычном /start обработчике тоже должен быть utm_source = "direct"
  ok(code.includes('"utm_source"'), 'utm_source должен быть в обработчике /start');
  ok(code.includes('"direct"'), 'значение "direct" должно быть в коде');
});

test('Q04', 'utm_source не перезаписывается — проверка условия user_data.get в коде', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref',
      deepLinkMatchMode: 'exact',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'q04');
  // Должна быть проверка на существующее значение (не перезаписываем)
  ok(
    code.includes('user_data.get(user_id, {}).get("utm_source")'),
    'проверка user_data.get(user_id, {}).get("utm_source") должна быть в коде'
  );
});

test('Q05', 'синтаксис Python OK с utm_source логикой', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', '/start', 'msg1', {
      deepLinkParam: 'ref_',
      deepLinkMatchMode: 'startsWith',
      deepLinkSaveToVar: true,
      deepLinkVarName: 'referrer_id',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'q05');
  ok(code.includes('"utm_source"'), 'utm_source должен быть в коде');
  const r = checkSyntax(code, 'q05');
  ok(r.ok, `Синтаксическая ошибка с utm_source логикой:\n${r.error}`);
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
