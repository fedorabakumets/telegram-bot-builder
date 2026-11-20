/** @fileoverview Проверки доступного сообщения и действий восстановления черновика. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProjectSaveConflictAlert } from './ProjectSaveConflictAlert';

afterEach(cleanup);

it('различает удалённую правку и отказ записи, оставляя действия вне объявления', () => {
  const openVersions = vi.fn();
  const copyDraft = vi.fn();
  const { rerender } = render(
    <ProjectSaveConflictAlert source="remote-change" onOpenVersions={openVersions} />,
  );
  expect(screen.getByRole('status').textContent).toContain('Проект меняется в другом окне');
  expect(screen.queryByRole('button', { name: 'Скопировать черновик' })).toBeNull();

  rerender(<ProjectSaveConflictAlert source="save-conflict" onOpenVersions={openVersions} onCopyDraft={copyDraft} />);
  const alert = screen.getByRole('alert');
  expect(alert.textContent).toContain('Ваш черновик остался в редакторе');
  const history = screen.getByRole('button', { name: 'Открыть историю версий' });
  expect(alert.contains(history)).toBe(false);
  fireEvent.click(history);
  fireEvent.click(screen.getByRole('button', { name: 'Скопировать черновик' }));
  expect(openVersions).toHaveBeenCalledOnce();
  expect(copyDraft).toHaveBeenCalledOnce();
});
