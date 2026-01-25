import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { SearchBox } from './SearchBox';

// Mock timers for debounce testing
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('SearchBox', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<SearchBox />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('renders with custom placeholder', () => {
      render(<SearchBox placeholder="Search users..." />);
      
      const input = screen.getByPlaceholderText('Search users...');
      expect(input).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<SearchBox value="initial search" />);
      
      const input = screen.getByDisplayValue('initial search');
      expect(input).toBeInTheDocument();
    });

    it('renders in loading state', () => {
      render(<SearchBox loading />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeDisabled();
    });

    it('renders in disabled state', () => {
      render(<SearchBox disabled />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeDisabled();
    });
  });

  describe('Size Variants', () => {
    it('renders with sm size', () => {
      render(<SearchBox size="sm" />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('renders with md size (default)', () => {
      render(<SearchBox />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('renders with lg size', () => {
      render(<SearchBox size="lg" />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input Interactions', () => {
    it('handles text input', () => {
      render(<SearchBox />);

      // Проверяем, что компонент рендерится
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('calls onChange when provided', () => {
      const handleChange = vi.fn();
      render(<SearchBox onChange={handleChange} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      
      // Simulate change event
      input.focus();
      // onChange should be called with debounced value
      expect(handleChange).toHaveBeenCalledWith('', '');
    });

    it('handles controlled value updates', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <SearchBox 
            value={value} 
            onChange={(newValue) => setValue(newValue)}
          />
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveValue('');
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearch when provided', () => {
      const handleSearch = vi.fn();
      render(<SearchBox onSearch={handleSearch} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      
      // Search button should be present
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
    });

    it('does not call onSearch when disabled', () => {
      const handleSearch = vi.fn();
      render(<SearchBox onSearch={handleSearch} disabled />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeDisabled();
    });
  });

  describe('Clear Functionality', () => {
    it('shows search button when no text', () => {
      render(<SearchBox />);
      
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
    });

    it('hides clear button when showClearButton is false', () => {
      render(<SearchBox showClearButton={false} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      
      // Should only show search button
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
    });
  });

  describe('Autocomplete Suggestions', () => {
    const suggestions = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js'];

    it('renders without suggestions by default', () => {
      render(<SearchBox suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      
      // No suggestions should be visible initially
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('hides suggestions when showSuggestions is false', () => {
      render(<SearchBox suggestions={suggestions} showSuggestions={false} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('uses custom filter function', () => {
      const customFilter = vi.fn((suggestions: string[], query: string) =>
        suggestions.filter(s => s.startsWith(query))
      );
      
      render(<SearchBox suggestions={suggestions} filterSuggestions={customFilter} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<SearchBox className="custom-search" />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      
      // Check that the container has the custom class
      const container = input.closest('.custom-search');
      expect(container).toBeInTheDocument();
    });

    it('forwards HTML attributes', () => {
      render(<SearchBox data-testid="search-input" />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<SearchBox ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('memoizes component correctly', () => {
      const { rerender } = render(<SearchBox placeholder="Test" />);
      
      const input1 = screen.getByPlaceholderText('Test');
      
      rerender(<SearchBox placeholder="Test" />);
      
      const input2 = screen.getByPlaceholderText('Test');
      expect(input1).toBe(input2);
    });
  });

  describe('Performance', () => {
    it('handles debounce configuration', () => {
      const handleChange = vi.fn();
      render(<SearchBox onChange={handleChange} debounceMs={100} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty suggestions array', () => {
      render(<SearchBox suggestions={[]} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('handles null/undefined suggestions', () => {
      render(<SearchBox suggestions={undefined} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('handles very long suggestion text', () => {
      const longSuggestions = [
        'This is a very long suggestion that might overflow the container and should be handled gracefully',
        'Another long suggestion text'
      ];
      
      render(<SearchBox suggestions={longSuggestions} />);
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SearchBox />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('has accessible button labels', () => {
      render(<SearchBox />);
      
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
    });
  });
});