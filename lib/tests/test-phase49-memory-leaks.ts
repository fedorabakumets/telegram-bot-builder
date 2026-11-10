/**
 * @fileoverview Ôàçà — Óòå÷êè ïàìÿòè (Memory Leaks)
 *
 * Òåñòèðóåò òðè èñïðàâëåíèÿ óòå÷åê ïàìÿòè:
 *  1. USER_DATA_TTL + _user_last_seen + cleanup_user_data (utils.py.jinja2)
 *  2. asyncio.create_task(cleanup_user_data()) â main() (main.py.jinja2)
 *  3. signal_handler èñïîëüçóåò loop.stop() âìåñòî sys.exit(0) (main.py.jinja2)
 *  4. templateCache îãðàíè÷åí MAX_CACHE_SIZE = 100 (template-renderer.ts)
 *
 * Áëîêè:
 *  A. USER_DATA_TTL êîíñòàíòà (10 òåñòîâ)
 *  B. _user_last_seen ñëîâàðü (10 òåñòîâ)
 *  C. cleanup_user_data ôóíêöèÿ (15 òåñòîâ)
 *  D. asyncio.create_task(cleanup_user_data()) â main() (10 òåñòîâ)
 *  E. signal_handler — loop.stop() âìåñòî sys.exit() (15 òåñòîâ)
 *  F. finally áëîê — êîððåêòíîå çàêðûòèå ñîåäèíåíèé (10 òåñòîâ)
 *  G. templateCache îãðàíè÷åíèå (10 òåñòîâ)
 *  H. Êîìáèíàöèè — ïîëíûå ïðîåêòû (15 òåñòîâ)
 *  I. Ðåãðåññèÿ — ñòàðûå ïàòòåðíû îòñóòñòâóþò (10 òåñòîâ)
 *  J. Ãðàíè÷íûå ñëó÷àè (10 òåñòîâ)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { renderPartialTemplate } from '../templates/template-renderer.ts';

// --- Âñïîìîãàòåëüíûå óçëû ----------------------------------------------------

/**
 * Ñîçäà¸ò óçåë òèïà start
 * @param id - Èäåíòèôèêàòîð óçëà
 */
function makeStartNode(id = 'start1') {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Ïðèâåò', keyboardType: 'none', buttons: [] },
  };
}

/**
 * Ñîçäà¸ò óçåë òèïà message
 * @param id - Èäåíòèôèêàòîð óçëà
 * @param text - Òåêñò ñîîáùåíèÿ
 */
function makeMessageNode(id: string, text = 'Îòâåò') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Ñîçäà¸ò óçåë òèïà command_trigger
 * @param id - Èäåíòèôèêàòîð óçëà
 * @param command - Êîìàíäà áîòà
 * @param targetId - ID öåëåâîãî óçëà
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: 'Êîìàíäà',
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
 * Ñîçäà¸ò óçåë òèïà text_trigger
 * @param id - Èäåíòèôèêàòîð óçëà
 * @param synonyms - Ñïèñîê ñèíîíèìîâ
 * @param targetId - ID öåëåâîãî óçëà
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
 * Ñîçäà¸ò óçåë òèïà condition
 * @param id - Èäåíòèôèêàòîð óçëà
 * @param variable - Ïåðåìåííàÿ óñëîâèÿ
 * @param branches - Âåòêè óñëîâèÿ
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
 * Ñîçäà¸ò óçåë òèïà media
 * @param id - Èäåíòèôèêàòîð óçëà
 * @param media - Ñïèñîê ìåäèàôàéëîâ
 */
function makeMediaNode(id: string, media: string[]) {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: { attachedMedia: media, buttons: [], keyboardType: 'none', enableAutoTransition: false, autoTransitionTo: '' },
  };
}

// --- Óòèëèòû ãåíåðàöèè -------------------------------------------------------

/**
 * Ñîçäà¸ò ìèíèìàëüíûé project.json ñ çàäàííûìè óçëàìè
 * @param nodes - Ìàññèâ óçëîâ
 * @param userDatabaseEnabled - Âêëþ÷èòü ÁÄ
 */
function makeCleanProject(nodes: any[], userDatabaseEnabled = false) {
  return {
    version: 2,
    activeSheetId: 'sheet-ml',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-ml',
      name: 'Îñíîâíîé ïîòîê',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/**
 * Ãåíåðèðóåò Python-êîä èç ïðîåêòà
 * @param project - Îáúåêò ïðîåêòà
 * @param label - Ìåòêà äëÿ èìåíè áîòà
 * @param userDatabaseEnabled - Âêëþ÷èòü ÁÄ
 */
function gen(project: any, label: string, userDatabaseEnabled = false): string {
  return generatePythonCode(project, {
    botName: `MemLeak_${label}`,
    userDatabaseEnabled,
    });
}

/**
 * Ãåíåðèðóåò Python-êîä ñ âêëþ÷¸ííîé ÁÄ
 * @param project - Îáúåêò ïðîåêòà
 * @param label - Ìåòêà äëÿ èìåíè áîòà
 */
function genDB(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `MemLeakDB_${label}`,
    userDatabaseEnabled: true,
    });
}

/**
 * Ïðîâåðÿåò ñèíòàêñèñ Python-êîäà ÷åðåç py_compile
 * @param code - Python-êîä
 * @param label - Ìåòêà äëÿ âðåìåííîãî ôàéëà
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

// --- Òåñò-ðàííåð -------------------------------------------------------------

/** Ðåçóëüòàò îäíîãî òåñòà */
type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Çàïóñêàåò îäèí òåñò è çàïèñûâàåò ðåçóëüòàò
 * @param id - Èäåíòèôèêàòîð òåñòà
 * @param name - Íàçâàíèå òåñòà
 * @param fn - Òåëî òåñòà
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
 * Óòâåðæäåíèå — áðîñàåò îøèáêó åñëè óñëîâèå ëîæíî
 * @param cond - Óñëîâèå
 * @param msg - Ñîîáùåíèå îá îøèáêå
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Ïðîâåðÿåò ñèíòàêñèñ Python è áðîñàåò îøèáêó ïðè íåóäà÷å
 * @param code - Python-êîä
 * @param label - Ìåòêà äëÿ âðåìåííîãî ôàéëà
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Ñèíòàêñè÷åñêàÿ îøèáêà Python:\n${r.error}`);
}

// --- ×åòûðå êëþ÷åâûõ ôèêñà ---------------------------------------------------

/** Ïðîâåðÿåò íàëè÷èå âñåõ ÷åòûð¸õ èñïðàâëåíèé óòå÷åê ïàìÿòè â êîäå */
function hasFourFixes(code: string): void {
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò');
  ok(code.includes('cleanup_user_data'), 'cleanup_user_data îòñóòñòâóåò');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'asyncio.create_task(cleanup_user_data()) îòñóòñòâóåò');
  ok(code.includes('_stop_event.set()'), 'asyncio.get_running_loop().stop() îòñóòñòâóåò');
}

// ===============================================================================
// ÁËÎÊ A: USER_DATA_TTL êîíñòàíòà
// ===============================================================================

console.log('\nã==============================================================¬');
console.log('¦       Ôàçà — Óòå÷êè ïàìÿòè (Memory Leaks)                   ¦');
console.log('L==============================================================-\n');

console.log('-- Áëîê A: USER_DATA_TTL êîíñòàíòà -----------------------------');

test('A01', 'USER_DATA_TTL = 3600 ïðèñóòñòâóåò â êîäå', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'A01');
  ok(code.includes('USER_DATA_TTL = 3600'), 'USER_DATA_TTL = 3600 íå íàéäåíî');
});

test('A02', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè userDatabaseEnabled: true', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'A02');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè DB=true');
});

test('A03', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè userDatabaseEnabled: false', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'A03');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè DB=false');
});

test('A04', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè ïðîåêòå ñ inline êíîïêàìè', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Êíîïêà', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'A04');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè inline êíîïêàõ');
});

test('A05', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè ïðîåêòå ñ reply êíîïêàìè', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: 'Ìåíþ', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'A05');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè reply êíîïêàõ');
});

test('A06', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè ïðîåêòå ñ command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'A06');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè command_trigger');
});

test('A07', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè ïðîåêòå ñ text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['ïðèâåò', 'hello'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'A07');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè text_trigger');
});

test('A08', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè ïðîåêòå ñ condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'user_name', [
      { value: 'admin', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Ïðèâåò, admin!'),
    makeMessageNode('msg2', 'Ïðèâåò!'),
  ]);
  const code = gen(p, 'A08');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè condition');
});

test('A09', 'USER_DATA_TTL ïðèñóòñòâóåò ïðè ïðîåêòå ñ media óçëîì', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['photo_id_123']),
  ]);
  const code = gen(p, 'A09');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò ïðè media óçëå');
});

test('A10', 'Ñèíòàêñèñ Python OK ïðè íàëè÷èè USER_DATA_TTL', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'A10');
  ok(code.includes('USER_DATA_TTL'), 'USER_DATA_TTL îòñóòñòâóåò');
  syntax(code, 'A10');
});

// ===============================================================================
// ÁËÎÊ B: _user_last_seen ñëîâàðü
// ===============================================================================

console.log('\n-- Áëîê B: _user_last_seen ñëîâàðü -----------------------------');

test('B01', '_user_last_seen: dict[int, float] = {} ïðèñóòñòâóåò â êîäå', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B01');
  ok(code.includes('_user_last_seen: dict[int, float] = {}'), '_user_last_seen: dict[int, float] = {} íå íàéäåíî');
});

test('B02', '_user_last_seen ïðèñóòñòâóåò ïðè DB âêëþ÷¸í', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'B02');
  ok(code.includes('_user_last_seen'), '_user_last_seen îòñóòñòâóåò ïðè DB=true');
});

test('B03', '_user_last_seen ïðèñóòñòâóåò ïðè DB âûêëþ÷åí', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'B03');
  ok(code.includes('_user_last_seen'), '_user_last_seen îòñóòñòâóåò ïðè DB=false');
});

test('B04', '_user_last_seen[user_id] = time.monotonic() ïðèñóòñòâóåò â init_user_variables', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B04');
  ok(code.includes('_user_last_seen[user_id] = time.monotonic()'), '_user_last_seen[user_id] = time.monotonic() íå íàéäåíî');
});

test('B05', '_user_last_seen îáíîâëÿåòñÿ â òåëå init_user_variables', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B05');
  const initIdx = code.indexOf('async def init_user_variables');
  ok(initIdx !== -1, 'init_user_variables íå íàéäåíà');
  const afterInit = code.slice(initIdx, initIdx + 600);
  ok(afterInit.includes('_user_last_seen'), '_user_last_seen íå íàéäåí â òåëå init_user_variables');
});

test('B06', '_user_last_seen.items() èñïîëüçóåòñÿ â cleanup_user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B06');
  ok(code.includes('_user_last_seen.items()'), '_user_last_seen.items() íå íàéäåíî');
});

test('B07', '_user_last_seen.pop(uid, None) ïðèñóòñòâóåò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B07');
  ok(code.includes('_user_last_seen.pop(uid, None)'), '_user_last_seen.pop(uid, None) íå íàéäåíî');
});

test('B08', '_user_last_seen ïðèñóòñòâóåò ïðè ïðîåêòå ñ adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'B08');
  ok(code.includes('_user_last_seen'), '_user_last_seen îòñóòñòâóåò ïðè adminOnly');
});

test('B09', '_user_last_seen ïðèñóòñòâóåò ïðè ïðîåêòå ñ requiresAuth', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'B09');
  ok(code.includes('_user_last_seen'), '_user_last_seen îòñóòñòâóåò ïðè requiresAuth');
});

test('B10', 'Ñèíòàêñèñ Python OK ïðè íàëè÷èè _user_last_seen', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'B10');
  ok(code.includes('_user_last_seen'), '_user_last_seen îòñóòñòâóåò');
  syntax(code, 'B10');
});

// ===============================================================================
// ÁËÎÊ C: cleanup_user_data ôóíêöèÿ
// ===============================================================================

console.log('\n-- Áëîê C: cleanup_user_data ôóíêöèÿ ---------------------------');

test('C01', 'async def cleanup_user_data() ïðèñóòñòâóåò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C01');
  ok(code.includes('async def cleanup_user_data()'), 'async def cleanup_user_data() íå íàéäåíî');
});

test('C02', 'cleanup_user_data ñîäåðæèò while True:', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C02');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data íå íàéäåíà');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('while True:'), 'while True: íå íàéäåíî â cleanup_user_data');
});

test('C03', 'cleanup_user_data ñîäåðæèò await asyncio.sleep(USER_DATA_TTL)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C03');
  ok(code.includes('await asyncio.sleep(USER_DATA_TTL)'), 'await asyncio.sleep(USER_DATA_TTL) íå íàéäåíî');
});

test('C04', 'cleanup_user_data ñîäåðæèò time.monotonic()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C04');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data íå íàéäåíà');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('time.monotonic()'), 'time.monotonic() íå íàéäåíî â cleanup_user_data');
});

test('C05', 'cleanup_user_data ñîäåðæèò user_data.pop(uid, None)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C05');
  ok(code.includes('user_data.pop(uid, None)'), 'user_data.pop(uid, None) íå íàéäåíî');
});

test('C06', 'cleanup_user_data ñîäåðæèò _user_last_seen.pop(uid, None)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C06');
  ok(code.includes('_user_last_seen.pop(uid, None)'), '_user_last_seen.pop(uid, None) íå íàéäåíî');
});

test('C07', 'cleanup_user_data ñîäåðæèò logging.debug', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C07');
  const fnIdx = code.indexOf('async def cleanup_user_data()');
  ok(fnIdx !== -1, 'cleanup_user_data íå íàéäåíà');
  const fnBody = code.slice(fnIdx, fnIdx + 800);
  ok(fnBody.includes('logging.debug'), 'logging.debug íå íàéäåíî â cleanup_user_data');
});

test('C08', 'cleanup_user_data uses USER_DATA_TTL and _user_last_seen', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C08');
  const cleanupIdx = code.indexOf('async def cleanup_user_data');
  ok(cleanupIdx !== -1, 'cleanup_user_data not found');
  const cleanupBody = code.slice(cleanupIdx, cleanupIdx + 800);
  ok(cleanupBody.includes('USER_DATA_TTL') && cleanupBody.includes('_user_last_seen'), 'TTL cleanup logic missing');
});

test('C09', 'cleanup_user_data ïðèñóòñòâóåò ïðè DB âêëþ÷¸í', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'C09');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò ïðè DB=true');
});

test('C10', 'cleanup_user_data ïðèñóòñòâóåò ïðè DB âûêëþ÷åí', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'C10');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò ïðè DB=false');
});

test('C11', 'cleanup_user_data ïðèñóòñòâóåò ïðè ïðîåêòå ñ inline êíîïêàìè', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Äàëåå', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'C11');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò ïðè inline êíîïêàõ');
});

test('C12', 'cleanup_user_data ïðèñóòñòâóåò ïðè ïðîåêòå ñ 10 óçëàìè', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 9; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `Ñîîáùåíèå ${i}`));
  }
  const p = makeCleanProject(nodes);
  const code = gen(p, 'C12');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò ïðè 10 óçëàõ');
});

test('C13', 'cleanup_user_data ïðèñóòñòâóåò ïðè ïðîåêòå ñ command_trigger + message', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Ïðèâåò!'),
  ]);
  const code = gen(p, 'C13');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò ïðè command_trigger');
});

test('C14', 'cleanup_user_data ïðèñóòñòâóåò ïðè ïðîåêòå ñ condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'score', [
      { value: '100', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Ïîáåäà!'),
    makeMessageNode('msg2', 'Ïîïðîáóé åù¸'),
  ]);
  const code = gen(p, 'C14');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò ïðè condition');
});

test('C15', 'Ñèíòàêñèñ Python OK ïðè íàëè÷èè cleanup_user_data', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'C15');
  ok(code.includes('async def cleanup_user_data()'), 'cleanup_user_data îòñóòñòâóåò');
  syntax(code, 'C15');
});

// ===============================================================================
// ÁËÎÊ D: asyncio.create_task(cleanup_user_data()) â main()
// ===============================================================================

console.log('\n-- Áëîê D: asyncio.create_task(cleanup_user_data()) â main() ---');

test('D01', 'asyncio.create_task(cleanup_user_data()) ïðèñóòñòâóåò â êîäå', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D01');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'asyncio.create_task(cleanup_user_data()) íå íàéäåíî');
});

test('D02', 'Âûçîâ íàõîäèòñÿ âíóòðè async def main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D02');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() íå íàéäåíà');
  const mainBody = code.slice(mainIdx);
  ok(mainBody.includes('asyncio.create_task(cleanup_user_data())'), 'create_task íå íàéäåí âíóòðè main()');
});

test('D03', 'Âûçîâ ïðèñóòñòâóåò ïðè DB âêëþ÷¸í', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'D03');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè DB=true');
});

test('D04', 'Âûçîâ ïðèñóòñòâóåò ïðè DB âûêëþ÷åí', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'D04');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè DB=false');
});

test('D05', 'Âûçîâ ïðèñóòñòâóåò ïðè ïðîåêòå ñ inline êíîïêàìè', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Êíîïêà', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'D05');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè inline êíîïêàõ');
});

test('D06', 'Âûçîâ ïðèñóòñòâóåò ïðè ïðîåêòå ñ command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/help', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'D06');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè command_trigger');
});

test('D07', 'Âûçîâ ïðèñóòñòâóåò ïðè ïðîåêòå ñ text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['äà', 'íåò'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'D07');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè text_trigger');
});

test('D08', 'Âûçîâ ïðèñóòñòâóåò ïðè ïðîåêòå ñ adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'D08');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè adminOnly');
});

test('D09', 'Âûçîâ ïðèñóòñòâóåò ïðè ïðîåêòå ñ requiresAuth', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  cmd.data = { ...cmd.data, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'D09');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò ïðè requiresAuth');
});

test('D10', 'Ñèíòàêñèñ Python OK ïðè íàëè÷èè create_task', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'D10');
  ok(code.includes('asyncio.create_task(cleanup_user_data())'), 'create_task îòñóòñòâóåò');
  syntax(code, 'D10');
});

// ===============================================================================
// ÁËÎÊ E: signal_handler — loop.stop() âìåñòî sys.exit()
// ===============================================================================

console.log('\n-- Áëîê E: signal_handler — loop.stop() âìåñòî sys.exit() -----');

test('E01', 'asyncio.get_running_loop().stop() ïðèñóòñòâóåò â êîäå', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E01');
  ok(code.includes('_stop_event.set()'), 'asyncio.get_running_loop().stop() íå íàéäåíî');
});

test('E02', 'sys.exit(0) ÍÅ ïðèñóòñòâóåò â signal_handler', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E02');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler íå íàéäåí');
  // Áåð¸ì òåëî ôóíêöèè (äî ñëåäóþùåé def íà òîì æå óðîâíå)
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(!handlerBody.includes('sys.exit(0)'), 'sys.exit(0) íàéäåíî â signal_handler — ðåãðåññèÿ!');
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

test('E06', 'signal.signal(signal.SIGTERM, signal_handler) ïðèñóòñòâóåò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E06');
  ok(code.includes('signal.signal(signal.SIGTERM, signal_handler)'), 'SIGTERM ðåãèñòðàöèÿ íå íàéäåíà');
});

test('E07', 'signal.signal(signal.SIGINT, signal_handler) ïðèñóòñòâóåò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E07');
  ok(code.includes('signal.signal(signal.SIGINT, signal_handler)'), 'SIGINT ðåãèñòðàöèÿ íå íàéäåíà');
});

test('E08', 'signal_handler ïðèñóòñòâóåò ïðè DB âêëþ÷¸í', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'E08');
  ok(code.includes('def signal_handler'), 'signal_handler îòñóòñòâóåò ïðè DB=true');
});

test('E09', 'signal_handler ïðèñóòñòâóåò ïðè DB âûêëþ÷åí', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'E09');
  ok(code.includes('def signal_handler'), 'signal_handler îòñóòñòâóåò ïðè DB=false');
});

test('E10', 'asyncio.get_running_loop().stop() ïðèñóòñòâóåò ïðè inline êíîïêàõ', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Êíîïêà', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'E10');
  ok(code.includes('_stop_event.set()'), 'loop.stop() îòñóòñòâóåò ïðè inline êíîïêàõ');
});

test('E11', 'asyncio.get_running_loop().stop() ïðèñóòñòâóåò ïðè command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'E11');
  ok(code.includes('_stop_event.set()'), 'loop.stop() îòñóòñòâóåò ïðè command_trigger');
});

test('E12', 'asyncio.get_running_loop().stop() ïðèñóòñòâóåò ïðè text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['ñòîï', 'stop'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'E12');
  ok(code.includes('_stop_event.set()'), 'loop.stop() îòñóòñòâóåò ïðè text_trigger');
});

test('E13', 'asyncio.get_running_loop().stop() ïðèñóòñòâóåò ïðè condition', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'level', [
      { value: '1', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Óðîâåíü 1'),
    makeMessageNode('msg2', 'Äðóãîé óðîâåíü'),
  ]);
  const code = gen(p, 'E13');
  ok(code.includes('_stop_event.set()'), 'loop.stop() îòñóòñòâóåò ïðè condition');
});

test('E14', 'asyncio.get_running_loop().stop() ïðèñóòñòâóåò ïðè media', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['AgACAgIAAxkBAAIBcmJ']),
  ]);
  const code = gen(p, 'E14');
  ok(code.includes('_stop_event.set()'), 'loop.stop() îòñóòñòâóåò ïðè media');
});

test('E15', 'Ñèíòàêñèñ Python OK ïðè íàëè÷èè signal_handler ñ loop.stop()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'E15');
  ok(code.includes('_stop_event.set()'), 'loop.stop() îòñóòñòâóåò');
  syntax(code, 'E15');
});

// ===============================================================================
// ÁËÎÊ F: finally áëîê — êîððåêòíîå çàêðûòèå ñîåäèíåíèé
// ===============================================================================

console.log('\n-- Áëîê F: finally áëîê — êîððåêòíîå çàêðûòèå ñîåäèíåíèé -------');

test('F01', 'finally: ïðèñóòñòâóåò â main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F01');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() íå íàéäåíà');
  const mainBody = code.slice(mainIdx);
  ok(mainBody.includes('finally:'), 'finally: íå íàéäåíî â main()');
});

test('F02', 'await bot.session.close() ïðèñóòñòâóåò â finally', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F02');
  ok(code.includes('await bot.session.close()'), 'await bot.session.close() íå íàéäåíî');
});

test('F03', 'Ïðè DB âêëþ÷¸í: await db_pool.close() ïðèñóòñòâóåò â finally', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'F03');
  ok(code.includes('await db_pool.close()'), 'await db_pool.close() íå íàéäåíî ïðè DB=true');
});

test('F04', 'Ïðè DB âûêëþ÷åí: db_pool.close() ÍÅ ïðèñóòñòâóåò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], false);
  const code = gen(p, 'F04');
  ok(!code.includes('db_pool.close()'), 'db_pool.close() íàéäåíî ïðè DB=false — ëèøíèé êîä');
});

test('F05', 'finally èä¸ò ÏÎÑËÅ except áëîêîâ (ïîðÿäîê èíäåêñîâ)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'F05');
  const exceptIdx = code.indexOf('except KeyboardInterrupt:');
  // Проверяем внешний finally функции main, так как внутри polling есть свой finally.
  const finallyIdx = code.indexOf('    finally:\n        _bot_stop_event = None');
  ok(exceptIdx !== -1, 'except KeyboardInterrupt: íå íàéäåíî');
  ok(finallyIdx !== -1, 'finally: íå íàéäåíî');
  ok(finallyIdx > exceptIdx, 'finally äîëæåí èäòè ïîñëå except');
});

test('F06', 'finally ïðèñóòñòâóåò ïðè ïðîåêòå ñ inline êíîïêàìè', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Êíîïêà', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  const code = gen(p, 'F06');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: îòñóòñòâóåò ïðè inline êíîïêàõ');
});

test('F07', 'finally ïðèñóòñòâóåò ïðè ïðîåêòå ñ command_trigger', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'F07');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: îòñóòñòâóåò ïðè command_trigger');
});

test('F08', 'finally ïðèñóòñòâóåò ïðè ïðîåêòå ñ text_trigger', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['ïðèâåò'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'F08');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: îòñóòñòâóåò ïðè text_trigger');
});

test('F09', 'finally ïðèñóòñòâóåò ïðè ïðîåêòå ñ adminOnly', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/admin', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1')]);
  const code = gen(p, 'F09');
  const mainBody = code.slice(code.indexOf('async def main()'));
  ok(mainBody.includes('finally:'), 'finally: îòñóòñòâóåò ïðè adminOnly');
});

test('F10', 'Ñèíòàêñèñ Python OK ïðè íàëè÷èè finally áëîêà', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  const code = genDB(p, 'F10');
  ok(code.includes('finally:'), 'finally: îòñóòñòâóåò');
  syntax(code, 'F10');
});

// ===============================================================================
// ÁËÎÊ G: templateCache îãðàíè÷åíèå
// ===============================================================================

console.log('\n-- Áëîê G: templateCache îãðàíè÷åíèå ---------------------------');

test('G01', 'MAX_CACHE_SIZE = 100 ïðèñóòñòâóåò â èñõîäíèêå template-renderer.ts', () => {
  const src = fs.readFileSync('lib/templates/template-renderer.ts', 'utf-8');
  ok(src.includes('MAX_CACHE_SIZE = 100'), 'MAX_CACHE_SIZE = 100 íå íàéäåíî â template-renderer.ts');
});

test('G02', 'renderPartialTemplate 5 ðàç ñ ðàçíûìè øàáëîíàìè íå ïàäàåò', () => {
  const templates = [
    ['utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false }],
    ['utils/utils.py.jinja2', { adminOnly: true, userDatabaseEnabled: false }],
    ['utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: true }],
    ['main/main.py.jinja2', { userDatabaseEnabled: false, menuCommands: [], autoRegisterUsers: false, incomingMessageTriggerMiddlewares: [], hasInlineButtons: false }],
    ['main/main.py.jinja2', { userDatabaseEnabled: true, menuCommands: [], autoRegisterUsers: false, incomingMessageTriggerMiddlewares: [], hasInlineButtons: false }],
  ] as const;
  for (const [tmpl, ctx] of templates) {
    const result = renderPartialTemplate(tmpl, ctx as any);
    ok(typeof result === 'string' && result.length > 0, `renderPartialTemplate(${tmpl}) âåðíóë ïóñòîé ðåçóëüòàò`);
  }
});

test('G03', 'renderPartialTemplate ñ îäíèì øàáëîíîì äâàæäû âîçâðàùàåò îäèíàêîâûé ðåçóëüòàò', () => {
  const ctx = { adminOnly: false, userDatabaseEnabled: false };
  const r1 = renderPartialTemplate('utils/utils.py.jinja2', ctx);
  const r2 = renderPartialTemplate('utils/utils.py.jinja2', ctx);
  ok(r1 === r2, 'Äâà âûçîâà ñ îäèíàêîâûì êîíòåêñòîì âåðíóëè ðàçíûå ðåçóëüòàòû');
});

test('G04', 'renderPartialTemplate utils/utils.py.jinja2 ñîäåðæèò cleanup_user_data', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('cleanup_user_data'), 'cleanup_user_data íå íàéäåíî â utils.py.jinja2');
});

test('G05', 'renderPartialTemplate utils/utils.py.jinja2 ñ adminOnly:true ñîäåðæèò is_admin', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: true, userDatabaseEnabled: false });
  ok(result.includes('is_admin'), 'is_admin íå íàéäåíî ïðè adminOnly:true');
});

test('G06', 'renderPartialTemplate main/main.py.jinja2 ñîäåðæèò cleanup_user_data', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(result.includes('cleanup_user_data'), 'cleanup_user_data íå íàéäåíî â main.py.jinja2');
});

test('G07', 'renderPartialTemplate main/main.py.jinja2 ñîäåðæèò asyncio.get_running_loop().stop()', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(result.includes('_stop_event.set()'), 'loop.stop() �� ������� � main.py.jinja2');
});

test('G08', 'renderPartialTemplate main/main.py.jinja2 ÍÅ ñîäåðæèò sys.exit(0)', () => {
  const result = renderPartialTemplate('main/main.py.jinja2', {
    userDatabaseEnabled: false,
    menuCommands: [],
    autoRegisterUsers: false,
    incomingMessageTriggerMiddlewares: [],
    hasInlineButtons: false,
  });
  ok(!result.includes('sys.exit(0)'), 'sys.exit(0) íàéäåíî â main.py.jinja2 — ðåãðåññèÿ!');
});

test('G09', 'renderPartialTemplate utils/utils.py.jinja2 ñîäåðæèò USER_DATA_TTL', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('USER_DATA_TTL'), 'USER_DATA_TTL íå íàéäåíî â utils.py.jinja2');
});

test('G10', 'renderPartialTemplate utils/utils.py.jinja2 ñîäåðæèò _user_last_seen', () => {
  const result = renderPartialTemplate('utils/utils.py.jinja2', { adminOnly: false, userDatabaseEnabled: false });
  ok(result.includes('_user_last_seen'), '_user_last_seen íå íàéäåíî â utils.py.jinja2');
});

// ===============================================================================
// ÁËÎÊ H: Êîìáèíàöèè — ïîëíûå ïðîåêòû
// ===============================================================================

console.log('\n-- Áëîê H: Êîìáèíàöèè — ïîëíûå ïðîåêòû -------------------------');

test('H01', 'Ïðîåêò: start + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H01'));
});

test('H02', 'Ïðîåêò: command_trigger + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  hasFourFixes(gen(p, 'H02'));
});

test('H03', 'Ïðîåêò: text_trigger + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['ïðèâåò', 'hi'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  hasFourFixes(gen(p, 'H03'));
});

test('H04', 'Ïðîåêò: start + condition + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeConditionNode('cond1', 'age', [
      { value: '18', targetNodeId: 'msg1' },
      { value: '__else__', targetNodeId: 'msg2' },
    ]),
    makeMessageNode('msg1', 'Âçðîñëûé'),
    makeMessageNode('msg2', 'Íåñîâåðøåííîëåòíèé'),
  ]);
  hasFourFixes(gen(p, 'H04'));
});

test('H05', 'Ïðîåêò: start + inline keyboard + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Äàëåå', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H05'));
});

test('H06', 'Ïðîåêò: start + reply keyboard + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: 'Ìåíþ', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H06'));
});

test('H07', 'Ïðîåêò ñ DB: start + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true);
  hasFourFixes(genDB(p, 'H07'));
});

test('H08', 'Ïðîåêò ñ DB: command_trigger + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ], true);
  hasFourFixes(genDB(p, 'H08'));
});

test('H09', 'Ïðîåêò ñ DB + inline: start + message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Êíîïêà', action: 'goto', target: 'msg1' }],
  } as any;
  const p = makeCleanProject([start, makeMessageNode('msg1')], true);
  hasFourFixes(genDB(p, 'H09'));
});

test('H10', 'Ïðîåêò: 5 command_trigger + 5 message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const nodes: any[] = [];
  for (let i = 1; i <= 5; i++) {
    nodes.push(makeCommandTriggerNode(`cmd${i}`, `/cmd${i}`, `msg${i}`));
    nodes.push(makeMessageNode(`msg${i}`, `Îòâåò íà êîìàíäó ${i}`));
  }
  const p = makeCleanProject(nodes);
  hasFourFixes(gen(p, 'H10'));
});

test('H11', 'Ïðîåêò: adminOnly + requiresAuth > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const cmd = makeCommandTriggerNode('cmd1', '/secret', 'msg1');
  cmd.data = { ...cmd.data, adminOnly: true, requiresAuth: true } as any;
  const p = makeCleanProject([cmd, makeMessageNode('msg1', 'Ñåêðåòíûé ðàçäåë')]);
  hasFourFixes(gen(p, 'H11'));
});

test('H12', 'Ïðîåêò: media óçåë > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMediaNode('media1', ['photo_id_abc123']),
  ]);
  hasFourFixes(gen(p, 'H12'));
});

test('H13', 'Ïðîåêò: forward_message > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const fwd = {
    id: 'fwd1',
    type: 'forward_message',
    position: { x: 400, y: 0 },
    data: { fromChatId: '-100123456789', messageId: '42', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([makeStartNode(), fwd]);
  hasFourFixes(gen(p, 'H13'));
});

test('H14', 'Ïðîåêò: incoming_message_trigger > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const trigger = {
    id: 'imt1',
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { variableName: 'user_input', autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([makeStartNode(), trigger, makeMessageNode('msg1')]);
  hasFourFixes(gen(p, 'H14'));
});

test('H15', 'Ïðîåêò: âñå òèïû óçëîâ âìåñòå > ñèíòàêñèñ OK + âñå 4 ôèêñà', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Äàëåå', action: 'goto', target: 'msg1' }],
  } as any;
  const nodes: any[] = [
    start,
    makeMessageNode('msg1', 'Ïðèâåò!'),
    makeCommandTriggerNode('cmd1', '/help', 'msg2'),
    makeMessageNode('msg2', 'Ïîìîùü'),
    makeTextTriggerNode('txt1', ['ñòîï'], 'msg3'),
    makeMessageNode('msg3', 'Ñòîï'),
    makeConditionNode('cond1', 'score', [
      { value: '10', targetNodeId: 'msg4' },
      { value: '__else__', targetNodeId: 'msg5' },
    ]),
    makeMessageNode('msg4', 'Ïîáåäà'),
    makeMessageNode('msg5', 'Ïðîèãðûø'),
    makeMediaNode('media1', ['photo_id_xyz']),
  ];
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'H15');
  hasFourFixes(code);
  syntax(code, 'H15');
});

// ===============================================================================
// ÁËÎÊ I: Ðåãðåññèÿ — ñòàðûå ïàòòåðíû îòñóòñòâóþò
// ===============================================================================

console.log('\n-- Áëîê I: Ðåãðåññèÿ — ñòàðûå ïàòòåðíû îòñóòñòâóþò -------------');

test('I01', 'sys.exit(0) ÍÅ ïðèñóòñòâóåò íèãäå â ñãåíåðèðîâàííîì êîäå', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I01');
  ok(!code.includes('sys.exit(0)'), 'sys.exit(0) íàéäåíî â êîäå — ðåãðåññèÿ!');
});

test('I02', 'import sys âíóòðè signal_handler ÍÅ ïðèñóòñòâóåò', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I02');
  const handlerIdx = code.indexOf('def signal_handler');
  ok(handlerIdx !== -1, 'signal_handler íå íàéäåí');
  const handlerBody = code.slice(handlerIdx, handlerIdx + 400);
  ok(!handlerBody.includes('import sys'), 'import sys íàéäåíî âíóòðè signal_handler — ðåãðåññèÿ!');
});

test('I03', 'user_data íå èñïîëüçóåòñÿ áåç _user_last_seen (íåò áåñêîíå÷íîãî ðîñòà)', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I03');
  ok(code.includes('user_data'), 'user_data íå íàéäåíî â êîäå');
  ok(code.includes('_user_last_seen'), '_user_last_seen íå íàéäåíî — íåò çàùèòû îò óòå÷êè');
});

test('I04', 'cleanup_user_data ÍÅ îòñóòñòâóåò íè â îäíîì èç 5 ðàçíûõ ïðîåêòîâ', () => {
  const projects = [
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')]),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/start', 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeTextTriggerNode('txt1', ['ïðèâåò'], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMediaNode('media1', ['photo_id'])]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true),
  ];
  for (let i = 0; i < projects.length; i++) {
    const code = i === 4 ? genDB(projects[i], `I04_${i}`) : gen(projects[i], `I04_${i}`);
    ok(code.includes('cleanup_user_data'), `cleanup_user_data îòñóòñòâóåò â ïðîåêòå #${i + 1}`);
  }
});

test('I05', 'asyncio.create_task âûçûâàåòñÿ ðîâíî 1 ðàç â main()', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I05');
  const mainIdx = code.indexOf('async def main()');
  ok(mainIdx !== -1, 'async def main() íå íàéäåíà');
  const mainBody = code.slice(mainIdx);
  const count = (mainBody.match(/asyncio\.create_task\(cleanup_user_data\(\)\)/g) || []).length;
  ok(count === 1, `asyncio.create_task(cleanup_user_data()) âûçûâàåòñÿ ${count} ðàç(à), îæèäàåòñÿ 1`);
});

test('I06', 'signal_handler îïðåäåë¸í ðîâíî 1 ðàç', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I06');
  const count = (code.match(/def signal_handler/g) || []).length;
  ok(count === 1, `signal_handler îïðåäåë¸í ${count} ðàç(à), îæèäàåòñÿ 1`);
});

test('I07', 'USER_DATA_TTL îïðåäåë¸í ðîâíî 1 ðàç', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I07');
  const count = (code.match(/USER_DATA_TTL = 3600/g) || []).length;
  ok(count === 1, `USER_DATA_TTL = 3600 îïðåäåë¸í ${count} ðàç(à), îæèäàåòñÿ 1`);
});

test('I08', '_user_last_seen îïðåäåë¸í ðîâíî 1 ðàç', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I08');
  const count = (code.match(/_user_last_seen: dict\[int, float\] = \{\}/g) || []).length;
  ok(count === 1, `_user_last_seen: dict[int, float] = {} îïðåäåë¸í ${count} ðàç(à), îæèäàåòñÿ 1`);
});

test('I09', 'cleanup_user_data îïðåäåë¸í ðîâíî 1 ðàç', () => {
  const p = makeCleanProject([makeStartNode(), makeMessageNode('msg1')]);
  const code = gen(p, 'I09');
  const count = (code.match(/async def cleanup_user_data\(\)/g) || []).length;
  ok(count === 1, `async def cleanup_user_data() îïðåäåë¸í ${count} ðàç(à), îæèäàåòñÿ 1`);
});

test('I10', 'Ñèíòàêñèñ Python OK äëÿ 10 ðàçíûõ ïðîåêòîâ ïîäðÿä', () => {
  const projects = [
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')]),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/start', 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeTextTriggerNode('txt1', ['ïðèâåò'], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMediaNode('media1', ['photo_id'])]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1')], true),
    makeCleanProject([makeCommandTriggerNode('cmd1', '/help', 'msg1'), makeMessageNode('msg1')], true),
    makeCleanProject([
      makeStartNode(),
      makeConditionNode('cond1', 'x', [{ value: '1', targetNodeId: 'msg1' }, { value: '__else__', targetNodeId: 'msg2' }]),
      makeMessageNode('msg1', 'Äà'),
      makeMessageNode('msg2', 'Íåò'),
    ]),
    makeCleanProject([makeTextTriggerNode('txt1', ['ñòîï', 'stop', 'âûõîä'], 'msg1'), makeMessageNode('msg1')]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1', '?? Ïðèâåò!')]),
    makeCleanProject([makeStartNode(), makeMessageNode('msg1', 'Òåêñò ñ "êàâû÷êàìè" è \'àïîñòðîôàìè\'')]),
  ];
  for (let i = 0; i < projects.length; i++) {
    const code = i === 4 || i === 5 ? genDB(projects[i], `I10_${i}`) : gen(projects[i], `I10_${i}`);
    syntax(code, `I10_${i}`);
  }
});

// ===============================================================================
// ÁËÎÊ J: Ãðàíè÷íûå ñëó÷àè
// ===============================================================================

console.log('\n-- Áëîê J: Ãðàíè÷íûå ñëó÷àè ------------------------------------');

test('J01', 'Ïóñòîé ïðîåêò (íåò óçëîâ) > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([]);
  hasFourFixes(gen(p, 'J01'));
});

test('J02', 'Ïðîåêò òîëüêî ñ keyboard óçëîì > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const kbd = {
    id: 'kbd1',
    type: 'keyboard',
    position: { x: 0, y: 0 },
    data: { keyboardType: 'reply', buttons: [{ id: 'b1', text: 'Êíîïêà', action: 'goto', target: 'kbd1' }] },
  };
  const p = makeCleanProject([kbd]);
  hasFourFixes(gen(p, 'J02'));
});

test('J03', 'Ïðîåêò ñ 20 óçëàìè > ñèíòàêñèñ OK + âñå 4 ôèêñà', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 19; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `Ñîîáùåíèå íîìåð ${i}`));
  }
  const p = makeCleanProject(nodes);
  const code = gen(p, 'J03');
  hasFourFixes(code);
  syntax(code, 'J03');
});

test('J04', 'Ïðîåêò ñ Unicode â òåêñòàõ > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = makeCleanProject([
    makeStartNode(),
    makeMessageNode('msg1', '?? Ïðèâåò! ?? ????? ?? Nono'),
    makeMessageNode('msg2', '????????????'),
  ]);
  hasFourFixes(gen(p, 'J04'));
});

test('J05', 'Ïðîåêò ñ î÷åíü äëèííûìè ID óçëîâ > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const longId1 = 'node_' + 'a'.repeat(50);
  const longId2 = 'node_' + 'b'.repeat(50);
  const p = makeCleanProject([
    makeStartNode(longId1),
    makeMessageNode(longId2, 'Îòâåò'),
  ]);
  hasFourFixes(gen(p, 'J05'));
});

test('J06', 'Ïðîåêò ñ adminOnly íà âñåõ óçëàõ > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const cmd1 = makeCommandTriggerNode('cmd1', '/admin1', 'msg1');
  const cmd2 = makeCommandTriggerNode('cmd2', '/admin2', 'msg2');
  cmd1.data = { ...cmd1.data, adminOnly: true } as any;
  cmd2.data = { ...cmd2.data, adminOnly: true } as any;
  const p = makeCleanProject([
    cmd1, makeMessageNode('msg1', 'Ðàçäåë 1'),
    cmd2, makeMessageNode('msg2', 'Ðàçäåë 2'),
  ]);
  hasFourFixes(gen(p, 'J06'));
});

test('J07', 'Ïðîåêò ñ requiresAuth íà âñåõ óçëàõ > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const cmd1 = makeCommandTriggerNode('cmd1', '/profile', 'msg1');
  const cmd2 = makeCommandTriggerNode('cmd2', '/settings', 'msg2');
  cmd1.data = { ...cmd1.data, requiresAuth: true } as any;
  cmd2.data = { ...cmd2.data, requiresAuth: true } as any;
  const p = makeCleanProject([
    cmd1, makeMessageNode('msg1', 'Ïðîôèëü'),
    cmd2, makeMessageNode('msg2', 'Íàñòðîéêè'),
  ]);
  hasFourFixes(gen(p, 'J07'));
});

test('J08', 'Ïðîåêò ñ DB + 10 óçëîâ > ñèíòàêñèñ OK + âñå 4 ôèêñà', () => {
  const nodes: any[] = [makeStartNode()];
  for (let i = 1; i <= 9; i++) {
    nodes.push(makeMessageNode(`msg${i}`, `Ñîîáùåíèå ${i}`));
  }
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'J08');
  hasFourFixes(code);
  syntax(code, 'J08');
});

test('J09', 'Ïðîåêò ñ multi-sheet (íåñêîëüêî ëèñòîâ) > âñå 4 ôèêñà ïðèñóòñòâóþò', () => {
  const p = {
    version: 2,
    activeSheetId: 'sheet1',
    userDatabaseEnabled: false,
    sheets: [
      {
        id: 'sheet1',
        name: 'Ëèñò 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { zoom: 1, position: { x: 0, y: 0 } },
        nodes: [makeStartNode(), makeMessageNode('msg1', 'Ëèñò 1')],
      },
      {
        id: 'sheet2',
        name: 'Ëèñò 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewState: { zoom: 1, position: { x: 0, y: 0 } },
        nodes: [makeCommandTriggerNode('cmd1', '/help', 'msg2'), makeMessageNode('msg2', 'Ïîìîùü')],
      },
    ],
  };
  hasFourFixes(gen(p, 'J09'));
});

test('J10', 'Ôèíàëüíûé ìåãàòåñò: âñå òèïû + DB + adminOnly + requiresAuth > ñèíòàêñèñ OK + âñå 4 ôèêñà', () => {
  const start = makeStartNode();
  start.data = {
    ...start.data,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Äàëåå', action: 'goto', target: 'msg1' }],
  } as any;
  const cmdAdmin = makeCommandTriggerNode('cmd_admin', '/admin', 'msg_admin');
  cmdAdmin.data = { ...cmdAdmin.data, adminOnly: true } as any;
  const cmdAuth = makeCommandTriggerNode('cmd_auth', '/profile', 'msg_auth');
  cmdAuth.data = { ...cmdAuth.data, requiresAuth: true } as any;
  const nodes: any[] = [
    start,
    makeMessageNode('msg1', 'Äîáðî ïîæàëîâàòü! ??'),
    cmdAdmin,
    makeMessageNode('msg_admin', 'Ïàíåëü àäìèíèñòðàòîðà'),
    cmdAuth,
    makeMessageNode('msg_auth', 'Âàø ïðîôèëü'),
    makeTextTriggerNode('txt1', ['ïîìîùü', 'help', '?'], 'msg_help'),
    makeMessageNode('msg_help', 'Ñïðàâêà ïî áîòó'),
    makeConditionNode('cond1', 'user_level', [
      { value: 'vip', targetNodeId: 'msg_vip' },
      { value: '__else__', targetNodeId: 'msg_regular' },
    ]),
    makeMessageNode('msg_vip', '? VIP-ðàçäåë'),
    makeMessageNode('msg_regular', 'Îáû÷íûé ðàçäåë'),
    makeMediaNode('media1', ['photo_id_welcome_banner']),
  ];
  const p = makeCleanProject(nodes, true);
  const code = genDB(p, 'J10');
  hasFourFixes(code);
  syntax(code, 'J10');
});

// --- Èòîã --------------------------------------------------------------------

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\nã==============================================================¬');
const summary = `  Èòîã: ${passed}/${total} ïðîéäåíî  |  Ïðîâàëåíî: ${failed}`;
const padding = ' '.repeat(Math.max(0, 62 - summary.length));
console.log(`¦${summary}${padding}¦`);
console.log('L==============================================================-');

if (failed > 0) {
  console.log('\nÏðîâàëèâøèåñÿ òåñòû:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ? ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
