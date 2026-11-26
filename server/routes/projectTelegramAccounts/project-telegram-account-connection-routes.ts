/** @fileoverview Маршруты подключения сессии Telegram и проверки адреса прокси. */
import type { Express, Request, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ProjectTelegramInputError } from '../../bots/project-telegram-accounts/input';
import { continueProjectTelegramPhoneAuth, startProjectTelegramPhoneAuth } from '../../bots/project-telegram-accounts/phone-auth';
import { normalizeProjectTelegramProxy, resolveProjectTelegramProxy } from '../../bots/project-telegram-accounts/proxy';
import { readProjectTelegramSessionImport } from '../../bots/project-telegram-accounts/session-import';
import { verifyImportedProjectTelegramSession } from '../../bots/project-telegram-accounts/verify-import';
import { callProjectTelegramBroker, ProjectTelegramBrokerError } from '../../bots/project-telegram-broker-client';
import type { ProjectTelegramSessionInput } from '../../database/project-telegram-account-secrets';
import {
  DuplicateProjectTelegramSessionError, getProjectTelegramAccount,
  getProjectTelegramAccountSecrets, ProjectTelegramSessionReplacementError, setProjectTelegramAccountSession,
} from '../../database/project-telegram-accounts-store';
import { getOwnerIdFromRequest } from '../../telegram/auth-middleware';

const path = '/api/projects/:projectId/telegram-accounts/:accountId';

/** Идентификаторы карточки и пользователя для этапов авторизации. */
interface ConnectionScope {
  /** Проект, проверенный предварительным обработчиком. */
  projectId: number;
  /** Карточка в указанном проекте. */
  accountId: number;
  /** Ключ временной авторизации для текущего владельца. */
  key: string;
}

/**
 * Формирует изолированный ключ последовательности авторизации.
 * @param req - Запрос после проверки URL и прав владельца.
 * @returns Идентификаторы карточки и ключ последовательности.
 */
function connectionScope(req: Request): ConnectionScope {
  const projectId = Number(req.params.projectId);
  const accountId = Number(req.params.accountId);
  return { projectId, accountId, key: `${getOwnerIdFromRequest(req)}:${projectId}:${accountId}` };
}

/**
 * Записывает сессию и возвращает только публичную карточку.
 * @param scope - Идентификаторы проекта и аккаунта.
 * @param session - Секрет для серверного хранилища.
 * @returns Обновлённая карточка или null при удалении аккаунта.
 */
async function saveConnection(scope: ConnectionScope, session: ProjectTelegramSessionInput) {
  const account = await setProjectTelegramAccountSession(scope.projectId, scope.accountId, session);
  return account ? { ok: true, stage: 'done', account } : null;
}

/**
 * Проверяет существование карточки и преобразует только известные ошибки в ответы API.
 * @param run - Операция сессии или прокси.
 * @returns Обработчик защищённого маршрута.
 */
function handleConnection(run: (scope: ConnectionScope, body: unknown) => Promise<unknown>): RequestHandler {
  return (req, res) => {
    res.set('Cache-Control', 'no-store');
    const scope = connectionScope(req);
    void getProjectTelegramAccount(scope.projectId, scope.accountId)
      .then(account => account ? run(scope, req.body) : null)
      .then(result => {
        if (result === null) res.status(404).json({ ok: false, message: 'Аккаунт не найден' });
        else res.json(result);
      })
      .catch(error => {
        if (error instanceof ProjectTelegramInputError) res.status(400).json({ ok: false, message: error.message });
        else if (error instanceof DuplicateProjectTelegramSessionError || error instanceof ProjectTelegramSessionReplacementError) {
          res.status(409).json({ ok: false, message: error.message });
        } else res.status(500).json({ ok: false, message: 'Не удалось завершить операцию с аккаунтом' });
      });
  };
}

/**
 * Регистрирует операции подключения для владельца проекта.
 * @param app - Приложение Express.
 * @param access - Проверка доступа к проекту и доступности функции.
 * @param manager - Проверка прав управления аккаунтом.
 */
export function registerProjectTelegramAccountConnectionRoutes(app: Express, access: RequestHandler, manager: RequestHandler) {
  const limit = rateLimit({ windowMs: 60_000, limit: 10, keyGenerator: req => String(getOwnerIdFromRequest(req)),
    message: { ok: false, message: 'Подождите минуту перед повторной попыткой' }, standardHeaders: 'draft-8', legacyHeaders: false });
  const scoped = [access, manager, limit];
  app.post(`${path}/auth/send-code`, scoped, handleConnection(async (scope, body) => {
    const account = await getProjectTelegramAccountSecrets(scope.projectId, scope.accountId);
    if (!account) return null;
    if (account.session) throw new ProjectTelegramSessionReplacementError();
    return { ok: true, ...await startProjectTelegramPhoneAuth(scope.key, body, account.proxy) };
  }));
  /**
   * Обрабатывает проверку кода или второго фактора.
   * @param step - Подтверждаемый этап авторизации.
   * @returns Обработчик продолжения входа.
   */
  const continueAuth = (step: 'code' | 'password') => handleConnection(async (scope, body) => {
    const result = await continueProjectTelegramPhoneAuth(scope.key, step, body);
    return result.stage === 'done' ? saveConnection(scope, result.session) : { ok: true, stage: 'password' };
  });
  app.post(`${path}/auth/sign-in`, scoped, continueAuth('code'));
  app.post(`${path}/auth/sign-in-2fa`, scoped, continueAuth('password'));
  app.post(`${path}/import`, scoped, handleConnection(async (scope, body) => {
    const stored = await saveConnection(scope, await readProjectTelegramSessionImport(body));
    return stored ? verifyImportedProjectTelegramSession(scope.projectId, scope.accountId) : null;
  }));
  app.post(`${path}/auth/verify`, scoped, handleConnection(scope =>
    verifyImportedProjectTelegramSession(scope.projectId, scope.accountId)));
  app.post(`${path}/profile`, scoped, handleConnection(async (scope) => {
    const account = await getProjectTelegramAccount(scope.projectId, scope.accountId);
    if (!account) return null;
    if (account.status !== 'connected') throw new ProjectTelegramInputError('Сначала подтвердите сессию Telegram.');
    const secrets = await getProjectTelegramAccountSecrets(scope.projectId, scope.accountId);
    if (!secrets?.session) return null;
    const { apiId, apiHash, sessionString } = secrets.session;
    try {
      return await callProjectTelegramBroker('verify', {
        accountId: scope.accountId, apiId: Number(apiId), apiHash, sessionString, proxy: secrets.proxy, includeProfile: true,
      });
    } catch (error) {
      if (!(error instanceof ProjectTelegramBrokerError)) throw error;
      throw new ProjectTelegramInputError('Не удалось получить профиль из Telegram.');
    }
  }));
  app.post(`${path}/proxy/test`, scoped, handleConnection(async (_scope, body) => {
    const proxy = normalizeProjectTelegramProxy(body);
    if (!proxy) throw new ProjectTelegramInputError('Укажите параметры прокси.');
    await resolveProjectTelegramProxy(proxy);
    return { ok: true, message: 'Публичный адрес прокси проверен. Соединение не устанавливалось.' };
  }));
}
