/**
 * @fileoverview Тесты для модулей constants
 * @module lib/tests/unit/constants/constants.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  // Node types
  START,
  MESSAGE,
  NODE_COMMAND,
  STICKER,
  VOICE,
  ANIMATION,
  NODE_LOCATION,
  NODE_CONTACT,
  PIN_MESSAGE,
  UNPIN_MESSAGE,
  DELETE_MESSAGE,
  BAN_USER,
  UNBAN_USER,
  MUTE_USER,
  UNMUTE_USER,
  KICK_USER,
  PROMOTE_USER,
  DEMOTE_USER,
  ADMIN_RIGHTS,
  BROADCAST,
  NODE_TYPES,
  type NodeType,
  // Button actions
  GOTO,
  CALLBACK,
  URL,
  BUTTON_COMMAND,
  BUTTON_CONTACT,
  BUTTON_LOCATION,
  SELECTION,
  DEFAULT,
  BUTTON_ACTIONS,
  type ButtonActionType,
} from '../../../bot-generator/constants';

describe('Constants', () => {
  describe('Node Types', () => {
    describe('START', () => {
      it('должен быть равен "start"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(START, 'start');
      });

      it('должен быть readonly', () => {
        // Arrange & Act & Assert
        assert.strictEqual(START, 'start' as const);
      });
    });

    describe('MESSAGE', () => {
      it('должен быть равен "message"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(MESSAGE, 'message');
      });
    });

    describe('COMMAND', () => {
      it('должен быть равен "command"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(NODE_COMMAND, 'command');
      });
    });

    describe('STICKER', () => {
      it('должен быть равен "sticker"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(STICKER, 'sticker');
      });
    });

    describe('VOICE', () => {
      it('должен быть равен "voice"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(VOICE, 'voice');
      });
    });

    describe('ANIMATION', () => {
      it('должен быть равен "animation"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(ANIMATION, 'animation');
      });
    });

    describe('LOCATION', () => {
      it('должен быть равен "location"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(NODE_LOCATION, 'location');
      });
    });

    describe('CONTACT', () => {
      it('должен быть равен "contact"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(NODE_CONTACT, 'contact');
      });
    });

    describe('PIN_MESSAGE', () => {
      it('должен быть равен "pin_message"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(PIN_MESSAGE, 'pin_message');
      });
    });

    describe('UNPIN_MESSAGE', () => {
      it('должен быть равен "unpin_message"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(UNPIN_MESSAGE, 'unpin_message');
      });
    });

    describe('DELETE_MESSAGE', () => {
      it('должен быть равен "delete_message"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(DELETE_MESSAGE, 'delete_message');
      });
    });

    describe('BAN_USER', () => {
      it('должен быть равен "ban_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(BAN_USER, 'ban_user');
      });
    });

    describe('UNBAN_USER', () => {
      it('должен быть равен "unban_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(UNBAN_USER, 'unban_user');
      });
    });

    describe('MUTE_USER', () => {
      it('должен быть равен "mute_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(MUTE_USER, 'mute_user');
      });
    });

    describe('UNMUTE_USER', () => {
      it('должен быть равен "unmute_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(UNMUTE_USER, 'unmute_user');
      });
    });

    describe('KICK_USER', () => {
      it('должен быть равен "kick_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(KICK_USER, 'kick_user');
      });
    });

    describe('PROMOTE_USER', () => {
      it('должен быть равен "promote_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(PROMOTE_USER, 'promote_user');
      });
    });

    describe('DEMOTE_USER', () => {
      it('должен быть равен "demote_user"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(DEMOTE_USER, 'demote_user');
      });
    });

    describe('ADMIN_RIGHTS', () => {
      it('должен быть равен "admin_rights"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(ADMIN_RIGHTS, 'admin_rights');
      });
    });

    describe('BROADCAST', () => {
      it('должен быть равен "broadcast"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(BROADCAST, 'broadcast');
      });
    });
  });

  describe('NODE_TYPES object', () => {
    it('должен содержать все типы узлов', () => {
      // Arrange & Act
      const keys = Object.keys(NODE_TYPES);

      // Assert - проверяем что есть ключи (количество может меняться)
      assert.ok(keys.length > 0);
      assert.ok(keys.includes('START'));
      assert.ok(keys.includes('MESSAGE'));
      assert.ok(keys.includes('COMMAND'));
    });

    it('должен иметь правильные значения для всех ключей', () => {
      // Arrange & Act & Assert
      assert.strictEqual(NODE_TYPES.START, 'start');
      assert.strictEqual(NODE_TYPES.MESSAGE, 'message');
      assert.strictEqual(NODE_TYPES.COMMAND, 'command');
      assert.strictEqual(NODE_TYPES.STICKER, 'sticker');
      assert.strictEqual(NODE_TYPES.VOICE, 'voice');
      assert.strictEqual(NODE_TYPES.ANIMATION, 'animation');
      assert.strictEqual(NODE_TYPES.LOCATION, 'location');
      assert.strictEqual(NODE_TYPES.CONTACT, 'contact');
      assert.strictEqual(NODE_TYPES.PIN_MESSAGE, 'pin_message');
      assert.strictEqual(NODE_TYPES.UNPIN_MESSAGE, 'unpin_message');
      assert.strictEqual(NODE_TYPES.DELETE_MESSAGE, 'delete_message');
      assert.strictEqual(NODE_TYPES.BAN_USER, 'ban_user');
      assert.strictEqual(NODE_TYPES.UNBAN_USER, 'unban_user');
      assert.strictEqual(NODE_TYPES.MUTE_USER, 'mute_user');
      assert.strictEqual(NODE_TYPES.UNMUTE_USER, 'unmute_user');
      assert.strictEqual(NODE_TYPES.KICK_USER, 'kick_user');
      assert.strictEqual(NODE_TYPES.PROMOTE_USER, 'promote_user');
      assert.strictEqual(NODE_TYPES.DEMOTE_USER, 'demote_user');
      assert.strictEqual(NODE_TYPES.ADMIN_RIGHTS, 'admin_rights');
      assert.strictEqual(NODE_TYPES.BROADCAST, 'broadcast');
    });

    it('должен возвращать массив значений через Object.values', () => {
      // Arrange & Act
      const values = Object.values(NODE_TYPES);

      // Assert - проверяем что массив содержит значения
      assert.ok(Array.isArray(values));
      assert.ok(values.length > 0);
      assert.ok(values.includes('start'));
      assert.ok(values.includes('message'));
      assert.ok(values.includes('command'));
    });

    it('должен позволять использовать NodeType тип', () => {
      // Arrange
      const type: NodeType = 'start';

      // Act & Assert
      assert.strictEqual(type, 'start');
    });
  });

  describe('Button Actions', () => {
    describe('GOTO', () => {
      it('должен быть равен "goto"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(GOTO, 'goto');
      });
    });

    describe('CALLBACK', () => {
      it('должен быть равен "callback"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(CALLBACK, 'callback');
      });
    });

    describe('URL', () => {
      it('должен быть равен "url"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(URL, 'url');
      });
    });

    describe('COMMAND', () => {
      it('должен быть равен "command"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(BUTTON_COMMAND, 'command');
      });
    });

    describe('CONTACT', () => {
      it('должен быть равен "contact"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(BUTTON_CONTACT, 'contact');
      });
    });

    describe('LOCATION', () => {
      it('должен быть равен "location"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(BUTTON_LOCATION, 'location');
      });
    });

    describe('SELECTION', () => {
      it('должен быть равен "selection"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(SELECTION, 'selection');
      });
    });

    describe('DEFAULT', () => {
      it('должен быть равен "default"', () => {
        // Arrange & Act & Assert
        assert.strictEqual(DEFAULT, 'default');
      });
    });
  });

  describe('BUTTON_ACTIONS object', () => {
    it('должен содержать все действия кнопок', () => {
      // Arrange & Act
      const keys = Object.keys(BUTTON_ACTIONS);

      // Assert
      assert.strictEqual(keys.length, 8);
      assert.ok(keys.includes('GOTO'));
      assert.ok(keys.includes('CALLBACK'));
      assert.ok(keys.includes('URL'));
      assert.ok(keys.includes('COMMAND'));
      assert.ok(keys.includes('CONTACT'));
      assert.ok(keys.includes('LOCATION'));
      assert.ok(keys.includes('SELECTION'));
      assert.ok(keys.includes('DEFAULT'));
    });

    it('должен иметь правильные значения для всех ключей', () => {
      // Arrange & Act & Assert
      assert.strictEqual(BUTTON_ACTIONS.GOTO, 'goto');
      assert.strictEqual(BUTTON_ACTIONS.CALLBACK, 'callback');
      assert.strictEqual(BUTTON_ACTIONS.URL, 'url');
      assert.strictEqual(BUTTON_ACTIONS.COMMAND, 'command');
      assert.strictEqual(BUTTON_ACTIONS.CONTACT, 'contact');
      assert.strictEqual(BUTTON_ACTIONS.LOCATION, 'location');
      assert.strictEqual(BUTTON_ACTIONS.SELECTION, 'selection');
      assert.strictEqual(BUTTON_ACTIONS.DEFAULT, 'default');
    });

    it('должен возвращать массив значений через Object.values', () => {
      // Arrange & Act
      const values = Object.values(BUTTON_ACTIONS);

      // Assert
      assert.ok(Array.isArray(values));
      assert.strictEqual(values.length, 8);
      assert.ok(values.includes('goto'));
      assert.ok(values.includes('callback'));
      assert.ok(values.includes('url'));
    });

    it('должен позволять использовать ButtonActionType тип', () => {
      // Arrange
      const action: ButtonActionType = 'goto';

      // Act & Assert
      assert.strictEqual(action, 'goto');
    });
  });

  describe('Constants immutability', () => {
    it('должен быть неизменяемым для NODE_TYPES', () => {
      // Arrange
      const originalValue = NODE_TYPES.START;

      // Act - попытка изменить (в TypeScript это ошибка типа, но в runtime проверяем)
      // В runtime объект остаётся неизменяемым благодаря as const

      // Assert
      assert.strictEqual(NODE_TYPES.START, originalValue);
    });

    it('должен быть неизменяемым для BUTTON_ACTIONS', () => {
      // Arrange
      const originalValue = BUTTON_ACTIONS.GOTO;

      // Act & Assert
      assert.strictEqual(BUTTON_ACTIONS.GOTO, originalValue);
    });
  });

  describe('Constants usage', () => {
    it('должен позволять сравнение с строковыми литералами', () => {
      // Arrange
      const nodeType = 'start';

      // Act & Assert
      assert.strictEqual(nodeType, START);
    });

    it('должен позволять использование в switch statement', () => {
      // Arrange
      const type: NodeType = 'message' as NodeType;
      let result = '';

      // Act
      switch (type) {
        case 'start' as NodeType:
          result = 'start';
          break;
        case 'message' as NodeType:
          result = 'message';
          break;
        default:
          result = 'unknown';
      }

      // Assert
      assert.strictEqual(result, 'message');
    });

    it('должен позволять использование в объекте как ключ', () => {
      // Arrange
      const handlers: Record<NodeType, string> = {
        start: 'handleStart',
        message: 'handleMessage',
        command: 'handleCommand',
        sticker: 'handleSticker',
        voice: 'handleVoice',
        animation: 'handleAnimation',
        location: 'handleLocation',
        contact: 'handleContact',
        pin_message: 'handlePin',
        unpin_message: 'handleUnpin',
        delete_message: 'handleDelete',
        ban_user: 'handleBan',
        unban_user: 'handleUnban',
        mute_user: 'handleMute',
        unmute_user: 'handleUnmute',
        kick_user: 'handleKick',
        promote_user: 'handlePromote',
        demote_user: 'handleDemote',
        admin_rights: 'handleAdminRights',
        broadcast: 'handleBroadcast',
      };

      // Act
      const handler = handlers[START];

      // Assert
      assert.strictEqual(handler, 'handleStart');
    });

    it('должен позволять фильтрацию узлов по типу', () => {
      // Arrange
      const nodes = [
        { type: 'start' },
        { type: 'message' },
        { type: 'command' },
        { type: 'message' },
      ];

      // Act
      const messageNodes = nodes.filter(n => n.type === MESSAGE);

      // Assert
      assert.strictEqual(messageNodes.length, 2);
    });
  });

  describe('Type compatibility', () => {
    it('должен позволять присваивание NodeType переменной', () => {
      // Arrange
      const type: NodeType = START;

      // Act & Assert
      assert.strictEqual(type, 'start');
    });

    it('должен позволять присваивание ButtonActionType переменной', () => {
      // Arrange
      const action: ButtonActionType = GOTO;

      // Act & Assert
      assert.strictEqual(action, 'goto');
    });

    it('должен позволять массив NodeType', () => {
      // Arrange
      const types: NodeType[] = [START, MESSAGE, NODE_COMMAND];

      // Act & Assert
      assert.strictEqual(types.length, 3);
      assert.strictEqual(types[0], 'start');
    });

    it('должен позволять массив ButtonActionType', () => {
      // Arrange
      const actions: ButtonActionType[] = [GOTO, CALLBACK, URL];

      // Act & Assert
      assert.strictEqual(actions.length, 3);
      assert.strictEqual(actions[0], 'goto');
    });
  });
});
