/** @fileoverview Подтверждение серверной записи после успешного завершения операции. */
import './common';
import { z } from 'zod';
/** Сохранение проекта подтверждено; доставка live-события и применение ботом сюда не входят. */
export const ProjectPersistenceSchema = z.object({
  /** Запись завершена. */ confirmed: z.literal(true),
  /** Проект изменения. */ projectId: z.number(),
}).openapi('ProjectPersistence');
/** Подтверждение записи таблицы. */
export const TablePersistenceSchema = ProjectPersistenceSchema.extend({
  /** Таблица изменения. */ tableId: z.number(),
}).openapi('TablePersistence');
