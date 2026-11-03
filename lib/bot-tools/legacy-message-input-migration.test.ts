/** @fileoverview Регрессия: оставшийся inputTargetNodeId не превращает меню с кнопками в сбор ответа. */
import { describe, expect, it } from 'vitest';
import { hasLegacyMessageInput } from '../../client/components/editor/properties/utils/linked-input-node';
import { migrateLegacyMessageInputToLinkedInputs } from '../../client/components/editor/canvas/canvas/utils/migrate-message-input';
import type { Node } from '@shared/schema';
import { collectNodeTransitions } from './collect-nodes';
import { extractNodesAndConnections } from '../bot-generator/core/extract-nodes-and-connections';
import { collectInputTargetNodes } from '../bot-generator/core/collect-input-target-nodes';

/** Создаёт сообщение-меню с оставшимися настройками выключенного ввода. */
function menu(collectUserInput?: boolean): Node {
  return { id: 'forum_hacking', type: 'message', position: { x: 0, y: 0 }, data: {
    messageText: 'Хакинг', keyboardType: 'inline', buttons: [{ id: 'category', text: 'Категория', action: 'goto', target: 'category' }],
    inputTargetNodeId: 'category', inputVariable: 'old_value', inputType: 'text',
    inputRequired: true, enableTextInput: true, saveToDatabase: true,
    ...(collectUserInput === undefined ? {} : { collectUserInput }),
  } } as Node;
}

describe('Миграция legacy-сбора ответа', () => {
  it.each([false, undefined])('при collectUserInput=%s сохраняет меню и не создаёт ввод', (enabled) => {
    const original = menu(enabled); const before = structuredClone(original);
    expect(hasLegacyMessageInput(original)).toBe(false);
    const migrated = migrateLegacyMessageInputToLinkedInputs([original]);
    expect(migrated).toEqual([before]); expect(original).toEqual(before);
    expect(migrated[0].data.autoTransitionTo).toBeUndefined();
    expect(migrated[0].data.buttons).toEqual(before.data.buttons);
  });
  it('переносит явно включённый ввод один раз, сохраняя переход и клавиатуру', () => {
    const original = menu(true);
    expect(hasLegacyMessageInput(original)).toBe(true);
    const migrated = migrateLegacyMessageInputToLinkedInputs([original]);
    expect(migrated).toHaveLength(2);
    expect(migrated[1].type).toBe('input');
    expect(migrated[1].data.inputTargetNodeId).toBe('category');
    expect(migrated[0].data.autoTransitionTo).toBe(migrated[1].id);
    expect(migrated[0].data.buttons).toEqual(original.data.buttons);
    expect(migrateLegacyMessageInputToLinkedInputs(migrated)).toEqual(migrated);
    expect(original.data.autoTransitionTo).toBeUndefined();
  });
  it('не создаёт фантомные переходы, сохраняя отдельный input и активный legacy', () => {
    const inactive = menu(false);
    const target = { ...menu(false), id: 'category' };
    const active = { ...menu(true), id: 'active' };
    const input = { ...menu(false), id: 'input', type: 'input' } as Node;
    const nodes = [inactive, target, active, input];
    expect(collectNodeTransitions(inactive).some(edge => edge.label === 'inputTargetNodeId')).toBe(false);
    expect(collectNodeTransitions(input)).toContainEqual({ label: 'inputTargetNodeId', target: 'category' });
    expect([...collectInputTargetNodes([inactive] as never)]).toEqual([]);
    expect([...collectInputTargetNodes([active, input] as never)]).toEqual(['category']);
    const extracted = extractNodesAndConnections({ nodes, connections: [
      { id: 'old', source: inactive.id, target: 'category', sourceHandle: 'input-target' },
    ] } as never);
    const inputs = extracted.connections.filter(edge => edge.sourceHandle === 'input-target');
    expect(inputs.map(edge => edge.source).sort()).toEqual(['active', 'input']);
    expect(extracted.connections.some(edge => edge.source === inactive.id && edge.sourceHandle === 'category')).toBe(true);
  });
});
