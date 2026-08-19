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
// Hero canvas — "jitter vs target-predictive flow"
// Two particles travel toward a shared target on the right.
// The jitter particle takes a noisy, erratic random-walk path.
// The flow particle takes the smooth, direct path FlowMotion
// models: a slightly curved but stable trajectory toward the target.
// ---------------------------------------------------------------
(function initFlowCanvas() {
  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = {
    jitter: '#7A5A63',
    flow: '#46C2B9',
    target: '#E3A73A',
    trailJitter: 'rgba(122,90,99,0.35)',
    trailFlow: 'rgba(70,194,185,0.45)',
  };

  const NUM_TRIALS = 3; // number of simultaneous runs, staggered
  let trials = [];

  function target() {
    return { x: W * 0.86, y: H * 0.5 };
  }
  function start() {
    return { x: W * 0.08, y: H * (0.3 + Math.random() * 0.4) };
  }

  function makeTrial(delay) {
    const s = start();
    return {
      delay,
      t: -delay,
      jitterPos: { ...s },
      flowPos: { ...s },
      jitterTrail: [],
      flowTrail: [],
      seed: Math.random() * 1000,
    };
  }

  function resetTrials() {
    trials = [];
    for (let i = 0; i < NUM_TRIALS; i++) {
      trials.push(makeTrial(i * 90));
    }
  }
  resetTrials();

  const DURATION = 260; // frames to reach target

  function step(trial) {
    trial.t += 1;
    if (trial.t < 0) return;
    if (trial.t > DURATION + 40) {
      const s = start();
      trial.t = -Math.random() * 60;
      trial.jitterPos = { ...s };
      trial.flowPos = { ...s };
      trial.jitterTrail = [];
      trial.flowTrail = [];
      trial.seed = Math.random() * 1000;
      return;
    }
    const tgt = target();
    const s = trial.jitterTrail[0] || trial.jitterPos;
    const progress = Math.min(trial.t / DURATION, 1);
    const ease = progress; // linear base for jitter, noise added

    // Jittery path: linear interpolation + noise that shrinks near the end
    const noiseAmp = (1 - progress) * 26 + 4;
    const nx = (Math.sin(trial.t * 0.7 + trial.seed) + Math.sin(trial.t * 0.31 + trial.seed * 2)) * 0.5;
    const ny = (Math.cos(trial.t * 0.53 + trial.seed) + Math.sin(trial.t * 0.19 + trial.seed * 3)) * 0.5;
    trial.jitterPos = {
      x: s.x + (tgt.x - s.x) * ease + nx * noiseAmp,
      y: s.y + (tgt.y - s.y) * ease + ny * noiseAmp,
    };

    // FlowMotion-style path: smooth eased curve directly toward target
    const smoothT = 1 - Math.pow(1 - progress, 3); // ease-out cubic — stable, direct
    const bow = Math.sin(progress * Math.PI) * 14; // gentle single arc, no oscillation
    trial.flowPos = {
      x: s.x + (tgt.x - s.x) * smoothT,
      y: s.y + (tgt.y - s.y) * smoothT - bow,
    };

    trial.jitterTrail.push({ ...trial.jitterPos });
    trial.flowTrail.push({ ...trial.flowPos });
    if (trial.jitterTrail.length > 46) trial.jitterTrail.shift();
    if (trial.flowTrail.length > 46) trial.flowTrail.shift();
  }

  function drawTrail(trail, color) {
    if (trail.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function drawDot(pos, color, r) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    // target marker
    const tgt = target();
    ctx.beginPath();
    ctx.arc(tgt.x, tgt.y, 16, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(227,167,58,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawDot(tgt, COLORS.target, 4);

    trials.forEach((trial) => {
      step(trial);
      if (trial.t < 0) return;
      drawTrail(trial.jitterTrail, COLORS.trailJitter);
      drawTrail(trial.flowTrail, COLORS.trailFlow);
      drawDot(trial.jitterPos, COLORS.jitter, 3.2);
      drawDot(trial.flowPos, COLORS.flow, 3.2);
    });

    if (!prefersReducedMotion) requestAnimationFrame(frame);
  }

  if (prefersReducedMotion) {
    // Draw a single static frame illustrating the concept
    for (let i = 0; i < DURATION; i++) trials.forEach(step);
    frame();
  } else {
    requestAnimationFrame(frame);
  }
})();
