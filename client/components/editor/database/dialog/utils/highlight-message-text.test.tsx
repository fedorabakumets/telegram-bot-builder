/** @fileoverview Проверка буквальной подсветки текста с сохранением ссылок и форматирования. */
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { highlightMessageText } from './highlight-message-text';

afterEach(cleanup);
it('выделяет только найденное слово без обводки сообщения', () => {
  const { container } = render(<p>{highlightMessageText('/start link_[скрыто]', 'скрыт')}</p>);
  expect(container.querySelector('mark')?.textContent).toBe('скрыт');
  expect(container.textContent).toBe('/start link_[скрыто]');
  expect(container.querySelector('[class*="ring-"]')).toBeNull();
});
it('сохраняет адрес ссылки и вложенное форматирование', () => {
  render(<div>{highlightMessageText(<a href="https://example.com"><strong>Скрыто</strong></a>, 'скрыт')}</div>);
  expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  expect(screen.getByRole('link').querySelector('strong mark')?.textContent).toBe('Скрыт');
});
it('ищет спецсимволы буквально и не выделяет посторонние слова', () => {
  const { container } = render(<div>{highlightMessageText('a+b aab', 'a+b')}</div>);
  expect(container.querySelectorAll('mark')).toHaveLength(1);
  expect(container.querySelector('mark')?.textContent).toBe('a+b');
});
