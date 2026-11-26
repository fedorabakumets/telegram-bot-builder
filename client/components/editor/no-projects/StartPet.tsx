/** @fileoverview Перетаскиваемый робот для демо на экране выбора проекта. */
import { useStartPetDrag } from './use-start-pet-drag';
import './start-pet-art.css';
import './start-pet-motion.css';

/**
 * Показывает питомца, которого можно переместить указателем или стрелками.
 * @returns Плавающая кнопка с рисунком робота.
 */
export function StartPet() {
  const { position, dragging, handlers } = useStartPetDrag();
  return (
    <button type="button" {...handlers} data-dragging={dragging}
      aria-label="Питомец. Перетащите или переместите стрелками"
      title="Перетащите питомца или используйте стрелки"
      className="start-pet fixed z-10 grid size-16 touch-none select-none place-items-center rounded-xl bg-transparent p-0 cursor-grab data-[dragging=true]:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
      style={{ left: position.x, top: position.y }}>
      <span aria-hidden="true" className="start-pet-art">
        <span className="start-pet-face" />
        <span className="start-pet-feet" />
      </span>
    </button>
  );
}
