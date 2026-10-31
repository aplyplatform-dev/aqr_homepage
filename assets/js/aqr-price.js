/**
 * AQR 홍보 페이지 가격 표시
 *
 * 가격 API(backend/api/index.php 의 action=price)의 응답으로 화면의 금액을 바꾼다.
 * 관리 화면(aqr_admin/aqr_price_setting.php)에서 가격을 바꾸면 이 페이지도 따라 바뀐다.
 *
 *   요청 : GET https://aplx.link/api/?action=price   (토큰 없음 · Origin 확인만)
 *   응답 : { result, message, sendstatus, data: { krw: { year: {price, original_price, off_percent}, month: {...} }, ... } }
 *
 * 마크업 규칙
 *   data-aqr-price="krw.year.price"   : 그 자리에 금액을 쓴다. data-aqr-suffix 를 뒤에 붙인다.
 *   data-aqr-original="krw.year"      : 정가(취소선) 묶음. 할인이 없으면 통째로 감춘다.
 *
 * HTML 에 적힌 값은 지우지 않는다. API 가 응답하지 않아도, 자바스크립트를 실행하지 않는
 * 크롤러에게도 그 값이 그대로 보여야 하기 때문이다. (index.html 의 JSON-LD 와 같은 값)
 */
(function () {
  "use strict";

  var API_URL = "https://aplx.link/api/?action=price";

  /** "krw.year.price" 처럼 점으로 이어진 이름으로 값을 꺼낸다. 없으면 undefined */
  function pick(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return (o === null || o === undefined) ? undefined : o[k];
    }, obj);
  }

  /** 1000 단위 쉼표. 소수가 있으면 그대로 둔다(달러 대비). */
  function format(n) {
    var num = Number(n);
    if (!isFinite(num)) return null;
    return num.toLocaleString("ko-KR");
  }

  function applyPrices(data) {
    // 금액
    document.querySelectorAll("[data-aqr-price]").forEach(function (el) {
      var value = format(pick(data, el.getAttribute("data-aqr-price")));
      if (value === null) return;               // 모르는 항목이면 HTML 에 적힌 값을 그대로 둔다
      el.textContent = value + (el.getAttribute("data-aqr-suffix") || "");
    });

    // 정가(취소선) — 할인이 없으면 감춘다. "5,900원 5,900원" 처럼 보이지 않게.
    document.querySelectorAll("[data-aqr-original]").forEach(function (el) {
      var plan = pick(data, el.getAttribute("data-aqr-original"));
      if (!plan) return;
      var discounted = Number(plan.original_price) > Number(plan.price);
      el.style.display = discounted ? "" : "none";
    });
  }

  /**
   * 구조화 데이터(JSON-LD)의 금액도 같이 바꾼다.
   * 화면에 보이는 값과 JSON-LD 가 어긋나면 검색엔진이 스팸으로 본다. 둘은 항상 같아야 한다.
   */
  function applyStructuredData(data) {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (node) {
      var ld;
      try { ld = JSON.parse(node.textContent); } catch (e) { return; }

      var changed = false;
      (ld["@graph"] || []).forEach(function (entity) {
        var offers = entity && entity.offers;
        if (!Array.isArray(offers)) return;
        offers.forEach(function (offer) {
          var plan = offer.name && offer.name.indexOf("연간") >= 0 ? data.krw.year
                   : offer.name && offer.name.indexOf("월간") >= 0 ? data.krw.month
                   : null;
          if (!plan || offer.price === String(plan.price)) return;
          offer.price = String(plan.price);
          changed = true;
        });
      });

      if (changed) node.textContent = JSON.stringify(ld, null, 2);
    });
  }

  function load() {
    if (!window.fetch || !document.querySelector("[data-aqr-price]")) return;

    fetch(API_URL, { credentials: "omit" })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
      .then(function (body) {
        if (!body || body.result !== "success" || !body.data || !body.data.krw) return;
        applyPrices(body.data);
        applyStructuredData(body.data);
      })
      .catch(function (err) {
        // 실패해도 화면은 그대로 둔다 — HTML 에 적힌 값이 보인다.
        if (window.console) console.warn("[AQR] 가격 조회 실패, 기본 표기를 사용합니다.", err);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
