/** @fileoverview Проверки явной подписи источника сообщений общей истории. */
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MessageBubble } from './message-bubble';
import type { BotMessageWithMedia } from '../types';

vi.mock('./message-avatar', () => ({ MessageAvatar: () => null }));
vi.mock('./message-media', () => ({ MessageMedia: () => null }));

/**
 * Создаёт входящее сообщение для проверки подписи источника.
 * @param fields - Поля источника
 * @returns Сообщение пользователя
 */
function message(fields: Partial<BotMessageWithMedia>): BotMessageWithMedia {
  return { id: 1, messageType: 'user', messageText: 'Привет', userId: '42',
    createdAt: new Date('2026-10-14'), messageData: {}, ...fields } as BotMessageWithMedia;
}

it('подписывает групповой контекст сохранённым названием', () => {
  render(<MessageBubble index={0} showSource message={message({ chatType: 'supergroup',
    chatId: '-1001', sourceChatTitle: 'Наша группа' })} />);
  expect(screen.getByText('Группа: Наша группа')).toBeInTheDocument();
  expect(screen.queryByTitle('Редактировать сообщение')).not.toBeInTheDocument();
  expect(screen.queryByTitle('Удалить сообщение')).not.toBeInTheDocument();
});

it('использует ID группы при неизвестном названии', () => {
  render(<MessageBubble index={0} showSource message={message({ chatType: 'group', chatId: '-1002' })} />);
  expect(screen.getByText('Группа: -1002')).toBeInTheDocument();
});

/** Проверяет отсутствие лишней подписи у личной переписки при сохранении текста. */
it('не добавляет подпись «Личка» к личным сообщениям', () => {
  render(<MessageBubble index={0} showSource message={message({ chatType: 'private' })} />);
  expect(screen.queryByText('Личка')).not.toBeInTheDocument();
  expect(screen.getByText('Привет')).toBeInTheDocument();
});
