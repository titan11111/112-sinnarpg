/**
 * 九州電鉄 DX — 物件購入・増資（効果音統合版）
 */
(function (global) {
  'use strict';

  var STATIONS = global.STATIONS;
  var STATION_MAP = global.STATION_MAP;
  var INVEST_LEVEL_MAX = global.INVEST_LEVEL_MAX;
  var INVEST_COST_RATIO = global.INVEST_COST_RATIO;

  function SM() { return global.SoundManager; }

  function openPropertyModal(node) {
    var list = document.getElementById('property-list');
    var p = global.players[global.currentPlayerIdx];
    var discountRate = global.discountRate;
    var globalDiscount = global.globalDiscount;
    var dr = Math.max(discountRate, globalDiscount);
    var st = STATION_MAP.get(node.id);
    if (!st || !list || !p) return;

    var modalTitle = document.getElementById('modal-station-name');
    if (modalTitle) modalTitle.textContent = node.name + '駅';

    var allOwned = st.properties.map(function (sp) {
      var pls = global.players;
      for (var i = 0; i < pls.length; i++) {
        if (pls[i].properties.some(function (pp) { return pp.name === sp.name; })) return { owner: pls[i], prop: sp };
      }
      return null;
    });

    var moneyBarHtml = '<div class="p-3 mb-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white flex justify-between items-center"><div><span class="text-[9px] font-black uppercase opacity-70">所持金</span><span class="block text-xl font-black leading-tight">' + p.money.toLocaleString() + '万円</span></div><span class="text-2xl">💰</span></div>';

    var catLabels = { tourism: '観光', food: '食品', industry: '工業', agri: '農業', commerce: '商業', transport: '交通' };

    var propertyHtml = node.properties.map(function (prop, idx) {
      var myOwn = p.properties.filter(function (pr) { return pr.name === prop.name; })[0];
      var otherOwn = allOwned[idx] && allOwned[idx].owner.id !== p.id ? allOwned[idx] : null;
      var ep = Math.floor(prop.price * (1 - dr));
      var canBuy = !myOwn && !otherOwn && p.money >= ep;
      var tooExpensive = !myOwn && !otherOwn && p.money < ep;
      var inv = myOwn ? (myOwn.investLevel || 0) : 0;
      var investCost = Math.floor(prop.price * INVEST_COST_RATIO);
      var canInvest = myOwn && inv < INVEST_LEVEL_MAX && p.money >= investCost;
      var investTooExpensive = myOwn && inv < INVEST_LEVEL_MAX && p.money < investCost;
      var afterBuyMoney = p.money - ep;
      var afterInvestMoney = p.money - investCost;
      var catLabel = catLabels[prop.cat] || '';

      return '<div class="p-3 bg-white rounded-2xl border-2 ' + (myOwn ? 'border-green-300 bg-green-50' : otherOwn ? 'border-red-200 bg-red-50' : tooExpensive ? 'border-slate-200 bg-slate-50' : 'border-blue-200 bg-blue-50') + ' shadow">' +
        '<div class="flex justify-between items-center mb-1"><div><h4 class="font-black text-base text-blue-900">' + prop.name + '</h4><div class="flex gap-1 mt-0.5">' +
        (catLabel ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">' + catLabel + '</span>' : '') +
        (myOwn ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-200 text-green-700">✓ 所有中</span>' : '') +
        (otherOwn ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-200 text-red-600">' + otherOwn.owner.name + '所有</span>' : '') +
        (inv > 0 ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-700">増資Lv' + inv + '</span>' : '') +
        '</div></div><span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">収益' + (prop.profit * 100).toFixed(0) + '%' + (inv > 0 ? ' ×' + (1 + inv * 0.5).toFixed(1) : '') + '</span></div>' +
        '<div class="flex justify-between items-end gap-2 mt-2"><div><p class="text-lg font-black ' + (tooExpensive ? 'text-slate-400' : 'text-indigo-700') + '">' + ep.toLocaleString() + '万' + (dr > 0 ? ' <span class="text-xs text-red-500 line-through">' + prop.price.toLocaleString() + '万</span>' : '') + '</p>' +
        (!myOwn && !otherOwn ? '<p class="text-[9px] ' + (tooExpensive ? 'text-red-500 font-black' : 'text-slate-400') + '">購入後残金: ' + (tooExpensive ? '<span class="text-red-500">' + afterBuyMoney.toLocaleString() + '万 (不足！)</span>' : afterBuyMoney.toLocaleString() + '万') + '</p>' : '') +
        (myOwn && inv < INVEST_LEVEL_MAX ? '<p class="text-[9px] ' + (investTooExpensive ? 'text-red-500 font-black' : 'text-slate-400') + '">増資後残金: ' + (investTooExpensive ? '<span class="text-red-500">' + afterInvestMoney.toLocaleString() + '万 (不足！)</span>' : afterInvestMoney.toLocaleString() + '万') + '</p>' : '') +
        '</div><div class="flex gap-1 flex-shrink-0">' +
        (myOwn && inv < INVEST_LEVEL_MAX ? '<button onclick="investProperty(' + idx + ')" class="px-3 py-2 rounded-lg font-black text-xs shadow game-btn ' + (canInvest ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed') + '" ' + (canInvest ? '' : 'disabled') + '>📈 増資<br>' + investCost + '万</button>' : '') +
        '<button onclick="buyProperty(\'' + node.id + '\',' + idx + ')" class="px-4 py-2 rounded-lg font-black text-sm shadow transition game-btn ' + (canBuy ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : myOwn ? 'bg-green-100 text-green-500 cursor-not-allowed' : otherOwn ? 'bg-red-100 text-red-400 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') + '" ' + (canBuy ? '' : 'disabled') + '>' + (myOwn ? '購入済' : otherOwn ? '他所有' : tooExpensive ? '💸 不足' : '🛒 購入') + '</button></div></div></div>';
    }).join('');

    var ownedCount = st.properties.filter(function (sp) { return p.properties.some(function (pp) { return pp.name === sp.name; }); }).length;
    var totalCount = st.properties.length;
    var monopolyBarHtml = '';
    if (totalCount > 1) {
      var pct = Math.floor((ownedCount / totalCount) * 100);
      monopolyBarHtml = '<div class="p-2 mb-1 rounded-xl bg-amber-50 border border-amber-200"><div class="flex justify-between items-center text-[10px] font-black text-amber-700 mb-1"><span>👑 独占進捗</span><span>' + ownedCount + ' / ' + totalCount + '</span></div><div class="w-full bg-amber-200 rounded-full h-2"><div class="bg-amber-500 h-2 rounded-full transition-all" style="width:' + pct + '%"></div></div>' + (ownedCount === totalCount ? '<p class="text-xs font-black text-amber-600 mt-1 text-center">🎉 独占達成！収益&通行料3倍！</p>' : '') + '</div>';
    }

    list.innerHTML = moneyBarHtml + monopolyBarHtml + propertyHtml;
    document.getElementById('property-modal').classList.remove('hidden');
  }

  function buyProperty(sid, idx) {
    var st = STATION_MAP.get(sid);
    var prop = st.properties[idx];
    var p = global.players[global.currentPlayerIdx];
    var dr = Math.max(global.discountRate, global.globalDiscount);
    var ep = Math.floor(prop.price * (1 - dr));
    if (p.money < ep || p.properties.some(function (pr) { return pr.name === prop.name; })) return;
    p.money -= ep;
    p.properties.push({ name: prop.name, price: prop.price, profit: prop.profit, cat: prop.cat, stationName: st.name, stationId: st.id, investLevel: 0 });
    if (SM()) SM().playSeBuy();
    global.addLog(prop.name + 'を' + ep + '万で購入！');
    global.showFloatText('🏪 ' + prop.name);
    if (st.properties.every(function (sp) { return p.properties.some(function (pp) { return pp.name === sp.name; }); })) {
      if (SM()) SM().playSeMonopoly();
      global.addLog('★' + st.name + 'を独占！★');
      global.showFloatText('👑 ' + st.name + '独占！');
      global.showFlash('#eab308');
      showMonopolyCert(st.name, p.name);
    }
    global.discountRate = 0;
    global.updateUI();
    var node = global.mapData.nodes.filter(function (n) { return n.id === sid; })[0];
    if (node) openPropertyModal(node);
  }

  function buyPropertyInvest(idx) {
    var stNameEl = document.getElementById('modal-station-name');
    if (!stNameEl) return;
    var stName = stNameEl.textContent.replace('駅', '');
    var st = STATIONS.filter(function (s) { return s.name === stName; })[0];
    if (!st) return;
    var prop = st.properties[idx];
    var p = global.players[global.currentPlayerIdx];
    var myProp = p.properties.filter(function (pr) { return pr.name === prop.name; })[0];
    if (!myProp) return;
    var cost = Math.floor(prop.price * INVEST_COST_RATIO);
    if (p.money < cost || (myProp.investLevel || 0) >= INVEST_LEVEL_MAX) return;
    p.money -= cost;
    myProp.investLevel = (myProp.investLevel || 0) + 1;
    if (SM()) SM().playSeInvest();
    global.addLog(prop.name + 'に増資！（Lv' + myProp.investLevel + '）');
    global.showFloatText('📈 増資Lv' + myProp.investLevel);
    global.updateUI();
    var node = global.mapData.nodes.filter(function (n) { return n.id === st.id; })[0];
    if (node) openPropertyModal(node);
  }

  function showMonopolyCert(stationName, playerName) {
    var modal = document.getElementById('monopoly-cert-modal');
    var card = document.getElementById('monopoly-cert-card');
    var stEl = document.getElementById('monopoly-cert-station');
    var plEl = document.getElementById('monopoly-cert-player');
    if (!modal || !card) return;
    if (stEl) stEl.textContent = stationName + '駅';
    if (plEl) plEl.textContent = playerName;
    modal.classList.remove('hidden');
    card.classList.remove('scale-0', 'opacity-0');
    card.classList.add('monopoly-cert-visible');
  }

  function closeMonopolyCert() {
    var modal = document.getElementById('monopoly-cert-modal');
    var card = document.getElementById('monopoly-cert-card');
    if (!modal || !card) return;
    card.classList.remove('monopoly-cert-visible');
    modal.classList.add('hidden');
    card.classList.add('scale-0', 'opacity-0');
  }

  function closePropertyModal() {
    document.getElementById('property-modal').classList.add('hidden');
    global.discountRate = 0;
    global.globalDiscount = 0;
    global.finishTurnWithBinbou();
  }

  function npcBuyProperty(node) {
    var p = global.players[global.currentPlayerIdx];
    node.properties.forEach(function (prop) {
      if (p.money >= prop.price && !p.properties.some(function (pr) { return pr.name === prop.name; }) && Math.random() > 0.25) {
        p.money -= prop.price;
        p.properties.push({ name: prop.name, price: prop.price, profit: prop.profit, cat: prop.cat, stationName: node.name, stationId: node.id, investLevel: 0 });
        global.addLog(p.name + 'が' + prop.name + 'を購入');
      }
    });
    global.updateUI();
  }

  global.openPropertyModal = openPropertyModal;
  global.buyProperty = buyProperty;
  global.buyPropertyInvest = buyPropertyInvest;
  global.investProperty = buyPropertyInvest;
  global.showMonopolyCert = showMonopolyCert;
  global.closeMonopolyCert = closeMonopolyCert;
  global.closePropertyModal = closePropertyModal;
  global.npcBuyProperty = npcBuyProperty;
})(typeof window !== 'undefined' ? window : this);
