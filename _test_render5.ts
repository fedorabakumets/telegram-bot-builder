import { generateMultiSelectReply } from './lib/templates/handlers/multi-select-reply/multi-select-reply.renderer.ts';

const r = generateMultiSelectReply({
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
console.log(r);
console.log('\n--- checks ---');
console.log('has Переход к следующему узлу:', r.includes('Переход к следующему узлу'));
console.log('has next_node:', r.includes('next_node'));
console.log('has ReplyKeyboardBuilder:', r.includes('ReplyKeyboardBuilder()'));
console.log('has builder.as_markup:', r.includes('builder.as_markup'));
