/**
 * @fileoverview Тег OpenAPI для GET …/bot/statuses
 * @module lib/tests/project-tag-bot-statuses.test
 */

import assert from 'node:assert/strict';
import { inferProjectTag } from '../../server/swagger/project-tag-rules.ts';

assert.equal(inferProjectTag('/api/projects/{id}/bot/statuses'), 'project-bot');
assert.equal(inferProjectTag('/api/projects/{id}/bot/start-offline-all'), 'project-bot');
console.log('project-tag-bot-statuses.test: ok');
