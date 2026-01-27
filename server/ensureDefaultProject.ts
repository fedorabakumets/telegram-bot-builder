import { InsertBotProject } from "@shared/schema";
import { storage } from "./storage";

// Function to ensure at least one default project exists
export async function ensureDefaultProject() {
  try {
    const projects = await storage.getAllBotProjects();
    if (projects.length === 0) {
      // Create a default project if none exists
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
          ],
          connections: []
        }
      };
      await storage.createBotProject(defaultProject);
      console.log("✅ Создан проект по умолчанию");
    }
  } catch (error) {
    console.error("❌ Ошибка создания проекта по умолчанию:", error);
  }
}
