import type { SkipDataCollectionTemplateParams } from './skip-data-collection.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateSkipDataCollectionCheck(params: SkipDataCollectionTemplateParams): string {
  return renderPartialTemplate('skip-data-collection/skip-data-collection.py.jinja2', params);
}
