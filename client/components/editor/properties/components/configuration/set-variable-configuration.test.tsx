/** @fileoverview Проверка записи частичного присваивания без изменения соседних полей. */
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Node } from '@shared/schema';
import { SetVariableConfiguration } from './set-variable-configuration';

it('добавляет новое присваивание без принудительного заполнения остальных настроек', () => {
  const update = vi.fn();
  const node = { id: 'set', data: { assignments: [] } } as unknown as Node;
  render(<SetVariableConfiguration selectedNode={node} onNodeUpdate={update} getAllNodesFromAllSheets={[]} formatNodeDisplay={() => ''} textVariables={[]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Добавить переменную' }));
  expect(update).toHaveBeenCalledWith('set', { assignments: [{ id: expect.stringMatching(/^assign_/), variable: '', value: '', mode: 'text' }] });
});
