/**
 * @fileoverview Типы манифеста version.json в корне репозитория
 * @module shared/version-manifest.types
 */

/** Манифест версии приложения в репозитории */
export interface VersionManifest {
  /** Semver-подобная версия, например 2.2.1.3 */
  version: string;
  /** Дата релиза ISO или YYYY-MM-DD */
  releasedAt?: string;
  /** Ссылка на release notes или раздел релизов */
  notesUrl?: string;
}
