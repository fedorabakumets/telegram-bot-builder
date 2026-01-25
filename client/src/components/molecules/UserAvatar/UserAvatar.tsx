import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/atoms/Icon/Icon";

/**
 * UserAvatar component variants using class-variance-authority
 */
const userAvatarVariants = cva(
  "relative inline-flex items-center justify-center font-medium text-foreground select-none shrink-0",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        md: "h-10 w-10 text-base",
        lg: "h-12 w-12 text-lg",
        xl: "h-16 w-16 text-xl",
        "2xl": "h-20 w-20 text-2xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
        rounded: "rounded-lg",
      },
      variant: {
        default: "bg-muted",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
      variant: "default",
    },
  }
);

/**
 * Status indicator variants
 */
const statusVariants = cva(
  "absolute border-2 border-background rounded-full",
  {
    variants: {
      status: {
        online: "bg-green-500",
        offline: "bg-gray-400",
        away: "bg-yellow-500",
        busy: "bg-red-500",
      },
      size: {
        xs: "h-2 w-2 -bottom-0 -right-0",
        sm: "h-2.5 w-2.5 -bottom-0 -right-0",
        md: "h-3 w-3 -bottom-0.5 -right-0.5",
        lg: "h-3.5 w-3.5 -bottom-0.5 -right-0.5",
        xl: "h-4 w-4 -bottom-1 -right-1",
        "2xl": "h-5 w-5 -bottom-1 -right-1",
      },
    },
  }
);

/**
 * Props for the UserAvatar component
 */
export interface UserAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof userAvatarVariants> {
  /** 
   * User's name for generating initials and alt text
   */
  name?: string;
  
  /** 
   * Avatar image URL
   */
  src?: string;
  
  /** 
   * Alt text for the avatar image
   * Defaults to user's name
   */
  alt?: string;
  
  /** 
   * User's online status
   */
  status?: 'online' | 'offline' | 'away' | 'busy';
  
  /** 
   * Whether to show the status indicator
   * @default false
   */
  showStatus?: boolean;
  
  /** 
   * Custom initials to display (overrides generated initials)
   */
  initials?: string;
  
  /** 
   * Fallback icon when no image or initials are available
   */
  fallbackIcon?: React.ReactNode;
  
  /** 
   * Fallback icon name for Font Awesome icons
   * @default "fa-solid fa-user"
   */
  fallbackIconName?: string;
  
  /** 
   * Whether the avatar is clickable
   */
  clickable?: boolean;
  
  /** 
   * Click handler
   */
  onClick?: () => void;
  
  /** 
   * Loading state
   */
  loading?: boolean;
}

/**
 * Generate initials from a name
 */
const generateInitials = (name: string): string => {
  if (!name) return "";
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate a consistent color based on name
 */
const generateColorFromName = (name: string): string => {
  if (!name) return "";
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    "bg-red-500 text-white",
    "bg-orange-500 text-white",
    "bg-amber-500 text-white",
    "bg-yellow-500 text-black",
    "bg-lime-500 text-black",
    "bg-green-500 text-white",
    "bg-emerald-500 text-white",
    "bg-teal-500 text-white",
    "bg-cyan-500 text-white",
    "bg-sky-500 text-white",
    "bg-blue-500 text-white",
    "bg-indigo-500 text-white",
    "bg-violet-500 text-white",
    "bg-purple-500 text-white",
    "bg-fuchsia-500 text-white",
    "bg-pink-500 text-white",
    "bg-rose-500 text-white",
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Loading skeleton component
 */
const AvatarSkeleton = React.memo<{ size?: UserAvatarProps['size']; shape?: UserAvatarProps['shape'] }>(
  ({ size, shape }) => (
    <div className={cn(userAvatarVariants({ size, shape }), "animate-pulse bg-muted")} />
  )
);

AvatarSkeleton.displayName = "AvatarSkeleton";

/**
 * Status indicator component
 */
const StatusIndicator = React.memo<{
  status: NonNullable<UserAvatarProps['status']>;
  size: UserAvatarProps['size'];
}>(({ status, size }) => (
  <div
    className={statusVariants({ status, size })}
    aria-label={`Status: ${status}`}
    title={`Status: ${status}`}
  />
));

StatusIndicator.displayName = "StatusIndicator";

/**
 * Optimized prop comparison for React.memo
 */
const arePropsEqual = (prevProps: UserAvatarProps, nextProps: UserAvatarProps): boolean => {
  // Compare primitive props
  if (
    prevProps.name !== nextProps.name ||
    prevProps.src !== nextProps.src ||
    prevProps.alt !== nextProps.alt ||
    prevProps.status !== nextProps.status ||
    prevProps.showStatus !== nextProps.showStatus ||
    prevProps.initials !== nextProps.initials ||
    prevProps.fallbackIconName !== nextProps.fallbackIconName ||
    prevProps.clickable !== nextProps.clickable ||
    prevProps.loading !== nextProps.loading ||
    prevProps.size !== nextProps.size ||
    prevProps.shape !== nextProps.shape ||
    prevProps.variant !== nextProps.variant ||
    prevProps.className !== nextProps.className
  ) {
    return false;
  }

  // Compare function props
  if (prevProps.onClick !== nextProps.onClick) {
    return false;
  }

  // Compare React nodes (shallow comparison)
  if (prevProps.fallbackIcon !== nextProps.fallbackIcon) {
    return false;
  }

  return true;
};

/**
 * UserAvatar component for displaying user profile pictures with fallbacks
 * 
 * Features:
 * - Multiple sizes and shapes from design system
 * - Image with fallback to initials or icon
 * - Online status indicator
 * - Automatic color generation based on name
 * - Loading state with skeleton animation
 * - Clickable mode with hover effects
 * - Performance optimized with React.memo and custom prop comparison
 * - Accessible with proper ARIA attributes and alt text
 * 
 * @example
 * ```tsx
 * // Basic avatar with image
 * <UserAvatar 
 *   name="John Doe" 
 *   src="/avatars/john.jpg" 
 * />
 * 
 * // Avatar with initials fallback
 * <UserAvatar 
 *   name="Jane Smith" 
 *   size="lg"
 *   shape="rounded"
 * />
 * 
 * // Avatar with status indicator
 * <UserAvatar
 *   name="Alice Johnson"
 *   status="online"
 *   showStatus
 *   clickable
 *   onClick={() => console.log('Avatar clicked')}
 * />
 * 
 * // Loading avatar
 * <UserAvatar loading size="xl" />
 * 
 * // Custom fallback icon
 * <UserAvatar
 *   fallbackIcon={<CustomIcon />}
 *   variant="primary"
 * />
 * ```
 */
const UserAvatar = React.memo(
  React.forwardRef<HTMLDivElement, UserAvatarProps>(
    ({
      className,
      size,
      shape,
      variant,
      name = "",
      src,
      alt,
      status,
      showStatus = false,
      initials: customInitials,
      fallbackIcon,
      fallbackIconName = "fa-solid fa-user",
      clickable = false,
      onClick,
      loading = false,
      ...props
    }, ref) => {
      const [imageError, setImageError] = React.useState(false);
      const [imageLoaded, setImageLoaded] = React.useState(false);
      
      // Reset image error when src changes
      React.useEffect(() => {
        setImageError(false);
        setImageLoaded(false);
      }, [src]);

      // Generate initials and color
      const generatedInitials = React.useMemo(() => {
        return customInitials || generateInitials(name);
      }, [customInitials, name]);

      const colorClass = React.useMemo(() => {
        if (variant !== "default") return "";
        return generateColorFromName(name);
      }, [name, variant]);

      // Determine if avatar should be interactive
      const isInteractive = clickable || !!onClick;

      // Handle image load error
      const handleImageError = React.useCallback(() => {
        setImageError(true);
      }, []);

      // Handle image load success
      const handleImageLoad = React.useCallback(() => {
        setImageLoaded(true);
      }, []);

      // Handle click
      const handleClick = React.useCallback(() => {
        if (onClick && !loading) {
          onClick();
        }
      }, [onClick, loading]);

      // Handle keyboard interaction
      const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !loading) {
          e.preventDefault();
          onClick();
        }
      }, [onClick, loading]);

      // Determine what to render inside the avatar
      const avatarContent = React.useMemo(() => {
        if (loading) {
          return null; // Skeleton will be rendered instead
        }

        // Try to show image first
        if (src && !imageError) {
          return (
            <img
              src={src}
              alt={alt || name || "User avatar"}
              className={cn(
                "h-full w-full object-cover",
                shape === "circle" && "rounded-full",
                shape === "square" && "rounded-md",
                shape === "rounded" && "rounded-lg",
                !imageLoaded && "opacity-0"
              )}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          );
        }

        // Show initials if available
        if (generatedInitials) {
          return <span className="font-semibold">{generatedInitials}</span>;
        }

        // Show fallback icon
        if (fallbackIcon) {
          return fallbackIcon;
        }

        return <Icon name={fallbackIconName} size={size === "xs" ? "xs" : size === "sm" ? "sm" : "md"} />;
      }, [
        loading,
        src,
        imageError,
        imageLoaded,
        alt,
        name,
        shape,
        generatedInitials,
        fallbackIcon,
        fallbackIconName,
        size,
        handleImageError,
        handleImageLoad,
      ]);

      if (loading) {
        return <AvatarSkeleton size={size} shape={shape} />;
      }

      return (
        <div
          ref={ref}
          className={cn(
            userAvatarVariants({ size, shape, variant }),
            variant === "default" && colorClass,
            isInteractive && "cursor-pointer hover:opacity-80 transition-opacity",
            className
          )}
          onClick={isInteractive ? handleClick : undefined}
          onKeyDown={isInteractive ? handleKeyDown : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          role={isInteractive ? "button" : undefined}
          aria-label={isInteractive ? `${name || "User"} avatar` : undefined}
          {...props}
        >
          {avatarContent}
          
          {/* Status indicator */}
          {showStatus && status && (
            <StatusIndicator status={status} size={size} />
          )}
        </div>
      );
    }
  ),
  arePropsEqual
);

UserAvatar.displayName = "UserAvatar";

export { UserAvatar, userAvatarVariants, statusVariants };