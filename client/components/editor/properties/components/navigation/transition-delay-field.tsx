/** @fileoverview Добавление блока задержки между командой или сообщением и его следующим блоком. */
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getNodeDefaults } from '../../utils/node-defaults';

interface DelayProps {
  /** Начало перехода. */
  source: Node;
  /** Назначение перехода. */
  target: Node;
  /** Добавляет блок на текущий лист. */
  add: (node: Node) => void;
  /** Обновляет связь на холсте. */
  update: (id: string, data: Partial<Node['data']>) => void;
}

/**
 * Вставляет паузу перед выбранным блоком, сохраняя назначение перехода.
 * @param props - Блоки перехода и обработчики редактора.
 * @returns Настройка длительности паузы.
 */
export function TransitionDelayField({ source, target, add, update }: DelayProps) {
  const [seconds, setSeconds] = useState('3');
  const fieldId = `delay-seconds-${source.id}`;
  return (
    <details className="py-1 text-sm">
      <summary className="cursor-pointer">Добавить задержку</summary>
      <div className="mt-2 space-y-2">
        <Label htmlFor={fieldId}>Пауза перед переходом, сек.</Label>
        <Input id={fieldId} type="number" min="0" step="any" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
        <Button type="button" size="sm" variant="outline" disabled={!(Number(seconds) > 0 && Number.isFinite(Number(seconds)))} onClick={() => {
          const id = `delay-${nanoid(8)}`;
          add({
            id, type: 'delay',
            position: { x: source.position.x, y: source.position.y + 180 },
            data: { ...getNodeDefaults('delay'), seconds, enableAutoTransition: true, autoTransitionTo: target.id },
          });
          update(source.id, source.type === 'command_trigger' ? { autoTransitionTo: id } : { autoTransitionTo: id, enableAutoTransition: true });
        }}>Добавить паузу</Button>
      </div>
    </details>
  );
}