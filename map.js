/**
 * 九州電鉄 DX — マップ生成・描画・移動可能マス取得
 */
(function (global) {
  'use strict';

  var STATIONS = global.STATIONS;
  var STATION_MAP = global.STATION_MAP;
  var STATION_LINKS = global.STATION_LINKS;
  var MAP = global.MAP;

  /**
   * 路線リンクの距離からマス数（2〜5）を算出し、中間ノード（青/赤/カード/イベント）を生成する
   */
  function initMap() {
    var nodes = STATIONS.map(function (s) {
      return { id: s.id, name: s.name, x: s.x, y: s.y, type: 'station', color: '#3b82f6', properties: s.properties };
    });
    var links = [];
    var dist, steps, last, i, mid, t, r, type;
    var typeColors = { blue: '#3b82f6', red: '#ef4444', card: '#8b5cf6', event: '#f59e0b' };

    STATION_LINKS.forEach(function (pair) {
      var id1 = pair[0], id2 = pair[1];
      var s1 = STATION_MAP.get(id1);
      var s2 = STATION_MAP.get(id2);
      dist = Math.hypot(s2.x - s1.x, s2.y - s1.y);
      steps = Math.max(MAP.LINK_STEPS_MIN, Math.min(MAP.LINK_STEPS_MAX, Math.round(dist / MAP.LINK_STEP_DIST)));
      last = id1;
      for (i = 1; i < steps; i++) {
        mid = id1 + '_' + id2 + '_' + i;
        t = i / steps;
        r = Math.random();
        if (r < 0.10) type = 'card';
        else if (r < 0.22) type = 'event';
        else if (r < 0.38) type = 'red';
        else type = 'blue';
        nodes.push({
          id: mid,
          name: '',
          x: s1.x + (s2.x - s1.x) * t,
          y: s1.y + (s2.y - s1.y) * t,
          type: type,
          color: typeColors[type],
        });
        links.push([last, mid]);
        last = mid;
      }
      links.push([last, id2]);
    });

    global.mapData = { nodes: nodes, links: links };
  }

  /**
   * 現在位置から進める隣接ノードIDの配列を返す（lastPos は戻れない。canGoBack 時は戻れる）
   */
  function getChoices(p) {
    var pos = p.pos;
    var lastPos = p.lastPos;
    var canGoBack = p.canGoBack;
    var raw = global.mapData.links
      .filter(function (l) { return l.indexOf(pos) !== -1; })
      .map(function (l) { return l[0] === pos ? l[1] : l[0]; });
    var filtered = canGoBack ? raw : raw.filter(function (id) { return raw.length === 1 || id !== lastPos; });
    return filtered.length > 0 ? filtered : raw;
  }

  /**
   * 線路SVGとノードDOMを描画する
   */
  function drawMap() {
    var svg = document.getElementById('railway-svg');
    var nL = document.getElementById('nodes-layer');
    var nodes = global.mapData.nodes;
    var links = global.mapData.links;

    svg.innerHTML = '';
    nL.innerHTML = '';

    links.forEach(function (pair) {
      var id1 = pair[0], id2 = pair[1];
      var n1 = nodes.filter(function (n) { return n.id === id1; })[0];
      var n2 = nodes.filter(function (n) { return n.id === id2; })[0];
      if (!n1 || !n2) return;
      ['rail-base', 'rail-tie'].forEach(function (cls) {
        var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', n1.x); l.setAttribute('y1', n1.y);
        l.setAttribute('x2', n2.x); l.setAttribute('y2', n2.y);
        l.setAttribute('class', cls);
        svg.appendChild(l);
      });
      var a = Math.atan2(n2.y - n1.y, n2.x - n1.x);
      var ox = Math.sin(a) * 5, oy = -Math.cos(a) * 5;
      [-1, 1].forEach(function (s) {
        var r = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        r.setAttribute('x1', n1.x + ox * s); r.setAttribute('y1', n1.y + oy * s);
        r.setAttribute('x2', n2.x + ox * s); r.setAttribute('y2', n2.y + oy * s);
        r.setAttribute('class', 'rail-line');
        svg.appendChild(r);
      });
      var hl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hl.setAttribute('x1', n1.x); hl.setAttribute('y1', n1.y);
      hl.setAttribute('x2', n2.x); hl.setAttribute('y2', n2.y);
      hl.setAttribute('class', 'rail-highlight');
      hl.id = 'rail-hl-' + id1 + '-' + id2;
      svg.appendChild(hl);
    });

    var ic = { blue: '+', red: '-', card: '🃏', event: '!' };
    var bg = { blue: 'bg-blue-500', red: 'bg-red-500', card: 'bg-purple-500', event: 'bg-amber-500' };
    var cs = { blue: '#3b82f680', red: '#ef444480', card: '#8b5cf680', event: '#f59e0b80' };

    nodes.forEach(function (n) {
      var el = document.createElement('div');
      el.id = 'node-' + n.id;
      el.style.cssText = 'left:' + n.x + 'px;top:' + n.y + 'px;position:absolute;transform:translate(-50%,-50%);min-width:56px;min-height:56px;display:flex;align-items:center;justify-content:center';
      el.style.cursor = 'default';
      el.setAttribute('role', 'button');
      el.setAttribute('tabIndex', '-1');
      el.onclick = function (e) {
        e.stopPropagation();
        if (typeof global.handleNodeClick === 'function') global.handleNodeClick(n.id);
      };
      if (n.type === 'station') {
        el.className = 'station-node flex flex-col items-center justify-center node-touch-target';
        el.innerHTML = '<div class="w-14 h-14 rounded-2xl bg-blue-600 border-4 border-white shadow-xl flex items-center justify-center" style="box-shadow:0 4px 15px rgba(59,130,246,.5)"><span class="text-white text-xl">🏠</span></div><span class="mt-2 bg-white/95 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black shadow-lg border border-slate-200 whitespace-nowrap pointer-events-none">' + n.name + '駅</span>';
        el.setAttribute('aria-label', n.name + '駅');
      } else {
        el.className = 'mid-node flex items-center justify-center node-touch-target';
        el.innerHTML = '<div class="w-8 h-8 rounded-full ' + (bg[n.type] || 'bg-blue-500') + ' border-[3px] border-white shadow-lg flex items-center justify-center" style="box-shadow:0 2px 8px ' + (cs[n.type] || '#3b82f680') + '"><span class="text-white text-xs font-black pointer-events-none">' + (ic[n.type] || '+') + '</span></div>';
        el.setAttribute('aria-label', (n.type === 'card' ? 'カードマス' : n.type === 'event' ? 'イベントマス' : 'マス'));
      }
      nL.appendChild(el);
    });
  }

  global.initMap = initMap;
  global.getChoices = getChoices;
  global.drawMap = drawMap;
})(typeof window !== 'undefined' ? window : this);
