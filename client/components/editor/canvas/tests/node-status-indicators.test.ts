/**
 * Тесты для логики hasRequiredFields из canvas-node/node-status-indicators.tsx
 * Запуск: npx tsx client/components/editor/canvas/tests/node-status-indicators.test.ts
 */
export {};

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Воссоздание логики hasRequiredFields из node-status-indicators.tsx
function hasRequiredFields(node: { type: string; data: Record<string, any> }): boolean {
  switch (node.type) {
    case 'sticker': return !!(node.data.stickerUrl || node.data.stickerFileId);
    case 'voice': return !!node.data.voiceUrl;
    case 'location': return !!(node.data.latitude && node.data.longitude);
    case 'contact': return !!(node.data.phoneNumber && node.data.firstName);
    case 'command': return !!node.data.command;
    case 'admin_rights': return true;
    case 'broadcast': return true;
    default: return (node.type as any) === 'poll'
      ? !!(node.data.question && node.data.options?.length)
      : !!node.data.messageText;
  }
}

// ─── Блок A: admin_rights и broadcast всегда true ────────────────────────────
console.log('\nБлок A: admin_rights и broadcast всегда true (независимо от data)');

test('A1: admin_rights с пустым data → true', () => assert(hasRequiredFields({ type: 'admin_rights', data: {} }) === true, 'Ожидался true'));
test('A2: broadcast с пустым data → true', () => assert(hasRequiredFields({ type: 'broadcast', data: {} }) === true, 'Ожидался true'));
test('A3: admin_rights с любыми данными → true', () => assert(hasRequiredFields({ type: 'admin_rights', data: { messageText: '' } }) === true, 'Ожидался true'));
test('A4: broadcast с любыми данными → true', () => assert(hasRequiredFields({ type: 'broadcast', data: { messageText: '' } }) === true, 'Ожидался true'));
test('A5: admin_rights независимо от messageText → true', () => assert(hasRequiredFields({ type: 'admin_rights', data: { messageText: 'text' } }) === true, 'Ожидался true'));
test('A6: broadcast независимо от messageText → true', () => assert(hasRequiredFields({ type: 'broadcast', data: { messageText: 'text' } }) === true, 'Ожидался true'));
test('A7: admin_rights с null полями → true', () => assert(hasRequiredFields({ type: 'admin_rights', data: { voiceUrl: null } }) === true, 'Ожидался true'));
test('A8: broadcast с null полями → true', () => assert(hasRequiredFields({ type: 'broadcast', data: { voiceUrl: null } }) === true, 'Ожидался true'));

// ─── Блок B: sticker ─────────────────────────────────────────────────────────
console.log('\nБлок B: sticker — stickerUrl достаточно, stickerFileId достаточно, оба пустых → false');

test('B1: sticker с stickerUrl → true', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: 'https://example.com/sticker.webp' } }) === true, 'Ожидался true'));
test('B2: sticker с stickerFileId → true', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerFileId: 'file_id_123' } }) === true, 'Ожидался true'));
test('B3: sticker с обоими → true', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: 'url', stickerFileId: 'id' } }) === true, 'Ожидался true'));
test('B4: sticker без полей → false', () => assert(hasRequiredFields({ type: 'sticker', data: {} }) === false, 'Ожидался false'));
test('B5: sticker с пустым stickerUrl → false', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: '' } }) === false, 'Ожидался false'));
test('B6: sticker с пустым stickerFileId → false', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerFileId: '' } }) === false, 'Ожидался false'));
test('B7: sticker с null stickerUrl и null stickerFileId → false', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: null, stickerFileId: null } }) === false, 'Ожидался false'));
test('B8: sticker с stickerUrl = "x" → true', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: 'x' } }) === true, 'Ожидался true'));

// ─── Блок C: voice ───────────────────────────────────────────────────────────
console.log('\nБлок C: voice — voiceUrl есть → true, нет → false');

test('C1: voice с voiceUrl → true', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: 'https://example.com/voice.ogg' } }) === true, 'Ожидался true'));
test('C2: voice без voiceUrl → false', () => assert(hasRequiredFields({ type: 'voice', data: {} }) === false, 'Ожидался false'));
test('C3: voice с пустым voiceUrl → false', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: '' } }) === false, 'Ожидался false'));
test('C4: voice с null voiceUrl → false', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: null } }) === false, 'Ожидался false'));
test('C5: voice с voiceUrl = "x" → true', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: 'x' } }) === true, 'Ожидался true'));
test('C6: voice с undefined voiceUrl → false', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: undefined } }) === false, 'Ожидался false'));

// ─── Блок D: location ────────────────────────────────────────────────────────
console.log('\nБлок D: location — нужны оба (latitude И longitude), только одно → false');

test('D1: location с latitude и longitude → true', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 55.75, longitude: 37.62 } }) === true, 'Ожидался true'));
test('D2: location только с latitude → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 55.75 } }) === false, 'Ожидался false'));
test('D3: location только с longitude → false', () => assert(hasRequiredFields({ type: 'location', data: { longitude: 37.62 } }) === false, 'Ожидался false'));
test('D4: location без полей → false', () => assert(hasRequiredFields({ type: 'location', data: {} }) === false, 'Ожидался false'));
test('D5: location с пустыми строками → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: '', longitude: '' } }) === false, 'Ожидался false'));
test('D6: location с null → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: null, longitude: null } }) === false, 'Ожидался false'));
test('D7: location с latitude = 1, longitude = 1 → true', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 1, longitude: 1 } }) === true, 'Ожидался true'));
test('D8: location с latitude = "55", longitude = "37" → true', () => assert(hasRequiredFields({ type: 'location', data: { latitude: '55', longitude: '37' } }) === true, 'Ожидался true'));

// ─── Блок E: contact ─────────────────────────────────────────────────────────
console.log('\nБлок E: contact — нужны оба (phoneNumber И firstName), только одно → false');

test('E1: contact с phoneNumber и firstName → true', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: '+79001234567', firstName: 'Иван' } }) === true, 'Ожидался true'));
test('E2: contact только с phoneNumber → false', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: '+79001234567' } }) === false, 'Ожидался false'));
test('E3: contact только с firstName → false', () => assert(hasRequiredFields({ type: 'contact', data: { firstName: 'Иван' } }) === false, 'Ожидался false'));
test('E4: contact без полей → false', () => assert(hasRequiredFields({ type: 'contact', data: {} }) === false, 'Ожидался false'));
test('E5: contact с пустыми строками → false', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: '', firstName: '' } }) === false, 'Ожидался false'));
test('E6: contact с null → false', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: null, firstName: null } }) === false, 'Ожидался false'));
test('E7: contact с phoneNumber = "1", firstName = "A" → true', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: '1', firstName: 'A' } }) === true, 'Ожидался true'));
test('E8: contact с пустым phoneNumber, непустым firstName → false', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: '', firstName: 'Иван' } }) === false, 'Ожидался false'));

// ─── Блок F: command ─────────────────────────────────────────────────────────
console.log('\nБлок F: command — command есть → true, нет → false');

test('F1: command с command → true', () => assert(hasRequiredFields({ type: 'command', data: { command: '/start' } }) === true, 'Ожидался true'));
test('F2: command без command → false', () => assert(hasRequiredFields({ type: 'command', data: {} }) === false, 'Ожидался false'));
test('F3: command с пустым command → false', () => assert(hasRequiredFields({ type: 'command', data: { command: '' } }) === false, 'Ожидался false'));
test('F4: command с null command → false', () => assert(hasRequiredFields({ type: 'command', data: { command: null } }) === false, 'Ожидался false'));
test('F5: command с command = "x" → true', () => assert(hasRequiredFields({ type: 'command', data: { command: 'x' } }) === true, 'Ожидался true'));
test('F6: command с undefined command → false', () => assert(hasRequiredFields({ type: 'command', data: { command: undefined } }) === false, 'Ожидался false'));

// ─── Блок G: poll ────────────────────────────────────────────────────────────
console.log('\nБлок G: poll — нужны question И options.length > 0');

test('G1: poll с question и options → true', () => assert(hasRequiredFields({ type: 'poll', data: { question: 'Вопрос?', options: ['A', 'B'] } }) === true, 'Ожидался true'));
test('G2: poll только с question → false', () => assert(hasRequiredFields({ type: 'poll', data: { question: 'Вопрос?' } }) === false, 'Ожидался false'));
test('G3: poll только с options → false', () => assert(hasRequiredFields({ type: 'poll', data: { options: ['A', 'B'] } }) === false, 'Ожидался false'));
test('G4: poll без полей → false', () => assert(hasRequiredFields({ type: 'poll', data: {} }) === false, 'Ожидался false'));
test('G5: poll с пустым question → false', () => assert(hasRequiredFields({ type: 'poll', data: { question: '', options: ['A'] } }) === false, 'Ожидался false'));
test('G6: poll с пустым массивом options → false', () => assert(hasRequiredFields({ type: 'poll', data: { question: 'Q?', options: [] } }) === false, 'Ожидался false'));
test('G7: poll с null options → false', () => assert(hasRequiredFields({ type: 'poll', data: { question: 'Q?', options: null } }) === false, 'Ожидался false'));
test('G8: poll с одним вариантом → true', () => assert(hasRequiredFields({ type: 'poll', data: { question: 'Q?', options: ['A'] } }) === true, 'Ожидался true'));

// ─── Блок H: default (message, start и т.д.) ─────────────────────────────────
console.log('\nБлок H: default (message, start, и т.д.) — messageText есть → true, нет → false');

test('H1: message с messageText → true', () => assert(hasRequiredFields({ type: 'message', data: { messageText: 'Привет!' } }) === true, 'Ожидался true'));
test('H2: message без messageText → false', () => assert(hasRequiredFields({ type: 'message', data: {} }) === false, 'Ожидался false'));
test('H3: start с messageText → true', () => assert(hasRequiredFields({ type: 'start', data: { messageText: 'Старт' } }) === true, 'Ожидался true'));
test('H4: start без messageText → false', () => assert(hasRequiredFields({ type: 'start', data: {} }) === false, 'Ожидался false'));
test('H5: message с пустым messageText → false', () => assert(hasRequiredFields({ type: 'message', data: { messageText: '' } }) === false, 'Ожидался false'));
test('H6: message с null messageText → false', () => assert(hasRequiredFields({ type: 'message', data: { messageText: null } }) === false, 'Ожидался false'));
test('H7: message с messageText = "x" → true', () => assert(hasRequiredFields({ type: 'message', data: { messageText: 'x' } }) === true, 'Ожидался true'));
test('H8: unknown_type с messageText → true', () => assert(hasRequiredFields({ type: 'unknown_type', data: { messageText: 'text' } }) === true, 'Ожидался true'));

// ─── Блок I: Граничные случаи — falsy значения ───────────────────────────────
console.log('\nБлок I: Граничные случаи — пустые строки, 0, null, undefined → false');

test('I1: voice с voiceUrl = 0 → false', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: 0 } }) === false, 'Ожидался false'));
test('I2: command с command = false → false', () => assert(hasRequiredFields({ type: 'command', data: { command: false } }) === false, 'Ожидался false'));
test('I3: sticker с stickerUrl = 0 → false', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: 0, stickerFileId: 0 } }) === false, 'Ожидался false'));
test('I4: contact с phoneNumber = 0 → false', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: 0, firstName: 'A' } }) === false, 'Ожидался false'));
test('I5: message с messageText = 0 → false', () => assert(hasRequiredFields({ type: 'message', data: { messageText: 0 } }) === false, 'Ожидался false'));
test('I6: location с latitude = 0, longitude = 1 → false (0 falsy)', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 0, longitude: 1 } }) === false, 'Ожидался false'));
test('I7: location с latitude = 1, longitude = 0 → false (0 falsy)', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 1, longitude: 0 } }) === false, 'Ожидался false'));
test('I8: poll с question = null → false', () => assert(hasRequiredFields({ type: 'poll', data: { question: null, options: ['A'] } }) === false, 'Ожидался false'));

// ─── Блок J: Граничные случаи — truthy значения ──────────────────────────────
console.log('\nБлок J: Граничные случаи — непустые строки, числа > 0 → true');

test('J1: voice с voiceUrl = "x" → true', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: 'x' } }) === true, 'Ожидался true'));
test('J2: command с command = "x" → true', () => assert(hasRequiredFields({ type: 'command', data: { command: 'x' } }) === true, 'Ожидался true'));
test('J3: sticker с stickerUrl = "x" → true', () => assert(hasRequiredFields({ type: 'sticker', data: { stickerUrl: 'x' } }) === true, 'Ожидался true'));
test('J4: contact с phoneNumber = "1", firstName = "A" → true', () => assert(hasRequiredFields({ type: 'contact', data: { phoneNumber: '1', firstName: 'A' } }) === true, 'Ожидался true'));
test('J5: message с messageText = "x" → true', () => assert(hasRequiredFields({ type: 'message', data: { messageText: 'x' } }) === true, 'Ожидался true'));
test('J6: location с latitude = 1, longitude = 1 → true', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 1, longitude: 1 } }) === true, 'Ожидался true'));
test('J7: poll с question = "Q", options = ["A"] → true', () => assert(hasRequiredFields({ type: 'poll', data: { question: 'Q', options: ['A'] } }) === true, 'Ожидался true'));
test('J8: voice с voiceUrl = true → true', () => assert(hasRequiredFields({ type: 'voice', data: { voiceUrl: true } }) === true, 'Ожидался true'));

// ─── Блок K: Неизвестный тип → default ветка ─────────────────────────────────
console.log('\nБлок K: Неизвестный тип → зависит от messageText (default ветка)');

test('K1: "unknown" с messageText → true', () => assert(hasRequiredFields({ type: 'unknown', data: { messageText: 'text' } }) === true, 'Ожидался true'));
test('K2: "unknown" без messageText → false', () => assert(hasRequiredFields({ type: 'unknown', data: {} }) === false, 'Ожидался false'));
test('K3: "custom_type" с messageText → true', () => assert(hasRequiredFields({ type: 'custom_type', data: { messageText: 'text' } }) === true, 'Ожидался true'));
test('K4: "custom_type" без messageText → false', () => assert(hasRequiredFields({ type: 'custom_type', data: {} }) === false, 'Ожидался false'));
test('K5: "" (пустой тип) с messageText → true', () => assert(hasRequiredFields({ type: '', data: { messageText: 'text' } }) === true, 'Ожидался true'));
test('K6: "" (пустой тип) без messageText → false', () => assert(hasRequiredFields({ type: '', data: {} }) === false, 'Ожидался false'));
test('K7: "response" с messageText → true', () => assert(hasRequiredFields({ type: 'response', data: { messageText: 'text' } }) === true, 'Ожидался true'));
test('K8: "response" без messageText → false', () => assert(hasRequiredFields({ type: 'response', data: {} }) === false, 'Ожидался false'));

// ─── Блок L: location с нулевыми координатами ────────────────────────────────
console.log('\nБлок L: location с нулевыми координатами (0, 0) — 0 falsy → false');

test('L1: location (0, 0) → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 0, longitude: 0 } }) === false, 'Ожидался false'));
test('L2: location (0, 37.62) → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 0, longitude: 37.62 } }) === false, 'Ожидался false'));
test('L3: location (55.75, 0) → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 55.75, longitude: 0 } }) === false, 'Ожидался false'));
test('L4: location (0.001, 0.001) → true (ненулевые)', () => assert(hasRequiredFields({ type: 'location', data: { latitude: 0.001, longitude: 0.001 } }) === true, 'Ожидался true'));
test('L5: location (-1, -1) → true (отрицательные truthy)', () => assert(hasRequiredFields({ type: 'location', data: { latitude: -1, longitude: -1 } }) === true, 'Ожидался true'));
test('L6: location ("0", "0") → false (строка "0" truthy!)', () => {
  // "0" как строка — truthy в JS
  const result = hasRequiredFields({ type: 'location', data: { latitude: '0', longitude: '0' } });
  assert(result === true, `Строка "0" truthy, ожидался true, получено ${result}`);
});
test('L7: location (null, null) → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: null, longitude: null } }) === false, 'Ожидался false'));
test('L8: location (undefined, undefined) → false', () => assert(hasRequiredFields({ type: 'location', data: { latitude: undefined, longitude: undefined } }) === false, 'Ожидался false'));

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
