/**
 * @fileoverview Утилиты для терминала
 *
 * Содержит функции для работы с выводом терминала:
 * - Копирование в буфер обмена (текст, JSON, CSV)
 * - Сохранение в файл (текст, JSON, CSV)
 *
 * @module terminalUtils
 */

/** Тип строки для экспорта */
interface ExportLine {
  /** Текстовое содержимое */
  content: string;
  /** Тип потока */
  type?: 'stdout' | 'stderr';
  /** Время */
  timestamp?: Date;
}

/**
 * Формирует текстовый вывод
 * @param lines - Массив строк
 * @returns Текст
 */
function toPlainText(lines: ExportLine[]): string {
  return lines.map(line => {
    const ts = line.timestamp
      ? `[${line.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] `
      : '';
    return `${ts}${line.content}`;
  }).join('\n');
}

/**
 * Формирует JSON вывод
 * @param lines - Массив строк
 * @returns JSON-строка
 */
function toJSON(lines: ExportLine[]): string {
  return JSON.stringify(lines.map(line => ({
    timestamp: line.timestamp?.toISOString() ?? null,
    type: line.type ?? 'stdout',
    content: line.content,
  })), null, 2);
}

/**
 * Формирует CSV вывод
 * @param lines - Массив строк
 * @returns CSV-строка
 */
function toCSV(lines: ExportLine[]): string {
  const header = 'timestamp,type,content';
  const rows = lines.map(line => {
    const ts = line.timestamp?.toISOString() ?? '';
    const type = line.type ?? 'stdout';
    const content = `"${line.content.replace(/"/g, '""')}"`;
    return `${ts},${type},${content}`;
  });
  return [header, ...rows].join('\n');
}

/** Формат экспорта */
export type ExportFormat = 'text' | 'json' | 'csv';

/**
 * Копирование вывода терминала в буфер обмена
 * @param lines - Массив строк вывода
 * @param format - Формат экспорта
 */
export function copyTerminalOutput(lines: ExportLine[], format: ExportFormat = 'text'): void {
  let output: string;
  switch (format) {
    case 'json': output = toJSON(lines); break;
    case 'csv': output = toCSV(lines); break;
    default: output = toPlainText(lines); break;
  }
  navigator.clipboard.writeText(output);
}

/**
 * Сохранение вывода терминала в файл
 * @param lines - Массив строк вывода
 * @param format - Формат экспорта
 */
export function saveTerminalOutput(lines: ExportLine[], format: ExportFormat = 'text'): void {
  let output: string;
  let mimeType: string;
  let ext: string;

  switch (format) {
    case 'json':
      output = toJSON(lines);
      mimeType = 'application/json';
      ext = 'json';
      break;
    case 'csv':
      output = toCSV(lines);
      mimeType = 'text/csv';
      ext = 'csv';
      break;
    default:
      output = toPlainText(lines);
      mimeType = 'text/plain';
      ext = 'txt';
      break;
  }

  const blob = new Blob([output], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terminal-output-${new Date().toISOString().slice(0, 19)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
