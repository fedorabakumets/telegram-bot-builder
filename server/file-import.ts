/**
 * @fileoverview Модуль для импорта проектов из файлов в директории bots/
 * Реализует функциональность синхронизации между файловой системой и базой данных
 */

import { type BotProject, type InsertBotProject, botProjects } from "@shared/schema";
import { eq } from "drizzle-orm";
import { DatabaseStorage } from "./DatabaseStorage";

/**
 * Импортирует проекты из файлов в директории bots/
 * @param storage - Экземпляр хранилища для сохранения данных
 * @returns Массив импортированных проектов
 */
export async function importProjectsFromFiles(storage: DatabaseStorage): Promise<BotProject[]> {
  // Импортируем fs и path для работы с файловой системой
  const fs = await import('fs');
  const path = await import('path');
  
  const botsDir = path.join(process.cwd(), 'bots');
  
  // Проверяем, существует ли директория
  if (!fs.existsSync(botsDir)) {
    console.log('Директория bots не найдена');
    return [];
  }
  
  // Читаем все файлы в директории
  const files = fs.readdirSync(botsDir);
  
  const importedProjects: BotProject[] = [];
  
  for (const file of files) {
    // Обрабатываем только JSON-файлы
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(botsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(content);
        
        // Проверяем, что это действительный проект бота
        if (jsonData.nodes && jsonData.connections) {
          // Генерируем уникальное имя проекта на основе имени файла
          const projectName = file.replace('.json', '');
          
          // Проверяем, существует ли уже проект с таким именем
          let existingProject = await getBotProjectByName(storage, projectName);
          
          if (existingProject) {
            // Обновляем существующий проект
            existingProject = await storage.updateBotProject(existingProject.id, {
              data: jsonData,
              name: projectName,
              updatedAt: new Date()
            });
            
            if (existingProject) {
              importedProjects.push(existingProject);
            }
          } else {
            // Создаем новый проект
            const newProject = await storage.createBotProject({
              name: projectName,
              data: jsonData,
              createdAt: new Date(),
              updatedAt: new Date(),
              ownerId: null // или можно использовать владельца по умолчанию
            });
            
            importedProjects.push(newProject);
          }
        }
      } catch (error) {
        console.error(`Ошибка при импорте файла ${file}:`, error);
      }
    }
  }
  
  return importedProjects;
}

/**
 * Вспомогательная функция для получения проекта по имени
 * @param storage - Экземпляр хранилища
 * @param name - Имя проекта
 * @returns Найденный проект или undefined
 */
async function getBotProjectByName(storage: DatabaseStorage, name: string): Promise<BotProject | undefined> {
  // Получаем все проекты и фильтруем по имени
  const allProjects = await storage.getAllBotProjects();
  return allProjects.find(project => project.name === name);
}