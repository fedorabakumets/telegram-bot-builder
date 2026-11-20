/** @fileoverview Первый шаг показывает выбранных людей и позволяет проверить их по реквизитам. */
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FixedAudienceList } from './fixed-audience-list';

afterEach(cleanup);
it('показывает имя, username и ID и ищет только в выбранных получателях', () => {
  render(<FixedAudienceList audience={{ tokenId: 11, label: 'Найденные пользователи', userIds: ['123', '456'],
    users: [{ userId: '123', firstName: 'Игорь', userName: 'Promeprome' }, { userId: '456', firstName: 'Антон' }] }}
    onNext={vi.fn()} onCancel={vi.fn()} />);
  expect(screen.getByText('Игорь')).toBeInTheDocument();
  expect(screen.getByText('@Promeprome')).toBeInTheDocument();
  expect(screen.getByText('ID: 123')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Поиск среди получателей'), { target: { value: 'Promeprome' } });
  expect(screen.queryByText('Антон')).not.toBeInTheDocument();
  expect(screen.getByText('Игорь')).toBeInTheDocument();
  expect(screen.getByText('Показано: 1 из 1')).toBeInTheDocument();
});
