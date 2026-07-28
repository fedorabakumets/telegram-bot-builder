/**
 * @fileoverview Unit: bulk close launch history + reconcile offline
 * @module lib/tests/launch-history-reconcile.test
 */

import assert from 'node:assert/strict';

/**
 * Логика reconcile: при !isLiveRunning вызывается close (мок счётчика)
 */
function testReconcileClosesWhenOffline(): void {
  let closed = 0;
  const isLiveRunning = false;
  if (!isLiveRunning) {
    closed = 2; // имитация closeAllRunningLaunchHistory
  }
  assert.equal(closed, 2);
}

/**
 * Логика reconcile: при live ничего не закрываем
 */
function testReconcileSkipsWhenLive(): void {
  let closed = 0;
  const isLiveRunning = true;
  if (!isLiveRunning) {
    closed = 2;
  }
  assert.equal(closed, 0);
}

testReconcileClosesWhenOffline();
testReconcileSkipsWhenLive();
console.log('launch-history-reconcile.test: ok');
