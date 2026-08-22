/**
 * @fileoverview     (Memory Leaks)
 *
 *     :
 *  1. USER_DATA_TTL + _user_last_seen + cleanup_user_data (utils.py.jinja2)
 *  2. asyncio.create_task(cleanup_user_data())  main() (main.py.jinja2)
 *  3. signal_handler  loop.stop()  sys.exit(0) (main.py.jinja2)
 *  4. templateCache  MAX_CACHE_SIZE = 100 (template-renderer.ts)
 *
 * :
 *  A. USER_DATA_TTL  (10 )
 *  B. _user_last_seen  (10 )
 *  C. cleanup_user_data  (15 )
 *  D. asyncio.create_task(cleanup_user_data())  main() (10 )
 *  E. signal_handler  loop.stop()  sys.exit() (15 )
 *  F. finally      (10 )
 *  G. templateCache  (10 )
 *  H.     (15 )
 *  I.      (10 )
 *  J.   (10 )
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { renderPartialTemplate } from '../templates/template-renderer.ts';

// ---   ----------------------------------------------------

/**
 *    start
 * @param id -  
 */
function makeStartNode(id = 'start1') {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { command: '/start', messageText: '', keyboardType: 'none', buttons: [] },
  };
}

/**
 *    message
 * @param id -  
 * @param text -  
 */
function makeMessageNode(id: string, text = '') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 *    command_trigger
 * @param id -  
 * @param command -  
 * @param targetId - ID  
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: '',
      showInMenu: true,
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 *    text_trigger
 * @param id -  
 * @param synonyms -  
 * @param targetId - ID  
 */
function makeTextTriggerNode(id: string, synonyms: string[], targetId: string) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: synonyms,
      textMatchType: 'exact',
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 *    condition
 * @param id -  
 * @param variable -  
 * @param branches -  
 */
function makeConditionNode(id: string, variable: string, branches: any[]) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: { variable, branches },
  };
}

/**
 *    media
 * @param id -  
 * @param media -  
 */
function makeMediaNode(id: string, media: string[]) {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: { attachedMedia: media, buttons: [], keyboardType: 'none', enableAutoTransition: false, autoTransitionTo: '' },
  };
}

// ---   -------------------------------------------------------

/**
 *   project.json   
 * @param nodes -  
 * @param userDatabaseEnabled -  
 */
function makeCleanProject(nodes: any[], userDatabaseEnabled = false) {
  return {
    version: 2,
    activeSheetId: 'sheet-ml',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-ml',
      name: ' ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/**
 *  Python-  
 * @param project -  
 * @param label -    
 * @param userDatabaseEnabled -  
 */
function gen(project: any, label: string, userDatabaseEnabled = false): string {
  return generatePythonCode(project, {
    botName: `MemLeak_${label}`,
    userDatabaseEnabled,
    });
}

/**
 *  Python-   
 * @param project -  
 * @param label -    
 */
function genDB(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `MemLeakDB_${label}`,
    userDatabaseEnabled: true,
    });
}

/**
 *   Python-  py_compile
 * @param code - Python-
 * @param label -    
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_ml_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    const err = e.stderr?.toString() ?? String(e);
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: err };
  }
}

// --- - -------------------------------------------------------------

/**    */
type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 *      
 * @param id -  
 * @param name -  
 * @param fn -  
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ? ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ? ${id}. ${name}\n     > ${e.message}`);
  }
}

/**
 *       
 * @param cond - 
 * @param msg -   
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 *   Python     
 * @param code - Python-
 * @param label -    
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `  Python:\n${r.error}`);
}

// ---    ---------------------------------------------------

/**          */
function hasFourFixes(code: string): void {
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL ');
  ok(code.includes('cleanup_user_data'), 'cleanup_user_data ');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'asyncio.create_task(cleanup_user_data()) ');
  ok(code.includes('_stop_event.set()'), 'asyncio.get_running_loop().stop() ');
}

// ===============================================================================
//  A: USER_DATA_TTL 
// ===============================================================================

console.log('\n==============================================================');
console.log('           (Memory Leaks)                   ');
console.log('L==============================================================-\n');

console.log('--  A: USER_DATA_TTL  -----------------------------');

test('A01', 'USER_DATA_TTL = 3600   ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'A01');
  ok(code.includes('USER_DATA_TTL = 3600'), 'USER_DATA_TTL = 3600  ');
});

test('A02', 'USER_DATA_TTL   userDatabaseEnabled: true', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'A02');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   DB=true');
});

test('A03', 'USER_DATA_TTL   userDatabaseEnabled: false', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'A03');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   DB=false');
});

test('A04', 'USER_DATA_TTL     inline ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'A04');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   inline ');
});

test('A05', 'USER_DATA_TTL     reply ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'A05');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   reply ');
});

test('A06', 'USER_DATA_TTL     command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'A06');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   command_trigger');
});

test('A07', 'USER_DATA_TTL     text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['', 'hello'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'A07');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   text_trigger');
});

test('A08', 'USER_DATA_TTL     condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'user_name', [
      { value: 'admin', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', ', admin!'),
    makeMessageNode('msg2', '!'),
  ]);
  const code = gen(p, 'A08');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   condition');
});

test('A09', 'USER_DATA_TTL     media ', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['photo_id_123']),
  ]);
  const code = gen(p, 'A09');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL   media ');
});

test('A10', ' Python OK   USER_DATA_TTL', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'A10');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL ');
  syntax(code, 'A10');
});

// ===============================================================================
//  B: _user_last_seen 
// ===============================================================================

console.log('\n--  B: _user_last_seen  -----------------------------');

test('B01', '_user_last_seen: dict[int, float] = {}   ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B01');
  ok(code.includes('_user_last_seen: dict[int, float] = {}'), '_user_last_seen: dict[int, float] = {}  ');
});

test('B02', '_user_last_seen   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'B02');
  ok(code.includes('_user_last_seen'), '_user_last_seen   DB=true');
});

test('B03', '_user_last_seen   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'B03');
  ok(code.includes('_user_last_seen'), '_user_last_seen   DB=false');
});

test('B04', '_user_last_seen[user_id] = time.monotonic()   init_user_variables', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B04');
  ok(code.includes('_user_last_seen[user_id] = time.monotonic()'), '_user_last_seen[user_id] = time.monotonic()  ');
});

test('B05', '_user_last_seen    init_user_variables', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B05');
  const initIdx = code.indexOf('async def init_user_variables');
  ok(initIdx !== -1, 'init_user_variables  ');
  const afterInit = code.slice(initIdx, initIdx + 600);
  ok(afterInit.includes('_user_last_seen'), '_user_last_seen     init_user_variables');
});

test('B06', '_user_last_seen.items()   cleanup_user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B06');
  ok(code.includes('_user_last_seen.items()'), '_user_last_seen.items()  ');
});

test('B07', '_user_last_seen.pop(uid, None) ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B07');
  ok(code.includes('_user_last_seen.pop(uid, None)'), '_user_last_seen.pop(uid, None)  ');
});

test('B08', '_user_last_seen     adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'B08');
  ok(code.includes('_user_last_seen'), '_user_last_seen   adminOnly');
});

test('B09', '_user_last_seen     requiresAuth', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'B09');
  ok(code.includes('_user_last_seen'), '_user_last_seen   requiresAuth');
});

test('B10', ' Python OK   _user_last_seen', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B10');
  ok(code.includes('_user_last_seen'), '_user_last_seen ');
  syntax(code, 'B10');
});

// ===============================================================================
//  C: cleanup_user_data 
// ===============================================================================

console.log('\n--  C: cleanup_user_data  ---------------------------');

test('C01', 'async def cleanup_user_data() ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C01');
  ok(code.includes('async def cleanup_user_data()'), 'async def cleanup_user_data()  ');
});

test('C02', 'cleanup_user_data  while True:', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C02');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data  ');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('while True:'), 'while True:    cleanup_user_data');
});

test('C03', 'cleanup_user_data  await asyncio.sleep(USER_DATA_TTL)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C03');
  ok(code.includes('await asyncio.sleep(USER_DATA_TTL)'), 'await asyncio.sleep(USER_DATA_TTL)  ');
});

test('C04', 'cleanup_user_data  time.monotonic()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C04');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data  ');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('time.monotonic()'), 'time.monotonic()    cleanup_user_data');
});

test('C05', 'cleanup_user_data  user_data.pop(uid, None)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C05');
  ok(code.includes('user_data.pop(uid, None)'), 'user_data.pop(uid, None)  ');
});

test('C06', 'cleanup_user_data  _user_last_seen.pop(uid, None)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C06');
  ok(code.includes('_user_last_seen.pop(uid, None)'), '_user_last_seen.pop(uid, None)  ');
});

test('C07', 'cleanup_user_data  logging.debug', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C07');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data  ');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('logging.debug'), 'logging.debug    cleanup_user_data');
});

test('C08', 'cleanup_user_data uses USER_DATA_TTL and _user_last_seen', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C08');
  const cleanupIdx = code.indexOf('async def cleanup_user_data');
  ok(cleanupIdx !== -1, 'cleanup_user_data not found');
  const cleanupBody = code.slice(cleanupIdx, cleanupIdx + 800);
  ok(cleanupBody.includes('USER_DATA_TTL') && cleanupBody.includes('_user_last_seen'), 'TTL cleanup logic missing');
});

test('C09', 'cleanup_user_data   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'C09');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data   DB=true');
});

test('C10', 'cleanup_user_data   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'C10');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data   DB=false');
});

test('C11', 'cleanup_user_data     inline ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'C11');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data   inline ');
});

test('C12', 'cleanup_user_data     10 ', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 9; i++) {
    nodes.push(makeMessageNode(`msg${i}`, ` ${i}`));
  }
  const p = makeCleanProject(nodes);
  const code = gen(p, 'C12');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data   10 ');
});

test('C13', 'cleanup_user_data     command_trigger + message', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', '!'),
  ]);
  const code = gen(p, 'C13');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data   command_trigger');
});

test('C14', 'cleanup_user_data     condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'score', [
      { value: '100', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', '!'),
    makeMessageNode('msg2', ' '),
  ]);
  const code = gen(p, 'C14');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data   condition');
});

test('C15', ' Python OK   cleanup_user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C15');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data ');
  syntax(code, 'C15');
});

// ===============================================================================
//  D: asyncio.create_task(cleanup_user_data())  main()
// ===============================================================================

console.log('\n--  D: asyncio.create_task(cleanup_user_data())  main() ---');

test('D01', 'asyncio.create_task(cleanup_user_data())   ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D01');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'asyncio.create_task(cleanup_user_data())  ');
});

test('D02', '   async def main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D02');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main()  ');
  const mainBody = code.slice(mainIdx);
  ok(mainBody.includes('asyncio.create_task(cleanup_user_data())'), 'create_task    main()');
});

test('D03', '   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'D03');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   DB=true');
});

test('D04', '   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'D04');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   DB=false');
});

test('D05', '     inline ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'D05');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   inline ');
});

test('D06', '     command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'D06');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   command_trigger');
});

test('D07', '     text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['', ''], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'D07');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   text_trigger');
});

test('D08', '     adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'D08');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   adminOnly');
});

test('D09', '     requiresAuth', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'D09');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task   requiresAuth');
});

test('D10', ' Python OK   create_task', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D10');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task ');
  syntax(code, 'D10');
});

// ===============================================================================
//  E: signal_handler  loop.stop()  sys.exit()
// ===============================================================================

console.log('\n--  E: signal_handler  loop.stop()  sys.exit() -----');

test('E01', 'asyncio.get_running_loop().stop()   ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E01');
  ok(code.includes('_stop_event.set()'), 'asyncio.get_running_loop().stop()  ');
});

test('E02', 'sys.exit(0)    signal_handler', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E02');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler  ');
  //    (  def    )
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(!handlerBody.includes('sys.exit(0)'), 'sys.exit(0)   signal_handler  !');
});

test('E03', 'request_bot_stop() present for worker pool', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E03');
  ok(code.includes('def request_bot_stop():'), 'request_bot_stop() not found');
  ok(code.includes('_bot_stop_event.set()'), '_bot_stop_event.set() not found in request_bot_stop');
});

test('E04', 'signal_handler calls _stop_event.set()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E04');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler not found');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(handlerBody.includes('_stop_event.set()'), '_stop_event.set() not found in signal_handler');
});

test('E05', 'main() awaits _stop_event.wait()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E05');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() not found');
  const mainBody = code.slice(mainIdx);
  ok(mainBody.includes('await _stop_event.wait()'), 'await _stop_event.wait() not found in main()');
});

test('E06', 'signal.signal(signal.SIGTERM, signal_handler) ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E06');
  ok(code.includes('signal.signal(signal.SIGTERM, signal_handler)'), 'SIGTERM   ');
});

test('E07', 'signal.signal(signal.SIGINT, signal_handler) ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E07');
  ok(code.includes('signal.signal(signal.SIGINT, signal_handler)'), 'SIGINT   ');
});

test('E08', 'signal_handler   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'E08');
  ok(code.includes('def signal_handler'), 'signal_handler   DB=true');
});

test('E09', 'signal_handler   DB ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'E09');
  ok(code.includes('def signal_handler'), 'signal_handler   DB=false');
});

test('E10', 'asyncio.get_running_loop().stop()   inline ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'E10');
  ok(code.includes('_stop_event.set()'), 'loop.stop()   inline ');
});

test('E11', 'asyncio.get_running_loop().stop()   command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'E11');
  ok(code.includes('_stop_event.set()'), 'loop.stop()   command_trigger');
});

test('E12', 'asyncio.get_running_loop().stop()   text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['', 'stop'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'E12');
  ok(code.includes('_stop_event.set()'), 'loop.stop()   text_trigger');
});

test('E13', 'asyncio.get_running_loop().stop()   condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'level', [
      { value: '1', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', ' 1'),
    makeMessageNode('msg2', ' '),
  ]);
  const code = gen(p, 'E13');
  ok(code.includes('_stop_event.set()'), 'loop.stop()   condition');
});

test('E14', 'asyncio.get_running_loop().stop()   media', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['AgACAgIAAxkBAAIBcmJ']),
  ]);
  const code = gen(p, 'E14');
  ok(code.includes('_stop_event.set()'), 'loop.stop()   media');
});

test('E15', ' Python OK   signal_handler  loop.stop()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E15');
  ok(code.includes('_stop_event.set()'), 'loop.stop() ');
  syntax(code, 'E15');
});

// ===============================================================================
//  F: finally     
// ===============================================================================

console.log('\n--  F: finally      -------');

test('F01', 'finally:   main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F01');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main()  ');
  const mainBody = code.slice(mainIdx);
  ok(mainBody.includes('finally:'), 'finally:    main()');
});

test('F02', 'await bot.session.close()   finally', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F02');
  ok(code.includes('await bot.session.close()'), 'await bot.session.close()  ');
});

test('F03', ' DB : await db_pool.close()   finally', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'F03');
  ok(code.includes('await db_pool.close()'), 'await db_pool.close()    DB=true');
});

test('F04', ' DB : db_pool.close()  ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'F04');
  ok(!code.includes('db_pool.close()'), 'db_pool.close()   DB=false   ');
});

test('F05', 'finally   except  ( )', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F05');
  const exceptIdx = code.indexOf('except KeyboardInterrupt:');
  const finallyIdx = code.indexOf('finally:');
  ok(exceptIdx !== -1, 'except KeyboardInterrupt:  ');
  ok(finallyIdx !== -1, 'finally:  ');
  ok(finallyIdx > exceptIdx, 'finally    except');
});

test('F06', 'finally     inline ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'F06');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally:   inline ');
});

test('F07', 'finally     command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'F07');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally:   command_trigger');
});

test('F08', 'finally     text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', [''], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'F08');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally:   text_trigger');
});

test('F09', 'finally     adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'F09');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally:   adminOnly');
});

test('F10', ' Python OK   finally ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'F10');
  ok(code.includes('finally:'), 'finally: ');
  syntax(code, 'F10');
});

// ===============================================================================
//  G: templateCache 
// ===============================================================================

console.log('\n--  G: templateCache  ---------------------------');

test('G01', 'MAX_CACHE_SIZE = 100    template-renderer.ts', () => {
  const src = fs.readFileSync('lib/templates/template-renderer.ts', 'utf-8');
  ok(src.includes('MAX_CACHE_SIZE = 100'), 'MAX_CACHE_SIZE = 100    template-renderer.ts');
});

test('G02', 'renderPartialTemplate 5      ', () => {
  const templates = [
    ['utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false }],
    ['utils/utils.py.jinja2', { adminOnly: true, userDatabaseEnabled: false }],
    ['utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: true }],
    ['main/main.py.jinja2', { userDatabaseEnabled: false, menuCommands: [], autoRegisterUsers: false, incomingMessageTriggerMiddlewares: [], hasInlineButtons: false }],
    ['main/main.py.jinja2', { userDatabaseEnabled: true, menuCommands: [], autoRegisterUsers: false, incomingMessageTriggerMiddlewares: [], hasInlineButtons: false }],
  ] as const;
  for (const [tmpl, ctx] of templates) {
    const result = renderPartialTemplate(tmpl, ctx as any);
    ok(typeof result === 'string' && result.length > 0, `renderPartialTemplate(${tmpl})   `);
  }
});

test('G03', 'renderPartialTemplate       ', () => {
  const ctx = { adminOnly: false, userDatabaseEnabled: false };
  const r1 = renderPartialTemplate('utils/utils.py.jinja2', ctx);
  const r2 = renderPartialTemplate('utils/utils.py.jinja2', ctx);
  ok(r1 === r2, '       ');
});

test('G04', 'renderPartialTemplate utils/utils.py.jinja2  cleanup_user_data', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('cleanup_user_data'), 'cleanup_user_data    utils.py.jinja2');
});

test('G05', 'renderPartialTemplate utils/utils.py.jinja2  adminOnly:true  is_admin', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: true, userDatabaseEnabled: false });
  ok(result.includes('is_admin'), 'is_admin    adminOnly:true');
});

test('G06', 'renderPartialTemplate main/main.py.jinja2  cleanup_user_data', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(result.includes('cleanup_user_data'), 'cleanup_user_data    main.py.jinja2');
});

test('G07', 'renderPartialTemplate main/main.py.jinja2  asyncio.get_running_loop().stop()', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(result.includes('_stop_event.set()'), 'loop.stop()    main.py.jinja2');
});

test('G08', 'renderPartialTemplate main/main.py.jinja2   sys.exit(0)', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(!result.includes('sys.exit(0)'), 'sys.exit(0)   main.py.jinja2  !');
});

test('G09', 'renderPartialTemplate utils/utils.py.jinja2  USER_DATA_TTL', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('USER_DATA_TTL'), 'USER_DATA_TTL    utils.py.jinja2');
});

test('G10', 'renderPartialTemplate utils/utils.py.jinja2  _user_last_seen', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('_user_last_seen'), '_user_last_seen    utils.py.jinja2');
});

// ===============================================================================
//  H:    
// ===============================================================================

console.log('\n--  H:     -------------------------');

test('H01', ': start + message >  4  ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H01'));
});

test('H02', ': command_trigger + message >  4  ', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  hasFourFixes(gen(p, 'H02'));
});

test('H03', ': text_trigger + message >  4  ', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['', 'hi'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  hasFourFixes(gen(p, 'H03'));
});

test('H04', ': start + condition + message >  4  ', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'age', [
      { value: '18', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', ''),
    makeMessageNode('msg2', ''),
  ]);
  hasFourFixes(gen(p, 'H04'));
});

test('H05', ': start + inline keyboard + message >  4  ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H05'));
});

test('H06', ': start + reply keyboard + message >  4  ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H06'));
});

test('H07', '  DB: start + message >  4  ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  hasFourFixes(genDB(p, 'H07'));
});

test('H08', '  DB: command_trigger + message >  4  ', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ], true);
  hasFourFixes(genDB(p, 'H08'));
});

test('H09', '  DB + inline: start + message >  4  ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')], true);
  hasFourFixes(genDB(p, 'H09'));
});

test('H10', ': 5 command_trigger + 5 message >  4  ', () => {
  const nodes: any[] = [];
  for (let i = 1; i <= 5; i++) {
    nodes.push(makeCommandTriggerNode(`cmd${i}`, `/cmd${i}`, `msg${i}`));
    nodes.push(makeMessageNode(`msg${i}`, `   ${i}`));
  }
  const p = makeCleanProject(nodes);
  hasFourFixes(gen(p, 'H10'));
});

test('H11', ': adminOnly + requiresAuth >  4  ', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/secret', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1', ' ')]);
  hasFourFixes(gen(p, 'H11'));
});

test('H12', ': media  >  4  ', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['photo_id_abc123']),
  ]);
  hasFourFixes(gen(p, 'H12'));
});

test('H13', ': forward_message >  4  ', () => {
  const fwd = {
    id: 'fwd1',
    type: 'forward_message',
    position: { x: 400, y: 0 },
    data: { fromChatId: '-100123456789', messageId: '42', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([makeStartNode(), fwd]);
  hasFourFixes(gen(p, 'H13'));
});

test('H14', ': incoming_message_trigger >  4  ', () => {
  const trigger = {
    id: 'imt1',
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { variableName: 'user_input', autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([makeStartNode(), trigger, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H14'));
});

test('H15', ':     >  OK +  4 ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const nodes: any[] = [
    start,
    makeMessageNode('msg1', '!'),
    makeCommandTriggerNode('cmd1', '/help', 'msg2'),
    makeMessageNode('msg2', ''),
    makeTextTriggerNode('txt1', [''], 'msg3'),
    makeMessageNode('msg3', ''),
    makeConditionNode('cond1', 'score', [
      { value: '10', targetNodeId: 'msg4' },
      { value: '__else__', targetNodeId: 'msg5' },
    ]),
    makeMessageNode('msg4', ''),
    makeMessageNode('msg5', ''),
    makeMediaNode('media1', ['photo_id_xyz']),
  ];
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'H15');
  hasFourFixes(code);
  syntax(code, 'H15');
});

// ===============================================================================
//  I:     
// ===============================================================================

console.log('\n--  I:      -------------');

test('I01', 'sys.exit(0)      ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I01');
  ok(!code.includes('sys.exit(0)'), 'sys.exit(0)     !');
});

test('I02', 'import sys  signal_handler  ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I02');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler  ');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(!handlerBody.includes('import sys'), 'import sys   signal_handler  !');
});

test('I03', 'user_data    _user_last_seen (  )', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I03');
  ok(code.includes('user_data'), 'user_data    ');
  ok(code.includes('_user_last_seen'), '_user_last_seen       ');
});

test('I04', 'cleanup_user_data       5  ', () => {
  const projects = [
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')]),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/start', 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeTextTriggerNode('txt1', [''], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMediaNode('media1', ['photo_id'])]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true),
  ];
  for (let i = 0; i < projects.length; i++) {
    const code = i === 4 ? genDB(projects[i], `I04_${i}`) : gen(projects[i], `I04_${i}`);
    ok(code.includes('cleanup_user_data'), `cleanup_user_data    #${i + 1}`);
  }
});

test('I05', 'asyncio.create_task   1   main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I05');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main()  ');
  const mainBody = code.slice(mainIdx);
  const count = (mainBody.match(/asyncio\.create_task\(cleanup_user_data\(\)\)/g) || []).length;
  ok(count === 1, `asyncio.create_task(cleanup_user_data())  ${count} (),  1`);
});

test('I06', 'signal_handler   1 ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I06');
  const count = (code.match(/def signal_handler/g) || []).length;
  ok(count === 1, `signal_handler  ${count} (),  1`);
});

test('I07', 'USER_DATA_TTL   1 ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I07');
  const count = (code.match(/USER_DATA_TTL = 3600/g) || []).length;
  ok(count === 1, `USER_DATA_TTL = 3600  ${count} (),  1`);
});

test('I08', '_user_last_seen   1 ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I08');
  const count = (code.match(/_user_last_seen: dict\[int, float\] = \{\}/g) || []).length;
  ok(count === 1, `_user_last_seen: dict[int, float] = {}  ${count} (),  1`);
});

test('I09', 'cleanup_user_data   1 ', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I09');
  const count = (code.match(/async def cleanup_user_data\(\)/g) || []).length;
  ok(count === 1, `async def cleanup_user_data()  ${count} (),  1`);
});

test('I10', ' Python OK  10   ', () => {
  const projects = [
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')]),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/start', 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeTextTriggerNode('txt1', [''], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMediaNode('media1', ['photo_id'])]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/help', 'msg1'), makeMessageNode('msg1')], true),
    makeCleanProject([
      makeStartNode(),
      makeConditionNode('cond1', 'x', [{ value: '1', targetNodeId: 'msg1' }, { value: '__else__', targetNodeId: 'msg2' }]),
      makeMessageNode('msg1', ''),
      makeMessageNode('msg2', ''),
    ]),
    makeCleanProject([makeTextTriggerNode('txt1', ['', 'stop', ''], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1', '?? !')]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1', '  ""  \'\'')]),
  ];
  for (let i = 0; i < projects.length; i++) {
    const code = i === 4 || i === 5 ? genDB(projects[i], `I10_${i}`) : gen(projects[i], `I10_${i}`);
    syntax(code, `I10_${i}`);
  }
});

// ===============================================================================
//  J:  
// ===============================================================================

console.log('\n--  J:   ------------------------------------');

test('J01', '  ( ) >  4  ', () => {
  const p = makeCleanProject([]);
  hasFourFixes(gen(p, 'J01'));
});

test('J02', '   keyboard  >  4  ', () => {
  const kbd = {
    id: 'kbd1',
    type: 'keyboard',
    position: { x: 0, y: 0 },
    data: { keyboardType: 'reply', buttons: [{ id: 'b1', text: '', action: 'goto', target: 'kbd1' }] },
  };
  const p = makeCleanProject([kbd]);
  hasFourFixes(gen(p, 'J02'));
});

test('J03', '  20  >  OK +  4 ', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 19; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `  ${i}`));
  }
  const p = makeCleanProject(nodes);
  const code = gen(p, 'J03');
  hasFourFixes(code);
  syntax(code, 'J03');
});

test('J04', '  Unicode   >  4  ', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMessageNode('msg1', '?? ! ?? ????? ?? Nono'),
    makeMessageNode('msg2', '????????????'),
  ]);
  hasFourFixes(gen(p, 'J04'));
});

test('J05', '    ID  >  4  ', () => {
  const longId1 = 'node_' + 'a'.repeat(50);
  const longId2 = 'node_' + 'b'.repeat(50);
  const p = makeCleanProject([
    makeStartNode(longId1),
    makeMessageNode(longId2, ''),
  ]);
  hasFourFixes(gen(p, 'J05'));
});

test('J06', '  adminOnly    >  4  ', () => {
  const cmd1 = makeCommandTriggerNode('cmd1', '/admin1', 'msg1');
  const cmd2 = makeCommandTriggerNode('cmd2', '/admin2', 'msg2');
  cmd1.data = { ...cmd1.data, adminOnly: true } as any;
  cmd2.data = { ...cmd2.data, adminOnly: true } as any;
  const p = makeCleanProject([
    cmd1, makeMessageNode('msg1', ' 1'),
    cmd2, makeMessageNode('msg2', ' 2'),
  ]);
  hasFourFixes(gen(p, 'J06'));
});

test('J07', '  requiresAuth    >  4  ', () => {
  const cmd1 = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  const cmd2 = makeCommandTriggerNode('cmd2', '/settings', 'msg2');
  cmd1.data = { ...cmd1.data, requiresAuth: true } as any;
  cmd2.data = { ...cmd2.data, requiresAuth: true } as any;
  const p = makeCleanProject([
    cmd1, makeMessageNode('msg1', ''),
    cmd2, makeMessageNode('msg2', ''),
  ]);
  hasFourFixes(gen(p, 'J07'));
});

test('J08', '  DB + 10  >  OK +  4 ', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 9; i++) {
    nodes.push(makeMessageNode(`msg${i}`, ` ${i}`));
  }
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'J08');
  hasFourFixes(code);
  syntax(code, 'J08');
});

test('J09', '  multi-sheet ( ) >  4  ', () => {
  const p = {
    version: 2,
    activeSheetId: 'sheet1',
    userDatabaseEnabled: false,
    sheets: [
      {
        id: 'sheet1',
        name: ' 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { zoom: 1, position: { x: 0, y: 0 } },
        nodes: [makeStartNode(), makeMessageNode('msg1', ' 1')],
      },
      {
        id: 'sheet2',
        name: ' 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { zoom: 1, position: { x: 0, y: 0 } },
        nodes: [makeCommandTriggerNode('cmd1', '/help', 'msg2'), makeMessageNode('msg2', '')],
      },
    ],
  };
  hasFourFixes(gen(p, 'J09'));
});

test('J10', ' :   + DB + adminOnly + requiresAuth >  OK +  4 ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: '', action: 'goto', target: 'msg1' }],
  } as any;
  const cmdAdmin = makeCommandTriggerNode('cmd_admin', '/admin', 'msg_admin');
  cmdAdmin.data = { ...cmdAdmin.data, adminOnly: true } as any;
  const cmdAuth = makeCommandTriggerNode('cmd_auth', '/profile', 'msg_auth');
  cmdAuth.data = { ...cmdAuth.data, requiresAuth: true } as any;
  const nodes: any[] = [
    start,
    makeMessageNode('msg1', ' ! ??'),
    cmdAdmin,
    makeMessageNode('msg_admin', ' '),
    cmdAuth,
    makeMessageNode('msg_auth', ' '),
    makeTextTriggerNode('txt1', ['', 'help', '?'], 'msg_help'),
    makeMessageNode('msg_help', '  '),
    makeConditionNode('cond1', 'user_level', [
      { value: 'vip', targetNodeId: 'msg_vip' },
      { value: '__else__', targetNodeId: 'msg_regular' },
    ]),
    makeMessageNode('msg_vip', '? VIP-'),
    makeMessageNode('msg_regular', ' '),
    makeMediaNode('media1', ['photo_id_welcome_banner']),
  ];
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'J10');
  hasFourFixes(code);
  syntax(code, 'J10');
});

// ---  --------------------------------------------------------------------

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n==============================================================');
const summary = `  : ${passed}/${total}   |  : ${failed}`;
const padding = ' '.repeat(Math.max(0, 62 - summary.length));
console.log(`${summary}${padding}`);
console.log('L==============================================================-');

if (failed > 0) {
  console.log('\n :');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ? ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
