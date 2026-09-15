/**
 * @fileoverview Фазовые тесты узла get_star_balance (phase85)
 */

import fs from 'fs';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Минимальный project.json
 * @param nodes - Узлы
 * @returns Проект
 */
function makeCleanProject(nodes: unknown[]) {
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

/**
 * Генерация во временный файл
 * @param nodes - Узлы
 * @returns Путь
 */
function generateToFile(nodes: unknown[]): string {
  const code = generatePythonCode(makeCleanProject(nodes) as any);
  const path = `lib/tests/_tmp_phase85_${Date.now()}.py`;
  fs.writeFileSync(path, code, 'utf8');
  return path;
}

/**
 * Читает и удаляет файл
 * @param path - Путь
 * @returns Код
 */
function readAndCleanup(path: string): string {
  const code = fs.readFileSync(path, 'utf8');
  fs.unlinkSync(path);
  return code;
}

let passed = 0;
let failed = 0;

/**
 * Проверка
 * @param name - Имя
 * @param cond - Условие
 */
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

console.log('\n=== Phase 85: get_star_balance ===\n');

console.log('A: get_my_star_balance + save + success transition');
{
  const path = generateToFile([
    {
      id: 'cmd',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: { command: '/balance', autoTransitionTo: 'bal1' },
    },
    {
      id: 'bal1',
      type: 'get_star_balance',
      position: { x: 200, y: 0 },
      data: {
        saveStarBalanceTo: 'star_balance',
        autoTransitionTo: 'msg_ok',
        enableAutoTransition: true,
      },
    },
    {
      id: 'msg_ok',
      type: 'message',
      position: { x: 400, y: 0 },
      data: { messageText: 'Баланс: {star_balance}', keyboardType: 'none', buttons: [] },
    },
  ]);
  const code = readAndCleanup(path);
  check('есть get_my_star_balance', code.includes('get_my_star_balance'));
  check('пишет в star_balance', code.includes('star_balance'));
  check('переход на msg_ok', code.includes('handle_callback_msg_ok'));
  check('handler bal1', code.includes('handle_callback_bal1'));
}

console.log('\nB: ветка ошибки balanceErrorTarget');
{
  const path = generateToFile([
    {
      id: 'bal_err',
      type: 'get_star_balance',
      position: { x: 0, y: 0 },
      data: {
        saveStarBalanceTo: 'my_bal',
        balanceErrorTarget: 'msg_err',
        balanceMsgError: 'fail',
      },
    },
    {
      id: 'msg_err',
      type: 'message',
      position: { x: 200, y: 0 },
      data: { messageText: 'err', keyboardType: 'none', buttons: [] },
    },
  ]);
  const code = readAndCleanup(path);
  check('есть my_bal', code.includes('my_bal'));
  check('переход на msg_err', code.includes('handle_callback_msg_err'));
}

console.log('\nC: без узла — нет кода баланса');
{
  const path = generateToFile([
    {
      id: 'msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: { messageText: 'hi', keyboardType: 'none', buttons: [] },
    },
  ]);
  const code = readAndCleanup(path);
  check('нет get_my_star_balance', !code.includes('get_my_star_balance'));
}

console.log(`\n=== Итого: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
