/** @fileoverview Получение курса явно применяет котировку и не переносит запоздавший ответ на другой день оплаты. */
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AcquisitionExchangeRate } from './acquisition-exchange-rate';
const request=vi.hoisted(()=>vi.fn());
vi.mock('./use-analytics-snapshot',()=>({analyticsJson:request}));
it('применяет официальный курс и дату действия после явного нажатия',async()=>{
  request.mockReset().mockResolvedValue({rubPerUsd:'80.55730000',effectiveDay:'2026-10-31'});
  const apply=vi.fn();render(<AcquisitionExchangeRate projectId={12} day="2026-11-01" onApply={apply}/>);
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Курс ЦБ на дату рекламного бюджета'}));
  await waitFor(()=>expect(apply).toHaveBeenCalledWith('80.55730000','2026-10-31'));
  expect(screen.getByText(/Курс действует с 2026-10-31/)).toBeInTheDocument();
});
it('не применяет ответ старого дня после изменения даты',async()=>{
  let resolve!:(value:unknown)=>void;request.mockReset().mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const apply=vi.fn();const view=render(<AcquisitionExchangeRate projectId={12} day="2026-11-01" onApply={apply}/>);
  fireEvent.click(screen.getByRole('button',{name:'Курс ЦБ на дату рекламного бюджета'}));
  view.rerender(<AcquisitionExchangeRate projectId={12} day="2026-10-01" onApply={apply}/>);
  await act(async()=>resolve({rubPerUsd:'80.55730000',effectiveDay:'2026-10-31'}));
  expect(apply).not.toHaveBeenCalled();
});
