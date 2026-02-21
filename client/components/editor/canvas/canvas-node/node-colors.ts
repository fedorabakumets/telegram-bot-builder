/**
 * @fileoverview Константы цветов для различных типов узлов
 * 
 * Содержит сопоставление типов узлов с цветовыми схемами
 * для визуального выделения.
 */

/**
 * Цвета для различных типов узлов
 *
 * @description Объект, сопоставляющий типы узлов с соответствующими им цветовыми стилями
 */
export const nodeColors: Record<string, string> = {
  start: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  message: 'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  photo: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  video: 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  audio: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  document: 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
  keyboard: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  command: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  sticker: 'bg-gradient-to-br from-pink-50 to-fuchsia-100 dark:from-pink-900/30 dark:to-fuchsia-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800',
  voice: 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  animation: 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  location: 'bg-gradient-to-br from-green-50 to-lime-100 dark:from-green-900/30 dark:to-lime-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800',
  contact: 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
  pin_message: 'bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-900/40 dark:to-blue-800/40 text-cyan-700 dark:text-cyan-300 border-2 border-cyan-300 dark:border-cyan-700/50 shadow-lg shadow-cyan-500/20',
  unpin_message: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900/40 dark:to-gray-800/40 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700/50 shadow-lg shadow-slate-500/20',
  delete_message: 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-800/40 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700/50 shadow-lg shadow-red-500/20',
  ban_user: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700/50 shadow-lg shadow-red-500/20',
  unban_user: 'bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-800/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700/50 shadow-lg shadow-emerald-500/20',
  mute_user: 'bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/40 dark:to-amber-800/40 text-orange-700 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700/50 shadow-lg shadow-orange-500/20',
  unmute_user: 'bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/40 dark:to-blue-800/40 text-sky-700 dark:text-sky-300 border-2 border-sky-300 dark:border-sky-700/50 shadow-lg shadow-sky-500/20',
  kick_user: 'bg-gradient-to-br from-rose-100 to-pink-200 dark:from-rose-900/40 dark:to-pink-800/40 text-rose-700 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-700/50 shadow-lg shadow-rose-500/20',
  promote_user: 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-800/40 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-300 dark:border-yellow-700/50 shadow-lg shadow-yellow-500/20',
  demote_user: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900/40 dark:to-gray-800/40 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700/50 shadow-lg shadow-slate-500/20',
  admin_rights: 'bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900/40 dark:to-purple-800/40 text-violet-800 dark:text-violet-200 border-2 border-violet-300 dark:border-violet-700/50 shadow-xl shadow-violet-500/25 ring-1 ring-violet-400/30 dark:ring-violet-600/30',
  input: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800',
  condition: 'bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  broadcast: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
};
