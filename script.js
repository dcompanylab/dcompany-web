/* ==========================================================================
   D.Company Ltd. — L:BRN corporate site
   Shared behaviour. Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var panel = document.querySelector('.nav-panel');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     Header — shadow on scroll, and light/dark mode based on what sits
     directly beneath the bar. Dark sections flip the GNB to its dark
     treatment (light nav labels + the light wordmark); everything else
     falls back to the default light bar.
     ---------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var darkSections = document.querySelectorAll(
      '.hero, .page-hero, .section-dark, .site-footer'
    );
    var wordmark = header.querySelector('.logo-wordmark');
    var symbol = header.querySelector('.logo-symbol');
    var WORDMARK_LIGHT = 'logo-wordmark-light.png';
    var WORDMARK_DARK = 'logo-wordmark.png';
    /* Brand teal only clears 2.8:1 on white, so the light bar gets the
       deeper teal-700 cut of the symbol and the dark bar the brand teal. */
    var SYMBOL_ON_DARK = 'logo-symbol.png';
    var SYMBOL_ON_LIGHT = 'logo-symbol-dark.png';
    var isDark = null;

    /* Probe a line just below the bar. The header is sticky, so this is the
       section it is sitting on top of — at the top of the page that is the
       section directly beneath it, and after scrolling it is whatever has
       slid under it. */
    function overDarkSection() {
      var probe = header.getBoundingClientRect().bottom + 1;
      for (var i = 0; i < darkSections.length; i++) {
        var rect = darkSections[i].getBoundingClientRect();
        if (rect.top <= probe && rect.bottom >= probe) return true;
      }
      return false;
    }

    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 8);

      var dark = overDarkSection();
      if (dark !== isDark) {
        isDark = dark;
        header.classList.toggle('is-on-dark', dark);
        if (wordmark) wordmark.src = dark ? WORDMARK_LIGHT : WORDMARK_DARK;
        if (symbol) symbol.src = dark ? SYMBOL_ON_DARK : SYMBOL_ON_LIGHT;
      }
      ticking = false;
    }

    function request() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  /* ------------------------------------------------------------------------
     Custom cursor — teal arrow with an L:BRN name tag trailing it.
     Pointer devices only; the native cursor is untouched otherwise.
     ---------------------------------------------------------------------- */
  function initCursor() {
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer) return;

    var root = document.createElement('div');
    root.className = 'cursor';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<svg class="cursor-arrow" viewBox="0 0 24 24" fill="none">' +
      '<path d="M5.4 2.4 18.9 12.6 12.4 13.2 15.3 19.9 12.4 21.1 9.5 14.4 5.4 18.2Z" ' +
      'fill="#36AE92" stroke="#F7F9FA" stroke-width="1.4" stroke-linejoin="round"/>' +
      '</svg>' +
      '<span class="cursor-label">LBRN</span>';
    document.body.appendChild(root);
    document.documentElement.classList.add('has-custom-cursor');

    var targetX = -100;
    var targetY = -100;
    var x = targetX;
    var y = targetY;
    var running = false;

    function draw() {
      /* A touch of easing so the tag drifts behind the arrow the way a
         live presence cursor does. */
      var ease = reducedMotion ? 1 : 0.22;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      root.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';

      if (Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1) {
        window.requestAnimationFrame(draw);
      } else {
        running = false;
      }
    }

    function start() {
      if (!running) {
        running = true;
        window.requestAnimationFrame(draw);
      }
    }

    document.addEventListener('mousemove', function (event) {
      targetX = event.clientX;
      targetY = event.clientY;
      root.classList.add('is-visible');

      var hit = event.target.closest
        ? event.target.closest('a, button, [role="button"], summary, label')
        : null;
      root.classList.toggle('is-pointer', Boolean(hit));
      start();
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      root.classList.remove('is-visible');
    });
    document.addEventListener('mouseenter', function () {
      root.classList.add('is-visible');
    });

    /* A drag or a context menu can strand the marker — reset on blur. */
    window.addEventListener('blur', function () {
      root.classList.remove('is-visible');
    });
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Stat counters
     ---------------------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    var duration = 1400;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Contact form validation
     ---------------------------------------------------------------------- */
  function initForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    var success = document.querySelector('.form-success');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, message) {
      var wrapper = field.closest('.field');
      var slot = wrapper.querySelector('.field-error');
      wrapper.classList.toggle('has-error', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (slot) slot.textContent = message || '';
      return !message;
    }

    function validate(field) {
      var value = field.value.trim();
      if (!value) return setError(field, 'Enter your ' + field.dataset.label + '.');
      if (field.type === 'email' && !emailPattern.test(value)) {
        return setError(field, 'Use the format name@company.com.');
      }
      if (field.name === 'message' && value.length < 20) {
        return setError(field, 'Add a little more detail — at least 20 characters.');
      }
      return setError(field, '');
    }

    var fields = Array.prototype.slice.call(
      form.querySelectorAll('input[required], textarea[required], select[required]')
    );

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.closest('.field').classList.contains('has-error')) validate(field);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!validate(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        if (success) success.classList.remove('is-visible');
        return;
      }

      /* No backend is wired up yet — the design team can point this at an
         endpoint. Until then, confirm receipt in the interface. */
      form.reset();
      if (success) {
        success.classList.add('is-visible');
        success.setAttribute('tabindex', '-1');
        success.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  function initYear() {
    var slots = document.querySelectorAll('[data-year]');
    var year = String(new Date().getFullYear());
    slots.forEach(function (el) { el.textContent = year; });
  }

  /* ------------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function init() {
    initNav();
    initHeader();
    initCursor();
    initReveal();
    initCounters();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
