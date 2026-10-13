/**
 * @fileoverview Публичный разбор и сборка CSV/JSON таблиц
 * @module shared/tables/io
 */

export type { AllTablesExport, ExportedTable, IoColumn, IoRow } from "./types";
export { parseCsv, tableToCsv } from "./csv";
export { parseJsonTable, tableToJson, tableToJsonl } from "./json-table";
export { buildAllTablesExport, parseAllTablesExport } from "./all-tables";
