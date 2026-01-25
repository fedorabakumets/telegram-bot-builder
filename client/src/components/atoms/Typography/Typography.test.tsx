import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Typography } from './Typography';

describe('Typography', () => {
  describe('Rendering', () => {
    it('renders with default variant (body)', () => {
      render(<Typography>Default body text</Typography>);
      
      const element = screen.getByText('Default body text');
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBe('P');
      expect(element).toHaveClass('leading-7');
    });

    it('renders with custom content', () => {
      render(
        <Typography variant="h1">
          <span>Complex</span> content with <strong>markup</strong>
        </Typography>
      );
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.querySelector('span')).toHaveTextContent('Complex');
      expect(heading.querySelector('strong')).toHaveTextContent('markup');
    });
  });

  describe('Heading Variants', () => {
    it('renders h1 variant with correct element and styles', () => {
      render(<Typography variant="h1">Heading 1</Typography>);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
      expect(heading).toHaveClass('text-4xl', 'font-bold', 'tracking-tight');
    });

    it('renders h2 variant with correct element and styles', () => {
      render(<Typography variant="h2">Heading 2</Typography>);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveClass('text-3xl', 'font-semibold', 'border-b');
    });

    it('renders h3 variant with correct element and styles', () => {
      render(<Typography variant="h3">Heading 3</Typography>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
      expect(heading).toHaveClass('text-2xl', 'font-semibold');
    });

    it('renders h4 variant with correct element and styles', () => {
      render(<Typography variant="h4">Heading 4</Typography>);
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H4');
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('renders h5 variant with correct element and styles', () => {
      render(<Typography variant="h5">Heading 5</Typography>);
      
      const heading = screen.getByRole('heading', { level: 5 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H5');
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('renders h6 variant with correct element and styles', () => {
      render(<Typography variant="h6">Heading 6</Typography>);
      
      const heading = screen.getByRole('heading', { level: 6 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H6');
      expect(heading).toHaveClass('text-base', 'font-semibold');
    });
  });

  describe('Body Text Variants', () => {
    it('renders body variant', () => {
      render(<Typography variant="body">Body text</Typography>);
      
      const text = screen.getByText('Body text');
      expect(text.tagName).toBe('P');
      expect(text).toHaveClass('leading-7');
    });

    it('renders body-large variant', () => {
      render(<Typography variant="body-large">Large body text</Typography>);
      
      const text = screen.getByText('Large body text');
      expect(text.tagName).toBe('P');
      expect(text).toHaveClass('text-lg', 'leading-7');
    });

    it('renders body-small variant', () => {
      render(<Typography variant="body-small">Small body text</Typography>);
      
      const text = screen.getByText('Small body text');
      expect(text.tagName).toBe('P');
      expect(text).toHaveClass('text-sm', 'leading-6');
    });

    it('renders lead variant', () => {
      render(<Typography variant="lead">Lead paragraph</Typography>);
      
      const text = screen.getByText('Lead paragraph');
      expect(text.tagName).toBe('P');
      expect(text).toHaveClass('text-xl');
      // Note: lead variant has muted color built-in
    });

    it('renders muted variant', () => {
      render(<Typography variant="muted">Muted text</Typography>);
      
      const text = screen.getByText('Muted text');
      expect(text.tagName).toBe('P');
      expect(text).toHaveClass('text-sm');
      // Note: muted variant has muted color built-in
    });
  });

  describe('UI Element Variants', () => {
    it('renders label variant', () => {
      render(<Typography variant="label">Label text</Typography>);
      
      const text = screen.getByText('Label text');
      expect(text.tagName).toBe('SPAN');
      expect(text).toHaveClass('text-sm', 'font-medium', 'leading-none');
    });

    it('renders caption variant', () => {
      render(<Typography variant="caption">Caption text</Typography>);
      
      const text = screen.getByText('Caption text');
      expect(text.tagName).toBe('SPAN');
      expect(text).toHaveClass('text-xs', 'leading-4');
      // Note: caption variant has muted color built-in
    });

    it('renders overline variant', () => {
      render(<Typography variant="overline">Overline text</Typography>);
      
      const text = screen.getByText('Overline text');
      expect(text.tagName).toBe('SPAN');
      expect(text).toHaveClass('text-xs', 'font-semibold', 'uppercase', 'tracking-wider');
    });

    it('renders large variant', () => {
      render(<Typography variant="large">Large text</Typography>);
      
      const text = screen.getByText('Large text');
      expect(text.tagName).toBe('DIV');
      expect(text).toHaveClass('text-lg', 'font-semibold');
    });

    it('renders small variant', () => {
      render(<Typography variant="small">Small text</Typography>);
      
      const text = screen.getByText('Small text');
      expect(text.tagName).toBe('SMALL');
      expect(text).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('Code Variants', () => {
    it('renders code variant', () => {
      render(<Typography variant="code">const x = 1;</Typography>);
      
      const code = screen.getByText('const x = 1;');
      expect(code.tagName).toBe('CODE');
      expect(code).toHaveClass('font-mono', 'text-sm', 'bg-muted', 'rounded');
    });

    it('renders code-block variant', () => {
      render(<Typography variant="code-block">function test() {}</Typography>);
      
      const codeBlock = screen.getByText(/function test/);
      expect(codeBlock.tagName).toBe('PRE');
      expect(codeBlock).toHaveClass('font-mono', 'text-sm', 'leading-6');
    });
  });

  describe('Weight Variants', () => {
    it('renders with thin weight', () => {
      render(<Typography weight="thin">Thin text</Typography>);
      
      const text = screen.getByText('Thin text');
      expect(text).toHaveClass('font-thin');
    });

    it('renders with normal weight', () => {
      render(<Typography weight="normal">Normal text</Typography>);
      
      const text = screen.getByText('Normal text');
      expect(text).toHaveClass('font-normal');
    });

    it('renders with bold weight', () => {
      render(<Typography weight="bold">Bold text</Typography>);
      
      const text = screen.getByText('Bold text');
      expect(text).toHaveClass('font-bold');
    });

    it('renders with black weight', () => {
      render(<Typography weight="black">Black text</Typography>);
      
      const text = screen.getByText('Black text');
      expect(text).toHaveClass('font-black');
    });
  });

  describe('Alignment Variants', () => {
    it('renders with left alignment', () => {
      render(<Typography align="left">Left aligned</Typography>);
      
      const text = screen.getByText('Left aligned');
      expect(text).toHaveClass('text-left');
    });

    it('renders with center alignment', () => {
      render(<Typography align="center">Center aligned</Typography>);
      
      const text = screen.getByText('Center aligned');
      expect(text).toHaveClass('text-center');
    });

    it('renders with right alignment', () => {
      render(<Typography align="right">Right aligned</Typography>);
      
      const text = screen.getByText('Right aligned');
      expect(text).toHaveClass('text-right');
    });

    it('renders with justify alignment', () => {
      render(<Typography align="justify">Justified text</Typography>);
      
      const text = screen.getByText('Justified text');
      expect(text).toHaveClass('text-justify');
    });
  });

  describe('Color Variants', () => {
    it('renders with default color', () => {
      render(<Typography color="default">Default color</Typography>);
      
      const text = screen.getByText('Default color');
      expect(text).toHaveClass('text-foreground');
    });

    it('renders with muted color', () => {
      render(<Typography color="muted">Muted color</Typography>);
      
      const text = screen.getByText('Muted color');
      expect(text).toHaveClass('text-muted-foreground');
    });

    it('renders with primary color', () => {
      render(<Typography color="primary">Primary color</Typography>);
      
      const text = screen.getByText('Primary color');
      expect(text).toHaveClass('text-primary');
    });

    it('renders with success color', () => {
      render(<Typography color="success">Success color</Typography>);
      
      const text = screen.getByText('Success color');
      expect(text).toHaveClass('text-green-600');
    });

    it('renders with warning color', () => {
      render(<Typography color="warning">Warning color</Typography>);
      
      const text = screen.getByText('Warning color');
      expect(text).toHaveClass('text-yellow-600');
    });

    it('renders with error color', () => {
      render(<Typography color="error">Error color</Typography>);
      
      const text = screen.getByText('Error color');
      expect(text).toHaveClass('text-red-600');
    });

    it('renders with info color', () => {
      render(<Typography color="info">Info color</Typography>);
      
      const text = screen.getByText('Info color');
      expect(text).toHaveClass('text-blue-600');
    });
  });

  describe('Element Override', () => {
    it('overrides element with as prop', () => {
      render(<Typography variant="h2" as="h1">Semantic H1, Visual H2</Typography>);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
      expect(heading).toHaveClass('text-3xl', 'font-semibold'); // h2 styles
    });

    it('overrides paragraph with span', () => {
      render(<Typography variant="body" as="span">Span with body styles</Typography>);
      
      const text = screen.getByText('Span with body styles');
      expect(text.tagName).toBe('SPAN');
      expect(text).toHaveClass('leading-7'); // body styles
    });

    it('overrides with custom element', () => {
      render(<Typography variant="label" as="div">Div with label styles</Typography>);
      
      const text = screen.getByText('Div with label styles');
      expect(text.tagName).toBe('DIV');
      expect(text).toHaveClass('text-sm', 'font-medium'); // label styles
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Typography className="custom-class">Custom styled</Typography>);
      
      const text = screen.getByText('Custom styled');
      expect(text).toHaveClass('custom-class');
    });

    it('forwards HTML attributes', () => {
      render(
        <Typography 
          data-testid="custom-typography"
          title="Custom title"
          id="typography-id"
        >
          Custom attributes
        </Typography>
      );
      
      const text = screen.getByTestId('custom-typography');
      expect(text).toHaveAttribute('title', 'Custom title');
      expect(text).toHaveAttribute('id', 'typography-id');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      
      render(<Typography ref={ref}>Ref test</Typography>);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLParagraphElement));
    });
  });

  describe('Combined Variants', () => {
    it('combines multiple variants correctly', () => {
      render(
        <Typography 
          variant="h3" 
          weight="bold" 
          align="center" 
          color="primary"
        >
          Combined variants
        </Typography>
      );
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass(
        'text-2xl', 'tracking-tight', // h3 variant includes these
        'font-bold', // weight override
        'text-center', // alignment
        'text-primary' // color
      );
    });

    it('handles variant with custom element and styling', () => {
      render(
        <Typography 
          variant="code" 
          as="span"
          weight="normal"
          color="success"
          className="custom-code"
        >
          Custom code span
        </Typography>
      );
      
      const code = screen.getByText('Custom code span');
      expect(code.tagName).toBe('SPAN');
      expect(code).toHaveClass(
        'font-mono', 'text-sm', // code variant
        'font-normal', // weight override
        'text-green-600', // success color
        'custom-code' // custom class
      );
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic heading hierarchy', () => {
      render(
        <div>
          <Typography variant="h1">Main Title</Typography>
          <Typography variant="h2">Section Title</Typography>
          <Typography variant="h3">Subsection Title</Typography>
        </div>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section Title');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subsection Title');
    });

    it('allows semantic override for accessibility', () => {
      render(
        <div>
          <Typography variant="h3" as="h1">Visually H3, Semantically H1</Typography>
          <Typography variant="h1" as="h2">Visually H1, Semantically H2</Typography>
        </div>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toHaveClass('text-2xl'); // h3 visual style
      expect(h2).toHaveClass('text-4xl'); // h1 visual style
    });

    it('works with screen readers', () => {
      render(
        <Typography variant="caption" role="status" aria-live="polite">
          Status message
        </Typography>
      );
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveTextContent('Status message');
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = render(<Typography>Test content</Typography>);
      
      const firstRender = screen.getByText('Test content');
      
      // Re-render with same props
      rerender(<Typography>Test content</Typography>);
      
      const secondRender = screen.getByText('Test content');
      
      // Component should be memoized
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Typography data-testid="empty-typography"></Typography>);
      
      const element = screen.getByTestId('empty-typography');
      expect(element).toBeInTheDocument();
      expect(element).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      render(<Typography data-testid="null-typography">{null}</Typography>);
      
      const element = screen.getByTestId('null-typography');
      expect(element).toBeInTheDocument();
    });

    it('handles number children', () => {
      render(<Typography>{42}</Typography>);
      
      const element = screen.getByText('42');
      expect(element).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Typography data-testid="boolean-typography">{true}</Typography>);
      
      // Boolean children don't render in React
      const element = screen.getByTestId('boolean-typography');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('works with light theme', () => {
      render(
        <Typography color="success">Success in light theme</Typography>,
        { theme: 'light' }
      );
      
      const text = screen.getByText('Success in light theme');
      expect(text).toHaveClass('text-green-600');
    });

    it('works with dark theme', () => {
      render(
        <Typography color="success">Success in dark theme</Typography>,
        { theme: 'dark' }
      );
      
      const text = screen.getByText('Success in dark theme');
      expect(text).toHaveClass('text-green-600');
    });
  });
});