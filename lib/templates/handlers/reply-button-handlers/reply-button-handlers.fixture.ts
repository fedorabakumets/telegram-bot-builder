/**
 * @fileoverview Фикстуры для тестирования reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.fixture
 */

import type { Node } from '@shared/schema';
import type { ReplyButtonHandlersTemplateParams } from './reply-button-handlers.params';

/** Тестовые данные для reply-button-handlers */
export const replyButtonHandlersFixture: ReplyButtonHandlersTemplateParams = {
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'reply',
        messageText: 'Выберите опцию:',
        buttons: [
          {
            id: 'btn1',
            text: 'Опция 1',
            action: 'goto',
            target: 'node2',
          },
          {
            id: 'btn2',
            text: 'Опция 2',
            action: 'goto',
            target: 'node3',
          },
        ],
        resizeKeyboard: true,
        oneTimeKeyboard: false,
      },
    },
    {
      id: 'node2',
      type: 'message',
      data: {
        keyboardType: 'none',
        messageText: 'Вы выбрали опцию 1',
      },
    },
    {
      id: 'node3',
      type: 'message',
      data: {
        keyboardType: 'none',
        messageText: 'Вы выбрали опцию 2',
      },
    },
  ] as Node[],
  indentLevel: '',
};

/** Фикстура с пустыми узлами */
export const emptyNodesFixture: ReplyButtonHandlersTemplateParams = {
  nodes: [],
  indentLevel: '',
};

/** Фикстура с узлами без reply кнопок */
export const noReplyNodesFixture: ReplyButtonHandlersTemplateParams = {
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'inline',
        messageText: 'Тест',
        buttons: [],
      },
    },
  ] as Node[],
  indentLevel: '',
};

/** Фикстура с мультивыбором */
export const multiSelectFixture: ReplyButtonHandlersTemplateParams = {
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'reply',
        messageText: 'Выберите интересы:',
        allowMultipleSelection: true,
        multiSelectVariable: 'user_interests',
        buttons: [
          {
            id: 'btn1',
            text: 'Интерес 1',
            action: 'selection',
          },
          {
            id: 'btn2',
            text: 'Интерес 2',
            action: 'selection',
          },
          {
            id: 'btn3',
            text: 'Готово',
            action: 'complete',
            target: 'node2',
          },
        ],
      },
    },
    {
      id: 'node2',
      type: 'message',
      data: {
        keyboardType: 'none',
        messageText: 'Выбор завершен',
      },
    },
  ] as Node[],
  indentLevel: '',
};
