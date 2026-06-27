const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");

const redCountElement = document.querySelector("#redCount");
const blueCountElement = document.querySelector("#blueCount");
const redHealthElement = document.querySelector("#redHealth");
const blueHealthElement = document.querySelector("#blueHealth");
const roundStatusElement = document.querySelector("#roundStatus");
const timerElement = document.querySelector("#timer");
const winnerBanner = document.querySelector("#winnerBanner");
const winnerText = document.querySelector("#winnerText");
const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const playAgainButton = document.querySelector("#playAgainButton");
const ballCountInput = document.querySelector("#ballCountInput");
const ballCountValue = document.querySelector("#ballCountValue");
const speedInput = document.querySelector("#speedInput");
const speedValue = document.querySelector("#speedValue");

const teamConfig = {
  red: {
    color: "#ff3b4d",
    glow: "rgba(255, 59, 77, 0.42)",
    label: "RED",
  },
  blue: {
    color: "#2f7dff",
    glow: "rgba(47, 125, 255, 0.42)",
    label: "BLUE",
  },
};

const state = {
  balls: [],
  particles: [],
  running: false,
  startedAt: 0,
  elapsedBeforePause: 0,
  lastFrameTime: 0,
  winner: null,
  arena: {
    x: 450,
    y: 450,
    radius: 330,
    pulse: 0,
  },
};

const maxHealth = 100;
const damagePerHit = 14;
const hitCooldown = 0.38;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function resizeCanvas() {
  const size = 900;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.arena = {
    x: size / 2,
    y: size / 2,
    radius: size * 0.37,
    pulse: state.arena.pulse,
  };
}

function createBall(team, index, total) {
  const angle = (Math.PI * 2 * index) / total + (team === "red" ? 0 : Math.PI);
  const spread = randomBetween(90, 250);
  const x = state.arena.x + Math.cos(angle) * spread;
  const y = state.arena.y + Math.sin(angle) * spread;
  const direction = normalizeVector(
    state.arena.x - x + randomBetween(-140, 140),
    state.arena.y - y + randomBetween(-140, 140),
  );
  const baseSpeed = randomBetween(145, 205);

  return {
    id: `${team}-${index}-${Date.now()}`,
    team,
    x,
    y,
    vx: direction.x * baseSpeed,
    vy: direction.y * baseSpeed,
    radius: randomBetween(15, 19),
    health: maxHealth,
    hitTimer: randomBetween(0, hitCooldown),
    alive: true,
    targetId: null,
    trail: [],
  };
}

function resetGame() {
  const ballCount = Number(ballCountInput.value);
  state.balls = [];
  state.particles = [];
  state.running = false;
  state.startedAt = 0;
  state.elapsedBeforePause = 0;
  state.lastFrameTime = 0;
  state.winner = null;

  for (let index = 0; index < ballCount; index += 1) {
    state.balls.push(createBall("red", index, ballCount));
    state.balls.push(createBall("blue", index, ballCount));
  }

  startButton.textContent = "開始";
  roundStatusElement.textContent = "LAST BALL STANDING";
  winnerBanner.classList.add("hidden");
  updateHud();
  drawGame();
}

function toggleGame() {
  if (state.winner) {
    resetGame();
  }

  state.running = !state.running;
  startButton.textContent = state.running ? "暫停" : "繼續";

  if (state.running) {
    state.startedAt = performance.now() - state.elapsedBeforePause;
    state.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  } else {
    state.elapsedBeforePause = performance.now() - state.startedAt;
  }
}

function updateHud() {
  const redBalls = state.balls.filter((ball) => ball.alive && ball.team === "red");
  const blueBalls = state.balls.filter((ball) => ball.alive && ball.team === "blue");
  const redHealth = redBalls.reduce((total, ball) => total + ball.health, 0);
  const blueHealth = blueBalls.reduce((total, ball) => total + ball.health, 0);
  const maxTeamHealth = Number(ballCountInput.value) * maxHealth;

  redCountElement.textContent = redBalls.length;
  blueCountElement.textContent = blueBalls.length;
  redHealthElement.style.width = `${Math.max(0, (redHealth / maxTeamHealth) * 100)}%`;
  blueHealthElement.style.width = `${Math.max(0, (blueHealth / maxTeamHealth) * 100)}%`;

  if (state.startedAt) {
    const elapsedMs = state.running
      ? performance.now() - state.startedAt
      : state.elapsedBeforePause;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    timerElement.textContent = `${minutes}:${seconds}`;
  } else {
    timerElement.textContent = "00:00";
  }
}

function findClosestEnemy(ball) {
  let closest = null;
  let closestDistance = Infinity;

  for (const otherBall of state.balls) {
    if (!otherBall.alive || otherBall.team === ball.team) {
      continue;
    }

    const distance = distanceBetween(ball, otherBall);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = otherBall;
    }
  }

  return closest;
}

function steerTowardTargets(deltaSeconds) {
  const speedModifier = Number(speedInput.value) / 100;

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const target = findClosestEnemy(ball);
    ball.targetId = target?.id ?? null;

    if (target) {
      const direction = normalizeVector(target.x - ball.x, target.y - ball.y);
      const chasePower = 86 * speedModifier;
      ball.vx += direction.x * chasePower * deltaSeconds;
      ball.vy += direction.y * chasePower * deltaSeconds;
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    const maxSpeed = 245 * speedModifier;
    const minSpeed = 105 * speedModifier;

    if (speed > maxSpeed) {
      ball.vx = (ball.vx / speed) * maxSpeed;
      ball.vy = (ball.vy / speed) * maxSpeed;
    } else if (speed < minSpeed) {
      const direction = normalizeVector(ball.vx, ball.vy);
      ball.vx = direction.x * minSpeed;
      ball.vy = direction.y * minSpeed;
    }
  }
}

function moveBalls(deltaSeconds) {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    ball.hitTimer = Math.max(0, ball.hitTimer - deltaSeconds);
    ball.x += ball.vx * deltaSeconds;
    ball.y += ball.vy * deltaSeconds;
    ball.trail.push({ x: ball.x, y: ball.y });

    if (ball.trail.length > 12) {
      ball.trail.shift();
    }

    const fromCenter = normalizeVector(ball.x - state.arena.x, ball.y - state.arena.y);
    const distanceFromCenter = distanceBetween(ball, state.arena);
    const limit = state.arena.radius - ball.radius;

    if (distanceFromCenter > limit) {
      ball.x = state.arena.x + fromCenter.x * limit;
      ball.y = state.arena.y + fromCenter.y * limit;

      const dot = ball.vx * fromCenter.x + ball.vy * fromCenter.y;
      ball.vx -= 2 * dot * fromCenter.x;
      ball.vy -= 2 * dot * fromCenter.y;
      ball.vx *= 0.96;
      ball.vy *= 0.96;
      createImpact(ball.x, ball.y, "#ffffff", 4);
    }
  }
}

function resolveCollisions() {
  for (let firstIndex = 0; firstIndex < state.balls.length; firstIndex += 1) {
    const firstBall = state.balls[firstIndex];
    if (!firstBall.alive) {
      continue;
    }

    for (let secondIndex = firstIndex + 1; secondIndex < state.balls.length; secondIndex += 1) {
      const secondBall = state.balls[secondIndex];
      if (!secondBall.alive) {
        continue;
      }

      const dx = secondBall.x - firstBall.x;
      const dy = secondBall.y - firstBall.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minDistance = firstBall.radius + secondBall.radius;

      if (distance >= minDistance) {
        continue;
      }

      const normalX = dx / distance;
      const normalY = dy / distance;
      const overlap = minDistance - distance;
      firstBall.x -= normalX * overlap * 0.5;
      firstBall.y -= normalY * overlap * 0.5;
      secondBall.x += normalX * overlap * 0.5;
      secondBall.y += normalY * overlap * 0.5;

      const relativeVelocityX = secondBall.vx - firstBall.vx;
      const relativeVelocityY = secondBall.vy - firstBall.vy;
      const impactSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY;

      if (impactSpeed < 0) {
        const impulse = impactSpeed * -0.92;
        firstBall.vx -= normalX * impulse;
        firstBall.vy -= normalY * impulse;
        secondBall.vx += normalX * impulse;
        secondBall.vy += normalY * impulse;
      }

      if (firstBall.team !== secondBall.team) {
        handleHit(firstBall, secondBall);
      }
    }
  }
}

function handleHit(firstBall, secondBall) {
  if (firstBall.hitTimer <= 0) {
    secondBall.health -= damagePerHit;
    firstBall.hitTimer = hitCooldown;
    createImpact(secondBall.x, secondBall.y, teamConfig[firstBall.team].color, 8);
  }

  if (secondBall.hitTimer <= 0) {
    firstBall.health -= damagePerHit;
    secondBall.hitTimer = hitCooldown;
    createImpact(firstBall.x, firstBall.y, teamConfig[secondBall.team].color, 8);
  }

  if (firstBall.health <= 0) {
    eliminateBall(firstBall);
  }

  if (secondBall.health <= 0) {
    eliminateBall(secondBall);
  }
}

function eliminateBall(ball) {
  if (!ball.alive) {
    return;
  }

  ball.alive = false;
  createImpact(ball.x, ball.y, teamConfig[ball.team].color, 24);
}

function createImpact(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(60, 220);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: randomBetween(0.24, 0.62),
      maxLife: 0.62,
      radius: randomBetween(2, 5),
    });
  }
}

function updateParticles(deltaSeconds) {
  for (const particle of state.particles) {
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life -= deltaSeconds;
  }

  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function checkWinner() {
  const redAlive = state.balls.some((ball) => ball.alive && ball.team === "red");
  const blueAlive = state.balls.some((ball) => ball.alive && ball.team === "blue");

  if (redAlive && blueAlive) {
    return;
  }

  state.running = false;
  state.elapsedBeforePause = performance.now() - state.startedAt;
  state.winner = redAlive ? "red" : "blue";
  startButton.textContent = "開始";
  roundStatusElement.textContent = `${teamConfig[state.winner].label} WINS`;
  winnerText.textContent = `${teamConfig[state.winner].label} WINS`;
  winnerBanner.classList.remove("hidden");
}

function drawArena() {
  context.clearRect(0, 0, 900, 900);
  context.save();
  context.translate(state.arena.x, state.arena.y);

  const pulseRadius = state.arena.radius + Math.sin(state.arena.pulse) * 4;
  context.beginPath();
  context.arc(0, 0, pulseRadius, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = 5;
  context.stroke();

  context.beginPath();
  context.arc(0, 0, pulseRadius + 45, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.12)";
  context.lineWidth = 18;
  context.stroke();

  context.beginPath();
  context.arc(0, 0, pulseRadius - 82, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 209, 102, 0.18)";
  context.setLineDash([12, 16]);
  context.lineWidth = 2;
  context.stroke();
  context.setLineDash([]);

  context.restore();
}

function drawTargetLines() {
  context.save();
  context.lineWidth = 1;

  for (const ball of state.balls) {
    if (!ball.alive || !ball.targetId) {
      continue;
    }

    const target = state.balls.find((candidate) => candidate.id === ball.targetId);
    if (!target || !target.alive) {
      continue;
    }

    context.beginPath();
    context.moveTo(ball.x, ball.y);
    context.lineTo(target.x, target.y);
    context.strokeStyle = ball.team === "red"
      ? "rgba(255, 59, 77, 0.16)"
      : "rgba(47, 125, 255, 0.16)";
    context.stroke();
  }

  context.restore();
}

function drawBalls() {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const config = teamConfig[ball.team];

    for (let index = 0; index < ball.trail.length; index += 1) {
      const point = ball.trail[index];
      const alpha = index / ball.trail.length;
      context.beginPath();
      context.arc(point.x, point.y, ball.radius * alpha * 0.8, 0, Math.PI * 2);
      context.fillStyle = ball.team === "red"
        ? `rgba(255, 59, 77, ${alpha * 0.18})`
        : `rgba(47, 125, 255, ${alpha * 0.18})`;
      context.fill();
    }

    context.save();
    context.shadowColor = config.glow;
    context.shadowBlur = 22;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = config.color;
    context.fill();
    context.restore();

    context.beginPath();
    context.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.28, ball.radius * 0.32, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.5)";
    context.fill();

    const healthWidth = ball.radius * 2.3;
    context.fillStyle = "rgba(0, 0, 0, 0.44)";
    context.fillRect(ball.x - healthWidth / 2, ball.y - ball.radius - 11, healthWidth, 4);
    context.fillStyle = ball.health > 34 ? "#3ddc97" : "#ffd166";
    context.fillRect(
      ball.x - healthWidth / 2,
      ball.y - ball.radius - 11,
      healthWidth * Math.max(0, ball.health / maxHealth),
      4,
    );
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius * alpha, 0, Math.PI * 2);
    context.fillStyle = particle.color;
    context.globalAlpha = alpha;
    context.fill();
    context.globalAlpha = 1;
  }
}

function drawGame() {
  drawArena();
  drawTargetLines();
  drawParticles();
  drawBalls();
}

function gameLoop(timestamp) {
  if (!state.running) {
    return;
  }

  const deltaSeconds = Math.min((timestamp - state.lastFrameTime) / 1000, 0.033);
  state.lastFrameTime = timestamp;
  state.arena.pulse += deltaSeconds * 3;

  steerTowardTargets(deltaSeconds);
  moveBalls(deltaSeconds);
  resolveCollisions();
  updateParticles(deltaSeconds);
  checkWinner();
  updateHud();
  drawGame();

  if (state.running) {
    requestAnimationFrame(gameLoop);
  }
}

startButton.addEventListener("click", toggleGame);
resetButton.addEventListener("click", resetGame);
playAgainButton.addEventListener("click", () => {
  resetGame();
  toggleGame();
});

ballCountInput.addEventListener("input", () => {
  ballCountValue.textContent = ballCountInput.value;
  resetGame();
});

speedInput.addEventListener("input", () => {
  speedValue.textContent = `${speedInput.value}%`;
});

window.addEventListener("resize", () => {
  resizeCanvas();
  drawGame();
});

resizeCanvas();
resetGame();
