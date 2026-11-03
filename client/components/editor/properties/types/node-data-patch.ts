/** @fileoverview Тип частичного обновления данных узла до применения значений по умолчанию. */
import type { z } from 'zod';
import { nodeSchema } from '@shared/schema';

/** Изменяемые поля узла в исходном формате проекта. */
export type NodeDataPatch = Partial<z.input<typeof nodeSchema>['data']>;
