/**
 * 九州電鉄 DX — BGM/効果音（Web Audio API）
 * ユーザージェスチャー内で init() を呼ぶこと。音声ファイルなしでオシレーターでSE/BGMを生成。
 */
(function (global) {
  'use strict';

  var ctx = null;
  var initialized = false;
  var bgmGain = null;
  var seGain = null;
  var bgmOsc = null;
  var bgmTimeout = null;
  var BGM_VOL = 0.08;
  var SE_VOL = 0.25;

  // localStorage キー
  var KEY_BGM = 'kyushu_rail_bgm';
  var KEY_SE = 'kyushu_rail_se';

  function getBgmEnabled() {
    try {
      var v = localStorage.getItem(KEY_BGM);
      return v === null ? true : v === '1';
    } catch (e) { return true; }
  }
  function getSeEnabled() {
    try {
      var v = localStorage.getItem(KEY_SE);
      return v === null ? true : v === '1';
    } catch (e) { return true; }
  }
  function setBgmEnabled(b) {
    try { localStorage.setItem(KEY_BGM, b ? '1' : '0'); } catch (e) {}
  }
  function setSeEnabled(b) {
    try { localStorage.setItem(KEY_SE, b ? '1' : '0'); } catch (e) {}
  }

  function init() {
    if (initialized) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ctx = new Ctx();
      // iOS Safari のロック解除用に短い無音を再生
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      bgmGain = ctx.createGain();
      seGain = ctx.createGain();
      bgmGain.connect(ctx.destination);
      seGain.connect(ctx.destination);
      bgmGain.gain.value = getBgmEnabled() ? BGM_VOL : 0;
      seGain.gain.value = getSeEnabled() ? SE_VOL : 0;
      initialized = true;
    } catch (e) {}
  }

  function ensureResumed() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
  }

  // 季節に応じたBGM（シンプルなループメロディ）
  var SEASON_FREQS = {
    spring: [523.25, 659.25, 783.99, 659.25],
    summer: [392, 493.88, 587.33, 493.88],
    autumn: [349.23, 440, 523.25, 440],
    winter: [293.66, 369.99, 440, 369.99]
  };

  function playBgmForSeason(season) {
    if (!initialized || !ctx || !bgmGain || bgmGain.gain.value < 0.01) return;
    ensureResumed();
    var freqs = SEASON_FREQS[season] || SEASON_FREQS.spring;
    var idx = 0;
    function tick() {
      if (!bgmGain || bgmGain.gain.value < 0.01) return;
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freqs[idx % freqs.length];
      osc.connect(bgmGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      idx++;
      bgmTimeout = setTimeout(tick, 420);
    }
    stopBgm();
    tick();
  }

  function stopBgm() {
    if (bgmTimeout) {
      clearTimeout(bgmTimeout);
      bgmTimeout = null;
    }
  }

  function playSeDice() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }

  function playSeBuy() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    // レジ風の短い2音
    [600, 800].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.6, ctx.currentTime + i * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.15);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.16);
    });
  }

  function playSeMonopoly() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(SE_VOL * 0.5, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function playSeKingEvolution() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.5);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  }

  function playSeMoveStep() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [400, 500].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.08);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.1);
    });
  }

  function playSeStationArrive() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [523.25, 659.25, 783.99].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.5, ctx.currentTime + i * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.12);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.14);
    });
  }

  function playSeGoalArrive() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.5, ctx.currentTime + i * 0.1 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.22);
    });
  }

  function playSeCardGet() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [660, 880, 1108.73].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.12);
    });
  }

  function playSeCardUse() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  function playSeEventGood() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.45, ctx.currentTime + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.12);
    });
  }

  function playSeEventBad() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [400, 300, 200].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.3, ctx.currentTime + i * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.12);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.14);
    });
  }

  function playSeToll() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.25);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.32);
  }

  function playSeRedSquare() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.28);
  }

  function playSeBlueSquare() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [500, 700].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.12);
    });
  }

  function playSeBinbou() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.3);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.38);
  }

  function playSeBinbouTransfer() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
  }

  function playSeSettlement() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [392, 493.88, 587.33].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.45, ctx.currentTime + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.18);
    });
  }

  function playSeHero() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.2);
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(function () {
      if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
      [523.25, 659.25, 783.99].forEach(function (freq, i) {
        var o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        var ga = ctx.createGain();
        ga.gain.setValueAtTime(0, ctx.currentTime);
        ga.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + i * 0.06 + 0.02);
        ga.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.12);
        o.connect(ga);
        ga.connect(seGain);
        o.start(ctx.currentTime + i * 0.07);
        o.stop(ctx.currentTime + i * 0.07 + 0.14);
      });
    }, 180);
  }

  function playSeWarp() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.2);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(SE_VOL * 0.35, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  function playSeResult() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [392, 523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.5, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.14);
      osc.stop(ctx.currentTime + i * 0.14 + 0.28);
    });
  }

  function playSeInvest() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + i * 0.04 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.04 + 0.08);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.1);
    });
  }

  function playSeStop() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 280;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  function playSeModalOpen() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 600;
    var g = ctx.createGain();
    g.gain.setValueAtTime(SE_VOL * 0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.connect(g);
    g.connect(seGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  function playSeMonthEvent() {
    if (!initialized || !ctx || !seGain || seGain.gain.value < 0.01) return;
    ensureResumed();
    [440, 554.37, 659.25].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(SE_VOL * 0.4, ctx.currentTime + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);
      osc.connect(g);
      g.connect(seGain);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.12);
    });
  }

  function setBgmMute(mute) {
    setBgmEnabled(!mute);
    if (bgmGain) bgmGain.gain.value = mute ? 0 : BGM_VOL;
    return !mute;
  }

  function setSeMute(mute) {
    setSeEnabled(!mute);
    if (seGain) seGain.gain.value = mute ? 0 : SE_VOL;
    return !mute;
  }

  function toggleBgm() {
    var next = !getBgmEnabled();
    setBgmMute(!next);
    return next;
  }

  function toggleSe() {
    var next = !getSeEnabled();
    setSeMute(!next);
    return next;
  }

  global.SoundManager = {
    init: init,
    ensureResumed: ensureResumed,
    playBgmForSeason: playBgmForSeason,
    stopBgm: stopBgm,
    playSeDice: playSeDice,
    playSeBuy: playSeBuy,
    playSeMonopoly: playSeMonopoly,
    playSeKingEvolution: playSeKingEvolution,
    playSeMoveStep: playSeMoveStep,
    playSeStationArrive: playSeStationArrive,
    playSeGoalArrive: playSeGoalArrive,
    playSeCardGet: playSeCardGet,
    playSeCardUse: playSeCardUse,
    playSeEventGood: playSeEventGood,
    playSeEventBad: playSeEventBad,
    playSeToll: playSeToll,
    playSeRedSquare: playSeRedSquare,
    playSeBlueSquare: playSeBlueSquare,
    playSeBinbou: playSeBinbou,
    playSeBinbouTransfer: playSeBinbouTransfer,
    playSeSettlement: playSeSettlement,
    playSeHero: playSeHero,
    playSeWarp: playSeWarp,
    playSeResult: playSeResult,
    playSeInvest: playSeInvest,
    playSeStop: playSeStop,
    playSeModalOpen: playSeModalOpen,
    playSeMonthEvent: playSeMonthEvent,
    setBgmMute: setBgmMute,
    setSeMute: setSeMute,
    toggleBgm: toggleBgm,
    toggleSe: toggleSe,
    getBgmEnabled: getBgmEnabled,
    getSeEnabled: getSeEnabled
  };
})(typeof window !== 'undefined' ? window : this);
