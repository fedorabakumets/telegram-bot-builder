import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

/**
 * Максимальное количество одновременно отображаемых уведомлений
 */
const TOAST_LIMIT = 1

/**
 * Задержка перед удалением уведомления (в миллисекундах)
 */
const TOAST_REMOVE_DELAY = 1000000

/**
 * Тип данных для уведомления
 * @typedef {Object} ToasterToast
 * @property {string} id - Уникальный идентификатор уведомления
 * @property {React.ReactNode} [title] - Заголовок уведомления
 * @property {React.ReactNode} [description] - Описание уведомления
 * @property {ToastActionElement} [action] - Действие уведомления
 * @property {any} [otherProps] - Другие свойства из ToastProps
 */
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

/**
 * Константы типов действий для редьюсера уведомлений
 * @enum {string}
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

/**
 * Генерирует уникальный идентификатор для уведомления
 * @returns {string} Уникальный идентификатор
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

/**
 * Типы действий для редьюсера уведомлений
 * @typedef {Object} Action
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * Интерфейс состояния уведомлений
 * @interface State
 * @property {ToasterToast[]} toasts - Массив активных уведомлений
 */
interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Добавляет уведомление в очередь на удаление по истечении времени
 * @param {string} toastId - Идентификатор уведомления
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Редьюсер для управления состоянием уведомлений
 * @param {State} state - Текущее состояние
 * @param {Action} action - Действие для обновления состояния
 * @returns {State} Новое состояние
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

/**
 * Функция диспетчеризации действий
 * @param {Action} action - Действие для обновления состояния
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Тип для уведомления без идентификатора
 * @typedef {Omit<ToasterToast, "id">} Toast
 */
type Toast = Omit<ToasterToast, "id">

/**
 * Функция для создания уведомления
 * @param {Toast} props - Свойства уведомления
 * @returns {Object} Объект с методами управления уведомлением
 * @returns {string} Object.id - Идентификатор созданного уведомления
 * @returns {Function} Object.dismiss - Функция для скрытия уведомления
 * @returns {Function} Object.update - Функция для обновления уведомления
 */
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Хук для управления уведомлениями
 * @returns {Object} Объект с состоянием уведомлений и методами управления
 * @returns {ToasterToast[]} Object.toasts - Массив активных уведомлений
 * @returns {Function} Object.toast - Функция для создания уведомлений
 * @returns {Function} Object.dismiss - Функция для скрытия уведомлений
 *
 * @example
 * ```typescript
 * const { toast, toasts, dismiss } = useToast();
 *
 * // Создание уведомления
 * toast({
 *   title: "Успех!",
 *   description: "Операция выполнена успешно"
 * });
 *
 * // Скрытие конкретного уведомления
 * dismiss("some-id");
 * ```
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
