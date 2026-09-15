(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- page load ---------------- */
  window.addEventListener("load", function () {
    document.body.classList.remove("is-loading");
  });

  /* ---------------- sticky header ---------------- */
  var header = document.getElementById("site-header");
  function onScroll() {
    if (window.scrollY > 20) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- off-canvas nav ---------------- */
  var trigger = document.getElementById("nav-trigger");
  var siteNav = document.getElementById("site-nav");
  var backdrop = document.getElementById("nav-backdrop");

  function openNav() {
    siteNav.classList.add("is-open");
    backdrop.classList.add("is-open");
    siteNav.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden";
  }
  function closeNav() {
    siteNav.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    siteNav.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
  }
  trigger.addEventListener("click", function () {
    if (siteNav.classList.contains("is-open")) closeNav();
    else openNav();
  });
  backdrop.addEventListener("click", closeNav);
  siteNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ---------------- scroll cue ---------------- */
  var scrollCue = document.getElementById("scroll-cue");
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      var next = document.querySelector(".marquee-section");
      if (next) next.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- headline rotator ---------------- */
  var rotator = document.getElementById("rotator");
  if (rotator) {
    var words = Array.prototype.slice.call(rotator.querySelectorAll(".rotator-word"));
    if (words.length > 1) {
      // Size the box to the widest word so layout doesn't jump. Measured
      // width is only correct once the real webfont has swapped in (before
      // that, offsetWidth reflects the fallback font's metrics) and once
      // more on resize, since font-size scales with viewport width.
      function sizeRotator() {
        var widest = 0;
        words.forEach(function (w) { widest = Math.max(widest, w.offsetWidth); });
        rotator.style.width = widest + 2 + "px";
      }
      sizeRotator();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(sizeRotator);
      }
      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeRotator, 150);
      });

      var current = 0;
      if (!reduceMotion) {
        setInterval(function () {
          var next = (current + 1) % words.length;
          words[current].classList.remove("is-current");
          words[current].classList.add("is-exiting");
          words[next].classList.add("is-current");
          setTimeout(function () {
            words[current].classList.remove("is-exiting");
          }, 500);
          current = next;
        }, 2600);
      }
    }
  }

  /* ---------------- animated counters ---------------- */
  var counters = document.querySelectorAll(".stat-number");
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var start = null;
    var duration = 1200;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var counterIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (c) { counterIo.observe(c); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------------- work filter, with FLIP morph between layouts ---------------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var workCards = document.querySelectorAll(".work-card");
  var workGrid = document.getElementById("work-grid");
  var LEAVE_MS = 260;
  var MORPH_MS = 480;
  var filterToken = 0;

  function cardMatches(card, filter) {
    return filter === "all" || card.getAttribute("data-category") === filter;
  }

  function applyWorkFilter(filter) {
    var myToken = ++filterToken;
    var cards = Array.prototype.slice.call(workCards);

    if (reduceMotion) {
      cards.forEach(function (card) {
        card.classList.toggle("is-hidden", !cardMatches(card, filter));
      });
      workGrid.classList.toggle("is-filtered", filter !== "all");
      return;
    }

    var wasVisible = {};
    var firstRects = {};
    cards.forEach(function (card, i) {
      var visible = !card.classList.contains("is-hidden");
      wasVisible[i] = visible;
      if (visible) firstRects[i] = card.getBoundingClientRect();
    });

    // Phase 1: fade + shrink cards that are about to leave, in their current spot.
    cards.forEach(function (card, i) {
      if (wasVisible[i] && !cardMatches(card, filter)) {
        card.style.transform = "scale(.85)";
        card.style.opacity = "0";
      }
    });

    setTimeout(function () {
      if (myToken !== filterToken) return; // a newer filter click superseded this one

      // Phase 2: commit the new visible set + grid mode, then measure new positions.
      cards.forEach(function (card, i) {
        var after = cardMatches(card, filter);
        card.classList.toggle("is-hidden", !after);
        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = after ? "1" : "";
      });
      workGrid.classList.toggle("is-filtered", filter !== "all");
      // eslint-disable-next-line no-unused-expressions
      workGrid.offsetHeight; // force reflow so new layout is measurable

      cards.forEach(function (card, i) {
        if (card.classList.contains("is-hidden")) return;
        var last = card.getBoundingClientRect();

        if (wasVisible[i] && firstRects[i]) {
          // Remaining card: invert from old rect, then play back to natural position (FLIP).
          var first = firstRects[i];
          var dx = first.left - last.left;
          var dy = first.top - last.top;
          var sx = first.width / last.width;
          var sy = first.height / last.height;
          card.style.transformOrigin = "top left";
          card.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ")";
        } else {
          // Newly entering card: pop in from slightly smaller/transparent.
          card.style.transform = "scale(.85)";
          card.style.opacity = "0";
        }
      });

      // eslint-disable-next-line no-unused-expressions
      workGrid.offsetHeight; // flush the "from" state before transitioning

      cards.forEach(function (card) {
        if (card.classList.contains("is-hidden")) return;
        card.style.transition =
          "transform " + MORPH_MS + "ms var(--ease), opacity " + MORPH_MS + "ms var(--ease)";
        card.style.transform = "";
        card.style.opacity = "1";
      });

      setTimeout(function () {
        if (myToken !== filterToken) return;
        cards.forEach(function (card) {
          card.style.transition = "";
          card.style.transform = "";
          card.style.opacity = "";
          card.style.transformOrigin = "";
        });
      }, MORPH_MS + 40);
    }, LEAVE_MS);
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      applyWorkFilter(btn.getAttribute("data-filter"));
    });
  });

  /* ---------------- footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- contact form -> Web3Forms ---------------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var statusEl = document.getElementById("form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;

    function setStatus(text, kind) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = "form-status" + (kind ? " is-" + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("", "");
      submitBtn.disabled = true;
      var originalLabel = btnLabel ? btnLabel.textContent : "";
      if (btnLabel) btnLabel.textContent = "Sending…";

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          submitBtn.disabled = false;
          if (btnLabel) btnLabel.textContent = originalLabel;
          if (data.success) {
            form.reset();
            setStatus("Thanks — your message is on its way. We'll get back to you within one business day.", "success");
          } else {
            setStatus("Something went wrong. Please email us directly at jcut.agency@gmail.com.", "error");
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          if (btnLabel) btnLabel.textContent = originalLabel;
          setStatus("Something went wrong. Please email us directly at jcut.agency@gmail.com.", "error");
        });
    });
  }
})();
