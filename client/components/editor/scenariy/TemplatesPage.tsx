/** @fileoverview Страница каталога шаблонов с подвижным питомцем. */
import { StartPet } from '../no-projects/StartPet';
import ScenariyPage from './ScenariyPage';

/**
 * Показывает питомца поверх каталога во всех состояниях загрузки.
 * @returns Каталог шаблонов и интерактивный питомец.
 */
export default function TemplatesPage() {
  return (
    <>
      <ScenariyPage />
      <StartPet tab="templates" />
    </>
  );
}
