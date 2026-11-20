/** @fileoverview Защита отдельных действий и портальных панелей от раскрытия строки. */
import { describe, expect, it } from 'vitest';
import { shouldToggleUserRow } from './should-toggle-user-row';
describe('Раскрытие строки пользователя', () => {
  it('раскрывает свободную область и сохраняет самостоятельные кнопки', () => {
    const row = document.createElement('div');
    row.innerHTML = '<span>Статус</span><button><img alt="Аватар" /></button><button><span>Имя</span></button>';
    expect(shouldToggleUserRow({ currentTarget: row, target: row.firstElementChild! })).toBe(true);
    expect(shouldToggleUserRow({ currentTarget: row, target: row.querySelector('img')! })).toBe(false);
    expect(shouldToggleUserRow({ currentTarget: row, target: row.querySelector('button span')! })).toBe(false);
  });
  it('не реагирует на портал или содержимое строки бота в мобильной карточке', () => {
    const row = document.createElement('div');
    row.innerHTML = '<section data-user-bot-details><span>Бот</span></section>';
    expect(shouldToggleUserRow({ currentTarget: row, target: document.createElement('p') })).toBe(false);
    expect(shouldToggleUserRow({ currentTarget: row, target: row.querySelector('span')! })).toBe(false);
  });
});
