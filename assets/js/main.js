// main.js
// - scroll reveal for [data-scroll] (now supports unscroll/reset)
// - homepage only: blur + tinted scrim over the fixed 3D hero after landing ("Scroll to explore")

document.addEventListener("DOMContentLoaded", () => {
  setupScrollReveal();
  setupHomeBackdropScroll();
  setupInfiniteDocGallery();
});

function setupScrollReveal() {
  const els = document.querySelectorAll("[data-scroll]");
  if (!els.length) return;

  // if no IntersectionObserver, just show everything
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // when it enters view -> show
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          // when it leaves view -> hide again (so animation can replay)
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      threshold: 0.15,
      // a little earlier trigger feels nicer
      rootMargin: "0px 0px -10% 0px",
    }
  );

  els.forEach((el) => observer.observe(el));
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/** Ramps blur + scrim as #portfolio rises — landing stays crystal-clear until ~“Scroll to explore” band */
function setupHomeBackdropScroll() {
  if (!document.body.classList.contains("page-home")) return;

  const root = document.documentElement;
  const portfolio = document.getElementById("portfolio");
  const hint = document.querySelector(".hero-scroll-hint");

  if (!portfolio || !hint) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function update() {
    if (reduce.matches) {
      const vh = window.innerHeight || 700;
      const t = portfolio.getBoundingClientRect().top;
      const hard = t < vh * 0.72 ? 1 : 0;
      root.style.setProperty("--home-hero-blur", hard ? "12px" : "0px");
      root.style.setProperty("--home-scrim-alpha", hard ? "0.5" : "0");
      return;
    }

    const vh = window.innerHeight || 680;
    const hintRect = hint.getBoundingClientRect();
    /* Don’t darken or blur until the reader has scrolled past the landing cue */
    if (hintRect.bottom > vh * 0.93) {
      root.style.setProperty("--home-hero-blur", "0px");
      root.style.setProperty("--home-scrim-alpha", "0");
      return;
    }

    const t = portfolio.getBoundingClientRect().top;
    const start = vh * 0.94;
    const end = vh * 0.38;

    let p = 1;
    if (t >= start) p = 0;
    else if (t <= end) p = 1;
    else p = (start - t) / (start - end);

    p = clamp01(p);

    root.style.setProperty("--home-hero-blur", `${(p * 13).toFixed(2)}px`);
    root.style.setProperty("--home-scrim-alpha", `${(p * 0.52).toFixed(4)}`);
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

/**
 * Horizontally looping galleries — duplicate slides once and rewind scrollLeft invisibly
 * when reaching either end (.doc-gallery--infinite).
 */
function setupInfiniteDocGallery() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  document.querySelectorAll(".doc-gallery--infinite").forEach((root) => {
    const scroller = root.querySelector(".doc-gallery__scroller");
    const row = root.querySelector(".doc-gallery__row");
    if (!scroller || !row) return;

    const originals = row.querySelectorAll(".doc-gallery__item");
    const n = originals.length;
    if (n === 0) return;

    for (let i = 0; i < n; i++) {
      row.appendChild(originals[i].cloneNode(true));
    }

    let cycleW = 0;
    let jumping = false;

    function measureCycle() {
      const kids = row.children;
      const first = kids[0];
      const last = kids[n - 1];
      if (!first || !last) return 0;
      return last.offsetLeft + last.offsetWidth - first.offsetLeft;
    }

    function muteSnap() {
      scroller.classList.add("doc-gallery__scroller--loop-jump");
    }

    function unmuteSnap() {
      requestAnimationFrame(() => {
        scroller.classList.remove("doc-gallery__scroller--loop-jump");
      });
    }

    function centerOnFirstLoop() {
      cycleW = measureCycle();
      if (cycleW <= 0) return;
      muteSnap();
      scroller.scrollLeft = cycleW;
      unmuteSnap();
    }

    function onScroll() {
      if (jumping || cycleW <= 0) return;

      const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const x = scroller.scrollLeft;
      const edge = Math.min(52, Math.max(6, cycleW * 0.02));

      if (x <= edge) {
        jumping = true;
        muteSnap();
        scroller.scrollLeft = x + cycleW;
        unmuteSnap();
        requestAnimationFrame(() => {
          jumping = false;
        });
      } else if (maxScroll > 0 && x >= maxScroll - edge) {
        jumping = true;
        muteSnap();
        scroller.scrollLeft = x - cycleW;
        unmuteSnap();
        requestAnimationFrame(() => {
          jumping = false;
        });
      }
    }

    const ro = new ResizeObserver(() => {
      muteSnap();
      centerOnFirstLoop();
      requestAnimationFrame(() => unmuteSnap());
    });

    ro.observe(row);
    row.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", () => {
        muteSnap();
        centerOnFirstLoop();
        requestAnimationFrame(() => unmuteSnap());
      });
    });

    requestAnimationFrame(centerOnFirstLoop);

    scroller.addEventListener("scroll", onScroll, { passive: true });
  });
}
