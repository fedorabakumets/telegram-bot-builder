// Main bot generator
export * from './bot-generator';
export * from './commands';
export * from './queryClient';
export * from './Keyboard/generateButtonResponseHandlers';
export * from './generate/generateMediaFileFunctions';
export * from './utils/extractNodeData';
export * from './Keyboard/filterInlineNodes';
export * from './utils/addAutoTransitionNodes';
export * from './Synonyms';
export * from './bot-commands-setup';

// Command handlers
export * from './CommandHandler';

// Conditional logic
export * from './Conditional';

// Formatting utilities
export * from './format';

// Feature detection
export { hasMediaNodes } from './utils/hasMediaNodes';
export { hasInputCollection } from './utils/hasInputCollection';
export { hasInlineButtons } from './utils/hasInlineButtons';
export { hasAutoTransitions } from './utils/hasAutoTransitions';
export { hasMultiSelectNodes } from './utils/hasMultiSelectNodes';
export { hasCommandButtons } from './utils/hasCommandButtons';
export { hasConditionalButtons } from './utils/hasConditionalButtons';
export { hasLocationFeatures } from './utils/hasLocationFeatures';

// Keyboard generators
export * from './Keyboard';

// Code mapping utilities
export * from './map-utils';

// Media handlers
export * from './MediaHandler';

// Message handlers
export * from './MessageHandler';

// Project scaffolding
export * from './scaffolding';

// Storage utilities
export * from './storage';

// Synonym handlers
export * from './Synonyms';

// User management handlers
export * from './UserHandler';

// Types
export * from './types/bot-node';

// Additional utilities
export { addInputTargetNodes } from './utils/addInputTargetNodes';

// Collection utilities
export { collectInputTargetNodes } from './utils/collectInputTargetNodes';

// Code generation utilities
// NOTE: Individual exports added above to prevent conflicts
// export * from './generate';


// General utilities
export * from './utils';

// Validation utilities
// NOTE: Already exported via commands.ts to prevent conflicts
// export * from './validate';

