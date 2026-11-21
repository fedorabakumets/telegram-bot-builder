/** @fileoverview Проверяет минимальную версию Telethon для воспроизводимого окружения бота. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateRequirementsTxt } from '../scaffolding/generateRequirementsTxt';

/** Закрепляет совместимую основную версию клиентского API при экспорте проекта. */
test('новые окружения получают Telethon с актуальными типами кнопок', () => {
  assert.match(generateRequirementsTxt(), /^telethon>=1\.46\.0,<2\s/m);
});
