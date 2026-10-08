/**
 * @fileoverview Открытие опубликованной документации во фрейме админки без чтения Markdown.
 * @module server/admin/pages/guide-docs-page
 */
import type { Request, Response } from "express";
import { findRuntimeGuide } from "../runtime-guides";

/**
 * Перенаправляет фрейм на соответствующую статью сайта документации.
 * @param req - Запрос с ключом документа
 * @param res - Ответ Express
 * @returns void
 */
export function serveRuntimeGuideEmbed(req: Request, res: Response): void {
  const guide = findRuntimeGuide(req.params.slug ?? "");
  if (!guide) {
    res.status(404).type("html").send("<p>Документ не найден</p>");
    return;
  }
  const article = guide.file.replace(/\.md$/, "");
  res.redirect(302, "https://fedorabakumets.github.io/telegram-bot-builder/docs/" + article);
}
