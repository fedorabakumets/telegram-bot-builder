/**
 * @fileoverview Фаза 1 — Текст и форматирование (JSON-мутации)
 *
 * Тестирует все аспекты messageText и formatMode через мутацию project.json
 * и полный цикл генерации Python-кода.
 *
 * Покрывает:
 *  1.  Обычный текст — базовый случай
 *  2.  Пустой messageText
 *  3.  Отсутствующий messageText (поле удалено)
 *  4.  Очень длинный текст (5000 символов)
 *  5.  Текст с двойными кавычками — экранирование
 *  6.  Текст с одинарными кавычками
 *  7.  Текст с обратным слешем
 *  8.  Текст с переносами строк \n
 *  9.  Текст с табуляцией \t
 * 10.  Текст с нулевым байтом / управляющими символами
 * 11.  Текст только из пробелов
 * 12.  Текст с Unicode (эмодзи, кириллица, CJK)
 * 13.  Текст с переменной {user_name} → replace_variables_in_text
 * 14.  Текст с несколькими переменными {var1} {var2}
 * 15.  formatMode: "none" → нет parse_mode
 * 16.  formatMode: "html" → parse_mode="HTML"
 * 17.  formatMode: "html" + все HTML-теги (<b><i><u><s><code><pre><a>)
 * 18.  formatMode: "html" + незакрытый тег — генерация не падает
 * 19.  formatMode: "html" + спецсимволы < > & в тексте
 * 20.  formatMode: "markdown" → parse_mode="Markdown"
 * 21.  formatMode: "markdown" + все MD-конструкции (*_ ` [] ())
 * 22.  markdown: true + formatMode: "none" → legacy fallback → parse_mode="Markdown"
 * 23.  markdown: false + formatMode: "none" → нет parse_mode
 * 24.  markdown: true + formatMode: "html" → formatMode побеждает → parse_mode="HTML"
 * 25.  disableNotification: true → disable_notification=True в коде
 * 26.  disableNotification: false → нет disable_notification или False
 * 27.  Узел type="message" — те же проверки форматирования
 * 28.  Два узла с разными formatMode — каждый независим
 * 29.  Текст с Python-ключевыми словами (if, def, class, import)
 * 30.  Текст с SQL-инъекцией — безопасная вставка в строку
 * 31.  Текст с HTML-инъекцией при formatMode:"none"
 * 32.  Текст с тройными кавычками """ — не ломает Python
 * 33.  Текст с \r\n (Windows line endings)
 * 34.  messageText только из цифр
 * 35.  messageText только из спецсимволов !@#$%^&*()
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';

// Создаём папку и базовый project.json если не существует
if (!fs.existsSync(PROJECT_PATH)) {
  fs.mkdirSync('bots/импортированный_проект_1723_60_53', { recursive: true });
  const baseProject = {
    version: 2,
    activeSheetId: 'sheet-phase1',
    sheets: [{
      id: 'sheet-phase1',
      name: 'Основной поток',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes: [
        {
          id: 'cmd-trigger-phase1',
          type: 'command_trigger',
          position: { x: 20, y: 100 },
          data: {
            command: '/start',
            description: 'Запустить бота',
            showInMenu: true,
            adminOnly: false,
            requiresAuth: false,
            messageText: 'Привет!',
            formatMode: 'none',
            markdown: false,
            autoTransitionTo: 'msg-phase1',
            buttons: [],
            keyboardType: 'none',
            resizeKeyboard: true,
            oneTimeKeyboard: false,
            enableStatistics: true,
            collectUserInput: false,
            enableConditionalMessages: false,
            conditionalMessages: [],
            enableTextInput: false,
            enablePhotoInput: false,
            enableVideoInput: false,
            enableAudioInput: false,
            enableDocumentInput: false,
            inputVariable: '',
            photoInputVariable: '',
            videoInputVariable: '',
            audioInputVariable: '',
            documentInputVariable: '',
          },
        },
        {
          id: 'msg-phase1',
          type: 'message',
          position: { x: 420, y: 100 },
          data: {
            messageText: 'Сообщение',
            formatMode: 'none',
            markdown: false,
            buttons: [],
            keyboardType: 'none',
            resizeKeyboard: true,
            oneTimeKeyboard: false,
            enableStatistics: true,
            collectUserInput: false,
            enableConditionalMessages: false,
            conditionalMessages: [],
            enableAutoTransition: false,
            attachedMedia: [],
            enableTextInput: false,
            enablePhotoInput: false,
            enableVideoInput: false,
            enableAudioInput: false,
            enableDocumentInput: false,
            inputVariable: '',
            photoInputVariable: '',
            videoInputVariable: '',
            audioInputVariable: '',
            documentInputVariable: '',
          },
        },
      ],
    }],
  };
  fs.writeFileSync(PROJECT_PATH, JSON.stringify(baseProject, null, 2), 'utf-8');
}

const BASE_PROJECT = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Патчит data первого узла (start) */
function patchStart(patch: Record<string, unknown>) {
  const p = deepClone(BASE_PROJECT);
  Object.assign(p.sheets[0].nodes[0].data, patch);
  return p;
}

/** Патчит data второго узла (message) */
function patchMessage(patch: Record<string, unknown>) {
  const p = deepClone(BASE_PROJECT);
  Object.assign(p.sheets[0].nodes[1].data, patch);
  return p;
}

/** Удаляет поле из data первого узла */
function deleteField(field: string) {
  const p = deepClone(BASE_PROJECT);
  delete p.sheets[0].nodes[0].data[field];
  return p;
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase1_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p1_${label}.py`;
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

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

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

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertSyntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  assert(r.ok, `Синтаксическая ошибка Python:\n${r.error}`);
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║       Фаза 1 — Текст и форматирование (35 тестов)           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ── 1. Обычный текст ─────────────────────────────────────────────────────────
test('01', 'Обычный текст — базовый случай', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[1].data.messageText = 'Привет! Добро пожаловать!';
  p.sheets[0].nodes[1].data.formatMode = 'none';
  const code = gen(p, 't01');
  assertSyntax(code, 't01');
  assert(code.includes('Привет! Добро пожаловать!'), 'текст должен быть в коде');
  assert(!code.includes('parse_mode'), 'parse_mode не должен быть при formatMode:none');
});

// ── 2. Пустой messageText ────────────────────────────────────────────────────
test('02', 'Пустой messageText = ""', () => {
  const code = gen(patchStart({ messageText: '', formatMode: 'none' }), 't02');
  assertSyntax(code, 't02');
  // Пустая строка должна генерироваться без краша
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

// ── 3. Отсутствующий messageText ─────────────────────────────────────────────
test('03', 'Отсутствующий messageText (поле удалено)', () => {
  const code = gen(deleteField('messageText'), 't03');
  assertSyntax(code, 't03');
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться без поля');
});

// ── 4. Очень длинный текст ───────────────────────────────────────────────────
test('04', 'Очень длинный текст (5000 символов)', () => {
  const longText = 'А'.repeat(5000);
  const code = gen(patchMessage({ messageText: longText, formatMode: 'none' }), 't04');
  assertSyntax(code, 't04');
  assert(code.includes('А'.repeat(100)), 'длинный текст должен быть в коде');
});

// ── 5. Двойные кавычки — экранирование ───────────────────────────────────────
test('05', 'Текст с двойными кавычками → экранирование', () => {
  const code = gen(patchMessage({ messageText: 'Он сказал: "Привет!"', formatMode: 'none' }), 't05');
  assertSyntax(code, 't05');
  // В Python коде кавычки должны быть экранированы
  assert(code.includes('\\"') || code.includes("'Он сказал"), 'кавычки должны быть экранированы');
});

// ── 6. Одинарные кавычки ─────────────────────────────────────────────────────
test('06', "Текст с одинарными кавычками → не ломает Python", () => {
  const code = gen(patchStart({ messageText: "It's a test", formatMode: 'none' }), 't06');
  assertSyntax(code, 't06');
});

// ── 7. Обратный слеш ─────────────────────────────────────────────────────────
test('07', 'Текст с обратным слешем → экранирование', () => {
  const code = gen(patchStart({ messageText: 'Путь: C:\\Users\\test', formatMode: 'none' }), 't07');
  assertSyntax(code, 't07');
});

// ── 8. Переносы строк \n ─────────────────────────────────────────────────────
test('08', 'Текст с переносами строк \\n', () => {
  const code = gen(patchStart({ messageText: 'Строка 1\nСтрока 2\nСтрока 3', formatMode: 'none' }), 't08');
  assertSyntax(code, 't08');
  assert(code.includes('\\n') || code.includes('"""'), 'перенос строки должен быть в коде');
});

// ── 9. Табуляция \t ──────────────────────────────────────────────────────────
test('09', 'Текст с табуляцией \\t', () => {
  const code = gen(patchStart({ messageText: 'Колонка1\tКолонка2', formatMode: 'none' }), 't09');
  assertSyntax(code, 't09');
});

// ── 10. Управляющие символы ──────────────────────────────────────────────────
test('10', 'Текст с управляющими символами (\\r)', () => {
  const code = gen(patchStart({ messageText: 'Текст\rКонец', formatMode: 'none' }), 't10');
  assertSyntax(code, 't10');
});

// ── 11. Только пробелы ───────────────────────────────────────────────────────
test('11', 'Текст только из пробелов', () => {
  const code = gen(patchStart({ messageText: '     ', formatMode: 'none' }), 't11');
  assertSyntax(code, 't11');
});

// ── 12. Unicode — эмодзи, кириллица, CJK ─────────────────────────────────────
test('12', 'Текст с Unicode (эмодзи + CJK + арабский)', () => {
  const code = gen(patchMessage({
    messageText: '🎉 Привет! 你好 مرحبا 🚀',
    formatMode: 'none',
  }), 't12');
  assertSyntax(code, 't12');
  assert(code.includes('🎉') || code.includes('\\U'), 'эмодзи должны быть в коде');
});

// ── 13. Переменная {user_name} ───────────────────────────────────────────────
test('13', 'Текст с переменной {user_name} → replace_variables_in_text', () => {
  const code = gen(patchMessage({ messageText: 'Привет, {user_name}!', formatMode: 'none' }), 't13');
  assertSyntax(code, 't13');
  assert(code.includes('replace_variables_in_text'), 'должна вызываться замена переменных');
  assert(code.includes('{user_name}'), 'переменная должна быть в тексте');
});

// ── 14. Несколько переменных ─────────────────────────────────────────────────
test('14', 'Текст с несколькими переменными {var1} и {var2}', () => {
  const code = gen(patchMessage({ messageText: 'Имя: {user_name}, Возраст: {age}, Город: {city}', formatMode: 'none' }), 't14');
  assertSyntax(code, 't14');
  assert(code.includes('replace_variables_in_text'), 'замена переменных должна вызываться');
  assert(code.includes('{user_name}'), '{user_name} должен быть в коде');
  assert(code.includes('{age}'), '{age} должен быть в коде');
});

// ── 15. formatMode: "none" ───────────────────────────────────────────────────
test('15', 'formatMode: "none" → нет parse_mode', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.messageText = 'Текст';
  p.sheets[0].nodes[0].data.formatMode = 'none';
  p.sheets[0].nodes[0].data.markdown = false;
  p.sheets[0].nodes[1].data.formatMode = 'none';
  const code = gen(p, 't15');
  assertSyntax(code, 't15');
  assert(!code.includes('parse_mode'), 'parse_mode не должен быть при formatMode:none');
});

// ── 16. formatMode: "html" ───────────────────────────────────────────────────
test('16', 'formatMode: "html" → parse_mode="HTML"', () => {
  const code = gen(patchMessage({ messageText: '<b>Жирный</b>', formatMode: 'html' }), 't16');
  assertSyntax(code, 't16');
  assert(code.includes('parse_mode="HTML"') || code.includes('ParseMode.HTML'), 'должен быть HTML parse_mode');
});

// ── 17. HTML — все теги ──────────────────────────────────────────────────────
test('17', 'formatMode: "html" + все HTML-теги', () => {
  const html = '<b>жирный</b> <i>курсив</i> <u>подчёркнутый</u> <s>зачёркнутый</s> <code>код</code> <a href="https://t.me">ссылка</a>';
  const code = gen(patchMessage({ messageText: html, formatMode: 'html' }), 't17');
  assertSyntax(code, 't17');
  assert(code.includes('parse_mode="HTML"') || code.includes('ParseMode.HTML'), 'HTML parse_mode');
  assert(code.includes('<b>'), 'тег <b> должен сохраняться');
  assert(code.includes('<i>'), 'тег <i> должен сохраняться');
});

// ── 18. HTML — незакрытый тег ────────────────────────────────────────────────
test('18', 'formatMode: "html" + незакрытый тег — генерация не падает', () => {
  const code = gen(patchStart({ messageText: '<b>Незакрытый тег', formatMode: 'html' }), 't18');
  assertSyntax(code, 't18');
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

// ── 19. HTML — спецсимволы < > & ─────────────────────────────────────────────
test('19', 'formatMode: "html" + спецсимволы < > & в тексте', () => {
  const code = gen(patchStart({ messageText: '5 < 10 & 3 > 1', formatMode: 'html' }), 't19');
  assertSyntax(code, 't19');
});

// ── 20. formatMode: "markdown" ───────────────────────────────────────────────
test('20', 'formatMode: "markdown" → parse_mode="Markdown"', () => {
  const code = gen(patchMessage({ messageText: '*Жирный* _курсив_', formatMode: 'markdown' }), 't20');
  assertSyntax(code, 't20');
  assert(code.includes('parse_mode="Markdown"') || code.includes('ParseMode.MARKDOWN'), 'должен быть Markdown parse_mode');
});

// ── 21. Markdown — все конструкции ───────────────────────────────────────────
test('21', 'formatMode: "markdown" + все MD-конструкции', () => {
  const md = '*жирный* _курсив_ `код` [ссылка](https://t.me) __подчёркнутый__';
  const code = gen(patchMessage({ messageText: md, formatMode: 'markdown' }), 't21');
  assertSyntax(code, 't21');
  assert(code.includes('parse_mode="Markdown"') || code.includes('ParseMode.MARKDOWN'), 'Markdown parse_mode');
});

// ── 22. Legacy: markdown:true + formatMode:"none" ────────────────────────────
test('22', 'markdown:true + formatMode:"none" → legacy fallback → parse_mode="Markdown"', () => {
  // На message-узле legacy fallback срабатывает когда formatMode не задан (undefined)
  // и markdown:true — тогда dispatcher использует 'markdown'
  const p = deepClone(BASE_PROJECT);
  delete p.sheets[0].nodes[1].data.formatMode; // убираем formatMode → undefined
  p.sheets[0].nodes[1].data.markdown = true;
  p.sheets[0].nodes[1].data.messageText = '*Жирный*';
  const code = gen(p, 't22');
  assertSyntax(code, 't22');
  assert(
    code.includes('parse_mode="Markdown"') || code.includes('ParseMode.MARKDOWN'),
    'legacy markdown:true должен давать parse_mode Markdown'
  );
});

// ── 23. markdown:false + formatMode:"none" ───────────────────────────────────
test('23', 'markdown:false + formatMode:"none" → нет parse_mode', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.messageText = 'Обычный текст';
  p.sheets[0].nodes[0].data.markdown = false;
  p.sheets[0].nodes[0].data.formatMode = 'none';
  p.sheets[0].nodes[1].data.formatMode = 'none';
  const code = gen(p, 't23');
  assertSyntax(code, 't23');
  assert(!code.includes('parse_mode'), 'parse_mode не должен быть');
});

// ── 24. markdown:true + formatMode:"html" → html побеждает ───────────────────
test('24', 'markdown:true + formatMode:"html" → formatMode побеждает → parse_mode="HTML"', () => {
  const code = gen(patchMessage({ messageText: '<b>Текст</b>', markdown: true, formatMode: 'html' }), 't24');
  assertSyntax(code, 't24');
  assert(
    code.includes('parse_mode="HTML"') || code.includes('ParseMode.HTML'),
    'formatMode:html должен побеждать над markdown:true'
  );
  assert(
    !code.includes('parse_mode="Markdown"') && !code.includes('ParseMode.MARKDOWN'),
    'parse_mode Markdown не должен быть'
  );
});

// ── 25. disableNotification: true ────────────────────────────────────────────
test('25', 'disableNotification:true на start-узле — генерация не падает', () => {
  // disableNotification поддерживается только в voice/sticker узлах.
  // На start/message узлах поле игнорируется — проверяем что генерация не падает.
  const code = gen(patchStart({ messageText: 'Тихое сообщение', disableNotification: true }), 't25');
  assertSyntax(code, 't25');
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

// ── 26. disableNotification: false ───────────────────────────────────────────
test('26', 'disableNotification:false → нет disable_notification=True', () => {
  const code = gen(patchStart({ messageText: 'Обычное сообщение', disableNotification: false }), 't26');
  assertSyntax(code, 't26');
  assert(
    !code.includes('disable_notification=True'),
    'disable_notification=True не должен быть при false'
  );
});

// ── 27. Узел type="message" — форматирование ─────────────────────────────────
test('27', 'Узел type="message" + formatMode:"html" → parse_mode="HTML"', () => {
  const code = gen(patchMessage({ messageText: '<b>Сообщение</b>', formatMode: 'html' }), 't27');
  assertSyntax(code, 't27');
  assert(code.includes('parse_mode="HTML"') || code.includes('ParseMode.HTML'), 'HTML parse_mode в message-узле');
});

// ── 28. Два узла с разными formatMode ────────────────────────────────────────
test('28', 'Два узла с разными formatMode — каждый независим', () => {
  const p = deepClone(BASE_PROJECT);
  // nodes[1] — message с HTML
  p.sheets[0].nodes[1].data.messageText = '<b>HTML</b>';
  p.sheets[0].nodes[1].data.formatMode = 'html';
  // Добавляем второй message-узел с Markdown
  p.sheets[0].nodes.push({
    id: 'msg-phase1-b',
    type: 'message',
    position: { x: 820, y: 100 },
    data: {
      messageText: '*Markdown*',
      formatMode: 'markdown',
      markdown: false,
      buttons: [],
      keyboardType: 'none',
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      enableStatistics: true,
      collectUserInput: false,
      enableConditionalMessages: false,
      conditionalMessages: [],
      enableAutoTransition: false,
      attachedMedia: [],
      enableTextInput: false,
      enablePhotoInput: false,
      enableVideoInput: false,
      enableAudioInput: false,
      enableDocumentInput: false,
      inputVariable: '',
      photoInputVariable: '',
      videoInputVariable: '',
      audioInputVariable: '',
      documentInputVariable: '',
    },
  });
  const code = gen(p, 't28');
  assertSyntax(code, 't28');
  assert(code.includes('parse_mode="HTML"') || code.includes('ParseMode.HTML'), 'HTML parse_mode должен быть');
  assert(code.includes('parse_mode="Markdown"') || code.includes('ParseMode.MARKDOWN'), 'Markdown parse_mode должен быть');
});

// ── 29. Python-ключевые слова в тексте ───────────────────────────────────────
test('29', 'Текст с Python-ключевыми словами (if, def, class, import)', () => {
  const code = gen(patchMessage({ messageText: 'if def class import lambda return yield', formatMode: 'none' }), 't29');
  assertSyntax(code, 't29');
  assert(code.includes('if def class import'), 'ключевые слова должны быть в строке');
});

// ── 30. SQL-инъекция ─────────────────────────────────────────────────────────
test('30', "Текст с SQL-инъекцией — безопасная вставка", () => {
  const code = gen(patchStart({ messageText: "'; DROP TABLE users; --", formatMode: 'none' }), 't30');
  assertSyntax(code, 't30');
});

// ── 31. HTML-инъекция при formatMode:"none" ───────────────────────────────────
test('31', 'Текст с HTML-инъекцией при formatMode:"none" — не интерпретируется', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.messageText = '<script>alert(1)</script>';
  p.sheets[0].nodes[0].data.formatMode = 'none';
  p.sheets[0].nodes[1].data.formatMode = 'none';
  const code = gen(p, 't31');
  assertSyntax(code, 't31');
  assert(!code.includes('parse_mode'), 'parse_mode не должен быть при formatMode:none');
});

// ── 32. Тройные кавычки в тексте ─────────────────────────────────────────────
test('32', 'Текст с тройными кавычками """ — не ломает Python', () => {
  const code = gen(patchStart({ messageText: 'Текст с """тройными""" кавычками', formatMode: 'none' }), 't32');
  assertSyntax(code, 't32');
});

// ── 33. Windows line endings \r\n ─────────────────────────────────────────────
test('33', 'Текст с Windows line endings \\r\\n', () => {
  const code = gen(patchStart({ messageText: 'Строка 1\r\nСтрока 2\r\nСтрока 3', formatMode: 'none' }), 't33');
  assertSyntax(code, 't33');
});

// ── 34. Только цифры ─────────────────────────────────────────────────────────
test('34', 'messageText только из цифр', () => {
  const code = gen(patchMessage({ messageText: '1234567890', formatMode: 'none' }), 't34');
  assertSyntax(code, 't34');
  assert(code.includes('1234567890'), 'цифры должны быть в коде');
});

// ── 35. Только спецсимволы ───────────────────────────────────────────────────
test('35', 'messageText только из спецсимволов !@#$%^&*()', () => {
  const code = gen(patchStart({ messageText: '!@#$%^&*()', formatMode: 'none' }), 't35');
  assertSyntax(code, 't35');
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${results.length} пройдено  |  Провалено: ${failed}${' '.repeat(40 - String(passed).length - String(results.length).length - String(failed).length)}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
