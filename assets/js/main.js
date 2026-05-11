// main.js
// - scroll reveal for [data-scroll] (now supports unscroll/reset)
// - blur background (3D hero canvas) once you scroll past hero title

document.addEventListener("DOMContentLoaded", () => {
  setupScrollReveal();
  setupBackgroundBlur();
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

function setupBackgroundBlur() {
  const heroCanvas = document.getElementById("hero-canvas");
  const blurLayer = document.getElementById("background-blur-layer");
  const heroHeading = document.querySelector(".hero-heading");

  // Only run on the index page where these exist
  if (!heroCanvas || !blurLayer || !heroHeading) return;

  let titleThreshold = 0;

  function recalcThreshold() {
    const rect = heroHeading.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    // blur starts once the bottom of the title has scrolled past the top
    titleThreshold = rect.bottom + scrollY;
  }

  recalcThreshold();
  window.addEventListener("resize", recalcThreshold);

  function onScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (y > titleThreshold) {
      blurLayer.classList.add("is-active");
    } else {
      blurLayer.classList.remove("is-active");
    }
  }

  window.addEventListener("scroll", onScroll);
  onScroll();
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
