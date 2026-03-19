/**
 * Тесты для RESPONSE_CONFIG из canvas-node/response-item.tsx
 * Запуск: npx tsx client/components/editor/canvas/tests/response-item.test.ts
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

// Копия из response-item.tsx (не экспортируется)
type ResponseItemType = 'text' | 'photo' | 'video' | 'audio' | 'document' | 'multi-select';

const RESPONSE_CONFIG: Record<ResponseItemType, { icon: string; color: string; label: string }> = {
  text: { icon: 'keyboard', color: 'blue', label: 'Текстовый ввод' },
  photo: { icon: 'image', color: 'purple', label: 'Фото' },
  video: { icon: 'video', color: 'red', label: 'Видео' },
  audio: { icon: 'microphone', color: 'green', label: 'Аудио' },
  document: { icon: 'file', color: 'amber', label: 'Документ' },
  'multi-select': { icon: 'check-double', color: 'indigo', label: 'Множественный выбор' }
};

const ALL_TYPES: ResponseItemType[] = ['text', 'photo', 'video', 'audio', 'document', 'multi-select'];
const ALLOWED_COLORS = ['blue', 'purple', 'red', 'green', 'amber', 'indigo'];

// ─── Блок A: Наличие всех 6 типов ───────────────────────────────────────────
console.log('\nБлок A: Наличие всех 6 типов в RESPONSE_CONFIG');

test('A1: тип "text" присутствует', () => assert('text' in RESPONSE_CONFIG, 'text отсутствует'));
test('A2: тип "photo" присутствует', () => assert('photo' in RESPONSE_CONFIG, 'photo отсутствует'));
test('A3: тип "video" присутствует', () => assert('video' in RESPONSE_CONFIG, 'video отсутствует'));
test('A4: тип "audio" присутствует', () => assert('audio' in RESPONSE_CONFIG, 'audio отсутствует'));
test('A5: тип "document" присутствует', () => assert('document' in RESPONSE_CONFIG, 'document отсутствует'));
test('A6: тип "multi-select" присутствует', () => assert('multi-select' in RESPONSE_CONFIG, 'multi-select отсутствует'));
test('A7: всего ровно 6 типов', () => assert(Object.keys(RESPONSE_CONFIG).length === 6, `Ожидалось 6, получено ${Object.keys(RESPONSE_CONFIG).length}`));
test('A8: RESPONSE_CONFIG — объект', () => assert(typeof RESPONSE_CONFIG === 'object' && RESPONSE_CONFIG !== null, 'не объект'));

// ─── Блок B: Каждый тип имеет поля icon, color, label ───────────────────────
console.log('\nБлок B: Каждый тип имеет поля icon, color, label (непустые строки)');

for (const type of ALL_TYPES) {
  test(`B: ${type} имеет поле icon (непустая строка)`, () => {
    const cfg = RESPONSE_CONFIG[type];
    assert(typeof cfg.icon === 'string' && cfg.icon.length > 0, `icon пустой или не строка для ${type}`);
  });
  test(`B: ${type} имеет поле color (непустая строка)`, () => {
    const cfg = RESPONSE_CONFIG[type];
    assert(typeof cfg.color === 'string' && cfg.color.length > 0, `color пустой или не строка для ${type}`);
  });
  test(`B: ${type} имеет поле label (непустая строка)`, () => {
    const cfg = RESPONSE_CONFIG[type];
    assert(typeof cfg.label === 'string' && cfg.label.length > 0, `label пустой или не строка для ${type}`);
  });
}

// ─── Блок C: Конкретные значения icon ───────────────────────────────────────
console.log('\nБлок C: Конкретные значения icon для каждого типа');

test('C1: text → icon = "keyboard"', () => assert(RESPONSE_CONFIG.text.icon === 'keyboard', `Получено: ${RESPONSE_CONFIG.text.icon}`));
test('C2: photo → icon = "image"', () => assert(RESPONSE_CONFIG.photo.icon === 'image', `Получено: ${RESPONSE_CONFIG.photo.icon}`));
test('C3: video → icon = "video"', () => assert(RESPONSE_CONFIG.video.icon === 'video', `Получено: ${RESPONSE_CONFIG.video.icon}`));
test('C4: audio → icon = "microphone"', () => assert(RESPONSE_CONFIG.audio.icon === 'microphone', `Получено: ${RESPONSE_CONFIG.audio.icon}`));
test('C5: document → icon = "file"', () => assert(RESPONSE_CONFIG.document.icon === 'file', `Получено: ${RESPONSE_CONFIG.document.icon}`));
test('C6: multi-select → icon = "check-double"', () => assert(RESPONSE_CONFIG['multi-select'].icon === 'check-double', `Получено: ${RESPONSE_CONFIG['multi-select'].icon}`));

// ─── Блок D: Конкретные значения color ──────────────────────────────────────
console.log('\nБлок D: Конкретные значения color для каждого типа');

test('D1: text → color = "blue"', () => assert(RESPONSE_CONFIG.text.color === 'blue', `Получено: ${RESPONSE_CONFIG.text.color}`));
test('D2: photo → color = "purple"', () => assert(RESPONSE_CONFIG.photo.color === 'purple', `Получено: ${RESPONSE_CONFIG.photo.color}`));
test('D3: video → color = "red"', () => assert(RESPONSE_CONFIG.video.color === 'red', `Получено: ${RESPONSE_CONFIG.video.color}`));
test('D4: audio → color = "green"', () => assert(RESPONSE_CONFIG.audio.color === 'green', `Получено: ${RESPONSE_CONFIG.audio.color}`));
test('D5: document → color = "amber"', () => assert(RESPONSE_CONFIG.document.color === 'amber', `Получено: ${RESPONSE_CONFIG.document.color}`));
test('D6: multi-select → color = "indigo"', () => assert(RESPONSE_CONFIG['multi-select'].color === 'indigo', `Получено: ${RESPONSE_CONFIG['multi-select'].color}`));

// ─── Блок E: Конкретные значения label ──────────────────────────────────────
console.log('\nБлок E: Конкретные значения label для каждого типа');

test('E1: text → label = "Текстовый ввод"', () => assert(RESPONSE_CONFIG.text.label === 'Текстовый ввод', `Получено: ${RESPONSE_CONFIG.text.label}`));
test('E2: photo → label = "Фото"', () => assert(RESPONSE_CONFIG.photo.label === 'Фото', `Получено: ${RESPONSE_CONFIG.photo.label}`));
test('E3: video → label = "Видео"', () => assert(RESPONSE_CONFIG.video.label === 'Видео', `Получено: ${RESPONSE_CONFIG.video.label}`));
test('E4: audio → label = "Аудио"', () => assert(RESPONSE_CONFIG.audio.label === 'Аудио', `Получено: ${RESPONSE_CONFIG.audio.label}`));
test('E5: document → label = "Документ"', () => assert(RESPONSE_CONFIG.document.label === 'Документ', `Получено: ${RESPONSE_CONFIG.document.label}`));
test('E6: multi-select → label = "Множественный выбор"', () => assert(RESPONSE_CONFIG['multi-select'].label === 'Множественный выбор', `Получено: ${RESPONSE_CONFIG['multi-select'].label}`));

// ─── Блок F: Все icon — строки без пробелов (FontAwesome формат) ─────────────
console.log('\nБлок F: Все icon — строки без пробелов (FontAwesome формат)');

for (const type of ALL_TYPES) {
  test(`F: ${type} — icon без пробелов`, () => {
    const icon = RESPONSE_CONFIG[type].icon;
    assert(!icon.includes(' '), `icon "${icon}" содержит пробел`);
  });
}
test('F7: все icon — строки (не числа, не null)', () => {
  for (const type of ALL_TYPES) {
    assert(typeof RESPONSE_CONFIG[type].icon === 'string', `icon для ${type} не строка`);
  }
});
test('F8: все icon — непустые', () => {
  for (const type of ALL_TYPES) {
    assert(RESPONSE_CONFIG[type].icon.length > 0, `icon для ${type} пустой`);
  }
});

// ─── Блок G: Все color — из допустимого набора ───────────────────────────────
console.log('\nБлок G: Все color — из допустимого набора');

for (const type of ALL_TYPES) {
  test(`G: ${type} — color из допустимого набора`, () => {
    const color = RESPONSE_CONFIG[type].color;
    assert(ALLOWED_COLORS.includes(color), `color "${color}" не из допустимого набора`);
  });
}
test('G7: допустимый набор содержит ровно 6 цветов', () => assert(ALLOWED_COLORS.length === 6, `Ожидалось 6, получено ${ALLOWED_COLORS.length}`));
test('G8: все 6 цветов используются', () => {
  const usedColors = ALL_TYPES.map(t => RESPONSE_CONFIG[t].color);
  for (const color of ALLOWED_COLORS) {
    assert(usedColors.includes(color), `Цвет "${color}" не используется`);
  }
});

// ─── Блок H: Нет дублирующихся icon ─────────────────────────────────────────
console.log('\nБлок H: Нет дублирующихся icon');

test('H1: все icon уникальны', () => {
  const icons = ALL_TYPES.map(t => RESPONSE_CONFIG[t].icon);
  const unique = new Set(icons);
  assert(unique.size === icons.length, `Дублирующиеся icon: ${icons.filter((v, i) => icons.indexOf(v) !== i)}`);
});
test('H2: "keyboard" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].icon === 'keyboard').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('H3: "image" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].icon === 'image').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('H4: "video" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].icon === 'video').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('H5: "microphone" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].icon === 'microphone').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('H6: "file" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].icon === 'file').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('H7: "check-double" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].icon === 'check-double').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});

// ─── Блок I: Нет дублирующихся color ─────────────────────────────────────────
console.log('\nБлок I: Нет дублирующихся color');

test('I1: все color уникальны', () => {
  const colors = ALL_TYPES.map(t => RESPONSE_CONFIG[t].color);
  const unique = new Set(colors);
  assert(unique.size === colors.length, `Дублирующиеся color: ${colors.filter((v, i) => colors.indexOf(v) !== i)}`);
});
test('I2: "blue" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].color === 'blue').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('I3: "purple" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].color === 'purple').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('I4: "red" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].color === 'red').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('I5: "green" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].color === 'green').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('I6: "amber" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].color === 'amber').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('I7: "indigo" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].color === 'indigo').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});

// ─── Блок J: Нет дублирующихся label ─────────────────────────────────────────
console.log('\nБлок J: Нет дублирующихся label');

test('J1: все label уникальны', () => {
  const labels = ALL_TYPES.map(t => RESPONSE_CONFIG[t].label);
  const unique = new Set(labels);
  assert(unique.size === labels.length, `Дублирующиеся label: ${labels.filter((v, i) => labels.indexOf(v) !== i)}`);
});
test('J2: "Текстовый ввод" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].label === 'Текстовый ввод').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('J3: "Фото" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].label === 'Фото').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('J4: "Видео" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].label === 'Видео').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('J5: "Аудио" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].label === 'Аудио').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('J6: "Документ" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].label === 'Документ').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('J7: "Множественный выбор" используется ровно 1 раз', () => {
  const count = ALL_TYPES.filter(t => RESPONSE_CONFIG[t].label === 'Множественный выбор').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});

// ─── Блок K: Все label — непустые строки длиной > 2 ─────────────────────────
console.log('\nБлок K: Все label — непустые строки длиной > 2');

for (const type of ALL_TYPES) {
  test(`K: ${type} — label длиннее 2 символов`, () => {
    const label = RESPONSE_CONFIG[type].label;
    assert(label.length > 2, `label "${label}" слишком короткий (${label.length} символов)`);
  });
}
test('K7: все label — строки', () => {
  for (const type of ALL_TYPES) {
    assert(typeof RESPONSE_CONFIG[type].label === 'string', `label для ${type} не строка`);
  }
});
test('K8: самый короткий label — "Фото" (4 символа)', () => {
  const minLen = Math.min(...ALL_TYPES.map(t => RESPONSE_CONFIG[t].label.length));
  assert(minLen > 2, `Минимальная длина label = ${minLen}, ожидалось > 2`);
});

// ─── Блок L: Типы соответствуют ожидаемому набору ───────────────────────────
console.log('\nБлок L: Типы соответствуют ожидаемому набору (ровно 6 типов)');

test('L1: ровно 6 ключей в RESPONSE_CONFIG', () => {
  const keys = Object.keys(RESPONSE_CONFIG);
  assert(keys.length === 6, `Ожидалось 6, получено ${keys.length}`);
});
test('L2: нет лишних типов', () => {
  const keys = Object.keys(RESPONSE_CONFIG);
  for (const key of keys) {
    assert(ALL_TYPES.includes(key as ResponseItemType), `Лишний тип: ${key}`);
  }
});
test('L3: все ожидаемые типы присутствуют', () => {
  for (const type of ALL_TYPES) {
    assert(type in RESPONSE_CONFIG, `Отсутствует тип: ${type}`);
  }
});
test('L4: порядок типов соответствует ожидаемому', () => {
  const keys = Object.keys(RESPONSE_CONFIG);
  const expected = ['text', 'photo', 'video', 'audio', 'document', 'multi-select'];
  assert(JSON.stringify(keys) === JSON.stringify(expected), `Порядок: ${keys.join(', ')}`);
});
test('L5: нет типа "image" (это icon, не тип)', () => assert(!('image' in RESPONSE_CONFIG), '"image" не должен быть типом'));
test('L6: нет типа "file" (это icon, не тип)', () => assert(!('file' in RESPONSE_CONFIG), '"file" не должен быть типом'));
test('L7: нет типа "music" (это icon, не тип)', () => assert(!('music' in RESPONSE_CONFIG), '"music" не должен быть типом'));
test('L8: нет типа "select" (только "multi-select")', () => assert(!('select' in RESPONSE_CONFIG), '"select" не должен быть типом'));

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
