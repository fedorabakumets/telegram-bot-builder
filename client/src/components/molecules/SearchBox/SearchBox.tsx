import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/design-system";
import { Input } from "@/components/atoms/Input/Input";
import { Icon } from "@/components/atoms/Icon/Icon";

/**
 * SearchBox component variants using class-variance-authority
 */
const searchBoxVariants = cva(
  "relative w-full",
  {
    variants: {
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Props for the SearchBox component
 */
export interface SearchBoxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'>,
    VariantProps<typeof searchBoxVariants> {
  /** 
   * Current search value
   */
  value?: string;
  
  /** 
   * Callback when search value changes
   * Includes debounced value for optimization
   */
  onChange?: (value: string, debouncedValue: string) => void;
  
  /** 
   * Callback when search is submitted (Enter key or search icon click)
   */
  onSearch?: (value: string) => void;
  
  /** 
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;
  
  /** 
   * Whether to show clear button when there's text
   * @default true
   */
  showClearButton?: boolean;
  
  /** 
   * Whether the search is in loading state
   */
  loading?: boolean;
  
  /** 
   * Autocomplete suggestions
   */
  suggestions?: string[];
  
  /** 
   * Callback when a suggestion is selected
   */
  onSuggestionSelect?: (suggestion: string) => void;
  
  /** 
   * Whether to show suggestions dropdown
   * @default true when suggestions are provided
   */
  showSuggestions?: boolean;
  
  /** 
   * Maximum number of suggestions to show
   * @default 5
   */
  maxSuggestions?: number;
  
  /** 
   * Custom filter function for suggestions
   * @default case-insensitive includes filter
   */
  filterSuggestions?: (suggestions: string[], query: string) => string[];
}

/**
 * Custom hook for debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Default suggestion filter function
 */
const defaultFilterSuggestions = (suggestions: string[], query: string): string[] => {
  if (!query.trim()) return [];
  
  return suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * SearchBox component with autocomplete, debouncing, and filtering capabilities
 * 
 * Features:
 * - Debounced input for performance optimization
 * - Autocomplete with dropdown suggestions
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Clear button functionality
 * - Loading state support
 * - Customizable suggestion filtering
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * ```tsx
 * // Basic search box
 * <SearchBox
 *   placeholder="Search users..."
 *   onChange={(value, debouncedValue) => console.log(value, debouncedValue)}
 *   onSearch={(value) => console.log('Search:', value)}
 * />
 * 
 * // With autocomplete suggestions
 * <SearchBox
 *   suggestions={['React', 'Vue', 'Angular', 'Svelte']}
 *   onSuggestionSelect={(suggestion) => console.log('Selected:', suggestion)}
 *   debounceMs={500}
 * />
 * 
 * // Loading state
 * <SearchBox
 *   loading
 *   placeholder="Searching..."
 *   value="search query"
 * />
 * ```
 */
const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(
  ({
    className,
    size,
    value = "",
    onChange,
    onSearch,
    debounceMs = 300,
    showClearButton = true,
    loading = false,
    suggestions = [],
    onSuggestionSelect,
    showSuggestions = true,
    maxSuggestions = 5,
    filterSuggestions = defaultFilterSuggestions,
    placeholder = "Search...",
    disabled,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    
    // Debounced value for optimization
    const debouncedValue = useDebounce(internalValue, debounceMs);
    
    // Filtered suggestions
    const filteredSuggestions = React.useMemo(() => {
      if (!showSuggestions || !suggestions.length) return [];
      
      const filtered = filterSuggestions(suggestions, internalValue);
      return filtered.slice(0, maxSuggestions);
    }, [suggestions, internalValue, showSuggestions, maxSuggestions, filterSuggestions]);

    // Update internal value when prop changes
    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Call onChange with debounced value
    React.useEffect(() => {
      if (onChange) {
        onChange(internalValue, debouncedValue);
      }
    }, [debouncedValue]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setSelectedIndex(-1);
      setShowDropdown(newValue.length > 0 && filteredSuggestions.length > 0);
    };

    // Handle search submission
    const handleSearch = () => {
      if (onSearch && !disabled) {
        onSearch(internalValue);
      }
      setShowDropdown(false);
    };

    // Handle clear button click
    const handleClear = () => {
      setInternalValue("");
      setShowDropdown(false);
      setSelectedIndex(-1);
      if (onChange) {
        onChange("", "");
      }
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: string) => {
      setInternalValue(suggestion);
      setShowDropdown(false);
      setSelectedIndex(-1);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      if (onChange) {
        onChange(suggestion, suggestion);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      
      if (!showDropdown || !filteredSuggestions.length) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearch();
        } else if (e.key === 'Escape') {
          handleClear();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSuggestionSelect(filteredSuggestions[selectedIndex]);
          } else {
            handleSearch();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    };

    // Show dropdown when input is focused and has suggestions
    const handleFocus = () => {
      if (filteredSuggestions.length > 0) {
        setShowDropdown(true);
      }
    };

    // Determine end icon
    const endIcon = React.useMemo(() => {
      if (loading) {
        return null; // Input component handles loading spinner
      }
      
      if (showClearButton && internalValue && !disabled) {
        return (
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <Icon name="fa-solid fa-times" size="sm" />
          </button>
        );
      }
      
      return (
        <button
          type="button"
          onClick={handleSearch}
          className="hover:text-foreground transition-colors"
          aria-label="Search"
          disabled={disabled}
        >
          <Icon name="fa-solid fa-search" size="sm" />
        </button>
      );
    }, [loading, showClearButton, internalValue, disabled]);

    return (
      <div className={cn(searchBoxVariants({ size }), className)}>
        <Input
          ref={ref}
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          loading={loading}
          size={size}
          endIcon={!loading ? endIcon : undefined}
          {...props}
        />
        
        {/* Suggestions dropdown */}
        {showDropdown && filteredSuggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  index === selectedIndex && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SearchBox.displayName = "SearchBox";

export { SearchBox, searchBoxVariants };