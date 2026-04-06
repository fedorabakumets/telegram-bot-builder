/**
 * @fileoverview Загрузка, валидация и инициализация системных шаблонов ботов из JSON-файлов.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { type BotTemplate, type InsertBotTemplate, insertBotTemplateSchema } from "@shared/schema";
import { storage } from "../storages/storage";

/**
 * Описание файла системного шаблона.
 */
type TemplateFile = {
  /** Имя JSON-файла с шаблоном */
  fileName: string;
  /** Человекочитаемое имя шаблона для логов */
  label: string;
};

/** Абсолютный путь к директории с JSON-файлами шаблонов */
const TEMPLATE_DIR = fileURLToPath(new URL("../templates/", import.meta.url));

/** Список системных шаблонов, которые нужно инициализировать */
const SYSTEM_TEMPLATE_FILES: readonly TemplateFile[] = [
  { fileName: "vprogulke-admin-panel.json", label: "ВПрогулке + Админ панель" },
  { fileName: "kotik-simple-anketa.json", label: "Котик - Простая анкета" },
] as const;

/**
 * Загружает один шаблон из JSON-файла и валидирует его через runtime-схему.
 *
 * @param {string} fileName Имя JSON-файла шаблона
 * @returns {InsertBotTemplate} Валидный шаблон для записи в базу данных
 */
function loadTemplateFromFile(fileName: string): InsertBotTemplate {
  const filePath = join(TEMPLATE_DIR, fileName);
  const raw = readFileSync(filePath, "utf8");
  return insertBotTemplateSchema.parse(JSON.parse(raw));
}

/**
 * Загружает и валидирует все системные шаблоны.
 *
 * @returns {Array<TemplateFile & { template: InsertBotTemplate }>} Список файлов вместе с валидированными шаблонами
 */
function loadSystemTemplates(): Array<TemplateFile & { template: InsertBotTemplate }> {
  return SYSTEM_TEMPLATE_FILES.map((entry) => ({
    ...entry,
    template: loadTemplateFromFile(entry.fileName),
  }));
}

/**
 * Инициализирует системные шаблоны ботов в базе данных.
 *
 * @param {boolean} [force=false] Флаг принудительного пересоздания системных шаблонов
 * @returns {Promise<void>} Промис, завершающийся после окончания инициализации
 *
 * @description
 * При `force=true` удаляет существующие системные шаблоны и создаёт их заново.
 * При `force=false` завершает работу без изменений, если в базе уже есть хотя бы один системный шаблон.
 */
async function seedDefaultTemplates(force = false) {
  try {
    console.log(`📋 Запуск инициализации системных шаблонов, force=${force}`);

    const existingTemplates = await storage.getAllBotTemplates();
    const systemTemplates = existingTemplates.filter((template: BotTemplate) => template.authorName === "Система");

    console.log(`📊 Найдено системных шаблонов: ${systemTemplates.length}`);

    if (!force && systemTemplates.length >= 1) {
      console.log("ℹ️ Системные шаблоны уже существуют, инициализация пропущена");
      return;
    }

    const templatesToSeed = loadSystemTemplates();

    if (force) {
      console.log("🔄 Включено принудительное обновление, удаляем текущие системные шаблоны");
      for (const template of systemTemplates) {
        await storage.deleteBotTemplate(template.id);
      }
      console.log(`🗑️ Удалено старых системных шаблонов: ${systemTemplates.length}`);
    }

    for (const { label, template } of templatesToSeed) {
      console.log(`➕ Создаём системный шаблон: ${label}`);
      await storage.createBotTemplate(template);
    }

    console.log("✅ Системные шаблоны успешно инициализированы");
  } catch (error) {
    console.error("❌ Ошибка при инициализации системных шаблонов:", error);
    throw error;
  }
}

export { seedDefaultTemplates };
