/**
 * @fileoverview Модуль для импорта проектов из файлов в директории bots/
 * Реализует функциональность синхронизации между файловой системой и базой данных
 */

import { type BotProject } from "@shared/schema";
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
    // console.log(`Проверяем подкаталог: ${subdir}`);

    // Проверяем, является ли это каталогом с бота (имя в формате bot_{ID_проекта}_{ID_токена})
    const botDirPattern = /^bot_(\d+)_(\d+)$/;
    const match = subdir.match(botDirPattern);

    if (match) {
      // console.log(`Найдено совпадение для папки: ${subdir}, ID проекта: ${match[1]}, ID токена: ${match[2]}`);
      const projectId = parseInt(match[1]); // ID проекта

      try {
        // Пытаемся найти файл project.json в подкаталоге
        const projectJsonPath = path.join(botsDir, subdir, 'project.json');
        console.log(`Проверяем наличие файла: ${projectJsonPath}`);

        if (fs.existsSync(projectJsonPath)) {
          console.log(`Файл найден, читаем содержимое...`);
          const content = fs.readFileSync(projectJsonPath, 'utf-8');
          const jsonData = JSON.parse(content);

          // Проверяем, что это действительный проект бота
          if (jsonData.nodes && jsonData.connections) {
            console.log(`Данные проекта валидны, обрабатываем проект ID: ${projectId}`);
            
            // Пытаемся получить существующий проект по ID
            let existingProject = await storage.getBotProject(projectId);
            console.log(`Существующий проект найден: ${!!existingProject}`);

            // Определяем имя проекта из данных, если оно есть
            const projectName = jsonData.settings?.name || jsonData.name || `project_${projectId}`;
            console.log(`Имя проекта: ${projectName}`);

            if (existingProject) {
              // Обновляем существующий проект, даже если он уже существует
              const updatedProject = await storage.updateBotProject(projectId, {
                data: jsonData,
                name: projectName, // Обновляем имя проекта
                userDatabaseEnabled: existingProject.userDatabaseEnabled ?? 0 // Сохраняем текущее значение или устанавливаем 0 по умолчанию
              });

              if (updatedProject) {
                importedProjects.push(updatedProject);
                console.log(`Проект с ID ${projectId} обновлен из файла`);
              }
            } else {
              // Если проект с таким ID не существует, создаем новый
              // Используем имя в формате project_{ID} для связи с файлом
              const newProject = await storage.createBotProject({
                name: projectName, // Используем имя из данных или сгенерированное
                data: jsonData,
                userDatabaseEnabled: 0, // Значение по умолчанию
                ownerId: null // Проекты, импортируемые из файлов, не имеют владельца
              });

              importedProjects.push(newProject);
              console.log(`Создан новый проект с именем ${projectName} из файла`);
            }
          } else {
            console.log(`Данные проекта не валидны (нет nodes или connections) для папки ${subdir}`);
          }
        } else {
          console.log(`Файл project.json не найден в папке ${subdir}`);
        }
      } catch (error) {
        console.error(`Ошибка при импорте проекта из подкаталога ${subdir}:`, error);
      }
    } else {
      // console.log(`Папка ${subdir} не соответствует формату bot_{ID_проекта}_{ID_токена}`);
    }
  }

  return importedProjects;
}