/**
 * @fileoverview Фаза 19 — Узел forward_message
 *
 * Большой phase-style integration test генератора для узла пересылки сообщений.
 *
 * Блок A: Базовая генерация
 * Блок B: Источник current_message
 * Блок C: Источник manual
 * Блок D: Источник variable
 * Блок E: Источник last_message и lookup по bot_messages
 * Блок F: Получатели manual / variable / admin_ids / multiple recipients
 * Блок G: Интеграция с command_trigger
 * Блок H: Интеграция с text_trigger
 * Блок I: Интеграция со start
 * Блок J: Интеграция с message
 * Блок K: Интеграция с condition
 * Блок L: Интеграция с media
 * Блок M: Интеграция с keyboard и buttons
 * Блок N: Schema parse, safe_name и сохранение данных
 * Блок O: Fallback-поведение и регрессии
 * Блок P: Сложные сценарии с несколькими узлами
 * Блок Q: Отсутствие лишнего кода
 * Блок R: Смеси режимов получателей и disable_notification
 * Блок S: Матрица source/target режимов и общий синтаксис
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { botDataWithSheetsSchema } from '../../shared/schema.ts';

/** Режим источника исходного сообщения для узла пересылки. */
type ForwardSourceMode = 'current_message' | 'last_message' | 'manual' | 'variable';

/** Режим определения чата назначения для узла пересылки. */
type ForwardTargetMode = 'manual' | 'variable' | 'admin_ids';

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

/** Параметры одного получателя пересылки. */
type ForwardRecipient = {
  /** Уникальный идентификатор получателя внутри данных узла. */
  id: string;
  /** Режим получения идентификатора чата назначения. */
  targetChatIdSource: ForwardTargetMode;
  /** Явно заданный chat_id или username чата. */
  targetChatId?: string;
  /** Имя переменной с chat_id. */
  targetChatVariableName?: string;
  /** Тип получателя: "user" — пользователь, "group" — группа или канал */
  targetChatType?: 'user' | 'group';
  /** ID топика (message_thread_id) для форум-групп */
  targetThreadId?: string;
  /** Источник ID топика: "manual" — вручную, "variable" — из переменной */
  targetThreadIdSource?: 'manual' | 'variable';
  /** Имя переменной с ID топика */
  targetThreadIdVariable?: string;
};

/** Опции построения узла пересылки сообщений. */
type ForwardNodeOptions = {
  /** Режим определения исходного сообщения. */
  sourceMessageIdSource?: ForwardSourceMode;
  /** Явно заданный ID исходного сообщения. */
  sourceMessageId?: string;
  /** Имя переменной с ID исходного сообщения. */
  sourceMessageVariableName?: string;
  /** ID связанного узла-источника на холсте. */
  sourceMessageNodeId?: string;
  /** Legacy-режим получения чата назначения. */
  targetChatIdSource?: ForwardTargetMode;
  /** Legacy-значение chat_id или username чата назначения. */
  targetChatId?: string;
  /** Legacy-имя переменной с chat_id назначения. */
  targetChatVariableName?: string;
  /** Новый список получателей пересылки. */
  targetRecipients?: ForwardRecipient[];
  /** Признак тихой отправки без уведомления. */
  disableNotification?: boolean;
  /** Скрыть автора — использует copy_message вместо forward_message. */
  hideAuthor?: boolean;
};

/** Опции построения command_trigger. */
type CommandTriggerOptions = {
  /** Описание команды для меню и README. */
  description?: string;
  /** Доступ только для администраторов. */
  adminOnly?: boolean;
  /** Требование авторизации клиента. */
  requiresAuth?: boolean;
  /** Показывать ли команду в меню. */
  showInMenu?: boolean;
};

/** Опции построения text_trigger. */
type TextTriggerOptions = {
  /** Режим совпадения текста: exact или contains. */
  matchType?: 'exact' | 'contains';
  /** Доступ только для администраторов. */
  adminOnly?: boolean;
  /** Требование авторизации клиента. */
  requiresAuth?: boolean;
};

/** Опции построения media-узла. */
type MediaNodeOptions = {
  /** Включён ли автопереход после отправки медиа. */
  enableAutoTransition?: boolean;
  /** Целевой ID узла для автоперехода. */
  autoTransitionTo?: string;
};

/** Опции построения branch для condition-узла. */
type ConditionBranchOptions = {
  /** Значение ветки, если оператор его использует. */
  value?: string;
  /** Второе значение для операторов диапазона. */
  value2?: string;
  /** Целевой узел для перехода. */
  target?: string;
};

/** Опции построения start-узла. */
type StartNodeOptions = {
  /** Текст стартового сообщения. */
  messageText?: string;
  /** Тип клавиатуры стартового сообщения. */
  keyboardType?: 'inline' | 'reply' | 'none';
  /** Кнопки стартового сообщения. */
  buttons?: any[];
  /** Отдельная keyboard-нода, если клавиатура вынесена. */
  keyboardNodeId?: string;
  /** Дополнительные поля data. */
  extraData?: Record<string, any>;
};

/** Опции построения message-узла. */
type MessageNodeOptions = {
  /** Включён ли автопереход после отправки сообщения. */
  enableAutoTransition?: boolean;
  /** Целевой узел автоперехода. */
  autoTransitionTo?: string;
  /** Тип клавиатуры сообщения. */
  keyboardType?: 'inline' | 'reply' | 'none';
  /** Кнопки сообщения. */
  buttons?: any[];
  /** Отдельная keyboard-нода, если клавиатура вынесена. */
  keyboardNodeId?: string;
  /** Дополнительные данные узла. */
  extraData?: Record<string, any>;
};

/** Итоги выполнения всех сценариев текущей фазы. */
const results: TestResult[] = [];

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
    botName: `Phase19_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/** Генерирует Python-код с включённой пользовательской БД. */
function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase19DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

/** Запускает py_compile и возвращает результат синтаксической проверки. */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p19_${label}.py`;
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

/** Прогоняет проект через schema parse, чтобы убедиться в сохранности данных. */
function parseProject<T>(project: T): T {
  const clone = JSON.parse(JSON.stringify(project)) as any;
  if (Array.isArray(clone?.sheets)) {
    clone.sheets = clone.sheets.map((sheet: any) => ({
      ...sheet,
      createdAt: new Date(sheet.createdAt),
      updatedAt: new Date(sheet.updatedAt),
    }));
  }
  return botDataWithSheetsSchema.parse(clone) as T;
}

/** Возвращает safe_name для Python-обработчиков. */
function safeHandlerName(nodeId: string) {
  return nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
}

/** Возвращает блок кода конкретного обработчика handle_callback_<nodeId>. */
function handlerBlock(code: string, nodeId: string) {
  const marker = `async def handle_callback_${safeHandlerName(nodeId)}(`;
  const start = code.indexOf(marker);
  ok(start !== -1, `Блок обработчика ${nodeId} не найден`);

  const tail = code.slice(start);
  const candidates = [
    tail.indexOf('\nasync def ', marker.length),
    tail.indexOf('\n@dp.', marker.length),
    tail.indexOf('\nif __name__ == "__main__":', marker.length),
  ].filter((index) => index > 0);

  const end = candidates.length > 0 ? Math.min(...candidates) : tail.length;
  return tail.slice(0, end);
}

/** Считает количество вхождений подстроки в сгенерированном коде. */
function countOccurrences(code: string, part: string) {
  return (code.match(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
}

/** Создаёт кнопку для inline/reply клавиатуры. */
function makeButton(id: string, text: string, target: string) {
  return {
    id,
    text,
    action: 'goto',
    target,
    skipDataCollection: false,
    hideAfterClick: false,
  };
}

/** Создаёт описание одного получателя пересылки. */
function makeRecipient(
  id: string,
  targetChatIdSource: ForwardTargetMode,
  data: { targetChatId?: string; targetChatVariableName?: string; targetChatType?: 'user' | 'group'; targetThreadId?: string } = {},
): ForwardRecipient {
  return {
    id,
    targetChatIdSource,
    targetChatId: data.targetChatId ?? '',
    targetChatVariableName: data.targetChatVariableName ?? '',
    targetChatType: data.targetChatType ?? 'user',
    targetThreadId: data.targetThreadId,
  };
}

/** Создаёт узел forward_message с разумными значениями по умолчанию. */
function makeForwardMessageNode(id: string, options: ForwardNodeOptions = {}) {
  return {
    id,
    type: 'forward_message',
    position: { x: 400, y: 0 },
    data: {
      command: '/forward_message',
      sourceMessageIdSource: options.sourceMessageIdSource ?? 'current_message',
      sourceMessageId: options.sourceMessageId ?? '',
      sourceMessageVariableName: options.sourceMessageVariableName ?? '',
      sourceMessageNodeId: options.sourceMessageNodeId ?? '',
      targetChatIdSource: options.targetChatIdSource ?? 'manual',
      targetChatId: options.targetChatId ?? '-1001234567890',
      targetChatVariableName: options.targetChatVariableName ?? '',
      targetChatTargets: options.targetRecipients ?? [],
      disableNotification: options.disableNotification ?? false,
      hideAuthor: options.hideAuthor ?? false,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/** Создаёт узел command_trigger с переходом к целевому узлу. */
function makeCommandTriggerNode(id: string, command: string, targetId: string, options: CommandTriggerOptions = {}) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: options.description ?? 'Команда',
      showInMenu: options.showInMenu ?? true,
      adminOnly: options.adminOnly ?? false,
      requiresAuth: options.requiresAuth ?? false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/** Создаёт узел text_trigger с переходом к целевому узлу. */
function makeTextTriggerNode(id: string, synonyms: string[], targetId: string, options: TextTriggerOptions = {}) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: synonyms,
      textMatchType: options.matchType ?? 'exact',
      adminOnly: options.adminOnly ?? false,
      requiresAuth: options.requiresAuth ?? false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/** Создаёт start-узел с опциональными кнопками и вынесенной keyboard-нодой. */
function makeStartNode(id = 'start1', options: StartNodeOptions = {}) {
  return {
    id,
    type: 'start',
    position: { x: 0, y: -200 },
    data: {
      command: '/start',
      messageText: options.messageText ?? 'Старт',
      keyboardType: options.keyboardType ?? 'none',
      buttons: options.buttons ?? [],
      keyboardNodeId: options.keyboardNodeId ?? '',
      ...(options.extraData ?? {}),
    },
  };
}

/** Создаёт message-узел с поддержкой кнопок, клавиатуры и автоперехода. */
function makeMessageNode(id: string, text = 'Ответ', options: MessageNodeOptions = {}) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: options.buttons ?? [],
      keyboardType: options.keyboardType ?? 'none',
      keyboardNodeId: options.keyboardNodeId ?? '',
      enableAutoTransition: options.enableAutoTransition ?? false,
      autoTransitionTo: options.autoTransitionTo ?? '',
      formatMode: 'none',
      markdown: false,
      ...(options.extraData ?? {}),
    },
  };
}

/** Создаёт media-узел для сценариев пересылки медиа и автопереходов. */
function makeMediaNode(id: string, media: string[], options: MediaNodeOptions = {}) {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: {
      attachedMedia: media,
      enableAutoTransition: options.enableAutoTransition ?? false,
      autoTransitionTo: options.autoTransitionTo ?? '',
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/** Создаёт отдельную keyboard-ноду. */
function makeKeyboardNode(
  id: string,
  keyboardType: 'inline' | 'reply' = 'inline',
  buttons: any[] = [],
  data: Record<string, any> = {},
) {
  return {
    id,
    type: 'keyboard',
    position: { x: 650, y: 0 },
    data: {
      keyboardType,
      buttons,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      ...data,
    },
  };
}

/** Создаёт одну ветку condition-узла. */
function makeConditionBranch(operator: string, options: ConditionBranchOptions = {}) {
  return {
    id: `br_${operator}_${Math.random().toString(36).slice(2, 6)}`,
    label: operator,
    operator,
    value: options.value ?? '',
    value2: options.value2 ?? '',
    target: options.target ?? '',
  };
}

/** Создаёт condition-узел с набором веток. */
function makeConditionNode(id: string, variable: string, branches: any[]) {
  return {
    id,
    type: 'condition',
    position: { x: 200, y: 0 },
    data: {
      variable,
      branches,
    },
  };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 19 — Узел forward_message                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ───────────────────────────────────────────────');

test('A01', 'forward_message генерирует основной callback-обработчик', () => {
  const code = gen(makeCleanProject([makeForwardMessageNode('fwd1')]), 'a01');
  ok(code.includes('async def handle_callback_fwd1(callback_query: types.CallbackQuery):'), 'Обработчик handle_callback_fwd1 должен быть в коде');
});

test('A02', 'forward_message генерирует helper разрешения источника', () => {
  const code = gen(makeCleanProject([makeForwardMessageNode('fwd1')]), 'a02');
  ok(code.includes('async def _resolve_forward_message_source_fwd1'), 'Helper разрешения источника должен быть в коде');
  ok(code.includes('async def _resolve_forward_message_targets_fwd1'), 'Helper разрешения получателей должен быть в коде');
});

test('A03', 'forward_message генерирует вызов bot.forward_message и disable_notification=False', () => {
  const code = gen(makeCleanProject([makeForwardMessageNode('fwd1')]), 'a03');
  ok(code.includes('await bot.forward_message('), 'bot.forward_message должен быть в коде');
  ok(code.includes('disable_notification=False'), 'disable_notification=False должен быть в базовом сценарии');
});

test('A04', 'базовый сценарий forward_message синтаксически корректен', () => {
  syntax(gen(makeCleanProject([makeForwardMessageNode('fwd1')]), 'a04'), 'a04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК B: Источник current_message
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Источник current_message ───────────────────────────────────────');

test('B01', 'current_message использует callback_query.message.message_id как базовый источник', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { sourceMessageIdSource: 'current_message' }),
  ]), 'b01');
  ok(code.includes('source_message_id = callback_query.message.message_id'), 'source_message_id должен браться из текущего callback_query.message');
});

test('B02', 'current_message с привязанным sourceMessageNodeId делает lookup по linked_node_id', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      sourceMessageNodeId: 'msg_source',
    }),
  ]), 'b02');
  ok(code.includes("linked_source_node_id = 'msg_source'"), 'linked source node должен сохраняться в коде разрешения источника');
});

test('B03', 'current_message с привязанным sourceMessageNodeId включает lookup helper по bot_messages', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      sourceMessageNodeId: 'msg_source',
    }),
  ]), 'b03');
  ok(code.includes('FROM bot_messages'), 'Lookup по bot_messages должен быть в коде');
  ok(code.includes('AND node_id = $3'), 'Lookup привязанного узла должен фильтровать по node_id');
});

test('B04', 'current_message с привязанным sourceMessageNodeId синтаксически корректен', () => {
  const code = genDB(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      sourceMessageNodeId: 'msg_source',
    }),
  ]), 'b04');
  syntax(code, 'b04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК C: Источник manual
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Источник manual ───────────────────────────────────────────────');

test('C01', 'manual вставляет literal sourceMessageId в raw_source_message_id', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'manual',
      sourceMessageId: '777',
    }),
  ]), 'c01');
  ok(code.includes("raw_source_message_id = '777'"), 'Literal sourceMessageId должен быть встроен в код');
});

test('C02', 'manual содержит защиту от нечислового message_id с warning и fallback', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'manual',
      sourceMessageId: 'manual-id',
    }),
  ]), 'c02');
  ok(code.includes('is not numeric, using current message'), 'Должен быть warning о нечисловом sourceMessageId');
});

test('C03', 'manual сохраняет общий fallback на текущее сообщение', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'manual',
      sourceMessageId: 'manual-id',
    }),
  ]), 'c03');
  ok(code.includes('return source_chat_id, source_message_id'), 'Даже manual-режим должен сохранять fallback на текущее сообщение');
});

test('C04', 'manual синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'manual',
      sourceMessageId: '12345',
    }),
  ]), 'c04'), 'c04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК D: Источник variable
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Источник variable ─────────────────────────────────────────────');

test('D01', 'variable инициализирует all_user_vars и читает sourceMessageVariableName', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'variable',
      sourceMessageVariableName: 'source_message_id',
    }),
  ]), 'd01');
  ok(code.includes('await init_all_user_vars(user_id)'), 'variable-режим должен инициализировать all_user_vars');
  ok(code.includes("_all_vars.get('source_message_id', \"\")"), 'variable-режим должен читать source_message_id из переменных');
});

test('D02', 'variable поддерживает имя переменной с подчёркиваниями без потери', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'variable',
      sourceMessageVariableName: 'last_saved_message_id',
    }),
  ]), 'd02');
  ok(code.includes("_all_vars.get('last_saved_message_id', \"\")"), 'Имя переменной должно быть встроено без искажений');
});

test('D03', 'variable можно комбинировать с manual target без ломки генерации', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'variable',
      sourceMessageVariableName: 'source_message_id',
      targetChatIdSource: 'manual',
      targetChatId: '@target_channel',
    }),
  ]), 'd03');
  ok(code.includes('source_message_id'), 'Код variable source должен остаться в сценарии');
  ok(code.includes('@target_channel'), 'Manual target должен остаться в сценарии');
});

test('D04', 'variable синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'variable',
      sourceMessageVariableName: 'source_message_id',
    }),
  ]), 'd04'), 'd04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК E: Источник last_message и lookup по bot_messages
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Источник last_message ────────────────────────────────────────');

test('E01', 'last_message передаёт use_last_logged=True в helper загрузки из bot_messages', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
    }),
  ]), 'e01');
  ok(code.includes('use_last_logged=True'), 'last_message должен использовать use_last_logged=True');
});

test('E02', 'last_message содержит SQL lookup последнего сообщения из bot_messages', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
    }),
  ]), 'e02');
  ok(code.includes('FROM bot_messages'), 'last_message должен использовать bot_messages');
  ok(code.includes('WHERE user_id = $1'), 'last_message должен уметь искать по user_id');
});

test('E03', 'last_message с sourceMessageNodeId передаёт одновременно linked_node_id и use_last_logged=True', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
      sourceMessageNodeId: 'msg_source',
    }),
  ]), 'e03');
  ok(code.includes("linked_source_node_id = 'msg_source'"), 'При last_message должен сохраняться linked source node');
  ok(code.includes('use_last_logged=True'), 'При last_message должен передаваться флаг use_last_logged=True');
});

test('E04', 'last_message синтаксически корректен', () => {
  syntax(genDB(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
    }),
  ]), 'e04'), 'e04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК F: Получатели manual / variable / admin_ids / multiple recipients
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Получатели и target modes ───────────────────────────────────');

test('F01', 'manual-recipient вставляет literal target chat id в код', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('target_manual', 'manual', { targetChatId: '-1001234567890' }),
      ],
    }),
  ]), 'f01');
  ok(code.includes("_raw_target_chat_id = '-1001234567890'"), 'Manual recipient должен встраивать chat_id literal');
});

test('F02', 'variable-recipient читает targetChatVariableName из all_user_vars', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
      ],
    }),
  ]), 'f02');
  ok(code.includes("_all_vars.get('target_chat_id', \"\")"), 'Variable recipient должен читать target_chat_id из переменных');
});

test('F03', 'admin_ids-recipient использует ADMIN_IDS', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
      ],
    }),
  ]), 'f03');
  ok(code.includes('for admin_id in ADMIN_IDS:'), 'admin_ids должен разворачиваться через ADMIN_IDS');
});

test('F04', 'multiple recipients содержат dedupe-логику target_chat_ids', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
        makeRecipient('target_manual', 'manual', { targetChatId: '@channel_name' }),
      ],
    }),
  ]), 'f04');
  ok(code.includes('if admin_id not in target_chat_ids'), 'Дедупликация admin_ids должна быть в коде');
  ok(code.includes('if _normalized_target_chat_id not in target_chat_ids'), 'Дедупликация variable/manual recipients должна быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК G: Интеграция с command_trigger
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Интеграция с command_trigger ────────────────────────────────');

test('G01', 'command_trigger вызывает handle_callback_forward через mock_callback', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd_fwd', '/forward', 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'g01');
  ok(code.includes('await handle_callback_fwd1(mock_callback)'), 'command_trigger должен вести в forward_message через mock_callback');
});

test('G02', 'несколько command_trigger могут вести в один forward_message без дублирования обработчика', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd_fwd_1', '/forward1', 'fwd1'),
    makeCommandTriggerNode('cmd_fwd_2', '/forward2', 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'g02');
  ok(countOccurrences(code, 'async def handle_callback_fwd1(') === 1, 'Для forward_message должен оставаться один реальный обработчик без затирающего дубля');
});

test('G03', 'command_trigger и forward_message с linked source node сосуществуют без конфликтов', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd_fwd', '/forward', 'fwd1'),
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'msg_source' }),
  ]), 'g03');
  ok(code.includes('await handle_callback_fwd1(mock_callback)'), 'Переход command_trigger -> forward_message должен сохраниться');
  ok(code.includes("linked_source_node_id = 'msg_source'"), 'Lookup привязанного источника должен сохраниться');
});

test('G04', 'integration command_trigger + forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd_fwd', '/forward', 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'g04'), 'g04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК H: Интеграция с text_trigger
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Интеграция с text_trigger ───────────────────────────────────');

test('H01', 'text_trigger exact вызывает handle_callback_forward через mock_callback', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt_fwd', ['перешли'], 'fwd1', { matchType: 'exact' }),
    makeForwardMessageNode('fwd1'),
  ]), 'h01');
  ok(code.includes('await handle_callback_fwd1(mock_callback)'), 'text_trigger exact должен вести в forward_message');
});

test('H02', 'text_trigger contains может вести в forward_message', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt_fwd', ['перешли'], 'fwd1', { matchType: 'contains' }),
    makeForwardMessageNode('fwd1'),
  ]), 'h02');
  ok(code.includes('await handle_callback_fwd1(mock_callback)'), 'text_trigger contains должен вести в forward_message');
});

test('H03', 'несколько text_trigger могут вести в один forward_message без дублирования обработчика', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt_fwd_1', ['перешли'], 'fwd1'),
    makeTextTriggerNode('txt_fwd_2', ['forward'], 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'h03');
  ok(countOccurrences(code, 'async def handle_callback_fwd1(') === 1, 'Для forward_message должен оставаться один реальный обработчик без затирающего дубля');
});

test('H04', 'integration text_trigger + forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeTextTriggerNode('txt_fwd', ['перешли'], 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'h04'), 'h04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК I: Интеграция со start
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Интеграция со start ─────────────────────────────────────────');

test('I01', 'start с inline-кнопкой на forward_message содержит callback_data целевого узла', () => {
  const code = gen(makeCleanProject([
    makeStartNode('start1', {
      keyboardType: 'inline',
      buttons: [makeButton('btn_forward', 'Переслать', 'fwd1')],
    }),
    makeForwardMessageNode('fwd1'),
  ]), 'i01');
  ok(code.includes('callback_data="fwd1"'), 'Кнопка start должна содержать callback_data="fwd1"');
  ok(code.includes('async def handle_callback_fwd1(callback_query: types.CallbackQuery):'), 'Обработчик forward_message должен быть сгенерирован');
});

test('I02', 'start может сосуществовать с condition, ведущим в forward_message', () => {
  const code = gen(makeCleanProject([
    makeStartNode('start1'),
    makeConditionNode('cond1', 'step', [
      makeConditionBranch('filled', { target: 'fwd1' }),
      makeConditionBranch('else', { target: 'msg1' }),
    ]),
    makeForwardMessageNode('fwd1'),
    makeMessageNode('msg1', 'Финал'),
  ]), 'i02');
  ok(code.includes('async def handle_callback_cond1'), 'Condition должен быть сгенерирован');
  ok(code.includes('await handle_callback_fwd1(callback_query)'), 'Condition должен уметь вести в forward_message');
});

test('I03', 'start и forward_message с sourceMessageNodeId на message-узел не ломают генерацию', () => {
  const code = gen(makeCleanProject([
    makeStartNode('start1'),
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'msg_source' }),
  ]), 'i03');
  ok(code.includes("linked_source_node_id = 'msg_source'"), 'Lookup привязанного message-узла должен сохраниться');
});

test('I04', 'integration start + forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeStartNode('start1', {
      keyboardType: 'inline',
      buttons: [makeButton('btn_forward', 'Переслать', 'fwd1')],
    }),
    makeForwardMessageNode('fwd1'),
  ]), 'i04'), 'i04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК J: Интеграция с message
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Интеграция с message ───────────────────────────────────────');

test('J01', 'message с autoTransitionTo на forward_message вызывает handle_callback_<id>(fake_callback)', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Шаг 1', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'j01');
  ok(code.includes('await handle_callback_fwd1(fake_callback)'), 'Автопереход message -> forward_message должен идти через fake_callback');
});

test('J02', 'message с inline-кнопкой на forward_message содержит callback_data целевого узла', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Выберите действие', {
      keyboardType: 'inline',
      buttons: [makeButton('btn_forward', 'Переслать', 'fwd1')],
    }),
    makeForwardMessageNode('fwd1'),
  ]), 'j02');
  ok(code.includes('callback_data="fwd1"'), 'Message-кнопка должна вести на forward_message');
});

test('J03', 'message с отдельной keyboard-нодой может вести в forward_message', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Хост', { keyboardNodeId: 'kbd1' }),
    makeKeyboardNode('kbd1', 'inline', [makeButton('btn_forward', 'Переслать', 'fwd1')]),
    makeForwardMessageNode('fwd1'),
  ]), 'j03');
  ok(code.includes('callback_data="fwd1"'), 'Separate keyboard node должна вести на forward_message');
  ok(code.includes('async def handle_callback_fwd1(callback_query: types.CallbackQuery):'), 'Обработчик forward_message должен присутствовать');
});

test('J04', 'integration message + forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeMessageNode('msg1', 'Шаг 1', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'j04'), 'j04');
});

test('J05', 'message -> forward_message с source-link сохраняет и автопереход, и lookup привязанного источника', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Шаг 1', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'msg1' }),
  ]), 'j05');
  const messageHandler = handlerBlock(code, 'msg1');
  ok(messageHandler.includes('await handle_callback_fwd1(fake_callback)'), 'Автопереход должен запускать forward_message и при source-link');
  ok(messageHandler.includes('⚡ Автопереход от узла msg1 к узлу fwd1'), 'В обработчике message должен остаться автопереход в forward_message');
  ok(code.includes("linked_source_node_id = 'msg1'"), 'Привязка sourceMessageNodeId должна остаться в генерации');
});

test('J06', 'message с video-источником передаёт node_id в answer_video для последующего lookup по sourceMessageNodeId', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg_video', 'Видео', {
      extraData: {
        attachedMedia: ['/uploads/demo.mp4'],
      },
    }),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'msg_video' }),
  ]), 'j06');
  const messageHandler = handlerBlock(code, 'msg_video');
  ok(messageHandler.includes('sent_message = await callback_query.message.answer_video'), 'Message handler должен сохранять отправленное video-сообщение в sent_message');
  ok(messageHandler.includes('node_id="msg_video"'), 'answer_video должен передавать node_id для логирования и lookup источника');
});

test('J07', 'message без явного autoTransitionTo запускает linked forward_message по sourceMessageNodeId', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'msg_source' }),
  ]), 'j07');
  const messageHandler = handlerBlock(code, 'msg_source');
  ok(messageHandler.includes('await handle_callback_fwd1(fake_callback)'), 'Связанный forward_message должен запускаться и без явного autoTransitionTo в source node');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК K: Интеграция с condition
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Интеграция с condition ─────────────────────────────────────');

test('K01', 'condition filled может вести в forward_message', () => {
  const code = gen(makeCleanProject([
    makeConditionNode('cond1', 'step', [makeConditionBranch('filled', { target: 'fwd1' })]),
    makeForwardMessageNode('fwd1'),
  ]), 'k01');
  const condition = handlerBlock(code, 'cond1');
  ok(condition.includes('await handle_callback_fwd1(callback_query)'), 'Condition filled должен вести в forward_message');
});

test('K02', 'condition else может вести в forward_message', () => {
  const code = gen(makeCleanProject([
    makeConditionNode('cond1', 'step', [makeConditionBranch('else', { target: 'fwd1' })]),
    makeForwardMessageNode('fwd1'),
  ]), 'k02');
  const condition = handlerBlock(code, 'cond1');
  ok(condition.includes('await handle_callback_fwd1(callback_query)'), 'Condition else должен вести в forward_message');
});

test('K03', 'condition с несколькими ветками сохраняет и forward_message, и message-цели', () => {
  const code = gen(makeCleanProject([
    makeConditionNode('cond1', 'step', [
      makeConditionBranch('filled', { target: 'fwd1' }),
      makeConditionBranch('else', { target: 'msg1' }),
    ]),
    makeForwardMessageNode('fwd1'),
    makeMessageNode('msg1', 'Финал'),
  ]), 'k03');
  const condition = handlerBlock(code, 'cond1');
  ok(condition.includes('await handle_callback_fwd1(callback_query)'), 'Ветка condition должна вести в forward_message');
  ok(condition.includes('await handle_callback_msg1(callback_query)'), 'Ветка condition должна вести и в message');
});

test('K04', 'integration condition + forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeConditionNode('cond1', 'step', [makeConditionBranch('filled', { target: 'fwd1' })]),
    makeForwardMessageNode('fwd1'),
  ]), 'k04'), 'k04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК L: Интеграция с media
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Интеграция с media ─────────────────────────────────────────');

test('L01', 'media с autoTransitionTo на forward_message вызывает handle_callback_<id>(fake_cb)', () => {
  const code = gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'l01');
  ok(code.includes('await handle_callback_fwd1(fake_cb)'), 'Автопереход media -> forward_message должен идти через fake_cb');
});

test('L02', 'forward_message может использовать media-узел как sourceMessageNodeId', () => {
  const code = gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg']),
    makeForwardMessageNode('fwd1', {
      sourceMessageNodeId: 'media1',
      sourceMessageIdSource: 'current_message',
    }),
  ]), 'l02');
  ok(code.includes("linked_source_node_id = 'media1'"), 'Lookup должен уметь искать последнее сообщение media-узла');
});

test('L03', 'media + forward_message с несколькими получателями не ломают генерацию', () => {
  const code = gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
        makeRecipient('target_manual', 'manual', { targetChatId: '@channel_name' }),
      ],
    }),
  ]), 'l03');
  ok(code.includes('for admin_id in ADMIN_IDS:'), 'admin_ids должен сохраниться в media-сценарии');
  ok(code.includes('@channel_name'), 'manual recipient должен сохраниться в media-сценарии');
});

test('L04', 'integration media + forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'l04'), 'l04');
});

test('L05', 'media -> forward_message с source-link сохраняет и автопереход, и lookup привязанного источника', () => {
  const code = gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'media1' }),
  ]), 'l05');
  ok(code.includes('await handle_callback_fwd1(fake_cb)'), 'Автопереход media -> forward_message должен генерироваться и при source-link');
  ok(code.includes("linked_source_node_id = 'media1'"), 'Привязка media-источника должна остаться в генерации');
});

test('L06', 'media без явного autoTransitionTo запускает linked forward_message по sourceMessageNodeId', () => {
  const code = gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg']),
    makeForwardMessageNode('fwd1', { sourceMessageNodeId: 'media1' }),
  ]), 'l06');
  ok(code.includes('await handle_callback_fwd1(fake_cb)'), 'Связанный forward_message должен запускаться и без явного autoTransitionTo у media-узла');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК M: Интеграция с keyboard и buttons
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Интеграция с keyboard и buttons ────────────────────────────');

test('M01', 'inline-кнопка message-узла может вести в forward_message', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Меню', {
      keyboardType: 'inline',
      buttons: [makeButton('btn_forward', 'Переслать', 'fwd1')],
    }),
    makeForwardMessageNode('fwd1'),
  ]), 'm01');
  ok(code.includes('callback_data="fwd1"'), 'Inline-кнопка должна содержать callback_data="fwd1"');
});

test('M02', 'reply-кнопка message-узла может сосуществовать с forward_message без синтаксических ошибок', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Меню', {
      keyboardType: 'reply',
      buttons: [makeButton('btn_forward', 'Переслать', 'fwd1')],
    }),
    makeForwardMessageNode('fwd1'),
  ]), 'm02');
  ok(code.includes('handle_callback_fwd1'), 'Forward handler должен присутствовать и в reply-сценарии');
  syntax(code, 'm02');
});

test('M03', 'отдельная keyboard-нода с несколькими кнопками может включать переход в forward_message', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Хост', { keyboardNodeId: 'kbd1' }),
    makeKeyboardNode('kbd1', 'inline', [
      makeButton('btn_forward', 'Переслать', 'fwd1'),
      makeButton('btn_next', 'Далее', 'msg2'),
    ]),
    makeForwardMessageNode('fwd1'),
    makeMessageNode('msg2', 'Далее'),
  ]), 'm03');
  ok(code.includes('callback_data="fwd1"'), 'Separate keyboard должна содержать переход в forward_message');
  ok(code.includes('callback_data="msg2"'), 'Separate keyboard должна сохранять и переход в обычный message');
});

test('M04', 'keyboard/button integration с forward_message синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeMessageNode('msg1', 'Меню', {
      keyboardType: 'inline',
      buttons: [makeButton('btn_forward', 'Переслать', 'fwd1')],
    }),
    makeForwardMessageNode('fwd1'),
  ]), 'm04'), 'm04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК N: Schema parse, safe_name и сохранение данных
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Schema parse и safe_name ───────────────────────────────────');

test('N01', 'schema parse сохраняет массив targetChatTargets для forward_message', () => {
  const project = parseProject(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
      ],
    }),
  ]));
  const node = (project as any).sheets[0].nodes[0];
  ok(Array.isArray(node.data.targetChatTargets), 'targetChatTargets должен остаться массивом после schema parse');
  ok(node.data.targetChatTargets.length === 2, 'targetChatTargets должен сохранить количество получателей');
});

test('N02', 'schema parse сохраняет sourceMessageNodeId и sourceMessageIdSource', () => {
  const project = parseProject(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
      sourceMessageNodeId: 'msg-source',
    }),
  ]));
  const node = (project as any).sheets[0].nodes[0];
  ok(node.data.sourceMessageIdSource === 'last_message', 'sourceMessageIdSource должен сохраниться');
  ok(node.data.sourceMessageNodeId === 'msg-source', 'sourceMessageNodeId должен сохраниться');
});

test('N03', 'safe_name применяется к ID forward_message с дефисами', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd-node-1'),
  ]), 'n03');
  ok(code.includes('async def handle_callback_fwd_node_1(callback_query: types.CallbackQuery):'), 'ID с дефисами должен санитизироваться в safe_name');
});

test('N04', 'forward_message с ID и sourceMessageNodeId с дефисами синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeMessageNode('msg-source-1', 'Источник'),
    makeForwardMessageNode('fwd-node-1', {
      sourceMessageNodeId: 'msg-source-1',
    }),
  ]), 'n04'), 'n04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК O: Fallback-поведение и регрессии
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок O: Fallback и регрессии ───────────────────────────────────────');

test('O01', 'forward_message без получателей показывает alert про отсутствие чата назначения', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetChatId: '',
      targetRecipients: [],
    }),
  ]), 'o01');
  ok(code.includes('Не удалось определить чат назначения'), 'Должен быть alert про отсутствие чата назначения');
});

test('O02', 'lookup helper честно содержит fallback при отсутствии db_pool', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { sourceMessageIdSource: 'last_message' }),
  ]), 'o02');
  ok(code.includes('db_pool_ref = globals().get("db_pool")'), 'Lookup helper должен проверять db_pool');
  ok(code.includes('if not db_pool_ref:'), 'Lookup helper должен делать fallback, если db_pool нет');
});

test('O03', 'lookup helper честно содержит logging.warning при ошибке загрузки из bot_messages', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { sourceMessageIdSource: 'last_message' }),
  ]), 'o03');
  ok(code.includes('failed to load source from bot_messages'), 'Должен быть warning о проблемах чтения bot_messages');
});

test('O04', 'один forward_message генерирует один helper _resolve_forward_message_source_<id>', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd_fwd', '/forward', 'fwd1'),
    makeTextTriggerNode('txt_fwd', ['перешли'], 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'o04');
  ok(countOccurrences(code, 'async def _resolve_forward_message_source_fwd1') === 1, 'Helper разрешения источника не должен дублироваться');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК P: Сложные сценарии с несколькими узлами
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок P: Сложные сценарии ────────────────────────────────────────────');

test('P01', 'command_trigger → condition → forward_message + message генерируется корректно', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/route', 'cond1'),
    makeConditionNode('cond1', 'step', [
      makeConditionBranch('filled', { target: 'fwd1' }),
      makeConditionBranch('else', { target: 'msg1' }),
    ]),
    makeForwardMessageNode('fwd1'),
    makeMessageNode('msg1', 'Фолбэк'),
  ]), 'p01');
  ok(code.includes('await handle_callback_cond1(mock_callback)'), 'Command trigger должен вести в condition');
  ok(code.includes('await handle_callback_fwd1(callback_query)'), 'Condition должен уметь вести в forward_message');
  ok(code.includes('await handle_callback_msg1(callback_query)'), 'Condition должен уметь вести и в message');
});

test('P02', 'text_trigger → message(auto) → forward_message работает как единая цепочка', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt1', ['перешли'], 'msg1'),
    makeMessageNode('msg1', 'Подготовка', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'p02');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'Text trigger должен вести в message');
  ok(code.includes('await handle_callback_fwd1(fake_callback)'), 'Message должен автопереходить в forward_message');
});

test('P03', 'media(auto) → condition → forward_message/manual recipient работает как единая цепочка', () => {
  const code = gen(makeCleanProject([
    makeMediaNode('media1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'cond1' }),
    makeConditionNode('cond1', 'step', [makeConditionBranch('else', { target: 'fwd1' })]),
    makeForwardMessageNode('fwd1', { targetChatId: '@channel_name' }),
  ]), 'p03');
  ok(code.includes('await handle_callback_cond1(fake_cb)'), 'Media должен автопереходить в condition');
  ok(code.includes('await handle_callback_fwd1(callback_query)'), 'Condition должен вести в forward_message');
  ok(code.includes('@channel_name'), 'Manual recipient должен сохраняться в сложной цепочке');
});

test('P04', 'сложный сценарий с БД и несколькими получателями синтаксически корректен', () => {
  syntax(genDB(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/route', 'msg1'),
    makeMessageNode('msg1', 'Подготовка', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
      sourceMessageNodeId: 'msg1',
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
        makeRecipient('target_manual', 'manual', { targetChatId: '@channel_name' }),
      ],
      disableNotification: true,
    }),
  ]), 'p04'), 'p04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК Q: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок Q: Отсутствие лишнего кода ────────────────────────────────────');

test('Q01', 'проект только с forward_message не содержит MockCallback из trigger-шаблонов', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1'),
  ]), 'q01');
  ok(!code.includes('class MockCallback:'), 'Без trigger-узлов код не должен содержать MockCallback');
});

test('Q02', 'проект без text_trigger не содержит @dp.message(lambda', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg1', 'Шаг 1', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'q02');
  ok(!code.includes('@dp.message(lambda'), 'Без text_trigger не должно быть @dp.message(lambda ... )');
});

test('Q03', 'проект без command_trigger не содержит @dp.message(Command(', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt1', ['перешли'], 'fwd1'),
    makeForwardMessageNode('fwd1'),
  ]), 'q03');
  ok(!code.includes('@dp.message(Command('), 'Без command_trigger не должно быть @dp.message(Command(...))');
});

test('Q04', 'несколько входящих связей не дублируют handle_callback_forward', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/forward', 'fwd1'),
    makeTextTriggerNode('txt1', ['перешли'], 'fwd1'),
    makeMessageNode('msg1', 'Подготовка', { enableAutoTransition: true, autoTransitionTo: 'fwd1' }),
    makeForwardMessageNode('fwd1'),
  ]), 'q04');
  ok(countOccurrences(code, 'async def handle_callback_fwd1(') === 1, 'При нескольких входящих связях должен оставаться один обработчик forward_message');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК R: Смеси режимов получателей и disable_notification
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок R: Смешанные получатели и disable_notification ───────────────');

test('R01', 'admin_ids + manual recipient сосуществуют в одном forward_message', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
        makeRecipient('target_manual', 'manual', { targetChatId: '-100555000111' }),
      ],
    }),
  ]), 'r01');
  ok(code.includes('for admin_id in ADMIN_IDS:'), 'admin_ids должен сохраниться');
  ok(code.includes("_raw_target_chat_id = '-100555000111'"), 'manual recipient должен сохраниться');
});

test('R02', 'variable + manual recipients сосуществуют в одном forward_message', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
        makeRecipient('target_manual', 'manual', { targetChatId: '@channel_name' }),
      ],
    }),
  ]), 'r02');
  ok(code.includes("_all_vars.get('target_chat_id', \"\")"), 'Variable recipient должен сохраниться');
  ok(code.includes('@channel_name'), 'Manual recipient должен сохраниться');
});

test('R03', 'disableNotification=true превращается в disable_notification=True', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { disableNotification: true }),
  ]), 'r03');
  ok(code.includes('disable_notification=True'), 'disableNotification=true должен конвертироваться в disable_notification=True');
});

test('R04', 'disableNotification=false превращается в disable_notification=False', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { disableNotification: false }),
  ]), 'r04');
  ok(code.includes('disable_notification=False'), 'disableNotification=false должен конвертироваться в disable_notification=False');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК S: Матрица source/target режимов и общий синтаксис
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок S: Матрица source/target режимов ─────────────────────────────');

test('S01', 'current_message + manual target синтаксически корректны', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      targetChatIdSource: 'manual',
      targetChatId: '-1001234567890',
    }),
  ]), 's01'), 's01');
});

test('S02', 'manual source + variable target синтаксически корректны', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'manual',
      sourceMessageId: '12345',
      targetRecipients: [
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
      ],
    }),
  ]), 's02'), 's02');
});

test('S03', 'variable source + admin_ids target синтаксически корректны', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'variable',
      sourceMessageVariableName: 'source_message_id',
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
      ],
    }),
  ]), 's03'), 's03');
});

test('S04', 'last_message + multiple recipients + linked source node синтаксически корректны', () => {
  syntax(genDB(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'last_message',
      sourceMessageNodeId: 'msg_source',
      targetRecipients: [
        makeRecipient('admins', 'admin_ids'),
        makeRecipient('target_manual', 'manual', { targetChatId: '@channel_name' }),
        makeRecipient('target_variable', 'variable', { targetChatVariableName: 'target_chat_id' }),
      ],
      disableNotification: true,
    }),
  ]), 's04'), 's04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК T: targetChatType — нормализация ID группы/канала
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок T: targetChatType — нормализация ID группы/канала ─────────');

test('T01', 'targetChatType=group + числовой ID → добавляется -100 префикс', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group' })],
    }),
  ]), 't01');
  ok(code.includes("'group'"), "targetChatType 'group' должен быть в коде");
  ok(code.includes('-100{_normalized_target_chat_id}'), '-100 нормализация должна быть в коде');
});

test('T02', 'targetChatType=user + числовой ID → -100 префикс НЕ добавляется', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '123456789', targetChatType: 'user' })],
    }),
  ]), 't02');
  ok(code.includes("'user'"), "targetChatType 'user' должен быть в коде");
});

test('T03', 'targetChatType=group синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group' })],
    }),
  ]), 't03'), 't03');
});

test('T04', 'targetChatType=user синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '123456789', targetChatType: 'user' })],
    }),
  ]), 't04'), 't04');
});

test('T05', 'targetChatType не указан → дефолт user, нет -100 нормализации для коротких ID', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '123456' })],
    }),
  ]), 't05');
  ok(code.includes("'user'"), "дефолтный targetChatType должен быть 'user'");
});

test('T06', 'два получателя: один user, один group → оба targetChatType в коде', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '123456789', targetChatType: 'user' }),
        makeRecipient('r2', 'manual', { targetChatId: '2300967595', targetChatType: 'group' }),
      ],
    }),
  ]), 't06');
  ok(code.includes("'user'"), "'user' должен быть в коде");
  ok(code.includes("'group'"), "'group' должен быть в коде");
});

test('T07', 'два получателя user+group синтаксически корректны', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '123456789', targetChatType: 'user' }),
        makeRecipient('r2', 'manual', { targetChatId: '2300967595', targetChatType: 'group' }),
      ],
    }),
  ]), 't07'), 't07');
});

test('T08', 'targetChatType=group + @username → нет числовой нормализации (ValueError path)', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '@mychannel', targetChatType: 'group' })],
    }),
  ]), 't08'), 't08');
});

test('T09', 'targetChatType=group + variable source синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'variable', { targetChatVariableName: 'chat_id', targetChatType: 'group' })],
    }),
  ]), 't09'), 't09');
});

test('T10', 'targetChatType=group + variable → нормализация присутствует в variable-блоке', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'variable', { targetChatVariableName: 'chat_id', targetChatType: 'group' })],
    }),
  ]), 't10');
  ok(code.includes('-100{_normalized_target_chat_id}'), '-100 нормализация должна быть в variable-блоке');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК U: targetThreadId — пересылка в топик форум-группы
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок U: targetThreadId — пересылка в топик форум-группы ────────────');

test('U01', 'targetThreadId set → target_thread_ids словарь присутствует в коде', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group', targetThreadId: '615' })],
    }),
  ]), 'u01');
  ok(code.includes('target_thread_ids'), 'target_thread_ids должен быть в коде при заданном targetThreadId');
  ok(code.includes("'615'"), 'thread_id 615 должен быть встроен в код');
});

test('U02', 'targetThreadId set → message_thread_id передаётся в bot.forward_message', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group', targetThreadId: '615' })],
    }),
  ]), 'u02');
  ok(code.includes('message_thread_id=target_thread_ids.get(target_chat_id)'), 'message_thread_id должен передаваться в bot.forward_message');
});

test('U03', 'targetThreadId пустой → target_thread_ids остаётся пустым', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group' })],
    }),
  ]), 'u03');
  ok(code.includes('target_thread_ids = {}'), 'target_thread_ids должен инициализироваться пустым словарём');
});

test('U04', 'targetThreadId set → синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group', targetThreadId: '615' })],
    }),
  ]), 'u04'), 'u04');
});

test('U05', 'targetThreadId не задан → синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group' })],
    }),
  ]), 'u05'), 'u05');
});

test('U06', 'несколько получателей: один с threadId, один без → оба корректно обрабатываются', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '2300967595', targetChatType: 'group', targetThreadId: '615' }),
        makeRecipient('r2', 'manual', { targetChatId: '-1009999999', targetChatType: 'group' }),
      ],
    }),
  ]), 'u06');
  ok(code.includes("'615'"), 'thread_id 615 должен быть в коде');
  ok(code.includes('message_thread_id=target_thread_ids.get(target_chat_id)'), 'message_thread_id должен передаваться');
  syntax(code, 'u06');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК V: incoming_message_trigger + топик (source_chat_id > 0 fallback)
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок V: incoming_message_trigger + топик (source_chat_id > 0) ────────');

test('V01', 'current_message генерирует fallback source_chat_id > 0 с use_last_logged=True', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '-1002300967595', targetChatType: 'group', targetThreadId: '618' }),
      ],
    }),
  ]), 'v01');
  ok(code.includes('source_chat_id > 0'), 'Должна быть проверка source_chat_id > 0 для fallback');
  ok(code.includes('use_last_logged=True'), 'Fallback должен использовать use_last_logged=True');
});

test('V02', 'current_message + source_chat_id > 0 fallback идёт после linked_source_node_id lookup', () => {
  const code = gen(makeCleanProject([
    makeMessageNode('msg_source', 'Источник'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      sourceMessageNodeId: 'msg_source',
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '-1002300967595', targetChatType: 'group', targetThreadId: '618' }),
      ],
    }),
  ]), 'v02');
  const linkedIdx = code.indexOf('linked_source_node_id and');
  const fallbackIdx = code.indexOf('source_chat_id > 0');
  ok(linkedIdx !== -1, 'linked_source_node_id lookup должен присутствовать');
  ok(fallbackIdx !== -1, 'source_chat_id > 0 fallback должен присутствовать');
  ok(linkedIdx < fallbackIdx, 'linked_source_node_id lookup должен идти раньше source_chat_id > 0 fallback');
});

test('V03', 'current_message + incoming_message_trigger + топик синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/forward', 'fwd1'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '-1002300967595', targetChatType: 'group', targetThreadId: '618' }),
      ],
    }),
  ]), 'v03'), 'v03');
});

test('V04', 'current_message без linked_source_node_id тоже имеет source_chat_id > 0 fallback', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
    }),
  ]), 'v04');
  ok(code.includes('source_chat_id > 0'), 'Fallback source_chat_id > 0 должен быть даже без linked_source_node_id');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК W: targetThreadIdSource=variable — ID топика из переменной
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок W: targetThreadIdSource=variable ───────────────────────────────');

test('W01', 'targetThreadIdSource=variable → init_all_user_vars вызывается для получения thread_id', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [{
        id: 'r1',
        targetChatIdSource: 'manual',
        targetChatId: '2300967595',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
  ]), 'w01');
  ok(code.includes('init_all_user_vars(user_id)'), 'init_all_user_vars должен вызываться для получения thread_id из переменной');
  ok(code.includes("'support_thread_id'"), 'Имя переменной support_thread_id должно быть в коде');
});

test('W02', 'targetThreadIdSource=variable → _thread_var_val присутствует в коде', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [{
        id: 'r1',
        targetChatIdSource: 'manual',
        targetChatId: '2300967595',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
  ]), 'w02');
  ok(code.includes('_thread_var_val'), '_thread_var_val должен присутствовать в коде');
});

test('W03', 'targetThreadIdSource=variable → target_thread_ids заполняется из переменной', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [{
        id: 'r1',
        targetChatIdSource: 'manual',
        targetChatId: '2300967595',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
  ]), 'w03');
  ok(code.includes('target_thread_ids[_normalized_target_chat_id]'), 'target_thread_ids должен заполняться из переменной');
});

test('W04', 'targetThreadIdSource=variable + targetChatIdSource=variable → оба из переменных', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      targetRecipients: [{
        id: 'r1',
        targetChatIdSource: 'variable',
        targetChatVariableName: 'forum_chat_id',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
  ]), 'w04');
  ok(code.includes("'forum_chat_id'"), 'forum_chat_id должен быть в коде');
  ok(code.includes("'support_thread_id'"), 'support_thread_id должен быть в коде');
  ok(code.includes('_thread_var_val'), '_thread_var_val должен быть в коде');
});

test('W05', 'targetThreadIdSource=variable синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/support', 'fwd1'),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      targetRecipients: [{
        id: 'r1',
        targetChatIdSource: 'manual',
        targetChatId: '2300967595',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
  ]), 'w05'), 'w05');
});

test('W06', 'targetThreadIdSource=variable + condition → полный сценарий поддержки синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'cond1'),
    makeConditionNode('cond1', 'support_thread_id', [
      makeConditionBranch('filled', { target: 'fwd1' }),
      makeConditionBranch('empty', { target: 'msg1' }),
    ]),
    makeForwardMessageNode('fwd1', {
      sourceMessageIdSource: 'current_message',
      targetRecipients: [{
        id: 'r1',
        targetChatIdSource: 'manual',
        targetChatId: '2300967595',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
    makeMessageNode('msg1', 'Сначала создайте топик'),
  ]), 'w06'), 'w06');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК Y: hideAuthor — пересылка без ссылки на автора (copy_message)
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок Y: hideAuthor — copy_message вместо forward_message ────────────');

test('Y01', 'hideAuthor=true генерирует bot.copy_message вместо bot.forward_message', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { hideAuthor: true }),
  ]), 'y01');
  ok(code.includes('await bot.copy_message('), 'При hideAuthor=true должен генерироваться bot.copy_message');
  ok(!code.includes('await bot.forward_message('), 'При hideAuthor=true не должно быть bot.forward_message');
});

test('Y02', 'hideAuthor=false (дефолт) генерирует bot.forward_message', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { hideAuthor: false }),
  ]), 'y02');
  ok(code.includes('await bot.forward_message('), 'При hideAuthor=false должен генерироваться bot.forward_message');
  ok(!code.includes('await bot.copy_message('), 'При hideAuthor=false не должно быть bot.copy_message');
});

test('Y03', 'hideAuthor не указан → дефолт false → генерируется bot.forward_message', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1'),
  ]), 'y03');
  ok(code.includes('await bot.forward_message('), 'По умолчанию должен генерироваться bot.forward_message');
  ok(!code.includes('await bot.copy_message('), 'По умолчанию не должно быть bot.copy_message');
});

test('Y04', 'hideAuthor=true синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { hideAuthor: true }),
  ]), 'y04'), 'y04');
});

test('Y05', 'hideAuthor=true + disableNotification=true корректно комбинируются', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', { hideAuthor: true, disableNotification: true }),
  ]), 'y05');
  ok(code.includes('await bot.copy_message('), 'Должен быть bot.copy_message');
  ok(code.includes('disable_notification=True'), 'disable_notification=True должен присутствовать');
  syntax(code, 'y05');
});

test('Y06', 'hideAuthor=true + manual recipient содержит copy_message с правильным chat_id', () => {
  const code = gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      hideAuthor: true,
      targetRecipients: [
        makeRecipient('r1', 'manual', { targetChatId: '123456789', targetChatType: 'user' }),
      ],
    }),
  ]), 'y06');
  ok(code.includes('await bot.copy_message('), 'bot.copy_message должен быть в коде');
  ok(code.includes('chat_id=target_chat_id'), 'chat_id должен передаваться в copy_message');
});

test('Y07', 'hideAuthor=true + variable recipient синтаксически корректен', () => {
  syntax(gen(makeCleanProject([
    makeForwardMessageNode('fwd1', {
      hideAuthor: true,
      targetRecipients: [
        makeRecipient('r1', 'variable', { targetChatVariableName: 'support_user_id' }),
      ],
    }),
  ]), 'y07'), 'y07');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК X: Полный сценарий поддержки (support-forum-topic-demo)
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок X: Полный сценарий поддержки ───────────────────────────────────');

/** Строит полный граф поддержки из support-forum-topic-demo/project.json */
function makeSupportDemoProject() {
  return makeCleanProject([
    // /start → проверка топика
    makeCommandTriggerNode('cmd-support', '/start', 'cond-check-thread'),
    makeConditionNode('cond-check-thread', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'create-support-topic' }),
      makeConditionBranch('filled', { target: 'msg-topic-exists' }),
    ]),
    // Создание топика
    {
      id: 'create-support-topic',
      type: 'create_forum_topic',
      position: { x: 660, y: 150 },
      data: {
        forumChatIdSource: 'manual',
        forumChatId: '-1001234567890',
        forumChatVariableName: '',
        topicName: 'Поддержка {user_name}',
        topicIconColor: '9367192',
        saveThreadIdTo: 'support_thread_id',
        skipIfExists: true,
        enableAutoTransition: true,
        autoTransitionTo: 'msg-topic-created',
      },
    },
    makeMessageNode('msg-topic-created', '✅ Ваш топик поддержки создан!'),
    makeMessageNode('msg-topic-exists', 'ℹ️ У вас уже есть открытый топик поддержки.'),
    // Автопересылка сообщений в топик
    {
      id: 'imt-relay',
      type: 'incoming_message_trigger',
      position: { x: 100, y: 600 },
      data: { autoTransitionTo: 'fwd-to-topic', buttons: [], keyboardType: 'none' },
    },
    makeForwardMessageNode('fwd-to-topic', {
      sourceMessageIdSource: 'current_message',
      targetRecipients: [{
        id: 'target-forum',
        targetChatIdSource: 'manual',
        targetChatId: '-1001234567890',
        targetChatType: 'group',
        targetThreadIdSource: 'variable',
        targetThreadIdVariable: 'support_thread_id',
      }],
    }),
    // /close → завершение обращения
    makeCommandTriggerNode('cmd-close', '/close', 'cond-close-check'),
    makeConditionNode('cond-close-check', 'support_thread_id', [
      makeConditionBranch('filled', { target: 'msg-closed' }),
      makeConditionBranch('empty', { target: 'msg-no-topic' }),
    ]),
    makeMessageNode('msg-closed', '✅ Ваше обращение завершено.'),
    makeMessageNode('msg-no-topic', 'ℹ️ У вас нет активного обращения.'),
  ]);
}

test('X01', 'полный сценарий поддержки синтаксически корректен', () => {
  syntax(gen(makeSupportDemoProject(), 'x01'), 'x01');
});

test('X02', 'полный сценарий: /start → condition → create_forum_topic присутствует', () => {
  const code = gen(makeSupportDemoProject(), 'x02');
  ok(code.includes('await bot.create_forum_topic('), 'create_forum_topic должен быть в коде');
  ok(code.includes('support_thread_id'), 'support_thread_id должен быть в коде');
});

test('X03', 'полный сценарий: incoming_message_trigger → forward_message с thread из переменной', () => {
  const code = gen(makeSupportDemoProject(), 'x03');
  ok(code.includes('_thread_var_val'), 'Получение thread_id из переменной должно быть в коде');
  ok(code.includes("'support_thread_id'"), 'Имя переменной support_thread_id должно быть в коде');
  ok(code.includes('await bot.forward_message('), 'bot.forward_message должен быть в коде');
});

test('X04', 'полный сценарий: /close → condition → msg-closed присутствует', () => {
  const code = gen(makeSupportDemoProject(), 'x04');
  ok(code.includes('handle_callback_msg_closed') || code.includes('msg-closed'), 'Обработчик msg-closed должен быть в коде');
  ok(code.includes('handle_callback_msg_no_topic') || code.includes('msg-no-topic'), 'Обработчик msg-no-topic должен быть в коде');
});

test('X05', 'полный сценарий: два command_trigger (/start и /close) оба присутствуют', () => {
  const code = gen(makeSupportDemoProject(), 'x05');
  ok(code.includes('Command("start")'), '/start handler должен быть в коде');
  ok(code.includes('Command("close")'), '/close handler должен быть в коде');
});

test('X06', 'полный сценарий с БД синтаксически корректен', () => {
  syntax(genDB(makeSupportDemoProject(), 'x06'), 'x06');
});

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
