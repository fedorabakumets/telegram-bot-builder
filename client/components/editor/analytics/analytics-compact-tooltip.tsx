/** @fileoverview Компактная тёмная подсказка графика, не выходящая за ширину карточки. */
/** Одно значение, переданное Recharts. */
interface TooltipItem {
  /** Имя ряда. */ name?:string|number;
  /** Число событий. */ value?:string|number;
  /** Цвет ряда. */ color?:string;
}
/** Показывает все ряды, включая нулевые значения, как в карточке промежутка. */
export function AnalyticsCompactTooltip({active,label,payload,formatInterval}: {
  /** Указатель находится в графике. */ active?:boolean;
  /** Дата выбранной точки. */ label?:string|number;
  /** Значения рядов. */ payload?:TooltipItem[];
  /** Точные границы выбранного интервала. */ formatInterval:(date:string)=>string;
}) {
  if(!active || label==null || !payload?.length)return null;
  return <div className="analytics-compact-tooltip">
    <p className="analytics-compact-tooltip-period">{formatInterval(String(label))}</p>
    <div className="analytics-compact-tooltip-values">{payload.map((item,index)=><p className="analytics-compact-tooltip-row" key={`${item.name}:${index}`}><span style={{color:item.color}}>{item.name}</span><strong>{Number(item.value ?? 0).toLocaleString('ru-RU')}</strong></p>)}</div>
  </div>;
}
