/** @fileoverview Сортировка рекламных строк с неизвестными значениями в конце списка. */
import type { AcquisitionReportRow } from './acquisition-types';
/** Ключ столбца рекламного отчёта. */
export type AcquisitionSortKey = 'name' | 'contacts' | 'returning' | 'RUB' | 'USD' | 'price';
/** Заголовки и ключи сортируемых столбцов. */
export const acquisitionColumns: Array<{ /** Ключ. */ key: AcquisitionSortKey; /** Название. */ label: string }> = [
  {key:'name',label:'Источник'}, {key:'contacts',label:'Новые / первые контакты'},
  {key:'returning',label:'Вернулись'}, {key:'RUB',label:'Расход, ₽'}, {key:'USD',label:'Расход, $'}, {key:'price',label:'Цена нового'},
];
/** Возвращает значение столбца; цены сравниваются только в выбранной валюте. */
function value(row: AcquisitionReportRow, key: AcquisitionSortKey): string | null {
  if(key==='name') return row.name;
  if(key==='contacts') return String(row.newUsers+(row.historicalUsers??0));
  if(key==='returning') return String(row.returningUsers);
  if(key==='price') return row.costPerUser ?? row.costPerUserByCurrency?.[row.currency] ?? (row.isDemo ? row.demoCostPerContact ?? null : null);
  return row.spend[key];
}
/** Сравнивает decimal-строки без потери точности денежных значений. */
function decimalCompare(a: string, b: string): number {
  const [ai,af='']=a.split('.'), [bi,bf='']=b.split('.');
  const digits=Math.max(af.length,bf.length);
  const left=BigInt(ai+af.padEnd(digits,'0')),right=BigInt(bi+bf.padEnd(digits,'0'));
  return left<right ? -1 : left>right ? 1 : 0;
}
/** Сортирует копию строк, сохраняя исходный порядок равных значений и неизвестные суммы в конце. */
export function sortAcquisitionRows(rows: AcquisitionReportRow[], key: AcquisitionSortKey, descending: boolean): AcquisitionReportRow[] {
  return [...rows].sort((a,b)=>{
    const left=value(a,key),right=value(b,key);
    if(left===null || right===null) return left===right ? 0 : left===null ? 1 : -1;
    const result=key==='name' ? left.localeCompare(right,'ru',{numeric:true}) : decimalCompare(left,right);
    return descending ? -result : result;
  });
}
