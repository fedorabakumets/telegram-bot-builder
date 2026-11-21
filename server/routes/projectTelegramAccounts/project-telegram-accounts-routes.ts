/** @fileoverview Публичные защищённые маршруты карточек Telegram-аккаунтов проекта. */
import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';
import { registerLegacyTelegramMigrationCutover } from './register-legacy-migration-cutover';
import { z } from 'zod';
import {
  createProjectTelegramAccount, deleteProjectTelegramAccount, listProjectTelegramAccounts,
  setProjectTelegramAccountBots, setProjectTelegramAccountProxy,
  InvalidProjectTelegramAccountBotsError, ProjectTelegramAccountCutoverActiveError,
  ProjectTelegramAccountUnavailableForEditError, ProjectTelegramAccountAuthorizationRequiredError,
  ProjectTelegramAccountBindingLockedError,
} from '../../database/project-telegram-accounts-store';
import { ProjectTelegramInputError } from '../../bots/project-telegram-accounts/input';
import { normalizeProjectTelegramProxy, resolveProjectTelegramProxy } from '../../bots/project-telegram-accounts/proxy';
import { storage } from '../../storages/storage';
import { getOwnerIdFromRequest } from '../../telegram/auth-middleware';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import {
  newProjectTelegramAccount, projectTelegramAccountBots, projectTelegramAccountPathId, projectTelegramAccountProxy,
} from './project-telegram-account-input';
import { registerLegacyTelegramMigrationPreview } from './register-legacy-migration-preview';
import { registerProjectTelegramAccountConnectionRoutes } from './project-telegram-account-connection-routes';

const path = '/api/projects/:projectId/telegram-accounts';

/**
 * Проверяет идентификаторы URL, доступ к проекту и включение функции.
 * @param req - Запрос после общей авторизации API.
 * @param res - Ответ с ошибкой доступа при необходимости.
 * @param next - Следующий обработчик API.
 */
export const requireTelegramAccountsAccess: RequestHandler = (req, res, next) => {
  if (!projectTelegramAccountPathId.safeParse(req.params.projectId).success ||
    (req.params.accountId !== undefined && !projectTelegramAccountPathId.safeParse(req.params.accountId).success)) {
    res.status(400).json({ message: 'Некорректный идентификатор проекта или аккаунта' });
    return;
  }
  void requireProjectAccess(req, res, () => {
    if (process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED !== '1') {
      res.status(404).json({ code: 'PROJECT_TELEGRAM_ACCOUNTS_DISABLED', message: 'Telegram-аккаунты проекта отключены' });
      return;
    }
    next();
  }).catch(() => res.status(500).json({ message: 'Не удалось проверить доступ к аккаунтам проекта' }));
};

/**
 * Проверяет право изменять аккаунты проекта.
 * @param req - Запрос к проекту с подтверждённым доступом.
 * @returns Имеет ли пользователь право управления.
 */
async function canManageAccounts(req: Request): Promise<boolean> {
  const actor = getOwnerIdFromRequest(req);
  if (actor == null) return false;
  const project = await storage.getBotProject(Number(req.params.projectId));
  return project?.ownerId === actor;
}

/**
 * Закрывает изменение аккаунтов для участников без прав управления.
 * @param req - Запрос с подтверждённым доступом к проекту.
 * @param res - Ответ при отказе.
 * @param next - Следующий обработчик API.
 */
export function requireTelegramAccountsManager(req: Request, res: Response, next: NextFunction): void {
  void canManageAccounts(req).then(allowed => {
    if (allowed) next();
    else res.status(403).json({ message: 'Управлять Telegram-аккаунтами может владелец проекта' });
  }).catch(() => res.status(500).json({ message: 'Не удалось проверить права управления аккаунтами' }));
}

/**
 * Валидирует запрос изменения карточки и возвращает открытую запись.
 * @param schema - Схема допустимого тела запроса.
 * @param apply - Изменение хранилища.
 * @returns Обработчик, не передающий внутренние ошибки или секреты браузеру.
 */
function mutation<T>(schema: z.ZodType<T>, apply: (project: number, account: number, data: T) => Promise<unknown>): RequestHandler {
  return (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Проверьте параметры аккаунта' });
      return;
    }
    void apply(Number(req.params.projectId), Number(req.params.accountId), parsed.data).then(result => {
      if (result == null) res.status(404).json({ message: 'Аккаунт не найден' });
      else res.status(req.method === 'POST' ? 201 : 200).json(result);
    }).catch(error => {
      if (error instanceof InvalidProjectTelegramAccountBotsError || error instanceof ProjectTelegramInputError) {
        res.status(400).json({ message: error.message });
      } else if (error instanceof ProjectTelegramAccountCutoverActiveError) {
        res.status(409).json({ message: 'Выполняется перенос Telegram-аккаунтов, повторите позже' });
      } else if (error instanceof ProjectTelegramAccountUnavailableForEditError ||
        error instanceof ProjectTelegramAccountAuthorizationRequiredError || error instanceof ProjectTelegramAccountBindingLockedError) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Не удалось сохранить данные аккаунта' });
      }
    });
  };
}

/**
 * Регистрирует API после общей авторизации и защиты запросов от подделки.
 * @param app - Приложение Express.
 */
export function registerProjectTelegramAccountsRoutes(app: Express): void {
  const write = [requireTelegramAccountsAccess, requireTelegramAccountsManager];
  app.get(path, requireTelegramAccountsAccess, (req, res) => {
    res.set('Cache-Control', 'no-store');
    void Promise.all([listProjectTelegramAccounts(Number(req.params.projectId)), canManageAccounts(req)])
      .then(([accounts, canManage]) => res.json({ enabled: true, canManage, accounts }))
      .catch(() => res.status(500).json({ message: 'Не удалось загрузить аккаунты проекта' }));
  });
  app.post(path, write, mutation(newProjectTelegramAccount, (project, _account, body) =>
    createProjectTelegramAccount(project, body)));
  app.put(`${path}/:accountId/bots`, write, mutation(projectTelegramAccountBots, (project, account, body) =>
    setProjectTelegramAccountBots(project, account, [...new Set(body.botIds)])));
  app.put(`${path}/:accountId/proxy`, write, mutation(projectTelegramAccountProxy, async (project, account, body) => {
    const proxy = normalizeProjectTelegramProxy(body.proxy);
    if (proxy) await resolveProjectTelegramProxy(proxy);
    return setProjectTelegramAccountProxy(project, account, proxy);
  }));
  /** Явные типы сохраняют контекст Express при массиве промежуточных обработчиков. */
  app.delete(`${path}/:accountId`, write, (req: Request, res: Response) => {
    void deleteProjectTelegramAccount(Number(req.params.projectId), Number(req.params.accountId)).then(deleted => {
      if (deleted) res.json({ success: true });
      else res.status(404).json({ message: 'Аккаунт не найден' });
    }).catch(error => {
      if (error instanceof ProjectTelegramAccountUnavailableForEditError) res.status(409).json({ message: error.message });
      else if (error instanceof ProjectTelegramAccountCutoverActiveError) {
        res.status(409).json({ message: 'Выполняется перенос Telegram-аккаунтов, повторите позже' });
      } else res.status(500).json({ message: 'Не удалось удалить аккаунт' });
    });
  });
  registerLegacyTelegramMigrationPreview(app, requireTelegramAccountsAccess, requireTelegramAccountsManager);
  registerLegacyTelegramMigrationCutover(app, requireTelegramAccountsAccess, requireTelegramAccountsManager);
  registerProjectTelegramAccountConnectionRoutes(app, requireTelegramAccountsAccess, requireTelegramAccountsManager);
}
