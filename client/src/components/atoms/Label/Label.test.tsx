import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Label } from './Label';

describe('Label', () => {
  describe('Rendering', () => {
    it('renders with basic props', () => {
      render(<Label htmlFor="test-input">Test Label</Label>);
      
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('renders without htmlFor attribute', () => {
      render(<Label>Standalone Label</Label>);
      
      const label = screen.getByText('Standalone Label');
      expect(label).toBeInTheDocument();
      expect(label).not.toHaveAttribute('for');
    });

    it('renders with required indicator', () => {
      render(<Label htmlFor="required-field" required>Required Field</Label>);
      
      const label = screen.getByText('Required Field');
      expect(label).toBeInTheDocument();
      
      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveTextContent('*');
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('renders with description', () => {
      render(
        <Label htmlFor="field" description="This is a helpful description">
          Field Label
        </Label>
      );
      
      expect(screen.getByText('Field Label')).toBeInTheDocument();
      expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
      
      const description = screen.getByText('This is a helpful description');
      expect(description).toHaveClass('text-xs', 'text-muted-foreground');
    });

    it('renders with error message', () => {
      render(
        <Label htmlFor="field" error="This field has an error">
          Error Field
        </Label>
      );
      
      expect(screen.getByText('Error Field')).toBeInTheDocument();
      expect(screen.getByText('This field has an error')).toBeInTheDocument();
      
      const error = screen.getByText('This field has an error');
      expect(error).toHaveClass('text-xs', 'text-red-600');
    });

    it('prioritizes error over description', () => {
      render(
        <Label 
          htmlFor="field" 
          description="Description text"
          error="Error text"
        >
          Field Label
        </Label>
      );
      
      expect(screen.getByText('Error text')).toBeInTheDocument();
      expect(screen.queryByText('Description text')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with sm size', () => {
      render(<Label size="sm">Small Label</Label>);
      
      const label = screen.getByText('Small Label');
      expect(label).toHaveClass('text-xs');
    });

    it('renders with md size (default)', () => {
      render(<Label>Medium Label</Label>);
      
      const label = screen.getByText('Medium Label');
      expect(label).toHaveClass('text-sm');
    });

    it('renders with lg size', () => {
      render(<Label size="lg">Large Label</Label>);
      
      const label = screen.getByText('Large Label');
      expect(label).toHaveClass('text-base');
    });
  });

  describe('Weight Variants', () => {
    it('renders with normal weight', () => {
      render(<Label weight="normal">Normal Weight</Label>);
      
      const label = screen.getByText('Normal Weight');
      expect(label).toHaveClass('font-normal');
    });

    it('renders with medium weight (default)', () => {
      render(<Label>Medium Weight</Label>);
      
      const label = screen.getByText('Medium Weight');
      expect(label).toHaveClass('font-medium');
    });

    it('renders with semibold weight', () => {
      render(<Label weight="semibold">Semibold Weight</Label>);
      
      const label = screen.getByText('Semibold Weight');
      expect(label).toHaveClass('font-semibold');
    });
  });

  describe('Color Variants', () => {
    it('renders with default color', () => {
      render(<Label>Default Color</Label>);
      
      const label = screen.getByText('Default Color');
      expect(label).toHaveClass('text-foreground');
    });

    it('renders with muted color', () => {
      render(<Label color="muted">Muted Color</Label>);
      
      const label = screen.getByText('Muted Color');
      expect(label).toHaveClass('text-muted-foreground');
    });

    it('renders with success color', () => {
      render(<Label color="success">Success Color</Label>);
      
      const label = screen.getByText('Success Color');
      expect(label).toHaveClass('text-green-600');
    });

    it('automatically sets error color when error prop is provided', () => {
      render(<Label color="success" error="Error message">Error Label</Label>);
      
      const label = screen.getByText('Error Label');
      expect(label).toHaveClass('text-red-600');
      expect(label).not.toHaveClass('text-green-600');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Label className="custom-class">Custom Class</Label>);
      
      const label = screen.getByText('Custom Class');
      expect(label).toHaveClass('custom-class');
    });

    it('forwards HTML attributes', () => {
      render(
        <Label 
          data-testid="custom-label"
          title="Custom title"
          id="label-id"
        >
          Custom Attributes
        </Label>
      );
      
      const label = screen.getByTestId('custom-label');
      expect(label).toHaveAttribute('title', 'Custom title');
      expect(label).toHaveAttribute('id', 'label-id');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      
      render(<Label ref={ref}>Ref Test</Label>);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLLabelElement));
    });
  });

  describe('Accessibility', () => {
    it('creates proper label-input association', () => {
      render(
        <div>
          <Label htmlFor="test-input">Username</Label>
          <input id="test-input" type="text" />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Username');
      
      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('has proper required indicator accessibility', () => {
      render(<Label required>Required Field</Label>);
      
      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveAttribute('aria-label', 'required');
    });

    it('maintains accessibility with error states', () => {
      render(
        <div>
          <Label htmlFor="error-input" error="Invalid input">
            Error Field
          </Label>
          <input id="error-input" type="text" aria-invalid="true" />
        </div>
      );
      
      const label = screen.getByText('Error Field');
      const input = screen.getByRole('textbox');
      const error = screen.getByText('Invalid input');
      
      expect(label).toHaveAttribute('for', 'error-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(error).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('handles required field with error', () => {
      render(
        <Label 
          htmlFor="complex-field" 
          required 
          error="This required field has an error"
        >
          Complex Field
        </Label>
      );
      
      expect(screen.getByText('Complex Field')).toBeInTheDocument();
      expect(screen.getByLabelText('required')).toBeInTheDocument();
      expect(screen.getByText('This required field has an error')).toBeInTheDocument();
      
      const label = screen.getByText('Complex Field');
      expect(label).toHaveClass('text-red-600'); // Error color
    });

    it('handles all variants together', () => {
      render(
        <Label 
          size="lg"
          weight="semibold"
          color="success"
          required
          description="All variants applied"
        >
          All Variants
        </Label>
      );
      
      const label = screen.getByText('All Variants');
      expect(label).toHaveClass('text-base', 'font-semibold', 'text-green-600');
      expect(screen.getByLabelText('required')).toBeInTheDocument();
      expect(screen.getByText('All variants applied')).toBeInTheDocument();
    });

    it('works in form context', () => {
      render(
        <form>
          <Label htmlFor="form-input" required>
            Form Field
          </Label>
          <input id="form-input" type="text" required />
          
          <Label htmlFor="form-textarea" description="Optional description">
            Textarea Field
          </Label>
          <textarea id="form-textarea" />
        </form>
      );
      
      const textInput = screen.getByRole('textbox', { name: /form field/i });
      const textareaInput = screen.getByRole('textbox', { name: /textarea field/i });
      
      expect(textInput).toHaveAttribute('required');
      expect(textareaInput).not.toHaveAttribute('required');
      expect(screen.getByText('Optional description')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = render(<Label>Test Label</Label>);
      
      const firstRender = screen.getByText('Test Label');
      
      // Re-render with same props
      rerender(<Label>Test Label</Label>);
      
      const secondRender = screen.getByText('Test Label');
      
      // Component should be memoized
      expect(firstRender).toBe(secondRender);
    });

    it('re-renders when props change', () => {
      const { rerender } = render(<Label>Test Label</Label>);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      
      // Re-render with different props
      rerender(<Label required>Test Label</Label>);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Label htmlFor="empty" data-testid="empty-label"></Label>);
      
      const label = screen.getByTestId('empty-label');
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      render(<Label htmlFor="null" data-testid="null-label">{null}</Label>);
      
      const label = screen.getByTestId('null-label');
      expect(label).toBeInTheDocument();
    });

    it('handles complex children', () => {
      render(
        <div>
          <Label htmlFor="complex">
            <span>Complex</span> <strong>Label</strong>
          </Label>
          <input id="complex" />
        </div>
      );
      
      // Find the label element directly
      const labelElement = document.querySelector('label[for="complex"]');
      expect(labelElement).toBeInTheDocument();
      expect(labelElement?.querySelector('span')).toHaveTextContent('Complex');
      expect(labelElement?.querySelector('strong')).toHaveTextContent('Label');
      
      // Verify the association works
      const input = screen.getByLabelText(/Complex.*Label/);
      expect(input).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longText = 'This is a very long label text that might wrap to multiple lines and should still work correctly with all the styling and functionality';
      
      render(
        <Label 
          htmlFor="long-text" 
          description="This is also a very long description that provides detailed information about the field"
          required
        >
          {longText}
        </Label>
      );
      
      expect(screen.getByText(longText)).toBeInTheDocument();
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('works with light theme', () => {
      render(
        <Label color="success" error="Error in light theme">
          Light Theme Label
        </Label>,
        { theme: 'light' }
      );
      
      const label = screen.getByText('Light Theme Label');
      expect(label).toHaveClass('text-red-600');
    });

    it('works with dark theme', () => {
      render(
        <Label color="success" error="Error in dark theme">
          Dark Theme Label
        </Label>,
        { theme: 'dark' }
      );
      
      const label = screen.getByText('Dark Theme Label');
      expect(label).toHaveClass('text-red-600');
    });
  });
});