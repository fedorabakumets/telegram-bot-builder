/**
 * @fileoverview Тесты для клиентских UI-утилит динамических кнопок
 * @module client/components/editor/properties/utils/dynamic-buttons.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeDynamicButtonsConfig,
  getDynamicButtonsSummary,
  buildDynamicButtonsPreviewItems,
} from './dynamic-buttons';

describe('normalizeDynamicButtonsConfig() (клиентская версия)', () => {
  /**
   * Legacy-поля конвертируются в новые имена
   */
  it('legacy поля конвертируются', () => {
    const result = normalizeDynamicButtonsConfig({
      variable: 'resp',
      arrayField: 'data',
      textField: '{title}',
      callbackField: 'cb_{id}',
    });
    assert.strictEqual(result.sourceVariable, 'resp');
    assert.strictEqual(result.arrayPath, 'data');
    assert.strictEqual(result.textTemplate, '{title}');
    assert.strictEqual(result.callbackTemplate, 'cb_{id}');
  });

  /**
   * columns clamp: 0 → 2 (дефолт, т.к. 0 falsy), > 6 → 6
   */
  it('columns = 0 → 2 (дефолт)', () => {
    const result = normalizeDynamicButtonsConfig({ columns: 0 });
    assert.strictEqual(result.columns, 2);
  });

  it('columns > 6 → 6', () => {
    const result = normalizeDynamicButtonsConfig({ columns: 99 });
    assert.strictEqual(result.columns, 6);
  });

  /**
   * styleMode: неизвестное значение → 'none'
   */
  it('неизвестный styleMode → none', () => {
    const result = normalizeDynamicButtonsConfig({ styleMode: 'rainbow' as never });
    assert.strictEqual(result.styleMode, 'none');
  });

  it('styleMode field и template сохраняются', () => {
    assert.strictEqual(normalizeDynamicButtonsConfig({ styleMode: 'field' }).styleMode, 'field');
    assert.strictEqual(normalizeDynamicButtonsConfig({ styleMode: 'template' }).styleMode, 'template');
  });
});

describe('getDynamicButtonsSummary()', () => {
  /**
   * Базовый вывод с arrayPath
   */
  it('базовый вывод: sourceVariable.arrayPath | text | callback | style', () => {
    const result = getDynamicButtonsSummary({
      sourceVariable: 'projects',
      arrayPath: 'items',
      textTemplate: '{name}',
      callbackTemplate: 'project_{id}',
      styleMode: 'none',
      styleField: '',
      styleTemplate: '',
      columns: 2,
    });
    assert.ok(result.includes('projects.items'), `Ожидался "projects.items", получено: ${result}`);
    assert.ok(result.includes('text: {name}'));
    assert.ok(result.includes('callback: project_{id}'));
    assert.ok(result.includes('style: none'));
  });

  /**
   * Без arrayPath: только sourceVariable
   */
  it('без arrayPath: только sourceVariable', () => {
    const result = getDynamicButtonsSummary({
      sourceVariable: 'projects',
      arrayPath: '',
      textTemplate: '{name}',
      callbackTemplate: 'project_{id}',
      styleMode: 'none',
      styleField: '',
      styleTemplate: '',
      columns: 2,
    });
    assert.ok(result.startsWith('projects |'), `Ожидался "projects |", получено: ${result}`);
  });

  /**
   * styleMode='field' → style: <fieldName>
   */
  it('styleMode field → style: status', () => {
    const result = getDynamicButtonsSummary({
      sourceVariable: 'x',
      arrayPath: '',
      textTemplate: '{name}',
      callbackTemplate: 'cb_{id}',
      styleMode: 'field',
      styleField: 'status',
      styleTemplate: '',
      columns: 2,
    });
    assert.ok(result.includes('style: status'), `Ожидался "style: status", получено: ${result}`);
  });

  /**
   * styleMode='template' → style: <template>
   */
  it('styleMode template → style: {status}', () => {
    const result = getDynamicButtonsSummary({
      sourceVariable: 'x',
      arrayPath: '',
      textTemplate: '{name}',
      callbackTemplate: 'cb_{id}',
      styleMode: 'template',
      styleField: '',
      styleTemplate: '{status}',
      columns: 2,
    });
    assert.ok(result.includes('style: {status}'), `Ожидался "style: {status}", получено: ${result}`);
  });

  /**
   * Пустой конфиг: дефолтные значения
   */
  it('пустой конфиг → дефолтные значения', () => {
    const result = getDynamicButtonsSummary(null);
    assert.ok(result.includes('response'), 'Должен содержать дефолтный source "response"');
    assert.ok(result.includes('text: {name}'));
    assert.ok(result.includes('style: none'));
  });
});

describe('buildDynamicButtonsPreviewItems()', () => {
  /**
   * Возвращает массив items
   */
  it('возвращает массив', () => {
    const items = buildDynamicButtonsPreviewItems({ sourceVariable: 'x', columns: 2 });
    assert.ok(Array.isArray(items));
  });

  /**
   * columns=1 → 2 items (минимум max(2, 1*2)=2)
   */
  it('columns=1 → 2 items', () => {
    const items = buildDynamicButtonsPreviewItems({ columns: 1 });
    assert.strictEqual(items.length, 2);
  });

  /**
   * columns=3 → 6 items (3*2=6)
   */
  it('columns=3 → 6 items', () => {
    const items = buildDynamicButtonsPreviewItems({ columns: 3 });
    assert.strictEqual(items.length, 6);
  });

  /**
   * Каждый item имеет: id, text, customCallbackData, action='default'
   */
  it('каждый item имеет обязательные поля', () => {
    const items = buildDynamicButtonsPreviewItems({ columns: 2 });
    for (const item of items) {
      assert.ok(typeof item.id === 'string');
      assert.ok(typeof item.text === 'string');
      assert.ok(typeof item.customCallbackData === 'string');
      assert.strictEqual(item.action, 'default');
    }
  });

  /**
   * Шаблон {name} рендерится в "Project 1", "Project 2"
   */
  it('шаблон {name} → "Project 1", "Project 2"', () => {
    const items = buildDynamicButtonsPreviewItems({
      textTemplate: '{name}',
      callbackTemplate: 'cb_{id}',
      columns: 2,
    });
    assert.strictEqual(items[0].text, 'Project 1');
    assert.strictEqual(items[1].text, 'Project 2');
  });

  /**
   * Шаблон project_{id} рендерится в "project_100", "project_101" (index 0-based)
   */
  it('шаблон project_{id} → "project_100", "project_101"', () => {
    const items = buildDynamicButtonsPreviewItems({
      textTemplate: '{name}',
      callbackTemplate: 'project_{id}',
      columns: 2,
    });
    assert.strictEqual(items[0].customCallbackData, 'project_100');
    assert.strictEqual(items[1].customCallbackData, 'project_101');
  });

  /**
   * styleMode='field' → items имеют style (success/danger чередование)
   */
  it('styleMode field → items имеют style', () => {
    const items = buildDynamicButtonsPreviewItems({
      columns: 2,
      styleMode: 'field',
      styleField: 'status',
    });
    assert.ok(items[0].style !== undefined, 'Первый item должен иметь style');
    assert.ok(items[1].style !== undefined, 'Второй item должен иметь style');
  });

  /**
   * styleMode='none' → items не имеют style
   */
  it('styleMode none → items без style', () => {
    const items = buildDynamicButtonsPreviewItems({
      columns: 2,
      styleMode: 'none',
    });
    for (const item of items) {
      assert.strictEqual(item.style, undefined);
    }
  });
});
