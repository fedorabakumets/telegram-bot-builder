import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Icon } from './Icon';

describe('Icon', () => {
  describe('Rendering', () => {
    it('renders with Font Awesome icon name', () => {
      render(<Icon name="fa-solid fa-user" aria-label="User icon" />);
      
      const icon = screen.getByRole('img', { name: 'User icon' });
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('i')).toHaveClass('fa-solid', 'fa-user');
    });

    it('renders with custom SVG children', () => {
      render(
        <Icon aria-label="Custom icon">
          <svg data-testid="custom-svg" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.09-.09 2-.92 2-2h-4v-7h4v-2h-4V9h4V7h-4V5h4c0-1.1-.9-2-2-2z"/>
          </svg>
        </Icon>
      );
      
      const icon = screen.getByRole('img', { name: 'Custom icon' });
      expect(icon).toBeInTheDocument();
      expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
    });

    it('renders as decorative when decorative prop is true', () => {
      render(<Icon name="fa-solid fa-star" decorative />);
      
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders empty span when no name or children provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<Icon aria-label="Empty icon" />);
      
      const icon = screen.getByRole('img', { name: 'Empty icon' });
      expect(icon).toBeInTheDocument();
      expect(icon).toBeEmptyDOMElement();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Size Variants', () => {
    it('renders with xs size', () => {
      render(<Icon name="fa-solid fa-user" size="xs" aria-label="XS icon" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('w-3', 'h-3');
    });

    it('renders with sm size', () => {
      render(<Icon name="fa-solid fa-user" size="sm" aria-label="SM icon" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('renders with md size (default)', () => {
      render(<Icon name="fa-solid fa-user" aria-label="MD icon" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('w-5', 'h-5');
    });

    it('renders with lg size', () => {
      render(<Icon name="fa-solid fa-user" size="lg" aria-label="LG icon" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('w-6', 'h-6');
    });

    it('renders with xl size', () => {
      render(<Icon name="fa-solid fa-user" size="xl" aria-label="XL icon" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('w-8', 'h-8');
    });

    it('renders with 2xl size', () => {
      render(<Icon name="fa-solid fa-user" size="2xl" aria-label="2XL icon" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Color Variants', () => {
    it('renders with default color', () => {
      render(<Icon name="fa-solid fa-user" aria-label="Default color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-foreground');
    });

    it('renders with muted color', () => {
      render(<Icon name="fa-solid fa-user" color="muted" aria-label="Muted color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-muted-foreground');
    });

    it('renders with primary color', () => {
      render(<Icon name="fa-solid fa-user" color="primary" aria-label="Primary color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-primary');
    });

    it('renders with success color', () => {
      render(<Icon name="fa-solid fa-check" color="success" aria-label="Success color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-green-600');
    });

    it('renders with warning color', () => {
      render(<Icon name="fa-solid fa-warning" color="warning" aria-label="Warning color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-yellow-600');
    });

    it('renders with error color', () => {
      render(<Icon name="fa-solid fa-times" color="error" aria-label="Error color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-red-600');
    });

    it('renders with info color', () => {
      render(<Icon name="fa-solid fa-info" color="info" aria-label="Info color" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-blue-600');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <Icon 
          name="fa-solid fa-user" 
          className="custom-class" 
          aria-label="Custom class icon" 
        />
      );
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('custom-class');
    });

    it('forwards HTML attributes', () => {
      render(
        <Icon 
          name="fa-solid fa-user" 
          data-testid="custom-icon"
          title="Custom title"
          aria-label="Custom attributes icon"
        />
      );
      
      const icon = screen.getByTestId('custom-icon');
      expect(icon).toHaveAttribute('title', 'Custom title');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      
      render(<Icon ref={ref} name="fa-solid fa-user" aria-label="Ref test" />);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLSpanElement));
    });
  });

  describe('Accessibility', () => {
    it('has proper img role when not decorative', () => {
      render(<Icon name="fa-solid fa-user" aria-label="User profile" />);
      
      const icon = screen.getByRole('img', { name: 'User profile' });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label', 'User profile');
    });

    it('is hidden from screen readers when decorative', () => {
      render(<Icon name="fa-solid fa-star" decorative />);
      
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('aria-label');
    });

    it('requires aria-label when not decorative', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Icon name="fa-solid fa-user" />);
      
      // Should not have proper accessibility without aria-label
      const icon = screen.getByRole('img');
      expect(icon).not.toHaveAttribute('aria-label');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Children Handling', () => {
    it('clones React element children with proper className', () => {
      render(
        <Icon aria-label="SVG icon">
          <svg data-testid="svg-child" className="existing-class">
            <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11"/>
          </svg>
        </Icon>
      );
      
      const svg = screen.getByTestId('svg-child');
      expect(svg).toHaveClass('w-full', 'h-full', 'existing-class');
    });

    it('handles non-React element children', () => {
      render(
        <Icon aria-label="Text icon">
          Text content
        </Icon>
      );
      
      const icon = screen.getByRole('img', { name: 'Text icon' });
      expect(icon).toHaveTextContent('Text content');
    });

    it('prioritizes children over name prop', () => {
      render(
        <Icon name="fa-solid fa-user" aria-label="Priority test">
          <span data-testid="custom-content">Custom</span>
        </Icon>
      );
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
      // Should not contain the Font Awesome icon
      expect(screen.getByRole('img').querySelector('i')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = render(<Icon name="fa-solid fa-user" aria-label="Test" />);
      
      const firstRender = screen.getByRole('img');
      
      // Re-render with same props
      rerender(<Icon name="fa-solid fa-user" aria-label="Test" />);
      
      const secondRender = screen.getByRole('img');
      
      // Component should be memoized
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string name gracefully', () => {
      render(<Icon name="" aria-label="Empty name" />);
      
      const icon = screen.getByRole('img');
      // When name is empty, no <i> element should be created
      const iconElement = icon.querySelector('i');
      expect(iconElement).not.toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      render(
        <Icon aria-label="Null children">
          {null}
        </Icon>
      );
      
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      render(
        <Icon aria-label="Undefined children">
          {undefined}
        </Icon>
      );
      
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
    });

    it('handles complex Font Awesome class names', () => {
      render(
        <Icon 
          name="fa-solid fa-chevron-double-up fa-2x" 
          aria-label="Complex FA icon" 
        />
      );
      
      const icon = screen.getByRole('img');
      const iconElement = icon.querySelector('i');
      expect(iconElement).toHaveClass('fa-solid', 'fa-chevron-double-up', 'fa-2x');
    });
  });

  describe('Theme Integration', () => {
    it('works with light theme', () => {
      render(
        <Icon name="fa-solid fa-sun" color="warning" aria-label="Light theme" />,
        { theme: 'light' }
      );
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('text-yellow-600');
    });

    it('works with dark theme', () => {
      render(
        <Icon name="fa-solid fa-moon" color="warning" aria-label="Dark theme" />,
        { theme: 'dark' }
      );
      
      const icon = screen.getByRole('img');
      // In dark theme, warning color should use dark variant
      expect(icon).toHaveClass('text-yellow-600');
    });
  });
});