/**
 * @fileoverview Фикстуры для тестирования reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.fixture
 */

import type { Node } from '@shared/schema';
import type { ReplyHideAfterClickTemplateParams } from './reply-hide-after-click.params';

/** Тестовые данные с кнопками hideAfterClick */
export const replyHideAfterClickFixture: ReplyHideAfterClickTemplateParams = {
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
            text: 'Скрыть после клика',
            action: 'goto',
            target: 'node2',
            hideAfterClick: true,
          },
          {
            id: 'btn2',
            text: 'Обычная кнопка',
            action: 'goto',
            target: 'node3',
            hideAfterClick: false,
          },
        ],
      },
    },
    {
      id: 'node2',
      type: 'message',
      data: {
        keyboardType: 'none',
        messageText: 'Опция 1',
      },
    },
    {
      id: 'node3',
      type: 'message',
      data: {
        keyboardType: 'none',
        messageText: 'Опция 2',
      },
    },
  ] as Node[],
  indentLevel: '    ',
};

/** Фикстура без кнопок hideAfterClick */
export const noHideAfterClickFixture: ReplyHideAfterClickTemplateParams = {
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'reply',
        messageText: 'Тест',
        buttons: [
          {
            id: 'btn1',
            text: 'Кнопка 1',
            action: 'goto',
            target: 'node2',
          },
        ],
      },
    },
  ] as Node[],
  indentLevel: '    ',
};

/** Фикстура с несколькими кнопками hideAfterClick */
export const multipleHideAfterClickFixture: ReplyHideAfterClickTemplateParams = {
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'reply',
        messageText: 'Меню:',
        buttons: [
          {
            id: 'btn1',
            text: 'Удалить 1',
            action: 'goto',
            target: 'node2',
            hideAfterClick: true,
          },
          {
            id: 'btn2',
            text: 'Удалить 2',
            action: 'goto',
            target: 'node3',
            hideAfterClick: true,
          },
        ],
      },
    },
  ] as Node[],
  indentLevel: '    ',
};
