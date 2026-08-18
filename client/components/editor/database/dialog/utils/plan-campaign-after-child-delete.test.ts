/**
 * @fileoverview План обновления кампании после удаления дочерней рассылки
 * @module editor/database/dialog/utils/plan-campaign-after-child-delete.test
 */

import { describe, expect, it } from 'vitest';
import { planCampaignAfterChildDelete } from '../../../../../../server/routes/botIntegration/handlers/broadcasts/plan-campaign-after-child-delete';

describe('planCampaignAfterChildDelete', () => {
  it('удаляет кампанию, если ботов не осталось', () => {
    expect(planCampaignAfterChildDelete([])).toEqual({ action: 'delete' });
  });

  it('оставляет tokenIds оставшихся ботов', () => {
    expect(planCampaignAfterChildDelete([{ tokenId: 7 }, { tokenId: 9 }])).toEqual({
      action: 'update',
      tokenIds: [7, 9],
    });
  });
});
