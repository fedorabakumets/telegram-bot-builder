import { generateMultiSelectTransition } from './lib/templates/handlers/multi-select-transition/multi-select-transition.renderer.ts';
import { generateMultiSelectReply } from './lib/templates/handlers/multi-select-reply/multi-select-reply.renderer.ts';
import { generateMultiSelectDone } from './lib/templates/handlers/multi-select-done/multi-select-done.renderer.ts';

// Test 1: missing target
const r1 = generateMultiSelectTransition({
  multiSelectNodes: [{ id: 'node1', data: { continueButtonTarget: 'nonexistent_node' } }],
  nodes: [{ id: 'node1', type: 'message', data: { allowMultipleSelection: true } }],
  connections: [],
  indentLevel: '        ',
});
console.log('=== TRANSITION missingTarget ===');
console.log(r1);
console.log('has Целевой узел не найден:', r1.includes('Целевой узел не найден'));
console.log('has Выбор завершен:', r1.includes('✅ Выбор завершен!'));

// Test 2: connections
const r2 = generateMultiSelectTransition({
  multiSelectNodes: [{ id: 'node1', data: { keyboardType: 'none' }, connections: [{ source: 'node1', target: 'node2' }] }],
  nodes: [
    { id: 'node1', type: 'message', data: { allowMultipleSelection: true } },
    { id: 'node2', type: 'message', data: { keyboardType: 'none', messageText: 'Переход по соединению' } },
  ],
  connections: [{ source: 'node1', target: 'node2' }],
  indentLevel: '        ',
});
console.log('=== TRANSITION connections ===');
console.log(r2);
console.log('has Переход к узлу node2 через соединение:', r2.includes('Переход к узлу node2 через соединение'));

// Test 3: multi-select-done basic
const r3 = generateMultiSelectDone({
  multiSelectNodes: [{
    id: 'node_123',
    variableName: 'user_interests',
    continueButtonTarget: 'next_node',
    targetNode: {
      id: 'next_node',
      type: 'message',
      data: { keyboardType: 'inline', allowMultipleSelection: false, messageText: 'Следующее сообщение', buttons: [] },
    },
  }],
  allNodes: [
    { id: 'node_123', type: 'message', data: { allowMultipleSelection: true, keyboardType: 'inline' } },
    { id: 'next_node', type: 'message', data: { messageText: 'Следующее сообщение' } },
  ],
  allNodeIds: ['node_123', 'next_node'],
  indentLevel: '',
});
console.log('=== DONE basic ===');
console.log(r3.substring(0, 500));
console.log('has 💾 ГЕНЕРАТОР DEBUG:', r3.includes('💾 ГЕНЕРАТОР DEBUG: Сохранили в БД'));
console.log('has Переход к следующему узлу:', r3.includes('Переход к следующему узлу'));
