/**
 * @fileoverview Фазовый тест для узла delete_message
 *
 * Блок A: Базовая генерация (7 тестов)
 * Блок B: Chat ID (4 теста)
 * Блок C: Автопереход (4 теста)
 * Блок D: Синтаксис Python (5 тестов)
 * Блок E: Интеграция с другими нодами (4 теста)
 * Блок F: Граничные случаи (4 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные утилиты ─────────────────────────────────────────────────

/**
 * Создаёт минимальный проект с заданными узлами
 * @param nodes - Массив узлов
 * @returns Объект проекта
 */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1', name: 'Test', nodes,
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
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `PhaseDM_${label}`,
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
  const tmp = `_tmp_dm_${label}.py`;
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

/** Тип результата теста */
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
 * Проверяет условие, бросает ошибку если не выполнено
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/**
 * Проверяет синтаксис Python, бросает ошибку при неверном синтаксисе
 * @param code - Python-код
 * @param label - Метка
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Вспомогательные функции для создания узлов ──────────────────────────────

/**
 * Создаёт узел delete_message
 * @param id - ID узла
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа delete_message
 */
function makeDeleteNode(id: string, extra: Record<string, any> = {}) {
  return {
    id, type: 'delete_message',
    position: { x: 0, y: 0 },
    data: {
      messageIdSource: 'current_message',
      messageIdManual: '',
      lastNCount: '',
      chatIdSource: 'current_chat',
      chatIdManual: '',
      ignoreErrors: true,
      bulkDelete: false,
      bulkMessageIdsVariable: '',
      autoTransitionTo: '',
      ...extra,
    },
  };
}

/**
 * Создаёт узел command_trigger
 * @param id - ID узла
 * @param command - Команда
 * @param targetId - ID целевого узла
 * @returns Объект узла типа command_trigger
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id, type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, command, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел callback_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа callback_trigger
 */
function makeCallbackTriggerNode(id: string, targetId: string) {
  return {
    id, type: 'callback_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      callbackData: id,
      matchType: 'exact',
      adminOnly: false,
      requiresAuth: false,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт message-узел
 * @param id - ID узла
 * @param text - Текст сообщения
 * @returns Объект узла типа message
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id, type: 'message',
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

/**
 * Создаёт узел condition
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа condition
 */
function makeConditionNode(id: string, targetId: string) {
  return {
    id, type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      conditions: [{ id: 'br1', label: 'Ветка', variable: 'x', operator: 'not_empty', value: '', targetNodeId: targetId }],
      defaultTargetId: '',
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел delete_message                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A1', 'current_message → генерирует bot.delete_message', () => {
  const p = makeCleanProject([makeDeleteNode('del1')]);
  const code = gen(p, 'a1');
  ok(code.includes('bot.delete_message'), 'bot.delete_message должен быть в коде');
});

test('A2', 'last_bot_message → содержит last_bot_message_id', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'last_bot_message' })]);
  const code = gen(p, 'a2');
  ok(code.includes('last_bot_message_id'), 'last_bot_message_id должен быть в коде');
});

test('A3', 'last_n count=50 → содержит range( и bot.delete_messages', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'last_n', lastNCount: '50' })]);
  const code = gen(p, 'a3');
  ok(code.includes('range('), 'range( должен быть в коде');
  ok(code.includes('bot.delete_messages'), 'bot.delete_messages должен быть в коде');
});

test('A4', 'custom messageIdManual={msg_id} → содержит replace_variables_in_text', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'custom', messageIdManual: '{msg_id}' })]);
  const code = gen(p, 'a4');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
});

test('A5', 'bulkDelete=true → содержит json и батчи по 100', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { bulkDelete: true, bulkMessageIdsVariable: 'ids_list' })]);
  const code = gen(p, 'a5');
  ok(code.includes('json'), 'json должен быть в коде');
  ok(code.includes('100'), 'батч 100 должен быть в коде');
});

test('A7', 'reply_message → содержит reply_to_message', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'reply_message' })]);
  const code = gen(p, 'a7');
  ok(code.includes('reply_to_message'), 'reply_to_message должен быть в коде');
  ok(code.includes('bot.delete_message'), 'bot.delete_message должен быть в коде');
});

test('A6', 'все варианты генерируют валидный Python', () => {
  const variants = [
    makeDeleteNode('del_cm', { messageIdSource: 'current_message' }),
    makeDeleteNode('del_lb', { messageIdSource: 'last_bot_message' }),
    makeDeleteNode('del_ln', { messageIdSource: 'last_n', lastNCount: '10' }),
    makeDeleteNode('del_cu', { messageIdSource: 'custom', messageIdManual: '{x}' }),
    makeDeleteNode('del_bk', { bulkDelete: true, bulkMessageIdsVariable: 'ids' }),
  ];
  for (const node of variants) {
    const p = makeCleanProject([node]);
    const code = gen(p, `a6_${node.id}`);
    syntax(code, `a6_${node.id}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Chat ID
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Chat ID ───────────────────────────────────────────────');

test('B1', 'chatIdSource=current_chat → callback_query.message.chat.id', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { chatIdSource: 'current_chat' })]);
  const code = gen(p, 'b1');
  ok(code.includes('callback_query.message.chat.id'), 'callback_query.message.chat.id должен быть в коде');
});

test('B2', 'chatIdSource=custom, chatIdManual=-1001234567890 → подставляет ID', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { chatIdSource: 'custom', chatIdManual: '-1001234567890' })]);
  const code = gen(p, 'b2');
  ok(code.includes('-1001234567890'), 'ID чата должен быть в коде');
});

test('B3', 'chatIdSource=custom, chatIdManual={chat_var} → через переменную', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { chatIdSource: 'custom', chatIdManual: '{chat_var}' })]);
  const code = gen(p, 'b3');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
  ok(code.includes('chat_var'), 'chat_var должен быть в коде');
});

test('B4', 'автоматическое добавление -100 для длинных положительных ID', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { chatIdSource: 'custom', chatIdManual: '1234567890' })]);
  const code = gen(p, 'b4');
  ok(code.includes('-100'), 'логика -100 должна быть в коде');
  ok(code.includes('len(') || code.includes('>= 10'), 'проверка длины ID должна быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Автопереход
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Автопереход ───────────────────────────────────────────');

test('C1', 'delete_message с autoTransitionTo → генерирует handle_callback_<target>', () => {
  const p = makeCleanProject([
    makeDeleteNode('del1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c1');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
});

test('C2', 'delete_message без autoTransitionTo → нет вызова handle_callback в обработчике', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { autoTransitionTo: '' })]);
  const code = gen(p, 'c2');
  // Извлекаем тело обработчика delete_message
  const handlerStart = code.indexOf('async def handle_callback_del1');
  const handlerEnd = code.indexOf('\n# @@NODE_START', handlerStart);
  const handler = code.substring(handlerStart, handlerEnd > -1 ? handlerEnd : code.length);
  // В обработчике не должно быть вызовов к другим handle_callback_
  const lines = handler.split('\n').filter(l => l.includes('await handle_callback_') && !l.includes('handle_callback_del1'));
  ok(lines.length === 0, 'не должно быть await handle_callback_ вызовов в обработчике');
});

test('C3', 'цепочка command_trigger → delete_message → message', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/delete', 'del1'),
    makeDeleteNode('del1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Удалено!'),
  ]);
  const code = gen(p, 'c3');
  ok(code.includes('handle_callback_del1'), 'handle_callback_del1 должен быть в коде');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
});

test('C4', 'ignoreErrors=true → автопереход выполняется даже при ошибке', () => {
  const p = makeCleanProject([
    makeDeleteNode('del1', { ignoreErrors: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c4');
  // При ignoreErrors=true автопереход должен быть и в блоке except (после logging.error)
  const errorIdx = code.indexOf('logging.error(f"Ошибка в delete_message del1');
  ok(errorIdx > -1, 'logging.error должен быть в коде');
  const afterError = code.substring(errorIdx, errorIdx + 200);
  ok(afterError.includes('handle_callback_msg1'), 'автопереход должен быть после logging.error в блоке except');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Синтаксис Python
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Синтаксис Python ──────────────────────────────────────');

test('D1', 'current_message → валидный Python', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'current_message' })]);
  const code = gen(p, 'd1');
  syntax(code, 'd1');
});

test('D2', 'last_n с переменной → валидный Python', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'last_n', lastNCount: '{count}' })]);
  const code = gen(p, 'd2');
  syntax(code, 'd2');
});

test('D3', 'bulkDelete → валидный Python', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { bulkDelete: true, bulkMessageIdsVariable: 'msg_ids' })]);
  const code = gen(p, 'd3');
  syntax(code, 'd3');
});

test('D5', 'reply_message → валидный Python', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'reply_message' })]);
  const code = gen(p, 'd5');
  syntax(code, 'd5');
});

test('D4', 'custom chat + custom message → валидный Python', () => {
  const p = makeCleanProject([makeDeleteNode('del1', {
    messageIdSource: 'custom',
    messageIdManual: '{saved_id}',
    chatIdSource: 'custom',
    chatIdManual: '{target_chat}',
  })]);
  const code = gen(p, 'd4');
  syntax(code, 'd4');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Интеграция с другими нодами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Интеграция с другими нодами ───────────────────────────');

test('E1', 'callback_trigger → delete_message → message (полный сценарий)', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'del1'),
    makeDeleteNode('del1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Сообщение удалено'),
  ]);
  const code = gen(p, 'e1');
  ok(code.includes('handle_callback_del1'), 'handle_callback_del1 должен быть в коде');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
  syntax(code, 'e1');
});

test('E2', 'condition → delete_message (ветвление)', () => {
  const p = makeCleanProject([
    makeConditionNode('cond1', 'del1'),
    makeDeleteNode('del1', { messageIdSource: 'current_message' }),
  ]);
  const code = gen(p, 'e2');
  ok(code.includes('handle_callback_del1'), 'handle_callback_del1 должен быть в коде');
  syntax(code, 'e2');
});

test('E3', 'несколько delete_message в одном проекте', () => {
  const p = makeCleanProject([
    makeDeleteNode('del1', { messageIdSource: 'current_message' }),
    makeDeleteNode('del2', { messageIdSource: 'last_bot_message' }),
    makeDeleteNode('del3', { messageIdSource: 'last_n', lastNCount: '5' }),
  ]);
  const code = gen(p, 'e3');
  ok(code.includes('handle_callback_del1'), 'handle_callback_del1 должен быть в коде');
  ok(code.includes('handle_callback_del2'), 'handle_callback_del2 должен быть в коде');
  ok(code.includes('handle_callback_del3'), 'handle_callback_del3 должен быть в коде');
  syntax(code, 'e3');
});

test('E4', 'delete_message не генерирует дублирующий обработчик (NODE_TYPES_WITH_DEDICATED_HANDLERS)', () => {
  // Если кнопка ведёт на delete_message, interactive-callback-handlers не должен генерировать
  // дублирующий обработчик — delete_message уже в NODE_TYPES_WITH_DEDICATED_HANDLERS
  const p = makeCleanProject([
    {
      id: 'msg1', type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Нажми кнопку',
        buttons: [{ id: 'btn1', text: 'Удалить', action: 'goto', targetNodeId: 'del1' }],
        keyboardType: 'inline',
        formatMode: 'none',
        markdown: false,
      },
    },
    makeDeleteNode('del1', { messageIdSource: 'current_message' }),
  ]);
  const code = gen(p, 'e4');
  // Должен быть только один handle_callback_del1 (от шаблона delete_message)
  const matches = code.match(/async def handle_callback_del1/g) || [];
  ok(matches.length === 1, `handle_callback_del1 должен быть ровно 1 раз, найдено: ${matches.length}`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Граничные случаи ──────────────────────────────────────');

test('F1', 'ignoreErrors=false → нет try/except вокруг delete_message', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { ignoreErrors: false, messageIdSource: 'current_message' })]);
  const code = gen(p, 'f1');
  // Основной блок не должен быть обёрнут в try (кроме внешнего)
  // При ignoreErrors=false нет logging.warning с "delete_message"
  ok(!code.includes('logging.warning(f"delete_message del1'), 'не должно быть logging.warning для del1');
});

test('F2', 'last_n с числовым значением → содержит число', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { messageIdSource: 'last_n', lastNCount: '25' })]);
  const code = gen(p, 'f2');
  ok(code.includes('25') || code.includes('"25"'), 'число 25 должно быть в коде');
});

test('F3', 'bulkDelete с пустой переменной → всё равно генерирует код', () => {
  const p = makeCleanProject([makeDeleteNode('del1', { bulkDelete: true, bulkMessageIdsVariable: '' })]);
  const code = gen(p, 'f3');
  ok(code.includes('bot.delete_messages'), 'bot.delete_messages должен быть в коде');
});

test('F4', 'полный сценарий с autoTransition и custom chat → валидный Python', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/cleanup', 'del1'),
    makeDeleteNode('del1', {
      messageIdSource: 'last_n',
      lastNCount: '{n}',
      chatIdSource: 'custom',
      chatIdManual: '{group_id}',
      ignoreErrors: true,
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1', 'Очистка завершена'),
  ]);
  const code = gen(p, 'f4');
  syntax(code, 'f4');
  ok(code.includes('handle_callback_msg1'), 'автопереход к msg1 должен быть');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║   Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ''}${' '.repeat(Math.max(0, 42 - String(passed).length - String(total).length - (failed > 0 ? String(failed).length + 10 : 0)))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('✅ Все тесты пройдены!\n');
  process.exit(0);
}
