const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// A lightweight canvas current turns the hero into a living water field.
const canvas = $('#flow-canvas');
const context = canvas.getContext('2d');
const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let particles = [];
let canvasWidth = 0;
let canvasHeight = 0;
let pointer = { x: -999, y: -999 };

function makeParticle() {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: Math.random() * 2.2 + 0.5,
    speed: Math.random() * 0.34 + 0.12,
    drift: Math.random() * Math.PI * 2,
    alpha: Math.random() * 0.48 + 0.12,
  };
}
function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = canvas.clientWidth;
  canvasHeight = canvas.clientHeight;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: Math.min(100, Math.floor(canvasWidth / 13)) }, makeParticle);
}
function drawWater(time) {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  particles.forEach((particle) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(time * 0.0007 + particle.drift) * 0.18;
    if (particle.y < -8) Object.assign(particle, makeParticle(), { y: canvasHeight + 8 });
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const near = Math.hypot(dx, dy) < 115;
    if (near) {
      particle.x += dx * 0.014;
      particle.y += dy * 0.014;
    }
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = `rgba(182, 255, 239, ${particle.alpha})`;
    context.fill();
  });
  if (motionAllowed) requestAnimationFrame(drawWater);
}
resizeCanvas();
if (motionAllowed) requestAnimationFrame(drawWater); else drawWater(0);
window.addEventListener('resize', resizeCanvas);

// Quietly reveal content as it earns its place in the viewport.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

// The cards in the dark section are synchronized to the reader's scroll position.
const steps = $$('.step-card');
const workflow = $('.workflow');
const progressSteps = $$('.progress-steps span');
function updateWorkflow() {
  const rect = workflow.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, -rect.top / (workflow.offsetHeight - window.innerHeight)));
  const index = Math.min(2, Math.floor(progress * 3.1));
  steps.forEach((card, cardIndex) => card.classList.toggle('in-view', cardIndex === index));
  progressSteps.forEach((step, stepIndex) => step.classList.toggle('active', stepIndex <= index));
}

// A minimal parallax field makes the first screen respond to the user's movement.
const glow = $('.cursor-glow');
const device = $('.water-device');
window.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
  if (window.matchMedia('(min-width: 801px)').matches) {
    const x = (event.clientX / window.innerWidth - 0.5) * 8;
    const y = (event.clientY / window.innerHeight - 0.5) * 5;
    device.style.transform = `rotate(-6deg) translate(${x}px, ${y}px)`;
  }
});

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  window.requestAnimationFrame(() => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    $('.scroll-progress span').style.width = `${(window.scrollY / total) * 100}%`;
    const heroShift = Math.min(window.scrollY / window.innerHeight, 1);
    device.style.opacity = `${1 - heroShift * 0.5}`;
    updateWorkflow();
    ticking = false;
  });
  ticking = true;
}, { passive: true });
updateWorkflow();

// A visual-only ambient setting adds a soft, calmer colour temperature.
const soundToggle = $('.sound-toggle');
soundToggle.addEventListener('click', () => {
  const enabled = soundToggle.getAttribute('aria-pressed') === 'true';
  soundToggle.setAttribute('aria-pressed', String(!enabled));
  soundToggle.innerHTML = enabled
    ? '<span class="sound-icon">◌</span> Ambient mode'
    : '<span class="sound-icon">◉</span> Ambient active';
  document.body.classList.toggle('ambient-active', !enabled);
});

// Small magnetic affordance for primary actions, skipped for touch and reduced-motion users.
if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  $$('.magnetic').forEach((button) => {
    button.addEventListener('mousemove', (event) => {
      const box = button.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.12;
      const y = (event.clientY - box.top - box.height / 2) * 0.2;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });
    button.addEventListener('mouseleave', () => { button.style.transform = ''; });
  });
}
