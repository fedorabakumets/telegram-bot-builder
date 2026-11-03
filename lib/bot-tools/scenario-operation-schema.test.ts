/** @fileoverview Проверки схем пакета сценария: ошибки до записи и сохранение частичного патча. */
import { describe, expect, it } from 'vitest';
import { scenarioOperationsSchema, scenarioNodePatchSchema, scenarioNodeSchema } from '../../shared/scenario-operation-schema';
import { applyOpsToProject } from './batch-ops';

describe('Контракт пакетных изменений сценария', () => {
  it('отклоняет неизвестные операции, опечатки полей и неполные параметры', () => {
    for (const input of [[], [{ op: 'typo' }], [{ op: 'remove_node' }],
      [{ op: 'connect_nodes', from_id: 'a', to_id: 'b', port_type: 'typo' }],
      [{ op: 'rename_sheet', sheet_id: 's', name: 'Новое', typo: true }]]) {
      expect(scenarioOperationsSchema.safeParse(input).success).toBe(false);
    }
  });
  it('патч не добавляет отсутствующие настройки и сохраняет расширения данных', () => {
    const patch = { data: { messageText: 'После', customExtension: { enabled: true } } };
    expect(scenarioNodePatchSchema.parse(patch)).toEqual(patch);
    expect(scenarioNodePatchSchema.safeParse({ id: 'replace-id' }).success).toBe(false);
    expect(scenarioNodeSchema.parse({ id: 'n', type: 'message', position: { x: 0, y: 0 },
      data: { messageText: 'Текст', buttons: [], customExtension: { enabled: true } } }).data)
      .toMatchObject({ customExtension: { enabled: true } });
  });
  it('проверенный пакет выполняется существующим обработчиком без другого формата', () => {
    const project = { sheets: [{ id: 's', name: 'Лист', nodes: [
      { id: 'n', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'До', buttons: [] } },
    ] }], activeSheetId: 's' };
    const ops = scenarioOperationsSchema.parse([
      { op: 'update_node', node_id: 'n', patch: { data: { messageText: 'После' } } },
      { op: 'rename_sheet', sheet_id: 's', name: 'Обновлённый' },
    ]);
    const result = applyOpsToProject(project, ops);
    expect(result).not.toHaveProperty('error');
    expect(result).toMatchObject({ project: { sheets: [{ name: 'Обновлённый', nodes: [{ data: { messageText: 'После' } }] }] } });
    expect(project.sheets[0].nodes[0].data.messageText).toBe('До');
  });
});
