const messages = [
  "Hân ơi, trái tim này được vẽ bằng rất nhiều yêu thương.",
  "Chúc Hân luôn rạng rỡ, dịu dàng và hạnh phúc mỗi ngày.",
  "Cảm ơn Hân vì đã làm mọi thứ trở nên thật đặc biệt."
];

const typingTarget = document.getElementById("typingText");
const heartStage = document.getElementById("heartStage");
const heartCanvas = document.getElementById("heartGiftCanvas");
const giftBox = document.getElementById("giftBox");
const magicBtn = document.getElementById("magicBtn");
const pulseText = document.getElementById("pulseText");
const romanticTrack = document.getElementById("romanticTrack");
const finalCard = document.getElementById("finalCard");

let messageIndex = 0;
let charIndex = 0;
let giftOpened = false;
let heartStarted = false;

function runTyping() {
  const current = messages[messageIndex];

  if (charIndex <= current.length) {
    typingTarget.textContent = current.slice(0, charIndex);
    charIndex += 1;
    setTimeout(runTyping, 34);
    return;
  }

  setTimeout(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    charIndex = 0;
    typingTarget.textContent = "";
    runTyping();
  }, 1300);
}

function revealHeartAfterGift() {
  heartStage.classList.remove("heart-hidden");
  heartStage.classList.add("heart-visible");
  finalCard.classList.remove("final-card-hidden");
  finalCard.classList.add("final-card-visible");
  pulseText.textContent = "Trái tim đã xuất hiện. Nhấn lại để trái tim bùng sáng!";
  magicBtn.textContent = "Gửi thêm yêu thương.";

  if (!heartStarted) {
    startHeartAnimation(heartCanvas);
    heartStarted = true;
  }
}

function createWebAudioRomanticMusic() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const chords = [
    [261.63, 329.63, 392.0, 523.25],
    [220.0, 261.63, 329.63, 392.0],
    [196.0, 246.94, 329.63, 392.0],
    [174.61, 220.0, 293.66, 349.23]
  ];

  let step = 0;
  let timerId = null;
  let running = false;

  function scheduleNote(frequency, startTime, duration, volume, type) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.06);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(master);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  }

  function tick() {
    if (!running) {
      return;
    }

    const now = context.currentTime + 0.02;
    const chord = chords[step % chords.length];
    const bass = chord[0] / 2;

    scheduleNote(bass, now, 1.2, 0.12, "sine");
    scheduleNote(chord[0], now + 0.0, 0.9, 0.05, "triangle");
    scheduleNote(chord[1], now + 0.28, 0.9, 0.05, "triangle");
    scheduleNote(chord[2], now + 0.56, 0.9, 0.05, "triangle");
    scheduleNote(chord[3], now + 0.84, 1.1, 0.04, "sine");

    step += 1;
    timerId = setTimeout(tick, 1150);
  }

  return {
    async start() {
      if (running) {
        return;
      }

      await context.resume();
      running = true;
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.2, now + 0.8);
      tick();
    },

    isPlaying() {
      return running;
    }
  };
}

function createRomanticMusicPlayer(trackElement) {
  let fallback = null;
  let preferFallback = !trackElement;
  const sourceList = ["solarflex-romantic-495654.mp3", "assets/audio/romantic.mp3"];
  let sourceIndex = 0;

  if (trackElement) {
    trackElement.volume = 0.9;
    trackElement.muted = false;
    trackElement.playsInline = true;
    trackElement.addEventListener("error", () => {
      sourceIndex += 1;

      if (sourceIndex < sourceList.length) {
        trackElement.src = sourceList[sourceIndex];
        trackElement.load();
        return;
      }

      preferFallback = true;
    });

    if (!trackElement.getAttribute("src")) {
      trackElement.src = sourceList[0];
    }
  }

  return {
    async start() {
      if (!preferFallback && trackElement) {
        try {
          trackElement.muted = false;
          trackElement.volume = 0.9;
          await trackElement.play();
          return true;
        } catch (error) {
          // Browser can block autoplay.
        }
      }

      try {
        if (!fallback) {
          fallback = createWebAudioRomanticMusic();
        }
        await fallback.start();
        return true;
      } catch (error) {
        return false;
      }
    },

    isPlaying() {
      const trackPlaying = Boolean(trackElement) && !trackElement.paused;
      const fallbackPlaying = Boolean(fallback) && fallback.isPlaying();
      return trackPlaying || fallbackPlaying;
    }
  };
}

const romanticMusic = createRomanticMusicPlayer(romanticTrack);

async function ensureMusicPlaying() {
  const started = await romanticMusic.start();

  if (started) {
    pulseText.textContent = giftOpened
      ? "Nhạc đã phát, trái tim đang tỏa sáng!"
      : "Nhạc đã phát. Nhấn nút để mở hộp quà nhé!";
    return;
  }

  pulseText.textContent = "Trình duyệt đang chặn âm thanh, hãy nhấn nút để kích hoạt nhạc.";
}

magicBtn.addEventListener("click", async () => {
  await ensureMusicPlaying();

  if (!giftOpened) {
    giftOpened = true;
    giftBox.classList.add("opened");
    pulseText.textContent = "Bất ngờ sắp xuất hiện...";

    setTimeout(() => {
      revealHeartAfterGift();
      burstHearts();
    }, 920);
    return;
  }

  burstHearts();
  pulseText.textContent = "Trái tim đã được gửi đến Hân rồi đó!";
});

ensureMusicPlaying();

window.addEventListener(
  "pointerdown",
  () => {
    if (!romanticMusic.isPlaying()) {
      ensureMusicPlaying();
    }
  },
  { once: true }
);

const petalCanvas = document.getElementById("petalCanvas");
const petalCtx = petalCanvas.getContext("2d");

let width = 0;
let height = 0;

const petals = [];
const PETAL_COUNT = 44;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  petalCanvas.width = width;
  petalCanvas.height = height;
}

function createPetal(initial = false) {
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : -30,
    size: 8 + Math.random() * 10,
    speedY: 0.6 + Math.random() * 1.6,
    speedX: -0.7 + Math.random() * 1.4,
    wobble: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.06,
    angle: Math.random() * Math.PI * 2,
    colorShift: Math.random()
  };
}

function initPetals() {
  petals.length = 0;
  for (let i = 0; i < PETAL_COUNT; i += 1) {
    petals.push(createPetal(true));
  }
}

function drawPetal(p) {
  petalCtx.save();
  petalCtx.translate(p.x, p.y);
  petalCtx.rotate(p.angle);

  const gradient = petalCtx.createRadialGradient(-p.size * 0.2, -p.size * 0.3, 1, 0, 0, p.size * 1.35);
  gradient.addColorStop(0, `rgba(255, ${190 + Math.floor(30 * p.colorShift)}, 220, 0.95)`);
  gradient.addColorStop(1, "rgba(237, 88, 158, 0.85)");

  petalCtx.fillStyle = gradient;
  petalCtx.beginPath();
  petalCtx.moveTo(0, -p.size);
  petalCtx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 1.1, p.size * 0.85, 0, p.size * 1.15);
  petalCtx.bezierCurveTo(-p.size * 1.1, p.size * 0.85, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
  petalCtx.fill();

  petalCtx.restore();
}

function animatePetals() {
  petalCtx.clearRect(0, 0, width, height);

  for (let i = 0; i < petals.length; i += 1) {
    const p = petals[i];

    p.wobble += 0.03;
    p.x += p.speedX + Math.cos(p.wobble) * 0.4;
    p.y += p.speedY;
    p.angle += p.spin;

    if (p.y > height + 30 || p.x < -40 || p.x > width + 40) {
      petals[i] = createPetal(false);
      continue;
    }

    drawPetal(p);
  }

  requestAnimationFrame(animatePetals);
}

function burstHearts() {
  for (let i = 0; i < 10; i += 1) {
    const heart = document.createElement("span");
    heart.textContent = "❤";
    heart.className = "burst-heart";
    heart.style.left = `${45 + Math.random() * 10}%`;
    heart.style.top = `${48 + Math.random() * 8}%`;
    heart.style.fontSize = `${16 + Math.random() * 24}px`;
    heart.style.animationDuration = `${0.95 + Math.random() * 0.7}s`;
    heart.style.setProperty("--driftX", `${-70 + Math.random() * 140}px`);
    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1700);
  }
}

// 3D heart point-cloud renderer.
function startHeartAnimation(canvas) {
  const context = canvas.getContext("2d");
  const points = [];
  let pointCountScale = 1;

  function baseHeart(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y };
  }

  function buildPointCloud() {
    points.length = 0;
    const layers = Math.max(10, Math.floor(14 * pointCountScale));
    const samples = Math.max(90, Math.floor(130 * pointCountScale));

    for (let layer = 0; layer < layers; layer += 1) {
      const z = (layer / (layers - 1) - 0.5) * 170;
      const spread = 1 - Math.abs(z) / 115;
      const scale = Math.max(0.28, spread);

      for (let i = 0; i < samples; i += 1) {
        const t = (Math.PI * 2 * i) / samples;
        const p = baseHeart(t);

        points.push({
          x: p.x * 19 * scale,
          y: -p.y * 19 * scale,
          z,
          size: 2.2 + Math.random() * 2.4,
          alpha: 0.35 + Math.random() * 0.5,
          tilt: Math.random() * Math.PI * 2,
          shade: 145 + Math.floor(Math.random() * 45)
        });
      }
    }
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    const area = canvas.width * canvas.height;
    // Adapt detail to screen size to avoid heavy rendering on weaker devices.
    pointCountScale = Math.max(0.74, Math.min(1.08, area / 560000));
    buildPointCloud();
  }

  const rotation = {
    x: 0,
    y: 0,
    z: 0
  };

  function project(point, angles, pulse) {
    const cosY = Math.cos(angles.y);
    const sinY = Math.sin(angles.y);
    let x = point.x * pulse * cosY - point.z * sinY;
    let z = point.x * pulse * sinY + point.z * cosY;

    const cosX = Math.cos(angles.x);
    const sinX = Math.sin(angles.x);
    let y = point.y * cosX - z * sinX;
    z = point.y * sinX + z * cosX;

    const cosZ = Math.cos(angles.z);
    const sinZ = Math.sin(angles.z);
    const xr = x * cosZ - y * sinZ;
    const yr = x * sinZ + y * cosZ;

    const depth = 470;
    const scale = depth / (depth + z + 220);

    return {
      x: xr * scale + canvas.width / 2,
      y: yr * scale + canvas.height / 2,
      size: point.size * scale,
      alpha: point.alpha * (0.6 + scale * 0.95),
      depth: z,
      tilt: point.tilt + angles.y * 0.6 + angles.z,
      shade: point.shade
    };
  }

  function drawPetal(px, py, size, alpha, tilt, shade) {
    context.save();
    context.translate(px, py);
    context.rotate(tilt);
    context.scale(1.12, 0.86);

    const grad = context.createRadialGradient(-size * 0.3, -size * 0.38, 0.2, 0, 0, size * 1.45);
    grad.addColorStop(0, `rgba(255, ${shade}, ${shade - 12}, ${Math.min(1, alpha + 0.2)})`);
    grad.addColorStop(0.45, `rgba(240, 42, 76, ${Math.min(0.95, alpha + 0.08)})`);
    grad.addColorStop(1, `rgba(176, 7, 34, ${Math.max(0.18, alpha)})`);

    context.fillStyle = grad;
    context.beginPath();
    context.moveTo(0, -size * 1.18);
    context.bezierCurveTo(size * 0.96, -size * 0.8, size * 1.18, size * 0.78, 0, size * 1.32);
    context.bezierCurveTo(-size * 1.18, size * 0.78, -size * 0.96, -size * 0.8, 0, -size * 1.18);
    context.fill();

    context.globalAlpha = Math.min(1, alpha * 0.42);
    context.fillStyle = "rgba(255, 212, 220, 0.9)";
    context.beginPath();
    context.ellipse(-size * 0.2, -size * 0.42, size * 0.26, size * 0.14, -0.35, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  let last = 0;
  let lastFrameTime = 0;
  function render(now) {
    requestAnimationFrame(render);

    // Cap heart renderer around ~42 FPS for smoother overall page performance.
    if (now - lastFrameTime < 24) {
      return;
    }
    lastFrameTime = now;

    const t = now * 0.001;
    if (now - last > 250) {
      resizeCanvas();
      last = now;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

  const targetX = Math.sin(t * 0.47) * 0.25 + Math.sin(t * 0.19 + 0.9) * 0.06;
  const targetY = Math.sin(t * 0.38) * 0.7 + Math.sin(t * 0.13 + 1.2) * 0.2;
  const targetZ = Math.sin(t * 0.32 + 0.35) * 0.12;

  // Inertia smoothing to avoid stiff rotation.
  rotation.x += (targetX - rotation.x) * 0.06;
  rotation.y += (targetY - rotation.y) * 0.06;
  rotation.z += (targetZ - rotation.z) * 0.06;

    const pulse = 1 + Math.sin(t * 2.2) * 0.034;

    for (let i = 0; i < points.length; i += 1) {
      const p = project(points[i], rotation, pulse);
      drawPetal(
        p.x,
        p.y,
        Math.max(0.9, p.size),
        Math.min(1, Math.max(0.08, p.alpha)),
        p.tilt,
        p.shade
      );
    }

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(render);
}

const burstStyle = document.createElement("style");
burstStyle.textContent = `
  .burst-heart {
    position: fixed;
    z-index: 5;
    color: #ff4f8f;
    pointer-events: none;
    text-shadow: 0 4px 12px rgba(255, 79, 143, 0.38);
    animation: flyHeart 1.2s ease-out forwards;
  }

  @keyframes flyHeart {
    0% {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% + (var(--driftX, 0px))), -220px) scale(1.22);
      opacity: 0;
    }
  }
`;
document.head.appendChild(burstStyle);

resizeCanvas();
initPetals();
animatePetals();
runTyping();
