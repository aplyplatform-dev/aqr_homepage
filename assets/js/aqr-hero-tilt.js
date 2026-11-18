/**
 * 히어로 문구 그림자를 기기 기울기에 따라 움직인다. (안드로이드 전용)
 *
 * 계산 방식은 parallax.js(https://github.com/wagerfield/parallax, MIT)를 따랐다.
 *   · beta(앞뒤 기울기) / gamma(좌우 기울기)를 30으로 나눠 -1~1 범위로 만든다
 *   · 첫 측정값을 기준점(calibration)으로 잡는다 — 들고 있던 각도가 '0'이 된다
 *   · 세로 모드에서는 두 축을 바꿔 넣는다 (화면 좌표계가 90도 돌아가므로)
 *   · scalar 로 키우고, limit 으로 자르고, friction 으로 감속시킨다
 *     velocity += (target - velocity) * friction
 *
 * 안드로이드만 동작시키는 이유
 *   · iOS 는 DeviceOrientationEvent.requestPermission() 으로 사용자 동작(탭)을 거쳐야
 *     하는데, 홍보 문구 장식을 위해 권한 팝업을 띄울 일은 아니다.
 *   · 데스크톱에는 자이로가 없다. 마우스로 대체하지 않고 그냥 기본 그림자를 둔다.
 *
 * 동작하지 않아도 CSS 의 기본 그림자가 그대로 보인다.
 */
(function () {
  "use strict";

  var SELECTOR = ".hero-title";

  /* parallax.js 의 MAGIC_NUMBER. beta·gamma 를 -1~1 근처로 normalize 한다. */
  var MAGIC_NUMBER = 30;

  var SCALAR   = 10;    /* 기울기 1 당 몇 px 움직일지 */
  var LIMIT    = 7;     /* 최대 이동량(px). 더 키우면 그림자가 아니라 겹친 글자로 보인다 */
  var FRICTION = 0.12;  /* 0에 가까울수록 더 부드럽고 느리게 따라온다 */
  var INVERT   = true;  /* 기울인 반대쪽으로 그림자가 지게 — 빛이 고정된 것처럼 보인다 */

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || "");
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function start() {
    var nodes = document.querySelectorAll(SELECTOR);
    if (!nodes.length) return;

    /* 안드로이드가 아니거나, 자이로 이벤트가 없거나, 모션을 줄이기로 했으면
       CSS 의 기본 그림자만 쓰고 끝낸다. */
    if (!isAndroid() || !window.DeviceOrientationEvent || prefersReducedMotion()) return;

    var inputX = 0, inputY = 0;                 /* normalize 된 현재 기울기 */
    var calX = null, calY = null;               /* 기준점 */
    var velX = 0, velY = 0;                     /* 감속이 적용된 실제 표시값 */
    var portrait = null;
    var live = false;                           /* 측정값을 한 번이라도 받았는가 */
    var frame = null;

    function onOrientation(e) {
      var beta = e.beta, gamma = e.gamma;
      if (beta === null || gamma === null || beta === undefined || gamma === undefined) return;

      var x = beta / MAGIC_NUMBER;
      var y = gamma / MAGIC_NUMBER;

      /* 화면을 돌리면 기준점을 다시 잡는다 */
      var nowPortrait = window.innerHeight > window.innerWidth;
      if (portrait !== nowPortrait) {
        portrait = nowPortrait;
        calX = x; calY = y;
      }
      if (calX === null) { calX = x; calY = y; }

      inputX = x; inputY = y;

      if (!live) {
        live = true;
        for (var i = 0; i < nodes.length; i++) nodes[i].setAttribute("data-qr-tilt", "on");
        frame = window.requestAnimationFrame(tick);
      }
    }

    function tick() {
      var cx = inputX - calX;
      var cy = inputY - calY;

      /* 세로 모드에서는 기기 축과 화면 축이 90도 어긋난다 */
      var targetX = portrait ? cy : cx;
      var targetY = portrait ? cx : cy;

      targetX = clamp(targetX * SCALAR, -LIMIT, LIMIT);
      targetY = clamp(targetY * SCALAR, -LIMIT, LIMIT);
      if (INVERT) { targetX = -targetX; targetY = -targetY; }

      velX += (targetX - velX) * FRICTION;
      velY += (targetY - velY) * FRICTION;

      for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.setProperty("--qr-sx", velX.toFixed(2) + "px");
        nodes[i].style.setProperty("--qr-sy", velY.toFixed(2) + "px");
      }

      frame = window.requestAnimationFrame(tick);
    }

    window.addEventListener("deviceorientation", onOrientation, true);

    /* 탭이 가려지면 멈춘다 — 보이지 않는 화면을 매 프레임 그릴 이유가 없다 */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (frame) { window.cancelAnimationFrame(frame); frame = null; }
      } else if (live && !frame) {
        frame = window.requestAnimationFrame(tick);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
