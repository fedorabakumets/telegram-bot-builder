import { generateMultiSelectReply } from './lib/templates/handlers/multi-select-reply/multi-select-reply.renderer.ts';
import { generateMultiSelectDone } from './lib/templates/handlers/multi-select-done/multi-select-done.renderer.ts';

const r1 = generateMultiSelectReply({
  multiSelectNodes: [{
    id: 'node_123',
    variableName: 'user_interests',
    selectionButtons: [
      { id: 'btn_1', text: 'Опция 1', action: 'selection', target: 'opt1' },
      { id: 'btn_2', text: 'Опция 2', action: 'selection', target: 'opt2' },
    ],
    regularButtons: [],
    gotoButtons: [],
    completeButton: { text: 'Готово' },
    continueButtonText: 'Готово',
    messageText: 'Выберите опции:',
    resizeKeyboard: true,
    oneTimeKeyboard: false,
    adjustCode: 'builder.adjust(2)',
  }],
  allNodes: [{ id: 'node_123', type: 'message', data: { keyboardType: 'reply', allowMultipleSelection: true } }],
  allNodeIds: ['node_123'],
  indentLevel: '',
});

console.log('has ReplyKeyboardBuilder:', r1.includes('ReplyKeyboardBuilder()'));
console.log('has f"{\'✅ \' if \':', r1.includes("f\"{'✅ ' if '"));
console.log('has builder.as_markup:', r1.includes('builder.as_markup'));

// Check done with Готово button
const r2 = generateMultiSelectDone({
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
          { id: 'btn_done', text: 'Готово', action: 'complete' },
        ],
      },
      shortId: 'msn',
      adjustCode: 'builder.adjust(2)',
    },
  }],
  allNodes: [],
  allNodeIds: [],
});
console.log('\nhas Готово:', r2.includes('Готово'));
console.log('has done_:', r2.includes('done_'));
console.log('has done_msn:', r2.includes('done_msn'));
