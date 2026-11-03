/** @fileoverview Общие проверяемые контракты узлов и пакетных изменений сценария для MCP. */
import { z } from 'zod';
import { nodeSchema } from './schema/tables/node-schema';

/** Полный узел сохраняет общие поля и расширения совместимых проектов. */
export const scenarioNodeSchema = nodeSchema.extend({ data: nodeSchema.shape.data.passthrough() }).passthrough();
/** Частичное изменение не подставляет значения отсутствующих полей данных. */
export const scenarioNodePatchSchema = z.object({
  /** Новый тип узла. */
  type: nodeSchema.shape.type.optional(),
  /** Новая позиция на холсте. */
  position: nodeSchema.shape.position.optional(),
  /** Изменяемые настройки узла; расширения сохраняются для совместимости. */
  data: nodeSchema.shape.data.partial().passthrough().optional(),
}).strict();
/** Идентификатор существующего объекта сценария. */
const id = z.string().min(1);
/** Необязательный лист: отсутствие означает поиск или активный лист согласно операции. */
const sheet = { sheet_id: id.optional() };
/** Параметры ребра совпадают с поддерживаемыми портами холста. */
const edge = { from_id: id, to_id: id, ...sheet, branch: z.string().optional(),
  port_type: z.enum(['auto-transition', 'trigger-next', 'button-goto', 'input-target']).optional() };
/** Одна из двенадцати операций; чужие поля отклоняются, а не исчезают молча. */
export const scenarioOperationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add_node'), node: scenarioNodeSchema, ...sheet }).strict(),
  z.object({ op: z.literal('update_node'), node_id: id, patch: scenarioNodePatchSchema, ...sheet }).strict(),
  z.object({ op: z.literal('remove_node'), node_id: id, ...sheet }).strict(),
  z.object({ op: z.literal('connect_nodes'), ...edge }).strict(),
  z.object({ op: z.literal('disconnect_nodes'), ...edge }).strict(),
  z.object({ op: z.literal('move_node'), node_id: id, to_sheet_id: id,
    from_sheet_id: id.optional(), position: nodeSchema.shape.position.optional() }).strict(),
  z.object({ op: z.literal('duplicate_node'), node_id: id, ...sheet,
    position: nodeSchema.shape.position.optional() }).strict(),
  z.object({ op: z.literal('add_sheet'), name: z.string().optional(), id: id.optional() }).strict(),
  z.object({ op: z.literal('rename_sheet'), sheet_id: id, name: z.string() }).strict(),
  z.object({ op: z.literal('remove_sheet'), sheet_id: id }).strict(),
  z.object({ op: z.literal('duplicate_sheet'), sheet_id: id }).strict(),
  z.object({ op: z.literal('set_active_sheet'), sheet_id: id }).strict(),
]);
/** Пустой пакет не является изменением; максимальный размер ограничен транспортом MCP. */
export const scenarioOperationsSchema = z.array(scenarioOperationSchema).min(1);
