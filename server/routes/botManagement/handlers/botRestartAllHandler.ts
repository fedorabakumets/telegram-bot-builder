/**
 * @fileoverview Хендлер перезапуска всех запущенных ботов проекта
 * @module botManagement/handlers/botRestartAllHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { stopBot } from '../../../bots/stopBot';
import { storage } from '../../../storages/storage';

/** Задержка между остановкой и запуском бота в миллисекундах */
const RESTART_DELAY_MS = 500;

/**
 * Результат перезапуска одного токена
 */
interface TokenRestartResult {
  /** Идентификатор токена */
  tokenId: number;
  /** Признак успешного перезапуска */
  success: boolean;
  /** Идентификатор нового процесса */
  processId?: string;
  /** Сообщение об ошибке при неудаче */
  error?: string;
}

/**
 * Обрабатывает запрос на перезапуск всех запущенных ботов проекта
 *
 * @param req - Объект запроса Express, содержащий `params.id` — идентификатор проекта
 * @param res - Объект ответа Express
 * @returns Промис без возвращаемого значения
 *
 * @description
 * Получает все токены проекта, фильтрует только запущенные экземпляры,
 * останавливает каждый из них, ждёт 500 мс и запускает заново.
 * Возвращает сводку: количество успешно перезапущенных и упавших ботов.
 */
export async function handleBotRestartAll(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);

    const tokens = await storage.getBotTokensByProject(projectId);
    if (!tokens.length) {
      res.status(404).json({ message: 'Токены проекта не найдены' });
      return;
    }

    // Оставляем только токены с запущенным экземпляром
    const runningTokens = (
      await Promise.all(
        tokens.map(async (t) => {
          const instance = await storage.getBotInstanceByToken(t.id);
          return instance?.status === 'running' ? t : null;
        })
      )
    ).filter(Boolean) as typeof tokens;

    if (!runningTokens.length) {
      res.json({ message: 'Нет запущенных ботов', restarted: 0 });
      return;
    }

    const results: TokenRestartResult[] = [];

    for (const token of runningTokens) {
      const result = await restartSingleToken(projectId, token.id, token.token);
      results.push(result);
    }

    const restarted = results.filter((r) => r.success).length;
    const failed = results.length - restarted;

    res.json({ restarted, failed, results });
  } catch (error) {
    console.error('Ошибка перезапуска всех ботов:', error);
    res.status(500).json({ message: 'Не удалось перезапустить ботов' });
  }
}

/**
 * Останавливает и повторно запускает одного бота по токену
 *
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param token - Строка токена Telegram-бота
 * @returns Результат перезапуска для данного токена
 */
async function restartSingleToken(
  projectId: number,
  tokenId: number,
  token: string
): Promise<TokenRestartResult> {
  const stopResult = await stopBot(projectId, tokenId);
  if (!stopResult.success) {
    return { tokenId, success: false, error: stopResult.error };
  }

  await new Promise((resolve) => setTimeout(resolve, RESTART_DELAY_MS));

  const startResult = await startBot(projectId, token, tokenId);
  if (startResult.success) {
    return { tokenId, success: true, processId: startResult.processId };
  }
  return { tokenId, success: false, error: startResult.error };
}
