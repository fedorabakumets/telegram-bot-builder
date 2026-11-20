/** @fileoverview Проверка видимой заглушки при ожидании фото и смене бота. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { UserAvatar } from '../../components/user-avatar';
afterEach(cleanup);
/** Изображение заменяет иконку только после успешной загрузки текущего URL. */
it('сохраняет иконку во время загрузки, ошибки и смены бота', () => {
  const view = render(<UserAvatar messageType="user" user={{ userId: '6355903138' }} projectId={12} tokenId={16} />);
  expect(view.container.querySelector('.lucide-user')).toBeTruthy();
  fireEvent.load(screen.getByRole('img'));
  expect(view.container.querySelector('.lucide-user')).toBeNull();
  view.rerender(<UserAvatar messageType="user" user={{ userId: '6355903138' }} projectId={12} tokenId={17} />);
  expect(view.container.querySelector('.lucide-user')).toBeTruthy();
  fireEvent.error(screen.getByRole('img'));
  expect(screen.queryByRole('img')).toBeNull();
  expect(view.container.querySelector('.lucide-user')).toBeTruthy();
});
