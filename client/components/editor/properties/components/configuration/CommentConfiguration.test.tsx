/** @fileoverview Проверка редактирования текста и цвета заметки на холсте. */
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Node } from '@shared/schema';
import { CommentConfiguration } from './CommentConfiguration';

it('передаёт изменения полей данных выбранной заметки', () => {
  const update = vi.fn();
  const node = { id: 'note', data: { messageText: 'Текст', commentColor: 'yellow' } } as Node;
  render(<CommentConfiguration selectedNode={node} onNodeUpdate={update} />);
  fireEvent.change(screen.getByPlaceholderText('Напишите заметку...'), { target: { value: 'Новое' } });
  fireEvent.click(screen.getByTitle('Синий'));
  expect(update).toHaveBeenNthCalledWith(1, 'note', { messageText: 'Новое' });
  expect(update).toHaveBeenNthCalledWith(2, 'note', { commentColor: 'blue' });
});
