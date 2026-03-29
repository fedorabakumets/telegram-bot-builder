import { describe, expect, it } from 'vitest';
import { migrateMessageKeyboardsToNodes } from '../canvas/utils/migrate-message-keyboards';

describe('migrateMessageKeyboardsToNodes', () => {
  it('переносит встроенные кнопки message в отдельную keyboard-ноду', () => {
    const nodes = [
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 120, y: 240 },
        data: {
          messageText: 'Выберите пункт',
          keyboardType: 'reply',
          buttons: [
            { id: 'btn_1', text: 'Да', action: 'goto', target: 'msg_2', skipDataCollection: false, hideAfterClick: false },
          ],
          keyboardLayout: { autoLayout: true, columns: 2, rows: [] },
          resizeKeyboard: false,
          oneTimeKeyboard: true,
          allowMultipleSelection: true,
          multiSelectVariable: 'choices',
        },
      },
      {
        id: 'msg_2',
        type: 'message',
        position: { x: 600, y: 240 },
        data: { messageText: 'Следующий шаг', keyboardType: 'none', buttons: [] },
      },
    ] as any;

    const migrated = migrateMessageKeyboardsToNodes(nodes);
    expect(migrated).toHaveLength(3);

    const messageNode = migrated.find((node) => node.id === 'msg_1')!;
    const keyboardNode = migrated.find((node) => node.type === 'keyboard')!;

    expect((messageNode.data as any).keyboardNodeId).toBe(keyboardNode.id);
    expect((messageNode.data as any).keyboardType).toBe('none');
    expect((messageNode.data as any).buttons).toEqual([]);
    expect((messageNode.data as any).keyboardLayout).toBeUndefined();

    expect((keyboardNode.data as any).keyboardType).toBe('reply');
    expect((keyboardNode.data as any).buttons).toHaveLength(1);
    expect((keyboardNode.data as any).resizeKeyboard).toBe(false);
    expect((keyboardNode.data as any).oneTimeKeyboard).toBe(true);
    expect((keyboardNode.data as any).allowMultipleSelection).toBe(true);
    expect((keyboardNode.data as any).multiSelectVariable).toBe('choices');
    expect(keyboardNode.position).toEqual({ x: 480, y: 240 });
  });

  it('не создает duplicate keyboard-ноду, если linked keyboard уже существует', () => {
    const nodes = [
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Меню',
          keyboardType: 'inline',
          buttons: [{ id: 'btn_1', text: 'Открыть', action: 'goto', target: 'msg_2' }],
          keyboardNodeId: 'kbd_1',
        },
      },
      {
        id: 'kbd_1',
        type: 'keyboard',
        position: { x: 360, y: 0 },
        data: {
          keyboardType: 'inline',
          buttons: [{ id: 'btn_1', text: 'Открыть', action: 'goto', target: 'msg_2' }],
        },
      },
    ] as any;

    const migrated = migrateMessageKeyboardsToNodes(nodes);
    expect(migrated).toHaveLength(2);
    expect(migrated.filter((node) => node.type === 'keyboard')).toHaveLength(1);
  });
});
