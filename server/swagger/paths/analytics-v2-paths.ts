/** @fileoverview OpenAPI подтверждённой аналитики, источников, ссылок и рекламных расходов. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { AnalyticsV2QuerySchema, AnalyticsV2SnapshotSchema } from '../schemas/analytics-v2';
import { AcquisitionReportSchema, AcquisitionSchemas, AcquisitionHistorySchema } from '../schemas/analytics-acquisition';
import { linkBudgetInput } from '../../routes/analytics/acquisition/link-budget';
import { sourceInput } from '../../routes/analytics/acquisition/validation';
import { placementPatch, expensePatch } from '../../routes/analytics/acquisition/update';
import { reportInput } from '../../routes/analytics/acquisition/report';
/** Параметр проекта. */
const params = z.object({ /** ID проекта. */ id: z.coerce.number().int().positive() });
/** Общие ошибки защищённого API. */
const failures = {
  /** Некорректные поля. */ 400: { description: 'Некорректные поля, даты, сумма или шаг; JSON message и необязательные issues' },
  /** Нет авторизации. */ 401: { description: 'Требуется сессия или Bearer PAT' },
  /** Чужой проект или бот. */ 403: { description: 'Нет доступа к проекту или бот не принадлежит проекту' },
  /** Объект отсутствует. */ 404: { description: 'Объект не найден внутри проекта' },
  /** Конфликт start. */ 409: { description: 'Публичная метка пересекается с пользовательским маршрутом /start' },
  /** Недоступность. */ 503: { description: 'Снимок или сохранение временно недоступны; неизвестное не заменяется нулём' },
};
/** Регистрирует реальные API без отдельной расчётной логики документации. */
export function registerAnalyticsV2Paths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const base = '/api/projects/{id}/analytics';
  registry.registerPath({ method: 'get', path: `${base}/v2/snapshot`, tags: ['analytics-v2'], security,
    summary: 'Единый снимок подтверждённой аналитики v2',
    description: 'Новые и активные пользователи требуют направленного действия; обычная группа — отдельное наблюдение. period либо from+to, [from,to), до 500 точек. total_users — всё время. coverage объясняет ограничения старых сборок и первого взаимодействия. previous=null для all. Все карточки имеют один as_of/revision. На analytics-changed, reconnect и next_recompute_at получите новый снимок; уведомление не содержит значений.',
    request: { params, query: AnalyticsV2QuerySchema },
    responses: { 200: { description: 'Согласованный снимок и полнота истории', content: { 'application/json': { schema: AnalyticsV2SnapshotSchema } } }, ...failures },
  });
  registry.registerPath({method:'post',path:`${base}/acquisition/budgets`,tags:['analytics-v2'],security,
    summary:'Сохранить рекламный бюджет простой start-ссылки',description:'Атомарно создаёт источник, техническое размещение, публичную метку и дневной расход; существующая метка используется повторно без изменения прежних даты начала и пояса. Сумма — decimal-строка. link_, ref и ref_ запрещены. Конфликт маршрута или занятой ссылки даёт 409. Повторный POST добавляет отдельную финансовую запись, не является идемпотентным.',
    request:{params,body:{required:true,content:{'application/json':{schema:linkBudgetInput}}}},
    responses:{201:{description:'Сохранённый дневной расход',content:{'application/json':{schema:z.object({item:AcquisitionSchemas.expenses.item})}}},...failures},
  });
  registry.registerPath({ method: 'get', path: `${base}/acquisition/exchange-rate`, tags: ['analytics-v2'], security,
    summary: 'Бесплатный официальный курс USD/RUB ЦБ на дату рекламного бюджета',
    description: 'Ключ не нужен. rubPerUsd — decimal-строка RUB за 1 USD. effectiveDay может быть раньше requestedDay в выходной. Ничего не сохраняет: передайте курс и дату в расход явно. Ошибка сервиса 503, ручной ввод остаётся доступен.',
    request: { params, query: z.object({ /** Учётная дата. */ day: z.string().date() }) },
    responses: { 200: { description: 'Официальный курс и дата действия', content: { 'application/json': { schema: z.object({
      /** День запроса. */ requestedDay: z.string().date(), /** Дата курса. */ effectiveDay: z.string().date(),
      /** Рублей за доллар. */ rubPerUsd: z.string(), /** Поставщик. */ source: z.literal('cbr'), /** Документация. */ sourceUrl: z.string().url(),
    }) } } }, ...failures },
  });
  registry.registerPath({ method: 'get', path: `${base}/acquisition/report`, tags: ['analytics-v2'], security,
    summary: 'Результаты рекламных источников, бюджет и цена нового пользователя',
    description: 'Без from/to — весь срок. День рекламного бюджета определяется сохранённым поясом технического размещения. returningUsers — люди с первым контактом до начала окна, снова вошедшие по метке; обычное сообщение не равно рекламному возвращению. Повторный вход впервые пришедшего внутри окна не добавляет вернувшегося. Для обрезанного дня цена null. RUB/USD раздельно, пересчёт только по сохранённому ручному RUB-за-USD курсу. Деньги — decimal-строки. costPerUser=null при неполной истории, неизвестном расходе/курсе или отсутствии новых. 3000.00 RUB / 200 = 15.00 RUB. Запуски Telegram не являются кликами.',
    request: { params, query: reportInput }, responses: { 200: { description: 'Рекламный снимок', content: { 'application/json': { schema: AcquisitionReportSchema } } }, ...failures },
  });
  const patches = { sources: sourceInput.partial().extend({ archived: z.boolean().optional() }), placements: placementPatch, expenses: expensePatch, links: z.object({ archived: z.boolean() }).strict() };
  const names = { sources: 'источники', placements: 'размещения', links: 'публичные ссылки', expenses: 'дневные расходы' };
  registry.registerPath({ method: 'get', path: `${base}/acquisition`, tags: ['analytics-v2'], security,
    summary: 'Справочники рекламной аналитики проекта', request: { params }, responses: { 200: { description: 'Массивы sources, placements, links и expenses', content: { 'application/json': { schema: z.object({
      sources: z.array(AcquisitionSchemas.sources.item), placements: z.array(AcquisitionSchemas.placements.item), links: z.array(AcquisitionSchemas.links.item), expenses: z.array(AcquisitionSchemas.expenses.item),
    }) } } }, ...failures },
  });
  for (const resource of Object.keys(AcquisitionSchemas) as Array<keyof typeof AcquisitionSchemas>) {
    const { item, input } = AcquisitionSchemas[resource];
    registry.registerPath({ method: 'get', path: `${base}/acquisition/${resource}/{resourceId}/history`, tags: ['analytics-v2'], security,
      summary: `История изменений: ${names[resource]}`, request: { params: params.extend({ resourceId: z.coerce.number().int().positive() }) },
      responses: { 200: { description: 'Автор, время, состояние до и после изменения', content: { 'application/json': { schema: AcquisitionHistorySchema } } }, ...failures },
    });
    registry.registerPath({ method: 'get', path: `${base}/acquisition/${resource}`, tags: ['analytics-v2'], security,
      summary: `Получить ${names[resource]}`, request: { params }, responses: { 200: { description: 'Включает архивные записи с archivedAt', content: { 'application/json': { schema: z.object({ items: z.array(item) }) } } }, ...failures },
    });
    registry.registerPath({ method: 'post', path: `${base}/acquisition/${resource}`, tags: ['analytics-v2'], security,
      summary: `Создать: ${names[resource]}`,
      description: 'Все связи проверяются в проекте. Расходы: allocation=equal и untilDay явно распределяют сумму по дням с сохранением итога; estimated=true. Курс exchangeRateRubPerUsd — RUB за один USD. Ссылка имеет постоянную bc_-метку и не создаёт login-код. Реферер должен быть подтверждённым пользователем проекта.',
      request: { params, body: { required: true, content: { 'application/json': { schema: input } } } },
      responses: { 201: { description: 'Созданный объект; для расходов массив дневных строк', content: { 'application/json': { schema: resource === 'expenses' ? z.object({ items: z.array(item) }) : z.object({ item }) } } }, ...failures },
    });
    registry.registerPath({ method: 'patch', path: `${base}/acquisition/${resource}/{resourceId}`, tags: ['analytics-v2'], security,
      summary: `Исправить или архивировать: ${names[resource]}`,
      description: 'Изменения сохраняются в аудите. archived=true архивирует, false восстанавливает. Нельзя изменить code, источник/бота опубликованной ссылки или связь размещения.',
      request: { params: params.extend({ resourceId: z.coerce.number().int().positive() }), body: { required: true, content: { 'application/json': { schema: patches[resource] } } } },
      responses: { 200: { description: 'Обновлённый объект', content: { 'application/json': { schema: z.object({ item }) } } }, ...failures },
    });
  }
}
