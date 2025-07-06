import { useState, useCallback, useRef } from 'react';

export interface HistoryState<T> {
  current: T;
  canUndo: boolean;
  canRedo: boolean;
}

export interface UseHistoryOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): [
  HistoryState<T>,
  (newState: T, description?: string) => void,
  () => void,
  () => void,
  () => void
] {
  const { maxHistorySize = 50, debounceMs = 500 } = options;
  
  const [history, setHistory] = useState<{ state: T; description?: string; timestamp: number }[]>([
    { state: initialState, description: 'Начальное состояние', timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const current = history[currentIndex]?.state || initialState;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback((newState: T, description?: string) => {
    // Очищаем предыдущий debounce таймер
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const doUpdate = () => {
      setHistory(prevHistory => {
        // Удаляем все состояния после текущего индекса (для случая redo)
        const newHistory = prevHistory.slice(0, currentIndex + 1);
        
        // Добавляем новое состояние
        newHistory.push({ 
          state: newState, 
          description: description || 'Изменение', 
          timestamp: Date.now() 
        });
        
        // Ограничиваем размер истории
        if (newHistory.length > maxHistorySize) {
          const trimmed = newHistory.slice(-maxHistorySize);
          // Корректируем currentIndex при обрезке
          setCurrentIndex(trimmed.length - 1);
          return trimmed;
        }
        
        // Обновляем currentIndex на последний элемент
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
    };

    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(doUpdate, debounceMs);
    } else {
      doUpdate();
    }
  }, [currentIndex, maxHistorySize, debounceMs]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback(() => {
    setHistory([{ state: initialState, description: 'Начальное состояние', timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, [initialState]);

  return [
    { current, canUndo, canRedo },
    pushState,
    undo,
    redo,
    reset
  ];
}