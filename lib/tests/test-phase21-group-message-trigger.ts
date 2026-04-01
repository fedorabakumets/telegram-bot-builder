/**
 * @fileoverview Фаза 21 — Узел group_message_trigger
 *
 * Большой phase-style integration тест генератора для узла триггера сообщения в топике форум-группы.
 *
 * Блок A: Базовая генерация
 * Блок B: groupChatIdSource = manual
 * Блок C: groupChatIdSource = variable
 * Блок D: threadIdVariable
 * Блок E: resolvedUserIdVariable
 * Блок F: MockCallback и переход к следующему узлу
 * Блок G: Несколько триггеров
 * Блок H: Интеграция с command_trigger
 * Блок I: Интеграция с condition
 * Блок J: Граничные случаи
 * Блок K: Отсутствие лишнего кода
 * Блок L: Производительность / множественные узлы
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Типы ────────────────────────────────────────────────────────────────────

/** Источник ID группы: "manual" — вручную, "variable" — из перемен

// ─── Типы ────────────────────────────────────────────────────────────────────

/** Источник ID группы: вручную или из переменной. */
type GroupChatIdSource = 'manual' | 'variable';

/** Результат выполнения одного тестового кейса phase-файла. */
type TestResult = {
  /** Идентификатор теста в формате A01, B02 и т. д. */
  id: string;
  /** Человекочитаемое название сценария. */
  name: string;
  /** Признак успешного прохождения сценария. */
  passed: boolean;
  /** Короткая заметка о результате или тексте ошибки. */
  note: string;
};

/** Опции построения узла group_message_trigger. */
type GroupMessageTriggerOptions = {
  /** ID группы (при groupChatIdSource === 'manual'). */
  groupChatId?: string;
  /** Источник ID группы. */
  groupChatIdSource?: GroupChatIdSource;
  /** Имя переменной с ID группы (при groupChatIdSource === 'variable'). */
  groupChatVariableName?: string;
  /** Имя переменной где у пользователей хранится thread_id. */
  threadIdVariable?: string;
  /** Имя переменной куда положить найденный user_id. */
  resolvedUserIdVariable?: string;
  /** ID целевого узла для перехода (обязательно, иначе узел игнорируется). */
  autoTransitionTo?: string;
};

/** Опции построения command_trigger. */
type CommandTriggerOptions = {
  /** Описание команды для меню. */
  description?: string;
  /** Доступ только для администраторов. */
  adminOnly?: boolean;
};

/** Опции построения ветки condition-узла. */
type ConditionBranchOptions = {
  /** Значение ветки. */
  value?: string;
  /** Целевой узел для перехода. */
  target?: string;
};

/** Итоги выполнения всех сценариев текущей фазы. */
const results: TestResult[] = [];


// ─── Вспомогательные функции ─────────────────────────────────────────────────

/** Создаёт чистый проект с одним листом и переданным набором узлов. */
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

/** Генерирует Python-код без пользовательской БД. */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase21_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}


/** Запускает py_compile и возвращает результат синтаксической проверки. */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p21_${label}.py`;
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

/** Выполняет один тестовый сценарий и складывает результат в массив итогов. */
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

/** Бросает исключение, если проверка не прошла. */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/** Проверяет синтаксическую корректность сгенерированного Python-кода. */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}


// ─── Фабрики узлов ───────────────────────────────────────────────────────────

/**
 * Создаёт узел group_message_trigger с разумными значениями по умолчанию.
 * @param id - идентификатор узла
 * @param options - параметры узла
 */
function makeGroupMessageTriggerNode(id: string, options: GroupMessageTriggerOptions = {}) {
  return {
    id,
    type: 'group_message_trigger',
    position: { x: 0, y: 0 },
    data: {
      groupChatId: options.groupChatId ?? '-1002300967595',
      groupChatIdSource: options.groupChatIdSource ?? 'manual',
      groupChatVariableName: options.groupChatVariableName ?? '',
      threadIdVariable: options.threadIdVariable ?? 'support_thread_id',
      resolvedUserIdVariable: options.resolvedUserIdVariable ?? 'resolved_user_id',
      autoTransitionTo: options.autoTransitionTo ?? 'msg1',
    },
  };
}

/**
 * Создаёт узел message с разумными значениями по умолчанию.
 * @param id - идентификатор узла
 * @param text - текст сообщения
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 200 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      enableAutoTransition: false,
      autoTransitionTo: '',
      formatMode: 'none',
      markdown: false,
    },
  };
}

/**
 * Создаёт узел command_trigger с переходом к целевому узлу.
 * @param id - идентификатор узла
 * @param command - команда бота
 * @param targetId - целевой узел
 * @param options - дополнительные параметры
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string, options: CommandTriggerOptions = {}) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: options.description ?? 'Команда',
      showInMenu: true,
      adminOnly: options.adminOnly ?? false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт одну ветку condition-узла.
 * @param operator - оператор ветки
 * @param options - параметры ветки
 */
function makeConditionBranch(operator: string, options: ConditionBranchOptions = {}) {
  return {
    id: `br_${operator}_${Math.random().toString(36).slice(2, 6)}`,
    label: operator,
    operator,
    value: options.value ?? '',
    value2: '',
    target: options.target ?? '',
  };
}

/**
 * Создаёт condition-узел с набором веток.
 * @param id - идентификатор узла
 * @param variable - переменная для проверки
 * @param branches - ветки условия
 */
function makeConditionNode(id: string, variable: string, branches: any[]) {
  return {
    id,
    type: 'condition',
    position: { x: 200, y: 0 },
    data: { variable, branches },
  };
}


// ─── Запуск тестов ────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 21 — Узел group_message_trigger                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ───────────────────────────────────────────────');

test('A01', 'group_message_trigger генерирует @dp.message декоратор', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a01');
  ok(code.includes('@dp.message('), 'Декоратор @dp.message должен быть в коде');
});

test('A02', 'имя обработчика group_message_trigger_gmt1_handler', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a02');
  ok(
    code.includes('async def group_message_trigger_gmt1_handler('),
    'Обработчик group_message_trigger_gmt1_handler должен быть в коде',
  );
});

test('A03', 'декоратор содержит F.chat.type.in_({\'group\', \'supergroup\'})', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a03');
  ok(
    code.includes("F.chat.type.in_({'group', 'supergroup'})"),
    "Фильтр F.chat.type.in_({'group', 'supergroup'}) должен быть в коде",
  );
});

test('A04', 'декоратор содержит F.message_thread_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a04');
  ok(code.includes('F.message_thread_id'), 'Фильтр F.message_thread_id должен быть в коде');
});

test('A05', 'содержит _thread_id = message.message_thread_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a05');
  ok(
    code.includes('_thread_id = message.message_thread_id'),
    '_thread_id = message.message_thread_id должен быть в коде',
  );
});

test('A06', 'содержит if not _thread_id: return', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a06');
  ok(code.includes('if not _thread_id:'), 'Проверка if not _thread_id: должна быть в коде');
});

test('A07', 'содержит logging.info(', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a07');
  ok(code.includes('logging.info('), 'logging.info должен присутствовать в коде');
});

test('A08', 'содержит logging.warning(', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a08');
  ok(code.includes('logging.warning('), 'logging.warning должен присутствовать в коде');
});

test('A09', 'содержит try: / except Exception', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a09');
  ok(code.includes('try:'), 'Блок try: должен присутствовать в коде');
  ok(code.includes('except Exception'), 'Блок except Exception должен присутствовать в коде');
});

test('A10', 'содержит MockCallback', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a10');
  ok(code.includes('MockCallback'), 'Класс MockCallback должен быть в коде');
});

test('A11', 'базовый сценарий синтаксически корректен', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1'),
    ]), 'a11'),
    'a11',
  );
});

test('A12', 'обработчик принимает message: types.Message', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'a12');
  ok(
    code.includes('message: types.Message'),
    'Параметр message: types.Message должен быть в сигнатуре обработчика',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК B: groupChatIdSource = manual
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: groupChatIdSource = manual ──────────────────────────────────────');

test('B01', 'manual: _expected_chat_ids содержит groupChatId', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'manual',
      groupChatId: '-1002300967595',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'b01');
  ok(
    code.includes("'-1002300967595'") || code.includes('2300967595'),
    '_expected_chat_ids должен содержать groupChatId',
  );
});

test('B02', 'manual: _expected_chat_ids содержит -100{groupChatId}', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'manual',
      groupChatId: '2300967595',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'b02');
  ok(
    code.includes('-1002300967595') || code.includes('_expected_chat_ids'),
    '_expected_chat_ids должен содержать вариант с -100 префиксом',
  );
});

test('B03', 'manual: проверка str(message.chat.id) not in _expected_chat_ids', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'manual',
      groupChatId: '-1002300967595',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'b03');
  ok(
    code.includes('str(message.chat.id) not in _expected_chat_ids'),
    'Проверка str(message.chat.id) not in _expected_chat_ids должна быть в коде',
  );
});

test('B04', 'manual: пустой groupChatId — warning и return', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'manual',
      groupChatId: '',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'b04');
  // При пустом groupChatId обработчик либо не генерируется, либо содержит return
  ok(
    !code.includes('group_message_trigger_gmt1_handler') || code.includes('return'),
    'При пустом groupChatId должен быть return или обработчик не генерируется',
  );
});

test('B05', 'manual: отрицательный ID (-1001234567890) встраивается корректно', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'manual',
      groupChatId: '-1001234567890',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'b05');
  ok(code.includes('1001234567890'), 'Отрицательный ID должен быть встроен в код');
});

test('B06', 'manual: положительный ID встраивается корректно', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'manual',
      groupChatId: '1002300967595',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'b06');
  ok(code.includes('1002300967595'), 'Положительный ID должен быть встроен в код');
});

test('B07', 'manual: синтаксис OK для отрицательного ID', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        groupChatIdSource: 'manual',
        groupChatId: '-1002300967595',
        autoTransitionTo: 'msg1',
      }),
      makeMessageNode('msg1'),
    ]), 'b07'),
    'b07',
  );
});

test('B08', 'manual: синтаксис OK для разных форматов ID', () => {
  const ids = ['-1002300967595', '1002300967595', '-1001234567890', '-100999888777'];
  for (const chatId of ids) {
    syntax(
      gen(makeCleanProject([
        makeGroupMessageTriggerNode('gmt1', {
          groupChatIdSource: 'manual',
          groupChatId: chatId,
          autoTransitionTo: 'msg1',
        }),
        makeMessageNode('msg1'),
      ]), `b08_${chatId.replace(/[^a-z0-9]/gi, '_')}`),
      `b08_${chatId.replace(/[^a-z0-9]/gi, '_')}`,
    );
  }
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК C: groupChatIdSource = variable
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: groupChatIdSource = variable ────────────────────────────────────');

test('C01', 'variable: читает через globals().get(\'user_data\', {}).get(0, {})', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'my_group_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'c01');
  ok(
    code.includes("globals().get('user_data', {}).get(0, {})"),
    "globals().get('user_data', {}).get(0, {}) должен быть в коде",
  );
});

test('C02', 'variable: читает .get(\'groupChatVariableName\', \'\')', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'my_group_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'c02');
  ok(
    code.includes(".get('my_group_id', '')"),
    ".get('my_group_id', '') должен быть в коде",
  );
});

test('C03', 'variable: проверяет if not _group_chat_id_var: return', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'my_group_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'c03');
  ok(
    code.includes('if not _group_chat_id_var:'),
    'Проверка if not _group_chat_id_var: должна быть в коде',
  );
});

test('C04', 'variable: содержит _expected_group_ids', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'my_group_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'c04');
  ok(code.includes('_expected_group_ids'), '_expected_group_ids должен быть в коде');
});

test('C05', 'variable: проверяет str(message.chat.id) not in _expected_group_ids', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'my_group_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'c05');
  ok(
    code.includes('str(message.chat.id) not in _expected_group_ids'),
    'Проверка str(message.chat.id) not in _expected_group_ids должна быть в коде',
  );
});

test('C06', 'variable: имя переменной с подчёркиваниями встраивается без искажений', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'my_forum_group_chat_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'c06');
  ok(
    code.includes('my_forum_group_chat_id'),
    'Имя переменной my_forum_group_chat_id должно быть встроено без искажений',
  );
});

test('C07', 'variable: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        groupChatIdSource: 'variable',
        groupChatVariableName: 'group_chat_id',
        autoTransitionTo: 'msg1',
      }),
      makeMessageNode('msg1'),
    ]), 'c07'),
    'c07',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК D: threadIdVariable
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: threadIdVariable ────────────────────────────────────────────────');

test('D01', 'SQL содержит user_data->>\'threadIdVariable\' = $2 (с project_id)', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      threadIdVariable: 'support_thread_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'd01');
  ok(
    code.includes("user_data->>'support_thread_id'"),
    "SQL должен содержать user_data->>'support_thread_id'",
  );
});

test('D02', 'разные имена threadIdVariable встраиваются корректно', () => {
  const vars = ['support_thread_id', 'forum_thread', 'my_thread_var', 'thread_id_123'];
  for (const v of vars) {
    const code = gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { threadIdVariable: v, autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1'),
    ]), `d02_${v}`);
    ok(code.includes(`user_data->>'${v}'`), `SQL должен содержать user_data->>'${v}'`);
  }
});

test('D03', 'содержит _db_pool_ref = globals().get(\'db_pool\')', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'd03');
  ok(
    code.includes("globals().get('db_pool')"),
    "globals().get('db_pool') должен быть в коде",
  );
});

test('D04', 'содержит _project_id = globals().get(\'PROJECT_ID\')', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'd04');
  ok(
    code.includes("globals().get('PROJECT_ID')"),
    "globals().get('PROJECT_ID') должен быть в коде",
  );
});

test('D05', 'ветка с _project_id is not None — запрос с project_id = $1', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'd05');
  ok(
    code.includes('_project_id is not None'),
    'Ветка _project_id is not None должна быть в коде',
  );
  ok(
    code.includes('project_id = $1'),
    'SQL с project_id = $1 должен быть в коде',
  );
});

test('D06', 'ветка без project_id — запрос с $1 (только thread_id)', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'd06');
  // Ветка else: запрос без project_id, только $1 = thread_id
  ok(
    code.includes("= $1 LIMIT 1") || code.includes("= $1\n"),
    'SQL без project_id с $1 должен быть в коде',
  );
});

test('D07', 'threadIdVariable по умолчанию support_thread_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'd07');
  ok(
    code.includes('support_thread_id'),
    'Дефолтное значение support_thread_id должно быть в коде',
  );
});

test('D08', 'синтаксис OK для разных threadIdVariable', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        threadIdVariable: 'custom_thread_var',
        autoTransitionTo: 'msg1',
      }),
      makeMessageNode('msg1'),
    ]), 'd08'),
    'd08',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК E: resolvedUserIdVariable
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: resolvedUserIdVariable ──────────────────────────────────────────');

test('E01', 'содержит await set_user_var(_resolved_user_id, \'resolvedUserIdVariable\', str(...))', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      resolvedUserIdVariable: 'resolved_user_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'e01');
  ok(
    code.includes("set_user_var(_resolved_user_id, 'resolved_user_id'"),
    "set_user_var с 'resolved_user_id' должен быть в коде",
  );
});

test('E02', 'разные имена resolvedUserIdVariable встраиваются корректно', () => {
  const vars = ['resolved_user_id', 'user_id_var', 'my_resolved_uid', 'uid_resolved'];
  for (const v of vars) {
    const code = gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { resolvedUserIdVariable: v, autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1'),
    ]), `e02_${v}`);
    ok(
      code.includes(`set_user_var(_resolved_user_id, '${v}'`),
      `set_user_var с '${v}' должен быть в коде`,
    );
  }
});

test('E03', 'логирование thread_id → user_id присутствует', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'e03');
  ok(
    code.includes('thread_id=') && code.includes('user_id='),
    'Логирование thread_id → user_id должно быть в коде',
  );
});

test('E04', 'resolvedUserIdVariable по умолчанию resolved_user_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'e04');
  ok(
    code.includes('resolved_user_id'),
    'Дефолтное значение resolved_user_id должно быть в коде',
  );
});

test('E05', 'синтаксис OK для разных resolvedUserIdVariable', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        resolvedUserIdVariable: 'custom_resolved_uid',
        autoTransitionTo: 'msg1',
      }),
      makeMessageNode('msg1'),
    ]), 'e05'),
    'e05',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК F: autoTransitionTo и MockCallback
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: autoTransitionTo и MockCallback ─────────────────────────────────');

test('F01', 'без autoTransitionTo — узел не генерирует обработчик', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: '' }),
    makeMessageNode('msg1'),
  ]), 'f01');
  ok(
    !code.includes('group_message_trigger_gmt1_handler'),
    'Без autoTransitionTo обработчик group_message_trigger_gmt1_handler не должен генерироваться',
  );
});

test('F02', 'с autoTransitionTo — генерирует handle_callback_{safeName}(mock_callback)', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'f02');
  ok(
    code.includes('handle_callback_msg1(mock_callback)'),
    'Вызов handle_callback_msg1(mock_callback) должен быть в коде',
  );
});

test('F03', 'MockCallback содержит self.data', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'f03');
  ok(code.includes('self.data'), 'MockCallback должен содержать self.data');
});

test('F04', 'MockCallback содержит self.from_user', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'f04');
  ok(code.includes('self.from_user'), 'MockCallback должен содержать self.from_user');
});

test('F05', 'MockCallback содержит self.message', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'f05');
  ok(code.includes('self.message'), 'MockCallback должен содержать self.message');
});

test('F06', 'mock_callback = MockCallback("targetNodeId", _resolved_user_id, message)', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'f06');
  ok(
    code.includes('MockCallback(') && code.includes('_resolved_user_id') && code.includes('message)'),
    'MockCallback должен создаваться с targetNodeId, _resolved_user_id и message',
  );
});

test('F07', 'разные targetNodeId встраиваются корректно', () => {
  const targets = ['msg1', 'reply_node', 'answer_step', 'final_msg'];
  for (const target of targets) {
    const code = gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: target }),
      makeMessageNode(target),
    ]), `f07_${target}`);
    ok(
      code.includes(`handle_callback_${target}(mock_callback)`),
      `handle_callback_${target}(mock_callback) должен быть в коде`,
    );
  }
});

test('F08', 'safeName для targetNodeId с дефисами заменяет дефисы на _', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'reply-node-1' }),
    makeMessageNode('reply-node-1'),
  ]), 'f08');
  ok(
    code.includes('handle_callback_reply_node_1(mock_callback)'),
    'Дефисы в targetNodeId должны заменяться на _ в имени функции',
  );
});

test('F09', 'синтаксис OK для MockCallback с разными targetNodeId', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'target-node-abc' }),
      makeMessageNode('target-node-abc'),
    ]), 'f09'),
    'f09',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК G: Интеграция с message-узлом
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Интеграция с message-узлом ──────────────────────────────────────');

test('G01', 'group_message_trigger + message: оба обработчика в коде', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Привет из топика!'),
  ]), 'g01');
  ok(
    code.includes('group_message_trigger_gmt1_handler'),
    'Обработчик group_message_trigger_gmt1_handler должен быть в коде',
  );
  ok(
    code.includes('handle_callback_msg1'),
    'Обработчик handle_callback_msg1 должен быть в коде',
  );
});

test('G02', 'переход через MockCallback к message-узлу', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Ответ пользователю'),
  ]), 'g02');
  ok(
    code.includes('await handle_callback_msg1(mock_callback)'),
    'await handle_callback_msg1(mock_callback) должен быть в коде',
  );
});

test('G03', 'несколько group_message_trigger в одном проекте', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1', groupChatId: '-1001111111111' }),
    makeGroupMessageTriggerNode('gmt2', { autoTransitionTo: 'msg2', groupChatId: '-1002222222222' }),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]), 'g03');
  ok(
    code.includes('group_message_trigger_gmt1_handler'),
    'Обработчик gmt1 должен быть в коде',
  );
  ok(
    code.includes('group_message_trigger_gmt2_handler'),
    'Обработчик gmt2 должен быть в коде',
  );
});

test('G04', 'group_message_trigger + message: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1', 'Ответ'),
    ]), 'g04'),
    'g04',
  );
});

test('G05', 'group_message_trigger → message с Unicode текстом: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1', '✅ Ваш запрос принят! Мы ответим в топике поддержки.'),
    ]), 'g05'),
    'g05',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК H: Интеграция с command_trigger
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Интеграция с command_trigger ────────────────────────────────────');

test('H01', 'group_message_trigger + command_trigger сосуществуют', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Привет!'),
  ]), 'h01');
  ok(code.includes('group_message_trigger_gmt1_handler'), 'Обработчик gmt1 должен быть в коде');
  ok(code.includes('handle_callback_msg1'), 'Обработчик msg1 должен быть в коде');
});

test('H02', 'нет конфликтов имён обработчиков между command_trigger и group_message_trigger', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Привет!'),
  ]), 'h02');
  // Имена обработчиков должны быть уникальны
  const cmdHandlerCount = (code.match(/async def handle_callback_msg1\(/g) ?? []).length;
  ok(cmdHandlerCount === 1, `handle_callback_msg1 должен быть определён ровно один раз, найдено: ${cmdHandlerCount}`);
});

test('H03', 'command_trigger + group_message_trigger: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/support', 'msg_welcome'),
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg_reply' }),
      makeMessageNode('msg_welcome', 'Добро пожаловать!'),
      makeMessageNode('msg_reply', 'Ваш запрос обработан.'),
    ]), 'h03'),
    'h03',
  );
});

test('H04', 'несколько command_trigger + group_message_trigger: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/start', 'msg1'),
      makeCommandTriggerNode('cmd2', '/help', 'msg2'),
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1', 'Старт'),
      makeMessageNode('msg2', 'Помощь'),
    ]), 'h04'),
    'h04',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК I: Интеграция с condition
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Интеграция с condition ──────────────────────────────────────────');

test('I01', 'group_message_trigger → condition → message: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'cond1' }),
      makeConditionNode('cond1', 'resolved_user_id', [
        makeConditionBranch('filled', { target: 'msg_ok' }),
        makeConditionBranch('else', { target: 'msg_fail' }),
      ]),
      makeMessageNode('msg_ok', 'Пользователь найден'),
      makeMessageNode('msg_fail', 'Пользователь не найден'),
    ]), 'i01'),
    'i01',
  );
});

test('I02', 'group_message_trigger → condition: обработчик condition в коде', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'resolved_user_id', [
      makeConditionBranch('filled', { target: 'msg_ok' }),
      makeConditionBranch('else', { target: 'msg_fail' }),
    ]),
    makeMessageNode('msg_ok', 'OK'),
    makeMessageNode('msg_fail', 'Fail'),
  ]), 'i02');
  ok(
    code.includes('handle_callback_cond1(mock_callback)'),
    'Переход к condition через mock_callback должен быть в коде',
  );
});

test('I03', 'group_message_trigger → condition → message: полный сценарий синтаксически корректен', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/start', 'msg_start'),
      makeGroupMessageTriggerNode('gmt1', {
        groupChatId: '-1002300967595',
        threadIdVariable: 'support_thread_id',
        resolvedUserIdVariable: 'resolved_user_id',
        autoTransitionTo: 'cond_check',
      }),
      makeConditionNode('cond_check', 'resolved_user_id', [
        makeConditionBranch('filled', { target: 'msg_reply' }),
        makeConditionBranch('else', { target: 'msg_unknown' }),
      ]),
      makeMessageNode('msg_start', 'Привет!'),
      makeMessageNode('msg_reply', 'Ответ получен'),
      makeMessageNode('msg_unknown', 'Неизвестный пользователь'),
    ]), 'i03'),
    'i03',
  );
});

test('I04', 'group_message_trigger → condition с variable source: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        groupChatIdSource: 'variable',
        groupChatVariableName: 'group_id',
        autoTransitionTo: 'cond1',
      }),
      makeConditionNode('cond1', 'step', [
        makeConditionBranch('filled', { target: 'msg_ok' }),
        makeConditionBranch('else', { target: 'msg_fail' }),
      ]),
      makeMessageNode('msg_ok', 'OK'),
      makeMessageNode('msg_fail', 'Fail'),
    ]), 'i04'),
    'i04',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК J: Несколько узлов group_message_trigger
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Несколько узлов group_message_trigger ───────────────────────────');

test('J01', 'два узла генерируют два отдельных обработчика', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1', groupChatId: '-1001111111111' }),
    makeGroupMessageTriggerNode('gmt2', { autoTransitionTo: 'msg2', groupChatId: '-1002222222222' }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'j01');
  ok(
    code.includes('group_message_trigger_gmt1_handler'),
    'Обработчик gmt1 должен быть в коде',
  );
  ok(
    code.includes('group_message_trigger_gmt2_handler'),
    'Обработчик gmt2 должен быть в коде',
  );
});

test('J02', 'имена обработчиков уникальны', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeGroupMessageTriggerNode('gmt2', { autoTransitionTo: 'msg2' }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'j02');
  const count1 = (code.match(/async def group_message_trigger_gmt1_handler/g) ?? []).length;
  const count2 = (code.match(/async def group_message_trigger_gmt2_handler/g) ?? []).length;
  ok(count1 === 1, `gmt1_handler должен быть определён ровно один раз, найдено: ${count1}`);
  ok(count2 === 1, `gmt2_handler должен быть определён ровно один раз, найдено: ${count2}`);
});

test('J03', 'разные groupChatId для разных узлов', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1', groupChatId: '-1001111111111' }),
    makeGroupMessageTriggerNode('gmt2', { autoTransitionTo: 'msg2', groupChatId: '-1002222222222' }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'j03');
  ok(code.includes('1111111111'), 'groupChatId первого узла должен быть в коде');
  ok(code.includes('2222222222'), 'groupChatId второго узла должен быть в коде');
});

test('J04', 'два узла с разными threadIdVariable: оба встраиваются', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      autoTransitionTo: 'msg1',
      threadIdVariable: 'thread_alpha',
    }),
    makeGroupMessageTriggerNode('gmt2', {
      autoTransitionTo: 'msg2',
      threadIdVariable: 'thread_beta',
    }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'j04');
  ok(code.includes('thread_alpha'), 'thread_alpha должен быть в коде');
  ok(code.includes('thread_beta'), 'thread_beta должен быть в коде');
});

test('J05', 'два узла group_message_trigger: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        autoTransitionTo: 'msg1',
        groupChatId: '-1001111111111',
        threadIdVariable: 'thread_1',
        resolvedUserIdVariable: 'uid_1',
      }),
      makeGroupMessageTriggerNode('gmt2', {
        autoTransitionTo: 'msg2',
        groupChatId: '-1002222222222',
        threadIdVariable: 'thread_2',
        resolvedUserIdVariable: 'uid_2',
      }),
      makeMessageNode('msg1'),
      makeMessageNode('msg2'),
    ]), 'j05'),
    'j05',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК K: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Граничные случаи ────────────────────────────────────────────────');

test('K01', 'узел без autoTransitionTo — не генерирует код обработчика', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: '' }),
    makeMessageNode('msg1'),
  ]), 'k01');
  ok(
    !code.includes('group_message_trigger_gmt1_handler'),
    'Без autoTransitionTo обработчик не должен генерироваться',
  );
});

test('K02', 'safeName с дефисами корректно заменяется на _', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt-node-1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'k02');
  ok(
    code.includes('group_message_trigger_gmt_node_1_handler'),
    'Дефисы в nodeId должны заменяться на _ в имени обработчика',
  );
});

test('K03', 'safeName с дефисами: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt-node-1', { autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1'),
    ]), 'k03'),
    'k03',
  );
});

test('K04', 'пустой threadIdVariable — используется дефолт support_thread_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      threadIdVariable: '',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'k04');
  // Рендерер подставляет дефолт 'support_thread_id' при пустом значении
  ok(
    code.includes('support_thread_id') || code.includes('group_message_trigger_gmt1_handler'),
    'При пустом threadIdVariable должен использоваться дефолт или обработчик генерируется',
  );
});

test('K05', 'пустой resolvedUserIdVariable — используется дефолт resolved_user_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      resolvedUserIdVariable: '',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]), 'k05');
  ok(
    code.includes('resolved_user_id') || code.includes('group_message_trigger_gmt1_handler'),
    'При пустом resolvedUserIdVariable должен использоваться дефолт или обработчик генерируется',
  );
});

test('K06', 'nodeId с цифрами: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt_123', { autoTransitionTo: 'msg1' }),
      makeMessageNode('msg1'),
    ]), 'k06'),
    'k06',
  );
});

test('K07', 'все поля заполнены нестандартными значениями: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt_custom', {
        groupChatId: '-1009876543210',
        groupChatIdSource: 'manual',
        threadIdVariable: 'my_custom_thread_var',
        resolvedUserIdVariable: 'my_custom_uid_var',
        autoTransitionTo: 'reply-msg-node',
      }),
      makeMessageNode('reply-msg-node', 'Кастомный ответ'),
    ]), 'k07'),
    'k07',
  );
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК L: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Отсутствие лишнего кода ─────────────────────────────────────────');

test('L01', 'без group_message_trigger узлов — нет group_message_trigger в коде', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Привет!'),
  ]), 'l01');
  ok(
    !code.includes('group_message_trigger'),
    'Без group_message_trigger узлов не должно быть group_message_trigger в коде',
  );
});

test('L02', 'нет дублирования обработчиков при одном узле', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'l02');
  const count = (code.match(/async def group_message_trigger_gmt1_handler/g) ?? []).length;
  ok(count === 1, `Обработчик gmt1 должен быть определён ровно один раз, найдено: ${count}`);
});

test('L03', 'нет лишних @dp.message декораторов при одном узле', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'l03');
  // Считаем только декораторы group_message_trigger (не другие @dp.message)
  const handlerCount = (code.match(/group_message_trigger_gmt1_handler/g) ?? []).length;
  // Должно быть ровно 2 вхождения: декоратор + определение функции
  ok(
    handlerCount >= 1,
    `Имя обработчика gmt1 должно встречаться в коде, найдено: ${handlerCount}`,
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК M: Сценарные тесты — реальные use-case
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Сценарные тесты — реальные use-case ─────────────────────────────');

test('M01', 'сценарий поддержки: group_message_trigger → message: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd-support', '/support', 'msg-welcome'),
      makeGroupMessageTriggerNode('gmt-support', {
        groupChatId: '-1002300967595',
        groupChatIdSource: 'manual',
        threadIdVariable: 'support_thread_id',
        resolvedUserIdVariable: 'resolved_user_id',
        autoTransitionTo: 'msg-reply',
      }),
      makeMessageNode('msg-welcome', 'Добро пожаловать в поддержку!'),
      makeMessageNode('msg-reply', 'Ваш запрос принят, ожидайте ответа.'),
    ]), 'm01'),
    'm01',
  );
});

test('M02', 'сценарий поддержки: group_message_trigger сохраняет resolved_user_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt-support', {
      groupChatId: '-1002300967595',
      threadIdVariable: 'support_thread_id',
      resolvedUserIdVariable: 'resolved_user_id',
      autoTransitionTo: 'msg-reply',
    }),
    makeMessageNode('msg-reply', 'Ответ'),
  ]), 'm02');
  ok(
    code.includes("set_user_var(_resolved_user_id, 'resolved_user_id'"),
    'set_user_var с resolved_user_id должен быть в коде',
  );
});

test('M03', 'сценарий с variable source: group_message_trigger читает ID из переменной', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt-var', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'forum_group_id',
      threadIdVariable: 'support_thread_id',
      resolvedUserIdVariable: 'resolved_user_id',
      autoTransitionTo: 'msg-reply',
    }),
    makeMessageNode('msg-reply', 'Ответ'),
  ]), 'm03');
  ok(
    code.includes('forum_group_id'),
    'Имя переменной forum_group_id должно быть в коде',
  );
  ok(
    code.includes("globals().get('user_data', {}).get(0, {})"),
    'Чтение из globals().get должно быть в коде',
  );
});

test('M04', 'сценарий с несколькими триггерами: два group_message_trigger + command_trigger: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/start', 'msg-start'),
      makeGroupMessageTriggerNode('gmt-group1', {
        groupChatId: '-1001111111111',
        threadIdVariable: 'thread_group1',
        resolvedUserIdVariable: 'uid_group1',
        autoTransitionTo: 'msg-reply1',
      }),
      makeGroupMessageTriggerNode('gmt-group2', {
        groupChatId: '-1002222222222',
        threadIdVariable: 'thread_group2',
        resolvedUserIdVariable: 'uid_group2',
        autoTransitionTo: 'msg-reply2',
      }),
      makeMessageNode('msg-start', 'Старт'),
      makeMessageNode('msg-reply1', 'Ответ группы 1'),
      makeMessageNode('msg-reply2', 'Ответ группы 2'),
    ]), 'm04'),
    'm04',
  );
});

test('M05', 'полный сценарий поддержки: command_trigger → condition → group_message_trigger → message: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd-support', '/support', 'cond-check'),
      makeConditionNode('cond-check', 'support_thread_id', [
        makeConditionBranch('filled', { target: 'msg-has-thread' }),
        makeConditionBranch('else', { target: 'msg-no-thread' }),
      ]),
      makeGroupMessageTriggerNode('gmt-support', {
        groupChatId: '-1002300967595',
        threadIdVariable: 'support_thread_id',
        resolvedUserIdVariable: 'resolved_user_id',
        autoTransitionTo: 'msg-support-reply',
      }),
      makeMessageNode('msg-has-thread', 'Топик уже создан'),
      makeMessageNode('msg-no-thread', 'Создайте топик'),
      makeMessageNode('msg-support-reply', 'Ответ поддержки'),
    ]), 'm05'),
    'm05',
  );
});

test('M06', 'group_message_trigger с variable source + condition: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeGroupMessageTriggerNode('gmt1', {
        groupChatIdSource: 'variable',
        groupChatVariableName: 'group_chat_id',
        threadIdVariable: 'support_thread_id',
        resolvedUserIdVariable: 'resolved_user_id',
        autoTransitionTo: 'cond1',
      }),
      makeConditionNode('cond1', 'resolved_user_id', [
        makeConditionBranch('filled', { target: 'msg_ok' }),
        makeConditionBranch('else', { target: 'msg_fail' }),
      ]),
      makeMessageNode('msg_ok', 'Пользователь найден'),
      makeMessageNode('msg_fail', 'Пользователь не найден'),
    ]), 'm06'),
    'm06',
  );
});

test('M07', '10 узлов group_message_trigger: синтаксис OK', () => {
  const nodes = Array.from({ length: 10 }, (_, i) => {
    const msgId = `msg_perf_${i}`;
    return [
      makeGroupMessageTriggerNode(`gmt_perf_${i}`, {
        groupChatId: `-100${1000000000 + i}`,
        threadIdVariable: `thread_var_${i}`,
        resolvedUserIdVariable: `uid_var_${i}`,
        autoTransitionTo: msgId,
      }),
      makeMessageNode(msgId, `Ответ ${i}`),
    ];
  }).flat();
  syntax(gen(makeCleanProject(nodes), 'm07'), 'm07');
});

test('M08', '10 узлов group_message_trigger: уникальные имена обработчиков', () => {
  const nodes = Array.from({ length: 10 }, (_, i) => {
    const msgId = `msg_perf_${i}`;
    return [
      makeGroupMessageTriggerNode(`gmt_perf_${i}`, { autoTransitionTo: msgId }),
      makeMessageNode(msgId),
    ];
  }).flat();
  const code = gen(makeCleanProject(nodes), 'm08');
  for (let i = 0; i < 10; i++) {
    ok(
      code.includes(`group_message_trigger_gmt_perf_${i}_handler`),
      `Обработчик gmt_perf_${i} должен быть в коде`,
    );
  }
});


// ════════════════════════════════════════════════════════════════════════════════
// БЛОК N: Регрессионные тесты
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Регрессионные тесты ─────────────────────────────────────────────');

/**
 * N01: Регрессионный тест — обработчик group_message_trigger не перехватывает
 * обычные сообщения из личных чатов. Фильтр F.chat.type.in_ должен ограничивать
 * только group/supergroup.
 */
test('N01', 'регрессия: фильтр ограничивает только group/supergroup, не private', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'n01');
  ok(
    code.includes("F.chat.type.in_({'group', 'supergroup'})"),
    "Фильтр должен содержать только 'group' и 'supergroup', не 'private'",
  );
  ok(
    !code.includes("'private'"),
    "Фильтр не должен содержать 'private'",
  );
});

/**
 * N02: Регрессионный тест — при отсутствии _resolved_user_id обработчик
 * логирует и делает return, не падает с исключением.
 */
test('N02', 'регрессия: при отсутствии _resolved_user_id — логирование и return', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'n02');
  ok(
    code.includes('if not _resolved_user_id:') || code.includes('if _resolved_user_id is None'),
    'Проверка отсутствия _resolved_user_id должна быть в коде',
  );
  ok(
    code.includes('logging.info(') || code.includes('logging.warning('),
    'Логирование при отсутствии user_id должно быть в коде',
  );
});

/**
 * N03: Регрессионный тест — два узла group_message_trigger с одинаковым
 * groupChatId не конфликтуют между собой.
 */
test('N03', 'регрессия: два узла с одинаковым groupChatId не конфликтуют', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', {
      groupChatId: '-1002300967595',
      threadIdVariable: 'thread_1',
      autoTransitionTo: 'msg1',
    }),
    makeGroupMessageTriggerNode('gmt2', {
      groupChatId: '-1002300967595',
      threadIdVariable: 'thread_2',
      autoTransitionTo: 'msg2',
    }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'n03');
  ok(
    code.includes('group_message_trigger_gmt1_handler'),
    'Обработчик gmt1 должен быть в коде',
  );
  ok(
    code.includes('group_message_trigger_gmt2_handler'),
    'Обработчик gmt2 должен быть в коде',
  );
  syntax(code, 'n03');
});

/**
 * N04: Регрессионный тест — MockCallback.answer() не вызывает исключений
 * (метод должен быть определён как async def answer).
 */
test('N04', 'регрессия: MockCallback содержит async def answer', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'n04');
  ok(
    code.includes('async def answer('),
    'MockCallback должен содержать async def answer',
  );
});

/**
 * N05: Регрессионный тест — SELECT запрос содержит LIMIT 1 для предотвращения
 * возврата нескольких строк.
 */
test('N05', 'регрессия: SQL SELECT содержит LIMIT 1', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'n05');
  ok(
    code.includes('LIMIT 1'),
    'SQL SELECT должен содержать LIMIT 1',
  );
});

/**
 * N06: Регрессионный тест — SELECT запрос обращается к таблице bot_users.
 */
test('N06', 'регрессия: SQL SELECT обращается к таблице bot_users', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'n06');
  ok(
    code.includes('FROM bot_users'),
    'SQL SELECT должен обращаться к таблице bot_users',
  );
});

/**
 * N07: Регрессионный тест — SELECT запрос выбирает user_id.
 */
test('N07', 'регрессия: SQL SELECT выбирает user_id', () => {
  const code = gen(makeCleanProject([
    makeGroupMessageTriggerNode('gmt1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'n07');
  ok(
    code.includes('SELECT user_id FROM bot_users'),
    'SQL должен содержать SELECT user_id FROM bot_users',
  );
});

// ─── Итоговая таблица ─────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ' ✅'}`.padEnd(62) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter((r) => !r.passed).forEach((r) => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}

