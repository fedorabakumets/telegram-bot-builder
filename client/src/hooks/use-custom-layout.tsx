import { useState, useCallback, useEffect } from 'react';
import { CustomLayoutConfig, LayoutElement } from '@/components/layout/custom-layout-editor';

const STORAGE_KEY = 'custom-layout-config';

export const useCustomLayout = (initialConfig?: CustomLayoutConfig) => {
  const [config, setConfig] = useState<CustomLayoutConfig>(() => {
    // Пытаемся загрузить конфигурацию из localStorage
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          return {
            ...parsed,
            lastModified: new Date(parsed.lastModified)
          };
        } catch (error) {
          console.warn('Failed to parse saved layout config:', error);
        }
      }
    }
    
    return initialConfig || {
      elements: [
        {
          id: 'header',
          type: 'header',
          name: 'Шапка',
          position: 'top',
          size: 8,
          visible: true,
          order: 1,
          content: null
        },
        {
          id: 'sidebar',
          type: 'sidebar',
          name: 'Боковая панель',
          position: 'left',
          size: 20,
          visible: true,
          order: 2,
          content: null
        },
        {
          id: 'canvas',
          type: 'canvas',
          name: 'Холст',
          position: 'center',
          size: 55,
          visible: true,
          order: 3,
          content: null
        },
        {
          id: 'properties',
          type: 'properties',
          name: 'Свойства',
          position: 'right',
          size: 25,
          visible: true,
          order: 4,
          content: null
        }
      ],
      gridSize: 10,
      snapToGrid: true,
      showGrid: false,
      compactMode: false,
      lastModified: new Date()
    };
  });

  // Автоматическое сохранение в localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }, [config]);

  const updateConfig = useCallback((newConfig: Partial<CustomLayoutConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
      lastModified: new Date()
    }));
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<LayoutElement>) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId
          ? { ...element, ...updates }
          : element
      ),
      lastModified: new Date()
    }));
  }, []);

  const moveElement = useCallback((elementId: string, newPosition: LayoutElement['position']) => {
    updateElement(elementId, { position: newPosition });
  }, [updateElement]);

  const resizeElement = useCallback((elementId: string, newSize: number) => {
    updateElement(elementId, { size: newSize });
  }, [updateElement]);

  const toggleElementVisibility = useCallback((elementId: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId
          ? { ...element, visible: !element.visible }
          : element
      ),
      lastModified: new Date()
    }));
  }, []);

  const setElementVisibility = useCallback((elementId: string, visible: boolean) => {
    updateElement(elementId, { visible });
  }, [updateElement]);

  const reorderElements = useCallback((elementIds: string[]) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        const newOrder = elementIds.indexOf(element.id);
        return newOrder !== -1 ? { ...element, order: newOrder + 1 } : element;
      }),
      lastModified: new Date()
    }));
  }, []);

  const resetConfig = useCallback(() => {
    const defaultConfig: CustomLayoutConfig = {
      elements: [
        {
          id: 'header',
          type: 'header',
          name: 'Шапка',
          position: 'top',
          size: 8,
          visible: true,
          order: 1,
          content: null
        },
        {
          id: 'sidebar',
          type: 'sidebar',
          name: 'Боковая панель',
          position: 'left',
          size: 20,
          visible: true,
          order: 2,
          content: null
        },
        {
          id: 'canvas',
          type: 'canvas',
          name: 'Холст',
          position: 'center',
          size: 55,
          visible: true,
          order: 3,
          content: null
        },
        {
          id: 'properties',
          type: 'properties',
          name: 'Свойства',
          position: 'right',
          size: 25,
          visible: true,
          order: 4,
          content: null
        }
      ],
      gridSize: 10,
      snapToGrid: true,
      showGrid: false,
      compactMode: false,
      lastModified: new Date()
    };
    setConfig(defaultConfig);
  }, []);

  const loadPreset = useCallback((presetName: string) => {
    const presets: Record<string, Partial<CustomLayoutConfig>> = {
      'classic': {
        elements: [
          { id: 'header', type: 'header', name: 'Шапка', content: null, position: 'top', size: 8, visible: true, order: 1 },
          { id: 'sidebar', type: 'sidebar', name: 'Боковая панель', content: null, position: 'left', size: 20, visible: true, order: 2 },
          { id: 'canvas', type: 'canvas', name: 'Холст', content: null, position: 'center', size: 55, visible: true, order: 3 },
          { id: 'properties', type: 'properties', name: 'Свойства', content: null, position: 'right', size: 25, visible: true, order: 4 }
        ]
      },
      'bottom-header': {
        elements: [
          { id: 'header', type: 'header', name: 'Шапка', content: null, position: 'bottom', size: 8, visible: true, order: 4 },
          { id: 'sidebar', type: 'sidebar', name: 'Боковая панель', content: null, position: 'left', size: 20, visible: true, order: 1 },
          { id: 'canvas', type: 'canvas', name: 'Холст', content: null, position: 'center', size: 55, visible: true, order: 2 },
          { id: 'properties', type: 'properties', name: 'Свойства', content: null, position: 'right', size: 25, visible: true, order: 3 }
        ]
      },
      'minimal': {
        elements: [
          { id: 'header', type: 'header', name: 'Шапка', content: null, position: 'top', size: 6, visible: true, order: 1 },
          { id: 'sidebar', type: 'sidebar', name: 'Боковая панель', content: null, position: 'left', size: 15, visible: true, order: 2 },
          { id: 'canvas', type: 'canvas', name: 'Холст', content: null, position: 'center', size: 70, visible: true, order: 3 },
          { id: 'properties', type: 'properties', name: 'Свойства', content: null, position: 'right', size: 15, visible: true, order: 4 }
        ]
      },
      'fullscreen': {
        elements: [
          { id: 'header', type: 'header', name: 'Шапка', content: null, position: 'top', size: 5, visible: true, order: 1 },
          { id: 'sidebar', type: 'sidebar', name: 'Боковая панель', content: null, position: 'left', size: 0, visible: false, order: 2 },
          { id: 'canvas', type: 'canvas', name: 'Холст', content: null, position: 'center', size: 95, visible: true, order: 3 },
          { id: 'properties', type: 'properties', name: 'Свойства', content: null, position: 'right', size: 0, visible: false, order: 4 }
        ]
      }
    };

    const preset = presets[presetName];
    if (preset) {
      setConfig(prev => ({
        ...prev,
        ...preset,
        elements: prev.elements.map(element => {
          const presetElement = preset.elements?.find(p => p.id === element.id);
          return presetElement ? { ...element, ...presetElement } : element;
        }),
        lastModified: new Date()
      }));
    }
  }, []);

  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback((configString: string) => {
    try {
      const imported = JSON.parse(configString);
      setConfig({
        ...imported,
        lastModified: new Date()
      });
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }, []);

  const getVisibleElements = useCallback(() => {
    return config.elements.filter(element => element.visible);
  }, [config.elements]);

  const getElementByType = useCallback((type: LayoutElement['type']) => {
    return config.elements.find(element => element.type === type);
  }, [config.elements]);

  const getElementsByPosition = useCallback((position: LayoutElement['position']) => {
    return config.elements.filter(element => element.position === position && element.visible);
  }, [config.elements]);

  return {
    config,
    updateConfig,
    updateElement,
    moveElement,
    resizeElement,
    toggleElementVisibility,
    setElementVisibility,
    reorderElements,
    resetConfig,
    loadPreset,
    exportConfig,
    importConfig,
    getVisibleElements,
    getElementByType,
    getElementsByPosition,
    
    // Утилиты
    isElementVisible: (elementId: string) => {
      const element = config.elements.find(e => e.id === elementId);
      return element?.visible ?? false;
    },
    
    getElementPosition: (elementId: string) => {
      const element = config.elements.find(e => e.id === elementId);
      return element?.position ?? 'center';
    },
    
    getElementSize: (elementId: string) => {
      const element = config.elements.find(e => e.id === elementId);
      return element?.size ?? 50;
    }
  };
};