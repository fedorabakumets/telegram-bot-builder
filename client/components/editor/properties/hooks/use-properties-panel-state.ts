/**
 * @fileoverview Хук состояния для панели свойств
 *
 * Управляет состоянием открытия/закрытия секций и отображаемым ID узла.
 */

import { useState, useEffect } from 'react';
import type { Node } from '@shared/schema';

/** Интерфейс возвращаемого значения хука */
export interface UsePropertiesPanelStateReturn {
  /** Состояние открытия основных настроек */
  isBasicSettingsOpen: boolean;
  /** Функция установки состояния основных настроек */
  setIsBasicSettingsOpen: (open: boolean) => void;
  /** Состояние открытия текста сообщения */
  isMessageTextOpen: boolean;
  /** Функция установки состояния текста сообщения */
  setIsMessageTextOpen: (open: boolean) => void;
  /** Состояние открытия медиа секции */
  isMediaSectionOpen: boolean;
  /** Функция установки состояния медиа секции */
  setIsMediaSectionOpen: (open: boolean) => void;
  /** Состояние открытия автопереходов */
  isAutoTransitionOpen: boolean;
  /** Функция установки состояния автопереходов */
  setIsAutoTransitionOpen: (open: boolean) => void;
  /** Состояние открытия секции клавиатуры */
  isKeyboardSectionOpen: boolean;
  /** Функция установки состояния секции клавиатуры */
  setIsKeyboardSectionOpen: (open: boolean) => void;
  /** Состояние открытия секции условных сообщений */
  isConditionalMessagesSectionOpen: boolean;
  /** Функция установки состояния секции условных сообщений */
  setIsConditionalMessagesSectionOpen: (open: boolean) => void;
  /** Состояние открытия секции пользовательского ввода */
  isUserInputSectionOpen: boolean;
  /** Функция установки состояния секции пользовательского ввода */
  setIsUserInputSectionOpen: (open: boolean) => void;
  /** Отображаемый ID узла */
  displayNodeId: string;
  /** Функция установки отображаемого ID узла */
  setDisplayNodeId: (id: string) => void;
}

/**
 * Хук состояния для панели свойств
 *
 * @param {Node | null} selectedNode - Выбранный узел
 * @returns {UsePropertiesPanelStateReturn} Объект с состояниями и функциями
 */
export function usePropertiesPanelState(
  selectedNode: Node | null
): UsePropertiesPanelStateReturn {
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState(true);
  const [isMessageTextOpen, setIsMessageTextOpen] = useState(true);
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(true);
  const [isAutoTransitionOpen, setIsAutoTransitionOpen] = useState(true);
  const [isKeyboardSectionOpen, setIsKeyboardSectionOpen] = useState(true);
  const [isConditionalMessagesSectionOpen, setIsConditionalMessagesSectionOpen] = useState(true);
  const [isUserInputSectionOpen, setIsUserInputSectionOpen] = useState(true);
  const [displayNodeId, setDisplayNodeId] = useState(selectedNode?.id || '');

  useEffect(() => {
    if (selectedNode?.id) {
      setDisplayNodeId(selectedNode.id);
    }
  }, [selectedNode?.id]);

  return {
    isBasicSettingsOpen,
    setIsBasicSettingsOpen,
    isMessageTextOpen,
    setIsMessageTextOpen,
    isMediaSectionOpen,
    setIsMediaSectionOpen,
    isAutoTransitionOpen,
    setIsAutoTransitionOpen,
    isKeyboardSectionOpen,
    setIsKeyboardSectionOpen,
    isConditionalMessagesSectionOpen,
    setIsConditionalMessagesSectionOpen,
    isUserInputSectionOpen,
    setIsUserInputSectionOpen,
    displayNodeId,
    setDisplayNodeId
  };
}
