/**
 * @fileoverview Unit-тесты для констант генератора
 * 
 * Модуль тестирует константы типов узлов и действий кнопок.
 * Проверяет наличие всех типов и их значения.
 * 
 * @module tests/unit/constants.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  NODE_TYPES,
  START,
  MESSAGE,
  COMMAND,
  STICKER,
  VOICE,
  ANIMATION,
  LOCATION,
  CONTACT,
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
  type NodeType
} from '../../bot-generator/constants/node-types';
import {
  BUTTON_ACTIONS,
  GOTO,
  CALLBACK,
  URL,
  COMMAND as BUTTON_COMMAND,
  CONTACT as BUTTON_CONTACT,
  LOCATION as BUTTON_LOCATION,
  SELECTION,
  DEFAULT,
  type ButtonActionType
} from '../../bot-generator/constants/button-actions';

/**
 * Тестирование констант типов узлов
 */
describe('NODE_TYPES', () => {
  /**
   * Тест: все типы узлов должны быть определены
   */
  it('должен содержать все типы узлов', () => {
    const expectedTypes = [
      'START', 'MESSAGE', 'COMMAND', 'STICKER', 'VOICE',
      'ANIMATION', 'LOCATION', 'CONTACT', 'PIN_MESSAGE',
      'UNPIN_MESSAGE', 'DELETE_MESSAGE', 'BAN_USER', 'UNBAN_USER',
      'MUTE_USER', 'UNMUTE_USER', 'KICK_USER', 'PROMOTE_USER',
      'DEMOTE_USER', 'ADMIN_RIGHTS', 'BROADCAST'
    ];

    expectedTypes.forEach(type => {
      assert.ok(NODE_TYPES[type as keyof typeof NODE_TYPES], `${type} должен быть определен`);
    });
  });

  /**
   * Тест: значения констант должны соответствовать именам
   */
  it('должен иметь правильные значения констант', () => {
    assert.strictEqual(START, 'start');
    assert.strictEqual(MESSAGE, 'message');
    assert.strictEqual(COMMAND, 'command');
    assert.strictEqual(STICKER, 'sticker');
    assert.strictEqual(VOICE, 'voice');
    assert.strictEqual(ANIMATION, 'animation');
    assert.strictEqual(LOCATION, 'location');
    assert.strictEqual(CONTACT, 'contact');
    assert.strictEqual(PIN_MESSAGE, 'pin_message');
    assert.strictEqual(UNPIN_MESSAGE, 'unpin_message');
    assert.strictEqual(DELETE_MESSAGE, 'delete_message');
    assert.strictEqual(BAN_USER, 'ban_user');
    assert.strictEqual(UNBAN_USER, 'unban_user');
    assert.strictEqual(MUTE_USER, 'mute_user');
    assert.strictEqual(UNMUTE_USER, 'unmute_user');
    assert.strictEqual(KICK_USER, 'kick_user');
    assert.strictEqual(PROMOTE_USER, 'promote_user');
    assert.strictEqual(DEMOTE_USER, 'demote_user');
    assert.strictEqual(ADMIN_RIGHTS, 'admin_rights');
    assert.strictEqual(BROADCAST, 'broadcast');
  });

  /**
   * Тест: тип NodeType должен включать все значения
   */
  it('должен иметь правильный тип NodeType', () => {
    const validTypes: NodeType[] = [
      'start', 'message', 'command', 'sticker', 'voice',
      'animation', 'location', 'contact', 'pin_message',
      'unpin_message', 'delete_message', 'ban_user', 'unban_user',
      'mute_user', 'unmute_user', 'kick_user', 'promote_user',
      'demote_user', 'admin_rights', 'broadcast'
    ];

    validTypes.forEach(type => {
      assert.ok(Object.values(NODE_TYPES).includes(type), `${type} должен быть валидным NodeType`);
    });
  });

  /**
   * Тест: количество типов узлов
   */
  it('должен содержать правильное количество типов', () => {
    const count = Object.keys(NODE_TYPES).length;
    assert.strictEqual(count, 20, 'Должно быть 20 типов узлов');
  });
});

/**
 * Тестирование констант действий кнопок
 */
describe('BUTTON_ACTIONS', () => {
  /**
   * Тест: все действия кнопок должны быть определены
   */
  it('должен содержать все действия кнопок', () => {
    const expectedActions = [
      'GOTO', 'CALLBACK', 'URL', 'COMMAND',
      'CONTACT', 'LOCATION', 'SELECTION', 'DEFAULT'
    ];

    expectedActions.forEach(action => {
      assert.ok(BUTTON_ACTIONS[action as keyof typeof BUTTON_ACTIONS], `${action} должен быть определен`);
    });
  });

  /**
   * Тест: значения констант должны соответствовать именам
   */
  it('должен иметь правильные значения констант', () => {
    assert.strictEqual(GOTO, 'goto');
    assert.strictEqual(CALLBACK, 'callback');
    assert.strictEqual(URL, 'url');
    assert.strictEqual(BUTTON_COMMAND, 'command');
    assert.strictEqual(BUTTON_CONTACT, 'contact');
    assert.strictEqual(BUTTON_LOCATION, 'location');
    assert.strictEqual(SELECTION, 'selection');
    assert.strictEqual(DEFAULT, 'default');
  });

  /**
   * Тест: тип ButtonActionType должен включать все значения
   */
  it('должен иметь правильный тип ButtonActionType', () => {
    const validActions: ButtonActionType[] = [
      'goto', 'callback', 'url', 'command',
      'contact', 'location', 'selection', 'default'
    ];

    validActions.forEach(action => {
      assert.ok(Object.values(BUTTON_ACTIONS).includes(action), `${action} должен быть валидным ButtonActionType`);
    });
  });

  /**
   * Тест: количество действий кнопок
   */
  it('должен содержать правильное количество действий', () => {
    const count = Object.keys(BUTTON_ACTIONS).length;
    assert.strictEqual(count, 8, 'Должно быть 8 действий кнопок');
  });

  /**
   * Тест: действия кнопок не должны пересекаться с типами узлов
   */
  it('не должен иметь пересечений с NODE_TYPES', () => {
    const nodeTypeValues = Object.values(NODE_TYPES) as string[];
    const buttonActionValues = Object.values(BUTTON_ACTIONS) as string[];

    const intersections = nodeTypeValues.filter(value => buttonActionValues.includes(value));
    assert.strictEqual(intersections.length, 0, 'Не должно быть пересечений между типами узлов и действиями кнопок');
  });
});
