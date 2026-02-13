/**
 * @fileoverview Модуль для импорта проектов из файлов в директории bots/
 * Реализует функциональность синхронизации между файловой системой и базой данных
 */

import { type BotProject, type InsertBotProject } from "@shared/schema";
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

  // Читаем все подкаталоги в директории
  const subdirs = fs.readdirSync(botsDir);

  const importedProjects: BotProject[] = [];

  for (const subdir of subdirs) {
    // Проверяем, является ли это каталогом с ботом (имя в формате bot_{ID_проекта}_{ID_токена})
    const botDirPattern = /^bot_(\d+)_(\d+)$/;
    const match = subdir.match(botDirPattern);

    if (match) {
      const projectId = parseInt(match[1]); // ID проекта

      try {
        // Пытаемся найти файл project.json в подкаталоге
        const projectJsonPath = path.join(botsDir, subdir, 'project.json');

        if (fs.existsSync(projectJsonPath)) {
          const content = fs.readFileSync(projectJsonPath, 'utf-8');
          const jsonData = JSON.parse(content);

          // Проверяем, что это действительный проект бота
          if (jsonData.nodes && jsonData.connections) {
            // Пытаемся получить существующий проект по ID
            let existingProject = await storage.getBotProject(projectId);

            if (existingProject) {
              // Обновляем существующий проект
              const updatedProject = await storage.updateBotProject(projectId, {
                data: jsonData,
                updatedAt: new Date()
              });

              if (updatedProject) {
                importedProjects.push(updatedProject);
                console.log(`Проект с ID ${projectId} обновлен из файла`);
              }
            } else {
              // Если проект с таким ID не существует, создаем новый
              // Используем имя в формате project_{ID} для связи с файлом
              const newProject = await storage.createBotProject({
                name: `project_${projectId}`, // Используем имя, соответствующее ID
                data: jsonData,
                createdAt: new Date(),
                updatedAt: new Date(),
                ownerId: null // Проекты, импортируемые из файлов, не имеют владельца
              });

              importedProjects.push(newProject);
              console.log(`Создан новый проект с именем project_${projectId} из файла`);
            }
          }
        }
      } catch (error) {
        console.error(`Ошибка при импорте проекта из подкаталога ${subdir}:`, error);
      }
    }
  }

  return importedProjects;
}