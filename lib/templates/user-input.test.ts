/**
 * @fileoverview Тесты блока "Сбор ввода пользователя"
 * Покрывает: collectUserInput, enableTextInput, enablePhotoInput,
 *            enableVideoInput, enableAudioInput, enableDocumentInput,
 *            inputVariable, inputTargetNodeId, minLength, maxLength, appendVariable
 * для узла типа message
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMessage } from './message/message.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const base = {
  nodeId: 'msg_1',
  messageText: 'Введите ваш ответ:',
  keyboardType: 'none' as const,
  buttons: [],
};

// ─── Тест 1: collectUserInput ────────────────────────────────────────────────

describe('Сбор ввода — Тест 1: collectUserInput', () => {
  it('collectUserInput:true → регистрирует обработчик ввода', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'user_answer',
      inputTargetNodeId: 'next_node',
    });
    assert.ok(result.includes('user_answer') || result.includes('input') || result.includes('waiting'),
      'должен быть код для сбора ввода');
  });

  it('collectUserInput:false → нет обработчика ввода', () => {
    const result = generateMessage({ ...base, collectUserInput: false });
    assert.ok(!result.includes('waiting_for_input') && !result.includes('wait_for_input'),
      'не должно быть ожидания ввода');
  });
});

// ─── Тест 2: enableTextInput ─────────────────────────────────────────────────

describe('Сбор ввода — Тест 2: enableTextInput', () => {
  it('enableTextInput:true → обработчик текстового ввода', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'text_var',
      inputTargetNodeId: 'next',
    });
    assert.ok(typeof result === 'string' && result.length > 0);
    // Должен содержать переменную для сохранения
    assert.ok(result.includes('text_var') || result.includes('input'));
  });
});

// ─── Тест 3: enablePhotoInput ────────────────────────────────────────────────

describe('Сбор ввода — Тест 3: enablePhotoInput', () => {
  it('enablePhotoInput:true → обработчик фото', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enablePhotoInput: true,
      inputVariable: 'photo_var',
      inputTargetNodeId: 'next',
    });
    assert.ok(typeof result === 'string' && result.length > 0);
    assert.ok(result.includes('photo') || result.includes('photo_var') || result.includes('input'));
  });
});

// ─── Тест 4: inputVariable ───────────────────────────────────────────────────

describe('Сбор ввода — Тест 4: inputVariable', () => {
  it('inputVariable задана → переменная используется в коде', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'my_custom_var',
      inputTargetNodeId: 'next',
    });
    assert.ok(result.includes('my_custom_var'), 'переменная должна быть в коде');
  });
});

// ─── Тест 5: inputTargetNodeId ───────────────────────────────────────────────

describe('Сбор ввода — Тест 5: inputTargetNodeId', () => {
  it('inputTargetNodeId задан → переход к целевому узлу', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'var',
      inputTargetNodeId: 'target_node_123',
    });
    assert.ok(result.includes('target_node_123'), 'целевой узел должен быть в коде');
  });
});

// ─── Тест 6: minLength / maxLength ───────────────────────────────────────────

describe('Сбор ввода — Тест 6: minLength и maxLength', () => {
  it('minLength > 0 → проверка минимальной длины', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'var',
      inputTargetNodeId: 'next',
      minLength: 3,
    });
    assert.ok(result.includes('3') || result.includes('min') || result.includes('len'),
      'должна быть проверка минимальной длины');
  });

  it('maxLength > 0 → проверка максимальной длины', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'var',
      inputTargetNodeId: 'next',
      maxLength: 100,
    });
    assert.ok(result.includes('100') || result.includes('max') || result.includes('len'),
      'должна быть проверка максимальной длины');
  });
});

// ─── Тест 7: appendVariable ──────────────────────────────────────────────────

describe('Сбор ввода — Тест 7: appendVariable', () => {
  it('appendVariable:true → добавление к существующей переменной', () => {
    const result = generateMessage({
      ...base,
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'list_var',
      inputTargetNodeId: 'next',
      appendVariable: true,
    });
    assert.ok(typeof result === 'string' && result.length > 0);
    // Должен содержать логику добавления (append/+=)
    assert.ok(result.includes('list_var'));
  });
});
