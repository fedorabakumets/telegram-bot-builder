/**
 * @fileoverview Модуль для настройки маршрутов управления шаблонами пользователя
 *
 * Этот модуль предоставляет функцию для настройки маршрутов, позволяющие пользователям
 * управлять своими шаблонами ботов.
 *
 * @module setupUserTemplateRoutes
 */

import type { Express } from "express";
import { getTemplatesHandler } from "./userTemplates/handlers/getTemplatesHandler";
import { createTemplateHandler } from "./userTemplates/handlers/createTemplateHandler";
import { updateTemplateHandler } from "./userTemplates/handlers/updateTemplateHandler";
import { deleteTemplateHandler } from "./userTemplates/handlers/deleteTemplateHandler";

/**
 * Настраивает маршруты управления шаблонами пользователя
 *
 * @function setupUserTemplateRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupUserTemplateRoutes(app: Express): void {
    app.get("/api/user/templates", getTemplatesHandler);
    app.post("/api/user/templates", createTemplateHandler);
    app.patch("/api/user/templates/:id", updateTemplateHandler);
    app.delete("/api/user/templates/:id", deleteTemplateHandler);
}
