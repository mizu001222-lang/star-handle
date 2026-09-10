/* =========================================================
   스타건설 — 인터랙션 스크립트 (실외기실 환풍기 설치)
   1) 이미지 플레이스홀더  2) 헤더/모바일 메뉴
   3) 스크롤 리빌         4) FAQ 아코디언
   5) 모바일 하단 CTA
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1) 이미지 플레이스홀더 ----------
     images/ 폴더에 실제 사진을 넣으면 자동으로 사진이 표시됩니다.
     파일이 없을 때만 아래 대체 박스가 렌더링됩니다. */
  function toPlaceholder(img) {
    if (!img.parentNode || img.dataset.phDone) return;
    img.dataset.phDone = '1';
    var box = document.createElement('div');
    box.className = 'ph';
    box.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    label.textContent = img.dataset.ph || 'IMAGE';
    box.appendChild(label);
    img.parentNode.replaceChild(box, img);
  }

  document.querySelectorAll('img[data-ph]').forEach(function (img) {
    img.addEventListener('error', function () { toPlaceholder(img); });
    if (img.complete && img.naturalWidth === 0) toPlaceholder(img);
  });

  /* ---------- 2) 헤더 & 모바일 메뉴 ---------- */
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var backdrop = document.getElementById('navBackdrop');

  var onScrollHeader = function () {
    header.classList.toggle('is-stuck', window.scrollY > 10);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.body.classList.toggle('nav-lock', open);
    if (open) {
      backdrop.hidden = false;
      requestAnimationFrame(function () { backdrop.classList.add('is-on'); });
    } else {
      backdrop.classList.remove('is-on');
      setTimeout(function () { backdrop.hidden = true; }, 300);
    }
  }

  toggle.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  backdrop.addEventListener('click', function () { setMenu(false); });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
  });
  // 데스크톱 폭으로 넓어지면 메뉴 상태 초기화
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1180 && nav.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- 3) 스크롤 리빌 ---------- */
  var targets = document.querySelectorAll('[data-reveal]');
  document.documentElement.classList.add('reveal-ready');

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // 같은 그리드 안의 카드들은 살짝 순차적으로 등장
        var siblings = el.parentNode ? Array.prototype.filter.call(
          el.parentNode.children, function (c) { return c.hasAttribute('data-reveal'); }) : [];
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = (idx > 0 ? Math.min(idx, 5) * 70 : 0) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4) FAQ 아코디언 ---------- */
  document.querySelectorAll('.acc').forEach(function (acc) {
    var q = acc.querySelector('.acc__q');
    q.addEventListener('click', function () {
      var open = acc.classList.contains('is-open');
      // 한 번에 하나만 열리도록
      document.querySelectorAll('.acc.is-open').forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.acc__q').setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        acc.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- 5) 모바일 하단 CTA ----------
     푸터 영역에 도달하면 하단 고정 바를 잠시 숨겨 겹침을 방지합니다. */
  var mcta = document.getElementById('mcta');
  var footer = document.querySelector('.footer');
  if ('IntersectionObserver' in window && footer) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        mcta.style.transform = entry.isIntersecting ? 'translateY(110%)' : 'translateY(0)';
        mcta.style.transition = 'transform .35s cubic-bezier(.22,.61,.36,1)';
      });
    }, { threshold: 0.25 }).observe(footer);
  }
})();
