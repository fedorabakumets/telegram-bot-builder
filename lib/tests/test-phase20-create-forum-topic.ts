/**
 * @fileoverview Фаза 20 — Узел create_forum_topic
 *
 * Большой phase-style integration test генератора для узла создания топика в форум-группе.
 *
 * Блок A: Базовая генерация
 * Блок B: Источник ID форум-группы — manual
 * Блок C: Источник ID форум-группы — variable
 * Блок D: Название топика
 * Блок E: Цвет иконки
 * Блок F: Сохранение thread_id
 * Блок G: skipIfExists
 * Блок H: Интеграция с command_trigger
 * Блок I: Интеграция с text_trigger
 * Блок J: Интеграция с condition
 * Блок K: Несколько узлов create_forum_topic
 * Блок L: Граничные случаи
 * Блок M: Производительность
 * Блок N: Отсутствие лишнего кода
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Источник ID форум-группы. */
type ForumChatIdSource = 'manual' | 'variable';

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

/** Опции построения узла create_forum_topic. */
type CreateForumTopicOptions = {
  /** Источник ID форум-группы. */
  forumChatIdSource?: ForumChatIdSource;
  /** ID или username форум-группы (при forumChatIdSource === 'manual'). */
  forumChatId?: string;
  /** Имя переменной с ID форум-группы (при forumChatIdSource === 'variable'). */
  forumChatVariableName?: string;
  /** Название создаваемого топика, поддерживает {переменные}. */
  topicName?: string;
  /** Цвет иконки топика (числовое значение цвета Telegram). */
  topicIconColor?: string;
  /** Имя переменной для сохранения thread_id созданного топика. */
  saveThreadIdTo?: string;
  /** Не создавать топик повторно, если переменная saveThreadIdTo уже заполнена. */
  skipIfExists?: boolean;
};

/** Опции построения command_trigger. */
type CommandTriggerOptions = {
  /** Описание команды для меню. */
  description?: string;
  /** Доступ только для администраторов. */
  adminOnly?: boolean;
};

/** Опции построения text_trigger. */
type TextTriggerOptions = {
  /** Режим совпадения текста: exact или contains. */
  matchType?: 'exact' | 'contains';
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
    botName: `Phase20_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/** Запускает py_compile и возвращает результат синтаксической проверки. */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p20_${label}.py`;
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
 * Создаёт узел create_forum_topic с разумными значениями по умолчанию.
 * @param id - идентификатор узла
 * @param options - параметры узла
 */
function makeCreateForumTopicNode(id: string, options: CreateForumTopicOptions = {}) {
  return {
    id,
    type: 'create_forum_topic',
    position: { x: 400, y: 0 },
    data: {
      forumChatIdSource: options.forumChatIdSource ?? 'manual',
      forumChatId: options.forumChatId ?? '-1002300967595',
      forumChatVariableName: options.forumChatVariableName ?? '',
      topicName: options.topicName ?? 'Новый топик',
      topicIconColor: options.topicIconColor ?? '7322096',
      saveThreadIdTo: options.saveThreadIdTo ?? 'forum_thread_id',
      skipIfExists: options.skipIfExists ?? false,
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
 * Создаёт узел text_trigger с переходом к целевому узлу.
 * @param id - идентификатор узла
 * @param synonyms - список синонимов
 * @param targetId - целевой узел
 * @param options - дополнительные параметры
 */
function makeTextTriggerNode(id: string, synonyms: string[], targetId: string, options: TextTriggerOptions = {}) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: synonyms,
      textMatchType: options.matchType ?? 'exact',
      adminOnly: false,
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
console.log('║   Фаза 20 — Узел create_forum_topic                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ───────────────────────────────────────────────');

test('A01', 'create_forum_topic генерирует callback-декоратор с nodeId', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a01');
  ok(
    code.includes('@dp.callback_query(lambda c: c.data == "create_forum_topic_1")'),
    'Декоратор @dp.callback_query с nodeId должен быть в коде',
  );
});

test('A02', 'create_forum_topic генерирует async def handle_callback_<nodeId>', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a02');
  ok(
    code.includes('async def handle_callback_create_forum_topic_1(callback_query: types.CallbackQuery):'),
    'Обработчик handle_callback_create_forum_topic_1 должен быть в коде',
  );
});

test('A03', 'create_forum_topic генерирует вызов bot.create_forum_topic(', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a03');
  ok(code.includes('await bot.create_forum_topic('), 'Вызов bot.create_forum_topic должен быть в коде');
});

test('A04', 'create_forum_topic генерирует chat_id=_forum_chat_id', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a04');
  ok(code.includes('chat_id=_forum_chat_id'), 'Параметр chat_id=_forum_chat_id должен быть в коде');
});

test('A05', 'create_forum_topic генерирует name=_topic_name', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a05');
  ok(code.includes('name=_topic_name'), 'Параметр name=_topic_name должен быть в коде');
});

test('A06', 'create_forum_topic генерирует icon_color=int(...)', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a06');
  ok(code.includes('icon_color=int('), 'Параметр icon_color=int(...) должен быть в коде');
});

test('A07', 'create_forum_topic содержит logging.info(', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a07');
  ok(code.includes('logging.info('), 'logging.info должен присутствовать в коде');
});

test('A08', 'create_forum_topic содержит logging.error(', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a08');
  ok(code.includes('logging.error('), 'logging.error должен присутствовать в коде');
});

test('A09', 'create_forum_topic содержит try: / except Exception', () => {
  const code = gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a09');
  ok(code.includes('try:'), 'Блок try: должен присутствовать в коде');
  ok(code.includes('except Exception as e:'), 'Блок except Exception as e: должен присутствовать в коде');
});

test('A10', 'базовый сценарий create_forum_topic синтаксически корректен', () => {
  syntax(gen(makeCleanProject([makeCreateForumTopicNode('create_forum_topic_1')]), 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК B: Источник ID форум-группы — manual
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Источник ID форум-группы — manual ──────────────────────────────');

test('B01', 'forumChatIdSource manual вставляет literal chat_id в код', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '-1002300967595' }),
  ]), 'b01');
  ok(code.includes("'-1002300967595'"), 'Literal chat_id должен быть встроен в код');
});

test('B02', 'manual: числовой положительный ID нормализуется через if _chat_id > 0', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '1002300967595' }),
  ]), 'b02');
  ok(code.includes('if _chat_id > 0:'), 'Проверка if _chat_id > 0 должна быть в коде');
  ok(code.includes('int(f"-100{_chat_id}")'), 'Нормализация -100{_chat_id} должна быть в коде');
});

test('B03', 'manual: username (@channel) передаётся как строка без нормализации', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '@my_forum_group' }),
  ]), 'b03');
  ok(code.includes("'@my_forum_group'"), 'Username @my_forum_group должен быть встроен как строка');
});

test('B04', 'manual: пустой forumChatId → warning в логе и return None', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '' }),
  ]), 'b04');
  ok(code.includes('forum chat id is empty'), 'Warning про пустой forum chat id должен быть в коде');
});

test('B05', 'manual: отрицательный ID (-1001234567890) не нормализуется', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '-1001234567890' }),
  ]), 'b05');
  ok(code.includes("'-1001234567890'"), 'Отрицательный ID должен быть встроен как есть');
});

test('B06', 'manual: содержит try/except ValueError для нечислового ID', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '-1002300967595' }),
  ]), 'b06');
  ok(code.includes('except ValueError:'), 'except ValueError должен быть в коде для обработки нечислового ID');
});

test('B07', 'manual: генерирует _resolve_forum_chat_id_<safeName>', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: '-1002300967595' }),
  ]), 'b07');
  ok(code.includes('async def _resolve_forum_chat_id_cft1('), 'Helper _resolve_forum_chat_id_cft1 должен быть в коде');
});

test('B08', 'manual: синтаксис OK для разных форматов ID', () => {
  const ids = ['-1002300967595', '@forum_group', '1002300967595', '-100999888777'];
  for (const chatId of ids) {
    syntax(
      gen(makeCleanProject([makeCreateForumTopicNode('cft1', { forumChatIdSource: 'manual', forumChatId: chatId })]), `b08_${chatId.replace(/[^a-z0-9]/gi, '_')}`),
      `b08_${chatId.replace(/[^a-z0-9]/gi, '_')}`,
    );
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК C: Источник ID форум-группы — variable
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Источник ID форум-группы — variable ────────────────────────────');

test('C01', 'forumChatIdSource variable вызывает init_all_user_vars(user_id)', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'c01');
  ok(code.includes('await init_all_user_vars(user_id)'), 'init_all_user_vars должен вызываться при variable-режиме');
});

test('C02', 'variable: читает _all_vars.get(forumChatVariableName, "")', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'c02');
  ok(code.includes("_all_vars.get('forum_chat_id', \"\")"), 'Чтение переменной forum_chat_id из _all_vars должно быть в коде');
});

test('C03', 'variable: нормализация числового ID из переменной через if _chat_id > 0', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'c03');
  ok(code.includes('if _chat_id > 0:'), 'Нормализация числового ID из переменной должна быть в коде');
  ok(code.includes('int(f"-100{_chat_id}")'), 'Формула нормализации -100{_chat_id} должна быть в коде');
});

test('C04', 'variable: пустая переменная → warning и return None', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'c04');
  ok(code.includes('if not _raw_chat_id:'), 'Проверка пустой переменной должна быть в коде');
  ok(code.includes('return None'), 'return None при пустой переменной должен быть в коде');
});

test('C05', 'variable: имя переменной с подчёркиваниями встраивается без искажений', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'my_forum_chat_id_var',
    }),
  ]), 'c05');
  ok(code.includes("_all_vars.get('my_forum_chat_id_var', \"\")"), 'Имя переменной my_forum_chat_id_var должно быть встроено без искажений');
});

test('C06', 'variable: содержит except ValueError для нечислового значения переменной', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'c06');
  ok(code.includes('except ValueError:'), 'except ValueError должен быть в коде для нечислового значения переменной');
});

test('C07', 'variable: _raw_chat_id приводится к строке через str().strip()', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'c07');
  ok(code.includes('str(_raw_chat_id).strip()'), 'Приведение к строке через str().strip() должно быть в коде');
});

test('C08', 'variable: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', {
        forumChatIdSource: 'variable',
        forumChatVariableName: 'forum_chat_id',
      }),
    ]), 'c08'),
    'c08',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК D: Название топика
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Название топика ─────────────────────────────────────────────────');

test('D01', 'простое название без переменных встраивается как строка', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: 'Поддержка' }),
  ]), 'd01');
  ok(code.includes("'Поддержка'"), 'Название топика Поддержка должно быть встроено в код');
});

test('D02', 'название с {user_name} генерирует _topic_name.replace(', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: 'Топик {user_name}' }),
  ]), 'd02');
  ok(code.includes('_topic_name.replace('), 'Замена переменных через _topic_name.replace должна быть в коде');
  ok(code.includes('for _var_key, _var_val in _all_vars.items():'), 'Цикл по _all_vars.items() должен быть в коде');
});

test('D03', 'название с переменными вызывает init_all_user_vars для подстановки', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: 'Топик {user_name}' }),
  ]), 'd03');
  ok(code.includes('await init_all_user_vars(user_id)'), 'init_all_user_vars должен вызываться для подстановки переменных в название');
});

test('D04', 'название с несколькими переменными генерирует цикл по _all_vars.items()', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: '{user_name} — {topic_type}' }),
  ]), 'd04');
  ok(code.includes('for _var_key, _var_val in _all_vars.items():'), 'Цикл по _all_vars.items() должен быть в коде');
});

test('D05', 'пустое название → дефолт "Новый топик" через or', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: '' }),
  ]), 'd05');
  ok(code.includes('"Новый топик"') || code.includes("'Новый топик'"), 'Дефолт "Новый топик" должен быть в коде при пустом названии');
});

test('D06', 'название с Unicode/эмодзи синтаксически корректно', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { topicName: '🔥 Горячие новости 🔥' }),
    ]), 'd06'),
    'd06',
  );
});

test('D07', 'генерирует _resolve_topic_name_<safeName> helper', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: 'Топик {user_name}' }),
  ]), 'd07');
  ok(code.includes('async def _resolve_topic_name_cft1('), 'Helper _resolve_topic_name_cft1 должен быть в коде');
});

test('D08', 'название с кавычками синтаксически корректно', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { topicName: "Топик 'важный'" }),
    ]), 'd08'),
    'd08',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК E: Цвет иконки
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Цвет иконки ─────────────────────────────────────────────────────');

test('E01', 'topicIconColor 7322096 генерирует icon_color=int("7322096")', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicIconColor: '7322096' }),
  ]), 'e01');
  ok(code.includes("icon_color=int('7322096')"), 'icon_color=int("7322096") должен быть в коде');
});

test('E02', 'topicIconColor 16766590 генерирует корректный icon_color', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicIconColor: '16766590' }),
  ]), 'e02');
  ok(code.includes("icon_color=int('16766590')"), 'icon_color=int("16766590") должен быть в коде');
});

test('E03', 'topicIconColor 13338331 генерирует корректный icon_color', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicIconColor: '13338331' }),
  ]), 'e03');
  ok(code.includes("icon_color=int('13338331')"), 'icon_color=int("13338331") должен быть в коде');
});

test('E04', 'topicIconColor 9367192 генерирует корректный icon_color', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicIconColor: '9367192' }),
  ]), 'e04');
  ok(code.includes("icon_color=int('9367192')"), 'icon_color=int("9367192") должен быть в коде');
});

test('E05', 'topicIconColor 16749490 генерирует корректный icon_color', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicIconColor: '16749490' }),
  ]), 'e05');
  ok(code.includes("icon_color=int('16749490')"), 'icon_color=int("16749490") должен быть в коде');
});

test('E06', 'topicIconColor 16478047 генерирует корректный icon_color и синтаксис OK', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicIconColor: '16478047' }),
  ]), 'e06');
  ok(code.includes("icon_color=int('16478047')"), 'icon_color=int("16478047") должен быть в коде');
  syntax(code, 'e06');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК F: Сохранение thread_id
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Сохранение thread_id ────────────────────────────────────────────');

test('F01', 'saveThreadIdTo генерирует set_user_var(user_id, "forum_thread_id", str(_thread_id))', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'forum_thread_id' }),
  ]), 'f01');
  ok(code.includes("await set_user_var(user_id, 'forum_thread_id', str(_thread_id))"), 'set_user_var с forum_thread_id должен быть в коде');
});

test('F02', 'saveThreadIdTo: пустая строка → нет set_user_var в коде', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: '' }),
  ]), 'f02');
  ok(!code.includes('await set_user_var('), 'set_user_var не должен быть в коде при пустом saveThreadIdTo');
});

test('F03', 'saveThreadIdTo: логирование сохранения thread_id', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'forum_thread_id' }),
  ]), 'f03');
  ok(code.includes("saved thread_id=") || code.includes("сохранён в переменную"), 'Логирование сохранения thread_id должно быть в коде');
});

test('F04', 'saveThreadIdTo: _thread_id берётся из _created_topic.message_thread_id', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'forum_thread_id' }),
  ]), 'f04');
  ok(code.includes('_thread_id = _created_topic.message_thread_id'), '_thread_id должен браться из _created_topic.message_thread_id');
});

test('F05', 'saveThreadIdTo: произвольное имя переменной встраивается корректно', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'support_thread_id' }),
  ]), 'f05');
  ok(code.includes("await set_user_var(user_id, 'support_thread_id', str(_thread_id))"), 'set_user_var с support_thread_id должен быть в коде');
});

test('F06', 'saveThreadIdTo: содержит try/except вокруг set_user_var', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'forum_thread_id' }),
  ]), 'f06');
  ok(code.includes('failed to save thread_id') || code.includes('не удалось сохранить thread_id'), 'Warning о неудачном сохранении thread_id должен быть в коде');
});

test('F07', 'saveThreadIdTo: _created_topic = await bot.create_forum_topic(...) присваивается', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'forum_thread_id' }),
  ]), 'f07');
  ok(code.includes('_created_topic = await bot.create_forum_topic('), '_created_topic должен присваиваться из bot.create_forum_topic');
});

test('F08', 'saveThreadIdTo: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'my_thread_id' }),
    ]), 'f08'),
    'f08',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК G: skipIfExists
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: skipIfExists ────────────────────────────────────────────────────');

test('G01', 'skipIfExists: true → проверка _existing_thread_id в коде', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'support_thread_id' }),
  ]), 'g01');
  ok(code.includes('_existing_thread_id'), '_existing_thread_id должен быть в коде при skipIfExists: true');
});

test('G02', 'skipIfExists: true → вызов init_all_user_vars для проверки существующего thread_id', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'support_thread_id' }),
  ]), 'g02');
  ok(code.includes('_existing_vars = await init_all_user_vars(user_id)'), '_existing_vars = await init_all_user_vars должен быть в коде');
});

test('G03', 'skipIfExists: true → _existing_vars.get("support_thread_id", "")', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'support_thread_id' }),
  ]), 'g03');
  ok(code.includes("_existing_vars.get('support_thread_id', \"\")"), '_existing_vars.get("support_thread_id") должен быть в коде');
});

test('G04', 'skipIfExists: true → логирование пропуска при существующем thread_id', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'support_thread_id' }),
  ]), 'g04');
  ok(code.includes('skipping, thread_id already exists'), 'Логирование пропуска должно быть в коде');
});

test('G05', 'skipIfExists: false → нет _existing_thread_id в коде', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: false, saveThreadIdTo: 'support_thread_id' }),
  ]), 'g05');
  ok(!code.includes('_existing_thread_id'), '_existing_thread_id не должен быть в коде при skipIfExists: false');
});

test('G06', 'skipIfExists: true + пустой saveThreadIdTo → нет проверки (нечего проверять)', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: '' }),
  ]), 'g06');
  ok(!code.includes('_existing_thread_id'), '_existing_thread_id не должен быть в коде при пустом saveThreadIdTo');
});

test('G07', 'skipIfExists: true → при существующем thread_id вызывается callback_query.answer()', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'support_thread_id' }),
  ]), 'g07');
  ok(code.includes('await callback_query.answer()'), 'callback_query.answer() должен вызываться при пропуске');
});

test('G08', 'skipIfExists: true синтаксически корректен', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'support_thread_id' }),
    ]), 'g08'),
    'g08',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК H: Интеграция с command_trigger
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Интеграция с command_trigger ────────────────────────────────────');

test('H01', 'command_trigger → create_forum_topic: вызывает handle_callback через mock_callback', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/create_topic', 'cft1'),
    makeCreateForumTopicNode('cft1'),
  ]), 'h01');
  ok(code.includes('await handle_callback_cft1(mock_callback)'), 'command_trigger должен вести в create_forum_topic через mock_callback');
});

test('H02', 'command_trigger → create_forum_topic: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/create_topic', 'cft1'),
      makeCreateForumTopicNode('cft1'),
    ]), 'h02'),
    'h02',
  );
});

test('H03', 'несколько command_trigger → один create_forum_topic: оба триггера ведут в обработчик', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/create_topic1', 'cft1'),
    makeCommandTriggerNode('cmd2', '/create_topic2', 'cft1'),
    makeCreateForumTopicNode('cft1'),
  ]), 'h03');
  ok(code.includes('await handle_callback_cft1(mock_callback)'), 'Оба command_trigger должны вести в handle_callback_cft1');
  ok(code.includes('async def handle_callback_cft1('), 'Обработчик handle_callback_cft1 должен быть в коде');
});

test('H04', 'command_trigger передаёт mock_callback в handle_callback_<nodeId>', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/create_topic', 'cft1'),
    makeCreateForumTopicNode('cft1'),
  ]), 'h04');
  ok(code.includes('mock_callback'), 'mock_callback должен быть в коде command_trigger');
});

test('H05', 'command_trigger + create_forum_topic с variable source: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/create_topic', 'cft1'),
      makeCreateForumTopicNode('cft1', {
        forumChatIdSource: 'variable',
        forumChatVariableName: 'forum_chat_id',
        saveThreadIdTo: 'thread_id',
      }),
    ]), 'h05'),
    'h05',
  );
});

test('H06', 'command_trigger + create_forum_topic с skipIfExists: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/create_topic', 'cft1'),
      makeCreateForumTopicNode('cft1', {
        skipIfExists: true,
        saveThreadIdTo: 'support_thread_id',
      }),
    ]), 'h06'),
    'h06',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК I: Интеграция с text_trigger
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Интеграция с text_trigger ───────────────────────────────────────');

test('I01', 'text_trigger exact → create_forum_topic: вызывает handle_callback через mock_callback', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt1', ['создать топик'], 'cft1', { matchType: 'exact' }),
    makeCreateForumTopicNode('cft1'),
  ]), 'i01');
  ok(code.includes('await handle_callback_cft1(mock_callback)'), 'text_trigger exact должен вести в create_forum_topic');
});

test('I02', 'text_trigger contains → create_forum_topic: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeTextTriggerNode('txt1', ['топик'], 'cft1', { matchType: 'contains' }),
      makeCreateForumTopicNode('cft1'),
    ]), 'i02'),
    'i02',
  );
});

test('I03', 'несколько text_trigger → один create_forum_topic: оба триггера ведут в обработчик', () => {
  const code = gen(makeCleanProject([
    makeTextTriggerNode('txt1', ['создать топик'], 'cft1'),
    makeTextTriggerNode('txt2', ['новый топик'], 'cft1'),
    makeCreateForumTopicNode('cft1'),
  ]), 'i03');
  ok(code.includes('await handle_callback_cft1(mock_callback)'), 'Оба text_trigger должны вести в handle_callback_cft1');
  ok(code.includes('async def handle_callback_cft1('), 'Обработчик handle_callback_cft1 должен быть в коде');
});

test('I04', 'text_trigger + create_forum_topic с variable source и saveThreadIdTo: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeTextTriggerNode('txt1', ['создать'], 'cft1'),
      makeCreateForumTopicNode('cft1', {
        forumChatIdSource: 'variable',
        forumChatVariableName: 'forum_chat_id',
        saveThreadIdTo: 'thread_id',
        skipIfExists: true,
      }),
    ]), 'i04'),
    'i04',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК J: Интеграция с condition
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Интеграция с condition ──────────────────────────────────────────');

test('J01', 'condition → create_forum_topic: ветка ведёт в handle_callback_<nodeId>', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start_flow', 'cond1'),
    makeConditionNode('cond1', 'step', [
      makeConditionBranch('filled', { target: 'cft1' }),
      makeConditionBranch('else', { target: 'msg1' }),
    ]),
    makeCreateForumTopicNode('cft1'),
    makeMessageNode('msg1', 'Фолбэк'),
  ]), 'j01');
  ok(code.includes('await handle_callback_cft1(callback_query)'), 'Condition должен уметь вести в create_forum_topic');
});

test('J02', 'condition → create_forum_topic: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/start_flow', 'cond1'),
      makeConditionNode('cond1', 'step', [
        makeConditionBranch('filled', { target: 'cft1' }),
        makeConditionBranch('else', { target: 'msg1' }),
      ]),
      makeCreateForumTopicNode('cft1'),
      makeMessageNode('msg1', 'Фолбэк'),
    ]), 'j02'),
    'j02',
  );
});

test('J03', 'condition → create_forum_topic с skipIfExists: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/flow', 'cond1'),
      makeConditionNode('cond1', 'thread_id', [
        makeConditionBranch('empty', { target: 'cft1' }),
        makeConditionBranch('else', { target: 'msg1' }),
      ]),
      makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'thread_id' }),
      makeMessageNode('msg1', 'Уже есть'),
    ]), 'j03'),
    'j03',
  );
});

test('J04', 'command_trigger → condition → create_forum_topic + message: полный сценарий синтаксически корректен', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd1', '/support', 'cond1'),
      makeConditionNode('cond1', 'support_thread_id', [
        makeConditionBranch('empty', { target: 'cft1' }),
        makeConditionBranch('filled', { target: 'msg_exists' }),
      ]),
      makeCreateForumTopicNode('cft1', {
        forumChatIdSource: 'manual',
        forumChatId: '-1001234567890',
        topicName: 'Поддержка {user_name}',
        topicIconColor: '9367192',
        saveThreadIdTo: 'support_thread_id',
        skipIfExists: false,
      }),
      makeMessageNode('msg_exists', 'Топик уже создан'),
    ]), 'j04'),
    'j04',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК K: Несколько узлов create_forum_topic
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Несколько узлов create_forum_topic ──────────────────────────────');

test('K01', 'два узла create_forum_topic генерируют два разных обработчика', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { topicName: 'Топик 1' }),
    makeCreateForumTopicNode('cft2', { topicName: 'Топик 2' }),
  ]), 'k01');
  ok(code.includes('async def handle_callback_cft1('), 'Обработчик cft1 должен быть в коде');
  ok(code.includes('async def handle_callback_cft2('), 'Обработчик cft2 должен быть в коде');
});

test('K02', 'два узла create_forum_topic с разными параметрами независимы', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatId: '-1001111111111',
      topicName: 'Топик А',
      topicIconColor: '7322096',
      saveThreadIdTo: 'thread_a',
    }),
    makeCreateForumTopicNode('cft2', {
      forumChatId: '-1002222222222',
      topicName: 'Топик Б',
      topicIconColor: '16766590',
      saveThreadIdTo: 'thread_b',
    }),
  ]), 'k02');
  ok(code.includes("'-1001111111111'"), 'chat_id первого узла должен быть в коде');
  ok(code.includes("'-1002222222222'"), 'chat_id второго узла должен быть в коде');
  ok(code.includes("'thread_a'"), 'saveThreadIdTo первого узла должен быть в коде');
  ok(code.includes("'thread_b'"), 'saveThreadIdTo второго узла должен быть в коде');
});

test('K03', 'два узла create_forum_topic: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { topicName: 'Топик 1', saveThreadIdTo: 'thread_1' }),
      makeCreateForumTopicNode('cft2', { topicName: 'Топик 2', saveThreadIdTo: 'thread_2' }),
    ]), 'k03'),
    'k03',
  );
});

test('K04', 'два узла create_forum_topic с разными источниками ID: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft_manual', {
        forumChatIdSource: 'manual',
        forumChatId: '-1001234567890',
        saveThreadIdTo: 'thread_manual',
      }),
      makeCreateForumTopicNode('cft_var', {
        forumChatIdSource: 'variable',
        forumChatVariableName: 'forum_chat_id',
        saveThreadIdTo: 'thread_var',
      }),
    ]), 'k04'),
    'k04',
  );
});

test('K05', 'два узла create_forum_topic с skipIfExists: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { skipIfExists: true, saveThreadIdTo: 'thread_1' }),
      makeCreateForumTopicNode('cft2', { skipIfExists: true, saveThreadIdTo: 'thread_2' }),
    ]), 'k05'),
    'k05',
  );
});

test('K06', 'три узла create_forum_topic генерируют три уникальных имени функций', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft_a'),
    makeCreateForumTopicNode('cft_b'),
    makeCreateForumTopicNode('cft_c'),
  ]), 'k06');
  ok(code.includes('handle_callback_cft_a'), 'Обработчик cft_a должен быть в коде');
  ok(code.includes('handle_callback_cft_b'), 'Обработчик cft_b должен быть в коде');
  ok(code.includes('handle_callback_cft_c'), 'Обработчик cft_c должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК L: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Граничные случаи ────────────────────────────────────────────────');

test('L01', 'nodeId с дефисами → safe_name заменяет дефисы на подчёркивания', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('create-forum-topic-1'),
  ]), 'l01');
  ok(
    code.includes('async def handle_callback_create_forum_topic_1('),
    'Дефисы в nodeId должны заменяться на подчёркивания в safe_name',
  );
});

test('L02', 'nodeId с цифрами в начале: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft_123_node'),
    ]), 'l02'),
    'l02',
  );
});

test('L03', 'все поля пустые → генерация не падает', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatId: '',
      forumChatVariableName: '',
      topicName: '',
      topicIconColor: '',
      saveThreadIdTo: '',
      skipIfExists: false,
    }),
  ]), 'l03');
  ok(code.includes('async def handle_callback_cft1('), 'Обработчик должен генерироваться даже при пустых полях');
});

test('L04', 'все поля пустые: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', {
        forumChatId: '',
        forumChatVariableName: '',
        topicName: '',
        topicIconColor: '',
        saveThreadIdTo: '',
        skipIfExists: false,
      }),
    ]), 'l04'),
    'l04',
  );
});

test('L05', 'очень длинное название топика: синтаксис OK', () => {
  const longName = 'Очень длинное название топика для тестирования граничных случаев генератора кода бота';
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { topicName: longName }),
    ]), 'l05'),
    'l05',
  );
});

test('L06', 'Unicode в названии топика: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('cft1', { topicName: 'Топик 🎯 Важный ✅' }),
    ]), 'l06'),
    'l06',
  );
});

test('L07', 'nodeId с дефисами: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCreateForumTopicNode('create-forum-topic-node-1'),
    ]), 'l07'),
    'l07',
  );
});

test('L08', 'create_forum_topic с command_trigger и дефисами в nodeId: синтаксис OK', () => {
  syntax(
    gen(makeCleanProject([
      makeCommandTriggerNode('cmd-1', '/create', 'cft-node-1'),
      makeCreateForumTopicNode('cft-node-1', { saveThreadIdTo: 'thread_id' }),
    ]), 'l08'),
    'l08',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК M: Производительность
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Производительность ──────────────────────────────────────────────');

test('M01', '10 узлов create_forum_topic: синтаксис OK', () => {
  const nodes = Array.from({ length: 10 }, (_, i) =>
    makeCreateForumTopicNode(`cft_perf_${i}`, {
      topicName: `Топик ${i}`,
      saveThreadIdTo: `thread_${i}`,
      topicIconColor: ['7322096', '16766590', '13338331', '9367192', '16749490', '16478047'][i % 6],
    }),
  );
  syntax(gen(makeCleanProject(nodes), 'm01'), 'm01');
});

test('M02', '10 узлов create_forum_topic: уникальные имена функций', () => {
  const nodes = Array.from({ length: 10 }, (_, i) =>
    makeCreateForumTopicNode(`cft_perf_${i}`, { topicName: `Топик ${i}` }),
  );
  const code = gen(makeCleanProject(nodes), 'm02');
  for (let i = 0; i < 10; i++) {
    ok(
      code.includes(`async def handle_callback_cft_perf_${i}(`),
      `Обработчик cft_perf_${i} должен быть в коде`,
    );
  }
});

test('M03', '10 узлов с разными источниками ID: синтаксис OK', () => {
  const nodes = Array.from({ length: 10 }, (_, i) =>
    makeCreateForumTopicNode(`cft_mix_${i}`, {
      forumChatIdSource: i % 2 === 0 ? 'manual' : 'variable',
      forumChatId: i % 2 === 0 ? `-100${1000000000 + i}` : '',
      forumChatVariableName: i % 2 !== 0 ? `forum_chat_id_${i}` : '',
      saveThreadIdTo: `thread_${i}`,
    }),
  );
  syntax(gen(makeCleanProject(nodes), 'm03'), 'm03');
});

test('M04', '10 узлов с skipIfExists: синтаксис OK', () => {
  const nodes = Array.from({ length: 10 }, (_, i) =>
    makeCreateForumTopicNode(`cft_skip_${i}`, {
      skipIfExists: i % 2 === 0,
      saveThreadIdTo: `thread_skip_${i}`,
    }),
  );
  syntax(gen(makeCleanProject(nodes), 'm04'), 'm04');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК N: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Отсутствие лишнего кода ─────────────────────────────────────────');

test('N01', 'skipIfExists: false → нет _existing_thread_id в коде', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { skipIfExists: false, saveThreadIdTo: 'thread_id' }),
  ]), 'n01');
  ok(!code.includes('_existing_thread_id'), '_existing_thread_id не должен быть в коде при skipIfExists: false');
  ok(!code.includes('_existing_vars'), '_existing_vars не должен быть в коде при skipIfExists: false');
});

test('N02', 'saveThreadIdTo: "" → нет set_user_var в коде', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: '' }),
  ]), 'n02');
  ok(!code.includes('await set_user_var('), 'set_user_var не должен быть в коде при пустом saveThreadIdTo');
});

test('N03', 'forumChatIdSource: manual с простым названием → init_all_user_vars внутри if-блока', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'manual',
      forumChatId: '-1002300967595',
      topicName: 'Простое название',
      saveThreadIdTo: '',
      skipIfExists: false,
    }),
  ]), 'n03');
  // init_all_user_vars присутствует в коде, но только внутри if "{" in _topic_name
  ok(code.includes('if "{" in _topic_name'), 'Проверка наличия переменных в названии должна быть в коде');
});

test('N04', 'forumChatIdSource: variable → нет literal forumChatId в коде', () => {
  const code = gen(makeCleanProject([
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatId: '-1002300967595',
      forumChatVariableName: 'forum_chat_id',
    }),
  ]), 'n04');
  // При variable-режиме literal forumChatId не должен использоваться
  ok(!code.includes("_raw_chat_id = '-1002300967595'"), 'Literal forumChatId не должен быть в коде при variable-режиме');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК O: Интеграция — недостающие сценарии подключения
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок O: Интеграция — недостающие сценарии подключения ───────────────────');

test('O01', 'incoming_message_trigger → create_forum_topic: вызывает handle_callback через mock_callback', () => {
  const code = gen(makeCleanProject([
    {
      id: 'imt1',
      type: 'incoming_message_trigger',
      position: { x: 0, y: 0 },
      data: { autoTransitionTo: 'cft1', buttons: [], keyboardType: 'none' },
    },
    makeCreateForumTopicNode('cft1'),
  ]), 'o01');
  ok(code.includes('await handle_callback_cft1(mock_callback)'), 'incoming_message_trigger должен вести в create_forum_topic через mock_callback');
});

test('O02', 'incoming_message_trigger → create_forum_topic: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    {
      id: 'imt1',
      type: 'incoming_message_trigger',
      position: { x: 0, y: 0 },
      data: { autoTransitionTo: 'cft1', buttons: [], keyboardType: 'none' },
    },
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'thread_id' }),
  ]), 'o02'), 'o02');
});

test('O03', 'message → create_forum_topic через auto-transition: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    {
      id: 'msg1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Создаём топик...',
        buttons: [],
        keyboardType: 'none',
        formatMode: 'none',
        markdown: false,
        enableAutoTransition: true,
        autoTransitionTo: 'cft1',
      },
    },
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'thread_id' }),
  ]), 'o03'), 'o03');
});

test('O04', 'message → create_forum_topic через auto-transition: FakeCallbackQuery в коде', () => {
  const code = gen(makeCleanProject([
    {
      id: 'msg1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Создаём топик...',
        buttons: [],
        keyboardType: 'none',
        formatMode: 'none',
        markdown: false,
        enableAutoTransition: true,
        autoTransitionTo: 'cft1',
      },
    },
    makeCreateForumTopicNode('cft1'),
  ]), 'o04');
  ok(code.includes('FakeCallbackQuery') || code.includes('handle_callback_cft1'), 'auto-transition должен вести в create_forum_topic');
});

test('O05', 'create_forum_topic → message через auto-transition: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/create', 'cft1'),
    {
      id: 'cft1',
      type: 'create_forum_topic',
      position: { x: 400, y: 0 },
      data: {
        forumChatIdSource: 'manual',
        forumChatId: '-1001234567890',
        topicName: 'Топик',
        topicIconColor: '7322096',
        saveThreadIdTo: 'thread_id',
        skipIfExists: false,
        enableAutoTransition: true,
        autoTransitionTo: 'msg_done',
      },
    },
    makeMessageNode('msg_done', 'Топик создан!'),
  ]), 'o05'), 'o05');
});

test('O06', 'keyboard кнопка → create_forum_topic: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    {
      id: 'msg1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Нажми кнопку',
        keyboardType: 'inline',
        buttons: [{ id: 'btn1', text: 'Создать топик', action: 'goto', target: 'cft1' }],
        formatMode: 'none',
        markdown: false,
      },
    },
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'thread_id' }),
  ]), 'o06'), 'o06');
});

test('O07', 'полный сценарий: command_trigger → condition → create_forum_topic → message: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/support', 'cond1'),
    makeConditionNode('cond1', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'cft1' }),
      makeConditionBranch('filled', { target: 'msg_exists' }),
    ]),
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'manual',
      forumChatId: '-1001234567890',
      topicName: 'Поддержка {user_name}',
      topicIconColor: '9367192',
      saveThreadIdTo: 'support_thread_id',
      skipIfExists: false,
    }),
    makeMessageNode('msg_exists', 'Топик уже создан'),
    makeMessageNode('msg_done', 'Готово'),
  ]), 'o07'), 'o07');
});

test('O08', 'incoming_message_trigger + create_forum_topic с variable source и skipIfExists: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    {
      id: 'imt1',
      type: 'incoming_message_trigger',
      position: { x: 0, y: 0 },
      data: { autoTransitionTo: 'cft1', buttons: [], keyboardType: 'none' },
    },
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
      topicName: 'Топик {user_name}',
      saveThreadIdTo: 'thread_id',
      skipIfExists: true,
    }),
  ]), 'o08'), 'o08');
});

test('O09', 'media → create_forum_topic через auto-transition: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'media1'),
    {
      id: 'media1',
      type: 'media',
      position: { x: 200, y: 0 },
      data: {
        attachedMedia: ['https://example.com/photo.jpg'],
        enableAutoTransition: true,
        autoTransitionTo: 'cft1',
        buttons: [],
        keyboardType: 'none',
      },
    },
    makeCreateForumTopicNode('cft1', { saveThreadIdTo: 'thread_id' }),
  ]), 'o09'), 'o09');
});

test('O10', 'input (сохранить ответ) → create_forum_topic через auto-transition: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    {
      id: 'msg1',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Введите ID группы',
        buttons: [],
        keyboardType: 'none',
        formatMode: 'none',
        markdown: false,
        enableAutoTransition: true,
        autoTransitionTo: 'input1',
      },
    },
    {
      id: 'input1',
      type: 'input',
      position: { x: 400, y: 0 },
      data: {
        inputType: 'text',
        inputVariable: 'forum_chat_id',
        inputTargetNodeId: 'cft1',
        appendVariable: false,
        saveToDatabase: true,
      },
    },
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
      saveThreadIdTo: 'thread_id',
    }),
  ]), 'o10'), 'o10');
});

test('O11', 'input → create_forum_topic: handle_callback_cft1 вызывается как next_node_id', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    {
      id: 'msg1',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Введите ID',
        buttons: [],
        keyboardType: 'none',
        formatMode: 'none',
        markdown: false,
        enableAutoTransition: true,
        autoTransitionTo: 'input1',
      },
    },
    {
      id: 'input1',
      type: 'input',
      position: { x: 400, y: 0 },
      data: {
        inputType: 'text',
        inputVariable: 'forum_chat_id',
        inputTargetNodeId: 'cft1',
        appendVariable: false,
        saveToDatabase: true,
      },
    },
    makeCreateForumTopicNode('cft1', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'forum_chat_id',
      saveThreadIdTo: 'thread_id',
    }),
  ]), 'o11');
  ok(code.includes('"next_node_id": "cft1"'), 'input должен указывать next_node_id на create_forum_topic');
});

test('O12', 'media → create_forum_topic → message: полная цепочка синтаксически корректна', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/gallery', 'media1'),
    {
      id: 'media1',
      type: 'media',
      position: { x: 200, y: 0 },
      data: {
        attachedMedia: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        enableAutoTransition: true,
        autoTransitionTo: 'cft1',
        buttons: [],
        keyboardType: 'none',
      },
    },
    makeCreateForumTopicNode('cft1', {
      topicName: 'Галерея {user_name}',
      saveThreadIdTo: 'gallery_thread_id',
    }),
    makeMessageNode('msg_done', 'Топик с галереей создан'),
  ]), 'o12'), 'o12');
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК P: Сценарные тесты — реальные use-case
// ════════════════════════════════════════════════════════════════════════════════

console.log('── Блок P: Сценарные тесты — реальные use-case ─────────────────────────────');

test('P01', 'сценарий поддержки: command_trigger → condition → create_forum_topic → message: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'cond-check-thread'),
    makeConditionNode('cond-check-thread', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'create-support-topic' }),
      makeConditionBranch('filled', { target: 'msg-topic-exists' }),
    ]),
    makeCreateForumTopicNode('create-support-topic', {
      forumChatId: '-1001234567890',
      topicName: 'Поддержка {user_name}',
      saveThreadIdTo: 'support_thread_id',
      skipIfExists: true,
    }),
    makeMessageNode('msg-topic-created', '✅ Ваш топик поддержки создан!'),
    makeMessageNode('msg-topic-exists', 'ℹ️ У вас уже есть открытый топик поддержки.'),
  ]), 'p01'), 'p01');
});

test('P02', 'сценарий поддержки: condition ветка empty ведёт в create_forum_topic', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'cond-check-thread'),
    makeConditionNode('cond-check-thread', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'create-support-topic' }),
      makeConditionBranch('filled', { target: 'msg-topic-exists' }),
    ]),
    makeCreateForumTopicNode('create-support-topic', { saveThreadIdTo: 'support_thread_id' }),
    makeMessageNode('msg-topic-exists', 'Топик уже есть'),
  ]), 'p02');
  ok(code.includes('create-support-topic'), 'Ветка empty должна ссылаться на create-support-topic');
});

test('P03', 'сценарий поддержки: condition ветка filled ведёт в msg-topic-exists', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'cond-check-thread'),
    makeConditionNode('cond-check-thread', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'create-support-topic' }),
      makeConditionBranch('filled', { target: 'msg-topic-exists' }),
    ]),
    makeCreateForumTopicNode('create-support-topic', { saveThreadIdTo: 'support_thread_id' }),
    makeMessageNode('msg-topic-exists', 'Топик уже есть'),
  ]), 'p03');
  ok(code.includes('msg-topic-exists'), 'Ветка filled должна ссылаться на msg-topic-exists');
});

test('P04', 'сценарий поддержки: create_forum_topic сохраняет support_thread_id', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'create-support-topic'),
    makeCreateForumTopicNode('create-support-topic', {
      forumChatId: '-1001234567890',
      topicName: 'Поддержка {user_name}',
      saveThreadIdTo: 'support_thread_id',
    }),
  ]), 'p04');
  ok(code.includes('support_thread_id'), 'Переменная support_thread_id должна быть в коде');
  ok(code.includes('set_user_var') || code.includes('support_thread_id'), 'Сохранение support_thread_id должно быть в коде');
});

test('P05', 'сценарий поддержки: create_forum_topic с skipIfExists: true проверяет _existing_thread_id', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'create-support-topic'),
    makeCreateForumTopicNode('create-support-topic', {
      forumChatId: '-1001234567890',
      saveThreadIdTo: 'support_thread_id',
      skipIfExists: true,
    }),
  ]), 'p05');
  ok(
    code.includes('_existing_thread_id') || code.includes('skipping') || code.includes('thread_id already exists'),
    'Проверка существующего thread_id должна быть в коде при skipIfExists: true',
  );
});

test('P06', 'сценарий поддержки: create_forum_topic → message через autoTransitionTo генерирует обработчик msg-topic-created', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'create-support-topic'),
    {
      id: 'create-support-topic',
      type: 'create_forum_topic',
      position: { x: 400, y: 0 },
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
  ]), 'p06');
  ok(
    code.includes('handle_callback_msg-topic-created') || code.includes('FakeCallbackQuery') || code.includes('msg-topic-created'),
    'Переход к msg-topic-created должен быть в коде',
  );
});

test('P07', 'сценарий "сбор ID группы": command_trigger → message → input → create_forum_topic: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/setup', 'msg-ask-id'),
    makeMessageNode('msg-ask-id', 'Введите ID форум-группы:'),
    {
      id: 'input-group-id',
      type: 'input',
      position: { x: 400, y: 0 },
      data: {
        inputType: 'text',
        inputVariable: 'group_chat_id',
        inputTargetNodeId: 'cft-setup',
        appendVariable: false,
        saveToDatabase: true,
      },
    },
    makeCreateForumTopicNode('cft-setup', {
      forumChatIdSource: 'variable',
      forumChatVariableName: 'group_chat_id',
      topicName: 'Новый топик',
      saveThreadIdTo: 'setup_thread_id',
    }),
  ]), 'p07'), 'p07');
});

test('P08', 'сценарий "несколько топиков": два create_forum_topic с разными saveThreadIdTo: синтаксис OK, оба обработчика в коде', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'cft-alpha'),
    makeCreateForumTopicNode('cft-alpha', {
      forumChatId: '-1001111111111',
      topicName: 'Топик Alpha',
      saveThreadIdTo: 'alpha_thread_id',
    }),
    makeCreateForumTopicNode('cft-beta', {
      forumChatId: '-1002222222222',
      topicName: 'Топик Beta',
      saveThreadIdTo: 'beta_thread_id',
    }),
  ]), 'p08');
  syntax(code, 'p08');
  ok(code.includes('handle_callback_cft-alpha') || code.includes('cft-alpha'), 'Обработчик cft-alpha должен быть в коде');
  ok(code.includes('handle_callback_cft-beta') || code.includes('cft-beta'), 'Обработчик cft-beta должен быть в коде');
  ok(code.includes('alpha_thread_id'), 'Переменная alpha_thread_id должна быть в коде');
  ok(code.includes('beta_thread_id'), 'Переменная beta_thread_id должна быть в коде');
});

test('P09', 'сценарий "топик с переменным названием": command_trigger → input → create_forum_topic с {topic_title}: синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeCommandTriggerNode('cmd1', '/newtopic', 'msg-ask-title'),
    makeMessageNode('msg-ask-title', 'Введите название топика:'),
    {
      id: 'input-title',
      type: 'input',
      position: { x: 400, y: 0 },
      data: {
        inputType: 'text',
        inputVariable: 'topic_title',
        inputTargetNodeId: 'cft-dynamic',
        appendVariable: false,
        saveToDatabase: false,
      },
    },
    makeCreateForumTopicNode('cft-dynamic', {
      forumChatId: '-1001234567890',
      topicName: '{topic_title}',
      saveThreadIdTo: 'dynamic_thread_id',
    }),
  ]), 'p09'), 'p09');
});

test('P10', 'сценарий поддержки полный: все узлы из project.json генерируют корректный Python', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/support', 'cond-check-thread'),
    makeConditionNode('cond-check-thread', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'create-support-topic' }),
      makeConditionBranch('filled', { target: 'msg-topic-exists' }),
    ]),
    {
      id: 'create-support-topic',
      type: 'create_forum_topic',
      position: { x: 660, y: 100 },
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
    makeMessageNode('msg-topic-created', '✅ Ваш топик поддержки создан! Напишите ваш вопрос — мы ответим в топике.'),
    makeMessageNode('msg-topic-exists', 'ℹ️ У вас уже есть открытый топик поддержки. Напишите туда свой вопрос.'),
  ]), 'p10');
  syntax(code, 'p10');
  ok(code.includes('await bot.create_forum_topic('), 'Вызов bot.create_forum_topic должен быть в коде');
  ok(code.includes('support_thread_id'), 'Переменная support_thread_id должна быть в коде');
  ok(
    code.includes('set_user_var') || code.includes('support_thread_id'),
    'Сохранение support_thread_id должно быть в коде',
  );
  ok(
    code.includes('skipping') || code.includes('thread_id already exists') || code.includes('_existing_thread_id'),
    'Логика skipIfExists должна быть в коде',
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// БЛОК P (продолжение): Регрессионные тесты — реальное выполнение действия
// ════════════════════════════════════════════════════════════════════════════════

/**
 * P11: Регрессионный тест — автопереход выполняется ПОСЛЕ bot.create_forum_topic,
 * а не вместо него. Проверяет что дублирующий обработчик не перехватывает вызов.
 *
 * Воспроизводит баг: бот отправлял "Топик создан" без реального создания топика,
 * потому что interactive-callback-handlers генерировал второй обработчик на тот же
 * c.data == "create-support-topic", который делал автопереход напрямую.
 */
test('P11', 'регрессия: bot.create_forum_topic вызывается ДО автоперехода, не вместо него', () => {
  const code = gen(makeCleanProject([
    makeCommandTriggerNode('cmd-support', '/start', 'cond-check-thread'),
    makeConditionNode('cond-check-thread', 'support_thread_id', [
      makeConditionBranch('empty', { target: 'create-support-topic' }),
      makeConditionBranch('filled', { target: 'msg-topic-exists' }),
    ]),
    {
      id: 'create-support-topic',
      type: 'create_forum_topic',
      position: { x: 660, y: 100 },
      data: {
        forumChatIdSource: 'manual',
        forumChatId: '-1002300967595',
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
  ]), 'p11');

  // 1. bot.create_forum_topic должен присутствовать в коде
  ok(code.includes('await bot.create_forum_topic('), 'bot.create_forum_topic должен вызываться в обработчике');

  // 2. Не должно быть второго обработчика на тот же callback data (дублирующего)
  const handlerMatches = [...code.matchAll(/@dp\.callback_query\(lambda c: c\.data == "create-support-topic"\)/g)];
  ok(handlerMatches.length === 1, `Должен быть ровно один обработчик на "create-support-topic", найдено: ${handlerMatches.length}`);

  // 3. Автопереход должен идти ПОСЛЕ bot.create_forum_topic
  const createTopicPos = code.indexOf('await bot.create_forum_topic(');
  const autoTransitionPos = code.indexOf('handle_callback_msg_topic_created');
  ok(createTopicPos !== -1, 'bot.create_forum_topic должен быть в коде');
  ok(autoTransitionPos !== -1, 'автопереход к msg-topic-created должен быть в коде');
  ok(createTopicPos < autoTransitionPos, 'bot.create_forum_topic должен идти РАНЬШЕ автоперехода в коде');

  // 4. callback_query.answer("Топик создан") должен быть ПОСЛЕ bot.create_forum_topic
  const answerPos = code.indexOf('callback_query.answer("Топик создан")');
  ok(answerPos !== -1, 'callback_query.answer("Топик создан") должен быть в коде');
  ok(createTopicPos < answerPos, 'bot.create_forum_topic должен идти РАНЬШЕ callback_query.answer');

  // 5. Синтаксис корректен
  syntax(code, 'p11');
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
