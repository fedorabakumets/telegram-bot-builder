/** @fileoverview Авторизованный API источников, размещений, ссылок и дневных расходов. */
import type { Express, Request, RequestHandler, Response } from 'express';
import type { Pool, PoolClient } from 'pg';
import { ZodError } from 'zod';
import { getOwnerIdFromRequest } from '../../../telegram/auth-middleware';
import { AcquisitionError } from './validation';
import { RESOURCE_TABLES, acquisitionDto, listAcquisition, recordAcquisitionChange, scopedRow, type AcquisitionResource } from './storage';
import { createAcquisition } from './create';
import { createExpenses } from './expenses';
import { updateAcquisition } from './update';
import { getAcquisitionExchangeRate } from './exchange-rate';
import { saveLinkBudget } from './link-budget';
import { acquisitionReport } from './report';
/** Исполняет один запрос в транзакции, показывая только безопасные ошибки. */
async function runRequest(pool: Pool, req: Request, res: Response, work: (client: PoolClient, projectId: number) => Promise<unknown>, write = false) {
  const projectId = Number(req.params.id);
  if (!Number.isSafeInteger(projectId) || projectId <= 0) { res.status(400).json({ message: 'Некорректный проект' }); return; }
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query(write ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    await client.query("SET LOCAL statement_timeout='10000ms'");
    /** Одинаковый порядок блокировок для расходов, фактов и удаления человека. */
    if (write) {
      await client.query('INSERT INTO analytics_versions_v2(project_id) VALUES($1) ON CONFLICT DO NOTHING', [projectId]);
      await client.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=$1 FOR UPDATE', [projectId]);
    }
    const result = await work(client, projectId);
    await client.query('COMMIT');
    res.status(write && req.method === 'POST' ? 201 : 200).json(result);
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    if (error instanceof ZodError) res.status(400).json({ message: error.issues[0]?.message ?? 'Проверьте поля', issues: error.issues });
    else if (error instanceof AcquisitionError) res.status(error.status).json({ message: error.message });
    else res.status(503).json({ message: 'Не удалось получить или сохранить рекламные данные. Повторите запрос' });
  } finally { client?.release(); }
}
/** Подключает ресурсы с одинаковой проверкой доступа к проекту. */
export function setupAcquisitionRoutes(app: Express, pool: Pool, access: RequestHandler): void {
  const base = '/api/projects/:id/analytics/acquisition';
  /** Получает публичный курс только после проверки прав проекта, не занимая транзакцию БД. */
  app.get(`${base}/exchange-rate`, access, async (req,res) => {
    try {res.json(await getAcquisitionExchangeRate(typeof req.query.day === 'string' ? req.query.day : ''));}
    catch(error) {res.status(error instanceof AcquisitionError ? error.status : 503).json({message:error instanceof AcquisitionError ? error.message : 'Курс временно недоступен'});}
  });
  /** Сохраняет бюджет простой ссылки одной транзакцией с общими правами проекта. */
  app.post(`${base}/budgets`, access, (req,res) => void runRequest(pool,req,res,(client,projectId) => {
    const actor=getOwnerIdFromRequest(req);
    return saveLinkBudget(client,projectId,req.body,actor===null ? null : String(actor));
  },true));
  app.get(`${base}/report`, access, (req, res) => void runRequest(pool, req, res, (client, projectId) => acquisitionReport(client, projectId, req.query)));
  app.get(base, access, (req, res) => void runRequest(pool, req, res, async (client, projectId) => {
    const result: Record<string, unknown> = {};
    for (const resource of Object.keys(RESOURCE_TABLES) as AcquisitionResource[]) result[resource] = await listAcquisition(client, projectId, resource);
    return result;
  }));
  for (const resource of Object.keys(RESOURCE_TABLES) as AcquisitionResource[]) {
    app.get(`${base}/${resource}/:resourceId/history`, access, (req, res) => void runRequest(pool, req, res, async (client, projectId) => {
      const resourceId = Number(req.params.resourceId);
      if (!Number.isSafeInteger(resourceId) || resourceId <= 0) throw new AcquisitionError('Некорректный идентификатор');
      await scopedRow(client, resource, projectId, resourceId);
      const result = await client.query('SELECT * FROM analytics_acquisition_audit WHERE project_id=$1 AND resource=$2 AND resource_id=$3 ORDER BY id DESC LIMIT 200', [projectId, resource, resourceId]);
      return { items: result.rows.map(acquisitionDto) };
    }));
    app.get(`${base}/${resource}`, access, (req, res) => void runRequest(pool, req, res, async (client, projectId) => ({ items: await listAcquisition(client, projectId, resource) })));
    app.post(`${base}/${resource}`, access, (req, res) => void runRequest(pool, req, res, async (client, projectId) => {
      const rows = resource === 'expenses' ? await createExpenses(client, projectId, req.body) : [await createAcquisition(client, projectId, resource, req.body)];
      const actor = getOwnerIdFromRequest(req);
      for (const row of rows) await recordAcquisitionChange(client, projectId, resource, row, actor === null ? null : String(actor));
      return resource === 'expenses' ? { items: rows.map(acquisitionDto) } : { item: acquisitionDto(rows[0]) };
    }, true));
    app.patch(`${base}/${resource}/:resourceId`, access, (req, res) => void runRequest(pool, req, res, async (client, projectId) => {
      const resourceId = Number(req.params.resourceId);
      if (!Number.isSafeInteger(resourceId) || resourceId <= 0) throw new AcquisitionError('Некорректный идентификатор');
      const { before, row } = await updateAcquisition(client, projectId, resource, resourceId, req.body);
      const actor = getOwnerIdFromRequest(req);
      await recordAcquisitionChange(client, projectId, resource, row, actor === null ? null : String(actor), before);
      return { item: acquisitionDto(row) };
    }, true));
  }
}
