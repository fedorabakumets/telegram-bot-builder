/** @fileoverview Проверка пользовательских данных источников, размещений и расходов. */
import { z } from 'zod';
/** Название объекта, видимое в отчёте. */
const name = z.string().trim().min(1, 'Укажите название').max(200);
/** Положительный целочисленный идентификатор. */
export const id = z.number().int().positive();
/** Проверяет календарный день без нормализации невозможных дат. */
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Некорректная дата');
/** Проверяет поддерживаемый часовой пояс. */
export const timezone = z.string().refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; } catch { return false; }
}, 'Некорректный часовой пояс');
/** Исходная сумма в минимальных денежных единицах не теряет точность. */
export const money = z.string().regex(/^(0|[1-9]\d{0,17})(\.\d{1,2})?$/, 'Введите неотрицательную сумму с точностью до копеек');
/** Направление курса всегда одно: рублей за один доллар. */
export const rate = z.string().regex(/^(0|[1-9]\d{0,11})(\.\d{1,8})?$/).refine(value => /[1-9]/.test(value), 'Курс должен быть больше нуля');
/** Создание площадки. */
export const sourceInput = z.object({
  /** Понятное название. */ name,
  /** Категория площадки. */ kind: z.enum(['telegram','website','social','other']).default('other'),
  /** Необязательный адрес площадки. */ url: z.string().url().refine(value => /^https?:\/\//.test(value)).nullable().optional(),
}).strict();
/** Создание отдельного рекламного размещения. */
export const placementInput = z.object({
  /** Название размещения. */ name,
  /** Бот назначения. */ tokenId: id,
  /** Площадка проекта. */ sourceId: id,
  /** Первый день. */ startsOn: day.nullable().optional(),
  /** Последний день. */ endsOn: day.nullable().optional(),
  /** Пояс учёта расходов. */ timezone: timezone.default('Europe/Moscow'),
}).strict();
/** Создание публичной метки. */
export const linkInput = z.object({
  /** Размещение, определяющее бота и источник. */ placementId: id,
  /** Подтверждённый пользователь проекта. */ referrerId: z.string().regex(/^[1-9]\d{0,19}$/).nullable().optional(),
  /** Назначение без влияния на маршрутизацию сценария. */ purpose: z.enum(['acquisition','referral','combined']).optional(),
}).strict();
/** Создание одной или нескольких дневных записей. */
export const expenseInput = z.object({
  /** Размещение. */ placementId: id,
  /** Сумма в исходной валюте. */ amount: money,
  /** Исходная валюта. */ currency: z.enum(['RUB','USD']),
  /** Первый учётный день. */ day,
  /** Последний день при явном распределении. */ untilDay: day.optional(),
  /** Выбранный пользователем способ распределения. */ allocation: z.enum(['single','equal']).default('single'),
  /** Зафиксированный ручной курс. */ exchangeRateRubPerUsd: rate.nullable().optional(),
  /** Дата фиксации курса; по умолчанию первый учётный день. */ exchangeRateDate: day.nullable().optional(),
  /** Пояснение расхода. */ note: z.string().trim().max(2000).default(''),
}).strict();
/** Контролируемая ошибка пользовательского запроса. */
export class AcquisitionError extends Error {
  /** HTTP-статус ошибки. */ status: number;
  /** Создаёт ошибку без раскрытия SQL или секретов. */
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
