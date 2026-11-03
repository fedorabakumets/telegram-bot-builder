/**
 * @fileoverview Фаза 26 — convert_file, часть 2
 *
 * Дополнительные блоки тестов для изменений в шаблонах psql-query и message:
 *  J. psql-query — нормализация datetime через _norm_val / _norm_row (6 тестов)
 *  K. message.py.jinja2 — ветка file-переменных BufferedInputFile (7 тестов)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { generateMessage } from '../templates/message/message.renderer';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

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
 * Создаёт узел типа psql_query
 * @param id - Идентификатор узла
 * @param data - Дополнительные данные узла
 * @returns Объект узла psql_query
 */
function makePsqlQueryNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'psql_query',
    position: { x: 200, y: 0 },
    data: {
      query: 'SELECT * FROM users',
      saveResultTo: 'users_data',
      resultFormat: 'json',
      textTemplate: '',
      autoTransitionTo: '',
      enableAutoTransition: false,
      ...data,
    },
  };
}

/**
 * Создаёт узел типа message с поддержкой attachedMedia
 * @param id - Идентификатор узла
 * @param text - Текст сообщения
 * @param attachedMedia - Массив медиа-вложений
 * @returns Объект узла message
 */
function makeMessageNode(id: string, text = 'Ответ', attachedMedia: string[] = []) {
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
      attachedMedia,
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
    activeSheetId: 'sheet-cf2',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-cf2',
      name: 'Основной поток',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/**
 * Генерирует Python-код с включённой БД
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код с поддержкой БД
 */
function genDB(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `CF2DB_${label}`,
    userDatabaseEnabled: true,
    });
}

/**
 * Генерирует Python-код без БД
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `CF2_${label}`,
    userDatabaseEnabled: false,
    });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Объект с результатом проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_cf2_${label}.py`;
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
console.log('║   Фаза 26 — convert_file, часть 2 (J + K)                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

/** Создаёт код с запросом и сохранением результата в переменную. */
function makeQueryCode(): string {
  return genDB(makeCleanProject([makeStartNode(), makePsqlQueryNode('query')], true), 'query');
}

/** Создаёт код обработчика сообщения с файлом из переменной. */
function makeFileCode(): string {
  return generateMessage({ nodeId: 'message', messageText: 'Файл', attachedMedia: ['{export}'] });
}

test('J01', 'результаты запроса нормализуют datetime в isoformat', () => {
  ok(makeQueryCode().includes("v.isoformat() if hasattr(v, 'isoformat') else v"), 'Нормализация даты отсутствует');
});
test('J02', 'нормализация применяется к полям строки', () => {
  ok(makeQueryCode().includes('{k: _norm_val(v) for k, v in r.items()}'), 'Нормализация полей отсутствует');
});
test('J03', 'нормализация применяется к списку строк', () => {
  ok(makeQueryCode().includes('_result = [_norm_row(r) for r in _result]'), 'Нормализация списка отсутствует');
});
test('J04', 'нормализация применяется к отдельной строке', () => {
  ok(makeQueryCode().includes('_result = _norm_row(_result)'), 'Нормализация строки отсутствует');
});
test('J05', 'результат сохраняется в пользовательскую переменную', () => {
  ok(makeQueryCode().includes('set_user_var(user_id, "users_data"'), 'Сохранение результата отсутствует');
});
test('J06', 'код запроса проходит проверку синтаксиса', () => syntax(makeQueryCode(), 'query'));
test('K01', 'файл берётся из указанной переменной', () => {
  ok(makeFileCode().includes('user_data.get(user_id, {}).get("export")'), 'Переменная файла отсутствует');
});
test('K02', 'объект файла проверяется перед отправкой', () => {
  ok(makeFileCode().includes('_file_var_val.get("type") == "file"'), 'Проверка типа файла отсутствует');
});
test('K03', 'содержимое файла декодируется из base64', () => {
  ok(makeFileCode().includes('_b64.b64decode(_file_var_val["data"])'), 'Декодирование отсутствует');
});
test('K04', 'файл передаётся как BufferedInputFile', () => {
  ok(makeFileCode().includes('BufferedInputFile as _BufInputFile'), 'BufferedInputFile отсутствует');
});
test('K05', 'имя файла берётся из метаданных', () => {
  ok(makeFileCode().includes('_file_var_val.get("fileName", "export.csv")'), 'Имя файла отсутствует');
});
test('K06', 'ошибка отправки файла обрабатывается', () => {
  ok(makeFileCode().includes('except Exception as _fe:'), 'Обработка ошибки отсутствует');
});
test('K07', 'код сообщения с файлом проходит проверку синтаксиса', () => {
  syntax(makeFileCode(), 'file-handler');
  const start = makeStartNode();
  const command = { ...start, type: 'command_trigger', data: { ...start.data, autoTransitionTo: 'message', enableAutoTransition: true } };
  const code = gen(makeCleanProject([command, makeMessageNode('message', 'Файл', ['{export}'])]), 'file');
  ok(code.includes('BufferedInputFile as _BufInputFile'), 'Обработчик файла отсутствует в полном сценарии');
  syntax(code, 'file');
});
test('K08', 'незакрытая скобка не распознаётся как переменная файла', () => {
  const code = generateMessage({ nodeId: 'message', attachedMedia: ['{export'] });
  ok(!code.includes('BufferedInputFile as _BufInputFile'), 'Некорректная переменная распознана как файл');
});
test('K09', 'объект file_id не распознаётся как переменная файла', () => {
  const code = generateMessage({ nodeId: 'message', attachedMedia: ['{"__type":"file_id","fileIdsByToken":{}}'] });
  ok(!code.includes('BufferedInputFile as _BufInputFile'), 'file_id ошибочно распознан как переменная');
});

const failed = results.filter(result => !result.passed);
console.log(`\nФаза 26, часть 2: ${results.length - failed.length}/${results.length} пройдено`);
if (failed.length) process.exitCode = 1;
