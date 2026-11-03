/** @fileoverview Чистые общие контракты рекламной аналитики без импортов выполнения и базы. */
import { z } from 'zod';
import { day, id, money, timezone, expenseInput } from './validation';
/** Проверяет бюджет без возможности сохранить авторизационный или реферальный код как рекламу. */
const legacyLinkBudgetInput=z.object({tokenId:id,marker:z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).refine(v=>! /^(link_|ref(?:_|$))/i.test(v),'Эта метка зарезервирована для входа или рефералов'),amount:money,currency:z.enum(['RUB','USD']),day,timezone,...expenseInput.pick({exchangeRateRubPerUsd:true,exchangeRateDate:true,note:true,untilDay:true,allocation:true}).shape}).strict();
/** Совместимый HTTP-контракт с постоянным ключом повторной доставки запроса. */
export const linkBudgetInput = legacyLinkBudgetInput.extend({
  /** Один UUID на одну оплату; повтор с тем же UUID не должен создавать расход повторно. */
  requestId: z.string().uuid().optional(),
});
