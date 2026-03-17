import { generateMultiSelectDone } from './lib/templates/handlers/multi-select-done/multi-select-done.renderer.ts';

const r = generateMultiSelectDone({
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
console.log(r);
