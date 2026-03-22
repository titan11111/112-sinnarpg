/**
 * 九州電鉄 DX — ビンボー神（効果音統合版）
 */
(function (global) {
  'use strict';

  var BINBOU_KING_TURNS = global.BINBOU_KING_TURNS;
  var BINBOU_KING_CHANCE = global.BINBOU_KING_CHANCE;

  function SM() { return global.SoundManager; }

  function finishTurnWithBinbou() {
    var binbouOwner = global.binbouOwner;
    var currentPlayerIdx = global.currentPlayerIdx;
    if (binbouOwner === currentPlayerIdx) {
      global.binbouTurns++;
      if (global.binbouTurns >= BINBOU_KING_TURNS && !global.binbouIsKing && Math.random() > BINBOU_KING_CHANCE) {
        global.binbouIsKing = true;
        if (SM()) SM().playSeKingEvolution();
        global.addLog('⚡ キングビンボーに進化！！');
        global.showFlash('#7f1d1d');
        if (typeof global.showKingCrack === 'function') global.showKingCrack();
      }
      doBinbouAction();
      return;
    }
    global.finishTurn();
  }

  function doBinbouAction() {
    if (global.currentModalType) { global.modalQueue.push({ type: 'binbou' }); return; }
    global.currentModalType = 'binbou';
    var binbouOwner = global.binbouOwner;
    var binbouIsKing = global.binbouIsKing;
    var p = global.players[binbouOwner];
    global.waitingForBinbou = true;
    var desc = '', icon = binbouIsKing ? '👹' : '👻', title = binbouIsKing ? 'キングビンボー！' : 'ビンボー神の仕業！';
    if (binbouIsKing) {
      var r = Math.random();
      if (r < 0.4) {
        var loss = 3000 + Math.floor(Math.random() * 5000);
        p.money -= loss;
        desc = loss.toLocaleString() + '万円をバラ撒いた！';
      } else if (r < 0.7 && p.properties.length > 0) {
        var pi = Math.floor(Math.random() * p.properties.length);
        var removed = p.properties.splice(pi, 1)[0];
        var refund = Math.floor(removed.price * 0.25);
        p.money += refund;
        desc = removed.name + 'を叩き売り！(' + refund + '万円回収)';
      } else {
        var loss2 = 5000 + Math.floor(Math.random() * 3000);
        p.money -= loss2;
        desc = '大暴走！' + loss2.toLocaleString() + '万円消滅！';
      }
      global.showFlash('#7f1d1d');
    } else {
      var r2 = Math.random();
      if (r2 < 0.5) {
        var loss3 = 500 + Math.floor(Math.random() * 1500);
        p.money -= loss3;
        desc = loss3.toLocaleString() + '万円を散財…';
      } else if (r2 < 0.75 && p.cards.length > 0) {
        var ci = Math.floor(Math.random() * p.cards.length);
        var cc = p.cards.splice(ci, 1)[0];
        desc = cc.name + 'を捨てられた…';
      } else {
        var loss4 = 800 + Math.floor(Math.random() * 1200);
        p.money -= loss4;
        desc = 'いたずらで' + loss4.toLocaleString() + '万円の被害…';
      }
      global.showFlash('#6b7280');
    }
    if (SM()) SM().playSeBinbou();
    global.addLog(title + ' ' + desc);
    var iconEl = document.getElementById('binbou-modal-icon');
    var titleEl = document.getElementById('binbou-modal-title');
    var descEl = document.getElementById('binbou-modal-desc');
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    document.getElementById('binbou-modal').classList.remove('hidden');
    global.updateUI();
  }

  function closeBinbouModal() {
    document.getElementById('binbou-modal').classList.add('hidden');
    global.waitingForBinbou = false;
    global.currentModalType = '';
    if (global.processModalQueue) global.processModalQueue();
    if (!global.currentModalType) global.finishTurn();
  }

  global.finishTurnWithBinbou = finishTurnWithBinbou;
  global.doBinbouAction = doBinbouAction;
  global.closeBinbouModal = closeBinbouModal;
})(typeof window !== 'undefined' ? window : this);
