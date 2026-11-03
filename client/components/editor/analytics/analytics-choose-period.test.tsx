/** @fileoverview Кнопка в графике открывает единственный общий календарь в шапке. */
import '@testing-library/jest-dom/vitest';
import {useState} from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import {expect,it} from 'vitest';
import {AnalyticsChoosePeriod,AnalyticsOpenPeriodContext} from './analytics-choose-period';
import {AnalyticsHeaderPeriod} from './analytics-header-period';
/** Связывает карточку и шапку так же, как рабочая вкладка. */
function Harness(){
  const [request,setRequest]=useState(0);
  return <AnalyticsOpenPeriodContext.Provider value={()=>setRequest(value=>value+1)}><AnalyticsHeaderPeriod openRequest={request} filter={{period:'30d',from:'2026-10-03',to:'2026-11-02',timezone:'Europe/Moscow',compare:false}} onChange={()=>{}}/><AnalyticsChoosePeriod/></AnalyticsOpenPeriodContext.Provider>;
}
it('открывает общий календарь кнопкой из карточки',async()=>{
  render(<Harness/>);
  fireEvent.click(screen.getByRole('button',{name:'Выбрать период'}));
  expect(await screen.findByRole('group',{name:'Период'})).toBeInTheDocument();
  expect(screen.getAllByRole('group',{name:'Период'})).toHaveLength(1);
});
