/**
 * @fileoverview Таблица процессов воркеров — хранит информацию о Python worker процессах
 * @module shared/schema/tables/worker-processes
 */

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * Таблица процессов воркеров — мониторинг Python worker pool
 */
export const workerProcesses = pgTable("worker_processes", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта */
  projectId: integer("project_id").notNull(),
  /** PID процесса воркера */
  pid: integer("pid"),
  /** Статус воркера: running, stopped, error */
  status: text("status").notNull().default("running"),
  /** Количество активных ботов в воркере */
  botsCount: integer("bots_count").notNull().default(0),
  /** Потребление памяти в МБ */
  memoryMb: integer("memory_mb"),
  /** Время запуска воркера */
  startedAt: timestamp("started_at").defaultNow(),
  /** Время остановки воркера */
  stoppedAt: timestamp("stopped_at"),
});

/** Схема для вставки записи воркера */
export const insertWorkerProcessSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** PID процесса */
  pid: z.number().int().nullable().optional(),
  /** Статус воркера */
  status: z.enum(["running", "stopped", "error"]).default("running"),
  /** Количество ботов */
  botsCount: z.number().int().default(0),
  /** Потребление памяти в МБ */
  memoryMb: z.number().int().nullable().optional(),
});

/** Тип записи процесса воркера */
export type WorkerProcess = typeof workerProcesses.$inferSelect;

/** Тип для вставки записи процесса воркера */
export type InsertWorkerProcess = z.infer<typeof insertWorkerProcessSchema>;
