/**
 * @fileoverview Тестовые данные для шаблона reply-input-handler
 * @module templates/reply-input-handler/reply-input-handler.fixture
 */

import type { ReplyInputHandlerTemplateParams } from './reply-input-handler.params';

export const nodesSimple = [
  { id: 'node_abc', safeName: 'node_abc' },
  { id: 'node_xyz', safeName: 'node_xyz' },
];

export const commandNodesSimple = [
  { id: 'start_1', type: 'start', command: '/start' },
  { id: 'cmd_help', type: 'command', command: '/help' },
];

export const validParamsMinimal: ReplyInputHandlerTemplateParams = {
  nodes: [],
  commandNodes: [],
  hasUrlButtons: false,
};

export const validParamsWithNodes: ReplyInputHandlerTemplateParams = {
  nodes: nodesSimple,
  commandNodes: commandNodesSimple,
  hasUrlButtons: false,
};

export const validParamsWithUrl: ReplyInputHandlerTemplateParams = {
  nodes: nodesSimple,
  commandNodes: commandNodesSimple,
  hasUrlButtons: true,
};

export const validParamsCustomIndent: ReplyInputHandlerTemplateParams = {
  nodes: nodesSimple,
  commandNodes: [],
  hasUrlButtons: false,
  indentLevel: '        ',
};
