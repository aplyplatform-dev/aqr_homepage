const AAPI_captchaSiteKey = '0x4AAAAAAA62_43H2MO9goDN';
let AAPI_turnstile_callback = null;  // 토큰을 기다리는 콜백
let AAPI_turnstile_token    = null;  // 프리페치된 토큰 캐시
let AAPI_turnstile_widget_id = null; // render()가 반환한 위젯 ID

// 글자 수 카운터
function updateCharCount(inputId, countId) {
  var input = document.getElementById(inputId);
  var count = document.getElementById(countId);
  input.addEventListener('input', function () {
    var len = this.value.length;
    count.textContent = len + ' / 20';
    if (len >= 20) {
      count.classList.add('over');
    } else {
      count.classList.remove('over');
    }
  });
}

// 기업 및 단체 소개 글자 수 카운터 (200자)
window.addEventListener('load', function(){
  var el    = document.getElementById('org_intro');
  var count = document.getElementById('count_org_intro');
  if (!el || !count) return;
  el.addEventListener('input', function () {
    var len = this.value.length;
    count.textContent = len + ' / 200';
    if (len >= 200) count.classList.add('over');
    else            count.classList.remove('over');
  });

  updateCharCount('keyword1', 'count_keyword1');
  updateCharCount('keyword2', 'count_keyword2');
  AAPI_initTurnstile();
});

// 팝업 토스트
var toastTimer = null;
function showToast(msg) {
  clearTimeout(toastTimer);
  document.getElementById('validationToastMsg').textContent = msg;
  var toast = document.getElementById('validationToast');
  toast.classList.add('show');
  toastTimer = setTimeout(hideToast, 4000);
}
function hideToast() {
  document.getElementById('validationToast').classList.remove('show');
}

// AQR URL blur 검증
document.getElementById('aqr_url').addEventListener('blur', function () {
  var val = this.value.trim();
  if (val && !val.includes('://aq.gy/f/')) {
    showToast('올바른 AQR 고유 URL이 아닙니다. (예: http://aq.gy/f/keyword)');
  }
});

// 파일 선택 표시
document.getElementById('attachment').addEventListener('change', function () {
  var area = document.getElementById('fileUploadArea');
  var display = document.getElementById('fileNameDisplay');
  if (this.files && this.files.length > 0) {
    if (this.files[0].size > 10 * 1024 * 1024) {
      showToast('파일 크기가 10MB를 초과합니다.');
      this.value = '';
      display.textContent = '';
      area.classList.remove('has-file');
    } else {
      display.textContent = '선택된 파일: ' + this.files[0].name;
      area.classList.add('has-file');
    }
  } else {
    display.textContent = '';
    area.classList.remove('has-file');
  }
});

// 개인정보 모달
document.getElementById('privacyLink').addEventListener('click', function () {
  $('#privacyModal').modal('show');
});
document.getElementById('footerPrivacyLink').addEventListener('click', function () {
  $('#privacyModal').modal('show');
});
document.getElementById('agreeAndClose').addEventListener('click', function () {
  document.getElementById('agree').checked = true;
  $('#privacyModal').modal('hide');
});

// GA 이벤트
function gaEvent(category, action, label) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, { 'event_category': category, 'event_label': label });
  }
}

// 폼 유효성 검사
function validateForm() {
  var orgName    = document.getElementById('org_name').value.trim();
  var phone      = document.getElementById('phone').value.trim();
  var email      = document.getElementById('email').value.trim();
  var aqrUrl     = document.getElementById('aqr_url').value.trim();
  var attachment = document.getElementById('attachment');
  var agree      = document.getElementById('agree').checked;

  var orgIntro   = document.getElementById('org_intro').value.trim();

  if (!orgName) {
    showToast('기업 및 단체명을 입력해주세요.');
    document.getElementById('org_name').focus();
    return false;
  }
  if (!orgIntro) {
    showToast('기업 및 단체 소개를 입력해주세요.');
    document.getElementById('org_intro').focus();
    return false;
  }
  if (!phone || !/^\d+$/.test(phone)) {
    showToast('전화번호를 숫자만 입력해주세요.');
    document.getElementById('phone').focus();
    return false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('올바른 이메일 주소를 입력해주세요.');
    document.getElementById('email').focus();
    return false;
  }
  if (!aqrUrl) {
    showToast('AQR 고유 URL을 입력해주세요.');
    document.getElementById('aqr_url').focus();
    return false;
  }
  if (!aqrUrl.includes('://aq.gy/f/')) {
    showToast('올바른 AQR 고유 URL이 아닙니다. (예: http://aq.gy/f/keyword)');
    document.getElementById('aqr_url').focus();
    return false;
  }
  if (!attachment.files || attachment.files.length === 0) {
    showToast('사업자 등록증 또는 단체증을 첨부해주세요.');
    return false;
  }
  if (attachment.files[0].size > 10 * 1024 * 1024) {
    showToast('파일 크기가 10MB를 초과합니다.');
    return false;
  }
  if (!agree) {
    showToast('개인정보 처리방침에 동의해주세요.');
    return false;
  }

  return true;
}

// 이미지 파일을 지정한 JPEG 품질로 압축하여 Blob 반환
function compressImageToJpeg(file, quality) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) {
        if (!blob) { reject(new Error('이미지 압축 실패')); return; }
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')); };
    img.src = url;
  });
}


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

function submitForm(formData, successCallback, errorCallback) {
    $.ajax({
      url: 'https://aq.gy/contact/socialformhandler.php',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      dataType: 'json',
      success: function (data) {
        if (successCallback) successCallback(data);
      },
      error: function (err) {
        if (errorCallback) errorCallback(err);
      }
    });
}

// 폼 제출
document.getElementById('socialForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  var submitBtn = document.getElementById('submitBtn');
  var loading = document.getElementById('loadingIndicator');

  submitBtn.disabled = true;
  loading.style.display = 'block';

  var formData = new FormData(this);

  /* 이미지 첨부 파일이 8MB 초과 시 1/4 품질 JPEG 로 압축 후 교체 */
  var attachInput = document.getElementById('attachment');
  var attachFile  = attachInput.files && attachInput.files[0];
  if (attachFile && attachFile.type !== 'application/pdf' && attachFile.size > 8 * 1024 * 1024) {
    try {
      var compressed = await compressImageToJpeg(attachFile, 1 / 4);
      var baseName   = attachFile.name.replace(/\.[^.]+$/, '') + '.jpg';
      formData.delete('attachment');
      formData.append('attachment', compressed, baseName);
    } catch (err) {
      console.warn('이미지 압축 실패, 원본 파일로 전송합니다:', err);
    }
  }

  AAPI_getCaptchaToken(function(token) {
    formData.append('form_token', token);
    submitForm(formData, function(data) {
        submitBtn.disabled = false;
        loading.style.display = 'none';

        if (data.success) {
          document.getElementById('socialForm').style.display = 'none';
          document.getElementById('resultSuccess').style.display = 'block';
          gaEvent('SocialForm', 'submit_success', 'social_apply');
        } else {
          document.getElementById('resultErrorMsg').textContent = data.message || '오류가 발생했습니다.';
          document.getElementById('resultError').style.display = 'block';
          gaEvent('SocialForm', 'submit_error', data.message || 'error');
        }
      }, function(err) {
        submitBtn.disabled = false;
        loading.style.display = 'none';
        document.getElementById('resultErrorMsg').textContent = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        document.getElementById('resultError').style.display = 'block'; 
      });
  });
});  
