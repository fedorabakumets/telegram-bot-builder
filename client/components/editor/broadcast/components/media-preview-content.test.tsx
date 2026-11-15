/**
 * @fileoverview Проверяет сохранение сведений о вложении при ошибке загрузки превью.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MediaPreviewContent } from './media-preview-content';

afterEach(cleanup);

describe('Превью вложения рассылки', () => {
  it('оставляет имя изображения и понятную ошибку вместо исчезновения вложения', () => {
    render(<MediaPreviewContent src="/uploads/photo.jpg" kind="photo" name="photo.jpg" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Изображение: photo.jpg')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Не удалось загрузить вложение');
  });

  it('показывает новое изображение после замены недоступного адреса', () => {
    const view = render(<MediaPreviewContent src="/missing.jpg" kind="photo" name="Фото" />);
    fireEvent.error(screen.getByRole('img'));
    view.rerender(<MediaPreviewContent src="/available.jpg" kind="photo" name="Фото" />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/available.jpg');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
