import { useState, useCallback, useRef, useEffect } from 'react';

interface ModalState {
  isOpen: boolean;
  data?: any;
}

interface UseModalOptions {
  defaultOpen?: boolean;
  onOpen?: (data?: any) => void;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

/**
 * Hook for managing modal state and behavior
 * Provides standardized modal controls with keyboard and click handling
 */
export function useModal(options: UseModalOptions = {}) {
  const {
    defaultOpen = false,
    onOpen,
    onClose,
    closeOnEscape = true,
    closeOnOutsideClick = true,
  } = options;

  const [state, setState] = useState<ModalState>({
    isOpen: defaultOpen,
    data: undefined,
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Open modal with optional data
  const open = useCallback((data?: any) => {
    setState({ isOpen: true, data });
    onOpen?.(data);
  }, [onOpen]);

  // Close modal
  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined });
    onClose?.();
  }, [onClose]);

  // Toggle modal state
  const toggle = useCallback((data?: any) => {
    if (state.isOpen) {
      close();
    } else {
      open(data);
    }
  }, [state.isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !state.isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, state.isOpen, close]);

  // Handle outside click
  useEffect(() => {
    if (!closeOnOutsideClick || !state.isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [closeOnOutsideClick, state.isOpen, close]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [state.isOpen]);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
    modalRef,
  };
}

/**
 * Hook for managing multiple modals with unique identifiers
 */
export function useModals() {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  const openModal = useCallback((id: string, data?: any) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: true, data },
    }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: false, data: undefined },
    }));
  }, []);

  const toggleModal = useCallback((id: string, data?: any) => {
    setModals(prev => {
      const current = prev[id];
      if (current?.isOpen) {
        return {
          ...prev,
          [id]: { isOpen: false, data: undefined },
        };
      } else {
        return {
          ...prev,
          [id]: { isOpen: true, data },
        };
      }
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({});
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals[id]?.isOpen || false;
  }, [modals]);

  const getModalData = useCallback((id: string) => {
    return modals[id]?.data;
  }, [modals]);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    isModalOpen,
    getModalData,
  };
}

/**
 * Hook for confirmation modals
 */
export function useConfirmModal() {
  const [state, setState] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
  });

  const confirm = useCallback((options: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    variant?: 'default' | 'destructive';
  }) => {
    setState({
      isOpen: true,
      title: options.title || 'Подтверждение',
      message: options.message || 'Вы уверены?',
      confirmText: options.confirmText || 'Подтвердить',
      cancelText: options.cancelText || 'Отмена',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      variant: options.variant || 'default',
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm?.();
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.onConfirm]);

  const handleCancel = useCallback(() => {
    state.onCancel?.();
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.onCancel]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    confirm,
    handleConfirm,
    handleCancel,
    close,
  };
}