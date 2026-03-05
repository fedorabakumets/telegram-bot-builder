/**
 * @fileoverview Хендлер отправки сообщения от узла
 * 
 * Отправляет пользователю сообщение от имени узла проекта,
 * поддерживая медиа, кнопки, замену переменных и форматирование.
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
  analyzeTelegramError,
  getErrorStatusCode
} from "../../../../utils/telegram-error-handler";
import { replaceVariablesInText } from "./replace-variables";
import { extractNodeFromProject } from "./extract-node";
import { extractMediaFromNode } from "./extract-media";
import { extractButtonsFromNode } from "./extract-buttons";
import { sendTelegramMessage } from "./send-telegram-message";

/**
 * Обрабатывает запрос на отправку сообщения от узла
 * 
 * @function sendNodeMessageHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function sendNodeMessageHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.params.userId;
    const { nodeId, userData: customUserData } = req.body;

    if (isNaN(projectId) || !nodeId) {
      res.status(400).json({ message: "projectId и nodeId обязательны" });
      return;
    }

    // Получаем проект и узел
    const project = await storage.getBotProject(projectId);
    if (!project) {
      res.status(404).json({ message: "Проект не найден" });
      return;
    }

    const node = extractNodeFromProject(project, nodeId);
    if (!node) {
      res.status(404).json({ message: "Узел не найден" });
      return;
    }

    // Получаем данные пользователя
    const user = await storage.getUserBotDataByProjectAndUser(projectId, userId);
    const telegramUser = {
      id: Number(userId),
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
      username: user?.userName || undefined,
    };

    // Объединяем userData
    const userData = { ...(user?.userData as Record<string, unknown> || {}), ...(customUserData || {}) };

    // Получаем токен
    const defaultToken = await storage.getDefaultBotToken(projectId);
    if (!defaultToken) {
      res.status(400).json({ message: "Токен бота не найден" });
      return;
    }

    // Заменяем переменные в тексте
    const messageText = String(node.data.messageText || node.data.description || "");
    const textWithVariables = await replaceVariablesInText({ text: messageText, userData, telegramUser, projectId });

    // Извлекаем медиа и кнопки
    const [mediaFiles, buttons] = await Promise.all([
      extractMediaFromNode(node.data, storage),
      Promise.resolve(extractButtonsFromNode(node.data)),
    ]);

    // Определяем форматирование
    const useHtml = String(node.data.formatMode) === 'html' || Boolean(node.data.markdown);

    // Отправляем сообщение
    const result = await sendTelegramMessage(
      defaultToken.token,
      userId,
      textWithVariables,
      mediaFiles,
      buttons,
      useHtml
    );

    // Сохраняем в БД
    await storage.createBotMessage({
      projectId,
      userId,
      messageType: "bot",
      messageText: textWithVariables,
      messageData: { sentFromAdmin: true, nodeId: node.id, nodeType: node.type },
    });

    res.json({ message: "Сообщение успешно отправлено", result });
  } catch (error) {
    const errorInfo = analyzeTelegramError(error);
    console.error("Ошибка отправки сообщения от узла:", errorInfo);

    const statusCode = getErrorStatusCode(errorInfo.type);
    res.status(statusCode).json({
      message: errorInfo.userFriendlyMessage,
      errorType: errorInfo.type,
      details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
    });
  }
}
