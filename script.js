/* ==========================================================================
   Adam Atienza — Portfolio
   Vanilla JS: mobile nav, sticky header state, scrollspy, reveal-on-scroll
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Layout constants are declared in style.css so there is a single source of
  // truth. Read them once here rather than repeating the numbers.
  function cssNumber(name, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    var n = parseInt(raw, 10);
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
