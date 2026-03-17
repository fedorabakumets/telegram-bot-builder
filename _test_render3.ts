import { generateMultiSelectDone } from './lib/templates/handlers/multi-select-done/multi-select-done.renderer.ts';
import { generateMultiSelectReply } from './lib/templates/handlers/multi-select-reply/multi-select-reply.renderer.ts';
import { generateMultiSelectTransition } from './lib/templates/handlers/multi-select-transition/multi-select-transition.renderer.ts';

// Test done with multiSelectTarget
const r1 = generateMultiSelectDone({
  multiSelectNodes: [{
    id: 'node_456',
    variableName: 'user_preferences',
    continueButtonTarget: 'multi_select_node',
    targetNode: {
      id: 'multi_select_node',
      type: 'message',
      data: {
        keyboardType: 'inline',
        allowMultipleSelection: true,
        messageText: 'Выберите опции',
        multiSelectVariable: 'user_choices',
        buttons: [
          { id: 'btn_1', text: 'Опция 1', action: 'selection', callbackData: 'ms_msn_opt1' },
          { id: 'btn_2', text: 'Опция 2', action: 'selection', callbackData: 'ms_msn_opt2' },
          { id: 'btn_done', text: 'Готово', action: 'complete' },
        ],
      },
      shortId: 'msn',
      adjustCode: 'builder.adjust(2)',
    },
  }],
  allNodes: [
    { id: 'node_456', type: 'message' },
    { id: 'multi_select_node', type: 'message', data: { allowMultipleSelection: true, keyboardType: 'inline' } },
  ],
  allNodeIds: ['node_456', 'multi_select_node'],
});
console.log('=== DONE withMultiSelectTarget ===');
console.log('has allowMultipleSelection: true:', r1.includes('allowMultipleSelection: true'));
console.log('has InlineKeyboardBuilder:', r1.includes('InlineKeyboardBuilder()'));
console.log('has saved_selections:', r1.includes('saved_selections'));
console.log('has KeyboardButton:', r1.includes('KeyboardButton'));
console.log('has Готово:', r1.includes('Готово'));
console.log('has done_:', r1.includes('done_'));

// Test reply keyboard
const r2 = generateMultiSelectDone({
  multiSelectNodes: [{
    id: 'node_reply',
    variableName: 'user_topics',
    continueButtonTarget: 'reply_node',
    targetNode: {
      id: 'reply_node',
      type: 'message',
      data: {
        keyboardType: 'reply',
        allowMultipleSelection: true,
        messageText: 'Выберите темы',
        multiSelectVariable: 'topics',
        resizeKeyboard: true,
        oneTimeKeyboard: false,
        buttons: [
          { id: 'btn_1', text: 'Тема 1', action: 'selection' },
          { id: 'btn_done', text: 'Готово', action: 'complete' },
        ],
      },
    },
  }],
  allNodes: [
    { id: 'node_reply', type: 'message' },
    { id: 'reply_node', type: 'message' },
  ],
  allNodeIds: ['node_reply', 'reply_node'],
});
console.log('\n=== DONE replyKeyboard ===');
console.log('has ReplyKeyboardBuilder:', r2.includes('ReplyKeyboardBuilder()'));
console.log('has KeyboardButton:', r2.includes('KeyboardButton'));
console.log('has resize_keyboard=:', r2.includes('resize_keyboard='));

// Test transition fixed
const r3 = generateMultiSelectTransition({
  multiSelectNodes: [{ id: 'node1', data: { continueButtonTarget: 'nonexistent_node' } }],
  nodes: [{ id: 'node1', type: 'message', data: { allowMultipleSelection: true } }],
  connections: [],
  indentLevel: '        ',
});
console.log('\n=== TRANSITION missingTarget (fixed) ===');
console.log('has Целевой узел не найден:', r3.includes('Целевой узел не найден'));
console.log('has Выбор завершен:', r3.includes('✅ Выбор завершен!'));

// Test reply with command target
const r4 = generateMultiSelectReply({
  multiSelectNodes: [{
    id: 'node_cmd',
    variableName: 'user_data_var',
    selectionButtons: [{ id: 'btn_1', text: 'Выбор 1', action: 'selection' }],
    regularButtons: [],
    gotoButtons: [],
    completeButton: { text: 'Готово', target: 'command_node' },
    continueButtonTarget: 'command_node',
    targetNode: { id: 'command_node', type: 'command', data: { command: '/mycommand' } },
    messageText: 'Выберите:',
  }],
  allNodes: [
    { id: 'node_cmd', type: 'message' },
    { id: 'command_node', type: 'command', data: { command: '/mycommand' } },
  ],
  allNodeIds: ['node_cmd', 'command_node'],
});
console.log('\n=== REPLY with command target ===');
console.log('has handle_command_:', r4.includes('handle_command_'));
console.log('has /mycommand:', r4.includes('/mycommand'));

// Test reply with goto buttons - Переход к следующему узлу
const r5 = generateMultiSelectReply({
  multiSelectNodes: [{
    id: 'node_456',
    variableName: 'user_topics',
    selectionButtons: [{ id: 'btn_1', text: 'Тема 1', action: 'selection' }],
    regularButtons: [{ id: 'btn_skip', text: 'Пропустить', action: 'goto', target: 'skip_node' }],
    gotoButtons: [{
      id: 'btn_goto', text: 'Перейти', action: 'goto', target: 'target_node',
      targetNode: { id: 'target_node', type: 'message', data: {} },
    }],
    completeButton: { text: 'Завершить', target: 'next_node' },
    continueButtonTarget: 'next_node',
    targetNode: { id: 'next_node', type: 'message', data: { messageText: 'Следующее сообщение' } },
    messageText: 'Выберите темы:',
  }],
  allNodes: [
    { id: 'node_456', type: 'message' },
    { id: 'target_node', type: 'message' },
    { id: 'next_node', type: 'message' },
  ],
  allNodeIds: ['node_456', 'target_node', 'next_node'],
});
console.log('\n=== REPLY with goto buttons ===');
console.log('has Переход к следующему узлу:', r5.includes('Переход к следующему узлу'));
console.log('has next_node:', r5.includes('next_node'));
console.log('has ReplyKeyboardBuilder:', r5.includes('ReplyKeyboardBuilder()'));
