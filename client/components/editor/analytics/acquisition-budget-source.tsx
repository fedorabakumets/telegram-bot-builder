/** @fileoverview Выбор сохранённого или обнаруженного источника и ввод будущей рекламной метки. */
import {Input} from '@/components/ui/input';
import type {BotToken} from '@shared/schema';
import type {AcquisitionCatalog,AcquisitionReportRow} from './acquisition-types';
/** Данные перехода из строки отчёта к бюджету. */
export interface BudgetTarget {
  /** Сохранённое размещение при наличии. */ placementId:number|null;
  /** Бот строки. */ tokenId:number|null;
  /** Исходная рекламная метка, а не отображаемое название. */ marker?:string;
  /** Валюта выбранной ячейки. */ currency:'RUB'|'USD';
}
/** Распознаёт только обычные рекламные метки; служебные категории нельзя выдавать за start-параметр. */
export function budgetMarker(key?:string):string|undefined {
  const marker=key?.startsWith('observed:') ? key.slice(9) : undefined;
  return marker && /^[A-Za-z0-9_-]{1,64}$/.test(marker) && !/^(link_|ref(?:_|$))/i.test(marker) ? marker : undefined;
}
/** Показывает обнаруженные источники даже при пустом каталоге оплаченных размещений. */
export function AcquisitionBudgetSource({catalog,rows,tokens,bot,setBot,value,onChange,marker,setMarker,disabled}: {
  /** Каталог проекта. */ catalog:AcquisitionCatalog; /** Источники за всё время. */ rows:AcquisitionReportRow[];
  /** Боты проекта. */ tokens:BotToken[]; /** Выбранный бот. */ bot:string; /** Смена бота. */ setBot:(value:string)=>void;
  /** Выбранный источник. */ value:string; /** Смена источника. */ onChange:(value:string)=>void;
  /** Новая метка. */ marker:string; /** Ввод метки. */ setMarker:(value:string)=>void; /** Редактирование существующего бюджета. */ disabled:boolean;
}) {
  const placements=catalog.placements.filter(item=>(!bot || item.tokenId===Number(bot)) && (!item.archivedAt || String(item.id)===value));
  const discovered=[...new Set(rows.filter(row=>!row.placementId).map(row=>budgetMarker(row.sourceKey)).filter((item):item is string=>!!item))];
  return <>
    {tokens.length>0 && <label>Бот<select required className="analytics-native-field" value={bot} disabled={disabled} onChange={e=>{setBot(e.target.value);onChange('');}}><option value="">Выберите бота</option>{tokens.map(token=><option key={token.id} value={token.id}>{token.botUsername ? `@${token.botUsername.replace(/^@/,'')}` : token.name}</option>)}</select></label>}
    <label>Источник · обязательно<select required className="analytics-native-field" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}><option value="">Выберите источник</option>
      {placements.map(item=><option key={item.id} value={item.id}>{catalog.sources.find(source=>source.id===item.sourceId)?.name ?? item.name}</option>)}
      {discovered.map(item=><option key={item} value={`marker:${item}`}>{item}</option>)}
      {!disabled && <option value="new">Новый источник…</option>}
    </select></label>
    {value==='new' && <label>Метка нового источника<Input aria-label="Метка нового источника" aria-describedby="budget-marker-help" required value={marker} onChange={e=>setMarker(e.target.value)} placeholder="Например, november_ad" pattern="[A-Za-z0-9_-]{1,64}"/></label>}
  </>;
}
