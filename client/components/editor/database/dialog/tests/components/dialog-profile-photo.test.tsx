/** @fileoverview Проверки увеличения фотографий профиля пользователя и группы. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogProfile } from '../../components/dialog-profile';

afterEach(() => { cleanup(); sessionStorage.clear(); });

describe('Фотография профиля', () => {
  it('открывает фотографию пользователя с текущим ботом и закрывает по Escape', () => {
    render(<DialogProfile user={{ userId: '123', firstName: 'Пользователь' }} projectId={12} tokenId={9} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Увеличить фотографию пользователя' }));
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', '/api/projects/12/users/123/avatar?tokenId=9');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('lightbox-overlay')).not.toBeInTheDocument();
  });
  it('не предлагает увеличение вместо отсутствующей аватарки', () => {
    render(<DialogProfile user={{ userId: '456' }} projectId={12} onClose={vi.fn()} />);
    fireEvent.error(screen.getByAltText('User avatar'));
    expect(screen.queryByRole('button', { name: 'Увеличить фотографию пользователя' })).not.toBeInTheDocument();
  });
  it('сохраняет увеличение фотографии группы', () => {
    render(<DialogProfile user={{ userId: '-123', isGroup: true, avatarUrl: '/group.png' }} projectId={12} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Увеличить фотографию группы' }));
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', '/group.png');
    fireEvent.click(screen.getByRole('button', { name: /^Закрыть$/ }));
    expect(screen.queryByTestId('lightbox-overlay')).not.toBeInTheDocument();
  });
});
