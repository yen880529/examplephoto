const navigationDelay = 500;
const interactiveSelector = ".feature-card, .search-result";

function setPressing(activeElement) {
  if (activeElement) {
    activeElement.classList.add("is-pressing");
  }
}

function setActivating(activeElement) {
  if (activeElement) {
    activeElement.classList.remove("is-pressing");
    activeElement.classList.add("is-activating");
  }
}

function clearInteractionState() {
  document.querySelectorAll(".is-pressing, .is-activating").forEach((element) => {
    element.classList.remove("is-pressing");
    element.classList.remove("is-activating");
  });
}

function goAfterAnimation(path, activeElement) {
  setActivating(activeElement);

  window.setTimeout(() => {
    window.location.href = path;
  }, navigationDelay);
}

function setupSiteNavigation(selector = interactiveSelector) {
  document.addEventListener("pointerdown", (event) => {
    const activeElement = event.target.closest(selector);
    setPressing(activeElement);
  });

  document.addEventListener("pointerup", (event) => {
    const activeElement = event.target.closest(selector);
    if (activeElement) {
      window.setTimeout(() => {
        if (!activeElement.classList.contains("is-activating")) {
          activeElement.classList.remove("is-pressing");
        }
      }, 80);
    }
  });

  document.addEventListener("pointercancel", clearInteractionState);
  document.addEventListener("pointerleave", (event) => {
    const activeElement = event.target.closest(selector);
    if (activeElement && !activeElement.classList.contains("is-activating")) {
      activeElement.classList.remove("is-pressing");
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest(selector);
    if (!link) return;

    event.preventDefault();
    goAfterAnimation(link.href, link);
  });

  window.addEventListener("pageshow", clearInteractionState);
}

setupSiteNavigation();
