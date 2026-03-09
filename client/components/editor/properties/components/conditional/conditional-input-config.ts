/**
 * @fileoverview Конфигурация переключателей ввода для условных сообщений
 */

export interface ConditionalInputToggleConfig {
  type: 'enableTextInput' | 'enablePhotoInput' | 'enableVideoInput' | 'enableAudioInput' | 'enableDocumentInput';
  icon: string;
  title: string;
  description: string;
  colors: { bg: string; border: string; hoverBorder: string; text: string; textDark: string; desc: string; descDark: string; };
}

export const CONDITIONAL_TOGGLE_CONFIGS: ConditionalInputToggleConfig[] = [
  {
    type: 'enableTextInput',
    icon: 'fa-keyboard',
    title: 'Текстовый ввод',
    description: 'Принимать текстовые сообщения',
    colors: { bg: 'from-blue-50/60 to-cyan-50/40 dark:from-blue-950/30 dark:to-cyan-950/20', border: 'border-blue-200/40 dark:border-blue-700/40', hoverBorder: 'hover:border-blue-300/60 dark:hover:border-blue-600/60', text: 'text-blue-700 dark:text-blue-300', textDark: 'text-blue-600 dark:text-blue-400', desc: 'text-blue-600', descDark: 'text-blue-400' }
  },
  {
    type: 'enablePhotoInput',
    icon: 'fa-image',
    title: 'Ввод фото',
    description: 'Ожидать фото от пользователя',
    colors: { bg: 'from-green-50/60 to-emerald-50/40 dark:from-green-950/30 dark:to-emerald-950/20', border: 'border-green-200/40 dark:border-green-700/40', hoverBorder: 'hover:border-green-300/60 dark:hover:border-green-600/60', text: 'text-green-700 dark:text-green-300', textDark: 'text-green-600 dark:text-green-400', desc: 'text-green-600', descDark: 'text-green-400' }
  },
  {
    type: 'enableVideoInput',
    icon: 'fa-video',
    title: 'Ввод видео',
    description: 'Ожидать видео от пользователя',
    colors: { bg: 'from-red-50/60 to-pink-50/40 dark:from-red-950/30 dark:to-pink-950/20', border: 'border-red-200/40 dark:border-red-700/40', hoverBorder: 'hover:border-red-300/60 dark:hover:border-red-600/60', text: 'text-red-700 dark:text-red-300', textDark: 'text-red-600 dark:text-red-400', desc: 'text-red-600', descDark: 'text-red-400' }
  },
  {
    type: 'enableAudioInput',
    icon: 'fa-music',
    title: 'Ввод аудио',
    description: 'Ожидать аудио от пользователя',
    colors: { bg: 'from-yellow-50/60 to-orange-50/40 dark:from-yellow-950/30 dark:to-orange-950/20', border: 'border-yellow-200/40 dark:border-yellow-700/40', hoverBorder: 'hover:border-yellow-300/60 dark:hover:border-yellow-600/60', text: 'text-yellow-700 dark:text-yellow-300', textDark: 'text-yellow-600 dark:text-yellow-400', desc: 'text-yellow-600', descDark: 'text-yellow-400' }
  },
  {
    type: 'enableDocumentInput',
    icon: 'fa-file',
    title: 'Ввод документа',
    description: 'Ожидать документ от пользователя',
    colors: { bg: 'from-purple-50/60 to-indigo-50/40 dark:from-purple-950/30 dark:to-indigo-950/20', border: 'border-purple-200/40 dark:border-purple-700/40', hoverBorder: 'hover:border-purple-300/60 dark:hover:border-purple-600/60', text: 'text-purple-700 dark:text-purple-300', textDark: 'text-purple-600 dark:text-purple-400', desc: 'text-purple-600', descDark: 'text-purple-400' }
  }
];
