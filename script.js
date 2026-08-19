/* ==========================================================================
   Adam Atienza — Portfolio
   Vanilla JS: mobile nav, sticky header state, scrollspy, reveal-on-scroll
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Layout constants are declared in style.css so there is a single source of
  // truth. Read them once here rather than repeating the numbers.
  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name).trim();
  }

  function cssNumber(name, fallback) {
    var n = parseInt(cssVar(name), 10);
    return isNaN(n) ? fallback : n;
  }

  var headerH = cssNumber('--header-h', 64);
  var navBreakpoint = cssNumber('--nav-breakpoint', 768);

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('primary-nav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  // Everything the overlay covers. While it is up these are marked inert so
  // keyboard focus can't wander into links hidden behind it.
  var coveredRegions = [
    document.getElementById('main'),
    document.querySelector('.site-footer'),
    document.querySelector('.brand')
  ];

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);

    coveredRegions.forEach(function (region) {
      if (!region) return;
      if (open) {
        region.setAttribute('inert', '');
      } else {
        region.removeAttribute('inert');
      }
    });
  }

  function closeNav() {
    setNav(false);
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setNav(!isOpen);
    });

    // Tapping a link navigates and dismisses the overlay.
    navLinks.forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    // Leaving the mobile breakpoint should never strand an open overlay.
    var desktop = window.matchMedia('(min-width: ' + navBreakpoint + 'px)');
    var onBreakpointChange = function (e) {
      if (e.matches) closeNav();
    };
    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', onBreakpointChange);
    } else if (typeof desktop.addListener === 'function') {
      desktop.addListener(onBreakpointChange); // Safari < 14
    }
  }

  /* ----------------------------------------------------------------------
     Header background once scrolled past the top
     ---------------------------------------------------------------------- */
  var header = document.getElementById('site-header');
  var ticking = false;

  function updateHeader() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  updateHeader();

  /* ----------------------------------------------------------------------
     Scrollspy — highlight the nav link for the section in view
     ---------------------------------------------------------------------- */
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var visible = new Set();

    var setActive = function () {
      // Pick the visible section closest to the top of the viewport.
      var best = null;
      var bestTop = Infinity;

      visible.forEach(function (section) {
        var top = section.getBoundingClientRect().top;
        if (top < bestTop) {
          bestTop = top;
          best = section;
        }
      });

      navLinks.forEach(function (link) {
        var isActive = Boolean(best) && link.getAttribute('href') === '#' + best.id;
        link.classList.toggle('is-active', isActive);
        // Expose the same state to assistive tech, not just to the eye.
        if (isActive) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });
      setActive();
    }, {
      // Offset the fixed header so a section counts as "current"
      // only once it sits under the nav bar.
      rootMargin: '-' + (headerH + 8) + 'px 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Hero oscilloscope

     Draws a swept scope trace that cycles through three signal shapes:
     a clean sine, a ~30% duty PWM square, and a burst of serial packets —
     the three things you'd actually see on a bench probing this work.
     Decorative only; the markup is aria-hidden.
     ---------------------------------------------------------------------- */
  var scope = document.getElementById('scope');

  if (scope && scope.getContext) {
    var ctx = scope.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = 0;
    var cssH = 0;

    // Trace colour comes from the palette, so retuning --accent-rgb in the
    // stylesheet moves the scope with everything else.
    var accentParts = (cssVar('--accent-rgb') || '15 118 110').split(/[\s,]+/);
    function accent(alpha) {
      return 'rgba(' + accentParts[0] + ',' + accentParts[1] + ',' +
             accentParts[2] + ',' + alpha + ')';
    }

    function sizeScope() {
      var rect = scope.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      scope.width = Math.max(1, Math.round(cssW * dpr));
      scope.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Signal shapes. x is 0..1 across the trace, t advances with time.
    function sine(x, t) {
      return Math.sin((x * 2.4 + t) * Math.PI * 2);
    }

    function pwm(x, t) {
      var p = (x * 3.2 + t) % 1;
      return p < 0.3 ? 0.82 : -0.82;
    }

    function packet(x, t) {
      var p = (x * 5 + t) % 1;
      if (p < 0.06) return 0.85;
      if (p < 0.13) return -0.85;
      if (p < 0.19) return 0.85;
      if (p < 0.34) return -0.85;
      if (p < 0.40) return 0.85;
      return -0.25;
    }

    var shapes = [sine, pwm, packet];
    var HOLD = 4200;   // ms showing one shape
    var MORPH = 900;   // ms crossfading into the next

    function sampleAt(x, t, now) {
      var cycle = HOLD + MORPH;
      var idx = Math.floor(now / cycle) % shapes.length;
      var into = now % cycle;
      var current = shapes[idx];
      if (into <= HOLD) return current(x, t);

      var next = shapes[(idx + 1) % shapes.length];
      var k = (into - HOLD) / MORPH;
      k = k * k * (3 - 2 * k); // smoothstep
      return current(x, t) * (1 - k) + next(x, t) * k;
    }

    function drawGrid() {
      var step = 44;
      ctx.lineWidth = 1;
      ctx.strokeStyle = accent(0.10);
      ctx.beginPath();
      for (var x = step; x < cssW; x += step) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, cssH);
      }
      for (var y = step; y < cssH; y += step) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(cssW, Math.round(y) + 0.5);
      }
      ctx.stroke();

      // Centre line, a touch brighter — the zero volt reference.
      ctx.strokeStyle = accent(0.2);
      ctx.beginPath();
      ctx.moveTo(0, Math.round(cssH / 2) + 0.5);
      ctx.lineTo(cssW, Math.round(cssH / 2) + 0.5);
      ctx.stroke();
    }

    function drawFrame(now) {
      if (!cssW || !cssH) return;

      var t = now / 5200;
      var mid = cssH / 2;
      var amp = Math.min(cssH * 0.3, 74);
      var step = 2;

      ctx.clearRect(0, 0, cssW, cssH);
      drawGrid();

      // The persistent trace.
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = accent(0.4);
      ctx.beginPath();
      for (var x = 0; x <= cssW; x += step) {
        var y = mid - sampleAt(x / cssW, t, now) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Sweeping beam: a brighter, glowing segment that runs left to right.
      var headX = (now / 2600 % 1) * cssW;
      var tail = Math.min(190, cssW * 0.3);
      var from = Math.max(0, headX - tail);

      ctx.save();
      ctx.shadowColor = accent(0.4);
      ctx.shadowBlur = 9;
      ctx.strokeStyle = accent(0.95);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (var bx = from; bx <= headX; bx += step) {
        var by = mid - sampleAt(bx / cssW, t, now) * amp;
        if (bx === from) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.stroke();

      // Beam head.
      var hy = mid - sampleAt(headX / cssW, t, now) * amp;
      ctx.fillStyle = accent(1);
      ctx.beginPath();
      ctx.arc(headX, hy, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    var rafId = null;
    var running = false;

    function loop(now) {
      drawFrame(now);
      rafId = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running || prefersReducedMotion) return;
      running = true;
      rafId = window.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    sizeScope();

    if (prefersReducedMotion) {
      // One still frame: the shape is the point, the motion isn't.
      drawFrame(0);
    } else {
      // Don't burn frames on a hero nobody is looking at.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }, { threshold: 0 }).observe(scope);
      } else {
        start();
      }

      document.addEventListener('visibilitychange', function () {
        document.hidden ? stop() : start();
      });
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        sizeScope();
        if (prefersReducedMotion) drawFrame(0);
      }, 150);
    });
  }

  /* ----------------------------------------------------------------------
     Smooth scroll fallback for browsers without CSS scroll-behavior
     ---------------------------------------------------------------------- */
  if (!('scrollBehavior' in document.documentElement.style)) {
    // slice.call, not NodeList.forEach — the browsers that land in this branch
    // are old enough to lack the latter, which would throw exactly here.
    var anchors = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));
    anchors.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - (headerH + 16);
        window.scrollTo(0, top);
      });
    });
  }
})();
