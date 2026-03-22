/**
 * 九州電鉄 DX — 3Dサイコロ・プレイヤー駒・ビンボー神・季節パーティクル描画
 */
(function (global) {
  'use strict';

  var PCOLORS = global.PCOLORS;
  var PBORDERS = global.PBORDERS;
  var PEMOJIS = global.PEMOJIS;

  var diceLayout = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  var diceTransforms = [
    'rotateY(0deg) translateZ(35px)',
    'rotateY(180deg) translateZ(35px)',
    'rotateY(90deg) translateZ(35px)',
    'rotateY(-90deg) translateZ(35px)',
    'rotateX(90deg) translateZ(35px)',
    'rotateX(-90deg) translateZ(35px)',
  ];

  function createDiceFaces() {
    var dice = document.getElementById('dice-3d');
    if (!dice) return;
    dice.innerHTML = '';
    for (var v = 1; v <= 6; v++) {
      var f = document.createElement('div');
      f.className = 'dice-face';
      f.style.transform = diceTransforms[v - 1];
      var g = document.createElement('div');
      g.className = 'grid grid-cols-3 gap-0.5 p-2 w-full h-full';
      for (var i = 0; i < 9; i++) {
        var d = document.createElement('div');
        var dot = diceLayout[v].indexOf(i) !== -1;
        d.className = 'rounded-full mx-auto my-auto ' + (dot ? (v === 1 ? 'bg-red-500 w-2.5 h-2.5' : 'bg-slate-800 w-2 h-2') : 'bg-transparent');
        g.appendChild(d);
      }
      f.appendChild(g);
      dice.appendChild(f);
    }
  }

  /**
   * プレイヤー位置から表示用の (x, y) を取得する。
   * mapData.nodes に無い場合は STATIONS から座標を取得（駅のみ）。
   */
  function getPlayerDisplayPos(p) {
    var mapData = global.mapData;
    if (mapData && mapData.nodes) {
      var node = mapData.nodes.filter(function (n) { return n.id === p.pos; })[0];
      if (node) return { x: node.x, y: node.y };
    }
    var st = global.STATION_MAP && global.STATION_MAP.get(p.pos);
    if (st) return { x: st.x, y: st.y };
    return null;
  }

  function updatePlayersLayer() {
    var layer = document.getElementById('players-layer');
    if (!layer) return;
    var players = global.players;
    var currentPlayerIdx = global.currentPlayerIdx;
    var mapData = global.mapData;
    var binbouOwner = global.binbouOwner;
    var binbouIsKing = global.binbouIsKing;

    layer.innerHTML = '';
    if (!players || players.length === 0) return;

    players.forEach(function (p, i) {
      var pos = getPlayerDisplayPos(p);
      if (!pos) return;
      var off = (i - (players.length - 1) / 2) * 28;
      var div = document.createElement('div');
      div.className = 'train-piece absolute z-[35] ' + (i === currentPlayerIdx ? 'active' : 'opacity-60');
      div.style.cssText = 'left:' + (pos.x + off) + 'px;top:' + (pos.y - 24) + 'px;transform:translate(-50%,-100%);min-width:48px;min-height:48px';
      var sc = i === currentPlayerIdx ? 1.1 : 0.9;
      div.innerHTML = '<div style="transform:scale(' + sc + ');transition:transform .3s" class="flex flex-col items-center"><div class="relative"><div style="background:' + PCOLORS[i] + ';border:3px solid ' + PBORDERS[i] + ';border-radius:12px;padding:4px 8px;min-width:48px;min-height:40px;box-shadow:0 4px 12px ' + PCOLORS[i] + '60" class="flex items-center justify-center gap-1"><span class="text-lg">' + PEMOJIS[i] + '</span></div><div class="flex justify-between px-1 -mt-0.5"><div class="w-2 h-2 bg-slate-700 rounded-full"></div><div class="w-2 h-2 bg-slate-700 rounded-full"></div></div></div><div class="text-[8px] font-black text-white px-2 py-0.5 rounded-full mt-0.5 shadow-md whitespace-nowrap" style="background:' + PCOLORS[i] + '">' + p.name + '</div></div>';
      layer.appendChild(div);
    });

    if (binbouOwner >= 0 && binbouOwner < players.length) {
      var bp = players[binbouOwner];
      var bpos = getPlayerDisplayPos(bp);
      if (bpos) {
        var bd = document.createElement('div');
        bd.className = 'binbou-sprite ' + (binbouIsKing ? 'king' : '');
        bd.style.cssText = 'left:' + (bpos.x + 35) + 'px;top:' + (bpos.y - 10) + 'px;';
        bd.innerHTML = '<div class="binbou-body text-center"><div class="' + (binbouIsKing ? 'text-5xl' : 'text-3xl') + '">' + (binbouIsKing ? '👹' : '👻') + '</div><div class="text-[7px] font-black ' + (binbouIsKing ? 'text-red-400' : 'text-gray-400') + '">' + (binbouIsKing ? 'キング' : 'ビンボー神') + '</div></div>';
        layer.appendChild(bd);
      }
    }
  }

  function getSeason() {
    var m = global.currentMonth;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  function spawnParticles(layer, ch, count, minS, maxS) {
    for (var i = 0; i < count; i++) {
      var d = document.createElement('div');
      d.className = 'petal';
      d.textContent = ch;
      d.style.cssText = 'left:' + (Math.random() * 100) + '%;font-size:' + (8 + Math.random() * 12) + 'px;animation-duration:' + (minS + Math.random() * (maxS - minS)) + 's;animation-delay:' + (-Math.random() * maxS) + 's;opacity:' + (0.3 + Math.random() * 0.5);
      layer.appendChild(d);
    }
  }

  function updateSeasonParticles() {
    var layer = document.getElementById('particle-layer');
    if (!layer) return;
    layer.innerHTML = '';
    var s = getSeason();
    if (s === 'spring') spawnParticles(layer, '🌸', 20, 8, 15);
    else if (s === 'autumn') spawnParticles(layer, '🍁', 15, 10, 18);
    else if (s === 'winter') spawnParticles(layer, '❄️', 25, 6, 12);
  }

  global.createDiceFaces = createDiceFaces;
  global.getPlayerDisplayPos = getPlayerDisplayPos;
  global.updatePlayersLayer = updatePlayersLayer;
  global.getSeason = getSeason;
  global.updateSeasonParticles = updateSeasonParticles;
})(typeof window !== 'undefined' ? window : this);
