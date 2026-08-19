// ---------------------------------------------------------------
// Footer year
// ---------------------------------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------
const revealTargets = document.querySelectorAll(
  '.about__grid, .paper-card, .project-card, .skills__group, .contact'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealTargets.forEach(el => io.observe(el));

// ---------------------------------------------------------------
// Hero canvas — flow-matching vector field
// Same idea as the streamplot used to visualise FlowMotion's ODE:
// a uniform stream + a sink produce a potential-flow field. Static
// blue streamlines are traced once; particles ("samples") drift
// along the live field from a simple distribution on the left and
// settle into a cloud around the target point, then recycle —
// visualising an ODE transporting noise toward a learned distribution.
// ---------------------------------------------------------------
(function initFlowCanvas() {
  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- domain (matches the bounds used in the training viz: x:[-6,3], y:[-3,3]) ----
  const DX0 = -6, DX1 = 3, DY0 = -3, DY1 = 3;
  const SINK = { x: -2.4, y: 0 };   // where samples converge — the "target" mode
  const U = 1.0;                     // uniform stream strength
  const Q = 24;                      // sink strength

  const BLUE = '#3D63FF';
  const BLUE_SOFT = 'rgba(61,99,255,0.55)';
  const PARTICLE = '#EDEAE1';
  const TARGET = '#E3A73A';

  let W, H, dpr, streamLayer;

  function domainToPx(x, y) {
    return [
      ((x - DX0) / (DX1 - DX0)) * W,
      ((y - DY0) / (DY1 - DY0)) * H,
    ];
  }

  // velocity field: uniform stream + sink (classic potential-flow pair)
  function field(x, y) {
    const dx = x - SINK.x, dy = y - SINK.y;
    const r2 = Math.max(dx * dx + dy * dy, 0.02);
    const vx = U - (Q * dx) / (2 * Math.PI * r2);
    const vy = -(Q * dy) / (2 * Math.PI * r2);
    return [vx, vy];
  }

  function rk4Step(x, y, dt) {
    const [k1x, k1y] = field(x, y);
    const [k2x, k2y] = field(x + (dt / 2) * k1x, y + (dt / 2) * k1y);
    const [k3x, k3y] = field(x + (dt / 2) * k2x, y + (dt / 2) * k2y);
    const [k4x, k4y] = field(x + dt * k3x, y + dt * k3y);
    return [
      x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
      y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
    ];
  }

  function traceStreamline(x0, y0) {
    const pts = [[x0, y0]];
    let x = x0, y = y0;
    const dt = 0.045;
    for (let i = 0; i < 380; i++) {
      const dx = x - SINK.x, dy = y - SINK.y;
      if (dx * dx + dy * dy < 0.02) break; // absorbed by sink
      [x, y] = rk4Step(x, y, dt);
      if (x < DX0 - 0.5 || x > DX1 + 0.5 || y < DY0 - 0.5 || y > DY1 + 0.5) break;
      pts.push([x, y]);
    }
    return pts;
  }

  function buildStreamlines() {
    const seeds = [];
    const xs = [-6, -4.6, -3.2, -1.8, -0.4, 1.0, 2.2];
    const ys = [-2.7, -2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1, 2.7];
    xs.forEach((sx) => ys.forEach((sy) => seeds.push([sx, sy])));
    return seeds
      .map(([sx, sy]) => traceStreamline(sx, sy))
      .filter((pts) => pts.length > 8);
  }

  let streamlines = [];

  function renderStreamLayer() {
    streamLayer = document.createElement('canvas');
    streamLayer.width = canvas.width;
    streamLayer.height = canvas.height;
    const sctx = streamLayer.getContext('2d');
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.lineJoin = 'round';
    sctx.lineCap = 'round';

    streamlines.forEach((pts) => {
      sctx.beginPath();
      pts.forEach(([x, y], i) => {
        const [px, py] = domainToPx(x, y);
        if (i === 0) sctx.moveTo(px, py);
        else sctx.lineTo(px, py);
      });
      sctx.strokeStyle = BLUE_SOFT;
      sctx.lineWidth = 1.1;
      sctx.stroke();

      // arrowheads at a couple of points along the path
      [0.35, 0.72].forEach((frac) => {
        const idx = Math.floor(pts.length * frac);
        if (idx < 1 || idx >= pts.length) return;
        const [x0, y0] = pts[idx - 1];
        const [x1, y1] = pts[idx];
        const [px, py] = domainToPx(x1, y1);
        const ang = Math.atan2(
          domainToPx(x1, y1)[1] - domainToPx(x0, y0)[1],
          domainToPx(x1, y1)[0] - domainToPx(x0, y0)[0]
        );
        const s = 3.2;
        sctx.beginPath();
        sctx.moveTo(px + Math.cos(ang) * s * 1.8, py + Math.sin(ang) * s * 1.8);
        sctx.lineTo(px + Math.cos(ang + 2.5) * s, py + Math.sin(ang + 2.5) * s);
        sctx.lineTo(px + Math.cos(ang - 2.5) * s, py + Math.sin(ang - 2.5) * s);
        sctx.closePath();
        sctx.fillStyle = BLUE;
        sctx.fill();
      });
    });

    // target marker
    const [tx, ty] = domainToPx(SINK.x, SINK.y);
    sctx.beginPath();
    sctx.arc(tx, ty, 18, 0, Math.PI * 2);
    sctx.strokeStyle = 'rgba(227,167,58,0.3)';
    sctx.lineWidth = 1;
    sctx.stroke();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    streamlines = buildStreamlines();
    renderStreamLayer();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- particles: samples advected by the same field, settling at the sink ----
  const N = 130;
  let particles = [];

  function spawnParticle() {
    return {
      x: DX0,
      y: (Math.random() - 0.5) * 3.0,
      settled: false,
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 0.32,
      jitterPhase: Math.random() * Math.PI * 2,
      jitterSpeed: 0.6 + Math.random() * 0.6,
      dwell: 0,
      dwellLimit: 420 + Math.random() * 480,
      alpha: 0,
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < N; i++) {
      const p = spawnParticle();
      p.x = DX0 + Math.random() * (SINK.x - DX0); // stagger initial positions along the way
      p.alpha = 1;
      particles.push(p);
    }
  }
  initParticles();

  function stepParticle(p) {
    if (p.alpha < 1 && !p.settled) p.alpha = Math.min(1, p.alpha + 0.03);

    if (!p.settled) {
      const dx = p.x - SINK.x, dy = p.y - SINK.y;
      const r2 = dx * dx + dy * dy;
      if (r2 < 0.14) {
        p.settled = true;
      } else {
        const [vx, vy] = field(p.x, p.y);
        const speed = Math.min(Math.hypot(vx, vy), 3.2);
        const ang = Math.atan2(vy, vx);
        const dt = 0.028;
        p.x += Math.cos(ang) * speed * dt;
        p.y += Math.sin(ang) * speed * dt;
      }
    } else {
      p.jitterPhase += 0.02 * p.jitterSpeed;
      p.dwell += 1;
      if (p.dwell > p.dwellLimit) {
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          const fresh = spawnParticle();
          Object.assign(p, fresh);
        }
      }
    }
  }

  function particlePixelPos(p) {
    if (p.settled) {
      const jx = SINK.x + Math.cos(p.angle + p.jitterPhase * 0.15) * p.radius;
      const jy = SINK.y + Math.sin(p.angle + p.jitterPhase * 0.15) * p.radius;
      return domainToPx(jx, jy);
    }
    return domainToPx(p.x, p.y);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    if (streamLayer) ctx.drawImage(streamLayer, 0, 0, W, H);

    particles.forEach((p) => {
      const [px, py] = particlePixelPos(p);
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = PARTICLE;
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    const [tx, ty] = domainToPx(SINK.x, SINK.y);
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = TARGET;
    ctx.fill();
  }

  function frame() {
    particles.forEach(stepParticle);
    drawFrame();
    if (!prefersReducedMotion) requestAnimationFrame(frame);
  }

  if (prefersReducedMotion) {
    particles.forEach((p) => { p.settled = true; p.alpha = 1; });
    drawFrame();
  } else {
    requestAnimationFrame(frame);
  }
})();
