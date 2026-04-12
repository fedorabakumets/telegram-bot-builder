/**
 * @fileoverview Тесты для shared-утилит динамических кнопок
 * @module templates/keyboard/dynamic-buttons.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeDynamicButtonsConfig,
  hasDynamicButtonsConfig,
  shouldUseDynamicButtons,
} from './dynamic-buttons';

describe('normalizeDynamicButtonsConfig()', () => {
  /**
   * null и undefined возвращают null
   */
  it('null → null', () => {
    assert.strictEqual(normalizeDynamicButtonsConfig(null), null);
  });

  it('undefined → null', () => {
    assert.strictEqual(normalizeDynamicButtonsConfig(undefined), null);
  });

  /**
   * Пустой объект — все поля пустые/дефолтные → null
   */
  it('пустой объект → null', () => {
    assert.strictEqual(normalizeDynamicButtonsConfig({}), null);
  });

  /**
   * Полностью заполненный конфиг возвращается нормализованным
   */
  it('все поля заполнены → возвращает конфиг', () => {
    const result = normalizeDynamicButtonsConfig({
      sourceVariable: 'projects',
      arrayPath: 'items',
      textTemplate: '{name}',
      callbackTemplate: 'project_{id}',
      styleMode: 'field',
      styleField: 'status',
      styleTemplate: '',
      columns: 2,
    });
    assert.ok(result !== null);
    assert.strictEqual(result!.sourceVariable, 'projects');
    assert.strictEqual(result!.arrayPath, 'items');
    assert.strictEqual(result!.textTemplate, '{name}');
    assert.strictEqual(result!.callbackTemplate, 'project_{id}');
    assert.strictEqual(result!.styleMode, 'field');
    assert.strictEqual(result!.styleField, 'status');
    assert.strictEqual(result!.columns, 2);
  });

  /**
   * Legacy-поля: variable → sourceVariable, arrayField → arrayPath,
   * textField → textTemplate, callbackField → callbackTemplate
   */
  it('legacy поле variable → sourceVariable', () => {
    const result = normalizeDynamicButtonsConfig({ variable: 'resp' });
    assert.ok(result !== null);
    assert.strictEqual(result!.sourceVariable, 'resp');
  });

  it('legacy поле arrayField → arrayPath', () => {
    const result = normalizeDynamicButtonsConfig({
      sourceVariable: 'resp',
      arrayField: 'data',
    });
    assert.ok(result !== null);
    assert.strictEqual(result!.arrayPath, 'data');
  });

  it('legacy поля textField и callbackField конвертируются', () => {
    const result = normalizeDynamicButtonsConfig({
      variable: 'resp',
      textField: '{title}',
      callbackField: 'cb_{id}',
    });
    assert.ok(result !== null);
    assert.strictEqual(result!.textTemplate, '{title}');
    assert.strictEqual(result!.callbackTemplate, 'cb_{id}');
  });

  /**
   * columns clamp: < 1 → 1, > 6 → 6, дробные → truncate, NaN → default 2
   */
  it('columns < 1 → 1', () => {
    const result = normalizeDynamicButtonsConfig({ sourceVariable: 'x', columns: 0 });
    assert.strictEqual(result!.columns, 1);
  });

  it('columns > 6 → 6', () => {
    const result = normalizeDynamicButtonsConfig({ sourceVariable: 'x', columns: 10 });
    assert.strictEqual(result!.columns, 6);
  });

  it('дробные columns → truncate', () => {
    const result = normalizeDynamicButtonsConfig({ sourceVariable: 'x', columns: 3.9 });
    assert.strictEqual(result!.columns, 3);
  });

  it('NaN columns → default 2', () => {
    const result = normalizeDynamicButtonsConfig({ sourceVariable: 'x', columns: NaN });
    assert.strictEqual(result!.columns, 2);
  });

  /**
   * styleMode: неизвестное значение → 'none'
   */
  it('неизвестный styleMode → none', () => {
    const result = normalizeDynamicButtonsConfig({
      sourceVariable: 'x',
      styleMode: 'rainbow',
    });
    assert.strictEqual(result!.styleMode, 'none');
  });

  /**
   * Пустые строки trimming: пробелы обрезаются, пустая строка → ''
   */
  it('пробелы в строках обрезаются', () => {
    const result = normalizeDynamicButtonsConfig({
      sourceVariable: '  projects  ',
      arrayPath: '  items  ',
    });
    assert.strictEqual(result!.sourceVariable, 'projects');
    assert.strictEqual(result!.arrayPath, 'items');
  });

  /**
   * Частично заполненный конфиг (только sourceVariable) → не null
   */
  it('только sourceVariable → возвращает конфиг (не null)', () => {
    const result = normalizeDynamicButtonsConfig({ sourceVariable: 'resp' });
    assert.ok(result !== null);
    assert.strictEqual(result!.sourceVariable, 'resp');
  });
});

describe('hasDynamicButtonsConfig()', () => {
  /**
   * null → false
   */
  it('null → false', () => {
    assert.strictEqual(hasDynamicButtonsConfig(null), false);
  });

  /**
   * Пустой объект → false
   */
  it('пустой объект → false', () => {
    assert.strictEqual(hasDynamicButtonsConfig({}), false);
  });

  /**
   * Валидный конфиг → true
   */
  it('валидный конфиг → true', () => {
    assert.strictEqual(hasDynamicButtonsConfig({ sourceVariable: 'projects' }), true);
  });
});

describe('shouldUseDynamicButtons()', () => {
  /**
   * enableDynamicButtons: false → false
   */
  it('enableDynamicButtons: false → false', () => {
    assert.strictEqual(
      shouldUseDynamicButtons({ enableDynamicButtons: false }),
      false,
    );
  });

  /**
   * enableDynamicButtons: true + нет dynamicButtons → false (для inline)
   */
  it('enableDynamicButtons: true + нет dynamicButtons → false', () => {
    assert.strictEqual(
      shouldUseDynamicButtons({ enableDynamicButtons: true, keyboardType: 'inline' }),
      false,
    );
  });

  /**
   * enableDynamicButtons: true + валидный dynamicButtons → true
   */
  it('enableDynamicButtons: true + валидный dynamicButtons → true', () => {
    assert.strictEqual(
      shouldUseDynamicButtons({
        enableDynamicButtons: true,
        dynamicButtons: { sourceVariable: 'projects' },
        keyboardType: 'inline',
      }),
      true,
    );
  });

  /**
   * keyboardType: 'reply' + enableDynamicButtons: true → true (reply не требует dynamicButtons)
   */
  it('keyboardType reply + enableDynamicButtons: true → true', () => {
    assert.strictEqual(
      shouldUseDynamicButtons({ enableDynamicButtons: true, keyboardType: 'reply' }),
      true,
    );
  });

  /**
   * null/undefined params → false
   */
  it('null params → false', () => {
    assert.strictEqual(shouldUseDynamicButtons(null), false);
  });

  it('undefined params → false', () => {
    assert.strictEqual(shouldUseDynamicButtons(undefined), false);
  });
});
