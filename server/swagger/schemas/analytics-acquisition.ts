/** @fileoverview OpenAPI рекламных объектов и денежных ответов с точными decimal-строками. */
import './common';
import { z } from 'zod';
import { sourceInput, placementInput, linkInput, expenseInput, money, rate } from '../../../shared/analytics/acquisition/validation';
/** Общая идентичность и жизненный цикл. */
const identity = z.object({
  /** Объект. */ id: z.number().int(), /** Проект. */ projectId: z.number().int(),
  /** Создан. */ createdAt: z.string(), /** Архивирован. */ archivedAt: z.string().nullable(),
});
/** Площадка проекта. */
export const AcquisitionSourceSchema = identity.merge(sourceInput).openapi('AnalyticsSource');
/** Размещение у одного бота. */
export const AcquisitionPlacementSchema = identity.merge(placementInput).openapi('AnalyticsPlacement');
/** Стабильная публичная ссылка, не токен авторизации. */
export const AcquisitionLinkSchema = identity.extend({
  /** Бот. */ tokenId: z.number(), /** Источник. */ sourceId: z.number(),
  /** Размещение. */ placementId: z.number(), /** Публичная метка. */ code: z.string().max(64),
  /** Назначение. */ purpose: z.enum(['acquisition','referral','combined']),
  /** Пригласивший. */ referrerId: z.string().nullable(),
  /** URL; null при недоступном username. */ url: z.string().nullable().optional(),
}).openapi('AnalyticsLink');
/** Одна дневная оплата; курс означает рублей за один доллар. */
export const AcquisitionExpenseSchema = identity.extend({
  /** Размещение. */ placementId: z.number(), /** Сумма строкой. */ amount: money,
  /** Валюта. */ currency: z.enum(['RUB','USD']), /** Учётный день. */ day: z.string(),
  /** Фиксированный курс RUB за USD. */ exchangeRateRubPerUsd: rate.nullable(),
  /** Дата фиксации курса. */ exchangeRateDate: z.string().nullable(),
  /** Пояснение. */ note: z.string(), /** Оценочное распределение. */ estimated: z.boolean(),
  /** Общий ID распределения. */ allocationGroupId: z.string().nullable(), /** Изменено. */ updatedAt: z.string(),
}).openapi('AnalyticsExpense');
/** Словарь схем ресурса и создания; используется регистрацией API. */
export const AcquisitionSchemas = {
  /** Источники. */ sources: { item: AcquisitionSourceSchema, input: sourceInput },
  /** Размещения. */ placements: { item: AcquisitionPlacementSchema, input: placementInput },
  /** Ссылки. */ links: { item: AcquisitionLinkSchema, input: linkInput },
  /** Расходы. */ expenses: { item: AcquisitionExpenseSchema, input: expenseInput },
};
/** Результат рекламного отчёта: null означает отсутствие точного значения, а не ноль. */
export const AcquisitionReportSchema = z.object({
  /** Момент снимка. */ asOf: z.string(), /** Начало. */ from: z.string(), /** Конец. */ to: z.string(),
  /** Пояс. */ timezone: z.string(), /** Весь срок размещения. */ lifetime: z.boolean(),
  /** Строки размещений. */ rows: z.array(z.object({
    /** Стабильный ключ автоматической строки. */ rowKey: z.string().optional(),
    /** Ключ найденного источника. */ sourceKey: z.string().optional(),
    /** Размещение. */ placementId: z.number().nullable(), /** Название. */ name: z.string(),
    /** Бот. */ tokenId: z.number().nullable(), /** Источник. */ sourceId: z.number().nullable(), /** Площадка. */ sourceName: z.string(),
    /** Архив. */ archivedAt: z.string().nullable(), /** Новые. */ newUsers: z.number(),
    /** Исторические первые контакты. */ historicalUsers: z.number().optional(),
    /** Демонстрационная привязка. */ isDemo: z.boolean().optional(),
    /** Условная демо-цена контакта, не CPA. */ demoCostPerContact: z.string().nullable().optional(),
    /** Вернувшиеся. */ returningUsers: z.number(), /** Повторные запуски. */ repeatStarts: z.number(),
    /** Исходные валюты раздельно. */ spend: z.object({ /** Рубли. */ RUB: z.string().nullable(), /** Доллары. */ USD: z.string().nullable() }),
    /** Пересчёт с сохранёнными курсами. */ convertedSpend: z.string().nullable(),
    /** Цена нового пользователя. */ costPerUser: z.string().nullable(),
    /** Отдельная цена в исходных валютах, даже без курса пересчёта. */ costPerUserByCurrency: z.object({ /** Рубли. */ RUB: z.string().nullable(), /** Доллары. */ USD: z.string().nullable() }),
    /** Валюта цены и пересчёта. */ currency: z.enum(['RUB','USD']),
    /** Возможно ли показать точную цену. */ complete: z.boolean(),
    /** Почему цена недоступна. */ reason: z.string().nullable(),
    /** Есть оценочное распределение расходов. */ estimated: z.boolean(),
    /** Окно включает текущий учётный день. */ currentDay: z.boolean(),
  })),
}).openapi('AnalyticsAcquisitionReport');
/** Аудит исправлений внутри одного проекта; без секретов runtime. */
export const AcquisitionHistorySchema = z.object({
  /** Изменения от новых к старым. */ items: z.array(z.object({
    /** ID аудита. */ id: z.union([z.string(),z.number()]), /** Проект. */ projectId: z.number(),
    /** Ресурс. */ resource: z.string(), /** Объект. */ resourceId: z.number(),
    /** Автор. */ actorId: z.string().nullable(), /** До изменения. */ beforeData: z.record(z.unknown()).nullable(),
    /** После изменения. */ afterData: z.record(z.unknown()), /** Когда. */ createdAt: z.string(),
  })),
}).openapi('AnalyticsAcquisitionHistory');
