/** @fileoverview Учёт рекламной оплаты по дням с явным предпросмотром распределения. */
import { useLayoutEffect, useRef, useState } from 'react';
import type {BotToken} from '@shared/schema';
import {AcquisitionBudgetSource,type BudgetTarget} from './acquisition-budget-source';
import { AcquisitionExchangeRate } from './acquisition-exchange-rate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAcquisitionMutation, useAcquisitionReport } from './use-acquisition';
import { acquisitionMoney, previewExpenseAllocation } from './acquisition-money';
import { reportDay } from './analytics-report-filter';
import type { AcquisitionCatalog, AcquisitionExpense } from './acquisition-types';
/**
 * Сохраняет исходную оплату без автоматического пересчёта валют.
 * @param props - Размещения, редактируемая оплата и обработчик сохранения.
 * @returns Форма дневного расхода и предпросмотра распределения.
 */
export function AcquisitionExpenseForm({ projectId, catalog, timezone, expense, onSaved, tokens = [], tokenId, target }: {
  /** Проект. */ projectId: number; /** Справочники. */ catalog: AcquisitionCatalog; /** Пояс отчёта. */ timezone: string;
  /** Доступные боты. */ tokens?:BotToken[]; /** Бот текущей области. */ tokenId?:number|null; /** Выбранная строка отчёта. */ target?:BudgetTarget;
  /** Расход для изменения. */ expense?: AcquisitionExpense; /** Завершение сохранения. */ onSaved: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  /** После замены длинного списка показывает форму редактирования и переносит фокус на её заголовок. */
  useLayoutEffect(() => {
    if (!expense && !target) return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }, [expense?.id,target]);
  const [placementId, setPlacementId] = useState(String(expense?.placementId ?? target?.placementId ?? (target?.marker ? `marker:${target.marker}` : '')));
  const [bot,setBot]=useState(String(catalog.placements.find(item=>item.id===expense?.placementId)?.tokenId ?? target?.tokenId ?? tokenId ?? (tokens.length===1 ? tokens[0].id : '')));
  const [marker,setMarker]=useState('');
  const discovered=useAcquisitionReport(projectId,bot ? Number(bot) : tokenId,{from:'1900-01-01T00:00:00Z',to:new Date().toISOString(),timezone},'RUB',true);
  const [amount, setAmount] = useState(expense?.amount ?? '');
  const [currency, setCurrency] = useState(expense?.currency ?? target?.currency ?? 'RUB');
  const [day, setDay] = useState(expense?.day ?? reportDay(new Date(), timezone));
  const [untilDay, setUntilDay] = useState(day);
  const [equal, setEqual] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [rate, setRate] = useState(expense?.exchangeRateRubPerUsd ?? '');
  const [rateDate, setRateDate] = useState(expense?.exchangeRateDate ?? day);
  const [note, setNote] = useState(expense?.note ?? '');
  const [error, setError] = useState('');
  const mutation = useAcquisitionMutation(projectId);
  const normalized = amount.replace(',', '.');
  const parts = previewExpenseAllocation(normalized, day, equal ? untilDay : day);
  const placement = catalog.placements.find(item => item.id === Number(placementId));
  /** Проверяет сумму и подтверждение. @param event - Отправка формы. @returns Завершение сохранения либо ошибка проверки. */
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!placementId || !parts.length) { setError('Выберите источник, введите сумму с точностью до копейки и корректный диапазон до 366 дней.'); return; }
    if (equal && !confirmed) { setError('Проверьте распределение и подтвердите сумму по дням.'); return; }
    if (rate && (!/^\d+(?:[.,]\d+)?$/.test(rate) || Number(rate.replace(',', '.')) <= 0)) { setError('Укажите положительный курс: сколько рублей стоит один доллар.'); return; }
    const sourceMarker=placementId==='new' ? marker.trim() : placementId.startsWith('marker:') ? placementId.slice(7) : null;
    if(sourceMarker!==null && (!bot || !/^[A-Za-z0-9_-]{1,64}$/.test(sourceMarker) || /^(link_|ref(?:_|$))/i.test(sourceMarker))) {setError('Выберите бота и корректную рекламную метку. Префиксы link_ и ref зарезервированы.');return;}
    const body = { amount: normalized, currency, day, exchangeRateRubPerUsd: rate ? rate.replace(',', '.') : null, exchangeRateDate: rate ? rateDate || day : null, note: note.trim() };
    try { await mutation.mutateAsync(sourceMarker!==null ? {resource:'budgets',body:{...body,tokenId:Number(bot),marker:sourceMarker,timezone,...(equal ? {untilDay,allocation:'equal'} : {})}} : { resource: 'expenses', id: expense?.id, body: expense ? body : { ...body, placementId: Number(placementId), ...(equal ? { untilDay, allocation: 'equal' } : { allocation: 'single' }) } }); onSaved(); } catch { /* Ошибка запроса сохраняет форму открытой. */ }
  }
  return <form className="space-y-4" onSubmit={save}>
    <div><h3 ref={heading} tabIndex={-1} className="text-lg font-semibold scroll-mt-4">{expense ? 'Изменить рекламный бюджет' : 'Добавить рекламный бюджет'}</h3></div>
    <div className="analytics-form-grid analytics-budget-grid"><AcquisitionBudgetSource catalog={catalog} rows={discovered.data?.rows ?? []} tokens={tokens} bot={bot} setBot={setBot} value={placementId} onChange={setPlacementId} marker={marker} setMarker={setMarker} disabled={!!expense}/>
      {discovered.isError && <p role="alert">Не удалось загрузить найденные источники. <button type="button" onClick={()=>void discovered.refetch()}>Повторить</button></p>}
      <label>Сумма рекламного бюджета · обязательно<Input inputMode="decimal" required value={amount} placeholder="3000,00" onChange={event => { setAmount(event.target.value); setConfirmed(false); }} /></label>
      <label>Валюта<select className="analytics-native-field" value={currency} onChange={event => { setCurrency(event.target.value as 'RUB' | 'USD'); setConfirmed(false); }}><option value="RUB">Рубли · RUB</option><option value="USD">Доллары · USD</option></select></label>
      <label>{equal ? 'Первый день' : 'Дата рекламного бюджета'}<Input type="date" required value={day} onChange={event => { setDay(event.target.value); setConfirmed(false); }} /></label>
      <label>Курс · рублей за 1 доллар<Input inputMode="decimal" value={rate} onChange={event => setRate(event.target.value)} placeholder="Рублей за 1 доллар" /></label>
      {rate && <label>Дата фиксированного курса<Input type="date" value={rateDate} onChange={event => setRateDate(event.target.value)} /></label>}
      <label>Примечание<Input value={note} onChange={event => setNote(event.target.value)} placeholder="Например, оплата публикации" /></label></div>
    {placementId==='new' && <p id="budget-marker-help" className="text-xs text-muted-foreground">Можно добавить источник до первых переходов. Метка: латиница, цифры, дефис и подчёркивание; до 64 символов.</p>}
    <AcquisitionExchangeRate projectId={projectId} day={day} onApply={(value,date)=>{setRate(value);setRateDate(date);}} />
    <p className="text-xs text-muted-foreground">Часовой пояс рекламного бюджета: {placement?.timezone ?? timezone}. Курс фиксируется для этого рекламного бюджета и не обновляется автоматически.</p>
    {!expense && <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={equal} onChange={event => { setEqual(event.target.checked); setConfirmed(false); }} />Распределить сумму рекламного бюджета поровну по нескольким дням</label>}
    {equal && <div className="analytics-report-details space-y-3"><label className="analytics-control-field text-sm"><span>Последний день включительно</span><Input type="date" min={day} value={untilDay} onChange={event => { setUntilDay(event.target.value); setConfirmed(false); }} /></label>
      <p className="text-sm text-muted-foreground">Оценочное распределение. Общая сумма сохраняется до копейки.</p><div className="max-h-48 overflow-auto space-y-1">{parts.map(part => <div key={part.day} className="flex justify-between gap-4 text-sm tabular-nums"><span>{part.day}</span><span>{acquisitionMoney(part.amount, currency)}</span></div>)}</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={!parts.length} onChange={event => setConfirmed(event.target.checked)} />Подтверждаю распределение {acquisitionMoney(normalized || '0', currency)} на {parts.length} дней</label></div>}
    {(error || mutation.isError) && <p role="alert" className="text-sm text-destructive">{error || mutation.error?.message}</p>}
    <Button className="h-auto min-h-10 max-w-full whitespace-normal py-2 text-center" variant="outline" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Сохраняем…' : 'Сохранить рекламный бюджет'}</Button>
  </form>;
}
