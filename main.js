'use strict';

const container = document.getElementById('scroll-container');
const panels    = document.querySelectorAll('.panel');
const dots      = document.querySelectorAll('.dot');

let currentPanel = 0;

// ── Nav dot activation ────────────────────────────────────────────────────
function setActive(index) {
  currentPanel = index;
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

// Watch which panel is in view
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = [...panels].indexOf(entry.target);
        if (index !== -1) setActive(index);
      }
    });
  },
  { root: container, threshold: 0.55 }
);

panels.forEach((p) => observer.observe(p));

// ── Dot click → smooth scroll ─────────────────────────────────────────────
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    panels[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Keyboard navigation (↑ ↓ / j k) ─────────────────────────────────────
document.addEventListener('keydown', (e) => {
  const down = e.key === 'ArrowDown' || e.key === 'j';
  const up   = e.key === 'ArrowUp'   || e.key === 'k';

  if (down && currentPanel < panels.length - 1) {
    panels[currentPanel + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (up && currentPanel > 0) {
    panels[currentPanel - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ── Cursor — freeze solid after 3 blinks (CSS handles the animation,
//    JS ensures it's visible if CSS animation is unsupported) ───────────────
const cursor = document.querySelector('.cursor');
if (cursor) {
  // The CSS animation runs 6 iterations at 0.65s each = ~3.9s total.
  // After that, animation-fill-mode: forwards leaves it at opacity:1.
  // Belt-and-suspenders: force it solid after the animation completes.
  setTimeout(() => {
    cursor.style.animation = 'none';
    cursor.style.opacity   = '1';
  }, 4200);
}

// ── Section number tint on enter ─────────────────────────────────────────
const sectionNums = document.querySelectorAll('.section-num');
const numObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const num = entry.target.querySelector('.section-num');
      if (num) num.style.color = entry.isIntersecting
        ? 'rgba(0, 255, 136, 0.04)'
        : 'rgba(255, 255, 255, 0.022)';
    });
  },
  { root: container, threshold: 0.55 }
);

panels.forEach((p) => numObserver.observe(p));
