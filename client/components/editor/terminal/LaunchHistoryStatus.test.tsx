/** @fileoverview Проверка доступных сообщений истории без подмены сетевой ошибки пустым ответом. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LaunchHistoryStatus } from './LaunchHistoryStatus';

afterEach(cleanup);
const defaults = { isLoading: false, isError: false, isRefreshing: false, hasLogs: false,
  textClassName: '', onRetry: vi.fn() };

it('показывает отсутствие сохранённых строк только после успешной загрузки', () => {
  const { rerender } = render(<LaunchHistoryStatus {...defaults} isLoading />);
  expect(screen.getByRole('status').textContent).toBe('Загрузка логов…');
  expect(screen.queryByText('Логи не сохранены')).toBeNull();
  rerender(<LaunchHistoryStatus {...defaults} />);
  expect(screen.getByRole('status').textContent).toBe('Логи не сохранены');
});

it('сообщает об ошибке и даёт повторить запрос вместо пустого состояния', () => {
  const onRetry = vi.fn();
  render(<LaunchHistoryStatus {...defaults} isError onRetry={onRetry} />);
  expect(screen.getByRole('alert').textContent).toContain('Не удалось загрузить логи запуска.');
  expect(screen.queryByText('Логи не сохранены')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку' }));
  expect(onRetry).toHaveBeenCalledOnce();
});

it('объясняет ошибку обновления и блокирует повтор во время запроса', () => {
  render(<LaunchHistoryStatus {...defaults} isError hasLogs isRefreshing />);
  expect(screen.getByRole('alert').textContent).toContain('Показаны ранее загруженные строки.');
  expect(screen.getByRole('button', { name: 'Загрузка…' }).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByText('Логи не сохранены')).toBeNull();
});

it('обозначает фоновое обновление и не показывает пустое состояние поверх таблицы', () => {
  const { rerender } = render(<LaunchHistoryStatus {...defaults} hasLogs isRefreshing />);
  expect(screen.getByRole('status').textContent).toBe('Обновление логов…');
  rerender(<LaunchHistoryStatus {...defaults} hasLogs />);
  expect(screen.queryByRole('status')).toBeNull();
});
