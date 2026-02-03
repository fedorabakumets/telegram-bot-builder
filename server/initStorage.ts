import { EnhancedDatabaseStorage } from "./EnhancedDatabaseStorage";
import { storageInstance } from "./storage";

/**
 * Функция инициализации хранилища
 * Создает экземпляр EnhancedDatabaseStorage при необходимости
 * @returns Экземпляр EnhancedDatabaseStorage
 */
function initStorage(): EnhancedDatabaseStorage {
  if (!storageInstance) {
    storageInstance = new EnhancedDatabaseStorage();
  }
  return storageInstance;
}
