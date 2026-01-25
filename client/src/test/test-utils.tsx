import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider } from '../components/theme-provider';

/**
 * Options for rendering components in tests
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Theme to use for testing (default: 'light') */
  theme?: 'light' | 'dark';
  /** Initial theme for ThemeProvider */
  initialTheme?: 'light' | 'dark' | 'system';
}

/**
 * Test wrapper component that provides necessary context providers
 */
const TestWrapper: React.FC<{
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  initialTheme?: 'light' | 'dark' | 'system';
}> = ({ children, theme = 'light', initialTheme = 'light' }) => {
  return (
    <ThemeProvider defaultTheme={initialTheme} storageKey="test-theme">
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="bg-background text-foreground">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
};

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @param ui - Component to render
 * @param options - Render options including theme settings
 * @returns Render result with additional utilities
 */
const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { theme = 'light', initialTheme = 'light', ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper theme={theme} initialTheme={initialTheme}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Utility function to create a mock function with TypeScript support
 */
const createMockFn = <T extends (...args: any[]) => any>() => {
  return vi.fn() as any;
};

/**
 * Utility to wait for next tick (useful for async operations)
 */
const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Utility to create mock props for components
 */
const createMockProps = <T extends Record<string, any>>(overrides: Partial<T> = {}): T => {
  return {
    ...overrides,
  } as T;
};

/**
 * Mock user object for testing
 */
const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  role: 'user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Mock bot data for testing
 */
const mockBot = {
  id: 'test-bot-1',
  name: 'Test Bot',
  description: 'A test bot for testing purposes',
  token: 'test-token',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userId: 'test-user-1',
};

/**
 * Mock template data for testing
 */
const mockTemplate = {
  id: 'test-template-1',
  name: 'Test Template',
  description: 'A test template',
  category: 'general',
  data: {},
  isPublic: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userId: 'test-user-1',
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom utilities
export {
  customRender as render,
  customRender as renderWithProviders, // Add alias for backward compatibility
  TestWrapper,
  createMockFn,
  waitForNextTick,
  createMockProps,
  mockUser,
  mockBot,
  mockTemplate,
};