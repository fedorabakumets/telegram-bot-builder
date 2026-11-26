/** @fileoverview Справедливое восстановление ожидающих память ботов через общий лимит startBot. */

/** Свежий кандидат; актуальное намерение повторно проверяет исполнитель. */
export interface MemoryWaiter {
  /** ID токена. */
  tokenId: number;
  /** ID проекта для справедливого обхода. */
  projectId: number;
}

/** До пяти попыток одновременно, включая несколько ботов одного проекта. */
export class MemoryRecoveryQueue {
  /** Токены незавершённых попыток не попадают в повторный проход. */
  private readonly activeTokens = new Set<number>();
  /** Повтор одного токена допускается только после следующей проверки памяти. */
  private readonly nextAttempt = new Map<number, number>();
  /** Последний выбранный токен каждого проекта обеспечивает справедливость. */
  private readonly lastToken = new Map<number, number>();
  /** Курсор справедливого обхода проектов. */
  private lastProject = -1;
  /** @param pauseMs - Минимум между повторами токена. @param now - Часы очереди. */
  constructor(private readonly pauseMs = 5_000, private readonly now = Date.now) {}

  /** Выбрать не более пяти токенов свежего снимка, не сериализуя проект целиком. */
  async tick<T extends MemoryWaiter>(waiters: T[], attempt: (waiter: T) => Promise<void>): Promise<void> {
    const known = new Set(waiters.map(item => item.tokenId));
    for (const id of this.nextAttempt.keys()) if (!known.has(id)) this.nextAttempt.delete(id);
    const groups = new Map<number, T[]>();
    const seen = new Set<number>();
    for (const waiter of [...waiters].sort((a, b) => a.tokenId - b.tokenId)) {
      if (seen.has(waiter.tokenId) || this.activeTokens.has(waiter.tokenId)
        || this.now() < (this.nextAttempt.get(waiter.tokenId) ?? 0)) continue;
      seen.add(waiter.tokenId);
      const group = groups.get(waiter.projectId) ?? [];
      group.push(waiter);
      groups.set(waiter.projectId, group);
    }
    for (const [id, group] of groups) {
      const cursor = this.lastToken.get(id) ?? -1;
      groups.set(id, [...group.filter(item => item.tokenId > cursor), ...group.filter(item => item.tokenId <= cursor)]);
    }
    const ids = [...groups.keys()].sort((a, b) => a - b);
    const ordered = [...ids.filter(id => id > this.lastProject), ...ids.filter(id => id <= this.lastProject)];
    const selected: T[] = [];
    const free = Math.max(0, 5 - this.activeTokens.size);
    while (selected.length < free) {
      const before = selected.length;
      for (const id of ordered) {
        const candidate = groups.get(id)!.shift();
        if (!candidate) continue;
        selected.push(candidate);
        this.lastToken.set(id, candidate.tokenId);
        this.lastProject = id;
        if (selected.length === free) break;
      }
      if (selected.length === before) break;
    }
    // Общий лимит пяти запусков и интервал 250 мс применяет startBot, без повторного захвата здесь.
    const results = await Promise.allSettled(selected.map(async candidate => {
      this.activeTokens.add(candidate.tokenId);
      try { await attempt(candidate); }
      finally {
        this.nextAttempt.set(candidate.tokenId, this.now() + this.pauseMs);
        this.activeTokens.delete(candidate.tokenId);
      }
    }));
    const failed = results.find(result => result.status === 'rejected');
    if (failed?.status === 'rejected') throw failed.reason;
  }
}
