/**
 * @fileoverview Описание ноды сохранения ответа в переменную.
 * Отдельная фронтенд-обвязка для узла input.
 */
import { ComponentDefinition } from "@shared/schema";

/** Нода сохранения ответа пользователя в переменную */
export const saveAnswerNode: ComponentDefinition = {
  id: 'save-answer-node',
  name: 'Запомнить ответ',
  description: 'Бот сохранит ответ в переменную, например имя для приветствия.',
  icon: 'fas fa-edit',
  color: 'bg-cyan-100 text-cyan-600',
  type: 'input',
  defaultData: {
    inputType: 'any',
    inputVariable: '',
    inputTargetNodeId: '',
    appendVariable: false,
    saveToDatabase: false,
    inputPrompt: 'Введите ответ',
    inputRequired: true,
  }
};
