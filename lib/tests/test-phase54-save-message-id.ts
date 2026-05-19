/**
 * @fileoverview Фазовый тест для поля saveMessageIdTo узла message
 *
 * Блок A: Базовая генерация (6 тестов)
 * Блок B: Сценарии с edit_message (4 теста)
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
    botName: `PhaseSMI_${label}`,
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
  const tmp = `_tmp_smi_${label}.py`;
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
 * Создаёт message-узел с опциональным saveMessageIdTo
 * @param id - ID узла
 * @param text - Текст сообщения
 * @param saveMessageIdTo - Имя переменной для сохранения ID
 * @returns Объект узла типа message
 */
function makeMessageNode(id: string, text = 'Ответ', saveMessageIdTo?: string) {
  return {
    id, type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...(saveMessageIdTo ? { saveMessageIdTo } : {}),
    },
  };
}

/**
 * Создаёт command_trigger-узел
 * @param id - ID узла
 * @param command - Команда
 * @param targetId - ID целевого узла
 * @returns Объект узла типа command_trigger
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id, type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: { command, autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — saveMessageIdTo (сохранение ID сообщения)           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'saveMessageIdTo → содержит имя переменной в коде', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Меню', 'menu_msg_id')]);
  const code = gen(p, 'a01');
  ok(code.includes('menu_msg_id'), 'имя переменной должно быть в коде');
});

test('A02', 'saveMessageIdTo → содержит sent_message.message_id', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Меню', 'menu_msg_id')]);
  const code = gen(p, 'a02');
  ok(code.includes('sent_message.message_id'), 'sent_message.message_id должен быть в коде');
});

test('A03', 'saveMessageIdTo → сохраняет в user_data', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Меню', 'menu_msg_id')]);
  const code = gen(p, 'a03');
  ok(code.includes('user_data[user_id]'), 'user_data[user_id] должен быть в коде');
});

test('A04', 'без saveMessageIdTo → нет кода сохранения ID', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Привет')]);
  const code = gen(p, 'a04');
  ok(!code.includes('hasattr(sent_message'), 'код сохранения ID не должен генерироваться');
});

test('A05', 'saveMessageIdTo → синтаксис Python OK', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Меню', 'menu_msg_id')]);
  syntax(gen(p, 'a05'), 'a05');
});

test('A06', 'saveMessageIdTo с переменной в тексте → синтаксис OK', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Привет, {user_name}!', 'menu_id')]);
  syntax(gen(p, 'a06'), 'a06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Сценарии ──────────────────────────────────────────────');

test('B01', 'command_trigger → message(saveMessageIdTo) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Выберите действие:', 'menu_msg_id'),
  ]);
  syntax(gen(p, 'b01'), 'b01');
});

test('B02', 'два message с разными saveMessageIdTo → оба в коде', () => {
  const p = makeCleanProject([
    makeMessageNode('msg1', 'Меню 1', 'menu1_id'),
    makeMessageNode('msg2', 'Меню 2', 'menu2_id'),
  ]);
  const code = gen(p, 'b02');
  ok(code.includes('menu1_id'), 'menu1_id должен быть в коде');
  ok(code.includes('menu2_id'), 'menu2_id должен быть в коде');
  syntax(code, 'b02');
});

test('B03', 'message без saveMessageIdTo рядом с message с saveMessageIdTo → синтаксис OK', () => {
  const p = makeCleanProject([
    makeMessageNode('msg1', 'С сохранением', 'saved_id'),
    makeMessageNode('msg2', 'Без сохранения'),
  ]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'saveMessageIdTo с кириллицей в имени переменной → синтаксис OK', () => {
  const p = makeCleanProject([makeMessageNode('msg1', 'Меню', 'id_меню')]);
  syntax(gen(p, 'b04'), 'b04');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║   Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ''}${' '.repeat(Math.max(0, 40 - String(passed).length - String(total).length - (failed > 0 ? String(failed).length + 10 : 0)))}║`);
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
