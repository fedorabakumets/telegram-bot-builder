/**
 * @fileoverview Принадлежность, фильтры, подтверждение пакета и откат
 * @module lib/bot-tools/bot-tables-scope.test
 */

import { describe, expect, it } from 'vitest';
import { applyTableOps } from '../../server/database/bot-tables/apply-ops.ts';
import { compileRowQuery } from '../../server/database/bot-tables/compile-row-query.ts';
import { contentGuard } from '../../server/database/bot-tables/limits.ts';
import { loadTableInProject } from '../../server/database/bot-tables/load-scope.ts';
import { parseRowQuery } from '../../server/database/bot-tables/parse-row-query.ts';
import { opsNeedConfirm, parseTableOps } from '../../server/database/bot-tables/table-ops.ts';
import { validateCells } from '../../server/database/bot-tables/validate-cells.ts';
import type { Queryable } from '../../server/database/bot-tables/queryable.ts';
import { parseAllTablesExport, parseCsv, tableToCsv } from '../../shared/tables/io/index.ts';

/** Запоминает SQL и отвечает заготовками */
class FakeDb implements Queryable {
  /** Тексты запросов */
  readonly texts: string[] = [];
  /** Сколько раз столбец уже вставляли */
  inserts = 0;

  /**
   * @param text - SQL
   * @returns Заготовка
   */
  async query<T>(text: string): Promise<{ rows: T[]; rowCount: number | null }> {
    this.texts.push(text);
    if (text.includes('SELECT name FROM bot_tables')) return { rows: [{ name: 'Товары' }] as T[], rowCount: 1 };
    if (text.includes('FROM bot_table_columns')) return { rows: [] as T[], rowCount: 0 };
    if (text.startsWith('INSERT INTO bot_table_columns')) {
      this.inserts += 1;
      if (this.inserts > 1) return { rows: [] as T[], rowCount: 0 };
      return { rows: [{ id: 5, table_id: 9, name: 'a', position: 0 }] as T[], rowCount: 1 };
    }
    return { rows: [] as T[], rowCount: 0 };
  }
}

describe('границы таблиц', () => {
  it('ищет таблицу сразу по проекту и идентификатору', async () => {
    const db = new FakeDb();
    await loadTableInProject(db, 7, 9);
    expect(db.texts[0]).toContain('project_id = $2');
    expect(db.texts[0]).toContain('id = $1');
  });

  it('не подставляет текст фильтра в SQL', () => {
    const compiled = compileRowQuery(7, 9, [{ columnId: 3, operator: 'contains', value: "a' OR 1=1" }], { kind: 'id' }, 10, 0);
    expect(compiled.listSql).toContain('project_id = $1');
    expect(compiled.listSql).not.toContain("a'");
    expect(compiled.listValues).toContain("%a' OR 1=1%");
    expect(compiled.listSql).toContain('LIMIT');
  });

  it('отклоняет шестое условие и чужой столбец', () => {
    const filters = Array.from({ length: 6 }, () => ({ column_id: 1, operator: 'equals', value: 'a' }));
    expect(parseRowQuery({ filters }, new Set([1]))).toEqual({ message: 'Не больше 5 условий' });
    expect('message' in parseRowQuery({ filters: [{ column_id: 2, operator: 'equals', value: 'a' }] }, new Set([1]))).toBe(true);
  });

  it('принимает пустую строку и отклоняет чужой столбец', () => {
    expect(validateCells({ '4': '' }, new Set(['4']))).toEqual({ ok: true, data: { '4': '' } });
    expect(validateCells({ '9': 'x' }, new Set(['4'])).ok).toBe(false);
  });

  it('защищает _content и требует подтверждение удаления', () => {
    expect(contentGuard('_content')).toContain('_content');
    expect(contentGuard('Товары')).toBeNull();
    const ops = parseTableOps([{ op: 'delete_row', row_id: 1 }]);
    expect(Array.isArray(ops) && opsNeedConfirm(ops)).toBe(true);
  });

  it('откатывает пакет на второй операции', async () => {
    const db = new FakeDb();
    const result = await applyTableOps(db, 7, 9, [
      { op: 'add_column', name: 'a' },
      { op: 'add_column', name: 'b' },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failed_op_index).toBe(1);
    expect(db.texts.some((text) => text === 'ROLLBACK')).toBe(true);
    expect(db.texts.some((text) => text === 'COMMIT')).toBe(false);
  });

  it('собирает CSV и общий JSON версии 1', () => {
    const csv = tableToCsv([{ id: '1', name: 'имя' }], [{ cells: { '1': 'а,б' } }]);
    expect(parseCsv(csv).rows).toEqual([['а,б']]);
    const file = JSON.stringify({ version: 1, tables: [{ name: 'T', columns: ['a'], rows: [['1']] }] });
    expect(parseAllTablesExport(file).tables[0].name).toBe('T');
  });
});
