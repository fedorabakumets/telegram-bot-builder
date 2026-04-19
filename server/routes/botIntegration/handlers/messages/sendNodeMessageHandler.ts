/**
 * @fileoverview Хендлер отправки сообщения из узла с записью в сегмент bot_messages по effective tokenId
 * @module botIntegration/handlers/messages/sendNodeMessageHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
  analyzeTelegramError,
  getErrorStatusCode,
} from "../../../../utils/telegram-error-handler";
import {
  getRequestTokenId,
  resolveEffectiveProjectToken,
} from "../../../utils/resolve-request-token";
import { extractButtonsFromNode } from "./extract-buttons";
import { extractMediaFromNode } from "./extract-media";
import { extractNodeFromProject } from "./extract-node";
import { replaceVariablesInText } from "./replace-variables";
import { sendTelegramMessage } from "./send-telegram-message";

/**
 * Обрабатывает запрос на отправку сообщения от имени узла проекта
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
 */
export async function sendNodeMessageHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const userId = req.params.userId;
    const requestedTokenId = getRequestTokenId(req);
    const { nodeId, userData: customUserData } = req.body;

    if (Number.isNaN(projectId) || !nodeId) {
      res.status(400).json({ message: "projectId и nodeId обязательны" });
      return;
    }

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

    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(
      projectId,
      requestedTokenId
    );

    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден" });
      return;
    }

    const user = await storage.getUserBotDataByProjectAndUser(projectId, userId, effectiveTokenId);
    const userDataFromDb = (user?.userData as Record<string, unknown>) || {};
    const userNameFromData = userDataFromDb.user_name;
    const telegramUser = {
      id: Number(userId),
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
      username: user?.userName || undefined,
      user_name_from_db: userNameFromData ? String(userNameFromData) : undefined,
    };
    const userData = { ...userDataFromDb, ...(customUserData || {}) };
    const messageText = String(node.data.messageText || node.data.description || "");
    const textWithVariables = await replaceVariablesInText({
      text: messageText,
      userData,
      telegramUser,
      projectId,
    });
    const [mediaFiles, buttons] = await Promise.all([
      extractMediaFromNode(node.data, storage),
      Promise.resolve(extractButtonsFromNode(node.data)),
    ]);
    const useHtml = String(node.data.formatMode) === "html" || Boolean(node.data.markdown);
    const result = await sendTelegramMessage(
      selectedToken.token,
      userId,
      textWithVariables,
      mediaFiles,
      buttons,
      useHtml
    );

    await storage.createBotMessage({
      projectId,
      tokenId: effectiveTokenId,
      userId,
      messageType: "bot",
      messageText: textWithVariables,
      messageData: { sentFromAdmin: true, nodeId: node.id, nodeType: node.type },
    });

    res.json({ message: "Сообщение успешно отправлено", result });
  } catch (error) {
    const errorInfo = analyzeTelegramError(error);
    console.error("Ошибка отправки сообщения от узла:", errorInfo);

    res.status(getErrorStatusCode(errorInfo.type)).json({
      message: errorInfo.userFriendlyMessage,
      errorType: errorInfo.type,
      details: process.env.NODE_ENV === "development" ? errorInfo.message : undefined,
    });
  }
}
