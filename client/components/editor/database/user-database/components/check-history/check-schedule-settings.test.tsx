/** @fileoverview Выбор интервала и перевод московского времени в сохраняемый UTC без запуска проверки. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const mocks=vi.hoisted(()=>({request:vi.fn()}));
vi.mock('@/queryClient',()=>({apiRequest:mocks.request}));
import { CheckScheduleSettings } from './check-schedule-settings';
afterEach(()=>{cleanup();vi.clearAllMocks();});
/** Форма открывается без записи; включение действует только после сохранения. */
it('сохраняет каждые 6 часов с первым запуском по Москве',async()=>{
  mocks.request.mockImplementation((method:string)=>Promise.resolve(method==='GET'?{schedule:null}:{schedule:{enabled:true,every:6,unit:'hour',firstAt:'2026-12-01T07:00:00Z',nextRunAt:'2026-12-01T07:00:00Z',lastRunAt:null,lastOutcome:null}}));
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><CheckScheduleSettings projectId={12} tokenId={9} kind="private-chats" /></QueryClientProvider>);
  expect(screen.getByText(/Повторять проверку автоматически/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Настроить автоматическую проверку'}));
  await waitFor(()=>expect(screen.getByLabelText('Проверять по расписанию')).toBeEnabled());
  expect(mocks.request.mock.calls.every(call=>call[0]==='GET')).toBe(true);
  fireEvent.click(screen.getByLabelText('Проверять по расписанию'));
  fireEvent.change(screen.getByLabelText('Интервал проверки'),{target:{value:'6'}});
  fireEvent.change(screen.getByLabelText('Единица интервала'),{target:{value:'hour'}});
  fireEvent.change(screen.getByLabelText('Первый запуск по Москве'),{target:{value:'2026-12-01T10:00'}});
  fireEvent.click(screen.getByRole('button',{name:'Сохранить расписание'}));
  await waitFor(()=>expect(mocks.request).toHaveBeenCalledWith('PUT','/api/projects/12/check-schedule?kind=private-chats&tokenId=9',{enabled:true,every:6,unit:'hour',firstAt:'2026-12-01T07:00:00.000Z'}));
});
