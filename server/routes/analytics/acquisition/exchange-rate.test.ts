/** @fileoverview Курс ЦБ: номинал, точная арифметика, выходные, ошибки сервиса и запрет будущих дат. */
import { afterEach, expect, it, vi } from 'vitest';
import { getAcquisitionExchangeRate, parseCbrUsdRate } from './exchange-rate';
/** Формирует минимальный официальный XML для проверки курса. */
const xml=(date='01.01.2002',nominal='1',value='95,1234')=>`<ValCurs Date="${date}"><Valute ID="R01235"><CharCode>USD</CharCode><Nominal>${nominal}</Nominal><Value>${value}</Value></Valute></ValCurs>`;
afterEach(()=>vi.unstubAllGlobals());
it('учитывает номинал и сохраняет восемь десятичных знаков без float',()=>{
  expect(parseCbrUsdRate(xml('01.01.2002','10','951,2345'),'2002-01-01').rubPerUsd).toBe('95.12345000');
  expect(parseCbrUsdRate(xml(),'2002-01-03')).toMatchObject({effectiveDay:'2002-01-01',requestedDay:'2002-01-03',source:'cbr'});
});
it('отклоняет неверную дату, нулевой номинал, будущую котировку и XML-сущности',()=>{
  for(const body of [xml('32.01.2002'),xml('01.01.2002','0'),xml('02.01.2002'),`<!DOCTYPE x>${xml()}`])
    expect(()=>parseCbrUsdRate(body,'2002-01-01')).toThrow();
});
it('обращается только к ЦБ, не передаёт проект и не требует ключа',async()=>{
  const bytes=new TextEncoder().encode(xml());
  const fetcher=vi.fn().mockResolvedValue(new Response(bytes));vi.stubGlobal('fetch',fetcher);
  expect((await getAcquisitionExchangeRate('2002-01-01')).rubPerUsd).toBe('95.12340000');
  expect(fetcher.mock.calls[0][0]).toBe('https://www.cbr.ru/scripts/XML_daily.asp?date_req=01/01/2002');
});
it('при сбое не подставляет выдуманный курс, при будущей дате не делает запрос',async()=>{
  const fetcher=vi.fn().mockRejectedValue(new Error('network'));vi.stubGlobal('fetch',fetcher);
  await expect(getAcquisitionExchangeRate('2002-01-01')).rejects.toMatchObject({status:503});
  fetcher.mockClear();await expect(getAcquisitionExchangeRate('2999-01-01')).rejects.toMatchObject({status:400});
  expect(fetcher).not.toHaveBeenCalled();
});
