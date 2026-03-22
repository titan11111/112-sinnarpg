/**
 * 九州電鉄 DX — ゲームフロー（効果音統合版）
 */
(function (global) {
  'use strict';

  var STATIONS = global.STATIONS;
  var MONTH_EVENTS = global.MONTH_EVENTS;
  var PCOLORS = global.PCOLORS;
  var PNAMES_DEFAULT = global.PNAMES_DEFAULT;
  var START_MONEY = global.START_MONEY;
  var START_STATION_ID = global.START_STATION_ID;

  function SM() { return global.SoundManager; }

  function startGame(mode) {
    global.gameMode = mode;
    var yearEl = document.getElementById('year-select');
    var countEl = document.getElementById('player-count');
    global.totalYears = yearEl ? parseInt(yearEl.value, 10) : 5;
    global.playerCount = countEl ? parseInt(countEl.value, 10) : 2;
    global.currentMonth = 1;
    global.currentYear = 1;
    global.currentPlayerIdx = 0;
    global.binbouOwner = -1;
    global.binbouTurns = 0;
    global.binbouIsKing = false;
    global.seasonBonus = '';
    global.globalDiscount = 0;
    global.heroEffects = {};
    global.skipTurn = [];
    global.modalQueue = [];
    global.currentModalType = '';
    if (global.viewportDragOffset) { global.viewportDragOffset.x = 0; global.viewportDragOffset.y = 0; }
    global.players = [];
    for (var i = 0; i < global.playerCount; i++) {
      var isCPU = mode === 'npc' && i > 0;
      global.players.push({
        id: i,
        name: isCPU ? 'CPU' + i : PNAMES_DEFAULT[i],
        pos: START_STATION_ID,
        lastPos: null,
        canGoBack: false,
        money: START_MONEY,
        properties: [],
        cards: [],
        color: PCOLORS[i],
        totalIncome: 0,
        isCPU: isCPU,
        visitCount: {},
        barrier: false,
        stoppedTurns: 0,
      });
    }
    global.initMap();
    global.createDiceFaces();
    global.drawMap();
    var far = STATIONS.filter(function (s) { return s.id !== START_STATION_ID; });
    global.goal = far[Math.floor(Math.random() * far.length)];
    var goalName = document.getElementById('goal-name');
    if (goalName) goalName.textContent = global.goal.name + '駅';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    if (SM()) {
      SM().init();
      SM().playBgmForSeason(global.getSeason());
      global.updateSoundButton();
    }
    global.addLog('ゲーム開始！' + global.totalYears + '年間、' + global.playerCount + '人の戦い！');
    global.handleMonthEvent();
    global.updateSeasonParticles();
    global.updateUI();
    global.updateCamera();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        global.updateCamera();
        if (typeof global.updatePlayersLayer === 'function') global.updatePlayersLayer();
      });
    });
  }

  function handleRollButtonClick() {
    if (global.isRolling || global.remainingSteps > 0 || global.waitingForSettlement || global.waitingForEvent || global.waitingForBinbou || global.waitingForToll) return;
    if (global.currentModalType) return;
    var p = global.players[global.currentPlayerIdx];
    if (!p) return;
    if (p.stoppedTurns > 0) {
      p.stoppedTurns--;
      global.addLog(p.name + 'は足踏み中…');
      global.showFloatText('🦶 足踏み！');
      if (SM()) SM().playSeStop();
      global.updateUI();
      setTimeout(global.finishTurn, 800);
      return;
    }
    if (!p.isCPU) {
      var usable = p.cards.filter(function (c) { return c.use === 'beforeRoll'; });
      if (usable.length > 0) global.showCardChoice(usable, global.startRolling);
      else global.startRolling();
    } else global.npcTurn();
  }

  function npcTurn() {
    var p = global.players[global.currentPlayerIdx];
    if (!p) return;
    var ex = p.cards.filter(function (c) { return c.id === 'express' || c.id === 'superexpress'; })[0];
    if (ex && Math.random() > 0.4) {
      global.expressMultiplier = ex.id === 'express' ? 2 : 3;
      var exi = ex.uid != null ? p.cards.findIndex(function (c) { return c.uid === ex.uid; }) : p.cards.indexOf(ex);
      if (exi !== -1) p.cards.splice(exi, 1);
      global.addLog(p.name + 'が' + ex.name + 'を使った！');
    }
    global.startRolling();
  }

  function startRolling() {
    global.isRolling = true;
    global.turnPhase = 'rolling';
    var dice = document.getElementById('dice-3d');
    if (dice) dice.classList.add('dice-rolling');
    var count = 0;
    var iv = setInterval(function () {
      global.diceValue = 1 + Math.floor(Math.random() * 6);
      count++;
      if (count > 25) {
        clearInterval(iv);
        if (dice) dice.classList.remove('dice-rolling');
        var fv = global.diceValue * global.expressMultiplier;
        global.expressMultiplier = 1;
        global.remainingSteps = fv;
        global.isRolling = false;
        global.turnPhase = 'moving';
        if (SM()) SM().playSeDice();
        global.showBigDice(fv);
        global.addLog('サイコロ：' + fv);
        global.updateCamera();
        global.updateUI();
        if (global.players[global.currentPlayerIdx] && global.players[global.currentPlayerIdx].isCPU) setTimeout(global.autoMoveNPC, 800);
      }
    }, 70);
  }

  function showBigDice(v) {
    var bd = document.getElementById('big-dice-result');
    var bn = document.getElementById('big-dice-number');
    if (bn) bn.textContent = v;
    if (bd) {
      bd.classList.remove('hidden');
      bd.classList.add('bounce-in');
      setTimeout(function () { bd.classList.add('hidden'); bd.classList.remove('bounce-in'); }, 1800);
    }
  }

  function handleNodeClick(nid) {
    if (global.remainingSteps <= 0 || global.isRolling || global.waitingForSettlement || global.waitingForEvent || global.waitingForBinbou || global.waitingForToll) return;
    if (global.currentModalType) return;
    var p = global.players[global.currentPlayerIdx];
    if (!p || p.isCPU) return;
    var choices = global.getChoices(p);
    if (choices.indexOf(nid) !== -1) moveStep(nid);
  }

  function autoMoveNPC() {
    if (global.remainingSteps <= 0) return;
    var p = global.players[global.currentPlayerIdx];
    if (!p) return;
    var ch = global.getChoices(p);
    if (ch.length === 0) return;
    var goal = global.goal;
    var mapData = global.mapData;
    var gn = mapData.nodes.filter(function (n) { return n.id === goal.id; })[0];
    if (!gn) { moveStep(ch[0]); return; }
    var best = ch.reduce(function (a, b) {
      var na = mapData.nodes.filter(function (n) { return n.id === a; })[0];
      var nb = mapData.nodes.filter(function (n) { return n.id === b; })[0];
      if (!na || !nb) return a;
      return Math.hypot(na.x - gn.x, na.y - gn.y) < Math.hypot(nb.x - gn.x, nb.y - gn.y) ? a : b;
    });
    moveStep(best);
    if (global.remainingSteps > 0) setTimeout(global.autoMoveNPC, 350);
  }

  function moveStep(tid) {
    var p = global.players[global.currentPlayerIdx];
    if (!p) return;
    p.lastPos = p.pos;
    p.pos = tid;
    global.remainingSteps--;
    p.canGoBack = false;

    // 移動効果音
    if (SM()) SM().playSeMoveStep();

    if (global.binbouOwner === global.currentPlayerIdx) {
      var otherIdx = -1;
      for (var i = 0; i < global.players.length; i++) {
        if (i !== global.currentPlayerIdx && global.players[i].pos === tid) { otherIdx = i; break; }
      }
      if (otherIdx >= 0) {
        global.binbouOwner = otherIdx;
        global.binbouTurns = 0;
        global.binbouIsKing = false;
        global.addLog('ビンボー神を' + global.players[otherIdx].name + 'になすりつけた！');
        global.showFloatText('👻→' + global.players[otherIdx].name + '！');
        global.showFlash('#a3a3a3');
        if (SM()) SM().playSeBinbouTransfer();
      }
    }
    global.updateUI();
    global.updateCamera();
    if (global.remainingSteps === 0) {
      global.turnPhase = 'arriving';
      setTimeout(function () { global.checkArrival(tid); }, 400);
    }
  }

  function finishTurn() {
    global.turnPhase = 'idle';
    global.remainingSteps = 0;
    global.expressMultiplier = 1;

    var heroEffects = global.heroEffects;
    Object.keys(heroEffects).forEach(function (k) {
      if (heroEffects[k] && heroEffects[k].remaining > 0) heroEffects[k].remaining--;
    });

    global.currentPlayerIdx++;

    if (global.currentPlayerIdx >= global.players.length) {
      global.currentPlayerIdx = 0;
      global.currentMonth++;

      if (global.currentMonth === 4 || global.currentMonth === 10) {
        setTimeout(function () { global.showSettlement(false); }, 500);
        return;
      }

      if (global.currentMonth > 12) {
        var isFinal = global.currentYear >= global.totalYears;
        setTimeout(function () { global.showSettlement(isFinal); }, 500);
        return;
      }

      global.handleMonthEvent();
      global.updateSeasonParticles();
      if (SM()) SM().playBgmForSeason(global.getSeason());
    }

    global.updateCamera();
    global.updateUI();

    var nextPlayer = global.players[global.currentPlayerIdx];
    if (nextPlayer && nextPlayer.isCPU) {
      setTimeout(global.handleRollButtonClick, 800);
    }
  }

  function handleMonthEvent() {
    var me = MONTH_EVENTS[global.currentMonth];
    if (me) {
      me.fn(global.players);
      global.addLog(me.name + '：' + me.desc);
      if (SM()) SM().playSeMonthEvent();
    }
  }

  function processModalQueue() {
    if (!global.modalQueue || global.modalQueue.length === 0) return;
    var next = global.modalQueue.shift();
    switch (next.type) {
      case 'toll': global.showTollModal(next.data); break;
      case 'event': global.triggerEvent(); break;
      case 'binbou': global.doBinbouAction(); break;
      case 'hero': global.showHeroModal(next.data); break;
    }
  }

  global.startGame = startGame;
  global.handleRollButtonClick = handleRollButtonClick;
  global.npcTurn = npcTurn;
  global.startRolling = startRolling;
  global.showBigDice = showBigDice;
  global.handleNodeClick = handleNodeClick;
  global.autoMoveNPC = autoMoveNPC;
  global.moveStep = moveStep;
  global.finishTurn = finishTurn;
  global.handleMonthEvent = handleMonthEvent;
  global.processModalQueue = processModalQueue;
})(typeof window !== 'undefined' ? window : this);
