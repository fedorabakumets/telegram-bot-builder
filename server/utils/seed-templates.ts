/**
 * @fileoverview Загрузка, валидация и инициализация системных шаблонов ботов из JSON-файлов.
 *
 * При старте сервера сравнивает хэш каждого файла с сохранённым в БД.
 * Если файл изменился или шаблон отсутствует — автоматически обновляет его.
 */

import { createHash } from "node:crypto";
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
  { fileName: "bot-manager.json", label: "Менеджер ботов" },
] as const;

/**
 * Вычисляет MD5-хэш строки
 * @param content - Содержимое файла
 * @returns Хэш в hex-формате
 */
function computeHash(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

/**
 * Загружает один шаблон из JSON-файла и валидирует его через runtime-схему.
 * @param fileName - Имя JSON-файла шаблона
 * @returns Валидный шаблон и его хэш
 */
function loadTemplateFromFile(fileName: string): { template: InsertBotTemplate; hash: string } {
  const filePath = join(TEMPLATE_DIR, fileName);
  const raw = readFileSync(filePath, "utf8");
  const hash = computeHash(raw);
  const template = insertBotTemplateSchema.parse(JSON.parse(raw));
  return { template, hash };
}

/**
 * Инициализирует системные шаблоны ботов в базе данных.
 *
 * При `force=false` сравнивает хэш каждого файла с сохранённым в description.
 * Если файл изменился или шаблон отсутствует — обновляет автоматически.
 * При `force=true` пересоздаёт все шаблоны без проверки хэшей.
 *
 * @param force - Флаг принудительного пересоздания всех шаблонов
 */
async function seedDefaultTemplates(force = false): Promise<void> {
  try {
    console.log(`📋 Запуск инициализации системных шаблонов, force=${force}`);

    const existingTemplates = await storage.getAllBotTemplates();
    const systemTemplates = existingTemplates.filter(
      (t: BotTemplate) => t.authorName === "Система"
    );

    console.log(`📊 Найдено системных шаблонов: ${systemTemplates.length}`);

    if (force) {
      console.log("🔄 Принудительное обновление — удаляем все системные шаблоны");
      for (const t of systemTemplates) {
        await storage.deleteBotTemplate(t.id);
      }
      console.log(`🗑️ Удалено: ${systemTemplates.length}`);
    }

    /** Индекс существующих шаблонов по имени файла (хранится в version) */
    const existingByFileName = new Map<string, BotTemplate>(
      systemTemplates.map((t) => [t.version ?? "", t])
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const { fileName, label } of SYSTEM_TEMPLATE_FILES) {
      const { template, hash } = loadTemplateFromFile(fileName);

      /** Используем version для хранения имени файла, previewImage — для хэша */
      const templateWithMeta: InsertBotTemplate = {
        ...template,
        version: fileName,
        previewImage: hash,
      };

      const existing = existingByFileName.get(fileName);

      if (!existing || force) {
        console.log(`➕ Создаём шаблон: ${label}`);
        await storage.createBotTemplate(templateWithMeta);
        created++;
        continue;
      }

      /** Сравниваем хэш — если изменился, обновляем */
      if (existing.previewImage !== hash) {
        console.log(`🔄 Обновляем изменённый шаблон: ${label} (хэш изменился)`);
        await storage.deleteBotTemplate(existing.id);
        await storage.createBotTemplate(templateWithMeta);
        updated++;
      } else {
        console.log(`✅ Шаблон актуален: ${label}`);
        skipped++;
      }
    }

    console.log(`✅ Готово — создано: ${created}, обновлено: ${updated}, без изменений: ${skipped}`);
  } catch (error) {
    console.error("❌ Ошибка при инициализации системных шаблонов:", error);
    throw error;
  }
}

export { seedDefaultTemplates };
