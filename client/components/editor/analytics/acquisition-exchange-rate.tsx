/** @fileoverview Получение официального курса ЦБ на дату рекламного бюджета с явным применением и ручной альтернативой. */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { analyticsJson } from './use-analytics-snapshot';
/** Свойства кнопки получения курса. */
interface Props {
  /** Авторизованный проект. */ projectId: number;
  /** Дата рекламного бюджета для получения курса. */ day: string;
  /** Применить курс RUB за USD и дату действия. */ onApply: (rate: string, date: string) => void;
}
/**
 * Не перезаписывает курс без нажатия; отменяет ответ при смене даты или закрытии формы.
 * @param props - Проект, день и применение котировки.
 * @returns Кнопка, поставщик и состояние ошибки.
 */
export function AcquisitionExchangeRate({ projectId,day,onApply }: Props) {
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[effective,setEffective]=useState('');
  const request=useRef<AbortController>();
  useEffect(()=>{setError('');setEffective('');setLoading(false);return()=>request.current?.abort();},[day,projectId]);
  /** Получает курс на выбранный день и сохраняет фактическую дату котировки. */
  async function load() {
    request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);setError('');
    try {
      const quote=await analyticsJson<{rubPerUsd:string;effectiveDay:string}>(`/api/projects/${projectId}/analytics/acquisition/exchange-rate?${new URLSearchParams({day})}`,{signal:controller.signal});
      if(controller.signal.aborted)return;
      onApply(quote.rubPerUsd,quote.effectiveDay);setEffective(quote.effectiveDay);
    }catch(error){if(!controller.signal.aborted)setError(error instanceof Error ? error.message : 'Не удалось получить курс');}
    finally{if(!controller.signal.aborted)setLoading(false);}
  }
  return <div className="space-y-2"><Button type="button" variant="outline" className="h-auto min-h-10 max-w-full whitespace-normal py-2 text-center" disabled={loading||!day} onClick={()=>void load()}>{loading?'Получаем курс…':'Курс ЦБ на дату рекламного бюджета'}</Button>
    <p className="text-xs text-muted-foreground">Рублей за 1 доллар. {effective ? `Курс действует с ${effective}. ` : ''}После получения можно изменить вручную. <a className="underline underline-offset-4" href="https://www.cbr.ru/development/sxml/" target="_blank" rel="noreferrer">Банк России</a></p>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
