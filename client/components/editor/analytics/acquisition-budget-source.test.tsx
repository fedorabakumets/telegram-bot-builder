/** @fileoverview Найденные рекламные метки доступны без размещений, а предпросмотр совпадает с сохранением. */
import '@testing-library/jest-dom/vitest';
import {render,screen} from '@testing-library/react';
import {expect,it} from 'vitest';
import {AcquisitionBudgetSource,budgetMarker} from './acquisition-budget-source';
import {previewExpenseAllocation} from './acquisition-money';
import {allocateExpense} from '../../../../server/routes/analytics/acquisition/money';
it('показывает старую рекламную метку при пустом каталоге',()=>{
  render(<AcquisitionBudgetSource catalog={{sources:[],placements:[],links:[],expenses:[]}} rows={[{sourceKey:'observed:old_ad',placementId:null} as any]} tokens={[]} bot="11" setBot={()=>{}} value="" onChange={()=>{}} marker="" setMarker={()=>{}} disabled={false}/>);
  expect(screen.getByRole('option',{name:'old_ad'})).toHaveValue('marker:old_ad');
  expect(screen.getByRole('option',{name:'Новый источник…'})).toBeInTheDocument();
  expect(budgetMarker('unknown')).toBeUndefined();expect(budgetMarker('observed:link_secret')).toBeUndefined();
});
it('показывает те же дневные суммы, которые запишет сервер, включая остаточные копейки',()=>{
  for(const amount of ['100.00','0.01','99999999999999999.99'])expect(previewExpenseAllocation(amount,'2026-11-02','2026-11-04')).toEqual(allocateExpense(amount,'2026-11-02','2026-11-04'));
});
