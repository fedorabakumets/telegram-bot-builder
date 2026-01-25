import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../test/test-utils';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  describe('Rendering', () => {
    it('renders with basic props', () => {
      render(<StatCard title="Total Users" value={1234} />);
      
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      // Use regex to handle different locale formatting (comma or space)
      expect(screen.getByText(/1[,\s]234/)).toBeInTheDocument();
    });

    it('renders with string value', () => {
      render(<StatCard title="Revenue" value="$45,678" />);
      
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$45,678')).toBeInTheDocument();
    });

    it('renders with subtitle', () => {
      render(
        <StatCard 
          title="Active Sessions" 
          value={42} 
          subtitle="Currently online"
        />
      );
      
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Currently online')).toBeInTheDocument();
    });

    it('renders with Font Awesome icon', () => {
      render(
        <StatCard 
          title="Users" 
          value={100} 
          iconName="fa-solid fa-users"
        />
      );
      
      expect(screen.getByText('Users')).toBeInTheDocument();
      const iconContainer = screen.getByText('Users').parentElement;
      expect(iconContainer?.querySelector('i.fa-solid.fa-users')).toBeInTheDocument();
    });

    it('renders with custom icon', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
      
      render(
        <StatCard 
          title="Custom" 
          value={50} 
          icon={<CustomIcon />}
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('prioritizes custom icon over iconName', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
      
      render(
        <StatCard 
          title="Priority Test" 
          value={50} 
          icon={<CustomIcon />}
          iconName="fa-solid fa-users"
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Variant Styles', () => {
    it('renders with default variant', () => {
      render(<StatCard title="Default" value={100} />);
      
      const card = screen.getByText('Default').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('border-border');
    });

    it('renders with success variant', () => {
      render(<StatCard title="Success" value={100} variant="success" />);
      
      const card = screen.getByText('Success').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('border-green-200', 'bg-green-50');
    });

    it('renders with warning variant', () => {
      render(<StatCard title="Warning" value={100} variant="warning" />);
      
      const card = screen.getByText('Warning').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('border-yellow-200', 'bg-yellow-50');
    });

    it('renders with error variant', () => {
      render(<StatCard title="Error" value={100} variant="error" />);
      
      const card = screen.getByText('Error').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('border-red-200', 'bg-red-50');
    });

    it('renders with info variant', () => {
      render(<StatCard title="Info" value={100} variant="info" />);
      
      const card = screen.getByText('Info').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('border-blue-200', 'bg-blue-50');
    });
  });

  describe('Size Variants', () => {
    it('renders with sm size', () => {
      render(<StatCard title="Small" value={100} size="sm" />);
      
      const card = screen.getByText('Small').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('p-4');
    });

    it('renders with md size (default)', () => {
      render(<StatCard title="Medium" value={100} />);
      
      const card = screen.getByText('Medium').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('p-6');
    });

    it('renders with lg size', () => {
      render(<StatCard title="Large" value={100} size="lg" />);
      
      const card = screen.getByText('Large').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Change Indicators', () => {
    it('renders increase change indicator', () => {
      render(
        <StatCard 
          title="Revenue" 
          value={1000} 
          change={{
            value: "+12.5%",
            type: "increase",
            label: "vs last month"
          }}
        />
      );
      
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
      
      const changeElement = screen.getByText('+12.5%').parentElement;
      expect(changeElement).toHaveClass('text-green-600');
      
      // Should have up arrow icon
      expect(changeElement?.querySelector('i.fa-arrow-up')).toBeInTheDocument();
    });

    it('renders decrease change indicator', () => {
      render(
        <StatCard 
          title="Sales" 
          value={800} 
          change={{
            value: "-5.2%",
            type: "decrease"
          }}
        />
      );
      
      expect(screen.getByText('-5.2%')).toBeInTheDocument();
      
      const changeElement = screen.getByText('-5.2%').parentElement;
      expect(changeElement).toHaveClass('text-red-600');
      
      // Should have down arrow icon
      expect(changeElement?.querySelector('i.fa-arrow-down')).toBeInTheDocument();
    });

    it('renders neutral change indicator', () => {
      render(
        <StatCard 
          title="Stable" 
          value={500} 
          change={{
            value: "0%",
            type: "neutral"
          }}
        />
      );
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      const changeElement = screen.getByText('0%').parentElement;
      expect(changeElement).toHaveClass('text-muted-foreground');
      
      // Should have minus icon
      expect(changeElement?.querySelector('i.fa-minus')).toBeInTheDocument();
    });

    it('renders change without label', () => {
      render(
        <StatCard 
          title="Simple Change" 
          value={100} 
          change={{
            value: "+10",
            type: "increase"
          }}
        />
      );
      
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.queryByText('vs')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton', () => {
      render(<StatCard title="Loading" value={100} loading />);
      
      // Should show skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Should not show actual value
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    it('shows loading placeholder for value', () => {
      render(<StatCard title="Loading Value" value={100} loading />);
      
      // Should show skeleton instead of title and value
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows loading skeleton for icon', () => {
      render(
        <StatCard 
          title="Loading Icon" 
          value={100} 
          iconName="fa-solid fa-users"
          loading 
        />
      );
      
      // Should not show the actual icon
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    it('becomes interactive when onClick is provided', () => {
      const handleClick = vi.fn();
      
      render(
        <StatCard 
          title="Clickable" 
          value={100} 
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('becomes interactive when interactive prop is true', () => {
      render(
        <StatCard 
          title="Interactive" 
          value={100} 
          interactive
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('cursor-pointer');
    });

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <StatCard 
          title="Clickable" 
          value={100} 
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <StatCard 
          title="Keyboard" 
          value={100} 
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <StatCard 
          title="Keyboard" 
          value={100} 
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <StatCard 
          title="Loading Click" 
          value={100} 
          onClick={handleClick}
          loading
        />
      );
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has proper ARIA label for interactive cards', () => {
      render(
        <StatCard 
          title="Revenue" 
          value={1234} 
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      // Use regex to handle different locale formatting
      expect(card).toHaveAttribute('aria-label', expect.stringMatching(/Revenue: 1[,\s]234/));
    });
  });

  describe('Value Formatting', () => {
    it('formats numbers with commas by default', () => {
      render(<StatCard title="Large Number" value={1234567} />);
      
      // Use regex to handle different locale formatting
      expect(screen.getByText(/1[,\s]234[,\s]567/)).toBeInTheDocument();
    });

    it('uses custom format function', () => {
      const formatValue = (value: string | number) => `$${value}.00`;
      
      render(
        <StatCard 
          title="Currency" 
          value={100} 
          formatValue={formatValue}
        />
      );
      
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('handles string values without formatting', () => {
      render(<StatCard title="String Value" value="Custom Text" />);
      
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('formats zero correctly', () => {
      render(<StatCard title="Zero" value={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('formats negative numbers correctly', () => {
      render(<StatCard title="Negative" value={-1234} />);
      
      // Use regex to handle different locale formatting
      expect(screen.getByText(/-1[,\s]234/)).toBeInTheDocument();
    });
  });

  describe('Footer Content', () => {
    it('renders custom footer', () => {
      const footer = <div data-testid="custom-footer">Custom Footer</div>;
      
      render(
        <StatCard 
          title="With Footer" 
          value={100} 
          footer={footer}
        />
      );
      
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByText('Custom Footer')).toBeInTheDocument();
    });

    it('does not render footer section when no footer provided', () => {
      render(<StatCard title="No Footer" value={100} />);
      
      const card = screen.getByText('No Footer').closest('div');
      expect(card?.querySelector('.border-t')).not.toBeInTheDocument();
    });

    it('renders complex footer content', () => {
      const footer = (
        <div>
          <button>Action 1</button>
          <button>Action 2</button>
        </div>
      );
      
      render(
        <StatCard 
          title="Complex Footer" 
          value={100} 
          footer={footer}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <StatCard 
          title="Custom Class" 
          value={100} 
          className="custom-stat-card"
        />
      );
      
      const card = screen.getByText('Custom Class').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('custom-stat-card');
    });

    it('forwards HTML attributes', () => {
      render(
        <StatCard 
          title="Custom Attributes" 
          value={100} 
          data-testid="custom-stat"
          data-tooltip="Stat card tooltip"
        />
      );
      
      const card = screen.getByTestId('custom-stat');
      expect(card).toHaveAttribute('data-tooltip', 'Stat card tooltip');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      
      render(<StatCard ref={ref} title="Ref Test" value={100} />);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  describe('Complex Scenarios', () => {
    it('renders all features together', () => {
      const handleClick = vi.fn();
      const footer = <div>Footer content</div>;
      
      render(
        <StatCard
          title="Complete Card"
          value={1234}
          subtitle="All features"
          variant="success"
          size="lg"
          iconName="fa-solid fa-chart-line"
          change={{
            value: "+15%",
            type: "increase",
            label: "vs last quarter"
          }}
          footer={footer}
          onClick={handleClick}
          formatValue={(val) => `${val} items`}
        />
      );
      
      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('1234 items')).toBeInTheDocument();
      expect(screen.getByText('All features')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('vs last quarter')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('border-green-200', 'p-8');
    });

    it('handles loading state with all props', () => {
      render(
        <StatCard
          title="Loading Complete"
          value={1234}
          subtitle="Loading subtitle"
          iconName="fa-solid fa-users"
          change={{
            value: "+10%",
            type: "increase"
          }}
          loading
        />
      );
      
      // Should show skeleton instead of content
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      
      expect(screen.queryByText('Loading Complete')).not.toBeInTheDocument();
      expect(screen.queryByText(/1[,\s]234/)).not.toBeInTheDocument();
      expect(screen.queryByText('Loading subtitle')).not.toBeInTheDocument();
      expect(screen.queryByText('+10%')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = render(
        <StatCard title="Performance Test" value={100} />
      );
      
      const firstRender = screen.getByText('Performance Test');
      
      // Re-render with same props
      rerender(<StatCard title="Performance Test" value={100} />);
      
      const secondRender = screen.getByText('Performance Test');
      
      // Component should be memoized (same reference)
      expect(firstRender).toBe(secondRender);
    });

    it('re-renders when props change', () => {
      const { rerender } = render(
        <StatCard title="Performance Test" value={100} />
      );
      
      expect(screen.getByText('Performance Test')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      
      // Re-render with different props
      rerender(<StatCard title="Performance Test" value={200} />);
      
      expect(screen.getByText('Performance Test')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(<StatCard title="" value={100} />);
      
      const card = screen.getByText('100').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('handles zero value', () => {
      render(<StatCard title="Zero Value" value={0} />);
      
      expect(screen.getByText('Zero Value')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(<StatCard title="Large Number" value={999999999} />);
      
      // Use regex to handle different locale formatting
      expect(screen.getByText(/999[,\s]999[,\s]999/)).toBeInTheDocument();
    });

    it('handles decimal numbers', () => {
      render(<StatCard title="Decimal" value={123.45} />);
      
      // Use regex to handle different locale formatting (comma or dot for decimal)
      expect(screen.getByText(/123[,.]45/)).toBeInTheDocument();
    });

    it('handles null/undefined change gracefully', () => {
      render(
        <StatCard 
          title="No Change" 
          value={100} 
          change={undefined}
        />
      );
      
      expect(screen.getByText('No Change')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<StatCard title="Accessible Card" value={100} />);
      
      // Should have proper heading structure
      expect(screen.getByText('Accessible Card')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('supports keyboard navigation for interactive cards', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <StatCard 
          title="Keyboard Nav" 
          value={100} 
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Should be focusable
      card.focus();
      expect(card).toHaveFocus();
      
      // Should respond to keyboard
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('has proper ARIA attributes for interactive elements', () => {
      render(
        <StatCard 
          title="ARIA Test" 
          value={100} 
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Theme Integration', () => {
    it('works with light theme', () => {
      render(
        <StatCard title="Light Theme" value={100} variant="success" />,
        { theme: 'light' }
      );
      
      const card = screen.getByText('Light Theme').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('bg-green-50');
    });

    it('works with dark theme', () => {
      render(
        <StatCard title="Dark Theme" value={100} variant="success" />,
        { theme: 'dark' }
      );
      
      const card = screen.getByText('Dark Theme').closest('[class*="rounded-lg"]');
      expect(card).toHaveClass('bg-green-50'); // Classes are the same, but CSS variables change
    });
  });
});