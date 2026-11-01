/** @fileoverview Проверка точного перехода к боту без сохранения чужого контекста сообщений. */
import { describe, it, expect } from 'vitest';
import { buildBotPanelHref } from '../panel/table/bot-panel-link';

describe('Ссылка на бота в конструкторе', () => {
  it('указывает проект, нужного бота и текущий лист', () => {
    expect(buildBotPanelHref(13, 11, '?tab=files&sheet=current&message=22&dialogUser=123&bot=9'))
      .toBe('/projects/13?tab=bot&bot=11&sheet=current#bot-13-11');
  });
  it('работает без выбранного листа', () => {
    expect(buildBotPanelHref(12, 9, '')).toBe('/projects/12?tab=bot&bot=9#bot-12-9');
  });
});
