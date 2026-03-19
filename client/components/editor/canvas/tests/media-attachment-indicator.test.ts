/**
 * Тесты для логики getMediaInfo из canvas-node/media-attachment-indicator.tsx
 * Запуск: npx tsx client/components/editor/canvas/tests/media-attachment-indicator.test.ts
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

// Воссоздание логики getMediaInfo из media-attachment-indicator.tsx
type MediaInfo = { icon: string; text: string } | null;

function getMediaInfo(nodeData: Record<string, any>): MediaInfo {
  if (nodeData.videoUrl) return { icon: 'video', text: 'Видео прикреплено' };
  if (nodeData.audioUrl) return { icon: 'music', text: 'Аудио прикреплено' };
  if (nodeData.documentUrl) return { icon: 'file', text: 'Документ прикреплен' };
  return null;
}

// ─── Блок A: Граничные случаи ────────────────────────────────────────────────
console.log('\nБлок A: Граничные случаи (пустой объект, undefined поля)');

test('A1: пустой объект → null', () => assert(getMediaInfo({}) === null, 'Ожидался null'));
test('A2: объект без медиа-полей → null', () => assert(getMediaInfo({ messageText: 'hello' }) === null, 'Ожидался null'));
test('A3: undefined videoUrl → null', () => assert(getMediaInfo({ videoUrl: undefined }) === null, 'Ожидался null'));
test('A4: undefined audioUrl → null', () => assert(getMediaInfo({ audioUrl: undefined }) === null, 'Ожидался null'));
test('A5: undefined documentUrl → null', () => assert(getMediaInfo({ documentUrl: undefined }) === null, 'Ожидался null'));
test('A6: все три undefined → null', () => assert(getMediaInfo({ videoUrl: undefined, audioUrl: undefined, documentUrl: undefined }) === null, 'Ожидался null'));
test('A7: null videoUrl → null', () => assert(getMediaInfo({ videoUrl: null }) === null, 'Ожидался null'));
test('A8: null audioUrl → null', () => assert(getMediaInfo({ audioUrl: null }) === null, 'Ожидался null'));
test('A9: null documentUrl → null', () => assert(getMediaInfo({ documentUrl: null }) === null, 'Ожидался null'));
test('A10: произвольные поля без медиа → null', () => assert(getMediaInfo({ name: 'test', value: 42, flag: true }) === null, 'Ожидался null'));

// ─── Блок B: videoUrl ────────────────────────────────────────────────────────
console.log('\nБлок B: videoUrl — возвращает { icon: "video", text: "Видео прикреплено" }');

test('B1: videoUrl → не null', () => assert(getMediaInfo({ videoUrl: 'https://example.com/video.mp4' }) !== null, 'Ожидался не null'));
test('B2: videoUrl → icon = "video"', () => assert(getMediaInfo({ videoUrl: 'https://example.com/video.mp4' })?.icon === 'video', 'Ожидался icon "video"'));
test('B3: videoUrl → text = "Видео прикреплено"', () => assert(getMediaInfo({ videoUrl: 'https://example.com/video.mp4' })?.text === 'Видео прикреплено', 'Ожидался text "Видео прикреплено"'));
test('B4: videoUrl короткий → icon = "video"', () => assert(getMediaInfo({ videoUrl: 'v' })?.icon === 'video', 'Ожидался icon "video"'));
test('B5: videoUrl = "1" → не null', () => assert(getMediaInfo({ videoUrl: '1' }) !== null, 'Ожидался не null'));
test('B6: videoUrl → результат содержит ровно 2 поля', () => {
  const result = getMediaInfo({ videoUrl: 'url' });
  assert(result !== null && Object.keys(result).length === 2, 'Ожидалось 2 поля');
});
test('B7: videoUrl → поле icon существует', () => {
  const result = getMediaInfo({ videoUrl: 'url' });
  assert(result !== null && 'icon' in result, 'Поле icon отсутствует');
});
test('B8: videoUrl → поле text существует', () => {
  const result = getMediaInfo({ videoUrl: 'url' });
  assert(result !== null && 'text' in result, 'Поле text отсутствует');
});
test('B9: videoUrl с пробелами → не null (truthy строка)', () => assert(getMediaInfo({ videoUrl: '   ' }) !== null, 'Ожидался не null'));
test('B10: videoUrl = true → не null', () => assert(getMediaInfo({ videoUrl: true }) !== null, 'Ожидался не null'));

// ─── Блок C: audioUrl ────────────────────────────────────────────────────────
console.log('\nБлок C: audioUrl — возвращает { icon: "music", text: "Аудио прикреплено" }');

test('C1: audioUrl → не null', () => assert(getMediaInfo({ audioUrl: 'https://example.com/audio.mp3' }) !== null, 'Ожидался не null'));
test('C2: audioUrl → icon = "music"', () => assert(getMediaInfo({ audioUrl: 'https://example.com/audio.mp3' })?.icon === 'music', 'Ожидался icon "music"'));
test('C3: audioUrl → text = "Аудио прикреплено"', () => assert(getMediaInfo({ audioUrl: 'https://example.com/audio.mp3' })?.text === 'Аудио прикреплено', 'Ожидался text "Аудио прикреплено"'));
test('C4: audioUrl короткий → icon = "music"', () => assert(getMediaInfo({ audioUrl: 'a' })?.icon === 'music', 'Ожидался icon "music"'));
test('C5: audioUrl = "1" → не null', () => assert(getMediaInfo({ audioUrl: '1' }) !== null, 'Ожидался не null'));
test('C6: audioUrl → результат содержит ровно 2 поля', () => {
  const result = getMediaInfo({ audioUrl: 'url' });
  assert(result !== null && Object.keys(result).length === 2, 'Ожидалось 2 поля');
});
test('C7: audioUrl → icon не "video"', () => assert(getMediaInfo({ audioUrl: 'url' })?.icon !== 'video', 'icon не должен быть "video"'));
test('C8: audioUrl → icon не "file"', () => assert(getMediaInfo({ audioUrl: 'url' })?.icon !== 'file', 'icon не должен быть "file"'));
test('C9: audioUrl = true → icon = "music"', () => assert(getMediaInfo({ audioUrl: true })?.icon === 'music', 'Ожидался icon "music"'));
test('C10: audioUrl → text не "Видео прикреплено"', () => assert(getMediaInfo({ audioUrl: 'url' })?.text !== 'Видео прикреплено', 'text не должен быть "Видео прикреплено"'));

// ─── Блок D: documentUrl ─────────────────────────────────────────────────────
console.log('\nБлок D: documentUrl — возвращает { icon: "file", text: "Документ прикреплен" }');

test('D1: documentUrl → не null', () => assert(getMediaInfo({ documentUrl: 'https://example.com/doc.pdf' }) !== null, 'Ожидался не null'));
test('D2: documentUrl → icon = "file"', () => assert(getMediaInfo({ documentUrl: 'https://example.com/doc.pdf' })?.icon === 'file', 'Ожидался icon "file"'));
test('D3: documentUrl → text = "Документ прикреплен"', () => assert(getMediaInfo({ documentUrl: 'https://example.com/doc.pdf' })?.text === 'Документ прикреплен', 'Ожидался text "Документ прикреплен"'));
test('D4: documentUrl короткий → icon = "file"', () => assert(getMediaInfo({ documentUrl: 'd' })?.icon === 'file', 'Ожидался icon "file"'));
test('D5: documentUrl = "1" → не null', () => assert(getMediaInfo({ documentUrl: '1' }) !== null, 'Ожидался не null'));
test('D6: documentUrl → результат содержит ровно 2 поля', () => {
  const result = getMediaInfo({ documentUrl: 'url' });
  assert(result !== null && Object.keys(result).length === 2, 'Ожидалось 2 поля');
});
test('D7: documentUrl → icon не "video"', () => assert(getMediaInfo({ documentUrl: 'url' })?.icon !== 'video', 'icon не должен быть "video"'));
test('D8: documentUrl → icon не "music"', () => assert(getMediaInfo({ documentUrl: 'url' })?.icon !== 'music', 'icon не должен быть "music"'));
test('D9: documentUrl = true → icon = "file"', () => assert(getMediaInfo({ documentUrl: true })?.icon === 'file', 'Ожидался icon "file"'));
test('D10: documentUrl → text не "Аудио прикреплено"', () => assert(getMediaInfo({ documentUrl: 'url' })?.text !== 'Аудио прикреплено', 'text не должен быть "Аудио прикреплено"'));

// ─── Блок E: Приоритет videoUrl над audioUrl и documentUrl ───────────────────
console.log('\nБлок E: Приоритет — videoUrl имеет приоритет над audioUrl и documentUrl');

test('E1: videoUrl + audioUrl → icon = "video"', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a' })?.icon === 'video', 'Ожидался icon "video"'));
test('E2: videoUrl + documentUrl → icon = "video"', () => assert(getMediaInfo({ videoUrl: 'v', documentUrl: 'd' })?.icon === 'video', 'Ожидался icon "video"'));
test('E3: videoUrl + audioUrl + documentUrl → icon = "video"', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a', documentUrl: 'd' })?.icon === 'video', 'Ожидался icon "video"'));
test('E4: videoUrl + audioUrl → text = "Видео прикреплено"', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a' })?.text === 'Видео прикреплено', 'Ожидался text "Видео прикреплено"'));
test('E5: videoUrl + documentUrl → text = "Видео прикреплено"', () => assert(getMediaInfo({ videoUrl: 'v', documentUrl: 'd' })?.text === 'Видео прикреплено', 'Ожидался text "Видео прикреплено"'));
test('E6: videoUrl + audioUrl → не null', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a' }) !== null, 'Ожидался не null'));
test('E7: videoUrl + audioUrl + documentUrl → не null', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a', documentUrl: 'd' }) !== null, 'Ожидался не null'));

// ─── Блок F: Приоритет audioUrl над documentUrl ──────────────────────────────
console.log('\nБлок F: Приоритет — audioUrl имеет приоритет над documentUrl');

test('F1: audioUrl + documentUrl → icon = "music"', () => assert(getMediaInfo({ audioUrl: 'a', documentUrl: 'd' })?.icon === 'music', 'Ожидался icon "music"'));
test('F2: audioUrl + documentUrl → text = "Аудио прикреплено"', () => assert(getMediaInfo({ audioUrl: 'a', documentUrl: 'd' })?.text === 'Аудио прикреплено', 'Ожидался text "Аудио прикреплено"'));
test('F3: audioUrl + documentUrl → не null', () => assert(getMediaInfo({ audioUrl: 'a', documentUrl: 'd' }) !== null, 'Ожидался не null'));
test('F4: audioUrl + documentUrl → icon не "file"', () => assert(getMediaInfo({ audioUrl: 'a', documentUrl: 'd' })?.icon !== 'file', 'icon не должен быть "file"'));
test('F5: только documentUrl → icon = "file" (audioUrl отсутствует)', () => assert(getMediaInfo({ documentUrl: 'd' })?.icon === 'file', 'Ожидался icon "file"'));

// ─── Блок G: Разные значения URL ─────────────────────────────────────────────
console.log('\nБлок G: Разные значения URL (пустая строка → null, непустая → не null)');

test('G1: videoUrl = "" → null', () => assert(getMediaInfo({ videoUrl: '' }) === null, 'Ожидался null'));
test('G2: audioUrl = "" → null', () => assert(getMediaInfo({ audioUrl: '' }) === null, 'Ожидался null'));
test('G3: documentUrl = "" → null', () => assert(getMediaInfo({ documentUrl: '' }) === null, 'Ожидался null'));
test('G4: videoUrl = "https://..." → не null', () => assert(getMediaInfo({ videoUrl: 'https://cdn.example.com/video.mp4' }) !== null, 'Ожидался не null'));
test('G5: audioUrl = "https://..." → не null', () => assert(getMediaInfo({ audioUrl: 'https://cdn.example.com/audio.ogg' }) !== null, 'Ожидался не null'));
test('G6: documentUrl = "https://..." → не null', () => assert(getMediaInfo({ documentUrl: 'https://cdn.example.com/file.pdf' }) !== null, 'Ожидался не null'));
test('G7: videoUrl = "file_id_123" → не null', () => assert(getMediaInfo({ videoUrl: 'file_id_123' }) !== null, 'Ожидался не null'));
test('G8: все три пустые строки → null', () => assert(getMediaInfo({ videoUrl: '', audioUrl: '', documentUrl: '' }) === null, 'Ожидался null'));

// ─── Блок H: Числовые/булевы значения ────────────────────────────────────────
console.log('\nБлок H: Числовые/булевы значения (falsy → null, truthy → не null)');

test('H1: videoUrl = 0 → null', () => assert(getMediaInfo({ videoUrl: 0 }) === null, 'Ожидался null'));
test('H2: audioUrl = 0 → null', () => assert(getMediaInfo({ audioUrl: 0 }) === null, 'Ожидался null'));
test('H3: documentUrl = 0 → null', () => assert(getMediaInfo({ documentUrl: 0 }) === null, 'Ожидался null'));
test('H4: videoUrl = false → null', () => assert(getMediaInfo({ videoUrl: false }) === null, 'Ожидался null'));
test('H5: audioUrl = false → null', () => assert(getMediaInfo({ audioUrl: false }) === null, 'Ожидался null'));
test('H6: documentUrl = false → null', () => assert(getMediaInfo({ documentUrl: false }) === null, 'Ожидался null'));
test('H7: videoUrl = 1 → не null', () => assert(getMediaInfo({ videoUrl: 1 }) !== null, 'Ожидался не null'));
test('H8: audioUrl = 1 → не null', () => assert(getMediaInfo({ audioUrl: 1 }) !== null, 'Ожидался не null'));
test('H9: documentUrl = 1 → не null', () => assert(getMediaInfo({ documentUrl: 1 }) !== null, 'Ожидался не null'));
test('H10: videoUrl = true → не null', () => assert(getMediaInfo({ videoUrl: true }) !== null, 'Ожидался не null'));

// ─── Блок I: Комбинации всех трёх полей ──────────────────────────────────────
console.log('\nБлок I: Комбинации всех трёх полей одновременно — приоритет videoUrl');

test('I1: все три truthy → icon = "video"', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a', documentUrl: 'd' })?.icon === 'video', 'Ожидался icon "video"'));
test('I2: все три truthy → text = "Видео прикреплено"', () => assert(getMediaInfo({ videoUrl: 'v', audioUrl: 'a', documentUrl: 'd' })?.text === 'Видео прикреплено', 'Ожидался text "Видео прикреплено"'));
test('I3: videoUrl falsy, остальные truthy → icon = "music"', () => assert(getMediaInfo({ videoUrl: '', audioUrl: 'a', documentUrl: 'd' })?.icon === 'music', 'Ожидался icon "music"'));
test('I4: videoUrl и audioUrl falsy, documentUrl truthy → icon = "file"', () => assert(getMediaInfo({ videoUrl: '', audioUrl: '', documentUrl: 'd' })?.icon === 'file', 'Ожидался icon "file"'));
test('I5: все три falsy → null', () => assert(getMediaInfo({ videoUrl: '', audioUrl: '', documentUrl: '' }) === null, 'Ожидался null'));
test('I6: videoUrl null, audioUrl truthy → icon = "music"', () => assert(getMediaInfo({ videoUrl: null, audioUrl: 'a' })?.icon === 'music', 'Ожидался icon "music"'));
test('I7: videoUrl null, audioUrl null, documentUrl truthy → icon = "file"', () => assert(getMediaInfo({ videoUrl: null, audioUrl: null, documentUrl: 'd' })?.icon === 'file', 'Ожидался icon "file"'));

// ─── Блок J: Результат содержит правильные поля ───────────────────────────────
console.log('\nБлок J: Результат содержит правильные поля icon и text (не undefined, не null)');

test('J1: videoUrl → icon не undefined', () => assert(getMediaInfo({ videoUrl: 'v' })?.icon !== undefined, 'icon не должен быть undefined'));
test('J2: videoUrl → text не undefined', () => assert(getMediaInfo({ videoUrl: 'v' })?.text !== undefined, 'text не должен быть undefined'));
test('J3: audioUrl → icon не undefined', () => assert(getMediaInfo({ audioUrl: 'a' })?.icon !== undefined, 'icon не должен быть undefined'));
test('J4: audioUrl → text не undefined', () => assert(getMediaInfo({ audioUrl: 'a' })?.text !== undefined, 'text не должен быть undefined'));
test('J5: documentUrl → icon не undefined', () => assert(getMediaInfo({ documentUrl: 'd' })?.icon !== undefined, 'icon не должен быть undefined'));
test('J6: documentUrl → text не undefined', () => assert(getMediaInfo({ documentUrl: 'd' })?.text !== undefined, 'text не должен быть undefined'));
test('J7: videoUrl → icon — строка', () => assert(typeof getMediaInfo({ videoUrl: 'v' })?.icon === 'string', 'icon должен быть строкой'));
test('J8: audioUrl → text — строка', () => assert(typeof getMediaInfo({ audioUrl: 'a' })?.text === 'string', 'text должен быть строкой'));
test('J9: documentUrl → icon — строка', () => assert(typeof getMediaInfo({ documentUrl: 'd' })?.icon === 'string', 'icon должен быть строкой'));
test('J10: все три иконки — непустые строки', () => {
  const icons = [
    getMediaInfo({ videoUrl: 'v' })?.icon,
    getMediaInfo({ audioUrl: 'a' })?.icon,
    getMediaInfo({ documentUrl: 'd' })?.icon,
  ];
  for (const icon of icons) {
    assert(typeof icon === 'string' && icon.length > 0, `icon "${icon}" пустой или не строка`);
  }
});

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
