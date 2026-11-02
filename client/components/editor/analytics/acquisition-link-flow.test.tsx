/** @fileoverview Проверки простой ссылки, сохранения бюджета и смены бота в общей области аналитики. */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { BotToken } from '@shared/schema';
import { AnalyticsAcquisitionSection } from './analytics-acquisition-section';
/** Безопасный справочник без запросов и записи реальных расходов. */
const state = vi.hoisted(() => ({ mutateAsync: vi.fn(), data: { sources: [], placements: [], links: [], expenses: [] } }));
vi.mock('./use-acquisition', () => ({
  useAcquisition: () => ({ data: state.data, isError: false }),
  useAcquisitionMutation: () => ({ mutateAsync: state.mutateAsync, isPending: false, isError: false }),
  useAcquisitionReport: () => ({ isLoading: false, isError: false }),
}));
/** Два бота позволяют проверить отсутствие записи бюджета для предыдущей области. */
const tokens = [{ id: 9, name: 'Первый', botUsername: 'first_bot' }, { id: 11, name: 'Второй', botUsername: 'second_bot' }] as BotToken[];
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
/** Предоставляет сценариям то же окружение запросов, что и реальная вкладка. @param props - Проверяемый экран. @returns Экран в контексте запросов. */
function QueryWrapper({ children }: { /** Содержимое сценария. */ children: ReactNode }) { return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>; }
beforeEach(() => { queryClient.clear(); localStorage.clear(); state.mutateAsync.mockReset(); state.mutateAsync.mockResolvedValue({}); });
it('формирует ссылку без записи и сохраняет бюджет только явно', async () => {
  render(<AnalyticsAcquisitionSection projectId={12} tokenId={9} tokens={tokens} timezone="Europe/Moscow" />, { wrapper: QueryWrapper });
  fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));
  fireEvent.change(screen.getByLabelText('Метка источника'), { target: { value: 'raspred' } });
  expect(screen.getByLabelText('Готовая ссылка')).toHaveValue('https://t.me/first_bot?start=raspred');
  expect(state.mutateAsync).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Сумма рекламного бюджета'), { target: { value: '3000,00' } });
  fireEvent.change(screen.getByLabelText('Дата рекламного бюджета'), { target: { value: '2026-11-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить рекламный бюджет', hidden: true }));
  await waitFor(() => expect(state.mutateAsync).toHaveBeenCalledOnce());
  expect(state.mutateAsync).toHaveBeenCalledWith({ resource: 'budgets', body: { tokenId: 9, marker: 'raspred', amount: '3000.00', currency: 'RUB', day: '2026-11-01', timezone: 'Europe/Moscow' } });
});
it('смена бота очищает старую ссылку и несохранённый бюджет', () => {
  const props = { projectId: 12, tokens, timezone: 'Europe/Moscow' };
  const { rerender } = render(<AnalyticsAcquisitionSection {...props} tokenId={9} />, { wrapper: QueryWrapper });
  fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));
  fireEvent.change(screen.getByLabelText('Метка источника'), { target: { value: 'raspred' } });
  rerender(<AnalyticsAcquisitionSection {...props} tokenId={11} />);
  expect(screen.getByLabelText('Бот')).toHaveValue('11');
  expect(screen.getByLabelText('Метка источника')).toHaveValue('');
  expect(screen.queryByLabelText('Готовая ссылка')).not.toBeInTheDocument();
  expect(state.mutateAsync).not.toHaveBeenCalled();
});
