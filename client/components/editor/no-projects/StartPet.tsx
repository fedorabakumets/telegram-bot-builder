/** @fileoverview Подвижный питомец Mini с панелью действий. */
import { MiniControls } from './MiniControls';
import { useMiniVisibility, useMiniTabVisibility, type MiniTab } from './use-mini-visibility';
import { useStartPetDrag } from './use-start-pet-drag';
import './start-pet-art.css';
import './start-pet-motion.css';

/**
 * Показывает питомца с панелью действий, если его включили в настройках.
 * @returns Плавающая кнопка с рисунком робота.
 */
export function StartPet({ tab }: { /** Текущая вкладка приложения. */ tab: MiniTab }) {
  const [enabled, setEnabled] = useMiniVisibility();
  const [visible, setVisible] = useMiniTabVisibility(tab);
  const { position, dragging, handlers } = useStartPetDrag();
  if (!enabled || !visible) return null;
  return (
    <MiniControls onHide={() => setVisible(false)} onHideEverywhere={() => setEnabled(false)}>
      <button type="button" {...handlers} data-dragging={dragging}
        aria-label="Питомец Mini. Действия"
        title="Действия Mini. Перетащите питомца или переместите стрелками"
        className="start-pet fixed z-10 grid size-16 touch-none select-none place-items-center rounded-xl bg-transparent p-0 cursor-grab data-[dragging=true]:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
        style={{ left: position.x, top: position.y }}>
        <span aria-hidden="true" className="start-pet-art">
          <span className="start-pet-face" />
          <span className="start-pet-feet" />
        </span>
      </button>
    </MiniControls>
  );
}
