/** @fileoverview Проверяет доступность копирования изображений и объяснение неподдерживаемого формата. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FileCopyButton } from '../panel/table/file-copy-button';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('объясняет, что видео нужно скачать, не копируя ссылку вместо файла', async () => {
  const write = vi.fn();
  vi.stubGlobal('ClipboardItem', class ClipboardItem {});
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write } });
  render(<FileCopyButton href="/video.mp4" name="video.mp4" image={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Копировать файл video.mp4' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Скачайте файл');
  expect(write).not.toHaveBeenCalled();
});

it('копирует изображение как PNG', async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  const clipboardItem = vi.fn(function (this: object, data: object) { Object.assign(this, data); });
  vi.stubGlobal('ClipboardItem', clipboardItem);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['png'], { type: 'image/png' }) }));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write } });
  render(<FileCopyButton href="/image.png" name="image.png" image />);
  fireEvent.click(screen.getByRole('button', { name: 'Копировать файл image.png' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Изображение скопировано'));
  expect(write).toHaveBeenCalledOnce();
  expect(clipboardItem.mock.calls[0][0]).toHaveProperty('image/png');
});
