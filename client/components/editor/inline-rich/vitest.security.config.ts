/** @fileoverview Изолированный запуск регрессий безопасности редактора без общих моков приложения. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    include: ['client/components/editor/inline-rich/html-converter.security.test.tsx',
      'client/components/editor/inline-rich/utils/paste-rich-html.test.ts'],
  },
});
