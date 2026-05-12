// assets/js/project-page.js
document.addEventListener("DOMContentLoaded", () => {
  /* ================================
     SCROLL REVEAL (for project pages)
     ================================ */
  const scrollEls = document.querySelectorAll("[data-scroll]");
  if (scrollEls.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    scrollEls.forEach((el) => observer.observe(el));
  }

  /* Fullscreen toggles handled by sketch-fullscreen.js when included */
});
