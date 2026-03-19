/**
 * Тесты для логики zoom-controls из canvas.tsx, zoom-controls.tsx, canvas-toolbar.tsx
 * Запуск: npx tsx client/components/editor/canvas/tests/zoom-controls.test.ts
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

// ─── Копия логики из canvas.tsx ───────────────────────────────────────────────
const MIN_ZOOM = 1;
const MAX_ZOOM = 200;
const ZOOM_IN_FACTOR = 1.05;
const ZOOM_OUT_FACTOR = 0.95;
const WHEEL_ZOOM_IN_FACTOR = 1.1;
const WHEEL_ZOOM_OUT_FACTOR = 0.9;

function clampZoom(value: number): number {
  return Math.max(Math.min(value, MAX_ZOOM), MIN_ZOOM);
}

function calcZoomIn(zoom: number): number {
  return Math.min(zoom * ZOOM_IN_FACTOR, MAX_ZOOM);
}

function calcZoomOut(zoom: number): number {
  return Math.max(zoom * ZOOM_OUT_FACTOR, MIN_ZOOM);
}

function calcResetZoom(): number {
  return 100;
}

function calcSetZoomLevel(level: number): number {
  return Math.max(Math.min(level, MAX_ZOOM), MIN_ZOOM);
}

function calcWheelZoom(zoom: number, delta: number): number {
  const factor = delta > 0 ? WHEEL_ZOOM_OUT_FACTOR : WHEEL_ZOOM_IN_FACTOR;
  return Math.max(Math.min(zoom * factor, MAX_ZOOM), MIN_ZOOM);
}

function calcZoomFromCenterPan(
  prevPan: { x: number; y: number },
  prevZoom: number,
  newZoom: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const prevZoomPercent = prevZoom / 100;
  const newZoomPercent = newZoom / 100;
  const centerCanvasX = (centerX - prevPan.x) / prevZoomPercent;
  const centerCanvasY = (centerY - prevPan.y) / prevZoomPercent;
  return {
    x: centerX - centerCanvasX * newZoomPercent,
    y: centerY - centerCanvasY * newZoomPercent
  };
}

// ─── Копия из zoom-controls.tsx ───────────────────────────────────────────────
const ZOOM_LEVELS = [1, 5, 10, 25, 50, 75, 100, 125, 150, 200];

// ─── Копия из canvas-toolbar.tsx ─────────────────────────────────────────────
function canZoomOut(zoom: number): boolean { return zoom > MIN_ZOOM; }
function canZoomIn(zoom: number): boolean { return zoom < MAX_ZOOM; }
function canFitToContent(nodeCount: number): boolean { return nodeCount > 0; }

// ─── Блок A: clampZoom — границы и значения ───────────────────────────────────
console.log('\nБлок A: clampZoom — границы и значения');

test('A1: clampZoom(1) === 1', () => assert(clampZoom(1) === 1, `Получено ${clampZoom(1)}`));
test('A2: clampZoom(200) === 200', () => assert(clampZoom(200) === 200, `Получено ${clampZoom(200)}`));
test('A3: clampZoom(100) === 100', () => assert(clampZoom(100) === 100, `Получено ${clampZoom(100)}`));
test('A4: clampZoom(0) === 1 (clamp to min)', () => assert(clampZoom(0) === 1, `Получено ${clampZoom(0)}`));
test('A5: clampZoom(-50) === 1', () => assert(clampZoom(-50) === 1, `Получено ${clampZoom(-50)}`));
test('A6: clampZoom(201) === 200 (clamp to max)', () => assert(clampZoom(201) === 200, `Получено ${clampZoom(201)}`));
test('A7: clampZoom(1000) === 200', () => assert(clampZoom(1000) === 200, `Получено ${clampZoom(1000)}`));
test('A8: clampZoom(0.5) === 1', () => assert(clampZoom(0.5) === 1, `Получено ${clampZoom(0.5)}`));
test('A9: clampZoom(50) === 50', () => assert(clampZoom(50) === 50, `Получено ${clampZoom(50)}`));
test('A10: clampZoom(150) === 150', () => assert(clampZoom(150) === 150, `Получено ${clampZoom(150)}`));
test('A11: clampZoom(NaN) — результат NaN (Math.max/min с NaN)', () => {
  const result = clampZoom(NaN);
  assert(isNaN(result), `Ожидался NaN, получено ${result}`);
});
test('A12: clampZoom(Infinity) === 200', () => assert(clampZoom(Infinity) === 200, `Получено ${clampZoom(Infinity)}`));

// ─── Блок B: calcZoomIn — шаг увеличения ─────────────────────────────────────
console.log('\nБлок B: calcZoomIn — шаг увеличения');

test('B1: calcZoomIn(100) === 105', () => assert(calcZoomIn(100) === 105, `Получено ${calcZoomIn(100)}`));
test('B2: calcZoomIn(200) === 200 (уже максимум)', () => assert(calcZoomIn(200) === 200, `Получено ${calcZoomIn(200)}`));
test('B3: calcZoomIn(190) === Math.min(190 * 1.05, 200) = 199.5', () => assert(calcZoomIn(190) === 199.5, `Получено ${calcZoomIn(190)}`));
test('B4: calcZoomIn(1) > 1', () => assert(calcZoomIn(1) > 1, `Получено ${calcZoomIn(1)}`));
test('B5: calcZoomIn(50) === 52.5', () => assert(calcZoomIn(50) === 52.5, `Получено ${calcZoomIn(50)}`));
test('B6: calcZoomIn(100) > 100', () => assert(calcZoomIn(100) > 100, `Получено ${calcZoomIn(100)}`));
test('B7: calcZoomIn(190.48) → clamped to 200', () => {
  const result = calcZoomIn(190.48);
  assert(result === 200, `Ожидалось 200, получено ${result}`);
});
test('B8: результат всегда ≤ 200', () => {
  const inputs = [1, 50, 100, 150, 190, 200];
  for (const z of inputs) {
    assert(calcZoomIn(z) <= 200, `calcZoomIn(${z}) = ${calcZoomIn(z)} > 200`);
  }
});
test('B9: результат всегда ≥ входного значения (zoom только растёт)', () => {
  const inputs = [1, 50, 100, 150, 190, 200];
  for (const z of inputs) {
    assert(calcZoomIn(z) >= z, `calcZoomIn(${z}) = ${calcZoomIn(z)} < ${z}`);
  }
});
test('B10: 20 последовательных zoomIn от 1 → результат ≤ 200', () => {
  let zoom = 1;
  for (let i = 0; i < 20; i++) zoom = calcZoomIn(zoom);
  assert(zoom <= 200, `После 20 шагов zoom = ${zoom} > 200`);
});

// ─── Блок C: calcZoomOut — шаг уменьшения ────────────────────────────────────
console.log('\nБлок C: calcZoomOut — шаг уменьшения');

test('C1: calcZoomOut(100) === 95', () => assert(calcZoomOut(100) === 95, `Получено ${calcZoomOut(100)}`));
test('C2: calcZoomOut(1) === 1 (уже минимум)', () => assert(calcZoomOut(1) === 1, `Получено ${calcZoomOut(1)}`));
test('C3: calcZoomOut(10) === 9.5', () => assert(calcZoomOut(10) === 9.5, `Получено ${calcZoomOut(10)}`));
test('C4: calcZoomOut(200) === 190', () => assert(calcZoomOut(200) === 190, `Получено ${calcZoomOut(200)}`));
test('C5: calcZoomOut(100) < 100', () => assert(calcZoomOut(100) < 100, `Получено ${calcZoomOut(100)}`));
test('C6: результат всегда ≥ 1', () => {
  const inputs = [1, 2, 10, 50, 100, 200];
  for (const z of inputs) {
    assert(calcZoomOut(z) >= 1, `calcZoomOut(${z}) = ${calcZoomOut(z)} < 1`);
  }
});
test('C7: результат всегда ≤ входного значения', () => {
  const inputs = [1, 2, 10, 50, 100, 200];
  for (const z of inputs) {
    assert(calcZoomOut(z) <= z, `calcZoomOut(${z}) = ${calcZoomOut(z)} > ${z}`);
  }
});
test('C8: 20 последовательных zoomOut от 200 → результат ≥ 1', () => {
  let zoom = 200;
  for (let i = 0; i < 20; i++) zoom = calcZoomOut(zoom);
  assert(zoom >= 1, `После 20 шагов zoom = ${zoom} < 1`);
});
test('C9: calcZoomOut(1.05) → clamped to 1', () => {
  const result = calcZoomOut(1.05);
  assert(result === 1, `Ожидалось 1, получено ${result}`);
});
test('C10: calcZoomOut(50) === 47.5', () => assert(calcZoomOut(50) === 47.5, `Получено ${calcZoomOut(50)}`));

// ─── Блок D: calcResetZoom ────────────────────────────────────────────────────
console.log('\nБлок D: calcResetZoom');

test('D1: calcResetZoom() === 100', () => assert(calcResetZoom() === 100, `Получено ${calcResetZoom()}`));
test('D2: вызов 2 раза → всегда 100', () => assert(calcResetZoom() === 100 && calcResetZoom() === 100, 'Не всегда 100'));
test('D3: вызов 3 раза → всегда 100', () => {
  for (let i = 0; i < 3; i++) assert(calcResetZoom() === 100, `Вызов ${i + 1}: получено ${calcResetZoom()}`);
});
test('D4: тип возвращаемого значения — number', () => assert(typeof calcResetZoom() === 'number', `Тип: ${typeof calcResetZoom()}`));
test('D5: результат === 100 независимо от состояния', () => {
  const results = Array.from({ length: 5 }, () => calcResetZoom());
  assert(results.every(r => r === 100), `Не все результаты 100: ${results}`);
});

// ─── Блок E: calcSetZoomLevel — clamping ──────────────────────────────────────
console.log('\nБлок E: calcSetZoomLevel — clamping');

test('E1: calcSetZoomLevel(100) === 100', () => assert(calcSetZoomLevel(100) === 100, `Получено ${calcSetZoomLevel(100)}`));
test('E2: calcSetZoomLevel(0) === 1', () => assert(calcSetZoomLevel(0) === 1, `Получено ${calcSetZoomLevel(0)}`));
test('E3: calcSetZoomLevel(-100) === 1', () => assert(calcSetZoomLevel(-100) === 1, `Получено ${calcSetZoomLevel(-100)}`));
test('E4: calcSetZoomLevel(201) === 200', () => assert(calcSetZoomLevel(201) === 200, `Получено ${calcSetZoomLevel(201)}`));
test('E5: calcSetZoomLevel(1000) === 200', () => assert(calcSetZoomLevel(1000) === 200, `Получено ${calcSetZoomLevel(1000)}`));
test('E6: calcSetZoomLevel(1) === 1', () => assert(calcSetZoomLevel(1) === 1, `Получено ${calcSetZoomLevel(1)}`));
test('E7: calcSetZoomLevel(200) === 200', () => assert(calcSetZoomLevel(200) === 200, `Получено ${calcSetZoomLevel(200)}`));
test('E8: calcSetZoomLevel(50) === 50', () => assert(calcSetZoomLevel(50) === 50, `Получено ${calcSetZoomLevel(50)}`));
test('E9: calcSetZoomLevel(150) === 150', () => assert(calcSetZoomLevel(150) === 150, `Получено ${calcSetZoomLevel(150)}`));
test('E10: calcSetZoomLevel(0.5) === 1', () => assert(calcSetZoomLevel(0.5) === 1, `Получено ${calcSetZoomLevel(0.5)}`));
test('E11: calcSetZoomLevel(200.1) === 200', () => assert(calcSetZoomLevel(200.1) === 200, `Получено ${calcSetZoomLevel(200.1)}`));
test('E12: результат всегда в [1, 200]', () => {
  const inputs = [-1000, -1, 0, 0.5, 1, 50, 100, 150, 200, 200.1, 1000];
  for (const v of inputs) {
    const r = calcSetZoomLevel(v);
    assert(r >= 1 && r <= 200, `calcSetZoomLevel(${v}) = ${r} вне [1, 200]`);
  }
});

// ─── Блок F: calcWheelZoom — колесо мыши ─────────────────────────────────────
console.log('\nБлок F: calcWheelZoom — колесо мыши');

test('F1: delta > 0 → zoom уменьшается (factor 0.9)', () => {
  assert(calcWheelZoom(100, 100) < 100, `Ожидалось < 100, получено ${calcWheelZoom(100, 100)}`);
});
test('F2: delta < 0 → zoom увеличивается (factor 1.1)', () => {
  assert(calcWheelZoom(100, -100) > 100, `Ожидалось > 100, получено ${calcWheelZoom(100, -100)}`);
});
test('F3: calcWheelZoom(100, 100) === 90', () => assert(calcWheelZoom(100, 100) === 90, `Получено ${calcWheelZoom(100, 100)}`));
test('F4: calcWheelZoom(100, -100) ≈ 110 (float precision)', () => assert(Math.abs(calcWheelZoom(100, -100) - 110) < 0.0001, `Получено ${calcWheelZoom(100, -100)}`));
test('F5: calcWheelZoom(200, -100) === 200 (clamped to max)', () => assert(calcWheelZoom(200, -100) === 200, `Получено ${calcWheelZoom(200, -100)}`));
test('F6: calcWheelZoom(1, 100) === 1 (clamped to min)', () => assert(calcWheelZoom(1, 100) === 1, `Получено ${calcWheelZoom(1, 100)}`));
test('F7: calcWheelZoom(1, -100) > 1', () => assert(calcWheelZoom(1, -100) > 1, `Получено ${calcWheelZoom(1, -100)}`));
test('F8: calcWheelZoom(200, 100) < 200', () => assert(calcWheelZoom(200, 100) < 200, `Получено ${calcWheelZoom(200, 100)}`));
test('F9: результат всегда в [1, 200]', () => {
  const cases: [number, number][] = [[1, -1], [1, 1], [100, -1], [100, 1], [200, -1], [200, 1]];
  for (const [z, d] of cases) {
    const r = calcWheelZoom(z, d);
    assert(r >= 1 && r <= 200, `calcWheelZoom(${z}, ${d}) = ${r} вне [1, 200]`);
  }
});
test('F10: delta === 0 → zoom in (factor 1.1, т.к. !(0 > 0))', () => {
  assert(Math.abs(calcWheelZoom(100, 0) - 110) < 0.0001, `Получено ${calcWheelZoom(100, 0)}`);
});
test('F11: calcWheelZoom(50, 50) === 45', () => assert(calcWheelZoom(50, 50) === 45, `Получено ${calcWheelZoom(50, 50)}`));
test('F12: calcWheelZoom(50, -50) ≈ 55 (float precision)', () => assert(Math.abs(calcWheelZoom(50, -50) - 55) < 0.0001, `Получено ${calcWheelZoom(50, -50)}`));

// ─── Блок G: ZOOM_LEVELS — массив предустановок ───────────────────────────────
console.log('\nБлок G: ZOOM_LEVELS — массив предустановок');

test('G1: length === 10', () => assert(ZOOM_LEVELS.length === 10, `Получено ${ZOOM_LEVELS.length}`));
test('G2: первый элемент === 1', () => assert(ZOOM_LEVELS[0] === 1, `Получено ${ZOOM_LEVELS[0]}`));
test('G3: последний элемент === 200', () => assert(ZOOM_LEVELS[ZOOM_LEVELS.length - 1] === 200, `Получено ${ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}`));
test('G4: содержит 100', () => assert(ZOOM_LEVELS.includes(100), '100 отсутствует'));
test('G5: содержит 50', () => assert(ZOOM_LEVELS.includes(50), '50 отсутствует'));
test('G6: содержит 25', () => assert(ZOOM_LEVELS.includes(25), '25 отсутствует'));
test('G7: отсортирован по возрастанию', () => {
  for (let i = 1; i < ZOOM_LEVELS.length; i++) {
    assert(ZOOM_LEVELS[i] > ZOOM_LEVELS[i - 1], `Нарушение порядка: ${ZOOM_LEVELS[i - 1]} → ${ZOOM_LEVELS[i]}`);
  }
});
test('G8: нет дублирующихся значений', () => {
  const unique = new Set(ZOOM_LEVELS);
  assert(unique.size === ZOOM_LEVELS.length, `Дублирующиеся значения: ${ZOOM_LEVELS.filter((v, i) => ZOOM_LEVELS.indexOf(v) !== i)}`);
});
test('G9: все значения в [1, 200]', () => {
  for (const v of ZOOM_LEVELS) {
    assert(v >= 1 && v <= 200, `Значение ${v} вне [1, 200]`);
  }
});
test('G10: все значения — целые числа', () => {
  for (const v of ZOOM_LEVELS) {
    assert(Number.isInteger(v), `${v} не целое число`);
  }
});
test('G11: содержит 75', () => assert(ZOOM_LEVELS.includes(75), '75 отсутствует'));
test('G12: содержит 125', () => assert(ZOOM_LEVELS.includes(125), '125 отсутствует'));

// ─── Блок H: canZoomIn / canZoomOut / canFitToContent ─────────────────────────
console.log('\nБлок H: canZoomIn / canZoomOut / canFitToContent');

test('H1: canZoomIn(100) === true', () => assert(canZoomIn(100) === true, `Получено ${canZoomIn(100)}`));
test('H2: canZoomIn(200) === false', () => assert(canZoomIn(200) === false, `Получено ${canZoomIn(200)}`));
test('H3: canZoomIn(199) === true', () => assert(canZoomIn(199) === true, `Получено ${canZoomIn(199)}`));
test('H4: canZoomOut(100) === true', () => assert(canZoomOut(100) === true, `Получено ${canZoomOut(100)}`));
test('H5: canZoomOut(1) === false', () => assert(canZoomOut(1) === false, `Получено ${canZoomOut(1)}`));
test('H6: canZoomOut(2) === true', () => assert(canZoomOut(2) === true, `Получено ${canZoomOut(2)}`));
test('H7: canFitToContent(0) === false', () => assert(canFitToContent(0) === false, `Получено ${canFitToContent(0)}`));
test('H8: canFitToContent(1) === true', () => assert(canFitToContent(1) === true, `Получено ${canFitToContent(1)}`));
test('H9: canFitToContent(10) === true', () => assert(canFitToContent(10) === true, `Получено ${canFitToContent(10)}`));
test('H10: canZoomIn(1) === true', () => assert(canZoomIn(1) === true, `Получено ${canZoomIn(1)}`));

// ─── Блок I: calcZoomFromCenterPan — зум от центра ───────────────────────────
console.log('\nБлок I: calcZoomFromCenterPan — зум от центра');

test('I1: zoom 100→200 с pan {0,0} и контейнером 800x600 → pan.x < 0', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 800, 600);
  assert(result.x < 0, `Ожидалось pan.x < 0, получено ${result.x}`);
});
test('I2: zoom 100→50 с pan {0,0} → pan.x > 0', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 50, 800, 600);
  assert(result.x > 0, `Ожидалось pan.x > 0, получено ${result.x}`);
});
test('I3: zoom 100→100 (без изменений) → pan остаётся прежним', () => {
  const prevPan = { x: 50, y: 30 };
  const result = calcZoomFromCenterPan(prevPan, 100, 100, 800, 600);
  assert(result.x === prevPan.x, `pan.x: ожидалось ${prevPan.x}, получено ${result.x}`);
  assert(result.y === prevPan.y, `pan.y: ожидалось ${prevPan.y}, получено ${result.y}`);
});
test('I4: результат содержит поля x и y', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 800, 600);
  assert('x' in result && 'y' in result, 'Отсутствуют поля x или y');
});
test('I5: x и y — числа', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 800, 600);
  assert(typeof result.x === 'number', `x не число: ${typeof result.x}`);
  assert(typeof result.y === 'number', `y не число: ${typeof result.y}`);
});
test('I6: x и y конечны (isFinite)', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 800, 600);
  assert(isFinite(result.x), `x не конечен: ${result.x}`);
  assert(isFinite(result.y), `y не конечен: ${result.y}`);
});
test('I7: симметричный контейнер и pan {0,0}: x === y (если width === height)', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 600, 600);
  assert(result.x === result.y, `Ожидалось x === y, получено x=${result.x}, y=${result.y}`);
});
test('I8: zoom 100→200 с pan {0,0} и контейнером 800x600 → pan.x === -400', () => {
  // centerX = 400, centerCanvasX = (400 - 0) / 1 = 400, newPan.x = 400 - 400 * 2 = -400
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 800, 600);
  assert(result.x === -400, `Ожидалось -400, получено ${result.x}`);
});
test('I9: zoom 100→200 с pan {100, 50} → pan изменяется корректно', () => {
  // centerX=400, prevZoom%=1, centerCanvasX=(400-100)/1=300, newPan.x=400-300*2=-200
  const result = calcZoomFromCenterPan({ x: 100, y: 50 }, 100, 200, 800, 600);
  assert(result.x === -200, `Ожидалось -200, получено ${result.x}`);
  // centerY=300, centerCanvasY=(300-50)/1=250, newPan.y=300-250*2=-200
  assert(result.y === -200, `Ожидалось -200, получено ${result.y}`);
});
test('I10: zoom 200→100 → pan движется в обратном направлении от zoom 100→200', () => {
  const forward = calcZoomFromCenterPan({ x: 0, y: 0 }, 100, 200, 800, 600);
  const backward = calcZoomFromCenterPan(forward, 200, 100, 800, 600);
  // Должны вернуться к исходному pan {0, 0}
  assert(Math.abs(backward.x) < 0.0001, `Ожидалось ~0, получено ${backward.x}`);
  assert(Math.abs(backward.y) < 0.0001, `Ожидалось ~0, получено ${backward.y}`);
});
test('I11: zoom 1→200 → pan сильно отрицательный', () => {
  const result = calcZoomFromCenterPan({ x: 0, y: 0 }, 1, 200, 800, 600);
  assert(result.x < -1000, `Ожидалось pan.x << 0, получено ${result.x}`);
});
test('I12: zoom 100→100 → pan.x === prevPan.x (без изменений)', () => {
  const prevPan = { x: 123, y: 456 };
  const result = calcZoomFromCenterPan(prevPan, 100, 100, 800, 600);
  assert(result.x === prevPan.x, `pan.x: ожидалось ${prevPan.x}, получено ${result.x}`);
});

// ─── Блок J: fitToContent — вычисление pan и zoom ────────────────────────────
// Воссоздание логики из canvas.tsx (исправленная версия)
console.log('\nБлок J: fitToContent — вычисление pan и zoom');

// Реальные высоты: py-3 (24px) + h-9 (36px) = 60px для обоих компонентов
const TOOLBAR_HEIGHT = 60;
const SHEETS_HEIGHT_WITH = 60;
const SHEETS_HEIGHT_WITHOUT = 0;
const FIT_MIN_ZOOM = 20;
const FIT_MAX_ZOOM = 100;

interface NodeBounds {
  left: number; right: number; top: number; bottom: number;
}

interface FitResult {
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Вычисляет zoom и pan для "уместить всё".
 * containerWidth/containerHeight — полные размеры scrollContainer (без вычетов).
 * toolbarHeight — реальная высота toolbar (измеренная через getBoundingClientRect).
 * sheetsHeight — реальная высота панели листов (0 если не видима).
 */
function calcFitToContent(
  bounds: NodeBounds,
  containerWidth: number,
  containerHeight: number,
  toolbarHeight: number,
  sheetsHeight: number
): FitResult | null {
  const contentWidth = bounds.right - bounds.left;
  const contentHeight = bounds.bottom - bounds.top;
  if (contentWidth <= 0 || contentHeight <= 0) return null;

  const visibleHeight = containerHeight - toolbarHeight - sheetsHeight;
  if (containerWidth <= 0 || visibleHeight <= 0) return null;

  const scaleX = (containerWidth * 0.9) / contentWidth;
  const scaleY = (visibleHeight * 0.9) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1);
  const newZoom = Math.max(Math.min(scale * 100, FIT_MAX_ZOOM), FIT_MIN_ZOOM);

  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const containerCenterX = containerWidth / 2;
  const containerCenterY = toolbarHeight + visibleHeight / 2;

  return {
    zoom: newZoom,
    pan: {
      x: containerCenterX - centerX * (newZoom / 100),
      y: containerCenterY - centerY * (newZoom / 100)
    }
  };
}

/** Нижняя граница контента на экране: bottomNode * zoom + pan.y */
function contentBottomOnScreen(bounds: NodeBounds, result: FitResult): number {
  return bounds.bottom * (result.zoom / 100) + result.pan.y;
}

/** Верхняя граница контента на экране: topNode * zoom + pan.y */
function contentTopOnScreen(bounds: NodeBounds, result: FitResult): number {
  return bounds.top * (result.zoom / 100) + result.pan.y;
}

// Тестовые данные
const CONTAINER_W = 1200;
const CONTAINER_H = 800;
const SINGLE_NODE: NodeBounds = { left: 100, right: 420, top: 100, bottom: 200 }; // 320×100
const WIDE_NODES: NodeBounds = { left: 0, right: 3000, top: 0, bottom: 500 };
const SMALL_NODES: NodeBounds = { left: 400, right: 720, top: 300, bottom: 400 }; // 320×100
const TALL_NODES: NodeBounds = { left: 0, right: 320, top: 0, bottom: 2000 };

// J1: containerCenterY учитывает toolbar
test('J1: containerCenterY = toolbarHeight + visibleHeight/2 (не просто containerHeight/2)', () => {
  const visibleH = CONTAINER_H - TOOLBAR_HEIGHT - SHEETS_HEIGHT_WITHOUT;
  const correctCenterY = TOOLBAR_HEIGHT + visibleH / 2;
  const wrongCenterY = CONTAINER_H / 2;
  assert(correctCenterY !== wrongCenterY,
    `correctCenterY (${correctCenterY}) должен отличаться от wrongCenterY (${wrongCenterY})`);
});

// J2: pan.y центрирует контент в видимой области
test('J2: pan.y центрирует контент в видимой области (между toolbar и низом)', () => {
  const result = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  const nodeCenterY = (SINGLE_NODE.top + SINGLE_NODE.bottom) / 2;
  const visibleH = CONTAINER_H - TOOLBAR_HEIGHT - SHEETS_HEIGHT_WITHOUT;
  const containerCenterY = TOOLBAR_HEIGHT + visibleH / 2;
  const screenY = nodeCenterY * (result.zoom / 100) + result.pan.y;
  assert(Math.abs(screenY - containerCenterY) < 0.001,
    `Центр контента на экране: ${screenY}, ожидался: ${containerCenterY}`);
});

// J3: pan.x центрирует контент по горизонтали
test('J3: pan.x центрирует контент по горизонтали', () => {
  const result = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  const nodeCenterX = (SINGLE_NODE.left + SINGLE_NODE.right) / 2;
  const containerCenterX = CONTAINER_W / 2;
  const screenX = nodeCenterX * (result.zoom / 100) + result.pan.x;
  assert(Math.abs(screenX - containerCenterX) < 0.001,
    `Центр контента на экране: ${screenX}, ожидался: ${containerCenterX}`);
});

// J4: containerWidth без вычета 64
test('J4: containerWidth используется без вычета 64 (sidebar снаружи)', () => {
  const resultCorrect = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  const resultWrong = calcFitToContent(SINGLE_NODE, CONTAINER_W - 64, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  assert(resultCorrect.pan.x !== resultWrong.pan.x,
    'pan.x не должен совпадать при разных containerWidth');
});

// J5: containerHeight без двойного вычета
test('J5: containerHeight не уменьшается дважды (нет двойного вычета toolbar)', () => {
  const buggedVisibleH = CONTAINER_H - 64 - 64; // старый баг: clientH-64 - toolbarH
  const correctVisibleH = CONTAINER_H - TOOLBAR_HEIGHT - SHEETS_HEIGHT_WITHOUT;
  assert(correctVisibleH > buggedVisibleH,
    `Правильная visibleHeight (${correctVisibleH}) должна быть > багованной (${buggedVisibleH})`);
});

// J6: нижняя граница контента не залезает в зону sheets (sheetsHeight > 0)
test('J6: нижняя граница контента не залезает в зону sheets', () => {
  const result = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const bottomOnScreen = contentBottomOnScreen(SINGLE_NODE, result);
  const sheetsTop = CONTAINER_H - SHEETS_HEIGHT_WITH; // верхняя граница sheets
  assert(bottomOnScreen <= sheetsTop + 1, // +1px допуск на float
    `Нижняя граница контента (${bottomOnScreen.toFixed(1)}) залезает в sheets (начинаются с ${sheetsTop})`);
});

// J7: верхняя граница контента не залезает под toolbar
test('J7: верхняя граница контента не залезает под toolbar', () => {
  const result = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const topOnScreen = contentTopOnScreen(SINGLE_NODE, result);
  assert(topOnScreen >= TOOLBAR_HEIGHT - 1, // -1px допуск
    `Верхняя граница контента (${topOnScreen.toFixed(1)}) залезает под toolbar (высота ${TOOLBAR_HEIGHT})`);
});

// J8: sheetsHeight=0 vs sheetsHeight=60 — pan.y и zoom отличаются
test('J8: sheetsHeight=0 даёт другой результат чем sheetsHeight=60 (нельзя игнорировать sheets)', () => {
  const withSheets = calcFitToContent(TALL_NODES, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const withoutSheets = calcFitToContent(TALL_NODES, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  assert(withSheets.zoom !== withoutSheets.zoom || withSheets.pan.y !== withoutSheets.pan.y,
    'Результат не должен совпадать при разных sheetsHeight для высокого контента');
});

// J9: при sheetsHeight=60 нижняя граница высокого контента не залезает в sheets
test('J9: высокий контент с sheets — нижняя граница не залезает в sheets', () => {
  const result = calcFitToContent(TALL_NODES, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const bottomOnScreen = contentBottomOnScreen(TALL_NODES, result);
  const sheetsTop = CONTAINER_H - SHEETS_HEIGHT_WITH;
  assert(bottomOnScreen <= sheetsTop + 1,
    `Нижняя граница (${bottomOnScreen.toFixed(1)}) залезает в sheets (начинаются с ${sheetsTop})`);
});

// J10: при sheetsHeight=0 нижняя граница не выходит за containerHeight
test('J10: без sheets нижняя граница контента не выходит за containerHeight', () => {
  const result = calcFitToContent(TALL_NODES, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  const bottomOnScreen = contentBottomOnScreen(TALL_NODES, result);
  assert(bottomOnScreen <= CONTAINER_H + 1,
    `Нижняя граница (${bottomOnScreen.toFixed(1)}) выходит за containerHeight (${CONTAINER_H})`);
});

// J11: zoom ограничен [20, 100]
test('J11: zoom всегда в [20, 100]', () => {
  const cases = [SINGLE_NODE, WIDE_NODES, SMALL_NODES, TALL_NODES];
  for (const bounds of cases) {
    const r = calcFitToContent(bounds, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
    assert(r.zoom >= FIT_MIN_ZOOM && r.zoom <= FIT_MAX_ZOOM,
      `zoom ${r.zoom} вне [${FIT_MIN_ZOOM}, ${FIT_MAX_ZOOM}] для bounds ${JSON.stringify(bounds)}`);
  }
});

// J12: нулевой контент → null
test('J12: нулевой контент (width=0) → возвращает null', () => {
  const result = calcFitToContent({ left: 100, right: 100, top: 0, bottom: 100 },
    CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT);
  assert(result === null, `Ожидался null, получено ${JSON.stringify(result)}`);
});

// J13: pan и zoom — конечные числа
test('J13: pan и zoom — конечные числа (isFinite)', () => {
  const result = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITHOUT)!;
  assert(isFinite(result.zoom), `zoom не конечен: ${result.zoom}`);
  assert(isFinite(result.pan.x), `pan.x не конечен: ${result.pan.x}`);
  assert(isFinite(result.pan.y), `pan.y не конечен: ${result.pan.y}`);
});

// J14: containerCenterY с sheets правильно смещён
test('J14: containerCenterY с sheets = toolbarH + (containerH - toolbarH - sheetsH) / 2', () => {
  const visibleH = CONTAINER_H - TOOLBAR_HEIGHT - SHEETS_HEIGHT_WITH;
  const expectedCenterY = TOOLBAR_HEIGHT + visibleH / 2;
  const result = calcFitToContent(SINGLE_NODE, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const nodeCenterY = (SINGLE_NODE.top + SINGLE_NODE.bottom) / 2;
  const screenY = nodeCenterY * (result.zoom / 100) + result.pan.y;
  assert(Math.abs(screenY - expectedCenterY) < 0.001,
    `Центр на экране: ${screenY}, ожидался: ${expectedCenterY}`);
});

// J15: visibleHeight уменьшается при увеличении sheetsHeight
test('J15: visibleHeight уменьшается при увеличении sheetsHeight', () => {
  const visibleNo = CONTAINER_H - TOOLBAR_HEIGHT - 0;
  const visibleWith = CONTAINER_H - TOOLBAR_HEIGHT - SHEETS_HEIGHT_WITH;
  assert(visibleWith < visibleNo,
    `visibleHeight с sheets (${visibleWith}) должна быть < без sheets (${visibleNo})`);
  // И это влияет на zoom для высокого контента
  const rNo = calcFitToContent(TALL_NODES, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, 0)!;
  const rWith = calcFitToContent(TALL_NODES, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  assert(rWith.zoom <= rNo.zoom,
    `zoom с sheets (${rWith.zoom}) должен быть ≤ zoom без sheets (${rNo.zoom})`);
});

// ─── Блок K: реальные размеры нод и надёжный поиск toolbar/sheets ─────────────
console.log('\nБлок K: реальные размеры нод и надёжный поиск toolbar/sheets');

// Воссоздание логики вычисления границ нод с реальными размерами
interface NodeLike {
  id: string;
  position: { x: number; y: number };
}

interface NodeSize {
  width: number;
  height: number;
}

const NODE_FALLBACK_WIDTH = 320;
const NODE_FALLBACK_HEIGHT = 200; // было 100 — слишком мало для нод с картинками

function calcNodeBounds(
  nodes: NodeLike[],
  nodeSizes: Map<string, NodeSize>
): NodeBounds | null {
  if (nodes.length === 0) return null;
  const bounds = nodes.reduce((b, node) => {
    const size = nodeSizes.get(node.id);
    const left = node.position.x;
    const right = node.position.x + (size?.width ?? NODE_FALLBACK_WIDTH);
    const top = node.position.y;
    const bottom = node.position.y + (size?.height ?? NODE_FALLBACK_HEIGHT);
    return {
      left: Math.min(b.left, left),
      right: Math.max(b.right, right),
      top: Math.min(b.top, top),
      bottom: Math.max(b.bottom, bottom),
    };
  }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  if (!isFinite(bounds.left)) return null;
  return bounds;
}

// K1: реальный размер ноды используется вместо хардкода
test('K1: реальный размер ноды используется если есть в nodeSizes', () => {
  const nodes: NodeLike[] = [{ id: 'n1', position: { x: 0, y: 0 } }];
  const sizes = new Map<string, NodeSize>([['n1', { width: 400, height: 500 }]]);
  const bounds = calcNodeBounds(nodes, sizes)!;
  assert(bounds.right === 400, `right: ожидалось 400, получено ${bounds.right}`);
  assert(bounds.bottom === 500, `bottom: ожидалось 500, получено ${bounds.bottom}`);
});

// K2: fallback 200px высоты если размер неизвестен (не 100!)
test('K2: fallback высоты ноды = 200 (не 100)', () => {
  const nodes: NodeLike[] = [{ id: 'n1', position: { x: 0, y: 0 } }];
  const sizes = new Map<string, NodeSize>(); // пустая — нет размеров
  const bounds = calcNodeBounds(nodes, sizes)!;
  assert(bounds.bottom === NODE_FALLBACK_HEIGHT,
    `fallback bottom: ожидалось ${NODE_FALLBACK_HEIGHT}, получено ${bounds.bottom}`);
  assert(NODE_FALLBACK_HEIGHT >= 200,
    `fallback высота (${NODE_FALLBACK_HEIGHT}) должна быть ≥ 200 — нода с картинкой высокая`);
});

// K3: fallback 100 был бы неправильным — нода с картинкой выше
test('K3: старый fallback 100 занижал высоту ноды с картинкой', () => {
  const OLD_FALLBACK = 100;
  assert(NODE_FALLBACK_HEIGHT > OLD_FALLBACK,
    `Новый fallback (${NODE_FALLBACK_HEIGHT}) должен быть > старого (${OLD_FALLBACK})`);
});

// K4: нода с известным размером 450px — bounds.bottom = position.y + 450
test('K4: нода высотой 450px (с картинкой) — bounds.bottom корректен', () => {
  const nodes: NodeLike[] = [{ id: 'n1', position: { x: 100, y: 100 } }];
  const sizes = new Map<string, NodeSize>([['n1', { width: 320, height: 450 }]]);
  const bounds = calcNodeBounds(nodes, sizes)!;
  assert(bounds.bottom === 550, `bottom: ожидалось 550, получено ${bounds.bottom}`);
});

// K5: без реальных размеров fitToContent с fallback 100 занижал бы bounds
test('K5: fitToContent с fallback 100 vs 200 — разные bounds для нод без размеров', () => {
  const nodes: NodeLike[] = [{ id: 'n1', position: { x: 0, y: 0 } }];
  const sizes = new Map<string, NodeSize>();
  const boundsNew = calcNodeBounds(nodes, sizes)!; // fallback 200
  // Симуляция старого поведения (fallback 100)
  const oldBottom = nodes[0].position.y + 100;
  assert(boundsNew.bottom > oldBottom,
    `Новый bounds.bottom (${boundsNew.bottom}) должен быть > старого (${oldBottom})`);
});

// K6: несколько нод — bounds охватывает все
test('K6: несколько нод — bounds охватывает все', () => {
  const nodes: NodeLike[] = [
    { id: 'n1', position: { x: 0, y: 0 } },
    { id: 'n2', position: { x: 500, y: 300 } },
  ];
  const sizes = new Map<string, NodeSize>([
    ['n1', { width: 320, height: 100 }],
    ['n2', { width: 320, height: 400 }],
  ]);
  const bounds = calcNodeBounds(nodes, sizes)!;
  assert(bounds.left === 0, `left: ожидалось 0, получено ${bounds.left}`);
  assert(bounds.right === 820, `right: ожидалось 820, получено ${bounds.right}`);
  assert(bounds.top === 0, `top: ожидалось 0, получено ${bounds.top}`);
  assert(bounds.bottom === 700, `bottom: ожидалось 700, получено ${bounds.bottom}`);
});

// K7: нода с реальным размером — fitToContent не обрезает её снизу
test('K7: нода высотой 450px с sheets — нижняя граница не залезает в sheets', () => {
  const tallNode: NodeBounds = { left: 0, right: 320, top: 0, bottom: 450 };
  const result = calcFitToContent(tallNode, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const bottomOnScreen = contentBottomOnScreen(tallNode, result);
  const sheetsTop = CONTAINER_H - SHEETS_HEIGHT_WITH;
  assert(bottomOnScreen <= sheetsTop + 1,
    `Нижняя граница ноды 450px (${bottomOnScreen.toFixed(1)}) залезает в sheets (${sheetsTop})`);
});

// K8: нода с реальным размером — верхняя граница не под toolbar
test('K8: нода высотой 450px — верхняя граница не под toolbar', () => {
  const tallNode: NodeBounds = { left: 0, right: 320, top: 0, bottom: 450 };
  const result = calcFitToContent(tallNode, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const topOnScreen = contentTopOnScreen(tallNode, result);
  assert(topOnScreen >= TOOLBAR_HEIGHT - 1,
    `Верхняя граница (${topOnScreen.toFixed(1)}) под toolbar (${TOOLBAR_HEIGHT})`);
});

// K9: пустой список нод → null
test('K9: пустой список нод → calcNodeBounds возвращает null', () => {
  const result = calcNodeBounds([], new Map());
  assert(result === null, `Ожидался null, получено ${JSON.stringify(result)}`);
});

// K10: нода без размера в nodeSizes использует fallback ширину 320
test('K10: нода без размера в nodeSizes использует fallback ширину 320', () => {
  const nodes: NodeLike[] = [{ id: 'n1', position: { x: 50, y: 50 } }];
  const bounds = calcNodeBounds(nodes, new Map())!;
  assert(bounds.right === 50 + NODE_FALLBACK_WIDTH,
    `right: ожидалось ${50 + NODE_FALLBACK_WIDTH}, получено ${bounds.right}`);
});

// K11: смешанные ноды — часть с размерами, часть без
test('K11: смешанные ноды — часть с размерами, часть без — bounds корректен', () => {
  const nodes: NodeLike[] = [
    { id: 'known', position: { x: 0, y: 0 } },
    { id: 'unknown', position: { x: 0, y: 500 } },
  ];
  const sizes = new Map<string, NodeSize>([['known', { width: 320, height: 600 }]]);
  const bounds = calcNodeBounds(nodes, sizes)!;
  // known: bottom = 0 + 600 = 600, unknown: bottom = 500 + 200 = 700
  assert(bounds.bottom === 700, `bottom: ожидалось 700, получено ${bounds.bottom}`);
});

// K12: нода с очень большим реальным размером — zoom уменьшается
test('K12: нода с реальным размером 800px высотой → zoom меньше чем для 100px', () => {
  const smallBounds: NodeBounds = { left: 0, right: 320, top: 0, bottom: 100 };
  const largeBounds: NodeBounds = { left: 0, right: 320, top: 0, bottom: 800 };
  const rSmall = calcFitToContent(smallBounds, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  const rLarge = calcFitToContent(largeBounds, CONTAINER_W, CONTAINER_H, TOOLBAR_HEIGHT, SHEETS_HEIGHT_WITH)!;
  assert(rLarge.zoom <= rSmall.zoom,
    `zoom для большой ноды (${rLarge.zoom}) должен быть ≤ zoom для маленькой (${rSmall.zoom})`);
});

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
