(function () {
  'use strict';

  /* ============================================================
     Field Validators
  ============================================================ */
  var validators = {
    email: function (v) {
      if (!v) return '이메일을 입력해주세요.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '올바른 이메일 형식을 입력해주세요.';
      return '';
    },
    phone: function (v) {
      if (!v) return '휴대폰번호를 입력해주세요.';
      if (!/^\d{9,11}$/.test(v.replace(/-/g, ''))) return '숫자 9~11자리로 입력해주세요. (예: 01012345678)';
      return '';
    },
    page_count: function (v) {
      var n = parseInt(v, 10);
      if (!v || isNaN(n) || n < 50) return '최소 50개부터 입력 가능합니다.';
      if (n % 50 !== 0) return '50개 단위로만 입력 가능합니다. (50, 100, 150…)';
      return '';
    },
    biz_name: function (v) {
      if (!v) return '상호명(단체명)을 입력해주세요.';
      return '';
    },
    rep_name: function (v) {
      if (!v) return '대표자명을 입력해주세요.';
      return '';
    },
    biz_no: function (v) {
      if (!v) return '사업자등록번호(고유번호)를 입력해주세요.';
      return '';
    },
    address: function (v) {
      if (!v) return '주소를 입력해주세요.';
      return '';
    }
  };

  /* ============================================================
     Pricing
  ============================================================ */
  function getPrice(count) {
    if (count >= 1050) return 1800;
    if (count >= 550)  return 2100;
    if (count >= 150)  return 2400;
    if (count >= 50)   return 3000;
    return 0;
  }

  /* ============================================================
     Summary Table
  ============================================================ */
  var summaryFields = ['email','phone','biz_name','rep_name','biz_no','address','website','page_count'];

  function updateSummary() {
    summaryFields.forEach(function (id) {
      var el    = document.getElementById(id);
      var dispEl = document.getElementById('s-' + id);
      if (!el || !dispEl) return;
      var v = el.value.trim();
      dispEl.textContent = v || '—';
    });

    /* 가격 계산 */
    var count     = parseInt(document.getElementById('page_count').value, 10) || 0;
    var unitPrice = getPrice(count);
    var unitEl    = document.getElementById('s-unit-price');
    var totalEl   = document.getElementById('s-total-price');

    if (count >= 50 && unitPrice > 0) {
      unitEl.textContent  = unitPrice.toLocaleString() + '원/개';
      totalEl.textContent = (count * unitPrice).toLocaleString() + '원';
    } else {
      unitEl.textContent  = '—';
      totalEl.textContent = '—';
    }
  }

  /* ============================================================
     Inline Error Helpers
  ============================================================ */
  function setError(id, msg) {
    var input = document.getElementById(id);
    var errEl = document.getElementById('err-' + id);
    if (!input || !errEl) return;
    if (msg) {
      input.classList.add('is-invalid');
      errEl.textContent = msg;
      errEl.classList.add('visible');
    } else {
      input.classList.remove('is-invalid');
      errEl.textContent = '';
      errEl.classList.remove('visible');
    }
  }

  function setFileError(msg) {
    var errEl = document.getElementById('err-attachment');
    var area  = document.getElementById('fileUploadArea');
    if (!errEl) return;
    if (msg) {
      area.classList.add('is-invalid');
      errEl.textContent = msg;
      errEl.classList.add('visible');
    } else {
      area.classList.remove('is-invalid');
      errEl.textContent = '';
      errEl.classList.remove('visible');
    }
  }

  function setAgreesError(msg) {
    var errEl = document.getElementById('err-agrees');
    if (!errEl) return;
    if (msg) { errEl.textContent = msg; errEl.classList.add('visible'); }
    else      { errEl.textContent = ''; errEl.classList.remove('visible'); }
  }

  function setAgreeError(msg) {
    var errEl = document.getElementById('err-agree');
    if (!errEl) return;
    if (msg) { errEl.textContent = msg; errEl.classList.add('visible'); }
    else      { errEl.textContent = ''; errEl.classList.remove('visible'); }
  }

  function validateField(id) {
    var v   = document.getElementById(id).value.trim();
    var msg = validators[id](v);
    setError(id, msg);
    return msg === '';
  }

  /* ============================================================
     Submit Button State
  ============================================================ */
  var submitBtn = document.getElementById('submitBtn');

  function updateSubmitButton() {
    var allOk = true;

    Object.keys(validators).forEach(function (id) {
      var v = document.getElementById(id).value.trim();
      if (validators[id](v) !== '') allOk = false;
    });

    if (!fileInput.files || !fileInput.files[0]) allOk = false;
    if (!allTermsChecked()) allOk = false;
    if (!document.getElementById('agree').checked) allOk = false;

    submitBtn.disabled = !allOk;
  }

  /* ============================================================
     File Upload
  ============================================================ */
  var fileInput       = document.getElementById('attachment');
  var fileUploadArea  = document.getElementById('fileUploadArea');
  var fileNameDisplay = document.getElementById('fileNameDisplay');

  fileInput.addEventListener('change', function () {
    setFile(this.files[0]);
  });

  function setFile(file) {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError('파일 크기가 10MB를 초과합니다.');
        fileNameDisplay.textContent = '';
        fileUploadArea.classList.remove('has-file');
        fileInput.value = '';
      } else {
        setFileError('');
        fileNameDisplay.textContent = '\uD83D\uDCCE ' + file.name;
        fileUploadArea.classList.add('has-file');
      }
    } else {
      setFileError('');
      fileNameDisplay.textContent = '';
      fileUploadArea.classList.remove('has-file');
    }
    updateSummary();
    updateSubmitButton();
  }

  /* Drag & Drop */
  function handleDragOver(e) {
    e.preventDefault(); e.stopPropagation();
    fileUploadArea.classList.add('drag-over');
  }
  function handleDragLeave(e) {
    e.preventDefault(); e.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
  }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
    var files = e.dataTransfer.files;
    if (files && files[0]) { fileInput.files = files; setFile(files[0]); }
  }

  window.handleDragOver  = handleDragOver;
  window.handleDragLeave = handleDragLeave;
  window.handleDrop      = handleDrop;

  /* ============================================================
     Real-time Field Listeners
  ============================================================ */
  Object.keys(validators).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      var errEl = document.getElementById('err-' + id);
      if (errEl && errEl.classList.contains('visible')) validateField(id);
      updateSummary();
      updateSubmitButton();
    });
    el.addEventListener('blur', function () {
      if (this.value.trim() !== '') validateField(id);
      updateSummary();
      updateSubmitButton();
    });
  });

  /* 동의 항목 체크박스 5개 */
  function allTermsChecked() {
    return ['agree1','agree2','agree3','agree4','agree5'].every(function (id) {
      return document.getElementById(id).checked;
    });
  }

  ['agree1','agree2','agree3','agree4','agree5'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function () {
      if (allTermsChecked()) setAgreesError('');
      updateSubmitButton();
    });
  });

  /* 개인정보 동의 체크박스 */
  document.getElementById('agree').addEventListener('change', function () {
    if (this.checked) setAgreeError('');
    updateSubmitButton();
  });

  /* ============================================================
     Toast
  ============================================================ */
  var toast      = document.getElementById('validationToast');
  var toastMsg   = document.getElementById('validationToastMsg');
  var toastTimer = null;

  document.getElementById('toastCloseBtn').addEventListener('click', hideToast);

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4500);
  }
  function hideToast() { toast.classList.remove('show'); }

  /* ============================================================
     Privacy Modal
  ============================================================ */
  var modal = document.getElementById('privacyModal');

  document.getElementById('privacyLink').addEventListener('click', openModal);
  document.getElementById('footerPrivacyLink').addEventListener('click', openModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalAgreeBtn').addEventListener('click', function () {
    document.getElementById('agree').checked = true;
    setAgreeError('');
    updateSubmitButton();
    closeModal();
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  function openModal()  { modal.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }

  /* ============================================================
     PDF Generation & Merge (jsPDF + pdf-lib)
  ============================================================ */

  /**
   * summaryEl 을 html2canvas 로 캡처 → jsPDF A4 로 변환 후 ArrayBuffer 반환
   * 계약서 원본과 유사한 글자 크기로, A4 한 페이지에 깔끔하게 배치
   */
  async function buildSummaryPdfBytes(summaryEl) {
    /* ── PDF용 클론: 배경·테두리만 정리하고 폰트 크기는 원본 유지 ── */
    var clone = summaryEl.cloneNode(true);
    clone.style.cssText = [
      'position:absolute',
      'left:-9999px',
      'top:0',
      'width:560px',
      'background:#ffffff',
      'padding:0',
      'margin:0',
      'box-sizing:border-box'
    ].join(';') + ';';

    /* 테이블 래퍼 — 둥근 모서리 제거(PDF 에선 불필요) */
    var wrap = clone.querySelector('.summary-table-wrap');
    if (wrap) wrap.style.borderRadius = '0';

    document.body.appendChild(clone);

    var canvas = await html2canvas(clone, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });

    document.body.removeChild(clone);

    var { jsPDF } = window.jspdf;
    var pdf      = new jsPDF('p', 'mm', 'a4');
    var pageW    = pdf.internal.pageSize.getWidth();
    var pageH    = pdf.internal.pageSize.getHeight();
    var margin   = 15;                              /* 상하좌우 여백 15mm */
    var imgW     = pageW - margin * 2;              /* 콘텐츠 폭 180mm */
    var imgData  = canvas.toDataURL('image/png');
    var imgH     = imgW * (canvas.height / canvas.width);
    var contentH = pageH - margin * 2;

    /* 내용이 한 페이지에 들어갈 경우 */
    if (imgH <= contentH) {
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
    } else {
      /* 한 페이지를 넘을 경우 분할 */
      var sliceH  = Math.floor(canvas.height * (contentH / imgH));
      var offsetY = 0;
      while (offsetY < canvas.height) {
        var sliceCanvas = document.createElement('canvas');
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.min(sliceH, canvas.height - offsetY);
        sliceCanvas.getContext('2d').drawImage(
          canvas, 0, offsetY, canvas.width, sliceCanvas.height,
          0, 0, canvas.width, sliceCanvas.height
        );
        var sliceImg = sliceCanvas.toDataURL('image/png');
        if (offsetY > 0) pdf.addPage();
        pdf.addImage(sliceImg, 'PNG', margin, margin, imgW, sliceCanvas.height * (imgW / canvas.width));
        offsetY += sliceH;
      }
    }

    return pdf.output('arraybuffer');
  }

  /**
   * 이미지 파일을 지정한 JPEG 품질로 압축하여 ArrayBuffer 반환
   * @param {File}   file    - JPG 또는 PNG 파일
   * @param {number} quality - 0~1 사이의 품질 (예: 1/16 ≈ 0.0625)
   * @returns {Promise<ArrayBuffer>}
   */
  function compressImageToJpeg(file, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';           /* PNG 투명 배경을 흰색으로 */
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('이미지 압축 실패')); return; }
          blob.arrayBuffer().then(resolve).catch(reject);
        }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')); };
      img.src = url;
    });
  }

  /**
   * 계약서 원본 PDF + 요약 페이지 + 첨부 파일을 하나의 PDF 로 병합
   * @returns {Uint8Array}
   */
  async function generateMergedPDF(summaryEl, contractUrl, attachmentFile) {
    var { PDFDocument } = PDFLib;
    var merged = await PDFDocument.create();

    /* (1) 계약서 원본 */
    try {
      var contractRes   = await fetch(contractUrl);
      var contractBytes = await contractRes.arrayBuffer();
      var contractDoc   = await PDFDocument.load(contractBytes);
      var pages = await merged.copyPages(contractDoc, contractDoc.getPageIndices());
      pages.forEach(function (p) { merged.addPage(p); });
    } catch (e) {
      console.warn('계약서 원본 로드 실패:', e);
    }

    /* (2) 요약 페이지 (jsPDF) */
    var summaryBytes = await buildSummaryPdfBytes(summaryEl);
    var summaryDoc   = await PDFDocument.load(summaryBytes);
    var sPages = await merged.copyPages(summaryDoc, summaryDoc.getPageIndices());
    sPages.forEach(function (p) { merged.addPage(p); });

    /* (3) 첨부 파일 */
    if (attachmentFile.type === 'application/pdf') {
      var attachBytes = await attachmentFile.arrayBuffer();
      var attachDoc = await PDFDocument.load(attachBytes);
      var aPages = await merged.copyPages(attachDoc, attachDoc.getPageIndices());
      aPages.forEach(function (p) { merged.addPage(p); });
    } else {
      /* 이미지(JPG/PNG) → JPEG 로 변환 후 A4 페이지에 삽입 (8MB 초과 시 1/8 품질로 압축) */
      var imgQuality = attachmentFile.size > 8 * 1024 * 1024 ? 1 / 8 : 1;
      var compressedBytes = await compressImageToJpeg(attachmentFile, imgQuality);
      var imgPage     = merged.addPage([595.28, 841.89]);
      var embeddedImg = await merged.embedJpg(compressedBytes);
      var dims = embeddedImg.scaleToFit(
        imgPage.getWidth()  - 40,
        imgPage.getHeight() - 40
      );
      imgPage.drawImage(embeddedImg, {
        x: (imgPage.getWidth()  - dims.width)  / 2,
        y: (imgPage.getHeight() - dims.height) / 2,
        width:  dims.width,
        height: dims.height
      });
    }

    return merged.save();
  }

  /* ============================================================
     Form Submission
  ============================================================ */
  var form             = document.getElementById('b2bForm');
  var loadingIndicator = document.getElementById('loadingIndicator');
  var resultSuccess    = document.getElementById('resultSuccess');
  var resultError      = document.getElementById('resultError');
  var resultErrorMsg   = document.getElementById('resultErrorMsg');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var isValid = true;

    Object.keys(validators).forEach(function (id) {
      if (!validateField(id)) isValid = false;
    });

    var attachment = fileInput.files[0];
    if (!attachment) {
      setFileError('사업자등록증(고유번호증) 파일을 첨부해주세요.');
      isValid = false;
    } else if (attachment.size > 10 * 1024 * 1024) {
      setFileError('파일 크기가 10MB를 초과합니다.');
      isValid = false;
    }

    if (!allTermsChecked()) {
      setAgreesError('모든 동의 항목을 확인하고 체크해주세요.');
      isValid = false;
    }

    if (!document.getElementById('agree').checked) {
      setAgreeError('개인정보 처리방침에 동의해주세요.');
      isValid = false;
    }

    if (!isValid) {
      var firstErr = form.querySelector('.field-error.visible');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* 가격 계산값을 hidden input으로 전송 */
    var count      = parseInt(document.getElementById('page_count').value, 10);
    var unitPrice  = getPrice(count);
    var totalPrice = count * unitPrice;
    setHidden('unit_price',  unitPrice);
    setHidden('total_price', totalPrice);

    var formData = new FormData(form);

    submitBtn.disabled = true;
    loadingIndicator.style.display = 'flex';
    resultSuccess.style.display = 'none';
    resultError.style.display = 'none';

    /* ── jsPDF + pdf-lib 로 PDF 병합 후 FormData 에 추가 ── */
    try {
      var mergedBytes = await generateMergedPDF(
        document.getElementById('summarySection'),
        'latest.pdf?v=' + Date.now(),
        attachment
      );
      var bizName     = document.getElementById('biz_name').value.trim();
      var dateStr     = new Date().toISOString().slice(0, 10);
      var mergedBlob  = new Blob([mergedBytes], { type: 'application/pdf' });
      formData.append('merged_pdf', mergedBlob, 'AQR_B2B_계약서_' + bizName + '_' + dateStr + '.pdf');
    } catch (pdfErr) {
      console.warn('PDF 병합 실패 — 원본 첨부 파일만 전송합니다:', pdfErr);
    }

    $.ajax({
      url:         'https://aq.gy/contact/b2bformhandler.php',
      type:        'POST',
      data:        formData,
      dataType:    'json',
      processData: false,
      contentType: false,
      success: function (data) {
        if (data.success) {
          form.style.display = 'none';
          resultSuccess.style.display = 'block';
          resultSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          resultErrorMsg.textContent = data.message || '오류가 발생했습니다.';
          resultError.style.display = 'block';
          resultError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          submitBtn.disabled = false;
        }
      },
      error: function (e) {
        resultErrorMsg.textContent = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        resultError.style.display = 'block';
        resultError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        submitBtn.disabled = false;
      },
      complete: function () {
        loadingIndicator.style.display = 'none';
      }
    });
  });

  /* ============================================================
     Helpers
  ============================================================ */
  function setHidden(name, value) {
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) {
      el = document.createElement('input');
      el.type  = 'hidden';
      el.name  = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  /* 초기 실행 */
  updateSummary();
  updateSubmitButton();

})();
