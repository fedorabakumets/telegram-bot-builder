/**
 * @fileoverview Общие вспомогательные функции для тестов динамических кнопок
 * @module tests/test-phase-dynamic-buttons-helpers
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Тип результата теста */
export type Result = { id: string; name: string; passed: boolean; note: string };

/**
 * Создаёт минимальный project.json с заданными узлами
 * @param nodes - Массив узлов
 */
export function makeProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 */
export function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `DynBtn_${label}`, userDatabaseEnabled: false, enableComments: false });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Исходный код Python
 * @param label - Метка для временного файла
 */
export function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_dynbtn_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try { execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' }); fs.unlinkSync(tmp); return { ok: true }; }
  catch (e: any) { try { fs.unlinkSync(tmp); } catch {} return { ok: false, error: e.stderr?.toString() ?? String(e) }; }
}

/**
 * Регистрирует и выполняет тест, добавляя результат в массив
 * @param results - Массив результатов
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
export function test(results: Result[], id: string, name: string, fn: () => void) {
  try { fn(); results.push({ id, name, passed: true, note: 'OK' }); console.log(`  ✅ ${id}. ${name}`); }
  catch (e: any) { results.push({ id, name, passed: false, note: e.message }); console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`); }
}

/** Бросает ошибку если условие ложно */
export function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/** Проверяет синтаксис Python, бросает ошибку при неудаче */
export function syntax(code: string, label: string) { const r = checkSyntax(code, label); ok(r.ok, `Синтаксическая ошибка:\n${r.error}`); }

/** Проверяет наличие всех подстрок в тексте */
export function assertIncludesAll(text: string, parts: string[], context: string) { for (const p of parts) ok(text.includes(p), `${context}: не найдено "${p}"`); }

/** Проверяет отсутствие подстрок в тексте */
export function assertExcludes(text: string, parts: string[], context: string) { for (const p of parts) ok(!text.includes(p), `${context}: неожиданно найдено "${p}"`); }

/**
 * Создаёт узел типа start
 * @param id - Идентификатор узла
 */
export function makeStartNode(id = 'start1') {
  return { id, type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } };
}

/**
 * Создаёт message-узел с динамическими кнопками
 * @param id - Идентификатор узла
 * @param messageText - Текст сообщения
 * @param dynamicConfig - Переопределение конфигурации динамических кнопок
 */
export function makeDynamicMessageNode(id: string, messageText = 'Выберите проект', dynamicConfig: Record<string, any> = {}) {
  return {
    id, type: 'message', position: { x: 0, y: 0 },
    data: {
      messageText, buttons: [], keyboardType: 'inline', enableDynamicButtons: true,
      dynamicButtons: { sourceVariable: 'projects', arrayPath: 'items', textTemplate: '{name}', callbackTemplate: 'project_{id}', styleMode: 'none', styleField: '', styleTemplate: '', columns: 2, ...dynamicConfig },
      formatMode: 'none', markdown: false,
    },
  };
}

/**
 * Создаёт keyboard-ноду с динамическими кнопками
 * @param id - Идентификатор узла
 * @param dynamicConfig - Переопределение конфигурации динамических кнопок
 * @param data - Дополнительные поля data
 */
export function makeDynamicKeyboardNode(id: string, dynamicConfig: Record<string, any> = {}, data: Record<string, any> = {}) {
  return {
    id, type: 'keyboard', position: { x: 300, y: 0 },
    data: {
      keyboardType: 'inline', buttons: [], enableDynamicButtons: true,
      dynamicButtons: { sourceVariable: 'projects', arrayPath: 'items', textTemplate: '{name}', callbackTemplate: 'project_{id}', styleMode: 'none', styleField: '', styleTemplate: '', columns: 2, ...dynamicConfig },
      oneTimeKeyboard: false, resizeKeyboard: true, ...data,
    },
  };
}

/**
 * Выводит итоговую сводку и завершает процесс с кодом 1 при наличии ошибок
 * @param results - Массив результатов тестов
 * @param label - Метка блоков (например "A–C")
 */
export function printSummaryAndExit(results: Result[], label: string) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  const summary = `  Итог (${label}): ${passed}/${total} пройдено  |  Провалено: ${failed}`;
  console.log(`║${summary}${' '.repeat(Math.max(0, 62 - summary.length))}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  if (failed > 0) {
    console.log('\nПровалившиеся тесты:');
    results.filter(r => !r.passed).forEach(r => { console.log(`  ❌ ${r.id}. ${r.name}`); console.log(`     ${r.note}`); });
    process.exit(1);
  }
}
