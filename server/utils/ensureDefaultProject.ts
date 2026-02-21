import { InsertBotProject } from "@shared/schema";
import { storage } from "../storages/storage";

/**
 * Гарантирует существование хотя бы одного проекта по умолчанию в системе.
 *
 * @returns Promise<void> - Асинхронная операция без возвращаемого значения
 *
 * @description
 * Эта асинхронная функция проверяет наличие проектов в системе. Если ни одного проекта нет,
 * она создает проект по умолчанию с базовой конфигурацией Telegram-бота, включающей:
 * - Название "Мой первый бот"
 * - Описание "Базовый бот с приветствием"
 * - Включенную базу данных пользователей
 * - Стартовый узел с приветственным сообщением
 *
 * Функция используется при инициализации системы для обеспечения наличия начального проекта,
 * с которым пользователь может начать работу.
 *
 * @example
 * ```typescript
 * await ensureDefaultProject();
 * // Если в системе не было проектов, будет создан проект по умолчанию
 * ```
 *
 * @throws {Error} Выбрасывает ошибку в случае проблем с хранилищем данных
 */
export async function ensureDefaultProject() {
  try {
    const projects = await storage.getAllBotProjects();
    if (projects.length === 0) {
      // Создать проект по умолчанию, если ни одного не существует
      const defaultProject: InsertBotProject = {
        name: "Мой первый бот",
        description: "Базовый бот с приветствием",
        userDatabaseEnabled: 1,
        data: {
          nodes: [
            {
              id: "start",
              type: "start",
              position: { x: 100, y: 100 },
              data: {
                messageText: "Привет! Я ваш новый бот. Нажмите /help для получения помощи.",
                keyboardType: "none",
                buttons: [],
                resizeKeyboard: true,
                oneTimeKeyboard: false
              }
            }
          ]
        }
      };
      await storage.createBotProject(defaultProject);
      console.log("✅ Создан проект по умолчанию");
    }
  } catch (error) {
    console.error("❌ Ошибка создания проекта по умолчанию:", error);
  }
}
