/**
 * @fileoverview Фаза 24 — Типы, результаты и хелперы тестирования set_variable
 * @module tests/test-phase24-set-variable-helpers
 *
 * Содержит: тип R, массив results, хелперы test/ok/checkSyntax/syntax/gen/makeCleanProject.
 * Фабрики узлов вынесены в test-phase24-set-variable-factories.ts.
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Результат одного тестового кейса. */
export type R = {
  /** Идентификатор теста (A01, B02 и т. д.). */
  id: string;
  /** Человекочитаемое название сценария. */
  name: string;
  /** Признак успешного прохождения. */
  passed: boolean;
  /** Короткая заметка о результате или тексте ошибки. */
  note: string;
};

/** Глобальный массив результатов всех тестов фазы. */
export const results: R[] = [];

/**
 * Выполняет один тестовый сценарий и записывает результат.
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
export function test(id: string, name: string, fn: () => void) {
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
 * Бросает ошибку, если условие ложно.
 * @param cond - Условие для проверки
 * @param msg - Сообщение об ошибке
 */
export function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис Python-кода через py_compile.
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Объект с флагом ok и опциональной ошибкой
 */
export function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p24sv_${label}.py`;
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

/**
 * Проверяет синтаксис и бросает ошибку при неудаче.
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
export function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

/**
 * Генерирует Python-код без пользовательской БД.
 * @param project - Объект проекта
 * @param label - Метка для логирования
 * @returns Сгенерированный Python-код
 */
export function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase24_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Создаёт чистый проект с одним листом и переданным набором узлов.
 * @param nodes - Массив узлов холста
 * @returns Объект проекта
 */
export function makeCleanProject(nodes: any[]) {
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
