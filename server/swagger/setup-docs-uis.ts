/**
 * @fileoverview Подключение альтернативных OpenAPI UI (Swagger, Scalar, Redoc, RapiDoc)
 * @module server/swagger/setup-docs-uis
 */

import { apiReference } from "@scalar/express-api-reference";
import type { Express } from "express";
import { redocExpressMiddleware } from "redoc-express-maintained";
import swaggerUi from "swagger-ui-express";
import { serveDocsHub } from "./docs-hub";
import { serveRapidocPage } from "./rapidoc-page";

/** Пути документации API — вне /api, без session auth */
export const DOCS_PATHS = [
  "/docs",
  "/docs-json",
  "/docs/swagger",
  "/docs/scalar",
  "/docs/redoc",
  "/docs/rapidoc",
] as const;

/** @deprecated Используйте DOCS_PATHS */
export const SWAGGER_PATHS = DOCS_PATHS;

/** OpenAPI document для монтирования UI */
type OpenApiDocument = Record<string, unknown>;

/**
 * Подключить hub и все UI документации к Express.
 * @param app - Экземпляр Express
 * @param document - Сгенерированный OpenAPI spec
 * @returns void
 */
export function setupDocsUis(app: Express, document: OpenApiDocument): void {
  app.get("/docs", serveDocsHub);
  app.get("/docs-json", (_req, res) => {
    res.json(document);
  });

  app.use(
    "/docs/swagger",
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: "Telegram Bot Builder API — Swagger",
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        url: "/docs-json",
      },
    }),
  );

  app.use(
    "/docs/scalar",
    apiReference({
      url: "/docs-json",
      pageTitle: "Telegram Bot Builder API — Scalar",
      title: "Telegram Bot Builder API",
      theme: "purple",
      layout: "modern",
      hideDownloadButton: false,
      persistAuth: true,
    }),
  );

  app.get(
    "/docs/redoc",
    redocExpressMiddleware({
      title: "Telegram Bot Builder API — Redoc",
      specUrl: "/docs-json",
      redocOptions: {
        scrollYOffset: 0,
        hideDownloadButton: false,
        theme: { colors: { primary: { main: "#58a6ff" } } },
      },
    }),
  );

  app.get("/docs/rapidoc", serveRapidocPage);
}
