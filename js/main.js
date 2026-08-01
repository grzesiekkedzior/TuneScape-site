const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobile navigation
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");

function setNavigation(open) {
  if (!navToggle || !navMenu) return;

  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.querySelector(".sr-only").textContent = open ? "Close navigation" : "Open navigation";
  navMenu.classList.toggle("open", open);
  document.body.classList.toggle("nav-open", open);
}

navToggle?.addEventListener("click", () => {
  setNavigation(navToggle.getAttribute("aria-expanded") !== "true");
});

navMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigation(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) setNavigation(false);
});

// Scroll entrance animations
const animatedElements = document.querySelectorAll(".animate");

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  document.body.classList.add("motion-ready");

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  animatedElements.forEach((element) => observer.observe(element));
} else {
  animatedElements.forEach((element) => element.classList.add("visible"));
}

// Scroll progress
const progressBar = document.getElementById("scroll-progress");

function updateScrollProgress() {
  if (!progressBar) return;

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

// Theme preview switcher
const themeTabs = document.querySelectorAll(".theme-tab");
const themePreview = document.getElementById("theme-preview");
const themeName = document.getElementById("theme-name");
const themePreviewTrigger = document.getElementById("theme-preview-trigger");

function selectTheme(tab) {
  if (!themePreview || !themeName || !themePreviewTrigger) return;

  const source = tab.dataset.themeSrc;
  const name = tab.dataset.themeName;
  const alt = tab.dataset.themeAlt;

  themeTabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });

  const applyTheme = () => {
    themePreview.src = source;
    themePreview.alt = alt;
    themeName.textContent = name;
    themePreviewTrigger.dataset.lightboxSrc = source;
    themePreviewTrigger.dataset.lightboxCaption = `TuneScape 6.0.0 — ${name} theme`;
    themePreviewTrigger.setAttribute("aria-label", `Open a larger view of the ${name} theme`);

    const reveal = () => themePreview.classList.remove("is-changing");
    if (themePreview.complete) reveal();
    else themePreview.addEventListener("load", reveal, { once: true });
  };

  if (prefersReducedMotion) {
    applyTheme();
  } else {
    themePreview.classList.add("is-changing");
    window.setTimeout(applyTheme, 120);
  }
}

themeTabs.forEach((tab) => tab.addEventListener("click", () => selectTheme(tab)));

// Accessible image lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-img");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxClose = lightbox?.querySelector("[data-lightbox-close]");
const lightboxPrevious = lightbox?.querySelector("[data-lightbox-prev]");
const lightboxNext = lightbox?.querySelector("[data-lightbox-next]");

let galleryItems = [];
let galleryIndex = 0;
let previouslyFocused = null;

function refreshGallery() {
  galleryItems = Array.from(document.querySelectorAll("[data-lightbox-src]"));
}

function renderLightboxImage() {
  const item = galleryItems[galleryIndex];
  if (!item || !lightboxImage || !lightboxTitle) return;

  const caption = item.dataset.lightboxCaption || "TuneScape screenshot";
  lightboxImage.src = item.dataset.lightboxSrc;
  lightboxImage.alt = caption;
  lightboxTitle.textContent = caption;
}

function openLightbox(trigger) {
  if (!lightbox) return;

  refreshGallery();
  galleryIndex = Math.max(0, galleryItems.indexOf(trigger));
  previouslyFocused = document.activeElement;
  renderLightboxImage();

  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  window.requestAnimationFrame(() => lightbox.classList.add("active"));
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;

  lightbox.classList.remove("active");
  document.body.classList.remove("lightbox-open");

  const finish = () => {
    lightbox.hidden = true;
    if (lightboxImage) lightboxImage.src = "";
    previouslyFocused?.focus();
  };

  if (prefersReducedMotion) finish();
  else window.setTimeout(finish, 220);
}

function moveLightbox(direction) {
  if (!galleryItems.length) return;
  galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
  renderLightboxImage();
}

document.querySelectorAll("[data-lightbox-src]").forEach((trigger) => {
  trigger.addEventListener("click", () => openLightbox(trigger));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrevious?.addEventListener("click", () => moveLightbox(-1));
lightboxNext?.addEventListener("click", () => moveLightbox(1));

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  const lightboxIsOpen = lightbox && !lightbox.hidden;
  const navigationIsOpen = navToggle?.getAttribute("aria-expanded") === "true";

  if (event.key === "Escape") {
    if (lightboxIsOpen) closeLightbox();
    else if (navigationIsOpen) {
      setNavigation(false);
      navToggle?.focus();
    }
    return;
  }

  if (!lightboxIsOpen) return;

  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);

  if (event.key === "Tab") {
    const focusable = Array.from(lightbox.querySelectorAll("button:not([disabled])"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
