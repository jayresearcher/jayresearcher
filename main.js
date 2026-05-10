'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const SCENE_NAMES  = ['rain',       'storm',         'golden',       'ocean',   'space'];
const SCENE_LABELS = ['Night Rain', 'Electric Storm', 'Golden Hour', 'Blue Hour', 'Deep Space'];

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC INTRO  (GSAP timeline)
═══════════════════════════════════════════════════════════════════════ */
function runIntro(onComplete) {
  const intro     = document.getElementById('intro');
  const introName = intro.querySelector('.intro-name');
  const introRole = intro.querySelector('.intro-role');
  const introBar  = intro.querySelector('.intro-bar');

  gsap.set([introName, introRole], { opacity: 0, y: 12 });
  gsap.set(introBar, { scaleX: 0, transformOrigin: 'left' });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(intro, {
        opacity: 0, duration: .7, ease: 'power2.in',
        onComplete: () => { intro.remove(); onComplete(); }
      });
    }
  });

  tl.to(introName, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' })
    .to(introRole,  { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, '-=.3')
    .to(introBar,   { scaleX: 1,        duration: .9, ease: 'power2.inOut' }, '-=.2')
    .to({}, { duration: .5 }); // hold
}

/* ═══════════════════════════════════════════════════════════════════════
   FILM GRAIN — canvas noise, redrawn every frame
═══════════════════════════════════════════════════════════════════════ */
function initGrain() {
  const c   = document.getElementById('grain');
  const ctx = c.getContext('2d');
  let w, h;

  const resize = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  window.addEventListener('resize', resize);
  resize();

  (function render() {
    const img = ctx.createImageData(w, h);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v  = (Math.random() * 255) | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = (Math.random() * 34) | 0;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(render);
  })();
}

/* ═══════════════════════════════════════════════════════════════════════
   ATMOSPHERIC FX  — weather canvas per scene
═══════════════════════════════════════════════════════════════════════ */
let fxCtx, fxW, fxH, activeScene = 'rain', fxT = 0, lCooldown = 0;

const FX = { rain: null, storm: null, golden: null, ocean: null, space: null };

function initFX() {
  const c = document.getElementById('fx');
  fxCtx   = c.getContext('2d');

  const resize = () => { fxW = c.width = innerWidth; fxH = c.height = innerHeight; };
  window.addEventListener('resize', resize);
  resize();

  FX.rain   = drops(110, .004, .0045);
  FX.storm  = drops(200, .008, .008);
  FX.golden = dust(55);
  FX.ocean  = bokeh(32);
  FX.space  = stars(220);

  (function loop() {
    fxCtx.clearRect(0, 0, fxW, fxH);
    renderScene(fxCtx, fxW, fxH, ++fxT, activeScene);
    requestAnimationFrame(loop);
  })();
}

function setScene(name) { activeScene = name; }

/* factories */
const drops = (n, s, sp) => Array.from({ length: n }, () => ({
  x: Math.random(), y: Math.random(),
  len: (9 + Math.random()*14)/1000,
  spd: s + Math.random()*sp,
  op: .03 + Math.random()*.08
}));

const dust = n => Array.from({ length: n }, () => ({
  x: Math.random(), y: Math.random(),
  r: .6 + Math.random()*2.2,
  spd: .0002 + Math.random()*.0004,
  dx: (Math.random()-.5)*.00018,
  op: .12 + Math.random()*.32,
  ph: Math.random()*Math.PI*2
}));

const bokeh = n => Array.from({ length: n }, () => ({
  x: Math.random(), y: Math.random(),
  r: 4 + Math.random()*14,
  op: .02 + Math.random()*.06,
  dx: (Math.random()-.5)*.00007,
  ph: Math.random()*Math.PI*2
}));

const stars = n => Array.from({ length: n }, () => ({
  x: Math.random(), y: Math.random(),
  r: .25 + Math.random()*1.3,
  op: .15 + Math.random()*.75,
  ph: Math.random()*Math.PI*2
}));

/* renderers */
function renderScene(ctx, w, h, t, scene) {
  ctx.save();
  if      (scene==='rain')   drawRain(ctx, w, h, FX.rain, '#A855F7', 0);
  else if (scene==='storm')  drawStorm(ctx, w, h);
  else if (scene==='golden') drawDust(ctx, w, h, t, FX.golden, '#FBBF24');
  else if (scene==='ocean')  drawBokeh(ctx, w, h, t, FX.ocean, '#2DD4BF');
  else if (scene==='space')  drawStars(ctx, w, h, t, FX.space);
  ctx.restore();
}

function drawRain(ctx, w, h, arr, color, ang) {
  ctx.strokeStyle = color; ctx.lineWidth = .5;
  arr.forEach(d => {
    ctx.globalAlpha = d.op;
    ctx.beginPath();
    ctx.moveTo(d.x*w, d.y*h);
    ctx.lineTo(d.x*w + ang, (d.y+d.len)*h);
    ctx.stroke();
    d.y += d.spd;
    if (d.y > 1.02) { d.y = -.02; d.x = Math.random(); }
  });
  ctx.globalAlpha = 1;
}

function drawStorm(ctx, w, h) {
  ctx.strokeStyle = '#818CF8'; ctx.lineWidth = .5;
  FX.storm.forEach(d => {
    ctx.globalAlpha = d.op;
    ctx.beginPath();
    ctx.moveTo(d.x*w, d.y*h);
    ctx.lineTo(d.x*w - 3, (d.y+d.len*1.4)*h);
    ctx.stroke();
    d.y += d.spd; d.x -= d.spd*.25;
    if (d.y > 1.02) { d.y = -.02; d.x = Math.random()+.1; }
    if (d.x < -.05) d.x = 1.05;
  });
  ctx.globalAlpha = 1;
  lCooldown++;
  if (lCooldown > 200 + (Math.random()*180|0)) {
    ctx.fillStyle = 'rgba(160,160,255,.04)';
    ctx.fillRect(0, 0, w, h);
    lCooldown = 0;
  }
}

function drawDust(ctx, w, h, t, arr, color) {
  ctx.fillStyle = color;
  arr.forEach(m => {
    ctx.globalAlpha = Math.max(0, m.op + Math.sin(t*.015+m.ph)*.1);
    ctx.beginPath(); ctx.arc(m.x*w, m.y*h, m.r, 0, Math.PI*2); ctx.fill();
    m.y -= m.spd; m.x += m.dx;
    if (m.y < -.01) m.y = 1.01;
    if (m.x < 0) m.x = 1; if (m.x > 1) m.x = 0;
  });
  ctx.globalAlpha = 1;
}

function drawBokeh(ctx, w, h, t, arr, color) {
  ctx.strokeStyle = color;
  arr.forEach(b => {
    ctx.globalAlpha = Math.max(0, b.op + Math.sin(t*.006+b.ph)*.018);
    ctx.lineWidth = .5;
    ctx.beginPath(); ctx.arc(b.x*w, b.y*h, b.r, 0, Math.PI*2); ctx.stroke();
    b.x += b.dx;
    if (b.x < -.05) b.x = 1.05; if (b.x > 1.05) b.x = -.05;
  });
  ctx.globalAlpha = 1;
}

function drawStars(ctx, w, h, t, arr) {
  arr.forEach(s => {
    const a = Math.max(0, s.op + Math.sin(t*.009+s.ph)*.22);
    ctx.globalAlpha = a*.55;
    ctx.fillStyle   = '#A855F7';
    ctx.beginPath(); ctx.arc(s.x*w, s.y*h, s.r, 0, Math.PI*2); ctx.fill();
    if (s.op > .5) {
      ctx.globalAlpha = a*.55;
      ctx.fillStyle   = '#F2F2F2';
      ctx.beginPath(); ctx.arc(s.x*w, s.y*h, s.r*.38, 0, Math.PI*2); ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR + LABEL
═══════════════════════════════════════════════════════════════════════ */
function initCursor() {
  const dot   = document.querySelector('.cursor-dot');
  const ring  = document.querySelector('.cursor-ring');
  const label = document.getElementById('cursor-label');
  if (!dot) return;

  let mx=-100, my=-100, rx=-100, ry=-100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
    if (label) label.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
  });

  (function loopRing() {
    rx += (mx-rx)*.11; ry += (my-ry)*.11;
    ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
    requestAnimationFrame(loopRing);
  })();

  // Interactive hover states
  document.querySelectorAll('[data-cursor]').forEach(el => {
    const txt = el.dataset.cursor || '';
    el.addEventListener('mouseenter', () => {
      ring.classList.add('has-label');
      if (label) { label.textContent = txt; label.classList.add('visible'); }
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('has-label');
      if (label) label.classList.remove('visible');
    });
  });

  document.querySelectorAll('a:not([data-cursor]), button').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('expand'));
    el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity='0'; ring.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity='1'; ring.style.opacity='1'; });
}

/* ═══════════════════════════════════════════════════════════════════════
   MAGNETIC ELEMENTS — GSAP elastic spring on nav dots
═══════════════════════════════════════════════════════════════════════ */
function initMagnetic() {
  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('mousemove', e => {
      const r = dot.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2)  * .55;
      const y = (e.clientY - r.top  - r.height/2) * .55;
      gsap.to(dot, { x, y, duration: .4, ease: 'power2.out', overwrite: true });
    });
    dot.addEventListener('mouseleave', () => {
      gsap.to(dot, { x:0, y:0, duration: .8, ease: 'elastic.out(1,.6)', overwrite: true });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   3-D CARD TILT + SPOTLIGHT  — GSAP for spring-physics hover
═══════════════════════════════════════════════════════════════════════ */
function initCards() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    const glow = card.querySelector('.card-glow');

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;

      gsap.to(card, {
        rotateY: x*9, rotateX: -y*9, z: 12,
        duration: .08, ease: 'none',
        transformPerspective: 900,
        overwrite: 'auto'
      });

      if (glow) {
        const px = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
        const py = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
        card.style.setProperty('--mx', `${px}%`);
        card.style.setProperty('--my', `${py}%`);
      }
    });

    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.015, duration: .4, ease: 'back.out(1.8)', overwrite: 'auto' });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateY: 0, rotateX: 0, z: 0, scale: 1,
        duration: .7, ease: 'elastic.out(.8,.6)',
        overwrite: 'auto'
      });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   GSAP REVEAL SYSTEM — ScrollTrigger + spring-physics entry
═══════════════════════════════════════════════════════════════════════ */
function initReveals(container) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.defaults({ scroller: container });

  document.querySelectorAll('.g-reveal').forEach(el => {
    const delay = parseInt(el.dataset.delay || '0', 10) / 1000;

    ScrollTrigger.create({
      trigger: el,
      start:   'top 95%',
      once:    true,
      onEnter: () => {
        gsap.fromTo(el,
          { y: 24, scale: .94, opacity: 0 },
          { y: 0,  scale: 1,   opacity: 1,
            duration: .8, delay,
            ease: 'power3.out',
            clearProps: 'transform' }
        );
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   TEXT SCRAMBLE — character noise reveal
═══════════════════════════════════════════════════════════════════════ */
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&!?';

function scramble(el, onDone) {
  const final = el.dataset.final;
  const total = 44;
  let   f     = 0;
  el.style.opacity = '1';

  const id = setInterval(() => {
    el.textContent = final.split('').map((ch, i) => {
      const p = (f/total - i/final.length) * 2;
      return p >= 1 ? ch : POOL[(Math.random()*POOL.length)|0];
    }).join('');
    if (++f > total) { clearInterval(id); el.textContent = final; onDone?.(); }
  }, 40);
}

/* ═══════════════════════════════════════════════════════════════════════
   GLITCH — random chromatic displacement, fires every 5–20 s
═══════════════════════════════════════════════════════════════════════ */
function scheduleGlitch(el) {
  setTimeout(() => {
    const dur = 180 + Math.random()*130, start = Date.now();
    (function frame() {
      if (Date.now()-start >= dur) {
        el.style.transform = ''; el.style.textShadow = '';
        scheduleGlitch(el); return;
      }
      const x = (Math.random()-.5)*5;
      el.style.transform  = `translateX(${x}px)`;
      el.style.textShadow = `${-x*1.8}px 0 rgba(168,85,247,.9), ${x}px 0 rgba(255,255,255,.12)`;
      requestAnimationFrame(frame);
    })();
  }, 5000 + Math.random()*15000);
}

/* ═══════════════════════════════════════════════════════════════════════
   TYPEWRITER
═══════════════════════════════════════════════════════════════════════ */
function typewrite(el) {
  const text = el.dataset.text; let i = 0;
  const tick = () => { el.textContent = text.slice(0, i++); if (i <= text.length) setTimeout(tick, 47); };
  setTimeout(tick, 2000);
}

/* ═══════════════════════════════════════════════════════════════════════
   NAVIGATION — vertical snap + horizontal wheel/swipe + keyboard
═══════════════════════════════════════════════════════════════════════ */
function initNav(container) {
  const panels  = document.querySelectorAll('.panel');
  const dots    = document.querySelectorAll('.dot');
  const bar     = document.querySelector('.progress-bar');
  const hint    = document.getElementById('scroll-hint');
  const cntEl   = document.getElementById('cnt-current');
  const scLabel = document.getElementById('scene-label');

  let current = 0, busy = false;

  function goTo(idx) {
    if (idx < 0 || idx >= panels.length || busy) return;
    busy = true;
    current = idx;
    panels[idx].scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { busy = false; }, 860);
  }

  const next = () => goTo(current+1);
  const prev = () => goTo(current-1);

  // Horizontal wheel
  container.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      if (e.deltaX > 25) next(); else if (e.deltaX < -25) prev();
    }
  }, { passive: false });

  // Touch swipe L/R
  let tx=0, ty=0;
  container.addEventListener('touchstart', e => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; }, { passive:true });
  container.addEventListener('touchend', e => {
    const dx = tx - e.changedTouches[0].clientX;
    const dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) dx>0 ? next() : prev();
  }, { passive:true });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key==='ArrowDown'||e.key==='j'||e.key==='ArrowRight') next();
    if (e.key==='ArrowUp'  ||e.key==='k'||e.key==='ArrowLeft')  prev();
  });

  // Dot clicks
  dots.forEach((d,i) => d.addEventListener('click', () => goTo(i)));

  // Progress bar on scroll
  container.addEventListener('scroll', () => {
    const max = container.scrollHeight - container.clientHeight;
    if (bar && max > 0) bar.style.width = (container.scrollTop/max*100)+'%';
  }, { passive:true });

  // IntersectionObserver — scene, counter, dot, reveal
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx = [...panels].indexOf(entry.target);
      current = idx;

      // dots
      dots.forEach((d,i) => d.classList.toggle('active', i===idx));

      // counter
      if (cntEl) {
        const next = String(idx+1).padStart(2,'0');
        gsap.to(cntEl, {
          opacity:0, y:-8, duration:.18, ease:'power2.in',
          onComplete: () => {
            cntEl.textContent = next;
            gsap.to(cntEl, { opacity:1, y:0, duration:.22, ease:'power2.out' });
          }
        });
      }

      // scene badge + canvas
      const scene = SCENE_NAMES[idx];
      if (scene) { setScene(scene); document.documentElement.dataset.scene = scene; }
      if (scLabel) {
        gsap.to(scLabel, {
          opacity:0, duration:.2, ease:'power1.in',
          onComplete: () => {
            scLabel.textContent = SCENE_LABELS[idx] || '';
            gsap.to(scLabel, { opacity:1, duration:.25, ease:'power1.out' });
          }
        });
      }

      // hide scroll hint after panel 0
      if (idx > 0 && hint) hint.classList.add('hidden');
    });
  }, { root: container, threshold: .52 });

  panels.forEach(p => obs.observe(p));
}

/* ═══════════════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('scroll-container');

  // Grain runs immediately (behind intro)
  initGrain();
  initFX();

  runIntro(() => {
    // Everything boots AFTER intro clears
    initCursor();
    initMagnetic();
    initCards();
    initReveals(container);
    initNav(container);

    // Trigger hero reveals immediately
    document.querySelectorAll('#panel-0 .g-reveal').forEach(el => {
      const delay = parseInt(el.dataset.delay||'0',10)/1000;
      gsap.fromTo(el,
        { y:24, scale:.94, opacity:0 },
        { y:0, scale:1, opacity:1, duration:.8, delay, ease:'power3.out', clearProps:'transform' }
      );
    });

    // Scramble name
    const nameEl = document.querySelector('.name-scramble');
    if (nameEl) {
      nameEl.style.opacity = '0';
      setTimeout(() => scramble(nameEl, () => scheduleGlitch(nameEl)), 300);
    }

    // Typewriter
    const twEl = document.querySelector('.typewriter-target');
    if (twEl) typewrite(twEl);

    // Freeze name cursor
    const nameCursor = document.querySelector('.name-cursor');
    if (nameCursor) setTimeout(() => {
      nameCursor.style.animation = 'none';
      nameCursor.style.opacity   = '1';
    }, 4800);

    // GSAP scanline after intro
    const scanline = document.querySelector('.scanline');
    if (scanline) {
      gsap.fromTo(scanline,
        { top: '0%', opacity: 0 },
        { top: '100%', opacity: .7, duration: 2.2, ease: 'none',
          onComplete: () => gsap.set(scanline, { opacity:0 }) }
      );
    }
  });
});
