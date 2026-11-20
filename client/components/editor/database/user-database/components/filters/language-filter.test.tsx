/** @fileoverview Проверка языкового селектора с русскими подписями и количествами пользователей. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../content/user-directory-controls', () => ({ useDirectoryControls: () => ({
  result: { languageCounts: { ru: 10, en: 3, __unknown__: 2 } },
}) }));
import { LanguageFilter } from './language-filter';
afterEach(cleanup);
/** Селектор показывает общее количество и подпись выбранного языка. */
it('показывает количество людей у выбранного языка и у всех языков', () => {
  const view = render(<LanguageFilter onChange={() => {}} />);
  expect(screen.getByRole('combobox', { name: 'Язык Telegram' }).textContent).toContain('Все языки · 15');
  view.rerender(<LanguageFilter value="ru" onChange={() => {}} />);
  expect(screen.getByRole('combobox', { name: 'Язык Telegram' }).textContent).toContain('Русский (ru) · 10');
});
/** Отсутствие языка имеет понятную подпись и собственное количество. */
it('выделяет людей без указанного языка', () => {
  render(<LanguageFilter value="__unknown__" onChange={() => {}} />);
  expect(screen.getByRole('combobox', { name: 'Язык Telegram' }).textContent).toContain('Язык не указан · 2');
});
