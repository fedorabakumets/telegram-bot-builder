/** @fileoverview Компактная тёмная подсказка графика, не выходящая за ширину карточки. */
/** Одно значение, переданное Recharts. */
interface TooltipItem {
  /** Имя ряда. */ name?:string|number;
  /** Число событий. */ value?:string|number;
  /** Цвет ряда. */ color?:string;
}
/** Показывает значимые ряды; остальные доступны в закрепляемых подробностях. */
export function AnalyticsCompactTooltip({active,label,payload,formatInterval}: {
  /** Указатель находится в графике. */ active?:boolean;
  /** Дата выбранной точки. */ label?:string|number;
  /** Значения рядов. */ payload?:TooltipItem[];
  /** Точные границы выбранного интервала. */ formatInterval:(date:string)=>string;
}) {
  if(!active || label==null || !payload?.length)return null;
  const nonzero=payload.filter(item=>Number(item.value)!==0);
  const visible=nonzero.slice(0,4);
  return <div className="analytics-compact-tooltip">
    <p className="analytics-compact-tooltip-period">{formatInterval(String(label))}</p>
    {!nonzero.length ? <p>В этом промежутке нет событий</p> : visible.map((item,index)=><p className="analytics-compact-tooltip-row" key={`${item.name}:${index}`}><span style={{color:item.color}}>{item.name}</span><strong>{Number(item.value).toLocaleString('ru-RU')}</strong></p>)}
    {nonzero.length>visible.length && <p className="text-muted-foreground">Ещё рядов: {nonzero.length-visible.length}</p>}
    <p className="text-muted-foreground">Нажмите, чтобы закрепить все значения</p>
  </div>;
}
