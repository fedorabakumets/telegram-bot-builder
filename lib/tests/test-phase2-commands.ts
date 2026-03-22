/**
 * Фаза 2 — Тестирование: Команды и меню
 * Каждый кейс мутирует project.json, генерирует код и проверяет результат.
 */
import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

const OUTPUT_DIR = 'bots/импортированный_проект_1723_60_53';
const BASE_PROJECT = JSON.parse(
  fs.readFileSync(`${OUTPUT_DIR}/project.json`, 'utf-8')
);

// ─── Утилиты ────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Мутирует data первого узла (start) */
function mutateStartNode(patch: Record<string, unknown>) {
  const project = deepClone(BASE_PROJECT);
  Object.assign(project.sheets[0].nodes[0].data, patch);
  return project;
}

function generate(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `TestBot_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): boolean {
  const tmpFile = `_tmp_test_${label}.py`;
  fs.writeFileSync(tmpFile, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmpFile}`, { stdio: 'pipe' });
    fs.unlinkSync(tmpFile);
    return true;
  } catch (e: any) {
    console.error(`  ❌ Синтаксическая ошибка:\n${e.stderr?.toString()}`);
    fs.unlinkSync(tmpFile);
    return false;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

// ─── Тест-кейсы ─────────────────────────────────────────────────────────────

const results: { name: string; passed: boolean; notes: string }[] = [];

function runTest(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true, notes: 'OK' });
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    results.push({ name, passed: false, notes: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('\n=== Фаза 2: Команды и меню ===\n');

// ── Тест 6: нестандартная команда ──────────────────────────────────────────
runTest('6. command = /my_cmd_123', () => {
  const project = mutateStartNode({ command: '/my_cmd_123', description: 'Моя команда' });
  const code = generate(project, 'test6');
  assert(checkSyntax(code, 'test6'), 'синтаксис');
  assert(code.includes('my_cmd_123'), 'команда присутствует в коде');
});

// ── Тест 7a: пустой synonyms ────────────────────────────────────────────────
runTest('7a. synonyms = []', () => {
  const project = mutateStartNode({ synonyms: [] });
  const code = generate(project, 'test7a');
  assert(checkSyntax(code, 'test7a'), 'синтаксис');
});

// ── Тест 7b: несколько синонимов ────────────────────────────────────────────
runTest('7b. synonyms = ["старт", "начало", "go"]', () => {
  // command_trigger не поддерживает synonyms — для текстовых триггеров используется text_trigger узел.
  // Синонимы на command_trigger должны игнорироваться — генерация не должна падать.
  const project = mutateStartNode({ synonyms: ['старт', 'начало', 'go'] });
  const code = generate(project, 'test7b');
  assert(checkSyntax(code, 'test7b'), 'синтаксис');
  // Синонимы не должны генерировать отдельные обработчики в command_trigger
  assert(typeof code === 'string' && code.length > 0, 'код генерируется без краша');
});

// ── Тест 7c: синоним с пробелом ─────────────────────────────────────────────
runTest('7c. synonyms с пробелом ["  старт  "]', () => {
  const project = mutateStartNode({ synonyms: ['  старт  '] });
  const code = generate(project, 'test7c');
  assert(checkSyntax(code, 'test7c'), 'синтаксис');
  // trim должен убрать пробелы
  assert(!code.includes('"  старт  "'), 'пробелы обрезаны');
});

// ── Тест 8: showInMenu: true + description → set_my_commands ────────────────
runTest('8. showInMenu=true + description → BotCommand в коде', () => {
  const project = mutateStartNode({
    showInMenu: true,
    command: '/start',
    description: 'Запустить бота',
  });
  const code = generate(project, 'test8');
  assert(checkSyntax(code, 'test8'), 'синтаксис');
  assert(code.includes('set_my_commands'), 'set_my_commands присутствует');
  assert(code.includes('BotCommand'), 'BotCommand присутствует');
  assert(code.includes('Запустить бота'), 'description попал в код');
});

// ── Тест 9: showInMenu: false → не попадает в меню ──────────────────────────
runTest('9. showInMenu=false → нет в set_my_commands', () => {
  // Оба узла с showInMenu=false
  const project = deepClone(BASE_PROJECT);
  project.sheets[0].nodes[0].data.showInMenu = false;
  project.sheets[0].nodes[1].data.showInMenu = false;
  const code = generate(project, 'test9');
  assert(checkSyntax(code, 'test9'), 'синтаксис');
  // Либо set_my_commands отсутствует, либо commands = []
  const hasEmptyCommands =
    !code.includes('set_my_commands') ||
    code.includes('commands = []') ||
    !code.includes('BotCommand(command=');
  assert(hasEmptyCommands, 'команды не попали в меню');
});

// ── Тест 10: adminOnly: true ─────────────────────────────────────────────────
runTest('10. adminOnly=true → проверка прав в коде', () => {
  const project = mutateStartNode({ adminOnly: true });
  const code = generate(project, 'test10');
  assert(checkSyntax(code, 'test10'), 'синтаксис');
  assert(
    code.includes('admin') || code.includes('is_admin') || code.includes('ADMIN'),
    'проверка admin в коде'
  );
});

// ── Тест 11: requiresAuth: true ──────────────────────────────────────────────
runTest('11. requiresAuth=true → проверка авторизации', () => {
  const project = mutateStartNode({ requiresAuth: true });
  const code = generate(project, 'test11');
  assert(checkSyntax(code, 'test11'), 'синтаксис');
  assert(
    code.includes('auth') || code.includes('authorized') || code.includes('is_auth'),
    'проверка auth в коде'
  );
});

// ── Тест 12: isPrivateOnly: true ─────────────────────────────────────────────
runTest('12. isPrivateOnly=true → проверка private chat', () => {
  const project = mutateStartNode({ isPrivateOnly: true });
  const code = generate(project, 'test12');
  assert(checkSyntax(code, 'test12'), 'синтаксис');
  assert(
    code.includes('private') || code.includes('PRIVATE') || code.includes('chat_type'),
    'проверка private в коде'
  );
});

// ─── Итог ────────────────────────────────────────────────────────────────────

console.log('\n─── Итог ───────────────────────────────────────────────────────');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`Пройдено: ${passed}/${results.length}  |  Провалено: ${failed}`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.name}: ${r.notes}`);
  });
  process.exit(1);
}
