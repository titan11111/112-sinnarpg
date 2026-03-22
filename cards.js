/**
 * 九州電鉄 DX — カード（効果音統合版）
 */
(function (global) {
  'use strict';

  var CARD_DEFS = global.CARD_DEFS;
  var CARD_RARITY_WEIGHTS = global.CARD_RARITY_WEIGHTS;
  var STATIONS = global.STATIONS;
  var STATION_MAP = global.STATION_MAP;

  function SM() { return global.SoundManager; }

  function getWeightedCard() {
    var pool = [];
    CARD_DEFS.forEach(function (c) {
      var w = CARD_RARITY_WEIGHTS[c.rarity] || 1;
      for (var i = 0; i < w; i++) pool.push(c);
    });
    var c = pool[Math.floor(Math.random() * pool.length)];
    return { id: c.id, name: c.name, emoji: c.emoji, desc: c.desc, use: c.use, rarity: c.rarity, uid: Date.now() + Math.random() };
  }

  function showCardChoice(cards, onSkip) {
    var ct = document.getElementById('card-modal-content');
    if (!ct) return;
    ct.innerHTML = cards.map(function (c, i) {
      return '<button onclick="useCard(' + i + ')" class="w-full p-3 bg-purple-50 border-2 border-purple-200 rounded-xl text-left hover:bg-purple-100 transition active:scale-95 flex items-center gap-3 game-btn"><span class="text-2xl">' + c.emoji + '</span><div><p class="font-black text-purple-900 text-sm">' + c.name + '</p><p class="text-[10px] text-purple-600">' + c.desc + '</p></div></button>';
    }).join('');
    document.getElementById('card-modal').classList.remove('hidden');
    if (SM()) SM().playSeModalOpen();
    global._cardChoices = cards;
    global._cardSkipCallback = onSkip;
  }

  function useCard(idx) {
    var cards = global._cardChoices;
    var card = cards[idx];
    var p = global.players[global.currentPlayerIdx];
    var ci = card.uid != null ? p.cards.findIndex(function (c) { return c.uid === card.uid; }) : p.cards.indexOf(card);
    if (ci !== -1) p.cards.splice(ci, 1);
    document.getElementById('card-modal').classList.add('hidden');
    if (SM()) SM().playSeCardUse();

    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var mapData = global.mapData;

    switch (card.id) {
      case 'express':
        global.expressMultiplier = 2;
        global.addLog('急行カード！');
        global.showFloatText('🚅 急行！');
        setTimeout(function () { global.startRolling(); }, 500);
        return;
      case 'superexpress':
        global.expressMultiplier = 3;
        global.addLog('特急カード！');
        global.showFloatText('🚄 特急！');
        setTimeout(function () { global.startRolling(); }, 500);
        return;
      case 'shinkansen':
        global.addLog('新幹線カード！');
        showShinkansenModal();
        return;
      case 'butto': {
        var stList = STATIONS.filter(function (s) { return s.id !== p.pos; });
        var tg = stList[Math.floor(Math.random() * stList.length)];
        p.lastPos = p.pos;
        p.pos = tg.id;
        global.addLog('ぶっとびで' + tg.name + 'へ！');
        global.showFloatText('🚀 ' + tg.name + '！');
        if (SM()) SM().playSeWarp();
        global.updateCamera();
        global.updateUI();
        setTimeout(function () { global.checkArrival(tg.id); }, 800);
        return;
      }
      case 'targetwarp':
        showWarpModal();
        return;
      case 'back': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx; });
        if (others.length === 0) break;
        var t = others[Math.floor(Math.random() * others.length)];
        for (var step = 0; step < 3; step++) {
          var neighbors = mapData.links.filter(function (l) { return l.indexOf(t.pos) !== -1; }).map(function (l) { return l[0] === t.pos ? l[1] : l[0]; });
          var nextId = null;
          if (neighbors.length === 1) nextId = neighbors[0];
          else if (neighbors.length > 1 && t.lastPos) {
            var towardLast = neighbors.filter(function (id) { return id === t.lastPos; })[0];
            nextId = towardLast || neighbors[Math.floor(Math.random() * neighbors.length)];
          } else if (neighbors.length > 1) nextId = neighbors[Math.floor(Math.random() * neighbors.length)];
          if (nextId) { t.lastPos = t.pos; t.pos = nextId; }
        }
        global.addLog(t.name + 'を3マス戻した！');
        global.showFloatText('↩️ ' + t.name + '後退！');
        break;
      }
      case 'stop': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx && (_.stoppedTurns == null || _.stoppedTurns <= 0); });
        if (others.length === 0) { global.addLog('足踏みの対象なし'); break; }
        var t = others[Math.floor(Math.random() * others.length)];
        t.stoppedTurns = 1;
        global.addLog(t.name + 'を足踏みさせた！');
        global.showFloatText('🦶 ' + t.name + '停止！');
        break;
      }
      case 'switch':
        p.canGoBack = true;
        global.addLog('来た道も戻れる！');
        global.showFloatText('🔀 切替！');
        break;
      case 'destroy': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx && _.properties.length > 0; });
        if (others.length > 0) {
          var t = others[Math.floor(Math.random() * others.length)];
          var pi = Math.floor(Math.random() * t.properties.length);
          var removed = t.properties.splice(pi, 1)[0];
          global.addLog(t.name + 'の' + removed.name + 'を破壊！');
          global.showFloatText('💣 ' + removed.name + '破壊！');
          global.showFlash('#ef4444');
        } else global.addLog('対象物件なし');
        break;
      }
      case 'tax': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx; });
        var t = others.reduce(function (a, b) { return a.money > b.money ? a : b; });
        var amt = Math.floor(t.money * 0.2);
        t.money -= amt; p.money += amt;
        global.addLog(t.name + 'から' + amt + '万徴収！');
        global.showFloatText('🏛️ ' + amt + '万GET');
        break;
      }
      case 'takeover':
        global.addLog('乗っ取り：駅到着時に使えます');
        p.cards.push(card);
        break;
      case 'binboucard': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx; });
        if (others.length === 0) break;
        var t = others[Math.floor(Math.random() * others.length)];
        global.binbouOwner = players.indexOf(t);
        global.binbouTurns = 0;
        global.binbouIsKing = false;
        global.addLog('ビンボー神を' + t.name + 'に！');
        global.showFloatText('👻→' + t.name + '！');
        if (SM()) SM().playSeBinbouTransfer();
        break;
      }
      case 'seal': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx && _.cards.length > 0; });
        if (others.length > 0) {
          var t = others[Math.floor(Math.random() * others.length)];
          var ri = Math.floor(Math.random() * t.cards.length);
          var rc = t.cards.splice(ri, 1)[0];
          global.addLog(t.name + 'の' + rc.name + 'を封印！');
          global.showFloatText('🔒 封印！');
        }
        break;
      }
      case 'tax_cut':
        if (p.money < 0) {
          var r = Math.abs(p.money);
          p.money = 0;
          global.addLog('徳政令！' + r + '万帳消し！');
          global.showFloatText('📜 帳消し！');
        } else global.addLog('借金なし');
        break;
      case 'barrier':
        p.barrier = true;
        global.addLog('バリア展開！');
        global.showFloatText('🛡️ バリア！');
        break;
      case 'peek': {
        var others = players.filter(function (_, i) { return i !== currentPlayerIdx; });
        others.forEach(function (o) {
          global.addLog('偵察：' + o.name + '=' + o.money.toLocaleString() + '万,物件' + o.properties.length + '件,カード' + o.cards.length + '枚');
        });
        global.showFloatText('🔭 偵察完了');
        break;
      }
      case 'shop':
        global.discountRate = 0.3;
        global.addLog('30%OFF！');
        global.showFloatText('🏪 割引！');
        break;
      case 'monopoly':
        global.addLog('独占カードは駅で使えます');
        p.cards.push(card);
        break;
    }
    global.updateUI();
    if (global._cardSkipCallback) global._cardSkipCallback();
  }

  function showShinkansenModal() {
    var g = document.getElementById('shinkansen-grid');
    if (!g) return;
    g.innerHTML = '';
    for (var i = 1; i <= 12; i++) {
      g.innerHTML += '<button onclick="chooseDice(' + i + ')" class="p-3 bg-sky-100 hover:bg-sky-200 rounded-xl font-black text-xl text-sky-800 transition active:scale-90 game-btn">' + i + '</button>';
    }
    document.getElementById('shinkansen-modal').classList.remove('hidden');
  }

  function chooseDice(n) {
    document.getElementById('shinkansen-modal').classList.add('hidden');
    global.remainingSteps = n;
    global.turnPhase = 'moving';
    global.showBigDice(n);
    global.addLog('新幹線カード：' + n + 'マス！');
    global.showFloatText('🚅 ' + n + 'マス！');
    global.updateUI();
    global.updateCamera();
    if (global.players[global.currentPlayerIdx].isCPU) setTimeout(function () { global.autoMoveNPC(); }, 800);
  }

  function showWarpModal() {
    var list = document.getElementById('warp-list');
    if (!list) return;
    var p = global.players[global.currentPlayerIdx];
    list.innerHTML = STATIONS.filter(function (s) { return s.id !== p.pos; }).map(function (s) {
      return '<button onclick="doWarp(\'' + s.id + '\')" class="w-full p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-left hover:bg-cyan-100 transition active:scale-95 font-bold text-cyan-900 game-btn">' + s.name + '駅</button>';
    }).join('');
    document.getElementById('warp-modal').classList.remove('hidden');
  }

  function doWarp(sid) {
    document.getElementById('warp-modal').classList.add('hidden');
    var p = global.players[global.currentPlayerIdx];
    var st = STATION_MAP.get(sid);
    p.lastPos = p.pos;
    p.pos = sid;
    global.addLog('指定ワープで' + st.name + 'へ！');
    global.showFloatText('🎯 ' + st.name + '！');
    if (SM()) SM().playSeWarp();
    global.updateCamera();
    global.updateUI();
    setTimeout(function () { global.checkArrival(sid); }, 800);
  }

  function closeCardModal() {
    document.getElementById('card-modal').classList.add('hidden');
    if (global._cardSkipCallback) global._cardSkipCallback();
  }

  global.getWeightedCard = getWeightedCard;
  global.showCardChoice = showCardChoice;
  global.useCard = useCard;
  global.showShinkansenModal = showShinkansenModal;
  global.chooseDice = chooseDice;
  global.showWarpModal = showWarpModal;
  global.doWarp = doWarp;
  global.closeCardModal = closeCardModal;
})(typeof window !== 'undefined' ? window : this);
