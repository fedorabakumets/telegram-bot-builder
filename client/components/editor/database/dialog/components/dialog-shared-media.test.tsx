/** @fileoverview Проверка фото с просмотром и ссылок в сохранённых материалах профиля. */
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useInfiniteQuery: mocks.query }));
vi.mock('./image-lightbox', () => ({
  /** Упрощённый просмотр позволяет проверить адрес выбранного фото. */
  ImageLightbox: ({ src }: { /** Адрес просмотренного файла. */ src: string }) => <img alt="Просмотр" src={src} />,
}));
import { DialogSharedMedia } from './dialog-shared-media';
afterEach(cleanup);

it('показывает фото через адрес профиля и открывает его в просмотре', () => {
  mocks.query.mockReturnValue({ data: { pages: [{ items: [{ photos: [{ id: 4, name: 'Фото.jpg' }], links: ['https://example.org/'] }] }] } });
  render(<DialogSharedMedia projectId={12} userId="15" />);
  fireEvent.click(screen.getByRole('button', { name: 'Открыть фото Фото.jpg' }));
  expect(screen.getByAltText('Просмотр').getAttribute('src')).toBe('/api/projects/12/dialog-profiles/15/content/media/4?');
  fireEvent.click(screen.getByRole('tab', { name: 'Ссылки · 1' }));
  const link = screen.getByRole('link', { name: 'https://example.org/' });
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
});

it('не выдаёт пустой список за успешную загрузку при ошибке', () => {
  mocks.query.mockReturnValue({ isError: true, refetch: vi.fn() });
  render(<DialogSharedMedia projectId={12} userId="15" tokenId={7} />);
  expect(screen.getByRole('alert').textContent).toContain('Не удалось загрузить материалы');
  expect(screen.queryByText('Сохранённых фото пока нет.')).toBeNull();
});
