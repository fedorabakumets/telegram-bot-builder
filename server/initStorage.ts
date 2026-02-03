import { EnhancedDatabaseStorage } from "./EnhancedDatabaseStorage";

// Локальная переменная для хранения экземпляра хранилища
let localInstance: EnhancedDatabaseStorage | null = null;

/**
 * Функция инициализации хранилища данных для приложения
 *
 * @description
 * Эта функция реализует паттерн одиночки (singleton) для инициализации
 * экземпляра EnhancedDatabaseStorage. Она проверяет, существует ли уже
 * локальный экземпляр хранилища (localInstance), и если нет -
 * создает новый экземпляр EnhancedDatabaseStorage. Это гарантирует,
 * что в приложении существует только один экземпляр хранилища данных,
 * что обеспечивает согласованность данных и предотвращает дублирование
 * соединений с базой данных.
 *
 * Функция используется для централизованного управления экземпляром
 * хранилища данных в приложении. EnhancedDatabaseStorage предоставляет
 * расширенный набор методов для работы с различными сущностями:
 * проектами ботов, экземплярами ботов, шаблонами, токенами и т.д.
 *
 * @returns {EnhancedDatabaseStorage} Экземпляр EnhancedDatabaseStorage,
 *          который был создан или уже существовал ранее
 *
 * @example
 * // Пример использования функции
 * const storage = initStorage();
 * const projects = await storage.getAllBotProjects();
 *
 * @since 1.0.0
 * @see EnhancedDatabaseStorage
 */
export function initStorage(): EnhancedDatabaseStorage {
  if (!localInstance) {
    localInstance = new EnhancedDatabaseStorage();
  }
  return localInstance;
}
