/** @fileoverview Проверка сохранения перехода из панели API-триггера. */
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Node } from '@shared/schema';
import { ApiTriggerConfiguration } from './ApiTriggerConfiguration';

vi.mock('@/hooks/use-app-config', () => ({ useAppConfig: () => ({ data: {} }) }));
vi.mock('./TriggerTargetSelector', () => ({
  TriggerTargetSelector: ({ autoTransitionTo, onNodeUpdate, selectedNode }: any) =>
    <button onClick={() => onNodeUpdate(selectedNode.id, { autoTransitionTo: 'next' })}>{autoTransitionTo}</button>,
}));

it('показывает сохранённый переход и передаёт изменение данных узла', () => {
  const update = vi.fn();
  const node = { id: 'api', data: { autoTransitionTo: 'old' } } as Node;
  render(<ApiTriggerConfiguration selectedNode={node} projectId={1} onUpdateNode={update} />);
  fireEvent.click(screen.getByRole('button', { name: 'old' }));
  expect(update).toHaveBeenCalledWith('api', { autoTransitionTo: 'next' });
});
