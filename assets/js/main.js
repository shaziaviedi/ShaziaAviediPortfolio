// main.js
// - Scroll reveal for [data-scroll]
// - Blur background (3D hero canvas) once you scroll past hero title

document.addEventListener("DOMContentLoaded", () => {
  setupScrollReveal();
  setupBackgroundBlur();
});

function setupScrollReveal() {
  const els = document.querySelectorAll("[data-scroll]");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
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
