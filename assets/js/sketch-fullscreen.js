// Sketch fullscreen — one button per .sketch-wrapper on project detail pages (.page.page--project)
document.addEventListener("DOMContentLoaded", () => {
  const page = document.querySelector("main.page.page--project");
  if (!page) return;

  const wrappers = page.querySelectorAll(".sketch-wrapper");
  if (!wrappers.length) return;

  const syncBodyLockAndLabels = () => {
    const anyOpen = !!page.querySelector(".sketch-wrapper.is-fullscreen");
    document.body.classList.toggle("sketch-lock-scroll", anyOpen);

    wrappers.forEach((w) => {
      const toggle = w.querySelector(".sketch-fullscreen-toggle");
      if (!toggle) return;
      toggle.textContent = w.classList.contains("is-fullscreen") ? "Close" : "Fullscreen";
    });
  };

  const closeAll = () => {
    wrappers.forEach((w) => w.classList.remove("is-fullscreen"));
    syncBodyLockAndLabels();
  };

  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.sketchFullscreenInit === "1") return;

    const embed = wrapper.querySelector(".sketch-embed");
    if (!embed) return;

    wrapper.dataset.sketchFullscreenInit = "1";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sketch-fullscreen-toggle";
    btn.setAttribute("aria-label", "View sketch fullscreen");
    btn.textContent = "Fullscreen";
    wrapper.appendChild(btn);

    const openThis = () => {
      wrappers.forEach((w) => w.classList.remove("is-fullscreen"));
      wrapper.classList.add("is-fullscreen");
      syncBodyLockAndLabels();
    };

    const toggleFullscreen = () => {
      if (wrapper.classList.contains("is-fullscreen")) {
        wrapper.classList.remove("is-fullscreen");
      } else {
        openThis();
      }
      syncBodyLockAndLabels();
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFullscreen();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!page.querySelector(".sketch-wrapper.is-fullscreen")) return;
    closeAll();
  });
});
