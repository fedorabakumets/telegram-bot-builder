/**
 * @fileoverview Утилита создания проекта по умолчанию
 * @module server/utils/ensureDefaultProject
 */

import { InsertBotProject } from "@shared/schema";
import { storage } from "../storages/storage";

/** Данные стартового узла для нового проекта по умолчанию */
const DEFAULT_START_NODE = {
  id: "start-trigger",
  type: "command_trigger",
  position: { x: 100, y: 100 },
  data: {
    command: "/start",
    autoTransitionTo: "welcome-message",
    enableAutoTransition: true,
    buttons: [],
  },
};

/** Узел приветственного сообщения */
const DEFAULT_MESSAGE_NODE = {
  id: "welcome-message",
  type: "send_message",
  position: { x: 100, y: 280 },
  data: {
    messageText: "Привет! Я ваш новый бот. Напишите /start чтобы начать.",
    keyboardType: "none",
    buttons: [],
    resizeKeyboard: true,
    oneTimeKeyboard: false,
  },
};

/**
 * Гарантирует существование хотя бы одного проекта для указанной сессии или глобально.
 *
 * Если `sessionId` передан — проверяет проекты гостя по сессии и создаёт
 * дефолтный проект привязанный к этой сессии. Без `sessionId` — проверяет
 * все проекты в системе (используется при старте сервера).
 *
 * @param sessionId - ID сессии гостя (опционально)
 * @returns Промис без возвращаемого значения
 */
export async function ensureDefaultProject(sessionId?: string): Promise<void> {
  try {
    const projects = sessionId
      ? await storage.getGuestBotProjectsBySession(sessionId)
      : await storage.getAllBotProjects();

    if (projects.length === 0) {
      const defaultProject: InsertBotProject = {
        name: "Мой первый бот",
        description: "Базовый бот с приветствием",
        userDatabaseEnabled: 1,
        sessionId: sessionId ?? null,
        data: { nodes: [DEFAULT_START_NODE, DEFAULT_MESSAGE_NODE] },
      };
      await storage.createBotProject(defaultProject);
      console.log("✅ Создан проект по умолчанию", sessionId ? `для сессии ${sessionId}` : "(глобальный)");
    }
  } catch (error) {
    console.error("❌ Ошибка создания проекта по умолчанию:", error);
  }
}
