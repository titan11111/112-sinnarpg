/**
 * 九州電鉄 DX — ゲーム状態（グローバル変数）
 * 実行時のみ変更される状態を一括管理する
 */
(function (global) {
  'use strict';

  global.gameMode = 'npc';
  global.totalYears = 5;
  global.playerCount = 2;
  global.currentMonth = 1;
  global.currentYear = 1;
  global.currentPlayerIdx = 0;
  global.players = [];
  global.mapData = { nodes: [], links: [] };
  global.goal = null;
  global.diceValue = 1;
  global.isRolling = false;
  global.remainingSteps = 0;
  global.expressMultiplier = 1;
  global.discountRate = 0;    // 割引カード用
  global.globalDiscount = 0;  // 月イベント用（MONTH_EVENTS から参照）
  global.seasonBonus = '';
  global.waitingForSettlement = false;
  global.waitingForEvent = false;
  global.waitingForBinbou = false;
  global.waitingForToll = false;
  global.binbouOwner = -1;
  global.binbouTurns = 0;
  global.binbouIsKing = false;
  global.skipTurn = [];
  global.heroEffects = {};
  global.modalQueue = [];
  global.currentModalType = '';  // '' | 'toll' | 'event' | 'binbou' | 'hero'
  global.viewportDragOffset = { x: 0, y: 0 };
  global.turnPhase = 'idle';  // idle | rolling | moving | arriving
})(typeof window !== 'undefined' ? window : this);
