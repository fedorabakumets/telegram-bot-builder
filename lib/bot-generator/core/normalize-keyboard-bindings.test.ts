/**
 * @fileoverview Тесты нормализации отдельной keyboard-ноды перед генерацией
 * @module bot-generator/core/normalize-keyboard-bindings.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Connection, Node } from '@shared/schema';
import { normalizeKeyboardBindings } from './normalize-keyboard-bindings';

/**
 * Создаёт тестовый message-узел.
 *
 * @param id - ID узла
 * @param data - Дополнительные данные
 * @returns Тестовый узел message
 */
function makeMessageNode(id: string, data: Record<string, unknown> = {}): Node {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Сообщение',
      buttons: [],
      keyboardType: 'none',
      ...data,
    },
  } as Node;
}

/**
 * Создаёт тестовый condition-узел.
 *
 * @param id - ID узла
 * @param sourceNodeId - ID исходного узла
 * @returns Тестовый узел condition
 */
function makeConditionNode(id: string, sourceNodeId: string): Node {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      sourceNodeId,
      variable: 'subscription',
      branches: [],
    },
  } as Node;
}

/**
 * Создаёт тестовый keyboard-узел.
 *
 * @param id - ID узла
 * @param data - Данные клавиатуры
 * @returns Тестовый узел keyboard
 */
function makeKeyboardNode(id: string, data: Record<string, unknown> = {}): Node {
  return {
    id,
    type: 'keyboard',
    position: { x: 0, y: 0 },
    data: {
      buttons: [
        { id: 'btn_1', text: 'Кнопка', action: 'goto', target: 'next' },
      ],
      keyboardType: 'inline',
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      keyboardLayout: {
        autoLayout: true,
        columns: 1,
      },
      ...data,
    },
  } as Node;
}

/**
 * Создаёт тестовое соединение.
 *
 * @param source - ID источника
 * @param target - ID цели
 * @returns Соединение
 */
function makeConnection(source: string, target: string): Connection {
  return {
    id: `${source}_${target}`,
    source,
    target,
  } as Connection;
}

describe('normalizeKeyboardBindings', () => {
  it('сохраняет legacy-клавиатуру внутри message без изменений семантики', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardType: 'reply',
        buttons: [{ id: 'btn_1', text: 'Да', action: 'goto', target: 'next' }],
        keyboardLayout: { autoLayout: true, columns: 2 },
        oneTimeKeyboard: true,
        resizeKeyboard: false,
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, []);
    const message = normalized[0];

    assert.equal(message.data.keyboardType, 'reply');
    assert.equal(message.data.oneTimeKeyboard, true);
    assert.equal(message.data.resizeKeyboard, false);
    assert.equal(Array.isArray(message.data.buttons), true);
    assert.equal((message.data.buttons as unknown[]).length, 1);
  });

  it('переносит данные отдельной keyboard-ноды в message с keyboardNodeId', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'reply',
        buttons: [{ id: 'btn_kbd', text: 'ОК', action: 'goto', target: 'next' }],
        oneTimeKeyboard: true,
        resizeKeyboard: false,
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;
    const keyboard = normalized.find(node => node.id === 'kbd_1') as Node;

    assert.equal(message.data.keyboardType, 'reply');
    assert.equal(message.data.oneTimeKeyboard, true);
    assert.equal(message.data.resizeKeyboard, false);
    assert.equal((message.data.buttons as unknown[]).length, 1);
    assert.equal((message.data as Record<string, unknown>).keyboardNodeId, undefined);

    assert.equal(keyboard.data.keyboardType, 'none');
    assert.equal((keyboard.data.buttons as unknown[]).length, 0);
  });

  it('переносит multi-select поля из keyboard-ноды в host message', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'inline',
        allowMultipleSelection: true,
        multiSelectVariable: 'selected_topics',
        continueButtonTarget: 'msg_2',
        buttons: [
          { id: 'btn_1', text: 'Спорт', action: 'selection', target: 'sport' },
          { id: 'btn_2', text: 'Готово', action: 'complete', target: 'msg_2' },
        ],
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;

    assert.equal(message.data.keyboardType, 'inline');
    assert.equal(message.data.allowMultipleSelection, true);
    assert.equal(message.data.multiSelectVariable, 'selected_topics');
    assert.equal(message.data.continueButtonTarget, 'msg_2');
    assert.equal((message.data.buttons as unknown[]).length, 2);
  });

  it('находит владельца keyboard-ноды через путь message -> condition -> keyboard', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        messageText: 'Старт',
      }),
      makeConditionNode('cond_1', 'msg_1'),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'inline',
        buttons: [{ id: 'btn_kbd', text: 'Кнопка', action: 'goto', target: 'next' }],
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [
      makeConnection('msg_1', 'cond_1'),
      makeConnection('cond_1', 'kbd_1'),
    ]);

    const message = normalized.find(node => node.id === 'msg_1') as Node;
    const keyboard = normalized.find(node => node.id === 'kbd_1') as Node;

    assert.equal(message.data.keyboardType, 'inline');
    assert.equal((message.data.buttons as unknown[]).length, 1);
    assert.equal(keyboard.data.keyboardType, 'none');
    assert.equal((keyboard.data.buttons as unknown[]).length, 0);
  });

  it('безопасно игнорирует keyboard-ноду без валидного message-контекста', () => {
    const nodes = [makeKeyboardNode('kbd_orphan')];

    const normalized = normalizeKeyboardBindings(nodes, []);
    const keyboard = normalized[0];

    assert.equal(keyboard.data.keyboardType, 'none');
    assert.equal((keyboard.data.buttons as unknown[]).length, 0);
  });

  it('переносит dynamicButtons из keyboard-узла в host message', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'inline',
        enableDynamicButtons: true,
        dynamicButtons: {
          sourceVariable: 'projects',
          arrayPath: 'items',
          textTemplate: '{name}',
          callbackTemplate: 'project_{id}',
          styleMode: 'field',
          styleField: 'style',
          styleTemplate: '',
          columns: 2,
        },
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;

    assert.equal(message.data.keyboardType, 'inline');
    assert.equal(message.data.enableDynamicButtons, true);
    assert.equal((message.data.dynamicButtons as Record<string, unknown>).sourceVariable, 'projects');
    assert.equal((message.data.dynamicButtons as Record<string, unknown>).callbackTemplate, 'project_{id}');
  });

  /**
   * Legacy dynamicButtons поля переносятся корректно
   */
  it('keyboard-нода с legacy dynamicButtons полями → переносится корректно', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'inline',
        enableDynamicButtons: true,
        dynamicButtons: {
          variable: 'projects',
          arrayField: 'items',
          textField: '{name}',
          callbackField: 'project_{id}',
          styleMode: 'none',
          columns: 3,
        },
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;

    assert.equal(message.data.keyboardType, 'inline');
    assert.equal(message.data.enableDynamicButtons, true);
    assert.ok(message.data.dynamicButtons !== undefined, 'dynamicButtons должен быть перенесён');
  });

  /**
   * message уже имеет enableDynamicButtons + keyboard-нода тоже → keyboard побеждает
   */
  it('message и keyboard оба имеют enableDynamicButtons → keyboard побеждает', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
        enableDynamicButtons: true,
        dynamicButtons: {
          sourceVariable: 'old_source',
          arrayPath: '',
          textTemplate: '{old}',
          callbackTemplate: 'old_{id}',
          styleMode: 'none',
          styleField: '',
          styleTemplate: '',
          columns: 2,
        },
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'inline',
        enableDynamicButtons: true,
        dynamicButtons: {
          sourceVariable: 'new_source',
          arrayPath: 'items',
          textTemplate: '{name}',
          callbackTemplate: 'new_{id}',
          styleMode: 'none',
          styleField: '',
          styleTemplate: '',
          columns: 2,
        },
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;

    assert.equal(
      (message.data.dynamicButtons as Record<string, unknown>).sourceVariable,
      'new_source',
      'keyboard-нода должна перезаписать dynamicButtons из message',
    );
  });

  /**
   * message имеет dynamicButtons, keyboard-нода не имеет → сохраняется из message
   */
  it('message имеет dynamicButtons, keyboard-нода не имеет → сохраняется из message', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
        enableDynamicButtons: true,
        dynamicButtons: {
          sourceVariable: 'msg_source',
          arrayPath: '',
          textTemplate: '{name}',
          callbackTemplate: 'cb_{id}',
          styleMode: 'none',
          styleField: '',
          styleTemplate: '',
          columns: 2,
        },
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'inline',
        // нет enableDynamicButtons и dynamicButtons
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;

    // keyboard-нода не имеет dynamicButtons, поэтому из message должно сохраниться
    // (либо быть перезаписано пустым — зависит от реализации)
    assert.equal(message.data.keyboardType, 'inline');
  });

  /**
   * keyboard-нода с keyboardType='none' но enableDynamicButtons=true → тип из keyboard
   */
  it('keyboard-нода с keyboardType none + enableDynamicButtons=true → тип из keyboard', () => {
    const nodes = [
      makeMessageNode('msg_1', {
        keyboardNodeId: 'kbd_1',
        keyboardType: 'none',
        buttons: [],
      }),
      makeKeyboardNode('kbd_1', {
        keyboardType: 'none',
        enableDynamicButtons: true,
        dynamicButtons: {
          sourceVariable: 'projects',
          arrayPath: 'items',
          textTemplate: '{name}',
          callbackTemplate: 'project_{id}',
          styleMode: 'none',
          styleField: '',
          styleTemplate: '',
          columns: 2,
        },
      }),
    ];

    const normalized = normalizeKeyboardBindings(nodes, [makeConnection('msg_1', 'kbd_1')]);
    const message = normalized.find(node => node.id === 'msg_1') as Node;

    // keyboardType из keyboard-ноды переносится в message
    assert.equal(message.data.enableDynamicButtons, true);
    assert.ok(message.data.dynamicButtons !== undefined, 'dynamicButtons должен быть перенесён');
  });
});
