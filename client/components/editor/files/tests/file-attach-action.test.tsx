/** @fileoverview Проверки перехода от пустого использования файла к режиму прикрепления. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FileAttachAction, FileAttachActionProvider } from '../panel/file-attach-action';

afterEach(cleanup);

it('включает режим и выбирает файл, не снимая существующее выделение', () => {
  const onEnable = vi.fn();
  const onToggle = vi.fn();
  render(<FileAttachActionProvider enabled selectedIds={new Set([2])} onToggle={onToggle} onEnable={onEnable}>
    <FileAttachAction fileId={1} />
  </FileAttachActionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Прикрепить к блоку' }));
  expect(onEnable).toHaveBeenCalledWith(true);
  expect(onToggle).toHaveBeenCalledWith(1);
});

it('сохраняет уже выбранный файл', () => {
  const onToggle = vi.fn();
  render(<FileAttachActionProvider enabled selectedIds={new Set([1])} onToggle={onToggle} onEnable={vi.fn()}>
    <FileAttachAction fileId={1} />
  </FileAttachActionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Прикрепить к блоку' }));
  expect(onToggle).not.toHaveBeenCalled();
});

it('скрывает действие, когда выбор блока недоступен', () => {
  render(<FileAttachAction fileId={1} />);
  expect(screen.queryByRole('button')).toBeNull();
});
