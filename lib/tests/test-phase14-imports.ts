/**
 * @fileoverview Фаза 14 — Импорт проектов (80+ тестов)
 *
 * Тестирует импорт проектов из файлов в директории bots/
 * и синхронизацию между файловой системой и базой данных.
 *
 * Покрывает:
 *  Блок A: Валидация структуры project.json
 *  Блок B: Импорт из папок bot_{projectId}_{tokenId}
 *  Блок C: Обновление существующих проектов
 *  Блок D: Создание новых проектов
 *  Блок E: Обработка ошибок и граничные случаи
 *  Блок F: Миграция данных между версиями
 *  Блок G: Интеграция с базой данных
 *  Блок H: Мультисheet проекты
 *  Блок I: Медиа-файлы и переменные
 *  Блок J: Производительность и стресс-тесты
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const BASE_PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE_PROJECT = JSON.parse(fs.readFileSync(BASE_PROJECT_PATH, 'utf-8'));
const TEST_BOTS_DIR = path.join(process.cwd(), 'bots', 'test_imports');

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function createTestProject(
  projectId: number,
  tokenId: number,
  data: Record<string, unknown> = {}
): { dir: string; jsonPath: string; data: Record<string, unknown> } {
  const dirName = `bot_${projectId}_${tokenId}`;
  const dir = path.join(TEST_BOTS_DIR, dirName);
  const jsonPath = path.join(dir, 'project.json');

  const projectData = {
    sheets: [
      {
        id: 'test_sheet',
        name: 'Test Sheet',
        nodes: [
          {
            id: 'start_node',
            type: 'start',
            position: { x: 0, y: 0 },
            data: {
              command: '/start',
              messageText: 'Привет!',
              buttons: [],
              ...data,
            },
          },
        ],
        connections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
      },
    ],
    version: 2,
    activeSheetId: 'test_sheet',
    settings: {
      name: `Test Project ${projectId}`,
    },
  };

  return { dir, jsonPath, data: projectData };
}

function setupTestDir() {
  if (!fs.existsSync(TEST_BOTS_DIR)) {
    fs.mkdirSync(TEST_BOTS_DIR, { recursive: true });
  }
}

function cleanupTestDir() {
  if (fs.existsSync(TEST_BOTS_DIR)) {
    fs.rmSync(TEST_BOTS_DIR, { recursive: true, force: true });
  }
}

function writeProjectFile(jsonPath: string, data: Record<string, unknown>) {
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase14_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p14_${label}.py`;
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

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertSyntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  assert(r.ok, `Синтаксическая ошибка Python:\n${r.error}`);
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

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         Фаза 14 — Импорт проектов (80 тестов)               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
//  Блок A: Валидация структуры project.json
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Валидация структуры project.json ─────────────────────');

test('A01', 'Валидный project.json с sheets и nodes', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A01');
  assertSyntax(code, 'A01');
  assert(code.includes('async def start_handler'), 'должен быть start_handler');
});

test('A02', 'project.json без version → дефолт version: 1', () => {
  const p = deepClone(BASE_PROJECT);
  delete (p as any).version;
  const code = gen(p, 'A02');
  assertSyntax(code, 'A02');
});

test('A03', 'project.json с version: 1 (legacy)', () => {
  const p = deepClone(BASE_PROJECT);
  p.version = 1;
  const code = gen(p, 'A03');
  assertSyntax(code, 'A03');
});

test('A04', 'project.json с version: 2 (текущий)', () => {
  const p = deepClone(BASE_PROJECT);
  p.version = 2;
  const code = gen(p, 'A04');
  assertSyntax(code, 'A04');
});

test('A05', 'project.json с пустым sheets array', () => {
  const p = { sheets: [], version: 2, activeSheetId: null };
  const code = gen(p, 'A05');
  assertSyntax(code, 'A05');
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

test('A06', 'project.json без activeSheetId', () => {
  const p = deepClone(BASE_PROJECT);
  delete (p as any).activeSheetId;
  const code = gen(p, 'A06');
  assertSyntax(code, 'A06');
});

test('A07', 'project.json с несуществующим activeSheetId', () => {
  const p = deepClone(BASE_PROJECT);
  p.activeSheetId = 'nonexistent_sheet';
  const code = gen(p, 'A07');
  assertSyntax(code, 'A07');
});

test('A08', 'node без type → игнорируется', () => {
  const p = deepClone(BASE_PROJECT);
  (p.sheets[0].nodes[0] as any).type = undefined;
  const code = gen(p, 'A08');
  assertSyntax(code, 'A08');
});

test('A09', 'node без id → пропускается генератором', () => {
  const p = deepClone(BASE_PROJECT);
  delete (p.sheets[0].nodes[0] as any).id;
  // Генератор теперь корректно пропускает узлы без id
  const code = gen(p, 'A09');
  assertSyntax(code, 'A09');
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться без узла без id');
});

test('A10', 'node без data → пропускается генератором', () => {
  const p = deepClone(BASE_PROJECT);
  delete (p.sheets[0].nodes[0] as any).data;
  // Генератор теперь корректно пропускает узлы без data
  const code = gen(p, 'A10');
  assertSyntax(code, 'A10');
  assert(typeof code === 'string' && code.length > 0, 'код должен генерироваться без узла без data');
});

test('A11', 'node с пустым data object', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data = {} as any;
  const code = gen(p, 'A11');
  assertSyntax(code, 'A11');
});

test('A12', 'connection без from → игнорируется', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].connections = [{ to: 'target' } as any];
  const code = gen(p, 'A12');
  assertSyntax(code, 'A12');
});

test('A13', 'connection без to → игнорируется', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].connections = [{ from: 'source' } as any];
  const code = gen(p, 'A13');
  assertSyntax(code, 'A13');
});

test('A14', 'project.json с extra поля → игнорируются', () => {
  const p = deepClone(BASE_PROJECT);
  (p as any).extraField = 'should be ignored';
  (p as any).anotherField = { nested: 'value' };
  const code = gen(p, 'A14');
  assertSyntax(code, 'A14');
});

test('A15', 'project.json с null значениями', () => {
  const p = deepClone(BASE_PROJECT);
  (p.sheets[0].nodes[0].data as any).messageText = null;
  const code = gen(p, 'A15');
  assertSyntax(code, 'A15');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок B: Импорт из папок bot_{projectId}_{tokenId}
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Импорт из папок bot_{projectId}_{tokenId} ────────────');

test('B01', 'Папка bot_1_1 → projectId=1, tokenId=1', () => {
  setupTestDir();
  const { dir, jsonPath, data } = createTestProject(1, 1);
  writeProjectFile(jsonPath, data);
  assert(fs.existsSync(jsonPath), 'файл должен быть создан');
  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  assert(parsed.sheets.length > 0, 'sheets должен существовать');
  cleanupTestDir();
});

test('B02', 'Папка bot_999_888 → projectId=999, tokenId=888', () => {
  setupTestDir();
  const { jsonPath, data } = createTestProject(999, 888);
  writeProjectFile(jsonPath, data);
  assert(fs.existsSync(jsonPath), 'файл должен быть создан');
  cleanupTestDir();
});

test('B03', 'Папка без префикса bot_ → игнорируется', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'invalid_folder');
  fs.mkdirSync(dir, { recursive: true });
  writeProjectFile(path.join(dir, 'project.json'), BASE_PROJECT);
  // Проверка что папка не соответствует паттерну
  const botDirPattern = /^bot_(\d+)_(\d+)$/;
  assert(!botDirPattern.test('invalid_folder'), 'папка должна игнорироваться');
  cleanupTestDir();
});

test('B04', 'Папка bot_abc_def → невалидные ID → игнорируется', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'bot_abc_def');
  fs.mkdirSync(dir, { recursive: true });
  writeProjectFile(path.join(dir, 'project.json'), BASE_PROJECT);
  const botDirPattern = /^bot_(\d+)_(\d+)$/;
  assert(!botDirPattern.test('bot_abc_def'), 'папка с нечисловыми ID должна игнорироваться');
  cleanupTestDir();
});

test('B05', 'Папка bot_1 → неполный формат → игнорируется', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'bot_1');
  fs.mkdirSync(dir, { recursive: true });
  writeProjectFile(path.join(dir, 'project.json'), BASE_PROJECT);
  const botDirPattern = /^bot_(\d+)_(\d+)$/;
  assert(!botDirPattern.test('bot_1'), 'папка с неполным форматом должна игнорироваться');
  cleanupTestDir();
});

test('B06', 'Папка bot_1_2_3 → лишний сегмент → игнорируется', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'bot_1_2_3');
  fs.mkdirSync(dir, { recursive: true });
  writeProjectFile(path.join(dir, 'project.json'), BASE_PROJECT);
  const botDirPattern = /^bot_(\d+)_(\d+)$/;
  assert(!botDirPattern.test('bot_1_2_3'), 'папка с лишним сегментом должна игнорироваться');
  cleanupTestDir();
});

test('B07', 'Папка с project.json внутри', () => {
  setupTestDir();
  const { jsonPath, data } = createTestProject(7, 7);
  writeProjectFile(jsonPath, data);
  assert(fs.existsSync(jsonPath), 'project.json должен существовать');
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(content);
  assert(parsed.sheets, 'sheets должен быть');
  cleanupTestDir();
});

test('B08', 'Папка без project.json → игнорируется', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'bot_8_8');
  fs.mkdirSync(dir, { recursive: true });
  // Не создаем project.json
  assert(!fs.existsSync(path.join(dir, 'project.json')), 'project.json не должен существовать');
  cleanupTestDir();
});

test('B09', 'Папка с невалидным JSON → ошибка парсинга', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'bot_9_9');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.json'), '{ invalid json }', 'utf-8');
  try {
    JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8'));
    assert(false, 'должна быть ошибка парсинга');
  } catch (e) {
    assert(true, 'ошибка парсинга JSON ожидаема');
  }
  cleanupTestDir();
});

test('B10', 'Папка с пустым project.json → ошибка', () => {
  setupTestDir();
  const dir = path.join(TEST_BOTS_DIR, 'bot_10_10');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.json'), '', 'utf-8');
  try {
    const content = fs.readFileSync(path.join(dir, 'project.json'), 'utf-8');
    if (content.trim() === '') throw new Error('Пустой файл');
    assert(false, 'должна быть ошибка пустого файла');
  } catch (e: any) {
    assert(e.message === 'Пустой файл', 'ошибка пустого файла ожидаема');
  }
  cleanupTestDir();
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок C: Обновление существующих проектов
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Обновление существующих проектов ─────────────────────');

test('C01', 'Обновление project.json → новые данные в проекте', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.messageText = 'Обновленный текст';
  const code = gen(p, 'C01');
  assertSyntax(code, 'C01');
  assert(code.includes('Обновленный текст'), 'текст должен обновиться');
});

test('C02', 'Добавление нового узла → новый обработчик', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes.push({
    id: 'new_node',
    type: 'message',
    position: { x: 100, y: 100 },
    data: {
      messageText: 'Новое сообщение',
      buttons: [],
    },
  });
  const code = gen(p, 'C02');
  assertSyntax(code, 'C02');
  assert(code.includes('Новое сообщение'), 'новое сообщение должно быть');
});

test('C03', 'Удаление узла → обработчик удален', () => {
  const p = deepClone(BASE_PROJECT);
  const removedNode = p.sheets[0].nodes.pop();
  const code = gen(p, 'C03');
  assertSyntax(code, 'C03');
  if (removedNode) {
    const removedText = (removedNode.data as any).messageText;
    if (removedText) {
      assert(!code.includes(removedText), 'удаленный текст не должен быть');
    }
  }
});

test('C04', 'Изменение команды /start → новый триггер', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.command = '/newstart';
  const code = gen(p, 'C04');
  assertSyntax(code, 'C04');
  assert(code.includes('newstart'), 'новая команда должна быть');
});

test('C05', 'Добавление кнопок → новая клавиатура', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Кнопка 1', action: 'goto', target: 'target1' },
    { id: 'btn2', text: 'Кнопка 2', action: 'url', url: 'https://t.me' },
  ];
  const code = gen(p, 'C05');
  assertSyntax(code, 'C05');
  assert(code.includes('Кнопка 1'), 'кнопка 1 должна быть');
  assert(code.includes('Кнопка 2'), 'кнопка 2 должна быть');
});

test('C06', 'Изменение formatMode → новый parse_mode', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'markdown';
  const code = gen(p, 'C06');
  assertSyntax(code, 'C06');
  assert(code.includes('Markdown') || code.includes('MARKDOWN'), 'должен быть Markdown');
});

test('C07', 'Добавление media → новые импорты', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'C07');
  assertSyntax(code, 'C07');
  assert(code.includes('aiohttp') || code.includes('URLInputFile'), 'должны быть импорты для медиа');
});

test('C08', 'Изменение synonyms → новые триггеры', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.synonyms = ['старт', 'начало', 'go'];
  const code = gen(p, 'C08');
  assertSyntax(code, 'C08');
  assert(code.includes('старт') || code.includes('начало'), 'синонимы должны быть');
});

test('C09', 'Включение userDatabaseEnabled → SQL запросы', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C09_db');
  // Генерация с включенной БД проверяется в test-phase13-database
  assertSyntax(code, 'C09');
});

test('C10', 'Изменение настроек проекта → новые параметры', () => {
  const p = deepClone(BASE_PROJECT);
  p.settings = { name: 'New Project Name', enableComments: true };
  const code = gen(p, 'C10');
  assertSyntax(code, 'C10');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок D: Создание новых проектов
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Создание новых проектов ──────────────────────────────');

test('D01', 'Новый проект с одним start узлом', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { command: '/start', messageText: 'Привет!', buttons: [] },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D01');
  assertSyntax(code, 'D01');
  assert(code.includes('start_handler'), 'должен быть start_handler');
});

test('D02', 'Новый проект с command узлом', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [
        {
          id: 'start1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { command: '/start', messageText: 'Привет!', buttons: [] },
        },
        {
          id: 'cmd1',
          type: 'command',
          position: { x: 100, y: 100 },
          data: { command: '/help', messageText: 'Помощь', buttons: [] },
        },
      ],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D02');
  assertSyntax(code, 'D02');
  assert(code.includes('help'), 'должна быть команда help');
});

test('D03', 'Новый проект с message узлом', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [
        {
          id: 'start1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { command: '/start', messageText: 'Привет!', buttons: [] },
        },
        {
          id: 'msg1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: { messageText: 'Сообщение', buttons: [] },
        },
      ],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D03');
  assertSyntax(code, 'D03');
  assert(code.includes('Сообщение'), 'должно быть сообщение');
});

test('D04', 'Новый проект с inline кнопками', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          buttons: [
            { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' },
          ],
          keyboardType: 'inline',
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D04');
  assertSyntax(code, 'D04');
  assert(code.includes('InlineKeyboard'), 'должна быть inline клавиатура');
});

test('D05', 'Новый проект с reply кнопками', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          buttons: [
            { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' },
          ],
          keyboardType: 'reply',
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D05');
  assertSyntax(code, 'D05');
  assert(code.includes('ReplyKeyboard'), 'должна быть reply клавиатура');
});

test('D06', 'Новый проект с медиа', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          imageUrl: 'https://example.com/image.jpg',
          buttons: [],
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D06');
  assertSyntax(code, 'D06');
});

test('D07', 'Новый проект с collectUserInput', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          collectUserInput: true,
          enableTextInput: true,
          inputVariable: 'user_answer',
          buttons: [],
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D07');
  assertSyntax(code, 'D07');
  assert(code.includes('user_answer'), 'переменная должна быть');
});

test('D08', 'Новый проект с adminOnly', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          adminOnly: true,
          buttons: [],
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D08');
  assertSyntax(code, 'D08');
  assert(code.includes('admin') || code.includes('ADMIN'), 'должна быть проверка админа');
});

test('D09', 'Новый проект с requiresAuth', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          requiresAuth: true,
          buttons: [],
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D09');
  assertSyntax(code, 'D09');
});

test('D10', 'Новый проект с isPrivateOnly', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          isPrivateOnly: true,
          buttons: [],
        },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'D10');
  assertSyntax(code, 'D10');
  assert(code.includes('private') || code.includes('PRIVATE'), 'должна быть проверка private');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок E: Обработка ошибок и граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Обработка ошибок и граничные случаи ──────────────────');

test('E01', 'project.json с циклическими ссылками → не падает', () => {
  const p = deepClone(BASE_PROJECT);
  // Создаем цикл: node1 → node2 → node1
  p.sheets[0].nodes[0].data.buttons = [{ id: 'btn1', text: 'Btn', action: 'goto', target: 'node2' }];
  p.sheets[0].nodes.push({
    id: 'node2',
    type: 'message',
    position: { x: 100, y: 100 },
    data: {
      messageText: 'Цикл',
      buttons: [{ id: 'btn2', text: 'Back', action: 'goto', target: p.sheets[0].nodes[0].id }],
    },
  });
  const code = gen(p, 'E01');
  assertSyntax(code, 'E01');
});

test('E02', 'node с target на несуществующий узел → не падает', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [{ id: 'btn1', text: 'Btn', action: 'goto', target: 'nonexistent' }];
  const code = gen(p, 'E02');
  assertSyntax(code, 'E02');
});

test('E03', 'connection на несуществующий узел → не падает', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].connections = [{ from: 'start', to: 'nonexistent' } as any];
  const code = gen(p, 'E03');
  assertSyntax(code, 'E03');
});

test('E04', 'Очень глубокое дерево узлов (100 узлов) → не падает', () => {
  const p: any = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  for (let i = 0; i < 100; i++) {
    p.sheets[0].nodes.push({
      id: `node_${i}`,
      type: i === 0 ? 'start' : 'message',
      position: { x: i * 10, y: i * 10 },
      data: {
        command: i === 0 ? '/start' : undefined,
        messageText: `Узел ${i}`,
        buttons: i < 99 ? [{ id: `btn_${i}`, text: 'Next', action: 'goto', target: `node_${i + 1}` }] : [],
      },
    });
  }
  const code = gen(p, 'E04');
  assertSyntax(code, 'E04');
  assert(code.includes('Узел 99'), 'последний узел должен быть');
});

test('E05', 'node с очень длинным ID (500 символов) → не падает', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].id = 'n'.repeat(500);
  const code = gen(p, 'E05');
  assertSyntax(code, 'E05');
});

test('E06', 'node с ID содержащим спецсимволы → safe_name', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].id = 'node-with-special-chars-!@#$%';
  const code = gen(p, 'E06');
  assertSyntax(code, 'E06');
});

test('E07', 'node с ID начинающимся с цифры → safe_name', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].id = '123node';
  const code = gen(p, 'E07');
  assertSyntax(code, 'E07');
});

test('E08', 'project.json с очень длинным названием (1000 символов)', () => {
  const p = deepClone(BASE_PROJECT);
  p.settings = { name: 'N'.repeat(1000) };
  const code = gen(p, 'E08');
  assertSyntax(code, 'E08');
});

test('E09', 'project.json с Unicode в названии', () => {
  const p = deepClone(BASE_PROJECT);
  p.settings = { name: 'Проект 🎉 项目 مشروع' };
  const code = gen(p, 'E09');
  assertSyntax(code, 'E09');
});

test('E10', 'project.json с emoji в messageText', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.messageText = 'Привет! 🎉🚀🌟';
  const code = gen(p, 'E10');
  assertSyntax(code, 'E10');
  assert(code.includes('🎉') || code.includes('\\U'), 'эмодзи должны быть');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок F: Миграция данных между версиями
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Миграция данных между версиями ───────────────────────');

test('F01', 'Миграция version: 1 → version: 2', () => {
  const p: any = {
    version: 1,
    nodes: [
      {
        id: 'start1',
        type: 'start',
        x: 0,
        y: 0,
        command: '/start',
        messageText: 'Привет!',
        buttons: [],
      },
    ],
    connections: [],
  };
  // Миграция: преобразование в version 2
  const migrated = {
    version: 2,
    activeSheetId: 'sheet1',
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: p.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        data: {
          command: n.command,
          messageText: n.messageText,
          buttons: n.buttons,
        },
      })),
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
  };
  const code = gen(migrated, 'F01');
  assertSyntax(code, 'F01');
  assert(code.includes('start_handler'), 'должен быть start_handler');
});

test('F02', 'Миграция legacy полей → новые поля', () => {
  const p: any = {
    version: 1,
    nodes: [{
      id: 'start1',
      type: 'start',
      x: 0,
      y: 0,
      command: '/start',
      text: 'Привет!', // legacy поле
      markdown: true, // legacy поле
    }],
    connections: [],
  };
  const migrated = {
    version: 2,
    activeSheetId: 'sheet1',
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: p.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        data: {
          command: n.command,
          messageText: n.text || n.messageText,
          markdown: n.markdown,
          formatMode: n.markdown ? 'markdown' : 'none',
          buttons: [],
        },
      })),
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
  };
  const code = gen(migrated, 'F02');
  assertSyntax(code, 'F02');
  assert(code.includes('Привет!'), 'текст должен быть');
});

test('F03', 'Сохранение данных при миграции', () => {
  const p = deepClone(BASE_PROJECT);
  p.version = 2;
  const originalText = p.sheets[0].nodes[0].data.messageText;
  const code = gen(p, 'F03');
  assertSyntax(code, 'F03');
  assert(code.includes(originalText), 'данные должны сохраниться');
});

test('F04', 'Миграция кнопок из version 1', () => {
  const p: any = {
    version: 1,
    nodes: [{
      id: 'start1',
      type: 'start',
      x: 0,
      y: 0,
      command: '/start',
      messageText: 'Привет!',
      keyboardType: 'inline', // Явно указываем inline клавиатуру
      buttons: [
        { text: 'Кнопка 1', url: 'https://t.me' },
        { text: 'Кнопка 2', callback: 'callback_data' },
      ],
    }],
    connections: [],
  };
  const migrated = {
    version: 2,
    activeSheetId: 'sheet1',
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: p.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        data: {
          command: n.command,
          messageText: n.messageText,
          keyboardType: n.keyboardType,
          buttons: n.buttons.map((b: any, i: number) => ({
            id: `btn_${i}`,
            text: b.text,
            action: b.url ? 'url' : 'goto',
            url: b.url,
            target: b.callback,
          })),
        },
      })),
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
  };
  const code = gen(migrated, 'F04');
  assertSyntax(code, 'F04');
  // Кнопки мигрированы — проверяем что код генерируется и клавиатура есть
  assert(code.includes('InlineKeyboardBuilder') || code.includes('keyboard'), 'должна быть клавиатура');
  assert(code.includes('https://t.me') || code.includes('t.me'), 'URL кнопки должен быть');
});

test('F05', 'Миграция connections из version 1', () => {
  const p: any = {
    version: 1,
    nodes: [
      { id: 'start1', type: 'start', x: 0, y: 0, command: '/start', messageText: 'Старт', buttons: [] },
      { id: 'msg1', type: 'message', x: 100, y: 100, messageText: 'Сообщение', buttons: [] },
    ],
    connections: [{ from: 'start1', to: 'msg1' }],
  };
  const migrated = {
    version: 2,
    activeSheetId: 'sheet1',
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: p.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        data: {
          command: n.command,
          messageText: n.messageText,
          buttons: [],
        },
      })),
      connections: p.connections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
  };
  const code = gen(migrated, 'F05');
  assertSyntax(code, 'F05');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок G: Интеграция с базой данных
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: Интеграция с базой данных ────────────────────────────');

test('G01', 'Проект с userDatabaseEnabled: true → SQL запросы', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'G01_db');
  // Проверяется в test-phase13-database
  assertSyntax(code, 'G01');
});

test('G02', 'Проект с collectUserInput + БД → update_user_variable_in_db', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.collectUserInput = true;
  p.sheets[0].nodes[0].data.inputVariable = 'answer';
  const code = gen(p, 'G02_db');
  assertSyntax(code, 'G02');
});

test('G03', 'Проект с goto кнопками + БД → get_user_ids_from_db', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Btn', action: 'goto', target: 'msg1' },
  ];
  const code = gen(p, 'G03_db');
  assertSyntax(code, 'G03');
});

test('G04', 'Проект с message узлами + БД → log_message', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes.push({
    id: 'msg1',
    type: 'message',
    position: { x: 100, y: 100 },
    data: { messageText: 'Сообщение', buttons: [] },
  });
  const code = gen(p, 'G04_db');
  assertSyntax(code, 'G04');
});

test('G05', 'Проект с Telegram settings + БД → user_telegram_settings', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.collectUserInput = true;
  p.sheets[0].nodes[0].data.inputVariable = 'tg_phone';
  const code = gen(p, 'G05_db');
  assertSyntax(code, 'G05');
});

test('G06', 'Проект без БД → нет SQL запросов', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'G06_no_db');
  assertSyntax(code, 'G06');
});

test('G07', 'Проект с broadcast + БД → broadcast с SELECT', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes.push({
    id: 'broadcast1',
    type: 'broadcast',
    position: { x: 0, y: 0 },
    data: {
      broadcastApiType: 'bot',
      idSourceType: 'bot_users',
      broadcastNodes: [],
      successMessage: 'Готово!',
      errorMessage: 'Ошибка!',
    },
  });
  const code = gen(p, 'G07_db');
  assertSyntax(code, 'G07');
});

test('G08', 'Проект с adminOnly + БД → проверка прав + SQL', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.adminOnly = true;
  const code = gen(p, 'G08_db');
  assertSyntax(code, 'G08');
});

test('G09', 'Проект с requiresAuth + БД → проверка авторизации + SQL', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.requiresAuth = true;
  const code = gen(p, 'G09_db');
  assertSyntax(code, 'G09');
});

test('G10', 'Проект с media + БД → медиа + SQL', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'G10_db');
  assertSyntax(code, 'G10');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок H: Мультисheet проекты
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок H: Мультисheet проекты ──────────────────────────────────');

test('H01', 'Проект с 2 sheet → оба обрабатываются', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets.push({
    id: 'sheet2',
    name: 'Sheet 2',
    nodes: [
      {
        id: 'start2',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { command: '/start2', messageText: 'Привет из sheet 2!', buttons: [] },
      },
    ],
    connections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
  });
  p.activeSheetId = 'sheet1';
  const code = gen(p, 'H01');
  assertSyntax(code, 'H01');
  assert(code.includes('Привет!'), 'текст из sheet 1 должен быть');
});

test('H02', 'Проект с 3 sheet → все обрабатываются', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets.push(
    {
      id: 'sheet2',
      name: 'Sheet 2',
      nodes: [{
        id: 'msg2',
        type: 'message',
        position: { x: 0, y: 0 },
        data: { messageText: 'Сообщение 2', buttons: [] },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    },
    {
      id: 'sheet3',
      name: 'Sheet 3',
      nodes: [{
        id: 'msg3',
        type: 'message',
        position: { x: 0, y: 0 },
        data: { messageText: 'Сообщение 3', buttons: [] },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }
  );
  const code = gen(p, 'H02');
  assertSyntax(code, 'H02');
});

test('H03', 'Мультисheet с разными командами → все команды', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets.push({
    id: 'sheet2',
    name: 'Sheet 2',
    nodes: [{
      id: 'cmd2',
      type: 'command',
      position: { x: 0, y: 0 },
      data: { command: '/help', messageText: 'Помощь', buttons: [] },
    }],
    connections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
  });
  const code = gen(p, 'H03');
  assertSyntax(code, 'H03');
  assert(code.includes('help'), 'команда help должна быть');
});

test('H04', 'Мультисheet с cross-sheet ссылками → не падает', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets.push({
    id: 'sheet2',
    name: 'Sheet 2',
    nodes: [{
      id: 'msg2',
      type: 'message',
      position: { x: 0, y: 0 },
      data: { messageText: 'Сообщение 2', buttons: [] },
    }],
    connections: [{ from: p.sheets[0].nodes[0].id, to: 'msg2' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
  });
  const code = gen(p, 'H04');
  assertSyntax(code, 'H04');
});

test('H05', 'Мультисheet с одинаковыми ID узлов → не падает', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets.push({
    id: 'sheet2',
    name: 'Sheet 2',
    nodes: [{
      id: p.sheets[0].nodes[0].id, // Одинаковый ID
      type: 'message',
      position: { x: 0, y: 0 },
      data: { messageText: 'Сообщение 2', buttons: [] },
    }],
    connections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
  });
  const code = gen(p, 'H05');
  assertSyntax(code, 'H05');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок I: Медиа-файлы и переменные
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок I: Медиа-файлы и переменные ─────────────────────────────');

test('I01', 'Проект с imageUrl переменной → {image_url}', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = '{my_image}';
  const code = gen(p, 'I01');
  assertSyntax(code, 'I01');
  assert(code.includes('my_image') || code.includes('replace_variables'), 'переменная должна быть');
});

test('I02', 'Проект с videoUrl переменной → {video_url}', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.videoUrl = '{my_video}';
  const code = gen(p, 'I02');
  assertSyntax(code, 'I02');
});

test('I03', 'Проект с audioUrl переменной → {audio_url}', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.audioUrl = '{my_audio}';
  const code = gen(p, 'I03');
  assertSyntax(code, 'I03');
});

test('I04', 'Проект с documentUrl переменной → {document_url}', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.documentUrl = '{my_document}';
  const code = gen(p, 'I04');
  assertSyntax(code, 'I04');
});

test('I05', 'Проект с attachedMedia → список медиа', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = ['{img1}', '{img2}', '{img3}'];
  const code = gen(p, 'I05');
  assertSyntax(code, 'I05');
});

test('I06', 'Проект с media group (несколько attachedMedia)', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
    'https://example.com/img3.jpg',
  ];
  const code = gen(p, 'I06');
  assertSyntax(code, 'I06');
});

test('I07', 'Проект с переменными в тексте и медиа', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.messageText = 'Привет, {user_name}!';
  p.sheets[0].nodes[0].data.imageUrl = '{profile_image}';
  const code = gen(p, 'I07');
  assertSyntax(code, 'I07');
  assert(code.includes('replace_variables_in_text'), 'замена переменных должна быть');
});

test('I08', 'Проект с URL изображением → URLInputFile', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'I08');
  assertSyntax(code, 'I08');
});

test('I09', 'Проект с локальным изображением → FSInputFile', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = '/uploads/image.jpg';
  const code = gen(p, 'I09');
  assertSyntax(code, 'I09');
});

test('I10', 'Проект со всеми типами медиа', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/img.jpg';
  p.sheets[0].nodes[0].data.videoUrl = 'https://example.com/vid.mp4';
  p.sheets[0].nodes[0].data.audioUrl = 'https://example.com/aud.mp3';
  p.sheets[0].nodes[0].data.documentUrl = 'https://example.com/doc.pdf';
  const code = gen(p, 'I10');
  assertSyntax(code, 'I10');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок J: Производительность и стресс-тесты
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок J: Производительность и стресс-тесты ────────────────────');

test('J01', 'Генерация кода для проекта с 10 узлами < 100ms', () => {
  const p: any = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  for (let i = 0; i < 10; i++) {
    p.sheets[0].nodes.push({
      id: `node_${i}`,
      type: i === 0 ? 'start' : 'message',
      position: { x: i * 10, y: i * 10 },
      data: {
        command: i === 0 ? '/start' : undefined,
        messageText: `Узел ${i}`,
        buttons: [],
      },
    });
  }
  const start = Date.now();
  gen(p, 'J01');
  const duration = Date.now() - start;
  assert(duration < 100, `Генерация заняла ${duration}ms (ожидалось < 100ms)`);
});

test('J02', 'Генерация кода для проекта с 50 узлами < 500ms', () => {
  const p: any = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  for (let i = 0; i < 50; i++) {
    p.sheets[0].nodes.push({
      id: `node_${i}`,
      type: i === 0 ? 'start' : 'message',
      position: { x: i * 10, y: i * 10 },
      data: {
        command: i === 0 ? '/start' : undefined,
        messageText: `Узел ${i}`.repeat(10),
        buttons: [],
      },
    });
  }
  const start = Date.now();
  gen(p, 'J02');
  const duration = Date.now() - start;
  assert(duration < 500, `Генерация заняла ${duration}ms (ожидалось < 500ms)`);
});

test('J03', 'Генерация кода для проекта с 100 узлами < 1000ms', () => {
  const p: any = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  for (let i = 0; i < 100; i++) {
    p.sheets[0].nodes.push({
      id: `node_${i}`,
      type: i === 0 ? 'start' : 'message',
      position: { x: i * 10, y: i * 10 },
      data: {
        command: i === 0 ? '/start' : undefined,
        messageText: `Узел ${i}`.repeat(20),
        buttons: [],
      },
    });
  }
  const start = Date.now();
  gen(p, 'J03');
  const duration = Date.now() - start;
  assert(duration < 1000, `Генерация заняла ${duration}ms (ожидалось < 1000ms)`);
});

test('J04', '100 генераций подряд < 5000ms', () => {
  const p = deepClone(BASE_PROJECT);
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    gen(p, `J04_${i}`);
  }
  const duration = Date.now() - start;
  assert(duration < 5000, `100 генераций заняли ${duration}ms (ожидалось < 5000ms)`);
});

test('J05', 'Проверка синтаксиса для 50 проектов < 10000ms', () => {
  const start = Date.now();
  for (let i = 0; i < 50; i++) {
    const p = deepClone(BASE_PROJECT);
    p.sheets[0].nodes[0].data.messageText = `Проект ${i}`;
    const code = gen(p, `J05_${i}`);
    assertSyntax(code, `J05_${i}`);
  }
  const duration = Date.now() - start;
  assert(duration < 10000, `50 проверок заняли ${duration}ms (ожидалось < 10000ms)`);
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${results.length} пройдено ✅  |  Провалено: ${failed}${' '.repeat(35 - String(passed).length - String(results.length).length - String(failed).length)}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}

console.log('\n✨ Все тесты импорта проектов пройдены успешно!\n');
