/**
 * @fileoverview Модуль для очистки состояний ботов
 *
 * Этот файл предоставляет функции для проверки и исправления несоответствий
 * между реальным состоянием процессов ботов и их записями в базе данных.
 */

import { storage } from "../storages/storage";
import { findActiveProcessForProject } from "../utils/findActiveProcessForProject";

/**
 * Функция для очистки несоответствий состояний ботов при запуске сервера
 *
 * Проверяет все экземпляры ботов в базе данных и исправляет их статус,
 * если бот помечен как запущенный, но соответствующий процесс не найден в памяти.
 *
 * @returns Promise<void>
 */
export async function cleanupBotStates(): Promise<void> {
  try {
    console.log('Проверяем состояние ботов при запуске сервера...');
    const allInstances = await storage.getAllBotInstances();

    for (const instance of allInstances) {
      if (instance.status === 'running') {
        // Если в базе бот помечен как запущенный, но процесса нет в памяти
        const activeProcessInfo = findActiveProcessForProject(instance.projectId);
        if (!activeProcessInfo) {
          console.log(`Найден бот ${instance.projectId} в статусе "running" без активного процесса. Исправляем состояние.`);
          await storage.updateBotInstance(instance.id, { status: 'stopped' });
        }
      }
    }
    console.log('Проверка состояния ботов завершена.');
  } catch (error) {
    console.error('Ошибка при проверке состояния ботов:', error);
  }
}
