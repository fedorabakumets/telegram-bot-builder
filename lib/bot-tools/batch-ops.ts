/**
 * @fileoverview Пакетное применение операций над проектом в одной транзакции
 * @description Чистая функция applyOpsToProject последовательно применяет массив
 * операций к проекту in-memory (chaining: результат каждой операции становится
 * входом следующей) и возвращает итоговый проект с валидацией. Db-обёртка
 * applyOpsInDb выполняет один GET → applyOpsToProject → один PUT (updateProjectInDb
 * с agentEdit:true), то есть на всю пачку приходится один live-broadcast и одна
 * версия в истории. При первой же ошибке операции запись в БД не выполняется.
 * @module lib/bot-tools/batch-ops
 */

import type { BotDataWithSheets } from '@shared/schema';
import {
  addNodeToProject,
  updateNodeInProject,
  removeNodeFromProject,
  connectNodes,
  disconnectNodes,
  duplicateNodeInProject,
  moveNodeToProjectSheet,
  type MutateProjectResult,
} from './project-mutate.ts';
import {
  addSheetToProject,
  duplicateSheetInProject,
  renameSheetInProject,
  removeSheetFromProject,
  setActiveSheetInProject,
} from './sheet-ops.ts';
import {
  updateProjectInDb,
  type UpdateProjectInDbOptions,
  type UpdateProjectInDbResult,
} from './project-db.ts';
import { fetchProjectFromDb } from './project-db-read.ts';
import type { ValidateProjectResult } from './types.ts';

/** Одна операция пакета: поле op задаёт тип, остальные поля — её параметры */
export interface BatchOp {
  /** Тип операции (add_node, update_node, remove_node, connect_nodes, disconnect_nodes, move_node, duplicate_node, add_sheet, rename_sheet, remove_sheet, duplicate_sheet, set_active_sheet) */
  op: string;
  /** Прочие параметры операции */
  [key: string]: unknown;
}

/** Ошибка пакетного применения операций */
export interface ApplyOpsError {
  /** Текст ошибки */
  error: string;
  /** Индекс операции, на которой произошла ошибка (если применимо) */
  failedIndex?: number;
  /** Тип операции, на которой произошла ошибка (если применимо) */
  failedOp?: string;
  /** Результат валидации (если ошибка валидации) */
  validation?: ValidateProjectResult;
}

/**
 * Применяет массив операций к проекту последовательно (in-memory chaining).
 * Каждая операция получает результат предыдущей; при первой ошибке выполнение
 * прерывается и возвращается ApplyOpsError с индексом и типом операции.
 * Сам project_json не парсится здесь — мутации парсят вход самостоятельно.
 * @param projectJson - Текущий project.json (объект или JSON-строка)
 * @param ops - Массив операций (поле op задаёт тип каждой)
 * @returns Итоговый проект с валидацией или ошибка
 */
export function applyOpsToProject(
  projectJson: unknown,
  ops: BatchOp[],
): MutateProjectResult | ApplyOpsError {
  if (!Array.isArray(ops) || ops.length === 0) {
    return { error: 'Пустой массив операций' };
  }

  let current: unknown = projectJson;
  let lastValidation: ValidateProjectResult | undefined;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    let result: MutateProjectResult | { error: string };

    switch (op.op) {
      case 'add_node':
        result = addNodeToProject(current, op.node as never, op.sheet_id as string | undefined);
        break;
      case 'update_node':
        result = updateNodeInProject(
          current,
          op.node_id as string,
          op.patch as never,
          op.sheet_id as string | undefined,
        );
        break;
      case 'remove_node':
        result = removeNodeFromProject(current, op.node_id as string, op.sheet_id as string | undefined);
        break;
      case 'connect_nodes':
        result = connectNodes(current, op.from_id as string, op.to_id as string, {
          branch: op.branch as string | undefined,
          portType: op.port_type as never,
          sheetId: op.sheet_id as string | undefined,
        });
        break;
      case 'disconnect_nodes':
        result = disconnectNodes(current, op.from_id as string, op.to_id as string, {
          branch: op.branch as string | undefined,
          portType: op.port_type as never,
          sheetId: op.sheet_id as string | undefined,
        });
        break;
      case 'move_node':
        result = moveNodeToProjectSheet(current, op.node_id as string, op.to_sheet_id as string, {
          fromSheetId: op.from_sheet_id as string | undefined,
          position: op.position as { x: number; y: number } | undefined,
        });
        break;
      case 'duplicate_node':
        result = duplicateNodeInProject(current, op.node_id as string, {
          position: op.position as { x: number; y: number } | undefined,
          sheetId: op.sheet_id as string | undefined,
        });
        break;
      case 'add_sheet':
        result = addSheetToProject(current, op.name as string | undefined, op.id as string | undefined);
        break;
      case 'rename_sheet':
        result = renameSheetInProject(current, op.sheet_id as string, op.name as string);
        break;
      case 'remove_sheet':
        result = removeSheetFromProject(current, op.sheet_id as string);
        break;
      case 'duplicate_sheet':
        result = duplicateSheetInProject(current, op.sheet_id as string);
        break;
      case 'set_active_sheet':
        result = setActiveSheetInProject(current, op.sheet_id as string);
        break;
      default:
        return { error: 'Неизвестная операция', failedIndex: i, failedOp: String(op.op) };
    }

    if ('error' in result) {
      return { error: result.error, failedIndex: i, failedOp: op.op };
    }

    current = result.project;
    lastValidation = result.validation;
  }

  return { project: current as BotDataWithSheets, validation: lastValidation! };
}

/**
 * Применяет пакет операций к проекту в живой БД за одну транзакцию: один GET
 * актуального проекта → applyOpsToProject (chaining in-memory) → один PUT через
 * updateProjectInDb (agentEdit:true). На всю пачку приходится один live-broadcast
 * и одна версия в истории. При ошибке чтения или любой операции запись не делается.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param ops - Массив операций (поле op задаёт тип каждой)
 * @param options - Опции записи в БД (URL API, заметка к версии, данные агента)
 * @returns Результат записи в БД или ошибка пакетного применения
 */
export async function applyOpsInDb(
  projectId: number,
  ops: BatchOp[],
  options?: UpdateProjectInDbOptions,
): Promise<UpdateProjectInDbResult | ApplyOpsError> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return { error: fetched.error };

  const result = applyOpsToProject(fetched.data, ops);
  if ('error' in result) return result;

  return updateProjectInDb(projectId, result.project, options);
}
