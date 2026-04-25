/**
 * @fileoverview Отладочный скрипт для проверки L04 и L06
 */
import { generatePythonCode } from './bot-generator.ts';

function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

// Debug L06: edit-kb-next-only with keyboardNodeId (legacy)
const p = makeCleanProject([
  { id: 'cb_page', type: 'callback_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: 'fetch-bot-users', callbackData: 'cb_page', matchType: 'exact', adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } },
  { id: 'fetch-bot-users', type: 'http_request', position: { x: 0, y: 0 }, data: { autoTransitionTo: 'check-has-next', url: 'https://api.example.com/users?page=1', method: 'GET', headers: [], body: '', saveResponseTo: '', buttons: [], keyboardType: 'none' } },
  { id: 'check-has-next', type: 'condition', position: { x: 0, y: 0 }, data: { conditions: [{ id: 'br1', label: 'Ветка', variable: 'x', operator: 'not_empty', value: '', targetNodeId: 'edit-kb-next-only' }], defaultTargetId: '' } },
  { id: 'edit-kb-next-only', type: 'edit_message', position: { x: 0, y: 0 }, data: { autoTransitionTo: 'msg_list', editMode: 'markup', editKeyboardMode: 'node', keyboardNodeId: 'kb-next-only', editMessageText: '', editFormatMode: 'none', editMessageIdSource: 'last_bot_message', editMessageIdManual: '', buttons: [], keyboardType: 'none' } },
  { id: 'kb-next-only', type: 'keyboard', position: { x: 0, y: 0 }, data: { enableDynamicButtons: true, dynamicButtons: { sourceVariable: 'users_response', arrayPath: 'users', textTemplate: '{name} ({role})', callbackTemplate: 'select_user_{id}', columns: 1 }, buttons: [{ id: 'btn_next', text: '➡️ Далее', action: 'goto', target: 'cb_page', customCallbackData: 'page_next' }], keyboardType: 'inline' } },
  { id: 'msg_list', type: 'message', position: { x: 400, y: 0 }, data: { messageText: 'Список пользователей', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false } },
]);

const code = generatePythonCode(p as any, { botName: 'TestBot', userDatabaseEnabled: false, enableComments: false });
const lines = code.split('\n');
const defs = lines.filter((l: string) => l.includes('async def handle_callback_edit_kb_next_only'));
console.log('Defs of handle_callback_edit_kb_next_only:', defs.length);
defs.forEach((l: string) => console.log(' -', l.trim()));

// Find line numbers of defs
lines.forEach((l: string, i: number) => {
  if (l.includes('async def handle_callback_edit_kb_next_only')) {
    console.log('Line', i, ':', l);
    // Show 5 lines before
    lines.slice(Math.max(0, i - 5), i + 2).forEach((ll: string, j: number) => console.log('  ', Math.max(0, i - 5) + j, ':', ll));
  }
});
