/** @fileoverview Управляемые владельцем запуск и откат переноса старых Telegram-сессий. */
import type { Express, RequestHandler } from 'express';
import { z } from 'zod';
import { pool } from '../../database/db';
import { createTelegramAccountCutoverJournal } from '../../database/project-telegram-account-cutover-journal';
import {
  getTelegramAccountCutoverPlan, listTelegramAccountCutovers, reserveProjectTelegramAccountCutover,
} from '../../database/reserve-project-telegram-account-cutover';
import {
  canStartTelegramAccountCutover, isTelegramAccountCutoverAvailable, telegramAccountCutoverRuntime,
  telegramCutoverAvailabilityReason,
} from '../../bots/telegram-account-cutover-runtime';
import {
  runTelegramAccountCutover, rollbackTelegramAccountCutover, TelegramAccountCutoverError,
} from '../../bots/telegram-account-cutover';
import { loadLegacyTelegramMigrationPreview } from '../../telegram-accounts/load-legacy-migration-preview';
import { unsupportedSharedTelegramNodes } from '../../bots/project-telegram-scenario-compatibility';
import { storage } from '../../storages/storage';

const migrationId = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,127}$/i);
const applyInput = z.object({ migrationId, groupId: z.number().int().positive().max(2_147_483_647) }).strict();
const rollbackInput = z.object({ migrationId }).strict();
const journal = createTelegramAccountCutoverJournal(pool);
const path = '/api/projects/:projectId/telegram-accounts/migration';

/**
 * Проверяет, может ли процесс подтвердить остановку старого клиента.
 * @param _req - Запрос после проверки прав владельца.
 * @param res - Ответ о недоступности переноса.
 * @param next - Следующий обработчик.
 */
const requireCutoverRuntime: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!isTelegramAccountCutoverAvailable()) {
    res.status(409).json({ code: 'CUTOVER_UNAVAILABLE', message: 'Перенос доступен только с подтверждением остановки воркера и брокера' });
    return;
  }
  next();
};

/**
 * Регистрирует подтверждённые операции переноса и отката для владельца проекта.
 * @param app - Приложение Express.
 * @param requireAccess - Проверка доступа к проекту и включения аккаунтов.
 * @param requireManager - Проверка прав владельца проекта.
 */
export function registerLegacyTelegramMigrationCutover(
  app: Express, requireAccess: RequestHandler, requireManager: RequestHandler,
): void {
  const middleware = [requireAccess, requireManager, requireCutoverRuntime];
  app.get(`${path}/operations`, requireAccess, requireManager, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const projectId = Number(req.params.projectId);
    try {
      const availabilityReason = telegramCutoverAvailabilityReason(projectId);
      res.json({ canApply: availabilityReason === null, availabilityReason: availabilityReason ?? undefined,
        operations: await listTelegramAccountCutovers(projectId) });
    } catch {
      res.status(500).json({ message: 'Не удалось загрузить операции переноса' });
    }
  });
  app.post(`${path}/apply`, middleware, async (req, res) => {
    const parsed = applyInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Некорректные параметры переноса' });
      return;
    }
    const projectId = Number(req.params.projectId);
    const { migrationId: id, groupId } = parsed.data;
    try {
      let plan = await getTelegramAccountCutoverPlan(projectId, id);
      if (!plan) {
        if (!canStartTelegramAccountCutover(projectId)) {
          res.status(409).json({ message: 'Перенос требует ответа текущего воркера проекта' });
          return;
        }
        const project = await storage.getBotProject(projectId);
        const unsupported = unsupportedSharedTelegramNodes(project?.data);
        if (unsupported.length > 0) {
          res.status(409).json({ code: 'UNSUPPORTED_SCENARIO', nodeIds: unsupported,
            message: 'У сценария есть действия Telegram, которые ещё не поддерживает общий клиент' });
          return;
        }
        const preview = await loadLegacyTelegramMigrationPreview(projectId);
        const group = preview.groups.find(item => item.id === groupId && item.disposition === 'create');
        if (!group) {
          res.status(409).json({ message: 'Группа изменилась или требует отдельной проверки. Обновите предварительный просмотр' });
          return;
        }
        if (!canStartTelegramAccountCutover(projectId, group.botIds)) {
          res.status(409).json({ message: 'Не удалось доказать возможность остановки этой группы без остановки других активных ботов' });
          return;
        }
        plan = await reserveProjectTelegramAccountCutover(projectId, id, group);
      }
      if (plan.botIds[0] !== groupId) {
        res.status(409).json({ message: 'Этот запрос уже относится к другой группе' });
        return;
      }
      const phase = await runTelegramAccountCutover(plan, journal, telegramAccountCutoverRuntime);
      res.json({ migrationId: id, accountId: plan.accountId, phase });
    } catch (error) {
      res.status(409).json({ migrationId: id, message: error instanceof TelegramAccountCutoverError
        ? error.message : 'Не удалось подтвердить перенос. Повторите с тем же идентификатором или выполните откат' });
    }
  });
  app.post(`${path}/rollback`, middleware, async (req, res) => {
    const parsed = rollbackInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Некорректный идентификатор переноса' });
      return;
    }
    const { migrationId: id } = parsed.data;
    try {
      const plan = await getTelegramAccountCutoverPlan(Number(req.params.projectId), id);
      if (!plan) {
        res.status(404).json({ message: 'Перенос не найден' });
        return;
      }
      const phase = await rollbackTelegramAccountCutover(plan, journal, telegramAccountCutoverRuntime);
      res.json({ migrationId: id, accountId: plan.accountId, phase });
    } catch (error) {
      res.status(409).json({ migrationId: id, message: error instanceof TelegramAccountCutoverError
        ? error.message : 'Не удалось подтвердить откат. Повторите с тем же идентификатором' });
    }
  });
}
