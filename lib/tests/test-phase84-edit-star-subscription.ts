/**
 * @fileoverview Фазовые тесты узла edit_star_subscription (phase84)
 */

import fs from 'fs';
import { execSync } from 'child_process';
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
  const path = `lib/tests/_tmp_phase84_${Date.now()}.py`;
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

console.log('\n=== Phase 84: edit_star_subscription ===\n');

console.log('A: cancel → is_canceled=True');
{
  const path = generateToFile([
    {
      id: 'cmd',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: { command: '/cancel_sub', autoTransitionTo: 'edit1' },
    },
    {
      id: 'edit1',
      type: 'edit_star_subscription',
      position: { x: 200, y: 0 },
      data: {
        subscriptionUserSource: 'current_user',
        subscriptionChargeId: '{payment_charge_id}',
        subscriptionAction: 'cancel',
        autoTransitionTo: 'msg_ok',
        enableAutoTransition: true,
      },
    },
    {
      id: 'msg_ok',
      type: 'message',
      position: { x: 400, y: 0 },
      data: { messageText: 'ok', keyboardType: 'none', buttons: [] },
    },
  ]);
  const code = readAndCleanup(path);
  check('есть edit_user_star_subscription', code.includes('edit_user_star_subscription'));
  check('is_canceled=True', code.includes('is_canceled=True'));
  check('подстановка charge', code.includes('payment_charge_id') || code.includes('replace_variables'));
  check('переход на msg_ok', code.includes('handle_callback_msg_ok'));
}

console.log('\nB: enable → is_canceled=False');
{
  const path = generateToFile([
    {
      id: 'edit_en',
      type: 'edit_star_subscription',
      position: { x: 0, y: 0 },
      data: {
        subscriptionChargeId: 'abc',
        subscriptionAction: 'enable',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('is_canceled=False', code.includes('is_canceled=False'));
}

console.log('\nC: пустой код → ветка empty');
{
  const path = generateToFile([
    {
      id: 'edit_e',
      type: 'edit_star_subscription',
      position: { x: 0, y: 0 },
      data: {
        subscriptionChargeId: '',
        subscriptionEmptyTarget: 'msg_empty',
        subscriptionAction: 'cancel',
      },
    },
    {
      id: 'msg_empty',
      type: 'message',
      position: { x: 200, y: 0 },
      data: { messageText: 'empty', keyboardType: 'none', buttons: [] },
    },
  ]);
  const code = readAndCleanup(path);
  check('вызов handle_callback_msg_empty', code.includes('handle_callback_msg_empty'));
}

console.log('\nD: py_compile');
{
  const path = generateToFile([
    {
      id: 'edit1',
      type: 'edit_star_subscription',
      position: { x: 0, y: 0 },
      data: {
        subscriptionChargeId: '{payment_charge_id}',
        subscriptionAction: 'cancel',
        subscriptionErrorTarget: 'msg_err',
        autoTransitionTo: 'msg_ok',
        enableAutoTransition: true,
      },
    },
    {
      id: 'msg_ok',
      type: 'message',
      position: { x: 200, y: 0 },
      data: { messageText: 'ok', keyboardType: 'none', buttons: [] },
    },
    {
      id: 'msg_err',
      type: 'message',
      position: { x: 200, y: 100 },
      data: { messageText: 'err', keyboardType: 'none', buttons: [] },
    },
  ]);
  try {
    execSync(`python -m py_compile "${path}"`, { stdio: 'pipe' });
    check('py_compile OK', true);
  } catch {
    check('py_compile OK', false);
  }
  readAndCleanup(path);
}

console.log(`\n=== Итого: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
