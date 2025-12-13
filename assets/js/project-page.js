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

  /* =======================================
     FULLSCREEN SKETCH (project pages only)
     ======================================= */
  const page = document.querySelector(".page--project");
  if (!page) return; // don’t touch index.html

  const wrapper = page.querySelector(".sketch-wrapper");
  const embed = wrapper ? wrapper.querySelector(".sketch-embed") : null;
  if (!wrapper || !embed) return;

  // Create the toggle button
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sketch-fullscreen-toggle";
  btn.textContent = "Fullscreen";
  wrapper.appendChild(btn);

  const openFullscreen = () => {
    wrapper.classList.add("is-fullscreen");
    document.body.classList.add("sketch-lock-scroll");
    btn.textContent = "Close";
  };

  const closeFullscreen = () => {
    wrapper.classList.remove("is-fullscreen");
    document.body.classList.remove("sketch-lock-scroll");
    btn.textContent = "Fullscreen";
  };

  const toggleFullscreen = () => {
    if (wrapper.classList.contains("is-fullscreen")) {
      closeFullscreen();
    } else {
      openFullscreen();
    }
  };

  // Click sketch OR button to toggle
  embed.addEventListener("click", toggleFullscreen);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  // Escape key closes fullscreen
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wrapper.classList.contains("is-fullscreen")) {
      closeFullscreen();
    }
  });
});
