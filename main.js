'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const SCENE_NAMES = ['rain', 'storm', 'golden', 'ocean', 'space'];
const SCENE_LABELS = ['Night Rain', 'Electric Storm', 'Golden Hour', 'Blue Hour', 'Deep Space'];

/* ═══════════════════════════════════════════════════════════════════════
   FILM GRAIN — true noise redrawing every frame
═══════════════════════════════════════════════════════════════════════ */
function initGrain() {
  const canvas = document.getElementById('grain');
  const ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function render() {
    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v  = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = (Math.random() * 36) | 0;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  render();
}

/* ═══════════════════════════════════════════════════════════════════════
   ATMOSPHERIC CANVAS — scene-switching particle / weather system
═══════════════════════════════════════════════════════════════════════ */
let fxCanvas, fxCtx, fxW = 0, fxH = 0;
let activeScene = 'rain';
let fxT = 0;
let lightningCooldown = 0;

const FX = {
  rain:   null,
  storm:  null,
  golden: null,
  ocean:  null,
  space:  null,
};

function initFX() {
  fxCanvas = document.getElementById('fx');
  fxCtx    = fxCanvas.getContext('2d');

  function resize() {
    fxW = fxCanvas.width  = window.innerWidth;
    fxH = fxCanvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Initialise all particle pools once
  FX.rain   = makeRainDrops(110, 0.004, 0.0045);
  FX.storm  = makeRainDrops(200, 0.008, 0.008);
  FX.golden = makeDust(55);
  FX.ocean  = makeBokeh(32);
  FX.space  = makeStars(220);

  (function loop() {
    fxCtx.clearRect(0, 0, fxW, fxH);
    renderFX(fxCtx, fxW, fxH, ++fxT, activeScene);
    requestAnimationFrame(loop);
  })();
}

function setScene(name) { activeScene = name; }

/* ── Factories ────────────────────────────────────────────────────────── */
function makeRainDrops(n, minSpeed, spread) {
  return Array.from({ length: n }, () => ({
    x:   Math.random(),
    y:   Math.random(),
    len: (9 + Math.random() * 14) / 1000,
    spd: minSpeed + Math.random() * spread,
    op:  0.03 + Math.random() * 0.08,
  }));
}

function makeDust(n) {
  return Array.from({ length: n }, () => ({
    x:   Math.random(),
    y:   Math.random(),
    r:   0.6 + Math.random() * 2.2,
    spd: 0.0002 + Math.random() * 0.0004,
    dx:  (Math.random() - 0.5) * 0.00018,
    op:  0.12 + Math.random() * 0.32,
    ph:  Math.random() * Math.PI * 2,
  }));
}

function makeBokeh(n) {
  return Array.from({ length: n }, () => ({
    x:  Math.random(),
    y:  Math.random(),
    r:  4 + Math.random() * 14,
    op: 0.02 + Math.random() * 0.06,
    dx: (Math.random() - 0.5) * 0.00007,
    ph: Math.random() * Math.PI * 2,
  }));
}

function makeStars(n) {
  return Array.from({ length: n }, () => ({
    x:  Math.random(),
    y:  Math.random(),
    r:  0.25 + Math.random() * 1.3,
    op: 0.15 + Math.random() * 0.75,
    ph: Math.random() * Math.PI * 2,
  }));
}

/* ── Scene renders ────────────────────────────────────────────────────── */
function renderFX(ctx, w, h, t, scene) {
  ctx.save();
  if      (scene === 'rain')   drawRain(ctx, w, h, FX.rain, '#A855F7', 0);
  else if (scene === 'storm')  drawStorm(ctx, w, h, t);
  else if (scene === 'golden') drawDust(ctx, w, h, t, FX.golden, '#FBBF24');
  else if (scene === 'ocean')  drawBokeh(ctx, w, h, t, FX.ocean, '#2DD4BF');
  else if (scene === 'space')  drawStars(ctx, w, h, t, FX.space);
  ctx.restore();
}

function drawRain(ctx, w, h, drops, color, angleX) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  drops.forEach(d => {
    ctx.globalAlpha = d.op;
    ctx.beginPath();
    ctx.moveTo(d.x * w, d.y * h);
    ctx.lineTo(d.x * w + angleX, (d.y + d.len) * h);
    ctx.stroke();
    d.y += d.spd;
    if (d.y > 1.02) { d.y = -0.02; d.x = Math.random(); }
  });
  ctx.globalAlpha = 1;
}

function drawStorm(ctx, w, h, t) {
  // heavier diagonal rain
  ctx.strokeStyle = '#818CF8';
  ctx.lineWidth = 0.5;
  FX.storm.forEach(d => {
    ctx.globalAlpha = d.op;
    ctx.beginPath();
    ctx.moveTo(d.x * w, d.y * h);
    ctx.lineTo(d.x * w - 3, (d.y + d.len * 1.4) * h);
    ctx.stroke();
    d.y += d.spd;
    d.x -= d.spd * 0.25;
    if (d.y > 1.02) { d.y = -0.02; d.x = Math.random() + 0.1; }
    if (d.x < -0.05) d.x = 1.05;
  });
  ctx.globalAlpha = 1;

  // random lightning flash
  lightningCooldown++;
  if (lightningCooldown > 200 + (Math.random() * 180 | 0)) {
    ctx.fillStyle = 'rgba(160, 160, 255, 0.04)';
    ctx.fillRect(0, 0, w, h);
    lightningCooldown = 0;
  }
}

function drawDust(ctx, w, h, t, motes, color) {
  ctx.fillStyle = color;
  motes.forEach(m => {
    const flicker = Math.sin(t * 0.015 + m.ph) * 0.1;
    ctx.globalAlpha = Math.max(0, m.op + flicker);
    ctx.beginPath();
    ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
    ctx.fill();
    m.y -= m.spd;
    m.x += m.dx;
    if (m.y < -0.01) m.y = 1.01;
    if (m.x < 0)     m.x = 1;
    if (m.x > 1)     m.x = 0;
  });
  ctx.globalAlpha = 1;
}

function drawBokeh(ctx, w, h, t, circles, color) {
  ctx.strokeStyle = color;
  circles.forEach(b => {
    const flicker = Math.sin(t * 0.006 + b.ph) * 0.018;
    ctx.globalAlpha = Math.max(0, b.op + flicker);
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.arc(b.x * w, b.y * h, b.r, 0, Math.PI * 2);
    ctx.stroke();
    b.x += b.dx;
    if (b.x < -0.05) b.x = 1.05;
    if (b.x > 1.05)  b.x = -0.05;
  });
  ctx.globalAlpha = 1;
}

function drawStars(ctx, w, h, t, stars) {
  stars.forEach(s => {
    const twinkle = Math.sin(t * 0.009 + s.ph) * 0.22;
    const a = Math.max(0, s.op + twinkle);

    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle   = '#A855F7';
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();

    if (s.op > 0.5) {
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle   = '#F8F8F8';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════════════════════ */
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

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
}

/* ═══════════════════════════════════════════════════════════════════════
   TEXT SCRAMBLE — character-by-character noise reveal
═══════════════════════════════════════════════════════════════════════ */
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&!?';

function scramble(el, onDone) {
  const final  = el.dataset.final;
  const frames = 44;
  let f = 0;

  el.style.opacity = '1';

  const id = setInterval(() => {
    el.textContent = final.split('').map((ch, i) => {
      const p = (f / frames - i / final.length) * 2;
      return p >= 1 ? ch : POOL[(Math.random() * POOL.length) | 0];
    }).join('');

    if (++f > frames) {
      clearInterval(id);
      el.textContent = final;
      if (onDone) onDone();
    }
  }, 40);
}

/* ═══════════════════════════════════════════════════════════════════════
   GLITCH — random chromatic jitter, fires every 5–20 s
═══════════════════════════════════════════════════════════════════════ */
function scheduleGlitch(el) {
  const delay = 5000 + Math.random() * 15000;

  setTimeout(() => {
    const dur   = 180 + Math.random() * 130;
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
        `${-x * 1.8}px 0 rgba(168,85,247,.9), ${x}px 0 rgba(255,255,255,.15)`;
      requestAnimationFrame(frame);
    })();
  }, delay);
}

/* ═══════════════════════════════════════════════════════════════════════
   TYPEWRITER
═══════════════════════════════════════════════════════════════════════ */
function typewrite(el) {
  const text = el.dataset.text;
  let i = 0;

  function tick() {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(tick, 48);
  }

  setTimeout(tick, 1950);
}

/* ═══════════════════════════════════════════════════════════════════════
   3-D CARD TILT + SPOTLIGHT
═══════════════════════════════════════════════════════════════════════ */
function initTilt() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;

      card.style.transition =
        'transform .08s ease, border-color .35s ease, background .35s ease, box-shadow .35s ease';
      card.style.transform =
        `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;

      const px = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      const py = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      card.style.setProperty('--mx', `${px}%`);
      card.style.setProperty('--my', `${py}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition =
        'transform .55s ease, border-color .35s ease, background .35s ease, box-shadow .35s ease';
      card.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0)';
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   NAVIGATION — vertical scroll, horizontal wheel, touch swipe, keyboard
═══════════════════════════════════════════════════════════════════════ */
function initNav() {
  const container  = document.getElementById('scroll-container');
  const panels     = document.querySelectorAll('.panel');
  const dots       = document.querySelectorAll('.dot');
  const bar        = document.querySelector('.progress-bar');
  const sceneBadge = document.getElementById('scene-label');
  const scrollHint = document.getElementById('scroll-hint');

  let current    = 0;
  let navigating = false;

  function goTo(idx) {
    if (idx < 0 || idx >= panels.length || navigating) return;
    navigating = true;
    current = idx;
    panels[idx].scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { navigating = false; }, 850);
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  /* Horizontal wheel → section nav */
  container.addEventListener('wheel', e => {
    const isH = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (isH) {
      e.preventDefault();
      if (e.deltaX > 25) next();
      else if (e.deltaX < -25) prev();
    }
  }, { passive: false });

  /* Touch swipe left/right */
  let tx = 0, ty = 0;

  container.addEventListener('touchstart', e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    const dx = tx - e.changedTouches[0].clientX;
    const dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      dx > 0 ? next() : prev();
    }
  }, { passive: true });

  /* Keyboard: arrows + j/k */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown'  || e.key === 'j' || e.key === 'ArrowRight') next();
    if (e.key === 'ArrowUp'    || e.key === 'k' || e.key === 'ArrowLeft')  prev();
  });

  /* Dot clicks */
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  /* Progress bar on scroll */
  container.addEventListener('scroll', () => {
    const max = container.scrollHeight - container.clientHeight;
    if (bar && max > 0) bar.style.width = (container.scrollTop / max * 100) + '%';
  }, { passive: true });

  /* IntersectionObserver — activates dots, scene, reveals */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const idx = [...panels].indexOf(entry.target);
      current = idx;

      /* Nav dots */
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));

      /* Scene switch (canvas FX + CSS custom property + badge) */
      const scene = SCENE_NAMES[idx] || 'rain';
      setScene(scene);
      document.documentElement.dataset.scene = scene;
      if (sceneBadge) sceneBadge.textContent  = SCENE_LABELS[idx] || '';

      /* Reveal elements */
      entry.target
        .querySelectorAll('.reveal:not(.in-view)')
        .forEach(el => el.classList.add('in-view'));

      /* Hide scroll hint after leaving hero */
      if (idx > 0 && scrollHint) scrollHint.classList.add('hidden');
    });
  }, { root: container, threshold: 0.52 });

  panels.forEach(p => obs.observe(p));
}

/* ═══════════════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initGrain();
  initFX();
  initCursor();
  initTilt();
  initNav();

  /* Trigger hero reveals immediately */
  document.querySelectorAll('#panel-0 .reveal')
          .forEach(el => el.classList.add('in-view'));

  /* Scramble name → start glitch loop */
  const nameEl = document.querySelector('.name-scramble');
  if (nameEl) {
    nameEl.style.opacity = '0';
    setTimeout(() => scramble(nameEl, () => scheduleGlitch(nameEl)), 350);
  }

  /* Typewriter tagline */
  const twEl = document.querySelector('.typewriter-target');
  if (twEl) typewrite(twEl);

  /* Freeze name cursor after animations settle */
  const nameCursor = document.querySelector('.name-cursor');
  if (nameCursor) {
    setTimeout(() => {
      nameCursor.style.animation = 'none';
      nameCursor.style.opacity   = '1';
    }, 4600);
  }
});
