# Template Components

This directory contains page layout templates following the Atomic Design methodology. These templates provide complete page structures for different use cases in the Telegram Bot Builder application.

## Available Templates

### DashboardLayout

A comprehensive layout for administrative pages with integrated navigation, sidebar, header, and responsive design.

**Features:**
- Responsive sidebar with collapse functionality
- Integrated navigation component support
- Customizable header with breadcrumbs and actions
- Mobile-friendly with overlay navigation
- Theme support (light/dark)
- Flexible content padding options

**Usage:**
```tsx
import { DashboardLayout } from '@/components/templates';
import { Navigation } from '@/components/organisms';

<DashboardLayout
  navigation={<Navigation>...</Navigation>}
  pageTitle="Dashboard"
  sidebarCollapsed={false}
  onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
  headerActions={<Button>Action</Button>}
  breadcrumbs={<Breadcrumbs />}
>
  <YourPageContent />
</DashboardLayout>
```

### EditorLayout

Specialized layout for the bot editor with resizable panels, canvas area, and toolbar.

**Features:**
- Resizable panels (left, right, top, bottom)
- Centered canvas area for visual editing
- Customizable toolbar
- Panel collapse/expand functionality
- Optimized for editor workflows
- Drag-to-resize panel boundaries

**Usage:**
```tsx
import { EditorLayout } from '@/components/templates';

<EditorLayout
  toolbar={<EditorToolbar />}
  leftPanel={<PropertiesPanel />}
  rightPanel={<ComponentsSidebar />}
  bottomPanel={<CodePanel />}
  resizable={true}
>
  <Canvas />
</EditorLayout>
```

### AuthLayout

Centered layout for authentication pages with optional split-screen design.

**Features:**
- Centered form container
- Split-screen layout option with side content
- Logo and branding support
- Loading states and error handling
- Responsive design
- Multiple background variants (default, gradient, pattern)

**Usage:**
```tsx
import { AuthLayout } from '@/components/templates';

<AuthLayout
  variant="split"
  title="Welcome Back"
  subtitle="Sign in to your account"
  logo={<Logo />}
  sideContent={<WelcomeContent />}
  footer={<AuthFooter />}
>
  <LoginForm />
</AuthLayout>
```

## Design Principles

### Responsive Design
All templates are built with mobile-first responsive design:
- Automatic sidebar collapse on mobile devices
- Touch-friendly interactions
- Adaptive layouts for different screen sizes

### Theme Integration
Templates integrate with the design system theme provider:
- Automatic theme switching (light/dark)
- CSS custom properties for consistent styling
- Theme-aware component variants

### Accessibility
Templates follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly structure
- Focus management

### Performance
Templates are optimized for performance:
- React.memo for preventing unnecessary re-renders
- Efficient event handling
- Minimal DOM updates during interactions

## Component Architecture

### Props Interface
Each template follows a consistent props interface pattern:
- `children`: Main content area
- `variant`: Layout variant options
- Event handlers with `on` prefix
- Boolean flags for state management
- Optional customization props

### Composition Pattern
Templates use composition over configuration:
- Accept React components as props
- Flexible content areas
- Customizable sub-components
- Extensible through props

### State Management
Templates manage their own internal state:
- Responsive behavior detection
- Panel collapse/expand states
- Mobile menu handling
- Theme integration

## Integration with Design System

### Design Tokens
Templates use design system tokens for:
- Colors and theming
- Spacing and layout
- Typography scales
- Shadow and elevation

### Component Dependencies
Templates depend on lower-level components:
- **Atoms**: Button, Icon, Typography, Input, Label
- **Molecules**: FormField, SearchBox, UserAvatar
- **Organisms**: Navigation, DataTable, UserCard

### Utility Integration
Templates integrate with design system utilities:
- `cn()` for className merging
- `cva()` for variant management
- Theme hooks for dynamic styling

## Examples

See `examples.tsx` for complete implementation examples showing:
- Real-world usage patterns
- Integration with other components
- Responsive behavior
- Theme switching
- State management

## Testing

Templates can be tested using:
- Component rendering tests
- Responsive behavior tests
- Theme switching tests
- Accessibility tests
- Integration tests with child components

## Migration Guide

When migrating existing pages to use templates:

1. **Identify Layout Pattern**: Choose the appropriate template
2. **Extract Content**: Separate layout from content logic
3. **Configure Props**: Set up template-specific props
4. **Test Responsive**: Verify mobile and desktop behavior
5. **Validate Accessibility**: Ensure proper ARIA and keyboard support

## Performance Considerations

### Bundle Size
Templates are designed to be tree-shakeable:
- Import only what you need
- Lazy loading for heavy components
- Minimal external dependencies

### Runtime Performance
- Efficient re-rendering through React.memo
- Optimized event handlers
- Minimal state updates
- Proper dependency arrays in hooks

### Memory Usage
- Cleanup of event listeners
- Proper component unmounting
- Efficient state management
- Garbage collection friendly patterns