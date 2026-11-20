/** @fileoverview Проверки отдельных источников девяти наследуемых настроек. */

import { expect, it } from 'vitest';
import { BOT_INHERITED_SETTING_KEYS, DEFAULT_BOT_SETTINGS, resolveBotInheritedSettings } from './bot-inherited-settings';

/** Настройки проекта отличаются от начальных по всем полям. */
const project = {
  saveIncomingMedia: 1, messagesRetentionDays: 30, contentCache: 1, logLevel: 'ERROR',
  catchAllHandlers: 0, trackUserBlocks: 0, trackGroupMembership: 0, protectContent: 1,
  webhookBaseUrl: 'https://example.com',
};

it.each(BOT_INHERITED_SETTING_KEYS)('наследует только явно указанное поле %s', (key) => {
  const own = { ...DEFAULT_BOT_SETTINGS, inheritBotSettings: [key] };
  expect(resolveBotInheritedSettings(project, own)).toEqual({ ...DEFAULT_BOT_SETTINGS, [key]: project[key] });
});

it('сохраняет собственные 0 и null для старого бота и после выхода из наследования', () => {
  const own = { messagesRetentionDays: 0, saveIncomingMedia: 0, webhookBaseUrl: null };
  expect(resolveBotInheritedSettings(project, own)).toMatchObject(own);
  expect(resolveBotInheritedSettings(project, { ...own, inheritBotSettings: ['contentCache'] }))
    .toMatchObject({ ...own, contentCache: 1 });
});

it('сохраняет нулевое значение срока хранения из проекта поверх собственного срока', () => {
  expect(resolveBotInheritedSettings({ messagesRetentionDays: 0 }, {
    messagesRetentionDays: 365, inheritBotSettings: ['messagesRetentionDays'],
  }).messagesRetentionDays).toBe(0);
});
