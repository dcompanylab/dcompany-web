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
     Dot matrix — a grid of dots whose size and opacity ride a flowing
     value-noise field, so the surface reads as a slow organic swell rather
     than a blinking grid. Canvas 2D, no dependencies.
     ---------------------------------------------------------------------- */
  function initDotMatrix() {
    var canvas = document.querySelector('.dot-matrix');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var SPACING = 22;      // px between dot centres
    var MAX_RADIUS = 1.9;  // px at the crest of the wave
    var SPEED = 0.0003;    // noise drift per millisecond

    /* --- Value noise -----------------------------------------------------
       Hash-based lattice with smoothstep interpolation. Two octaves breaks
       up the grid without looking busy, and avoids shipping a Perlin
       implementation for what is a background texture. */
    function hash(x, y) {
      var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function smooth(t) { return t * t * (3 - 2 * t); }
    function noise(x, y) {
      var xi = Math.floor(x);
      var yi = Math.floor(y);
      var xf = smooth(x - xi);
      var yf = smooth(y - yi);
      var a = hash(xi, yi);
      var b = hash(xi + 1, yi);
      var c = hash(xi, yi + 1);
      var d = hash(xi + 1, yi + 1);
      return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
    }
    function field(x, y, t) {
      return noise(x * 0.9 + t, y * 0.9) * 0.65 +
             noise(x * 2.3 - t * 0.6, y * 2.3 + t * 0.3) * 0.35;
    }

    var dpr = 1;
    var cols = 0;
    var rows = 0;
    var offsetX = 0;
    var offsetY = 0;
    var cssW = 0;
    var cssH = 0;

    function measure() {
      var rect = canvas.getBoundingClientRect();
      /* Fall back to the hero's own box if the canvas has not been laid out
         yet — this is what previously left the field permanently invisible. */
      if (!rect.width || !rect.height) {
        var host = canvas.parentElement;
        rect = host ? host.getBoundingClientRect() : rect;
      }
      if (!rect.width || !rect.height) return false;

      cssW = rect.width;
      cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      cols = Math.ceil(cssW / SPACING) + 1;
      rows = Math.ceil(cssH / SPACING) + 1;
      offsetX = (cssW - (cols - 1) * SPACING) / 2;
      offsetY = (cssH - (rows - 1) * SPACING) / 2;
      return true;
    }

    function draw(now) {
      var t = now * SPEED;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = '#36AE92';

      for (var iy = 0; iy < rows; iy++) {
        for (var ix = 0; ix < cols; ix++) {
          var v = field(ix * 0.11, iy * 0.11, t);
          /* Biased low so most of the field stays quiet and only the crests
             brighten — that is what keeps it off the copy. */
          var lift = Math.max(0, v - 0.42) / 0.58;
          if (lift <= 0.02) continue;

          ctx.globalAlpha = 0.07 + lift * 0.42;
          ctx.beginPath();
          ctx.arc(
            offsetX + ix * SPACING,
            offsetY + iy * SPACING,
            0.5 + lift * MAX_RADIUS,
            0, Math.PI * 2
          );
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function start() {
      if (!measure()) return false;
      canvas.classList.add('is-running');
      return true;
    }

    /* Layout may not be settled on first run; retry on the next frame and
       again after load before giving up. */
    if (!start()) {
      window.requestAnimationFrame(function () {
        if (!start()) window.addEventListener('load', start);
      });
    }

    if (reducedMotion) {
      draw(0);
      window.addEventListener('resize', function () {
        if (measure()) draw(0);
      });
      return;
    }

    var running = true;
    function frame(now) {
      if (running && cssW) draw(now);
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);

    /* Stop painting when the hero is off screen or the tab is hidden */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting && !document.hidden;
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
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
    initDotMatrix();
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
