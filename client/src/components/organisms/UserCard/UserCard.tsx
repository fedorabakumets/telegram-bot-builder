/**
 * UserCard Component
 * 
 * A comprehensive user card component that displays user information
 * with customizable actions. Supports both compact and detailed variants
 * for different use cases.
 * 
 * @example
 * ```tsx
 * <UserCard
 *   user={{
 *     id: '1',
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     avatar: '/avatars/john.jpg',
 *     role: 'Admin',
 *     status: 'online'
 *   }}
 *   variant="detailed"
 *   actions={[
 *     { label: 'Edit', onClick: () => {}, variant: 'primary' },
 *     { label: 'Delete', onClick: () => {}, variant: 'destructive' }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import { cn } from '@/design-system';
import { cva, type VariantProps } from 'class-variance-authority';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Icon } from '@/components/atoms/Icon';

const userCardVariants = cva(
  'bg-card border border-border rounded-lg transition-colors',
  {
    variants: {
      variant: {
        compact: 'p-4',
        detailed: 'p-6',
      },
      interactive: {
        true: 'hover:bg-accent/50 cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'compact',
      interactive: false,
    },
  }
);

const userInfoVariants = cva(
  'flex items-center gap-3',
  {
    variants: {
      variant: {
        compact: 'gap-3',
        detailed: 'gap-4',
      },
    },
    defaultVariants: {
      variant: 'compact',
    },
  }
);

const userDetailsVariants = cva(
  'flex-1 min-w-0',
  {
    variants: {
      variant: {
        compact: 'space-y-0.5',
        detailed: 'space-y-1',
      },
    },
    defaultVariants: {
      variant: 'compact',
    },
  }
);

export interface User {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email?: string;
  /** Avatar image URL */
  avatar?: string;
  /** User's role or title */
  role?: string;
  /** User's online status */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** Additional user metadata */
  metadata?: Record<string, any>;
}

export interface UserCardAction {
  /** Action label */
  label: string;
  /** Action handler */
  onClick: () => void;
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Action icon */
  icon?: string;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Whether action is loading */
  loading?: boolean;
}

export interface UserCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof userCardVariants> {
  /** User data to display */
  user: User;
  /** Custom actions for the user */
  actions?: UserCardAction[];
  /** Whether to show user status */
  showStatus?: boolean;
  /** Whether to show user email */
  showEmail?: boolean;
  /** Whether to show user role */
  showRole?: boolean;
  /** Custom content to display below user info */
  children?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Click handler for the entire card */
  onCardClick?: () => void;
  /** Maximum number of actions to show inline */
  maxInlineActions?: number;
}

const UserCardSkeleton = React.memo<{ variant?: 'compact' | 'detailed' }>(
  ({ variant = 'compact' }) => (
    <div className={cn(userCardVariants({ variant }))}>
      <div className={cn(userInfoVariants({ variant }))}>
        <div
          className={cn(
            'rounded-full bg-muted animate-pulse',
            variant === 'compact' ? 'h-10 w-10' : 'h-12 w-12'
          )}
        />
        <div className={cn(userDetailsVariants({ variant }))}>
          <div className="h-4 bg-muted rounded animate-pulse w-24" />
          {variant === 'detailed' && (
            <>
              <div className="h-3 bg-muted rounded animate-pulse w-32" />
              <div className="h-3 bg-muted rounded animate-pulse w-16" />
            </>
          )}
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
);

UserCardSkeleton.displayName = 'UserCardSkeleton';

export const UserCard = React.memo(
  React.forwardRef<HTMLDivElement, UserCardProps>(
    (
      {
        user,
        actions = [],
        showStatus = true,
        showEmail = true,
        showRole = true,
        children,
        loading = false,
        onCardClick,
        maxInlineActions = 2,
        variant,
        interactive,
        className,
        ...props
      },
      ref
    ) => {
      const isInteractive = Boolean(onCardClick) || interactive;
      
      // Split actions into inline and overflow
      const inlineActions = actions.slice(0, maxInlineActions);
      const overflowActions = actions.slice(maxInlineActions);
      
      const handleCardClick = React.useCallback(
        (e: React.MouseEvent) => {
          // Don't trigger card click if clicking on an action button
          if ((e.target as HTMLElement).closest('button')) {
            return;
          }
          onCardClick?.();
        },
        [onCardClick]
      );

      const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
          if ((e.key === 'Enter' || e.key === ' ') && onCardClick) {
            e.preventDefault();
            onCardClick();
          }
        },
        [onCardClick]
      );

      if (loading) {
        return <UserCardSkeleton variant={variant} />;
      }

      return (
        <div
          ref={ref}
          className={cn(
            userCardVariants({ variant, interactive: isInteractive }),
            className
          )}
          onClick={isInteractive ? handleCardClick : undefined}
          onKeyDown={isInteractive ? handleKeyDown : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          role={isInteractive ? 'button' : undefined}
          aria-label={isInteractive ? `User card for ${user.name}` : undefined}
          {...props}
        >
          <div className={cn(userInfoVariants({ variant }))}>
            {/* User Avatar */}
            <UserAvatar
              name={user.name}
              src={user.avatar}
              status={user.status}
              showStatus={showStatus}
              size={variant === 'detailed' ? 'lg' : 'md'}
            />

            {/* User Details */}
            <div className={cn(userDetailsVariants({ variant }))}>
              <Typography
                variant={variant === 'detailed' ? 'body-lg' : 'body-md'}
                weight="semibold"
                className="text-foreground truncate"
              >
                {user.name}
              </Typography>

              {showEmail && user.email && (
                <Typography
                  variant={variant === 'detailed' ? 'body-sm' : 'body-xs'}
                  className="text-muted-foreground truncate"
                >
                  {user.email}
                </Typography>
              )}

              {showRole && user.role && (
                <Typography
                  variant="body-xs"
                  className="text-muted-foreground"
                >
                  {user.role}
                </Typography>
              )}
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {inlineActions.map((action, index) => (
                  <Button
                    key={`${action.label}-${index}`}
                    variant={action.variant || 'outline'}
                    size="sm"
                    disabled={action.disabled}
                    loading={action.loading}
                    onClick={action.onClick}
                    className="flex-shrink-0"
                  >
                    {action.icon && (
                      <Icon
                        name={action.icon}
                        size="xs"
                        className="mr-1"
                      />
                    )}
                    {action.label}
                  </Button>
                ))}

                {/* Overflow menu for additional actions */}
                {overflowActions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Icon name="fa-solid fa-ellipsis-vertical" size="xs" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Custom Content */}
          {children && (
            <div className="mt-4 pt-4 border-t border-border">
              {children}
            </div>
          )}
        </div>
      );
    }
  )
);

UserCard.displayName = 'UserCard';

export default UserCard;