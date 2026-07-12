/**
 * @fileoverview Lucide-иконки для суффиксов метаданных медиа.
 * @module components/editor/properties/components/input/media-metadata-suffix-icons
 */

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Clock,
  FileText,
  Image,
  KeyRound,
  Layers,
  Link2,
  List,
  Mic,
  Music,
  Package,
  ScanSearch,
  Tag,
} from 'lucide-react';

/** Карта суффикса метаданных → иконка lucide */
const METADATA_SUFFIX_ICONS: Record<string, LucideIcon> = {
  file_id: Link2,
  file_unique_id: KeyRound,
  file_size: Package,
  width: ArrowLeftRight,
  height: ArrowUpDown,
  thumbnail: Image,
  duration: Clock,
  file_name: FileText,
  mime_type: Tag,
  title: Music,
  performer: Mic,
  small_file_id: ScanSearch,
  small_width: ArrowLeftRight,
  small_height: ArrowUpDown,
  sizes_count: Layers,
  all_sizes: List,
};

/**
 * Возвращает иконку для суффикса метаданных медиа.
 * @param suffix - Ключ суффикса (например `file_id`)
 * @returns Компонент иконки lucide-react
 */
export function getMetadataSuffixIcon(suffix: string): LucideIcon {
  return METADATA_SUFFIX_ICONS[suffix] ?? Link2;
}
