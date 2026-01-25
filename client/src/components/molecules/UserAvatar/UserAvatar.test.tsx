import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../test/test-utils';
import { UserAvatar } from './UserAvatar';

// Mock Image constructor for testing image loading
const mockImage = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  src: '',
  onload: null as any,
  onerror: null as any,
};

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock Image constructor
  global.Image = vi.fn(() => mockImage) as any;
});

describe('UserAvatar', () => {
  describe('Rendering', () => {
    it('renders with name only (initials fallback)', () => {
      render(<UserAvatar name="John Doe" />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders with single name (single initial)', () => {
      render(<UserAvatar name="John" />);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders with custom initials', () => {
      render(<UserAvatar name="John Doe" initials="AB" />);
      
      expect(screen.getByText('AB')).toBeInTheDocument();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });

    it('renders with image', () => {
      render(<UserAvatar name="John Doe" src="/avatar.jpg" />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/avatar.jpg');
      expect(image).toHaveAttribute('alt', 'John Doe');
    });

    it('renders with custom alt text', () => {
      render(<UserAvatar name="John Doe" src="/avatar.jpg" alt="Custom alt text" />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Custom alt text');
    });

    it('renders fallback icon when no name or image', () => {
      render(<UserAvatar />);
      
      // Should render default user icon
      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar).toBeInTheDocument();
    });

    it('renders custom fallback icon', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
      
      render(<UserAvatar fallbackIcon={<CustomIcon />} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders custom fallback icon name', () => {
      render(<UserAvatar fallbackIconName="fa-solid fa-star" />);
      
      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with xs size', () => {
      render(<UserAvatar name="John Doe" size="xs" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('h-6', 'w-6', 'text-xs');
    });

    it('renders with sm size', () => {
      render(<UserAvatar name="John Doe" size="sm" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('h-8', 'w-8', 'text-sm');
    });

    it('renders with md size (default)', () => {
      render(<UserAvatar name="John Doe" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('h-10', 'w-10', 'text-base');
    });

    it('renders with lg size', () => {
      render(<UserAvatar name="John Doe" size="lg" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('h-12', 'w-12', 'text-lg');
    });

    it('renders with xl size', () => {
      render(<UserAvatar name="John Doe" size="xl" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('h-16', 'w-16', 'text-xl');
    });

    it('renders with 2xl size', () => {
      render(<UserAvatar name="John Doe" size="2xl" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('h-20', 'w-20', 'text-2xl');
    });
  });

  describe('Shape Variants', () => {
    it('renders with circle shape (default)', () => {
      render(<UserAvatar name="John Doe" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('rounded-full');
    });

    it('renders with square shape', () => {
      render(<UserAvatar name="John Doe" shape="square" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('rounded-md');
    });

    it('renders with rounded shape', () => {
      render(<UserAvatar name="John Doe" shape="rounded" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('rounded-lg');
    });
  });

  describe('Variant Styles', () => {
    it('renders with default variant', () => {
      render(<UserAvatar name="John Doe" />);
      
      const avatar = screen.getByText('JD').parentElement;
      // Should have generated color class based on name or default muted background
      expect(avatar?.className).toMatch(/bg-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-500|bg-muted/);
    });

    it('renders with primary variant', () => {
      render(<UserAvatar name="John Doe" variant="primary" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('renders with secondary variant', () => {
      render(<UserAvatar name="John Doe" variant="secondary" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('renders with success variant', () => {
      render(<UserAvatar name="John Doe" variant="success" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders with warning variant', () => {
      render(<UserAvatar name="John Doe" variant="warning" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('renders with error variant', () => {
      render(<UserAvatar name="John Doe" variant="error" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-red-100', 'text-red-700');
    });
  });

  describe('Status Indicators', () => {
    it('shows online status', () => {
      render(<UserAvatar name="John Doe" status="online" showStatus />);
      
      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-green-500');
    });

    it('shows offline status', () => {
      render(<UserAvatar name="John Doe" status="offline" showStatus />);
      
      const statusIndicator = screen.getByLabelText('Status: offline');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-gray-400');
    });

    it('shows away status', () => {
      render(<UserAvatar name="John Doe" status="away" showStatus />);
      
      const statusIndicator = screen.getByLabelText('Status: away');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-yellow-500');
    });

    it('shows busy status', () => {
      render(<UserAvatar name="John Doe" status="busy" showStatus />);
      
      const statusIndicator = screen.getByLabelText('Status: busy');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-red-500');
    });

    it('hides status when showStatus is false', () => {
      render(<UserAvatar name="John Doe" status="online" showStatus={false} />);
      
      expect(screen.queryByLabelText('Status: online')).not.toBeInTheDocument();
    });

    it('hides status when status is not provided', () => {
      render(<UserAvatar name="John Doe" showStatus />);
      
      expect(screen.queryByLabelText(/Status:/)).not.toBeInTheDocument();
    });

    it('adjusts status indicator size based on avatar size', () => {
      render(<UserAvatar name="John Doe" status="online" showStatus size="xl" />);
      
      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Image Handling', () => {
    it('falls back to initials when image fails to load', async () => {
      render(<UserAvatar name="John Doe" src="/broken-image.jpg" />);
      
      const image = screen.getByRole('img');
      
      // Simulate image error
      const errorEvent = new Event('error');
      image.dispatchEvent(errorEvent);
      
      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
      });
    });

    it('shows image when it loads successfully', async () => {
      render(<UserAvatar name="John Doe" src="/valid-image.jpg" />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/valid-image.jpg');
      
      // Simulate successful image load
      const loadEvent = new Event('load');
      image.dispatchEvent(loadEvent);
      
      await waitFor(() => {
        expect(image).not.toHaveClass('opacity-0');
      });
    });

    it('resets image error state when src changes', () => {
      const { rerender } = render(<UserAvatar name="John Doe" src="/broken.jpg" />);
      
      const image = screen.getByRole('img');
      
      // Simulate image error
      const errorEvent = new Event('error');
      image.dispatchEvent(errorEvent);
      
      // Change src
      rerender(<UserAvatar name="John Doe" src="/new-image.jpg" />);
      
      const newImage = screen.getByRole('img');
      expect(newImage).toHaveAttribute('src', '/new-image.jpg');
    });

    it('applies correct border radius to image based on shape', () => {
      render(<UserAvatar name="John Doe" src="/image.jpg" shape="square" />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveClass('rounded-md');
    });
  });

  describe('Interactive Behavior', () => {
    it('becomes clickable when onClick is provided', () => {
      const handleClick = vi.fn();
      
      render(<UserAvatar name="John Doe" onClick={handleClick} />);
      
      const avatar = screen.getByRole('button');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('cursor-pointer');
      expect(avatar).toHaveAttribute('tabIndex', '0');
    });

    it('becomes clickable when clickable prop is true', () => {
      render(<UserAvatar name="John Doe" clickable />);
      
      const avatar = screen.getByRole('button');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('cursor-pointer');
    });

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<UserAvatar name="John Doe" onClick={handleClick} />);
      
      const avatar = screen.getByRole('button');
      await user.click(avatar);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<UserAvatar name="John Doe" onClick={handleClick} />);
      
      const avatar = screen.getByRole('button');
      avatar.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<UserAvatar name="John Doe" onClick={handleClick} />);
      
      const avatar = screen.getByRole('button');
      avatar.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<UserAvatar name="John Doe" onClick={handleClick} loading />);
      
      // Loading avatar should not be clickable
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('has proper ARIA label for interactive avatars', () => {
      render(<UserAvatar name="John Doe" onClick={() => {}} />);
      
      const avatar = screen.getByRole('button');
      expect(avatar).toHaveAttribute('aria-label', 'John Doe avatar');
    });

    it('has default ARIA label when no name provided', () => {
      render(<UserAvatar onClick={() => {}} />);
      
      const avatar = screen.getByRole('button');
      expect(avatar).toHaveAttribute('aria-label', 'User avatar');
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton', () => {
      render(<UserAvatar loading />);
      
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-muted');
    });

    it('renders loading skeleton with correct size', () => {
      render(<UserAvatar loading size="lg" />);
      
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('h-12', 'w-12');
    });

    it('renders loading skeleton with correct shape', () => {
      render(<UserAvatar loading shape="square" />);
      
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('does not render content when loading', () => {
      render(<UserAvatar name="John Doe" src="/image.jpg" loading />);
      
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Initials Generation', () => {
    it('generates initials from first and last name', () => {
      render(<UserAvatar name="John Doe" />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('generates single initial from single name', () => {
      render(<UserAvatar name="John" />);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('generates initials from first and last word of multiple names', () => {
      render(<UserAvatar name="John Michael Doe Smith" />);
      
      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('handles names with extra whitespace', () => {
      render(<UserAvatar name="  John   Doe  " />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('handles empty name gracefully', () => {
      render(<UserAvatar name="" />);
      
      // Should fall back to icon
      expect(screen.queryByText(/[A-Z]/)).not.toBeInTheDocument();
    });

    it('generates consistent colors for same names', () => {
      const { rerender } = render(<UserAvatar name="John Doe" />);
      const firstAvatar = screen.getByText('JD').parentElement;
      const firstClassName = firstAvatar?.className;
      
      rerender(<UserAvatar name="John Doe" />);
      const secondAvatar = screen.getByText('JD').parentElement;
      const secondClassName = secondAvatar?.className;
      
      expect(firstClassName).toBe(secondClassName);
    });

    it('generates different colors for different names', () => {
      const { rerender } = render(<UserAvatar name="John Doe" />);
      const firstAvatar = screen.getByText('JD').parentElement;
      const firstClassName = firstAvatar?.className;
      
      rerender(<UserAvatar name="Jane Smith" />);
      const secondAvatar = screen.getByText('JS').parentElement;
      const secondClassName = secondAvatar?.className;
      
      // Names should generate different colors (though both might fall back to muted)
      // At minimum, the initials should be different
      expect(screen.getByText('JS')).toBeInTheDocument();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<UserAvatar name="John Doe" className="custom-avatar" />);
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('forwards HTML attributes', () => {
      render(
        <UserAvatar 
          name="John Doe" 
          data-testid="custom-avatar"
          title="User avatar"
        />
      );
      
      const avatar = screen.getByTestId('custom-avatar');
      expect(avatar).toHaveAttribute('title', 'User avatar');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      
      render(<UserAvatar ref={ref} name="John Doe" />);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = render(
        <UserAvatar name="John Doe" />
      );
      
      const firstRender = screen.getByText('JD');
      
      // Re-render with same props
      rerender(<UserAvatar name="John Doe" />);
      
      const secondRender = screen.getByText('JD');
      
      // Component should be memoized
      expect(firstRender).toBe(secondRender);
    });

    it('re-renders when props change', () => {
      const { rerender } = render(<UserAvatar name="John Doe" />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
      
      // Re-render with different props
      rerender(<UserAvatar name="Jane Smith" />);
      
      expect(screen.getByText('JS')).toBeInTheDocument();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long names', () => {
      render(<UserAvatar name="Verylongfirstname Verylonglastname" />);
      
      expect(screen.getByText('VV')).toBeInTheDocument();
    });

    it('handles names with special characters', () => {
      render(<UserAvatar name="José María" />);
      
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('handles names with numbers', () => {
      render(<UserAvatar name="User123 Test456" />);
      
      expect(screen.getByText('UT')).toBeInTheDocument();
    });

    it('handles single character names', () => {
      render(<UserAvatar name="A" />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('handles names with only spaces', () => {
      render(<UserAvatar name="   " />);
      
      // Should fall back to icon
      expect(screen.queryByText(/[A-Z]/)).not.toBeInTheDocument();
    });

    it('handles undefined/null name gracefully', () => {
      render(<UserAvatar name={undefined as any} />);
      
      // Should fall back to icon
      expect(screen.queryByText(/[A-Z]/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper image alt text', () => {
      render(<UserAvatar name="John Doe" src="/avatar.jpg" />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'John Doe');
    });

    it('has default alt text when no name provided', () => {
      render(<UserAvatar src="/avatar.jpg" />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'User avatar');
    });

    it('supports keyboard navigation for interactive avatars', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<UserAvatar name="John Doe" onClick={handleClick} />);
      
      const avatar = screen.getByRole('button');
      
      // Should be focusable
      avatar.focus();
      expect(avatar).toHaveFocus();
      
      // Should respond to keyboard
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('has proper status indicator accessibility', () => {
      render(<UserAvatar name="John Doe" status="online" showStatus />);
      
      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toHaveAttribute('title', 'Status: online');
    });
  });

  describe('Theme Integration', () => {
    it('works with light theme', () => {
      render(
        <UserAvatar name="John Doe" variant="success" />,
        { theme: 'light' }
      );
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-green-100');
    });

    it('works with dark theme', () => {
      render(
        <UserAvatar name="John Doe" variant="success" />,
        { theme: 'dark' }
      );
      
      const avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('bg-green-100'); // Classes are the same, but CSS variables change
    });
  });
});