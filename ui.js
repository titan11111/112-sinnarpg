/**
 * 九州電鉄 DX — UI更新・カメラ・ログ・演出（フラッシュ・浮き文字）
 */
(function (global) {
  'use strict';

  var PCOLORS = global.PCOLORS;
  var PEMOJIS = global.PEMOJIS;
  var STATIONS = global.STATIONS;
  var STATION_MAP = global.STATION_MAP;
  var GOAL_REWARD_BASE = global.GOAL_REWARD_BASE;
  var GOAL_REWARD_PER_DIST = global.GOAL_REWARD_PER_DIST;

  function showFlash(c) {
    var l = document.getElementById('flash-layer');
    if (!l) return;
    var d = document.createElement('div');
    d.className = 'absolute inset-0 flash-overlay';
    d.style.backgroundColor = c;
    l.appendChild(d);
    setTimeout(function () { d.remove(); }, 700);
  }

  function showFloatText(t) {
    var l = document.getElementById('float-text-layer');
    if (!l) return;
    var d = document.createElement('div');
    d.className = 'slide-up text-4xl font-black text-white pointer-events-none';
    d.style.textShadow = '0 0 20px rgba(0,0,0,.6),0 4px 8px rgba(0,0,0,.4)';
    d.textContent = t;
    l.appendChild(d);
    setTimeout(function () { d.remove(); }, 1700);
  }

  // サウンド一括トグル（BGM+SE）とボタン表示更新
  function toggleSoundUI() {
    if (typeof global.SoundManager === 'undefined') return;
    var on = global.SoundManager.getBgmEnabled() || global.SoundManager.getSeEnabled();
    var next = !on;
    global.SoundManager.setBgmMute(!next);
    global.SoundManager.setSeMute(!next);
    updateSoundButton();
  }

  function updateSoundButton() {
    var btn = document.getElementById('sound-toggle');
    if (!btn) return;
    var on = typeof global.SoundManager !== 'undefined' && (global.SoundManager.getBgmEnabled() || global.SoundManager.getSeEnabled());
    btn.textContent = on ? '🔊' : '🔇';
    btn.title = on ? 'BGM/SE オン' : 'BGM/SE オフ（タップでON）';
  }

  // 左パネルタブ切り替え（ステータス・ログ・カード）
  function switchLeftTab(tabId) {
    var tabs = ['status', 'log', 'cards'];
    tabs.forEach(function (id) {
      var panel = document.getElementById('panel-' + id);
      var btn = document.getElementById('tab-' + id);
      if (panel) panel.classList.toggle('hidden', id !== tabId);
      if (btn) {
        if (id === tabId) {
          btn.classList.add('left-panel-tab-active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('left-panel-tab-active');
          btn.setAttribute('aria-pressed', 'false');
        }
      }
    });
  }

  function addLog(msg) {
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var ct = document.getElementById('log-container');
    if (!ct || !players.length) return;
    var p = players[currentPlayerIdx];
    var d = document.createElement('div');
    var colors = ['border-blue-500 text-blue-800 bg-blue-50', 'border-red-500 text-red-800 bg-red-50', 'border-green-500 text-green-800 bg-green-50', 'border-yellow-500 text-yellow-800 bg-yellow-50'];
    d.className = 'text-[11px] p-1.5 rounded-lg shadow-sm border-l-4 font-bold ' + (colors[currentPlayerIdx % 4] || colors[0]);
    d.textContent = '[' + p.name + '] ' + msg;
    ct.prepend(d);
    while (ct.children.length > 40) ct.removeChild(ct.lastChild);
  }

  function updateCamera() {
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var mapData = global.mapData;
    var gw = document.getElementById('game-world');
    var drag = global.viewportDragOffset || { x: 0, y: 0 };
    if (!gw || !players.length || !mapData || !mapData.nodes) return;
    var p = players[currentPlayerIdx];
    var node = mapData.nodes.filter(function (n) { return n.id === p.pos; })[0];
    if (!node) return;
    var tx = -node.x + (drag.x || 0);
    var ty = -node.y + (drag.y || 0);
    gw.style.transform = 'translate(calc(50% + ' + tx + 'px),calc(50% + ' + ty + 'px))';
  }

  function applyViewportDrag(dx, dy) {
    var gw = document.getElementById('game-world');
    if (!gw || !global.players.length || !global.mapData || !global.mapData.nodes) return;
    var drag = global.viewportDragOffset || { x: 0, y: 0 };
    drag.x = (drag.x || 0) + dx;
    drag.y = (drag.y || 0) + dy;
    var p = global.players[global.currentPlayerIdx];
    var node = global.mapData.nodes.filter(function (n) { return n.id === p.pos; })[0];
    if (!node) return;
    var tx = -node.x + drag.x;
    var ty = -node.y + drag.y;
    gw.style.transform = 'translate(calc(50% + ' + tx + 'px),calc(50% + ' + ty + 'px))';
  }

  function resetViewportDrag() {
    if (global.viewportDragOffset) {
      global.viewportDragOffset.x = 0;
      global.viewportDragOffset.y = 0;
    }
  }

  var _lastUIState = { turnText: '', nameText: '', statsHtml: '', binbouVisible: null, remainingSteps: null, cardHandHtml: '', blocked: null, diceAreaHidden: null };

  function updateUI() {
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var mapData = global.mapData;
    var goal = global.goal;
    var diceValue = global.diceValue;
    var isRolling = global.isRolling;
    var remainingSteps = global.remainingSteps;
    var binbouOwner = global.binbouOwner;
    var binbouIsKing = global.binbouIsKing;
    var waitingForSettlement = global.waitingForSettlement;
    var waitingForEvent = global.waitingForEvent;
    var waitingForBinbou = global.waitingForBinbou;
    var waitingForToll = global.waitingForToll;
    var heroEffects = global.heroEffects;

    if (!players.length) return;
    var p = players[currentPlayerIdx];

    var mn = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var turnText = mn[Math.min(global.currentMonth - 1, 11)] + ' / ' + global.currentYear + '年';
    var turnEl = document.getElementById('turn-display');
    if (turnEl && _lastUIState.turnText !== turnText) {
      turnEl.textContent = turnText;
      _lastUIState.turnText = turnText;
    }
    var nameText = p.name;
    var nameEl = document.getElementById('current-player-name');
    if (nameEl && _lastUIState.nameText !== nameText) {
      nameEl.textContent = nameText;
      _lastUIState.nameText = nameText;
    }
    var banner = document.getElementById('active-player-banner');
    if (banner) {
      banner.style.backgroundColor = PCOLORS[currentPlayerIdx];
      banner.title = p.isCPU ? 'CPUの位置' : 'タップで自分の位置にマップを移動';
    }

    var season = global.getSeason();
    var ss = { spring: '🌸 春', summer: '☀️ 夏', autumn: '🍁 秋', winter: '❄️ 冬' };
    var sc = { spring: 'bg-pink-100 text-pink-700', summer: 'bg-amber-100 text-amber-700', autumn: 'bg-orange-100 text-orange-700', winter: 'bg-sky-100 text-sky-700' };
    var badge = document.getElementById('season-badge');
    if (badge) badge.innerHTML = '<span class="' + (sc[season] || '') + ' text-xs font-black px-3 py-1 rounded-full">' + (ss[season] || '') + '</span>';

    var statsEl = document.getElementById('player-stats');
    if (statsEl) {
      var statsHtml = players.map(function (pl, i) {
        var isMonoAny = STATIONS.some(function (st) {
          return st.properties.length > 0 && st.properties.every(function (sp) { return pl.properties.some(function (pp) { return pp.name === sp.name; }); });
        });
        return '<div class="p-2.5 rounded-xl border-2 flex justify-between items-center ' + (i === currentPlayerIdx ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-slate-50 opacity-50') + '">' +
          '<div><span class="text-[9px] font-black text-slate-400 uppercase">' + pl.name + (binbouOwner === i ? (binbouIsKing ? ' 👹' : ' 👻') : '') + '</span>' +
          '<span class="text-lg font-black ' + (pl.money < 0 ? 'text-red-600' : 'text-slate-800') + ' block leading-none">' + pl.money.toLocaleString() + '万</span>' +
          '<span class="text-[9px] text-slate-400">物件' + pl.properties.length + '件' + (isMonoAny ? ' 👑' : '') + ' カード' + pl.cards.length + '枚</span></div>' +
          '<span class="text-xl">' + PEMOJIS[i] + '</span></div>';
      }).join('');
      if (_lastUIState.statsHtml !== statsHtml) {
        statsEl.innerHTML = statsHtml;
        _lastUIState.statsHtml = statsHtml;
      }
    }

    var bs = document.getElementById('binbou-status');
    if (bs) {
      var binbouVisible = binbouOwner >= 0;
      if (_lastUIState.binbouVisible !== binbouVisible) {
        _lastUIState.binbouVisible = binbouVisible;
        if (binbouVisible) {
          bs.classList.remove('hidden');
          var iconEl = document.getElementById('binbou-icon');
          var ownerEl = document.getElementById('binbou-owner-name');
          var turnsEl = document.getElementById('binbou-turns');
          if (iconEl) iconEl.textContent = binbouIsKing ? '👹' : '👻';
          if (ownerEl) ownerEl.textContent = players[binbouOwner].name;
          if (turnsEl) turnsEl.textContent = global.binbouTurns + 'ターン目' + (binbouIsKing ? ' (KING!)' : '');
        } else {
          bs.classList.add('hidden');
        }
      } else if (binbouVisible) {
        var iconEl2 = document.getElementById('binbou-icon');
        var ownerEl2 = document.getElementById('binbou-owner-name');
        var turnsEl2 = document.getElementById('binbou-turns');
        if (iconEl2) iconEl2.textContent = binbouIsKing ? '👹' : '👻';
        if (ownerEl2) ownerEl2.textContent = players[binbouOwner].name;
        if (turnsEl2) turnsEl2.textContent = global.binbouTurns + 'ターン目' + (binbouIsKing ? ' (KING!)' : '');
      }
    }

    var sb = document.getElementById('move-status');
    if (sb) {
      var showRem = remainingSteps > 0 && !p.isCPU;
      if (_lastUIState.remainingSteps !== remainingSteps || (showRem && sb.classList.contains('hidden'))) {
        _lastUIState.remainingSteps = remainingSteps;
        if (showRem) {
          sb.classList.remove('hidden');
          var remEl = document.getElementById('remaining-steps-ui');
          if (remEl) remEl.textContent = remainingSteps;
        } else {
          sb.classList.add('hidden');
        }
      }
    }

    var ch = document.getElementById('card-hand');
    if (ch) {
      var cardHandHtml = !p.isCPU
        ? (p.cards.length === 0 ? '<div class="text-xs text-slate-300 flex items-center justify-center w-full">カードなし</div>' : p.cards.map(function (c) {
          return '<div class="card-hand-item flex-shrink-0 bg-purple-50 border-2 border-purple-200 rounded-lg p-1 text-center w-[52px] cursor-default" title="' + c.name + ':' + c.desc + '"><div class="text-lg">' + c.emoji + '</div><div class="text-[6px] font-bold text-purple-700 leading-tight mt-0.5">' + c.name + '</div></div>';
        }).join(''))
        : '<div class="text-xs text-slate-300 flex items-center justify-center w-full">' + p.name + ': ' + p.cards.length + '枚</div>';
      if (_lastUIState.cardHandHtml !== cardHandHtml) {
        ch.innerHTML = cardHandHtml;
        _lastUIState.cardHandHtml = cardHandHtml;
      }
    }

    var choices = remainingSteps > 0 ? global.getChoices(p) : [];
    var railHighlights = document.querySelectorAll('.rail-highlight');
    for (var i = 0; i < railHighlights.length; i++) railHighlights[i].classList.remove('active');
    if (mapData && mapData.nodes) {
      mapData.nodes.forEach(function (n) {
        var el = document.getElementById('node-' + n.id);
        if (!el) return;
        var isSel = choices.indexOf(n.id) !== -1 && !p.isCPU;
        var isGoal = goal && goal.id === n.id;
        el.classList.remove('selectable');
        if (isSel) {
          el.classList.add('selectable');
          mapData.links.forEach(function (pair) {
            var a = pair[0], b = pair[1];
            if ((a === p.pos && b === n.id) || (b === p.pos && a === n.id)) {
              var hl = document.getElementById('rail-hl-' + a + '-' + b);
              if (hl) hl.classList.add('active');
            }
          });
        }
        if (n.type === 'station') {
          var inner = el.querySelector('div');
          if (inner) {
            var st = STATION_MAP.get(n.id);
            var monoOwner = st ? players.filter(function (pl) {
              return st.properties.every(function (sp) { return pl.properties.some(function (pp) { return pp.name === sp.name; }); });
            })[0] : null;
            var monoIdx = monoOwner ? players.indexOf(monoOwner) : -1;
            if (isGoal) {
              inner.style.background = 'linear-gradient(135deg,#f59e0b,#ef4444)';
              inner.style.borderColor = '#fbbf24';
              inner.style.boxShadow = '0 0 20px rgba(245,158,11,.6)';
              var span = inner.querySelector('span');
              if (span) span.textContent = '⭐';
            } else if (monoIdx >= 0) {
              inner.style.background = PCOLORS[monoIdx];
              inner.style.borderColor = '#fbbf24';
              inner.style.boxShadow = '0 0 20px rgba(234,179,8,.5)';
              var span2 = inner.querySelector('span');
              if (span2) span2.textContent = '👑';
              inner.classList.add('monopoly-glow');
            } else {
              inner.style.background = '#3b82f6';
              inner.style.borderColor = 'white';
              inner.style.boxShadow = '0 4px 15px rgba(59,130,246,.5)';
              var span3 = inner.querySelector('span');
              if (span3) span3.textContent = '🏠';
              inner.classList.remove('monopoly-glow');
            }
          }
        }
      });
    }

    if (typeof global.updatePlayersLayer === 'function') global.updatePlayersLayer();

    var diceEl = document.getElementById('dice-3d');
    if (diceEl && !isRolling) {
      var tf = ['rotateY(0deg)', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(-90deg)', 'rotateX(90deg)'];
      diceEl.style.transform = tf[(diceValue - 1) % 6] + ' translateZ(0)';
    }

    var btn = document.getElementById('dice-button');
    if (btn) {
      var blocked = remainingSteps > 0 || isRolling || waitingForSettlement || waitingForEvent || waitingForBinbou || waitingForToll || p.isCPU;
      if (_lastUIState.blocked !== blocked) {
        _lastUIState.blocked = blocked;
        btn.disabled = blocked;
        if (blocked) btn.classList.add('opacity-50'); else btn.classList.remove('opacity-50');
      }
    }

    // 自分のターン時のみサイコロエリアを表示（他人/CPUのターンでは非表示でマップを広く）
    var diceArea = document.getElementById('dice-area');
    if (diceArea) {
      var diceAreaHidden = p.isCPU;
      if (_lastUIState.diceAreaHidden !== diceAreaHidden) {
        _lastUIState.diceAreaHidden = diceAreaHidden;
        if (diceAreaHidden) diceArea.classList.add('hidden'); else diceArea.classList.remove('hidden');
      }
    }
  }

  // キングビンボー進化時：画面全体ひび割れオーバーレイを表示
  function showKingCrack() {
    var el = document.getElementById('king-crack-overlay');
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('king-crack-visible');
    setTimeout(function () {
      el.classList.remove('king-crack-visible');
      el.classList.add('hidden');
    }, 2500);
  }

  var _viewingGoal = false;

  function toggleGoalView() {
    var goal = global.goal;
    var gw = document.getElementById('game-world');
    var btn = document.getElementById('goal-search-btn');
    if (!goal || !gw) return;

    if (_viewingGoal) {
      _viewingGoal = false;
      if (btn) btn.innerHTML = '🔍 見る';
      resetViewportDrag();
      updateCamera();
      return;
    }

    _viewingGoal = true;
    if (btn) btn.innerHTML = '↩️ 戻る';

    var mapData = global.mapData;
    var goalNode = mapData ? mapData.nodes.filter(function (n) { return n.id === goal.id; })[0] : null;
    if (!goalNode) return;

    if (global.viewportDragOffset) {
      global.viewportDragOffset.x = 0;
      global.viewportDragOffset.y = 0;
    }

    var tx = -goalNode.x;
    var ty = -goalNode.y;
    gw.style.transform = 'translate(calc(50% + ' + tx + 'px),calc(50% + ' + ty + 'px))';
  }

  var _origApplyViewportDrag = applyViewportDrag;
  applyViewportDrag = function (dx, dy) {
    if (_viewingGoal) {
      _viewingGoal = false;
      var btn = document.getElementById('goal-search-btn');
      if (btn) btn.innerHTML = '🔍 見る';
      resetViewportDrag();
      updateCamera();
    }
    _origApplyViewportDrag(dx, dy);
  };

  var _origResetViewportDrag = resetViewportDrag;
  resetViewportDrag = function () {
    _viewingGoal = false;
    var btn = document.getElementById('goal-search-btn');
    if (btn) btn.innerHTML = '🔍 見る';
    _origResetViewportDrag();
  };

  global.showFlash = showFlash;
  global.showFloatText = showFloatText;
  global.addLog = addLog;
  global.switchLeftTab = switchLeftTab;
  global.showKingCrack = showKingCrack;
  global.toggleSoundUI = toggleSoundUI;
  global.updateSoundButton = updateSoundButton;
  global.updateCamera = updateCamera;
  global.toggleGoalView = toggleGoalView;
  global.applyViewportDrag = applyViewportDrag;
  global.resetViewportDrag = resetViewportDrag;
  global.updateUI = updateUI;
})(typeof window !== 'undefined' ? window : this);
