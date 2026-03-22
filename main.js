/**
 * 九州電鉄 DX — エントリ（タッチ防止・ダブルタップズーム防止・マップドラッグ）
 */
(function (global) {
  'use strict';

  var dragStartX = 0;
  var dragStartY = 0;
  var dragStarted = false;

  function getClientXY(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function initViewportDrag() {
    var vp = document.getElementById('viewport');
    if (!vp) return;

    vp.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      dragStarted = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    });
    vp.addEventListener('mousemove', function (e) {
      if (!dragStarted) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      if (global.applyViewportDrag) global.applyViewportDrag(dx, dy);
    });
    vp.addEventListener('mouseup', function () { dragStarted = false; });
    vp.addEventListener('mouseleave', function () { dragStarted = false; });

    vp.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        dragStarted = true;
        var xy = getClientXY(e);
        dragStartX = xy.x;
        dragStartY = xy.y;
      }
    }, { passive: true });
    vp.addEventListener('touchmove', function (e) {
      if (!dragStarted || e.touches.length !== 1) return;
      var xy = getClientXY(e);
      var dx = xy.x - dragStartX;
      var dy = xy.y - dragStartY;
      dragStartX = xy.x;
      dragStartY = xy.y;
      if (global.applyViewportDrag) global.applyViewportDrag(dx, dy);
      e.preventDefault();
    }, { passive: false });
    vp.addEventListener('touchend', function (e) {
      if (e.touches.length === 0) dragStarted = false;
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewportDrag);
  } else {
    initViewportDrag();
  }

  // ゲーム領域の意図しないスクロール・ズームを防止（標準要件）
  document.addEventListener('touchmove', function (e) {
    if (e.target.closest('#viewport') || e.target.closest('#game-screen')) {
      e.preventDefault();
    }
  }, { passive: false });

  var lastTouchEnd = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, false);

  // ボタンタップ時の触覚フィードバック（対応環境のみ）
  document.addEventListener('click', function (e) {
    if (e.target.closest('.game-btn') && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }, { passive: true });
})(typeof window !== 'undefined' ? window : this);
