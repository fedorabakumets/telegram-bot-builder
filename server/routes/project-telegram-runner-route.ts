/** @fileoverview Передаёт разрешённые команды привязанных ботов общему клиенту Telegram. */
import type { Express, Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { projectTelegramExecutionSchema } from '../../shared/project-telegram-execution';
import { authorizeProjectTelegramRunner } from '../bots/project-telegram-runner-auth';
import { callProjectTelegramBroker, ProjectTelegramBrokerError } from '../bots/project-telegram-broker-client';
import { getProjectTelegramAccountForBot } from '../database/project-telegram-accounts-store';
import { storage } from '../storages/storage';

/**
 * Разделяет квоты подписанных ботов, объединяя неподписанные попытки по адресу источника.
 * @param req - Запрос внутреннего исполнителя.
 * @returns Ключ квоты без токенов и секретов.
 */
function runnerRateLimitKey(req: Request): string {
  const projectId = Number(req.params.projectId);
  const tokenId = Number(req.params.tokenId);
  if (Number.isSafeInteger(projectId) && projectId > 0 && Number.isSafeInteger(tokenId) && tokenId > 0
    && authorizeProjectTelegramRunner(req.get('Authorization'), projectId, tokenId)) {
    return `runner:${projectId}:${tokenId}`;
  }
  return `ip:${ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown')}`;
}

/**
 * Регистрирует внутренний маршрут раннера, изолированный от браузерного API.
 * @param app - Приложение панели.
 */
export function registerProjectTelegramRunnerRoute(app: Express): void {
  /** Ограничивает обращения до чтения БД; общий адрес runtime не объединяет квоты разных ботов. */
  const limit = rateLimit({ windowMs: 60_000, limit: 600, keyGenerator: runnerRateLimitKey,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { code: 'RUNNER_RATE_LIMITED' } });
  app.post('/internal/project-telegram/:projectId/:tokenId/execute', limit, async (req, res) => {
    if (process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED !== '1') {
      res.sendStatus(404);
      return;
    }
    const projectId = Number(req.params.projectId);
    const tokenId = Number(req.params.tokenId);
    if (!Number.isSafeInteger(projectId) || projectId <= 0 || !Number.isSafeInteger(tokenId) || tokenId <= 0
      || !authorizeProjectTelegramRunner(req.get('Authorization'), projectId, tokenId)) {
      res.status(401).json({ code: 'RUNNER_UNAUTHORIZED' });
      return;
    }
    const command = projectTelegramExecutionSchema.safeParse(req.body);
    if (!command.success) {
      res.status(400).json({ code: 'INVALID_REQUEST' });
      return;
    }
    try {
      const account = await getProjectTelegramAccountForBot(projectId, tokenId);
      if (!account?.session) {
        res.status(409).json({ code: 'NOT_AUTHORIZED' });
        return;
      }
      /** Старое поколение процесса и прежняя привязка не получают доступ к текущему аккаунту. */
      const instance = await storage.getBotInstanceByToken(tokenId);
      if (!instance || !['starting', 'running'].includes(instance.status)
        || !authorizeProjectTelegramRunner(req.get('Authorization'), projectId, tokenId,
        instance?.desiredGeneration ?? 0, account?.accountId ?? 0)) {
        res.status(401).json({ code: 'RUNNER_UNAUTHORIZED' });
        return;
      }
      const result = await callProjectTelegramBroker('execute', {
        ...command.data, accountId: account.accountId, apiId: Number(account.session.apiId), apiHash: account.session.apiHash,
        sessionString: account.session.sessionString, proxy: account.proxy,
      });
      res.json({ result });
    } catch (error) {
      res.status(error instanceof ProjectTelegramBrokerError ? error.status : 503)
        .json({ code: error instanceof ProjectTelegramBrokerError ? error.code : 'BROKER_UNAVAILABLE' });
    }
  });
}
