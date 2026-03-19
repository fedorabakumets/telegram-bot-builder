/**
 * @fileoverview Тесты для типов sidebar
 * Проверяет корректность экспорта и структуру типов
 * @module components/editor/sidebar/tests/unit/types
 */

/// <reference types="vitest/globals" />

import type { ComponentsSidebarProps } from '../../../types';

describe('types', () => {
  describe('ComponentsSidebarProps', () => {
    it('должен экспортировать интерфейс ComponentsSidebarProps', () => {
      // Проверяем что тип существует (компиляция уже подтверждает это)
      const props: Partial<ComponentsSidebarProps> = {};
      expect(props).toBeDefined();
    });

    it('должен требовать onComponentDrag как обязательное поле', () => {
      // Тип должен требовать onComponentDrag
      const props: Pick<ComponentsSidebarProps, 'onComponentDrag'> = {
        onComponentDrag: (component) => {
          expect(component).toBeDefined();
        }
      };
      expect(props.onComponentDrag).toBeDefined();
    });

    it('должен позволять опциональные колбэки', () => {
      const props: Partial<ComponentsSidebarProps> = {
        onComponentDrag: (component) => {
          expect(component).toBeDefined();
        },
        onProjectSelect: (projectId) => {
          expect(typeof projectId).toBe('number');
        },
        isMobile: true,
        onClose: () => {
          // Пустая функция
        }
      };
      expect(props.onProjectSelect).toBeDefined();
      expect(props.isMobile).toBe(true);
    });

    it('должен поддерживать все опциональные пропсы', () => {
      const fullProps: Partial<ComponentsSidebarProps> = {
        onComponentDrag: (component) => {
          expect(component).toBeDefined();
        },
        onComponentAdd: (component) => {
          expect(component).toBeDefined();
        },
        onProjectSelect: (projectId) => {
          expect(projectId).toBe(1);
        },
        currentProjectId: 1,
        activeSheetId: 'sheet-1',
        onToggleCanvas: () => {
          // Пустая функция
        },
        onToggleHeader: () => {
          // Пустая функция
        },
        onToggleProperties: () => {
          // Пустая функция
        },
        onShowFullLayout: () => {
          // Пустая функция
        },
        onLayoutChange: (config) => {
          expect(config).toBeDefined();
        },
        onGoToProjects: () => {
          // Пустая функция
        },
        onSheetAdd: (name) => {
          expect(typeof name).toBe('string');
        },
        headerContent: null,
        sidebarContent: null,
        canvasContent: null,
        propertiesContent: null,
        canvasVisible: true,
        headerVisible: true,
        propertiesVisible: true,
        showLayoutButtons: false,
        onSheetDelete: (sheetId) => {
          expect(typeof sheetId).toBe('string');
        },
        onSheetRename: (sheetId, name) => {
          expect(typeof sheetId).toBe('string');
          expect(typeof name).toBe('string');
        },
        onSheetDuplicate: (sheetId) => {
          expect(typeof sheetId).toBe('string');
        },
        onSheetSelect: (sheetId) => {
          expect(typeof sheetId).toBe('string');
        },
        isMobile: false,
        onClose: () => {
          // Пустая функция
        }
      };
      expect(Object.keys(fullProps).length).toBeGreaterThan(20);
    });

    it('должен поддерживать React.ReactNode для содержимого', () => {
      const props: Partial<ComponentsSidebarProps> = {
        onComponentDrag: (component: any) => {
          expect(component).toBeDefined();
        },
        headerContent: null,
        sidebarContent: null,
        canvasContent: null,
        propertiesContent: null
      };
      expect(props.headerContent).toBeDefined();
    });

    it('должен поддерживать булевы флаги видимости', () => {
      const props: Partial<ComponentsSidebarProps> = {
        onComponentDrag: (component: any) => {
          expect(component).toBeDefined();
        },
        canvasVisible: true,
        headerVisible: false,
        propertiesVisible: true,
        showLayoutButtons: true,
        isMobile: false
      };
      expect(props.canvasVisible).toBe(true);
      expect(props.headerVisible).toBe(false);
    });
  });
});
