/**
 * 九州電鉄 DX — ゲーム定数・設定
 * 駅・路線・カード・イベント・ヒーロー・月イベントの定義
 */
(function (global) {
  'use strict';

  // ---- 駅定義 ----
  const STATIONS = [
    { id: 'moji', name: '門司港', x: 1320, y: 120, properties: [{ name: 'レトロ観光', price: 1500, profit: 0.3, cat: 'tourism' }] },
    { id: 'kokura', name: '小倉', x: 1200, y: 160, properties: [{ name: '製鉄所', price: 8000, profit: 0.08, cat: 'industry' }, { name: '焼きうどん店', price: 800, profit: 0.5, cat: 'food' }] },
    { id: 'yukuhashi', name: '行橋', x: 1340, y: 320, properties: [{ name: '果物園', price: 1200, profit: 0.35, cat: 'agri' }] },
    { id: 'tenjin', name: '天神', x: 780, y: 240, properties: [{ name: '百貨店', price: 10000, profit: 0.07, cat: 'commerce' }, { name: '屋台村', price: 1500, profit: 0.4, cat: 'food' }] },
    { id: 'hakata', name: '博多', x: 900, y: 280, properties: [{ name: '明太子屋', price: 1000, profit: 0.5, cat: 'food' }, { name: 'ラーメン横丁', price: 2000, profit: 0.3, cat: 'food' }] },
    { id: 'dazaifu', name: '太宰府', x: 820, y: 380, properties: [{ name: '天満宮門前町', price: 2500, profit: 0.25, cat: 'tourism' }] },
    { id: 'kurume', name: '久留米', x: 680, y: 560, properties: [{ name: 'ゴム工場', price: 5000, profit: 0.12, cat: 'industry' }, { name: '焼きとり屋', price: 600, profit: 0.6, cat: 'food' }] },
    { id: 'tosu', name: '鳥栖', x: 660, y: 440, properties: [{ name: '物流拠点', price: 3000, profit: 0.15, cat: 'industry' }] },
    { id: 'saga', name: '佐賀', x: 520, y: 480, properties: [{ name: '海苔養殖場', price: 1500, profit: 0.3, cat: 'agri' }, { name: 'バルーンパーク', price: 2000, profit: 0.25, cat: 'tourism' }] },
    { id: 'karatsu', name: '唐津', x: 440, y: 320, properties: [{ name: 'イカ料理屋', price: 900, profit: 0.45, cat: 'food' }] },
    { id: 'sasebo', name: '佐世保', x: 340, y: 620, properties: [{ name: 'ハンバーガー店', price: 800, profit: 0.5, cat: 'food' }] },
    { id: 'nagasaki', name: '長崎', x: 280, y: 880, properties: [{ name: 'カステラ屋', price: 1200, profit: 0.4, cat: 'food' }, { name: 'グラバー園', price: 3000, profit: 0.2, cat: 'tourism' }] },
    { id: 'shimabara', name: '島原', x: 440, y: 980, properties: [{ name: '湧水庭園', price: 1000, profit: 0.35, cat: 'tourism' }] },
    { id: 'beppu', name: '別府', x: 1360, y: 540, properties: [{ name: '地獄めぐり', price: 2000, profit: 0.25, cat: 'tourism' }, { name: '温泉ホテル', price: 6000, profit: 0.1, cat: 'tourism' }] },
    { id: 'oita', name: '大分', x: 1340, y: 680, properties: [{ name: 'しいたけ園', price: 1500, profit: 0.3, cat: 'agri' }] },
    { id: 'usuki', name: '臼杵', x: 1280, y: 820, properties: [{ name: '石仏観光', price: 1000, profit: 0.35, cat: 'tourism' }] },
    { id: 'kumamoto', name: '熊本', x: 600, y: 960, properties: [{ name: '半導体工場', price: 12000, profit: 0.1, cat: 'industry' }, { name: '馬刺し屋', price: 800, profit: 0.5, cat: 'food' }] },
    { id: 'aso', name: '阿蘇', x: 900, y: 880, properties: [{ name: '牧場リゾート', price: 4000, profit: 0.18, cat: 'tourism' }] },
    { id: 'amakusa', name: '天草', x: 380, y: 1240, properties: [{ name: 'イルカウォッチング', price: 1500, profit: 0.3, cat: 'tourism' }] },
    { id: 'yatsushiro', name: '八代', x: 560, y: 1180, properties: [{ name: '晩白柚園', price: 1000, profit: 0.4, cat: 'agri' }] },
    { id: 'takachiho', name: '高千穂', x: 1040, y: 1020, properties: [{ name: '神社ツアー', price: 2000, profit: 0.25, cat: 'tourism' }] },
    { id: 'nobeoka', name: '延岡', x: 1260, y: 1040, properties: [{ name: 'チキン南蛮屋', price: 700, profit: 0.55, cat: 'food' }] },
    { id: 'miyazaki', name: '宮崎', x: 1200, y: 1360, properties: [{ name: 'マンゴー園', price: 2500, profit: 0.3, cat: 'agri' }, { name: '青島リゾート', price: 5000, profit: 0.12, cat: 'tourism' }] },
    { id: 'kirishima', name: '霧島', x: 1000, y: 1540, properties: [{ name: '焼酎蒸留所', price: 3000, profit: 0.2, cat: 'food' }] },
    { id: 'kagoshima', name: '鹿児島', x: 780, y: 1800, properties: [{ name: '黒豚農場', price: 2200, profit: 0.3, cat: 'agri' }, { name: '桜島フェリー', price: 4000, profit: 0.15, cat: 'transport' }] },
    { id: 'ibusuki', name: '指宿', x: 680, y: 2020, properties: [{ name: '砂むし温泉', price: 1800, profit: 0.3, cat: 'tourism' }] },
  ];

  const STATION_MAP = new Map(STATIONS.map(function (s) { return [s.id, s]; }));

  const STATION_LINKS = [
    ['moji', 'kokura'], ['kokura', 'yukuhashi'], ['kokura', 'hakata'],
    ['tenjin', 'hakata'], ['tenjin', 'karatsu'], ['hakata', 'dazaifu'],
    ['dazaifu', 'tosu'], ['tosu', 'kurume'], ['tosu', 'saga'],
    ['saga', 'karatsu'], ['saga', 'sasebo'],
    ['sasebo', 'nagasaki'], ['nagasaki', 'shimabara'],
    ['yukuhashi', 'beppu'], ['beppu', 'oita'], ['oita', 'usuki'],
    ['kurume', 'kumamoto'], ['kumamoto', 'aso'], ['aso', 'oita'],
    ['aso', 'takachiho'], ['takachiho', 'nobeoka'], ['nobeoka', 'usuki'],
    ['kumamoto', 'yatsushiro'], ['yatsushiro', 'amakusa'], ['shimabara', 'amakusa'],
    ['nobeoka', 'miyazaki'], ['miyazaki', 'kirishima'],
    ['yatsushiro', 'kagoshima'], ['kirishima', 'kagoshima'], ['kagoshima', 'ibusuki'],
    ['takachiho', 'kirishima'],
  ];

  // ---- カード（18種） ----
  const CARD_DEFS = [
    { id: 'express', name: '急行カード', emoji: '🚅', desc: '出目×2', use: 'beforeRoll', rarity: 1 },
    { id: 'superexpress', name: '特急カード', emoji: '🚄', desc: '出目×3', use: 'beforeRoll', rarity: 2 },
    { id: 'shinkansen', name: '新幹線カード', emoji: '🚅', desc: '1〜12好きな出目', use: 'beforeRoll', rarity: 3 },
    { id: 'butto', name: 'ぶっとびカード', emoji: '🚀', desc: 'ランダム駅ワープ', use: 'beforeRoll', rarity: 1 },
    { id: 'targetwarp', name: '指定ワープ', emoji: '🎯', desc: '好きな駅ワープ', use: 'beforeRoll', rarity: 3 },
    { id: 'back', name: '戻れカード', emoji: '↩️', desc: '相手を3マス戻す', use: 'beforeRoll', rarity: 2 },
    { id: 'stop', name: '足踏みカード', emoji: '🦶', desc: '相手を1T停止', use: 'beforeRoll', rarity: 2 },
    { id: 'switch', name: '切替カード', emoji: '🔀', desc: '来た道も戻れる', use: 'beforeRoll', rarity: 1 },
    { id: 'destroy', name: '物件飛び', emoji: '💣', desc: '相手物件1つ破壊', use: 'anytime', rarity: 3 },
    { id: 'tax', name: '税務署カード', emoji: '🏛️', desc: '相手所持金20%徴収', use: 'anytime', rarity: 2 },
    { id: 'takeover', name: '乗っ取り', emoji: '🏴', desc: '相手物件を定価で奪う', use: 'onStation', rarity: 4 },
    { id: 'binboucard', name: 'ビンボー神', emoji: '👻', desc: '相手にビンボー神付与', use: 'anytime', rarity: 3 },
    { id: 'seal', name: '封印カード', emoji: '🔒', desc: '相手カード1枚破壊', use: 'anytime', rarity: 2 },
    { id: 'tax_cut', name: '徳政令', emoji: '📜', desc: '借金帳消し', use: 'anytime', rarity: 2 },
    { id: 'barrier', name: 'バリア', emoji: '🛡️', desc: '次の攻撃を無効化', use: 'anytime', rarity: 3 },
    { id: 'peek', name: '偵察カード', emoji: '🔭', desc: '相手情報を見る', use: 'anytime', rarity: 1 },
    { id: 'shop', name: '割引カード', emoji: '🏪', desc: '物件30%OFF', use: 'onStation', rarity: 1 },
    { id: 'monopoly', name: '独占カード', emoji: '👑', desc: '不足物件1つ無料GET', use: 'onStation', rarity: 4 },
  ];

  // ---- イベント ----
  const EVENTS_GOOD = [
    { text: '沿線の観光客が急増！', money: 2000, icon: '🎉' },
    { text: '地元のお祭りで大盛況！', money: 1500, icon: '🎆' },
    { text: '国の補助金を獲得！', money: 3000, icon: '🏛️' },
    { text: '新幹線開通記念ボーナス！', money: 2500, icon: '🚄' },
    { text: 'ふるさと納税が好調！', money: 2000, icon: '📦' },
    { text: 'テレビで沿線特集！広告収入！', money: 1800, icon: '📺' },
    { text: '海外観光客のツアー開始！', money: 2200, icon: '✈️' },
    { text: 'カード2枚ゲット！', money: 0, icon: '🃏', special: 'cards2' },
  ];
  const EVENTS_BAD = [
    { text: '台風で路線が不通…', money: -2000, icon: '🌀' },
    { text: '赤字路線の維持費が嵩む…', money: -1500, icon: '📉' },
    { text: '設備の老朽化で修繕費…', money: -1000, icon: '🔧' },
    { text: 'ストライキで運休…', money: -1200, icon: '🚫' },
    { text: '不祥事で株価下落…', money: -1800, icon: '📰' },
    { text: '地震で被害…', money: -2500, icon: '🌋' },
  ];

  // ---- ヒーロー ----
  const HEROES = [
    { id: 'ryoma', name: '坂本龍馬', emoji: '⚔️', trigger: { station: 'nagasaki', type: 'monopoly' }, desc: '全収益+30%（3ターン）', effect: 'profitBoost', value: 0.3, duration: 3 },
    { id: 'saigo', name: '西郷隆盛', emoji: '🗡️', trigger: { station: 'kagoshima', type: 'visit5' }, desc: 'ビンボー神を追放！', effect: 'removeBinbou', value: 0, duration: 0 },
    { id: 'kanbei', name: '黒田官兵衛', emoji: '🏯', trigger: { station: 'hakata', type: 'monopoly' }, desc: '通行料無効化（3ターン）', effect: 'tollShield', value: 0, duration: 3 },
    { id: 'michizane', name: '菅原道真', emoji: '📚', trigger: { station: 'dazaifu', type: 'visit3' }, desc: 'カード3枚追加！', effect: 'cards3', value: 0, duration: 0 },
    { id: 'kiyomasa', name: '加藤清正', emoji: '🐯', trigger: { station: 'kumamoto', type: 'monopoly' }, desc: '物件被害無効（5ターン）', effect: 'propShield', value: 0, duration: 5 },
  ];

  // ---- 月イベント（fn 内で globalDiscount / seasonBonus を window に設定。state.js 読み込み後に実行される想定） ----
  const MONTH_EVENTS = {
    1: { name: '🎍 お正月', desc: '全員+500万円', fn: function (ps) { ps.forEach(function (p) { p.money += 500; }); } },
    4: { name: '🌸 新年度', desc: '物件10%OFF（今月のみ）', fn: function () { if (global.globalDiscount !== undefined) global.globalDiscount = 0.1; } },
    7: { name: '🎆 夏祭り', desc: '観光系収益2倍（次決算）', fn: function () { if (global.seasonBonus !== undefined) global.seasonBonus = 'tourism'; } },
    8: { name: '🏖️ お盆', desc: '交通系収益2倍（次決算）', fn: function () { if (global.seasonBonus !== undefined) global.seasonBonus = 'transport'; } },
    10: { name: '🍁 収穫祭', desc: '農業・食品系収益2倍（次決算）', fn: function () { if (global.seasonBonus !== undefined) global.seasonBonus = 'agri_food'; } },
  };

  // ---- プレイヤー見た目 ----
  const PCOLORS = ['#2563eb', '#dc2626', '#16a34a', '#eab308'];
  const PBORDERS = ['#1d4ed8', '#b91c1c', '#15803d', '#ca8a04'];
  const PEMOJIS = ['🚂', '🚃', '🚋', '🚝'];
  const PNAMES_DEFAULT = ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4'];

  // ---- マップ・ゲームバランス定数 ----
  const MAP = { WORLD_W: 2400, WORLD_H: 3000, LINK_STEP_DIST: 140, LINK_STEPS_MIN: 2, LINK_STEPS_MAX: 5 };
  const CARD_RARITY_WEIGHTS = { 1: 5, 2: 3, 3: 2, 4: 1 };
  const CARD_HAND_MAX = 12;
  const START_MONEY = 10000;
  const START_STATION_ID = 'hakata';
  const GOAL_REWARD_BASE = 3000;
  const GOAL_REWARD_PER_DIST = 3;
  const BINBOU_KING_TURNS = 8;
  const BINBOU_KING_CHANCE = 0.5;
  const SETTLEMENT_MONTHS = [4, 10];
  const INVEST_LEVEL_MAX = 3;
  const INVEST_COST_RATIO = 0.5;
  const MONOPOLY_TOLL_MULT = 3;
  const TOLL_RATE = 0.1;

  global.STATIONS = STATIONS;
  global.STATION_MAP = STATION_MAP;
  global.STATION_LINKS = STATION_LINKS;
  global.CARD_DEFS = CARD_DEFS;
  global.EVENTS_GOOD = EVENTS_GOOD;
  global.EVENTS_BAD = EVENTS_BAD;
  global.HEROES = HEROES;
  global.MONTH_EVENTS = MONTH_EVENTS;
  global.PCOLORS = PCOLORS;
  global.PBORDERS = PBORDERS;
  global.PEMOJIS = PEMOJIS;
  global.PNAMES_DEFAULT = PNAMES_DEFAULT;
  global.MAP = MAP;
  global.CARD_RARITY_WEIGHTS = CARD_RARITY_WEIGHTS;
  global.CARD_HAND_MAX = CARD_HAND_MAX;
  global.START_MONEY = START_MONEY;
  global.START_STATION_ID = START_STATION_ID;
  global.GOAL_REWARD_BASE = GOAL_REWARD_BASE;
  global.GOAL_REWARD_PER_DIST = GOAL_REWARD_PER_DIST;
  global.BINBOU_KING_TURNS = BINBOU_KING_TURNS;
  global.BINBOU_KING_CHANCE = BINBOU_KING_CHANCE;
  global.SETTLEMENT_MONTHS = SETTLEMENT_MONTHS;
  global.INVEST_LEVEL_MAX = INVEST_LEVEL_MAX;
  global.INVEST_COST_RATIO = INVEST_COST_RATIO;
  global.MONOPOLY_TOLL_MULT = MONOPOLY_TOLL_MULT;
  global.TOLL_RATE = TOLL_RATE;
})(typeof window !== 'undefined' ? window : this);
