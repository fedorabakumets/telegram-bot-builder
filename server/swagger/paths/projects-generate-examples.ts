/**
 * @fileoverview Примеры JSON для POST /api/projects/{id}/generate.
 * @module server/swagger/paths/projects-generate-examples
 */

/** Тело запроса Code panel */
export const GENERATE_BODY_EXAMPLE = {
  userDatabaseEnabled: true,
  enableLogging: false,
};

/** Успешная генерация */
export const GENERATE_OK_EXAMPLE = {
  code: "import asyncio\nfrom aiogram import Bot, Dispatcher\n# ...\n",
  lines: 2157,
  generatedAt: 1723392000000,
};

/** 404 — проект не найден */
export const GENERATE_NOT_FOUND_EXAMPLE = {
  error: "Project not found",
  message: "Project 42 not found",
};

/** 500 — сбой генератора */
export const GENERATE_FAILED_EXAMPLE = {
  error: "Generation failed",
  message: "Unknown error",
};
