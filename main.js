'use strict';

/* ═══════════════════════════════════════════════════════════════
   FILM GRAIN — canvas redrawn every frame for authentic texture
═══════════════════════════════════════════════════════════════ */
function initGrain() {
  const canvas = document.getElementById('grain');
  const ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function render() {
    const w   = canvas.width;
    const h   = canvas.height;
    const img = ctx.createImageData(w, h);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v  = (Math.random() * 255) | 0;
      d[i]     = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = (Math.random() * 38) | 0;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  render();
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR — dot (instant) + ring (lagged smooth follow)
═══════════════════════════════════════════════════════════════ */
function initCursor() {
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
  });

  (function loopRing() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
    requestAnimationFrame(loopRing);
  })();

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('expand'));
    el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEXT SCRAMBLE — reveals final text char-by-char with noise
═══════════════════════════════════════════════════════════════ */
function scramble(el, onDone) {
  const final = el.dataset.final;
  const pool  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&';
  const total = 42;
  let frame   = 0;

  el.style.opacity = '1';

  const id = setInterval(() => {
    el.textContent = final.split('').map((ch, i) => {
      const p = (frame / total - i / final.length) * 2;
      if (p >= 1) return ch;
      return pool[(Math.random() * pool.length) | 0];
    }).join('');

    if (++frame > total) {
      clearInterval(id);
      el.textContent = final;
      if (onDone) onDone();
    }
  }, 42);
}

/* ═══════════════════════════════════════════════════════════════
   GLITCH — occasional horizontal jitter + chromatic split
═══════════════════════════════════════════════════════════════ */
function scheduleGlitch(el) {
  const fire = () => {
    const dur   = 200 + Math.random() * 120;
    const start = Date.now();

    (function frame() {
      const t = Date.now() - start;
      if (t >= dur) {
        el.style.transform  = '';
        el.style.textShadow = '';
        scheduleGlitch(el);
        return;
      }
      const x = (Math.random() - 0.5) * 5;
      el.style.transform  = `translateX(${x}px)`;
      el.style.textShadow =
        `${-x * 1.8}px 0 rgba(168,85,247,0.9), ${x}px 0 rgba(255,255,255,0.15)`;
      requestAnimationFrame(frame);
    })();
  };

  setTimeout(fire, 5000 + Math.random() * 14000);
}

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER — types out a string with configurable speed
═══════════════════════════════════════════════════════════════ */
function typewrite(el) {
  const text  = el.dataset.text;
  const speed = 50;
  let i = 0;

  function tick() {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(tick, speed);
  }

  setTimeout(tick, 1900);
}

/* ═══════════════════════════════════════════════════════════════
   3D CARD TILT + SPOTLIGHT — perspective tilt on mousemove
   with a radial glow that tracks cursor inside the card
═══════════════════════════════════════════════════════════════ */
function initTilt() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    const glow = card.querySelector('.card-glow');

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;

      card.style.transition =
        'transform 0.08s ease, border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease';
      card.style.transform =
        `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;

      if (glow) {
        const px = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
        const py = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
        card.style.setProperty('--mx', `${px}%`);
        card.style.setProperty('--my', `${py}%`);
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition =
        'transform 0.55s ease, border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease';
      card.style.transform =
        'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL OBSERVERS — reveal, nav dots, progress bar
═══════════════════════════════════════════════════════════════ */
function initScroll() {
  const container = document.getElementById('scroll-container');
  const panels    = document.querySelectorAll('.panel');
  const dots      = document.querySelectorAll('.dot');
  const bar       = document.querySelector('.progress-bar');

  let current = 0;

  // progress bar
  container.addEventListener('scroll', () => {
    const max = container.scrollHeight - container.clientHeight;
    if (bar && max > 0) bar.style.width = (container.scrollTop / max * 100) + '%';
  }, { passive: true });

  // panel observer — activate nav dot + trigger reveals
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const idx = [...panels].indexOf(entry.target);
      current = idx;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));

      entry.target.querySelectorAll('.reveal:not(.in-view)')
           .forEach(el => el.classList.add('in-view'));
    });
  }, { root: container, threshold: 0.5 });

  panels.forEach(p => obs.observe(p));

  // keyboard: ↑↓ or j/k
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'j') {
      if (current < panels.length - 1) {
        panels[current + 1].scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      if (current > 0) {
        panels[current - 1].scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // dot clicks
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      panels[i].scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initGrain();
  initCursor();
  initTilt();
  initScroll();

  // Hero reveals fire immediately (no scroll needed)
  document.querySelectorAll('#panel-0 .reveal')
          .forEach(el => el.classList.add('in-view'));

  // Scramble the name, then start glitch loop
  const nameEl = document.querySelector('.name-scramble');
  if (nameEl) {
    nameEl.style.opacity = '0';
    setTimeout(() => scramble(nameEl, () => scheduleGlitch(nameEl)), 350);
  }

  // Typewriter for tagline
  const twEl = document.querySelector('.typewriter-target');
  if (twEl) typewrite(twEl);

  // Freeze name cursor solid after animations settle
  const nameCursor = document.querySelector('.name-cursor');
  if (nameCursor) {
    setTimeout(() => {
      nameCursor.style.animation = 'none';
      nameCursor.style.opacity   = '1';
    }, 4600);
  }
});
