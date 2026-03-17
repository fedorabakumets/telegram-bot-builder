import { generateMultiSelectDone } from './lib/templates/handlers/multi-select-done/multi-select-done.renderer.ts';
import { generateMultiSelectReply } from './lib/templates/handlers/multi-select-reply/multi-select-reply.renderer.ts';

// Full output for done withMultiSelectTarget
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
  allNodes: [],
  allNodeIds: [],
});
console.log('=== DONE withMultiSelectTarget FULL ===');
console.log(r1);

// Full output for reply with command target
const r2 = generateMultiSelectReply({
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
  allNodes: [],
  allNodeIds: [],
});
console.log('\n=== REPLY command target FULL ===');
console.log(r2.substring(0, 800));
