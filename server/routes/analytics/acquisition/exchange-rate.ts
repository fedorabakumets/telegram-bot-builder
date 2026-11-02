/** @fileoverview Бесплатный официальный курс USD/RUB Банка России на учётный день без API-ключа. */
import { Agent } from 'undici';
import { AcquisitionError } from './validation';
/** IPv4 обходит зависание автоматического выбора семейства адресов в локальном окружении. */
const cbrAgent=new Agent({connect:{family:4}});
/** Зафиксированная котировка: рублей за один доллар. */
export interface AcquisitionExchangeRate {
  /** Запрошенный учётный день. */ requestedDay: string;
  /** Дата действия официального курса, включая предыдущий рабочий день. */ effectiveDay: string;
  /** Точный курс RUB за 1 USD, восемь знаков после точки. */ rubPerUsd: string;
  /** Поставщик котировки. */ source: 'cbr';
  /** Официальная документация. */ sourceUrl: string;
}
/** Проверяет реальную календарную дату. @param day - ISO-день. @returns Допустимость даты. */
function validDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0,10) === day;
}
/**
 * Разбирает ограниченный официальный XML без выполнения XML-сущностей и двоичной арифметики денег.
 * @param xml - Тело ответа Банка России.
 * @param day - Запрошенный учётный день.
 * @returns Проверенная котировка.
 */
export function parseCbrUsdRate(xml: string, day: string): AcquisitionExchangeRate {
  if (xml.length>200000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new AcquisitionError('Некорректный ответ сервиса курсов',503);
  const date=xml.match(/<ValCurs\b[^>]*\bDate=["'](\d{2})\.(\d{2})\.(\d{4})["']/);
  const effective=date ? `${date[3]}-${date[2]}-${date[1]}` : '';
  const usd=[...xml.matchAll(/<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g)].find(item=>/<CharCode>USD<\/CharCode>/.test(item[1]))?.[1];
  const value=usd?.match(/<Value>\s*(\d{1,12})[,.](\d{1,8})\s*<\/Value>/);
  const nominal=usd?.match(/<Nominal>\s*([1-9]\d{0,5})\s*<\/Nominal>/);
  if (!validDay(effective) || effective>day || !value || !nominal) throw new AcquisitionError('Курс USD на выбранную дату недоступен',503);
  const numerator=BigInt(value[1]+value[2].padEnd(8,'0')), denominator=BigInt(nominal[1]);
  const scaled=(numerator+denominator/2n)/denominator;
  if (scaled<=0n || scaled>=10n**20n) throw new AcquisitionError('Некорректный курс сервиса',503);
  return {requestedDay:day,effectiveDay:effective,rubPerUsd:`${scaled/100000000n}.${String(scaled%100000000n).padStart(8,'0')}`,source:'cbr',sourceUrl:'https://www.cbr.ru/development/sxml/'};
}
/**
 * Загружает курс строго с официального адреса, без передачи данных проекта поставщику.
 * @param day - Учётная дата, не позже текущей даты Москвы.
 * @returns Курс и фактическая дата его действия.
 */
export async function getAcquisitionExchangeRate(day: string): Promise<AcquisitionExchangeRate> {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (!validDay(day) || day<'1992-07-01' || day>today) throw new AcquisitionError('Выберите существующую дату оплаты не позже сегодняшнего дня',400);
  const [year,month,date]=day.split('-');
  try {
    const options={signal:AbortSignal.timeout(8000),redirect:'error' as const,dispatcher:cbrAgent};
    const response=await fetch(`https://www.cbr.ru/scripts/XML_daily.asp?date_req=${date}/${month}/${year}`,options);
    if (!response.ok) throw new Error('HTTP');
    if (Number(response.headers.get('content-length') ?? 0)>200000) throw new Error('Размер');
    const bytes=await response.arrayBuffer();
    if (bytes.byteLength>200000) throw new Error('Размер');
    return parseCbrUsdRate(new TextDecoder('windows-1251').decode(bytes),day);
  } catch {throw new AcquisitionError('Не удалось получить курс ЦБ. Повторите запрос или укажите курс вручную',503);}
}
