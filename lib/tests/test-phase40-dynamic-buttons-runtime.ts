/**
 * @fileoverview Фаза — Рантайм динамических кнопок
 *
 * Проверяет что сгенерированный Python-код корректно читает переменную
 * `projects` из user_data и строит список кнопок.
 *
 * Воспроизводит точный сценарий из bots/новый/новый.json:
 *   projects-msg (keyboardNodeId: "projects-keyboard")
 *   → projects-keyboard (enableDynamicButtons: true, sourceVariable: "projects",
 *                         textTemplate: "📁 {name}", callbackTemplate: "project_{id}", columns: 1)
 *
 * @module tests/test-phase-dynamic-buttons-runtime
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Результат теста */
type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Регистрирует и выполняет тест
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

/** Бросает ошибку если условие ложно */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/**
 * Запускает Python-скрипт и возвращает stdout
 * @param script - Код Python-скрипта
 * @param label - Метка для временного файла
 */
function runPython(script: string, label: string): string {
  const tmp = `_tmp_runtime_${label}.py`;
  // Добавляем UTF-8 заголовок для корректной обработки кириллицы
  fs.writeFileSync(tmp, `# -*- coding: utf-8 -*-\n${script}`, 'utf-8');
  try {
    const out = execSync(`python ${tmp}`, {
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    }).toString();
    fs.unlinkSync(tmp);
    return out.trim();
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new Error(e.stderr?.toString() ?? String(e));
  }
}

/**
 * Заголовок Python-скрипта с mock-объектами для aiogram
 * Определяет InlineKeyboardBuilder, InlineKeyboardButton без зависимости от aiogram
 */
const PYTHON_MOCK_HEADER = `
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class _Button:
    def __init__(self, text, callback_data, **kw):
        self.text = text
        self.callback_data = callback_data

class _Markup:
    def __init__(self, rows):
        self.inline_keyboard = rows

class InlineKeyboardBuilder:
    def __init__(self):
        self._buttons = []
    def add(self, btn):
        self._buttons.append(btn)
    def adjust(self, *args):
        pass
    def as_markup(self):
        return _Markup([self._buttons])

def InlineKeyboardButton(text, callback_data, **kw):
    return _Button(text, callback_data)
`;

/**
 * Создаёт минимальный project.json с узлами из сценария новый.json
 * @returns Объект проекта с projects-msg и projects-keyboard
 */
function makeNewBotProject() {
  return {
    sheets: [{
      id: 'sheet1', name: 'Test',
      nodes: [
        { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: '', keyboardType: 'none', buttons: [], autoTransitionTo: 'projects-msg', enableAutoTransition: true } },
        {
          id: 'projects-msg', type: 'message', position: { x: 200, y: 0 },
          data: { messageText: 'Ваши проекты:', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'projects-keyboard', enableDynamicButtons: false, dynamicButtons: { columns: 2, arrayPath: '', styleMode: 'none', styleField: '', textTemplate: '', styleTemplate: '', sourceVariable: '', callbackTemplate: '' } },
        },
        {
          id: 'projects-keyboard', type: 'keyboard', position: { x: 500, y: 0 },
          data: { keyboardType: 'inline', buttons: [], enableDynamicButtons: true, dynamicButtons: { columns: 1, arrayPath: '', styleMode: 'none', styleField: '', textTemplate: '📁 {name}', styleTemplate: '', sourceVariable: 'projects', callbackTemplate: 'project_{id}' }, oneTimeKeyboard: false, resizeKeyboard: true },
        },
      ],
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 */
function gen(project: unknown): string {
  return generatePythonCode(project as any, { botName: 'RuntimeTest', userDatabaseEnabled: false, enableComments: false });
}

/**
 * Извлекает блок динамических кнопок из сгенерированного кода.
 * Ищет блок начиная с `import json as _json` внутри функции handle_callback_projects_msg.
 * @param code - Сгенерированный Python-код
 * @returns Блок кода с _resolve_dynamic_path и _dynamic_source без отступов
 */
function extractDynamicBlock(code: string): string {
  // Находим функцию handle_callback_projects_msg
  const fnStart = code.indexOf('async def handle_callback_projects_msg');
  if (fnStart === -1) throw new Error('handle_callback_projects_msg не найдена в коде');
  // Ищем import json as _json внутри этой функции
  const start = code.indexOf('    import json as _json', fnStart);
  if (start === -1) throw new Error('import json as _json не найден в handle_callback_projects_msg');
  // Ищем конец блока — keyboard = None (ветка else после _dynamic_added > 0)
  const endMarker = '    else:\n        keyboard = None';
  const end = code.indexOf(endMarker, start);
  if (end === -1) throw new Error('else: keyboard = None не найден после блока динамических кнопок');
  const raw = code.slice(start, end + endMarker.length);
  // Убираем ведущие 4 пробела (блок находится внутри функции)
  return raw.split('\n').map(line => line.replace(/^    /, '')).join('\n');
}

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Рантайм динамических кнопок                               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const project = makeNewBotProject();
const code = gen(project);

// ══ Блок A: Структура сгенерированного кода ═══════════════════════════════════
console.log('══ Блок A: Структура сгенерированного кода ══════════════════════════');

test('A01', 'projects-keyboard переносит enableDynamicButtons в projects-msg', () => {
  ok(code.includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено в коде');
});

test('A02', 'sourceVariable "projects" присутствует в коде', () => {
  ok(code.includes('all_user_vars.get("projects")'), 'all_user_vars.get("projects") не найдено');
});

test('A03', 'textTemplate "📁 {name}" присутствует в коде', () => {
  ok(code.includes('📁 {name}'), 'шаблон "📁 {name}" не найден');
});

test('A04', 'callbackTemplate "project_{id}" присутствует в коде', () => {
  ok(code.includes('project_{id}'), 'шаблон "project_{id}" не найден');
});

test('A05', 'builder.adjust(1) — одна колонка', () => {
  ok(code.includes('builder.adjust(1)'), 'builder.adjust(1) не найдено');
});

// ══ Блок B: Рантайм — чтение projects из user_data ════════════════════════════
console.log('\n══ Блок B: Рантайм — чтение projects из user_data ═══════════════════');

test('B01', 'Python: _dynamic_source = список когда projects = список', () => {
  let block: string;
  try { block = extractDynamicBlock(code); } catch (e: any) { throw new Error(e.message); }

  const script = `${PYTHON_MOCK_HEADER}
import json as _json

# Симуляция user_data и all_user_vars
user_data = {123: {"projects": [{"id": 1, "name": "Проект А"}, {"id": 2, "name": "Проект Б"}]}}
user_id = 123

def replace_variables_in_text(template, variables, filters):
    import re
    def repl(m):
        key = m.group(1)
        return str(variables.get(key, m.group(0)))
    return re.sub(r'\\{(\\w+)\\}', repl, template)

all_user_vars = dict(user_data.get(user_id, {}))

${block}

print("dynamic_items_count:", len(_dynamic_items))
print("keyboard_is_none:", keyboard is None)
`;
  const out = runPython(script, 'b01');
  ok(out.includes('dynamic_items_count: 2'), `Ожидалось 2 элемента, получено: ${out}`);
  ok(out.includes('keyboard_is_none: False'), `keyboard должен быть не None, получено: ${out}`);
});

test('B02', 'Python: _dynamic_source = список когда projects = JSON-строка', () => {
  let block: string;
  try { block = extractDynamicBlock(code); } catch (e: any) { throw new Error(e.message); }

  const script = `${PYTHON_MOCK_HEADER}
import json as _json

# Симуляция: projects сохранён как JSON-строка (из БД)
user_data = {123: {"projects": '[{"id": 1, "name": "Проект А"}]'}}
user_id = 123

def replace_variables_in_text(template, variables, filters):
    import re
    def repl(m):
        key = m.group(1)
        return str(variables.get(key, m.group(0)))
    return re.sub(r'\\{(\\w+)\\}', repl, template)

all_user_vars = dict(user_data.get(user_id, {}))

${block}

print("dynamic_items_count:", len(_dynamic_items))
print("keyboard_is_none:", keyboard is None)
`;
  const out = runPython(script, 'b02');
  ok(out.includes('dynamic_items_count: 1'), `Ожидалось 1 элемент, получено: ${out}`);
  ok(out.includes('keyboard_is_none: False'), `keyboard должен быть не None, получено: ${out}`);
});

test('B03', 'Python: keyboard = None когда projects = None (данные не загружены)', () => {
  let block: string;
  try { block = extractDynamicBlock(code); } catch (e: any) { throw new Error(e.message); }

  const script = `${PYTHON_MOCK_HEADER}
import json as _json

# Симуляция: projects не сохранён
user_data = {123: {}}
user_id = 123

def replace_variables_in_text(template, variables, filters):
    import re
    def repl(m):
        key = m.group(1)
        return str(variables.get(key, m.group(0)))
    return re.sub(r'\\{(\\w+)\\}', repl, template)

all_user_vars = dict(user_data.get(user_id, {}))

${block}

print("dynamic_items_count:", len(_dynamic_items))
print("keyboard_is_none:", keyboard is None)
`;
  const out = runPython(script, 'b03');
  ok(out.includes('dynamic_items_count: 0'), `Ожидалось 0 элементов, получено: ${out}`);
  ok(out.includes('keyboard_is_none: True'), `keyboard должен быть None, получено: ${out}`);
});

test('B04', 'Python: кнопки генерируются с правильным текстом и callback', () => {
  let block: string;
  try { block = extractDynamicBlock(code); } catch (e: any) { throw new Error(e.message); }

  const script = `${PYTHON_MOCK_HEADER}
import json as _json

user_data = {123: {"projects": [{"id": 42, "name": "Мой проект"}]}}
user_id = 123

def replace_variables_in_text(template, variables, filters):
    import re
    def repl(m):
        key = m.group(1)
        return str(variables.get(key, m.group(0)))
    return re.sub(r'\\{(\\w+)\\}', repl, template)

all_user_vars = dict(user_data.get(user_id, {}))

${block}

if keyboard is not None:
    btn = keyboard.inline_keyboard[0][0]
    print("btn_text:", btn.text)
    print("btn_callback:", btn.callback_data)
else:
    print("btn_text: NONE")
    print("btn_callback: NONE")
`;
  const out = runPython(script, 'b04');
  ok(out.includes('btn_callback: project_42'), `Неверный callback: ${out}`);
  ok(out.includes('Мой проект'), `Текст кнопки не содержит "Мой проект": ${out}`);
});

// ══ Итог ══════════════════════════════════════════════════════════════════════
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
const summary = `  Итог: ${passed}/${total} пройдено  |  Провалено: ${failed}`;
console.log(`║${summary}${' '.repeat(Math.max(0, 62 - summary.length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
