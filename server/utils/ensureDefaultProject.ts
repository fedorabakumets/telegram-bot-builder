/**
 * @fileoverview Утилита создания проекта по умолчанию
 * @module server/utils/ensureDefaultProject
 */

import { storage } from "../storages/storage";
import type { StorageBotProjectInput } from "../storages/storageTypes";

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
 * Гарантирует существование хотя бы одного проекта в системе.
 *
 * Концепция гостевых проектов удалена (deny-by-default), поэтому проверка
 * выполняется глобально по всем проектам. Параметр `sessionId` сохранён для
 * обратной совместимости сигнатуры и больше не влияет на выборку.
 *
 * @param sessionId - Не используется (оставлен для совместимости)
 * @returns Промис без возвращаемого значения
 */
export async function ensureDefaultProject(_sessionId?: string): Promise<void> {
  try {
    const projects = await storage.getAllBotProjects();

    if (projects.length === 0) {
      const defaultProject: StorageBotProjectInput = {
        name: "Мой первый бот",
        description: "Базовый бот с приветствием",
        userDatabaseEnabled: 1,
        sessionId: null,
        data: { nodes: [DEFAULT_START_NODE, DEFAULT_MESSAGE_NODE] },
      };
      await storage.createBotProject(defaultProject);
      console.log("✅ Создан проект по умолчанию (глобальный)");
    }
  } catch (error) {
    console.error("❌ Ошибка создания проекта по умолчанию:", error);
  }
}
