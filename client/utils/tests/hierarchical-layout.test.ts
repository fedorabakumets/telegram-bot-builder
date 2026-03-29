/**
 * @fileoverview Тесты для иерархической раскладки canvas-графа.
 *
 * Проверяют, что layout учитывает реальные роли узлов и типы связей:
 * - `condition` остается между source-узлом и ветками;
 * - `keyboard` держится рядом с `message`, а не уезжает в основной поток;
 * - `input`, `media` и `broadcast` остаются в читаемой основной цепочке.
 *
 * @module hierarchical-layout.test
 */

import { describe, expect, it } from 'vitest';
import { createHierarchicalLayout } from '../hierarchical-layout';

/**
 * Минимальная тестовая нода для layout-логики.
 *
 * @param id - Идентификатор узла.
 * @param type - Тип узла.
 * @param data - Данные узла.
 * @returns Тестовая нода.
 */
function makeNode(
  id: string,
  type: string,
  data: Record<string, any> = {},
  x = 0,
  y = 0,
) {
  return {
    id,
    type,
    position: { x, y },
    data,
  } as any;
}

/**
 * Минимальная тестовая связь для layout-логики.
 *
 * @param fromId - ID исходного узла.
 * @param toId - ID целевого узла.
 * @param type - Тип связи.
 * @param buttonId - ID кнопки, если она участвует в связи.
 * @returns Тестовая связь.
 */
function makeConnection(
  fromId: string,
  toId: string,
  type: 'auto-transition' | 'button-goto' | 'input-target' | 'trigger-next' | 'condition-source' | 'keyboard-link',
  buttonId?: string,
) {
  return {
    fromId,
    toId,
    type,
    buttonId,
  } as any;
}

describe('createHierarchicalLayout', () => {
  it('ставит condition между source и ветками', () => {
    const nodes = [
      makeNode('trigger_1', 'command_trigger', {
        autoTransitionTo: 'msg_1',
      }),
      makeNode('msg_1', 'message', {
        messageText: 'Choose',
      }),
      makeNode('cond_1', 'condition', {
        sourceNodeId: 'msg_1',
        branches: [
          { id: 'branch_yes', label: 'Yes', target: 'yes_1' },
          { id: 'branch_no', label: 'No', target: 'no_1' },
        ],
      }),
      makeNode('yes_1', 'message', { messageText: 'Yes path' }),
      makeNode('no_1', 'message', { messageText: 'No path' }),
    ];

    const connections = [
      makeConnection('trigger_1', 'msg_1', 'trigger-next'),
      makeConnection('msg_1', 'cond_1', 'condition-source'),
      makeConnection('cond_1', 'yes_1', 'button-goto', 'branch_yes'),
      makeConnection('cond_1', 'no_1', 'button-goto', 'branch_no'),
    ];

    const laidOut = createHierarchicalLayout(nodes, connections, {
      startX: 20,
      startY: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 60,
      verticalSpacing: 30,
    });

    const getX = (id: string) => laidOut.find(node => node.id === id)!.position.x;
    const getY = (id: string) => laidOut.find(node => node.id === id)!.position.y;

    expect(getX('trigger_1')).toBeLessThan(getX('msg_1'));
    expect(getX('msg_1')).toBeLessThan(getX('cond_1'));
    expect(getX('cond_1')).toBeLessThan(getX('yes_1'));
    expect(getX('cond_1')).toBeLessThan(getX('no_1'));
    expect(Math.abs(getY('trigger_1') - getY('msg_1'))).toBeLessThan(60);
    expect(Math.abs(getY('cond_1') - getY('msg_1'))).toBeLessThan(60);
  });

  it('держит keyboard рядом с message и не разрывает поток', () => {
    const nodes = [
      makeNode('trigger_1', 'command_trigger', {
        autoTransitionTo: 'msg_1',
      }),
      makeNode('msg_1', 'message', {
        messageText: 'Menu',
        keyboardNodeId: 'kbd_1',
      }),
      makeNode('kbd_1', 'keyboard', {
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_1', text: 'Next', action: 'goto', target: 'next_1' },
        ],
      }),
      makeNode('next_1', 'message', {
        messageText: 'Next step',
      }),
    ];

    const connections = [
      makeConnection('trigger_1', 'msg_1', 'trigger-next'),
      makeConnection('msg_1', 'kbd_1', 'keyboard-link'),
      makeConnection('kbd_1', 'next_1', 'button-goto', 'btn_1'),
    ];

    const laidOut = createHierarchicalLayout(nodes, connections, {
      startX: 20,
      startY: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 60,
      verticalSpacing: 30,
    });

    const getPosition = (id: string) => laidOut.find(node => node.id === id)!.position;
    const messagePos = getPosition('msg_1');
    const keyboardPos = getPosition('kbd_1');
    const nextPos = getPosition('next_1');
    const keyboardGap = keyboardPos.x - (messagePos.x + 140);

    expect(keyboardPos.x).toBeGreaterThan(messagePos.x);
    expect(keyboardGap).toBeGreaterThanOrEqual(56);
    expect(Math.abs(keyboardPos.y - messagePos.y)).toBeLessThan(60);
    expect(nextPos.x).toBeGreaterThan(keyboardPos.x);
  });

  it('центрует message по кнопочным веткам, если у него есть keyboard', () => {
    const nodes = [
      makeNode('trigger_1', 'command_trigger', {
        autoTransitionTo: 'msg_1',
      }),
      makeNode('msg_1', 'message', {
        messageText: 'Menu',
        keyboardNodeId: 'kbd_1',
      }),
      makeNode('kbd_1', 'keyboard', {
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_yes', text: 'Yes', action: 'goto', target: 'yes_1' },
          { id: 'btn_no', text: 'No', action: 'goto', target: 'no_1' },
        ],
      }),
      makeNode('yes_1', 'message', {
        messageText: 'Yes branch',
        autoTransitionTo: 'yes_tail_1',
      }),
      makeNode('yes_tail_1', 'message', { messageText: 'Yes tail' }),
      makeNode('no_1', 'message', { messageText: 'No branch' }),
    ];

    const connections = [
      makeConnection('trigger_1', 'msg_1', 'trigger-next'),
      makeConnection('msg_1', 'kbd_1', 'keyboard-link'),
      makeConnection('kbd_1', 'yes_1', 'button-goto', 'btn_yes'),
      makeConnection('kbd_1', 'no_1', 'button-goto', 'btn_no'),
      makeConnection('yes_1', 'yes_tail_1', 'auto-transition'),
    ];

    const laidOut = createHierarchicalLayout(nodes, connections, {
      startX: 20,
      startY: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 60,
      verticalSpacing: 30,
    });

    const getPosition = (id: string) => laidOut.find(node => node.id === id)!.position;
    const messagePos = getPosition('msg_1');
    const yesPos = getPosition('yes_1');
    const noPos = getPosition('no_1');
    const averageButtonsY = (yesPos.y + noPos.y) / 2;

    expect(Math.abs(messagePos.y - averageButtonsY)).toBeLessThan(2);
  });

  it('раскладывает input, media и broadcast как последовательную основную цепочку', () => {
    const nodes = [
      makeNode('trigger_1', 'text_trigger', {
        autoTransitionTo: 'msg_1',
      }),
      makeNode('msg_1', 'message', {
        messageText: 'Enter data',
      }),
      makeNode('input_1', 'input', {
        inputTargetNodeId: 'media_1',
      }),
      makeNode('media_1', 'media', {
        mediaType: 'photo',
      }),
      makeNode('broadcast_1', 'broadcast', {
        messageText: 'Broadcast',
      }),
      makeNode('finish_1', 'message', {
        messageText: 'Finish',
      }),
    ];

    const connections = [
      makeConnection('trigger_1', 'msg_1', 'trigger-next'),
      makeConnection('msg_1', 'input_1', 'auto-transition'),
      makeConnection('input_1', 'media_1', 'input-target'),
      makeConnection('media_1', 'broadcast_1', 'auto-transition'),
      makeConnection('broadcast_1', 'finish_1', 'auto-transition'),
    ];

    const laidOut = createHierarchicalLayout(nodes, connections, {
      startX: 20,
      startY: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 60,
      verticalSpacing: 30,
    });

    const getX = (id: string) => laidOut.find(node => node.id === id)!.position.x;

    expect(getX('trigger_1')).toBeLessThan(getX('msg_1'));
    expect(getX('msg_1')).toBeLessThan(getX('input_1'));
    expect(getX('input_1')).toBeLessThan(getX('media_1'));
    expect(getX('media_1')).toBeLessThan(getX('broadcast_1'));
    expect(getX('broadcast_1')).toBeLessThan(getX('finish_1'));
  });
});
