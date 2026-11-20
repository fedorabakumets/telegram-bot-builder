/** @fileoverview Проверки независимого выбора источников автоперезапуска. */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { BotAutoRestartToggle } from './BotAutoRestartToggle';

vi.mock('@tanstack/react-query', () => ({
  /** Не подключает сервер для проверки черновика. */
  useQueryClient: () => ({}),
  /** Позволяет отслеживать случайную отправку запроса. */
  useMutation: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/queryClient', () => ({
  /** Исключает сеть при проверке черновика. */
  apiRequest: vi.fn(),
}));
vi.mock('@/components/ui/select', () => ({
  /** Сохраняет обработку выбора без зависимости от портала. */
  Select: ({ value, onValueChange, children }: {
    /** Выбранное значение. */
    value: string;
    /** Обработчик выбора. */
    onValueChange: (value: string) => void;
    /** Список вариантов. */
    children: ReactNode;
  }) => <select value={value} onChange={(event) => onValueChange(event.target.value)}>{children}</select>,
  /** Не выводит декоративную кнопку. */
  SelectTrigger: () => null,
  /** Не выводит декоративный текст. */
  SelectValue: () => null,
  /** Пробрасывает варианты в нативный список. */
  SelectContent: ({ children }: { /** Варианты. */ children: ReactNode }) => <>{children}</>,
  /** Отображает вариант нативным элементом. */
  SelectItem: ({ value, children }: { /** Значение. */ value: string; /** Подпись. */ children: ReactNode }) =>
    <option value={value}>{children}</option>,
}));

it('меняет лимит при выключенном автоперезапуске, сохраняя свой источник остальных полей', () => {
  const onPendingChange = vi.fn();
  const props = {
    projectId: 12, canManage: true, onPendingChange,
    defaults: { defaultAutoRestart: 1, defaultMaxRestartAttempts: 5 },
    token: { id: 58, autoRestart: 0, maxRestartAttempts: 3, inheritAutoRestart: false, inheritMaxRestartAttempts: false },
  };
  const view = render(<BotAutoRestartToggle {...props} />);
  const [restart, limit] = screen.getAllByRole('combobox') as HTMLSelectElement[];
  expect(restart.value).toBe('0');
  expect(limit.value).toBe('3');
  fireEvent.change(limit, { target: { value: 'inherit' } });
  expect(onPendingChange.mock.calls).toEqual([['MAX_RESTART_ATTEMPTS', 'inherit']]);
  view.rerender(<BotAutoRestartToggle {...props} pendingMaxAttempts="inherit" />);
  expect(restart.value).toBe('0');
  expect(limit.value).toBe('inherit');
  view.rerender(<BotAutoRestartToggle {...props} />);
  expect(limit.value).toBe('3');
});
