
  var manualMode = false;
  const AAPI_captchaSiteKey = '0x4AAAAAAA62_43H2MO9goDN';
  let AAPI_turnstile_callback = null;  // 토큰을 기다리는 콜백
  let AAPI_turnstile_token    = null;  // 프리페치된 토큰 캐시
  let AAPI_turnstile_widget_id = null; // render()가 반환한 위젯 ID

  

  window.addEventListener('load', function(){
    var el = document.getElementById('page-spinner');
    var shown = Date.now();
    function revealCards(){
      var privacyCard = document.getElementById('privacyCard');
      if(privacyCard) {
        privacyCard.classList.remove('slide-hidden');
        privacyCard.classList.add('slide-in-delay');
        // 애니메이션 종료 후 클래스 제거: transform 합성 레이어가 버튼 터치 영역을
        // 잘못 점유하는 Samsung Internet 버그 방지 (animation: 0.5s + delay: 0.15s)
        setTimeout(function() {
          privacyCard.classList.remove('slide-in-delay');
        }, 700);
      }
    }
    var hide = function(){
      el.style.transition='opacity .3s';
      el.style.pointerEvents='none';
      el.style.opacity='0';
      setTimeout(function(){ el.style.display='none'; revealCards(); }, 300);
    };
    var elapsed = Date.now() - shown;
    var delay = Math.max(0, 1500 - elapsed);
    setTimeout(hide, delay);
    
    setInputListeners();

    AAPI_initTurnstile();
  });

  
  function AAPI_turnstileSetCallback(token) {
    if (AAPI_turnstile_callback) {
      const cb = AAPI_turnstile_callback;
      AAPI_turnstile_callback = null;
      AAPI_turnstile_token = null;
      cb(token);
    } else {
      AAPI_turnstile_token = token;
    }
  }

  function AAPI_turnstileExpiredCallback() {
    AAPI_turnstile_token = null;
  }

  function AAPI_initTurnstile() {
    if (typeof turnstile === "undefined" || !turnstile) return;
    if (!document.querySelector('#turnstileWidget')) return;
    turnstile.ready(function () {
      AAPI_turnstile_widget_id = turnstile.render('#turnstileWidget', {
        sitekey: AAPI_captchaSiteKey,
        callback: AAPI_turnstileSetCallback,
        'expired-callback': AAPI_turnstileExpiredCallback,
      });
    });
  }

  function AAPI_getCaptchaToken(tokencallback) {
    if (typeof turnstile === "undefined" || !turnstile) return;

    if (AAPI_turnstile_token) {
      const token = AAPI_turnstile_token;
      AAPI_turnstile_token = null;
      tokencallback(token);
      return;
    }

    AAPI_turnstile_callback = tokencallback;
    if (AAPI_turnstile_widget_id !== null) {
      turnstile.reset(AAPI_turnstile_widget_id);
    } else {
      turnstile.ready(function () {
        AAPI_turnstile_widget_id = turnstile.render('#turnstileWidget', {
          sitekey: AAPI_captchaSiteKey,
          callback: AAPI_turnstileSetCallback,
          'expired-callback': AAPI_turnstileExpiredCallback,
        });
      });
    }
  }
  
  /* 데스크탑 장식 아이콘 표시 */
  (function () {
    var deco = document.querySelector('.header-deco');
    if (deco && window.innerWidth >= 1024) {
      deco.style.display = 'flex';
    }
    window.addEventListener('resize', function () {
      if (deco) deco.style.display = window.innerWidth >= 1024 ? 'flex' : 'none';
    });
  })();

  function setInputListeners() {
    var bizNoInput = document.getElementById('manualBizNo');
    var accountNameInput = document.getElementById('manualAccountName');
    var accountNoInput = document.getElementById('manualAccountNo');
    if (bizNoInput) bizNoInput.addEventListener('input', monitorInputForms);
    if (accountNameInput) accountNameInput.addEventListener('input', monitorInputForms);
    if (accountNoInput) accountNoInput.addEventListener('input', monitorInputForms);
  }

  function showManualForm() {    
    var card = document.getElementById('manualInputCard');
    if (card) {
      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.getElementById('submitBtn').disabled = true;
  }

  function toggleSubmitBtn() {
    var checked = document.getElementById('consentCheck').checked;
    document.getElementById('submitBtn').disabled = !checked;
  }

  function validateForm() {
    var bizNo       = document.getElementById('manualBizNo').value.trim();
    var accountName = document.getElementById('manualAccountName').value.trim();
    var accountNo   = document.getElementById('manualAccountNo').value.trim();

    if (!bizNo || !accountName || !accountNo) return false;    
    return true;
  }

  function validateBizNum() {
    var bizNo       = document.getElementById('manualBizNo').value.trim();

    // 하이픈 제거
    var plainBizNo = bizNo.replace(/-/g, '');
    // 10자리 숫자인지 확인
    if (!/^\d{10}$/.test(plainBizNo)) {
      return false;
    }
    return true;
  }

  function monitorInputForms() {
    if(validateForm()) {
      showGoButtons();
    }
    else {      
      hideGoButtons();
    }
  }

  function handleGo() {
    if (!validateForm()) {
        alert('모든 정보를 올바르게 입력해주세요.');
        return;
    }

    if (!validateBizNum()) {
        alert('사업자번호가 올바르지 않습니다. [ 예시: 123-45-67890 / 10자리 숫자 ]');
        return;
    }

    AAPI_getCaptchaToken(function(token) {
      // 토큰을 받은 후에 폼을 처리
      processForm(token);
    });
  }

  function handleModify() {
    document.getElementById('manualBizNo').disabled = false;
    document.getElementById('manualAccountNo').disabled = false;
    document.getElementById('manualAccountName').disabled = false;
    document.getElementsByClassName('optional')[0].style.display = 'block';
    document.getElementsByClassName('optional')[1].style.display = 'block';
    document.getElementsByClassName('optional')[2].style.display = 'block';

    hideGoButtons();
    manualMode = true;
    showGoButtons();
  }

  function hideGoButtons() {    
    var modifyBtn = document.getElementById('modifyBtn');
    var goBtn = document.getElementById('goBtn');
    if (modifyBtn) modifyBtn.style.display = 'none';
    if (goBtn) goBtn.style.display = 'none';
  }

  function showGoButtons() {
    var modifyBtn = document.getElementById('modifyBtn');
    var goBtn = document.getElementById('goBtn');
    //if (manualMode == false && modifyBtn) modifyBtn.style.display = 'block'; // TODO
    if (goBtn) goBtn.style.display = 'block';
  }

  function isIPhone() {
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    const isMac = /Macintosh|MacIntel/i.test(navigator.userAgent);

    if (isIPhone || isMac) return true;

    return false;
  }

  function showIPhonePasteHint() {
    var onIPhone = /iPhone/i.test(navigator.userAgent);
    var onMac    = /Macintosh|MacIntel/i.test(navigator.userAgent);
    if (!onIPhone && !onMac) return;

    var existing = document.getElementById('iphone-paste-hint');
    if (existing) existing.remove();

    if (!document.getElementById('iphone-paste-hint-style')) {
      var style = document.createElement('style');
      style.id = 'iphone-paste-hint-style';
      style.textContent = [
        '@keyframes paste-pulse{',
        '  0%,100%{transform:scale(1);box-shadow:0 4px 24px rgba(230,126,34,0.5)}',
        '  50%{transform:scale(1.04);box-shadow:0 8px 36px rgba(230,126,34,0.8)}',
        '}'
      ].join('');
      document.head.appendChild(style);
    }

    var btn = document.getElementById('submitBtn');
    var rect = btn ? btn.getBoundingClientRect() : null;

    var hint = document.createElement('div');
    hint.id = 'iphone-paste-hint';

    var styleProps = [
      'background:linear-gradient(135deg,#f39c12,#e67e22)',
      'color:#fff',
      'font-size:19px',
      'font-weight:800',
      'padding:14px 20px',
      'border-radius:16px',
      'box-shadow:0 4px 24px rgba(230,126,34,0.5)',
      'z-index:99999',
      'text-align:center',
      'line-height:1.6',
      'animation:paste-pulse 1s ease-in-out infinite',
      'letter-spacing:-0.3px',
      'box-sizing:border-box'
    ];

    if (rect) {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
      styleProps.unshift('position:absolute');
      styleProps.push('left:' + (scrollX + rect.left) + 'px');
      styleProps.push('width:' + rect.width + 'px');

      if (onIPhone) {
        // 버튼 z축 위에 겹쳐서 표시
        styleProps.push('top:' + (scrollY + rect.top) + 'px');
        styleProps.push('display:flex');
        styleProps.push('flex-direction:column');
        styleProps.push('align-items:center');
        styleProps.push('justify-content:center');
      } else {
        // Mac: 버튼 바로 아래에 표시
        styleProps.push('top:' + (scrollY + rect.bottom + 10) + 'px');
      }
    } else {
      styleProps.unshift('position:fixed');
      styleProps.push('bottom:72px');
      styleProps.push('left:50%');
      styleProps.push('transform:translateX(-50%)');
      styleProps.push('white-space:nowrap');
    }

    hint.style.cssText = styleProps.join(';');
    hint.innerHTML = onIPhone
      ? '<span>⬆ ⬆ ⬆</span><span><strong>"붙여넣기"</strong>를 터치하세요!</span>'
      : '<span style="display:block">⬆ ⬆ ⬆</span><span style="display:block"><strong>"붙여넣기"</strong>를 터치하세요!</span>';
    document.body.appendChild(hint);
    if (!onIPhone) hint.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideIPhonePasteHint() {
    var hint = document.getElementById('iphone-paste-hint');
    if (!hint) return;
    hint.style.pointerEvents = 'none';
    hint.style.transition = 'opacity .3s';
    hint.style.opacity = '0';
    setTimeout(function () { if (hint.parentNode) hint.parentNode.removeChild(hint); }, 300);
  }

  async function handleConsent() {
    var btn = document.getElementById('submitBtn');
    btn.disabled = true;

    if (isIPhone()) {
      btn.innerHTML = '"붙여넣기"를 터치하세요!';
      showIPhonePasteHint();
      await new Promise(function (resolve) { setTimeout(resolve, 200); });
    }
    else {
      btn.innerHTML = '<span class="spinner"></span>처리 중...';
    }

    document.getElementById('privacyCard').style.display = 'none';
    btn.style.display = 'none';

    var tab1 = document.getElementById('tab-1');
    var tab2 = document.getElementById('tab-2');
    var tab1Sub = document.getElementById('tab-1-sub');
    var tab2Sub = document.getElementById('tab-2-sub');
    tab1.classList.remove('active'); tab2.classList.add('active'); tab1.classList.add('inactive');
    tab1Sub.classList.remove('active'); tab2Sub.classList.add('active');

    // 클립보드에서 데이터 읽기
    var clipText = '';
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        clipText = await navigator.clipboard.readText();
      } else {
        alert("앱을 종료하고 다시 실행해서 '붙여넣기' 기능을 활성화해주세요.");
        throw new Error('clipboard not supported');
      }
    } catch (e) {
      hideIPhonePasteHint();
      manualMode = false;
      hideGoButtons();
      //showManualForm();
      alert("앱을 종료하고 다시 실행해서 '붙여넣기' 기능을 활성화해주세요.");
      return;
    }
    hideIPhonePasteHint();

     var parsedData = null;
    try {
      // 텍스트를 JSON 객체로 파싱 시도
      parsedData = JSON.parse(clipText);      
    } catch (error) {      
      manualMode = false;
      hideGoButtons();
      alert("앱을 종료하고 다시 실행해서 '붙여넣기' 기능을 활성화해주세요.");
      return;
    }
            
    if (parsedData == null
        || parsedData["accountHolderName"] == null || parsedData["accountNumber"] == null || parsedData["businessNumber"] == null
        || parsedData["accountHolderName"] == '' || parsedData["accountNumber"] == '' || parsedData["businessNumber"] == ''
    ) {
      manualMode = false;
      hideGoButtons();
      alert("앱을 종료하고 다시 실행해서 '붙여넣기' 기능을 활성화해주세요.");
      return;
    }

    showManualForm();

    let bizNo       = parsedData["businessNumber"];
    let accountNo   = parsedData["accountNumber"];
    let accountName = parsedData["accountHolderName"];
        
    document.getElementById('manualBizNo').value = bizNo;
    document.getElementById('manualAccountNo').value = accountNo;
    document.getElementById('manualAccountName').value = accountName;

    if(!validateBizNum()) {
      alert('사업자번호가 올바르지 않습니다. [ 예시: 123-45-67890 / 10자리 숫자 ]');
      manualMode = true;
      hideGoButtons();
      return;
    }

    document.getElementsByClassName('optional')[0].style.display = 'none';
    document.getElementsByClassName('optional')[1].style.display = 'none';
    document.getElementsByClassName('optional')[2].style.display = 'none';
    document.getElementById('autoInputErrorMsg').style.display = 'none';    

    document.getElementById('manualBizNo').disabled = true;
    document.getElementById('manualAccountNo').disabled = true;
    document.getElementById('manualAccountName').disabled = true;
  }

  
  function restoreGoBtn() {
    var goBtn = document.getElementById('goBtn');
    goBtn.disabled = false;
    goBtn.innerHTML = 'QR 정보 갱신하기';
  }

  function processForm(token) {
    let bizNo       = document.getElementById('manualBizNo').value.trim();
    let accountName = document.getElementById('manualAccountName').value.trim();
    let accountNo   = document.getElementById('manualAccountNo').value.trim();

    var goBtn = document.getElementById('goBtn');
    goBtn.disabled = true;
    goBtn.innerHTML = '<span class="spinner"></span>처리 중...';

    // AJAX POST
    var formData = new FormData();
    formData.append('biz_no',       bizNo);
    formData.append('account_no',   accountNo);
    formData.append('account_name', accountName);
    formData.append('form_token', token);
    try {
      clearResult();
      $.ajax({
        url: 'https://aplx.link/te/kbank/handler.php',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function (data) {
          if (data.result !== 'success') {
            restoreGoBtn();
            showGoButtons();
            showResult('error', '&#9888;', '오류가 발생했습니다', data.message || '잠시 후 다시 시도해주세요.');
            return;
          }

          document.getElementById('cardsGrid').style.display  = 'none';
          document.querySelector('.btn-wrap').style.display   = 'none';
          document.querySelector('.back-link').style.display  = 'none';
          document.querySelector('.step-indicator').style.display = 'none';

          var storeIdMsg = '<br><br>사업자 번호: <strong>' + bizNo + '</strong>';
          showResult('success', '&#10003;', '갱신이 완료되었습니다!',
            'QR 코드 정보 갱신 요청이 정상적으로 처리되었습니다.' + storeIdMsg);
        },
        error: function (err) {
          restoreGoBtn();
          showGoButtons();
          showResult('error', '&#9888;', '오류가 발생했습니다', '서버 오류. 잠시 후에 다시 시도해 주세요.');
        }
      });
    } catch (e) {
      restoreGoBtn();
      showGoButtons();
      showResult('error', '&#9888;', '오류가 발생했습니다', e.message || '잠시 후 다시 시도해주세요.');
    }
  }

  function showResult(type, icon, title, msg) {
    setTimeout(function() {
      var box = document.getElementById('resultBox');
      box.className = 'result-box ' + type;
      box.style.display = 'block';
      document.getElementById('resultIcon').innerHTML = icon;
      document.getElementById('resultTitle').textContent = title;
      document.getElementById('resultMsg').innerHTML = msg;
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  function clearResult() {
    var box = document.getElementById('resultBox');
    box.style.display = 'none';
    document.getElementById('resultIcon').innerHTML = '';
    document.getElementById('resultTitle').textContent = '';
    document.getElementById('resultMsg').innerHTML = '';
  }
