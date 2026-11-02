/** @fileoverview Необязательный бюджет простой ссылки с сохранением даты и исходной валюты. */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAcquisitionMutation } from './use-acquisition';
import { reportDay } from './analytics-report-filter';
/** Сохраняет бюджет источника, не усложняя получение обычной ссылки. */
export function AcquisitionLinkBudget({projectId,tokenId,marker,timezone}: {
  /** Проект. */ projectId:number; /** Бот. */ tokenId:number; /** Метка. */ marker:string; /** Пояс расхода. */ timezone:string;
}) {
  const [amount,setAmount]=useState('');
  const [currency,setCurrency]=useState('RUB');
  const [day,setDay]=useState(()=>reportDay(new Date(),timezone));
  const [saved,setSaved]=useState(false);
  const mutation=useAcquisitionMutation(projectId);
  /** Сохраняет бюджет только по явному действию пользователя. */
  async function save(event:React.FormEvent) {
    event.preventDefault();
    try {await mutation.mutateAsync({resource:'budgets',body:{tokenId,marker,amount:amount.replace(',','.'),currency,day,timezone}});setSaved(true);} catch { /* Серверная ошибка показана рядом с формой. */ }
  }
  return <details className="analytics-report-details"><summary className="cursor-pointer">Добавить рекламный бюджет · необязательно</summary>
    <form onSubmit={save} className="space-y-3 mt-3" onChange={()=>setSaved(false)}><div className="analytics-form-grid">
      <label>Сумма рекламного бюджета<Input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="3000,00" /></label>
      <label>Валюта<select className="analytics-native-field" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="RUB">Рубли · RUB</option><option value="USD">Доллары · USD</option></select></label>
      <label>Дата рекламного бюджета<Input required type="date" value={day} onChange={e=>setDay(e.target.value)} /></label></div>
      <p className="text-xs text-muted-foreground">Приход учитывается с этой даты в поясе {timezone}. Одинаковая метка объединяет публикации; для отдельной рекламы используйте новую метку.</p>
      <Button type="submit" variant="outline" disabled={mutation.isPending || saved}>{mutation.isPending ? 'Сохраняем…' : saved ? 'Рекламный бюджет сохранён' : 'Сохранить рекламный бюджет'}</Button>
      {saved && <p role="status">Рекламный бюджет сохранён. Результаты доступны в рекламном отчёте; новые переходы появятся автоматически.</p>}
      {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
    </form></details>;
}
