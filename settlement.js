/**
 * 九州電鉄 DX — 決算・リザルト（効果音統合版）
 */
(function (global) {
  'use strict';

  var STATIONS = global.STATIONS;
  var STATION_MAP = global.STATION_MAP;

  function SM() { return global.SoundManager; }

  function showSettlement(isFinal) {
    global.waitingForSettlement = true;
    global._isFinalSettlement = isFinal;
    var currentMonth = global.currentMonth;
    var currentYear = global.currentYear;
    var players = global.players;
    var seasonBonus = global.seasonBonus;
    var heroEffects = global.heroEffects;
    var ye = currentMonth > 12;
    var titleEl = document.getElementById('settlement-title');
    if (titleEl) titleEl.textContent = ye ? (currentYear + '年目 年末決算！') : (currentYear + '年目 ' + (currentMonth === 4 ? '上半期' : '下半期') + '決算！');
    var ct = document.getElementById('settlement-content');
    if (!ct) return;
    var html = '';
    players.forEach(function (p, pi) {
      var tp = 0;
      var pd = p.properties.map(function (pr) {
        var invMul = 1 + (pr.investLevel || 0) * 0.5;
        var profitMul = invMul * (ye ? 1 : 0.5);
        var st = STATION_MAP.get(pr.stationId);
        if (st && st.properties.every(function (sp) { return p.properties.some(function (pp) { return pp.name === sp.name; }); })) profitMul *= 2;
        if (seasonBonus === 'tourism' && pr.cat === 'tourism') profitMul *= 2;
        if (seasonBonus === 'transport' && pr.cat === 'transport') profitMul *= 2;
        if (seasonBonus === 'agri_food' && (pr.cat === 'agri' || pr.cat === 'food')) profitMul *= 2;
        if (heroEffects[pi] && heroEffects[pi].effect === 'profitBoost' && heroEffects[pi].remaining > 0) profitMul *= (1 + heroEffects[pi].value);
        var inc = Math.floor(pr.price * pr.profit * profitMul);
        tp += inc;
        return '<div class="flex justify-between text-sm"><span class="text-slate-600">' + pr.name + '</span><span class="font-bold text-green-600">+' + inc.toLocaleString() + '万</span></div>';
      });
      p.money += tp;
      p.totalIncome += tp;
      html += '<div class="p-4 rounded-2xl border-2 ' + (pi === 0 ? 'border-blue-300 bg-blue-50' : 'border-red-300 bg-red-50') + '"><div class="flex justify-between items-center mb-1"><h3 class="text-lg font-black">' + p.name + '</h3><span class="text-lg font-black ' + (tp > 0 ? 'text-green-600' : 'text-slate-400') + '">+' + tp.toLocaleString() + '万</span></div><div class="space-y-0.5">' + (pd.length > 0 ? pd.join('') : '<div class="text-sm text-slate-400">物件なし</div>') + '</div><div class="mt-2 pt-1 border-t flex justify-between font-black text-sm"><span>所持金</span><span>' + p.money.toLocaleString() + '万円</span></div></div>';
    });
    global.seasonBonus = '';
    global.globalDiscount = 0;
    ct.innerHTML = html;
    document.getElementById('settlement-screen').classList.remove('hidden');
    if (SM()) SM().playSeSettlement();
    global.updateUI();
  }

  function closeSettlement() {
    document.getElementById('settlement-screen').classList.add('hidden');
    global.waitingForSettlement = false;

    if (global._isFinalSettlement) {
      showResult();
      return;
    }

    if (global.currentMonth > 12) {
      global.currentMonth = 1;
      global.currentYear++;
    }

    global.handleMonthEvent();
    global.updateSeasonParticles();
    if (SM()) SM().playBgmForSeason(global.getSeason());
    global.updateCamera();
    global.updateUI();

    var nextPlayer = global.players[global.currentPlayerIdx];
    if (nextPlayer && nextPlayer.isCPU) {
      setTimeout(global.handleRollButtonClick, 800);
    }
  }

  function showResult() {
    var players = global.players;
    players.forEach(function (p) {
      p.propValue = p.properties.reduce(function (s, pr) { return s + pr.price + (pr.investLevel || 0) * Math.floor(pr.price * 0.5); }, 0);
      p.totalAssets = p.money + p.propValue;
    });
    var sorted = players.slice().sort(function (a, b) { return b.totalAssets - a.totalAssets; });
    var w = sorted[0];
    var winnerEl = document.getElementById('winner-name');
    var assetsEl = document.getElementById('winner-assets');
    var detailsEl = document.getElementById('result-details');
    if (winnerEl) winnerEl.textContent = w.name;
    if (assetsEl) assetsEl.textContent = '総資産：' + w.totalAssets.toLocaleString() + '万円';
    if (detailsEl) {
      detailsEl.innerHTML = sorted.map(function (p, i) {
        return '<div class="p-4 rounded-xl ' + (i === 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-slate-100') + '"><p class="font-black text-lg mb-1">' + (i === 0 ? '👑' : '') + (i + 1) + '位 ' + p.name + '</p><div class="grid grid-cols-2 gap-1 text-sm"><div>所持金</div><div class="text-right font-bold">' + p.money.toLocaleString() + '万</div><div>物件価値</div><div class="text-right font-bold">' + p.propValue.toLocaleString() + '万</div><div>累計収益</div><div class="text-right font-bold">' + p.totalIncome.toLocaleString() + '万</div><div class="font-black border-t pt-1">総資産</div><div class="text-right font-black border-t pt-1">' + p.totalAssets.toLocaleString() + '万</div></div><div class="mt-2 flex flex-wrap gap-1">' + p.properties.map(function (pr) { return '<span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">' + pr.name + '</span>'; }).join('') + '</div></div>';
      }).join('');
    }
    if (SM()) { SM().stopBgm(); SM().playSeResult(); }
    document.getElementById('result-screen').classList.remove('hidden');
  }

  global.showSettlement = showSettlement;
  global.closeSettlement = closeSettlement;
  global.showResult = showResult;
})(typeof window !== 'undefined' ? window : this);
