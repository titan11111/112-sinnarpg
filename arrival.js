/**
 * 九州電鉄 DX — 到着処理（効果音統合版）
 */
(function (global) {
  'use strict';

  var STATIONS = global.STATIONS;
  var STATION_MAP = global.STATION_MAP;
  var EVENTS_GOOD = global.EVENTS_GOOD;
  var EVENTS_BAD = global.EVENTS_BAD;
  var HEROES = global.HEROES;
  var TOLL_RATE = global.TOLL_RATE;
  var MONOPOLY_TOLL_MULT = global.MONOPOLY_TOLL_MULT;
  var CARD_HAND_MAX = global.CARD_HAND_MAX;

  function SM() { return global.SoundManager; }

  function calcToll(stationId, playerIdx) {
    var players = global.players;
    var heroEffects = global.heroEffects;
    var result = { total: 0, details: [], ownerIdx: -1 };
    if (heroEffects[playerIdx] && heroEffects[playerIdx].effect === 'tollShield' && heroEffects[playerIdx].remaining > 0) return result;
    if (players[playerIdx].barrier) {
      players[playerIdx].barrier = false;
      global.addLog('バリアで通行料を無効化！');
      return result;
    }
    players.forEach(function (pl, i) {
      if (i === playerIdx) return;
      var owned = pl.properties.filter(function (pr) { return pr.stationId === stationId; });
      if (owned.length === 0) return;
      var st = STATION_MAP.get(stationId);
      var isMonopoly = st && st.properties.every(function (sp) { return pl.properties.some(function (pp) { return pp.name === sp.name; }); });
      var multi = isMonopoly ? MONOPOLY_TOLL_MULT : 1;
      owned.forEach(function (pr) {
        var fee = Math.floor(pr.price * TOLL_RATE * multi);
        result.total += fee;
        result.details.push({ name: pr.name, fee: fee, owner: pl.name });
      });
      result.ownerIdx = i;
      result.monopoly = isMonopoly;
    });
    return result;
  }

  function showTollModal(toll) {
    if (global.currentModalType) { global.modalQueue.push({ type: 'toll', data: toll }); return; }
    global.currentModalType = 'toll';
    global.waitingForToll = true;
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var p = players[currentPlayerIdx];
    p.money -= toll.total;
    if (toll.ownerIdx >= 0) players[toll.ownerIdx].money += toll.total;
    var descEl = document.getElementById('toll-modal-desc');
    if (descEl) descEl.innerHTML = p.name + 'は通行料<br><span class="text-3xl font-black text-rose-600">' + toll.total.toLocaleString() + '万円</span><br>を' + (players[toll.ownerIdx] ? players[toll.ownerIdx].name : '') + 'に支払った！' + (toll.monopoly ? '<br><span class="text-sm text-rose-500">（独占ボーナス×3！）</span>' : '');
    document.getElementById('toll-modal').classList.remove('hidden');
    global.showFlash('#f43f5e');
    if (SM()) SM().playSeToll();
    global.addLog('通行料' + toll.total + '万円を支払い！');
    global.updateUI();
  }

  function closeTollModal() {
    document.getElementById('toll-modal').classList.add('hidden');
    global.waitingForToll = false;
    global.currentModalType = '';
    if (global.processModalQueue) global.processModalQueue();
    if (!global.currentModalType) global.processArrivalEffect(global.players[global.currentPlayerIdx].pos);
  }

  function checkHeroTrigger(stationId) {
    var p = global.players[global.currentPlayerIdx];
    var heroEffects = global.heroEffects;
    var binbouOwner = global.binbouOwner;
    var currentPlayerIdx = global.currentPlayerIdx;
    HEROES.forEach(function (h) {
      if (heroEffects[currentPlayerIdx] && heroEffects[currentPlayerIdx].heroId === h.id) return;
      var t = h.trigger;
      if (t.station !== stationId) return;
      var triggered = false;
      if (t.type === 'monopoly') {
        var st = STATION_MAP.get(stationId);
        if (st && st.properties.every(function (sp) { return p.properties.some(function (pp) { return pp.name === sp.name; }); })) triggered = true;
      } else if (t.type === 'visit3' && p.visitCount[stationId] >= 3) triggered = true;
      else if (t.type === 'visit5' && p.visitCount[stationId] >= 5) triggered = true;
      if (triggered) {
        global.addLog(h.name + 'が' + p.name + 'の元に現れた！');
        if (h.effect === 'removeBinbou' && binbouOwner === currentPlayerIdx) {
          global.binbouOwner = -1; global.binbouTurns = 0; global.binbouIsKing = false;
        } else if (h.effect === 'cards3') {
          for (var i = 0; i < 3 && p.cards.length < CARD_HAND_MAX; i++) p.cards.push(global.getWeightedCard());
        } else if (h.duration > 0) {
          heroEffects[currentPlayerIdx] = { effect: h.effect, remaining: h.duration, value: h.value, heroId: h.id };
        }
        global.showHeroModal(h);
      }
    });
  }

  function showHeroModal(h) {
    if (global.currentModalType) { global.modalQueue.push({ type: 'hero', data: h }); return; }
    global.currentModalType = 'hero';
    var em = document.getElementById('hero-emoji');
    var nm = document.getElementById('hero-name');
    var dc = document.getElementById('hero-desc');
    if (em) em.textContent = h.emoji;
    if (nm) nm.textContent = h.name + ' 参上！';
    if (dc) dc.textContent = h.desc;
    document.getElementById('hero-modal').classList.remove('hidden');
    if (SM()) SM().playSeHero();
  }

  function closeHeroModal() {
    document.getElementById('hero-modal').classList.add('hidden');
    global.currentModalType = '';
    if (global.processModalQueue) global.processModalQueue();
  }

  function triggerEvent() {
    if (global.currentModalType) { global.modalQueue.push({ type: 'event' }); return; }
    global.currentModalType = 'event';
    var p = global.players[global.currentPlayerIdx];
    var good = Math.random() > 0.4;
    var pool = good ? EVENTS_GOOD : EVENTS_BAD;
    var ev = pool[Math.floor(Math.random() * pool.length)];
    p.money += ev.money;
    global.waitingForEvent = true;
    if (ev.special === 'cards2') {
      for (var i = 0; i < 2 && p.cards.length < CARD_HAND_MAX; i++) p.cards.push(global.getWeightedCard());
    }
    var box = document.getElementById('event-modal-box');
    var hd = document.getElementById('event-modal-header');
    if (box) box.style.borderColor = good ? '#22c55e' : '#ef4444';
    if (hd) hd.style.backgroundColor = good ? '#16a34a' : '#dc2626';
    var iconEl = document.getElementById('event-modal-icon');
    var titleEl = document.getElementById('event-modal-title');
    var descEl = document.getElementById('event-modal-desc');
    if (iconEl) iconEl.textContent = ev.icon;
    if (titleEl) titleEl.textContent = good ? 'ラッキー！' : 'アンラッキー…';
    if (descEl) descEl.innerHTML = ev.text + '<br><span class="text-3xl font-black ' + (good ? 'text-green-600' : 'text-red-600') + '">' + (ev.money !== 0 ? (ev.money > 0 ? '+' : '') + ev.money.toLocaleString() + '万円' : '') + (ev.special === 'cards2' ? 'カード2枚GET！' : '') + '</span>';
    document.getElementById('event-modal').classList.remove('hidden');
    if (good) { global.showFlash('#22c55e'); if (SM()) SM().playSeEventGood(); }
    else { global.showFlash('#ef4444'); if (SM()) SM().playSeEventBad(); }
    global.addLog('イベント！' + ev.text);
    global.updateUI();
  }

  function closeEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
    global.waitingForEvent = false;
    global.currentModalType = '';
    if (global.processModalQueue) global.processModalQueue();
    if (!global.currentModalType) global.finishTurnWithBinbou();
  }

  function checkArrival(posId) {
    var mapData = global.mapData;
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var goal = global.goal;
    var node = mapData.nodes.filter(function (n) { return n.id === posId; })[0];
    var p = players[currentPlayerIdx];
    if (!node || !p) return;

    if (posId === goal.id) {
      global.showFlash('#fbbf24');
      global.showFloatText('🎊 目的地到着！');
      if (SM()) SM().playSeGoalArrive();
      var gNode = mapData.nodes.filter(function (n) { return n.id === goal.id; })[0];
      var dist = Math.hypot(gNode.x - 900, gNode.y - 280);
      var reward = Math.floor(global.GOAL_REWARD_BASE + dist * global.GOAL_REWARD_PER_DIST);
      p.money += reward;
      global.addLog('目的地到着！+' + reward + '万円！');
      if (players.length > 1) {
        var maxDist = -1, farthestIdx = -1;
        players.forEach(function (pl, i) {
          if (i === currentPlayerIdx) return;
          var pn = mapData.nodes.filter(function (n) { return n.id === pl.pos; })[0];
          if (!pn) return;
          var d = Math.hypot(pn.x - gNode.x, pn.y - gNode.y);
          if (d > maxDist) { maxDist = d; farthestIdx = i; }
        });
        if (farthestIdx >= 0) {
          global.binbouOwner = farthestIdx;
          global.binbouTurns = 0;
          global.binbouIsKing = false;
          global.addLog('ビンボー神が' + players[farthestIdx].name + 'に取り憑いた！');
        }
      }
      var others = STATIONS.filter(function (s) { return s.id !== posId; });
      global.goal = others[Math.floor(Math.random() * others.length)];
      var goalName = document.getElementById('goal-name');
      if (goalName) goalName.textContent = global.goal.name + '駅';
      global.updateUI();
    }

    if (node.type === 'station') {
      if (!p.visitCount[posId]) p.visitCount[posId] = 0;
      p.visitCount[posId]++;
    }

    if (node.type === 'station') {
      var toll = calcToll(posId, currentPlayerIdx);
      if (toll.total > 0) {
        showTollModal(toll);
        return;
      }
    }

    global.processArrivalEffect(posId);
  }

  function processArrivalEffect(posId) {
    var mapData = global.mapData;
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var node = mapData.nodes.filter(function (n) { return n.id === posId; })[0];
    var p = players[currentPlayerIdx];
    if (!node || !p) return;

    if (node.type === 'station') {
      var amt = 300 + Math.floor(Math.random() * 500);
      p.money += amt;
      if (SM()) SM().playSeStationArrive();
      global.addLog(node.name + '駅到着！+' + amt + '万円');
      global.showFloatText('+' + amt + '万円');
      checkHeroTrigger(posId);
      if (node.properties && node.properties.length > 0) {
        setTimeout(function () {
          if (!p.isCPU) {
            if (SM()) SM().playSeModalOpen();
            global.openPropertyModal(node);
          } else {
            global.npcBuyProperty(node);
            global.finishTurnWithBinbou();
          }
        }, 600);
        return;
      }
    } else if (node.type === 'red') {
      var loss = 500 + Math.floor(Math.random() * 1500);
      p.money -= loss;
      global.showFlash('#ef4444');
      global.showFloatText('-' + loss + '万円');
      if (SM()) SM().playSeRedSquare();
      global.addLog('赤マス！-' + loss + '万円');
    } else if (node.type === 'blue') {
      var gain = 300 + Math.floor(Math.random() * 700);
      p.money += gain;
      global.showFlash('#3b82f6');
      global.showFloatText('+' + gain + '万円');
      if (SM()) SM().playSeBlueSquare();
      global.addLog('青マス！+' + gain + '万円');
    } else if (node.type === 'card') {
      var card = global.getWeightedCard();
      if (p.cards.length < CARD_HAND_MAX) {
        p.cards.push(card);
        global.showFlash('#a78bfa');
        global.showFloatText(card.emoji + ' ' + card.name);
        if (SM()) SM().playSeCardGet();
        global.addLog(card.name + 'を入手！');
      } else global.addLog('カードがいっぱい…');
    } else if (node.type === 'event') {
      triggerEvent();
      return;
    }
    global.updateUI();
    global.finishTurnWithBinbou();
  }

  global.calcToll = calcToll;
  global.showTollModal = showTollModal;
  global.closeTollModal = closeTollModal;
  global.checkHeroTrigger = checkHeroTrigger;
  global.showHeroModal = showHeroModal;
  global.closeHeroModal = closeHeroModal;
  global.triggerEvent = triggerEvent;
  global.closeEventModal = closeEventModal;
  global.checkArrival = checkArrival;
  global.processArrivalEffect = processArrivalEffect;
})(typeof window !== 'undefined' ? window : this);
