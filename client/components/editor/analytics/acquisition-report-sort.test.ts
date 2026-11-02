/** @fileoverview Проверки порядка контактов, точных расходов и неизвестных сумм. */
import { expect, it } from 'vitest';
import { sortAcquisitionRows } from './acquisition-report-sort';
import type { AcquisitionReportRow } from './acquisition-types';
/** Создаёт строку с минимальными полями проверяемых столбцов. */
const row=(name:string,newUsers:number,rub:string|null,historicalUsers=0)=>({name,newUsers,historicalUsers,spend:{RUB:rub,USD:null}} as AcquisitionReportRow);
it('переключает порядок первых контактов с учётом истории, не изменяя исходные строки',()=>{
  const rows=[row('А',1,'2'),row('Б',0,'1',4)];
  expect(sortAcquisitionRows(rows,'contacts',true).map(r=>r.name)).toEqual(['Б','А']);
  expect(sortAcquisitionRows(rows,'contacts',false).map(r=>r.name)).toEqual(['А','Б']);
  expect(rows.map(r=>r.name)).toEqual(['А','Б']);
});
it('сравнивает деньги точно и оставляет неизвестный расход в конце в обоих направлениях',()=>{
  const rows=[row('Нет',0,null),row('Больше',0,'9007199254740992.02'),row('Меньше',0,'9007199254740992.01'),row('Ноль',0,'0.00')];
  expect(sortAcquisitionRows(rows,'RUB',true).map(r=>r.name)).toEqual(['Больше','Меньше','Ноль','Нет']);
  expect(sortAcquisitionRows(rows,'RUB',false).map(r=>r.name)).toEqual(['Ноль','Меньше','Больше','Нет']);
});
