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
const groupModeButton = document.querySelector("#groupModeButton");
const duelModeButton = document.querySelector("#duelModeButton");
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
  pickups: [],
  projectiles: [],
  particles: [],
  running: false,
  startedAt: 0,
  elapsedBeforePause: 0,
  lastFrameTime: 0,
  winner: null,
  battleMode: "group",
  nextPickupIn: 1.2,
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
const maxPickups = 7;
const pickupLifetime = 10;
const weaponReadyDelay = 1;
const speedBoostDuration = 4;
const speedBoostMultiplier = 1.45;

const audioState = {
  context: null,
  enabled: false,
  noiseBuffer: null,
};

const weaponConfig = {
  pistol: {
    label: "PISTOL",
    icon: "P",
    color: "#f7f7ff",
    damage: 16,
    range: 260,
    cooldown: 0.55,
    projectileSpeed: 520,
    ammo: 3,
    pellets: 1,
    spread: 0,
    accuracySpread: 0.28,
    recoil: 70,
  },
  shotgun: {
    label: "SHOTGUN",
    icon: "S",
    color: "#ff9f1c",
    damage: 10,
    range: 190,
    cooldown: 1.05,
    projectileSpeed: 430,
    ammo: 2,
    pellets: 5,
    spread: 0.44,
    accuracySpread: 0.12,
    recoil: 135,
  },
  sniper: {
    label: "SNIPER",
    icon: "N",
    color: "#7bdff2",
    damage: 54,
    range: 470,
    cooldown: 1.55,
    projectileSpeed: 760,
    ammo: 1,
    pellets: 1,
    spread: 0,
    accuracySpread: 0.015,
    recoil: 210,
  },
  machineGun: {
    label: "MACHINE GUN",
    icon: "M",
    color: "#c77dff",
    damage: 8,
    range: 280,
    cooldown: 0.12,
    projectileSpeed: 560,
    ammo: 5,
    pellets: 1,
    spread: 0,
    accuracySpread: 0.45,
    recoil: 45,
  },
};

const pickupConfig = {
  pistol: {
    label: "手槍",
    icon: "P",
    color: "#f7f7ff",
    weight: 3,
  },
  shotgun: {
    label: "散彈槍",
    icon: "S",
    color: "#ff9f1c",
    weight: 2,
  },
  sniper: {
    label: "狙擊槍",
    icon: "N",
    color: "#7bdff2",
    weight: 1,
  },
  machineGun: {
    label: "機關槍",
    icon: "M",
    color: "#c77dff",
    weight: 2,
  },
  gear: {
    label: "齒輪",
    icon: "G",
    color: "#3ddc97",
    weight: 2,
  },
  speedBoost: {
    label: "加速器",
    icon: "A",
    color: "#ffd166",
    weight: 2,
  },
};

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

function randomPointInArena(padding = 34) {
  const angle = randomBetween(0, Math.PI * 2);
  const radius = Math.sqrt(Math.random()) * (state.arena.radius - padding);

  return {
    x: state.arena.x + Math.cos(angle) * radius,
    y: state.arena.y + Math.sin(angle) * radius,
  };
}

function pickWeightedType(config) {
  const entries = Object.entries(config);
  const totalWeight = entries.reduce((total, [, item]) => total + item.weight, 0);
  let marker = randomBetween(0, totalWeight);

  for (const [type, item] of entries) {
    marker -= item.weight;
    if (marker <= 0) {
      return type;
    }
  }

  return entries[0][0];
}

function unlockAudio() {
  if (!audioState.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    audioState.context = new AudioContextClass();
  }

  if (audioState.context.state === "suspended") {
    audioState.context.resume();
  }

  audioState.enabled = true;
}

function playTone({ frequency, duration, type = "sine", volume = 0.05, slideTo = null }) {
  if (!audioState.enabled || !audioState.context) {
    return;
  }

  const audioContext = audioState.context;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function getNoiseBuffer() {
  const audioContext = audioState.context;

  if (!audioContext) {
    return null;
  }

  if (audioState.noiseBuffer) {
    return audioState.noiseBuffer;
  }

  const length = Math.floor(audioContext.sampleRate * 0.35);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    output[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }

  audioState.noiseBuffer = buffer;
  return buffer;
}

function playNoiseBurst({ duration, volume, filterFrequency, filterType = "bandpass" }) {
  if (!audioState.enabled || !audioState.context) {
    return;
  }

  const audioContext = audioState.context;
  const noiseBuffer = getNoiseBuffer();

  if (!noiseBuffer) {
    return;
  }

  const now = audioContext.currentTime;
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  source.buffer = noiseBuffer;
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, now);
  filter.Q.setValueAtTime(0.9, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start(now);
  source.stop(now + duration + 0.02);
}

function playGunshot(type) {
  const gunshotMap = {
    pistol: {
      crack: { duration: 0.085, volume: 0.16, filterFrequency: 1650 },
      boom: { frequency: 150, slideTo: 70, duration: 0.11, type: "triangle", volume: 0.08 },
    },
    shotgun: {
      crack: { duration: 0.15, volume: 0.22, filterFrequency: 980 },
      boom: { frequency: 95, slideTo: 42, duration: 0.2, type: "sawtooth", volume: 0.12 },
    },
    sniper: {
      crack: { duration: 0.105, volume: 0.2, filterFrequency: 2200 },
      boom: { frequency: 120, slideTo: 38, duration: 0.24, type: "sawtooth", volume: 0.1 },
    },
    machineGun: {
      crack: { duration: 0.055, volume: 0.13, filterFrequency: 1450 },
      boom: { frequency: 180, slideTo: 92, duration: 0.07, type: "square", volume: 0.055 },
    },
  };

  const gunshot = gunshotMap[type] ?? gunshotMap.pistol;
  playNoiseBurst(gunshot.crack);
  playTone(gunshot.boom);
}

function playSound(name) {
  const soundMap = {
    pickup: { frequency: 620, slideTo: 920, duration: 0.08, type: "triangle", volume: 0.04 },
    speed: { frequency: 420, slideTo: 1200, duration: 0.16, type: "sawtooth", volume: 0.045 },
    hit: { frequency: 120, slideTo: 70, duration: 0.08, type: "sawtooth", volume: 0.04 },
    shield: { frequency: 760, slideTo: 460, duration: 0.12, type: "triangle", volume: 0.045 },
    win: { frequency: 520, slideTo: 880, duration: 0.2, type: "sine", volume: 0.045 },
  };

  const sound = soundMap[name];
  if (sound) {
    playTone(sound);
  }
}

function getBallsPerTeam() {
  return state.battleMode === "duel" ? 1 : Number(ballCountInput.value);
}

function getModeLabel() {
  return state.battleMode === "duel" ? "個人戰" : "團體戰";
}

function syncModeControls() {
  const isDuel = state.battleMode === "duel";
  groupModeButton.classList.toggle("active", !isDuel);
  duelModeButton.classList.toggle("active", isDuel);
  ballCountInput.disabled = isDuel;
  ballCountValue.textContent = String(getBallsPerTeam());
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
    weapon: null,
    weaponCooldown: randomBetween(0, 0.5),
    shieldCharges: 0,
    speedBoostTimer: 0,
    alive: true,
    targetId: null,
    trail: [],
  };
}

function resetGame() {
  const ballCount = getBallsPerTeam();
  state.balls = [];
  state.pickups = [];
  state.projectiles = [];
  state.particles = [];
  state.running = false;
  state.startedAt = 0;
  state.elapsedBeforePause = 0;
  state.lastFrameTime = 0;
  state.winner = null;
  state.nextPickupIn = 1.2;

  for (let index = 0; index < ballCount; index += 1) {
    state.balls.push(createBall("red", index, ballCount));
    state.balls.push(createBall("blue", index, ballCount));
  }

  startButton.textContent = "開始";
  roundStatusElement.textContent = `${getModeLabel()} / LAST BALL STANDING`;
  winnerBanner.classList.add("hidden");
  syncModeControls();
  updateHud();
  drawGame();
}

function spawnPickup() {
  if (state.pickups.length >= maxPickups) {
    return;
  }

  const type = pickWeightedType(pickupConfig);
  const position = randomPointInArena(42);

  state.pickups.push({
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    x: position.x,
    y: position.y,
    radius: type === "gear" || type === "speedBoost" ? 20 : 21,
    age: 0,
    ttl: pickupLifetime,
  });
}

function updatePickupSpawner(deltaSeconds) {
  state.nextPickupIn -= deltaSeconds;

  if (state.nextPickupIn <= 0) {
    spawnPickup();
    state.nextPickupIn = randomBetween(1.6, 3.2);
  }

  for (const pickup of state.pickups) {
    pickup.age += deltaSeconds;
  }

  state.pickups = state.pickups.filter((pickup) => pickup.age < (pickup.ttl ?? pickupLifetime));
}

function collectPickups() {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const pickup = state.pickups.find((candidate) => {
      return distanceBetween(ball, candidate) <= ball.radius + candidate.radius;
    });

    if (!pickup) {
      continue;
    }

    applyPickup(ball, pickup);
    state.pickups = state.pickups.filter((candidate) => candidate.id !== pickup.id);
  }
}

function applyPickup(ball, pickup) {
  if (pickup.type === "gear") {
    ball.shieldCharges = Math.min(ball.shieldCharges + 1, 2);
    createImpact(ball.x, ball.y, pickupConfig.gear.color, 18);
    playSound("shield");
    return;
  }

  if (pickup.type === "speedBoost") {
    const speed = Math.hypot(ball.vx, ball.vy);
    const direction = normalizeVector(ball.vx, ball.vy);
    const boostedSpeed = Math.max(speed * 1.45, 300);
    ball.vx = direction.x * boostedSpeed;
    ball.vy = direction.y * boostedSpeed;
    ball.speedBoostTimer = speedBoostDuration;
    createImpact(ball.x, ball.y, pickupConfig.speedBoost.color, 22);
    playSound("speed");
    return;
  }

  const weapon = weaponConfig[pickup.type];
  ball.weapon = {
    type: pickup.type,
    ammo: weapon.ammo,
  };
  ball.weaponCooldown = weaponReadyDelay;
  createImpact(ball.x, ball.y, weapon.color, 16);
  playSound("pickup");
}

function updateWeapons(deltaSeconds) {
  for (const ball of state.balls) {
    if (!ball.alive || !ball.weapon) {
      continue;
    }

    ball.weaponCooldown = Math.max(0, ball.weaponCooldown - deltaSeconds);
    const weapon = weaponConfig[ball.weapon.type];
    const target = findClosestEnemy(ball);

    if (!target || distanceBetween(ball, target) > weapon.range || ball.weaponCooldown > 0) {
      continue;
    }

    fireWeapon(ball, target, weapon);
    ball.weapon.ammo -= 1;
    ball.weaponCooldown = weapon.cooldown;

    if (ball.weapon.ammo <= 0) {
      ball.weapon = null;
    }
  }
}

function fireWeapon(ball, target, weapon) {
  const baseAngle = Math.atan2(target.y - ball.y, target.x - ball.x);
  const aimAngle = baseAngle + randomBetween(-weapon.accuracySpread, weapon.accuracySpread);
  const pelletCount = weapon.pellets;
  ball.vx -= Math.cos(baseAngle) * weapon.recoil;
  ball.vy -= Math.sin(baseAngle) * weapon.recoil;

  for (let index = 0; index < pelletCount; index += 1) {
    const offset = pelletCount === 1
      ? 0
      : (index - (pelletCount - 1) / 2) * (weapon.spread / (pelletCount - 1));
    const angle = aimAngle + offset;

    state.projectiles.push({
      x: ball.x + Math.cos(angle) * (ball.radius + 8),
      y: ball.y + Math.sin(angle) * (ball.radius + 8),
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      team: ball.team,
      damage: weapon.damage,
      color: weapon.color,
      radius: ball.weapon.type === "sniper" ? 4 : 3,
      life: weapon.range / weapon.projectileSpeed,
    });
  }

  createImpact(ball.x, ball.y, weapon.color, weapon.pellets + 3);
  playGunshot(ball.weapon.type);
}

function updateProjectiles(deltaSeconds) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;
    projectile.life -= deltaSeconds;

    const distanceFromCenter = distanceBetween(projectile, state.arena);
    if (distanceFromCenter > state.arena.radius) {
      projectile.life = 0;
      continue;
    }

    const target = state.balls.find((ball) => {
      return ball.alive
        && ball.team !== projectile.team
        && distanceBetween(ball, projectile) <= ball.radius + projectile.radius;
    });

    if (!target) {
      continue;
    }

    damageBall(target, projectile.damage, projectile.color);
    projectile.life = 0;
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function toggleGame() {
  unlockAudio();

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
  const maxTeamHealth = getBallsPerTeam() * maxHealth;

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
    ball.targetId = ball.weapon ? target?.id ?? null : null;
    ball.speedBoostTimer = Math.max(0, ball.speedBoostTimer - deltaSeconds);
    ball.vx *= 1 - 0.012 * deltaSeconds;
    ball.vy *= 1 - 0.012 * deltaSeconds;

    const boostMultiplier = ball.speedBoostTimer > 0 ? speedBoostMultiplier : 1;
    const maxSpeed = 245 * speedModifier * boostMultiplier;
    const minSpeed = 105 * speedModifier;
    const updatedSpeed = Math.hypot(ball.vx, ball.vy);

    if (updatedSpeed > maxSpeed) {
      ball.vx = (ball.vx / updatedSpeed) * maxSpeed;
      ball.vy = (ball.vy / updatedSpeed) * maxSpeed;
    } else if (updatedSpeed < minSpeed) {
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
  if (firstBall.hitTimer > 0 || secondBall.hitTimer > 0) {
    return;
  }

  firstBall.hitTimer = hitCooldown;
  secondBall.hitTimer = hitCooldown;
  createImpact(firstBall.x, firstBall.y, teamConfig[secondBall.team].color, 4);
  createImpact(secondBall.x, secondBall.y, teamConfig[firstBall.team].color, 4);
}

function damageBall(ball, amount, color) {
  if (ball.shieldCharges > 0) {
    ball.shieldCharges -= 1;
    createImpact(ball.x, ball.y, pickupConfig.gear.color, 18);
    playSound("shield");
    return;
  }

  ball.health -= amount;
  createImpact(ball.x, ball.y, color, 8);
  playSound("hit");

  if (ball.health <= 0) {
    eliminateBall(ball);
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
  playSound("win");
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

function drawWeaponIcon(type, x, y, size, color, rotation = 0) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(size / 24, size / 24);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 1.8;

  const outline = "#34384a";
  const slide = "#5d6273";
  const slideDark = "#444a5d";
  const barrel = "#3a4052";
  const grip = "#b66a3e";
  const gripLight = "#d17b43";
  const trigger = "#202433";

  function fillAndStroke(fillColor = slide, strokeColor = outline) {
    context.fillStyle = fillColor;
    context.fill();
    context.strokeStyle = strokeColor;
    context.stroke();
  }

  function drawPistolFrame(length = 22, gripLean = 2) {
    context.beginPath();
    context.moveTo(-10, -7);
    context.lineTo(length - 9, -7);
    context.quadraticCurveTo(length - 5, -7, length - 5, -3);
    context.lineTo(length - 5, 0);
    context.lineTo(-5, 0);
    context.quadraticCurveTo(-8, 0, -9, 3);
    context.lineTo(-12, 9);
    context.lineTo(-15, 9);
    context.quadraticCurveTo(-17, 5, -15, 0);
    context.quadraticCurveTo(-12, -2, -10, -7);
    fillAndStroke(slide);

    context.fillStyle = slideDark;
    context.fillRect(-5, -7, 10, 4);

    context.fillStyle = barrel;
    context.fillRect(length - 13, -4, 8, 3);

    for (let offset = -7; offset <= -1; offset += 3) {
      context.beginPath();
      context.moveTo(offset, -5.5);
      context.lineTo(offset - 2, -1.2);
      context.strokeStyle = outline;
      context.lineWidth = 1.1;
      context.stroke();
    }

    context.beginPath();
    context.moveTo(-9, 0);
    context.lineTo(-3, 0);
    context.lineTo(-5 + gripLean, 12);
    context.quadraticCurveTo(-6 + gripLean, 15, -10, 15);
    context.lineTo(-16, 15);
    context.quadraticCurveTo(-18, 14, -17, 11);
    context.closePath();
    fillAndStroke(grip);

    context.fillStyle = gripLight;
    context.fillRect(-13.5, 2.2, 5, 10);

    context.beginPath();
    context.arc(-2.4, 3.2, 4.2, Math.PI * 0.1, Math.PI * 1.55);
    context.strokeStyle = outline;
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.moveTo(-3, 2);
    context.quadraticCurveTo(-1, 5, -3, 7);
    context.strokeStyle = trigger;
    context.lineWidth = 1.8;
    context.stroke();
  }

  if (type === "pistol") {
    drawPistolFrame(22, 1.5);
  } else if (type === "shotgun") {
    context.beginPath();
    context.moveTo(-13, -6);
    context.lineTo(17, -6);
    context.lineTo(17, -2);
    context.lineTo(-7, -2);
    context.lineTo(-10, 2);
    context.lineTo(-15, 2);
    context.closePath();
    fillAndStroke(slide);

    context.fillStyle = barrel;
    context.fillRect(0, -3, 17, 3);
    context.fillStyle = slideDark;
    context.fillRect(-2, 0, 9, 5);

    context.beginPath();
    context.moveTo(-13, -2);
    context.lineTo(-19, 5);
    context.lineTo(-15, 8);
    context.lineTo(-7, 1);
    context.closePath();
    fillAndStroke(grip);

    context.beginPath();
    context.moveTo(-5, 2);
    context.lineTo(0, 2);
    context.lineTo(-1, 12);
    context.lineTo(-6, 12);
    context.closePath();
    fillAndStroke(gripLight);

    context.beginPath();
    context.arc(3, 3.5, 4, Math.PI * 0.15, Math.PI * 1.55);
    context.strokeStyle = outline;
    context.lineWidth = 1.8;
    context.stroke();
  } else if (type === "sniper") {
    context.beginPath();
    context.moveTo(-15, -5);
    context.lineTo(14, -5);
    context.lineTo(16, -2);
    context.lineTo(-4, -2);
    context.lineTo(-8, 2);
    context.lineTo(-15, 2);
    context.closePath();
    fillAndStroke(slide);

    context.fillStyle = barrel;
    context.fillRect(13, -4.3, 10, 2.8);

    context.beginPath();
    context.moveTo(-5, -9);
    context.lineTo(9, -9);
    context.lineWidth = 2.2;
    context.strokeStyle = outline;
    context.stroke();

    context.beginPath();
    context.rect(-2, -12, 8, 4);
    fillAndStroke(slideDark);

    context.beginPath();
    context.moveTo(-15, 0);
    context.lineTo(-21, 7);
    context.lineTo(-16, 10);
    context.lineTo(-8, 1);
    context.closePath();
    fillAndStroke(grip);

    context.beginPath();
    context.moveTo(-2, 1);
    context.lineTo(3, 1);
    context.lineTo(2, 12);
    context.lineTo(-3, 12);
    context.closePath();
    fillAndStroke(gripLight);
  } else if (type === "machineGun") {
    context.beginPath();
    context.moveTo(-15, -6);
    context.lineTo(13, -6);
    context.lineTo(16, -3);
    context.lineTo(16, 0);
    context.lineTo(-7, 0);
    context.lineTo(-10, 3);
    context.lineTo(-16, 3);
    context.closePath();
    fillAndStroke(slide);

    context.fillStyle = barrel;
    context.fillRect(12, -4.5, 10, 3);

    for (let offset = -9; offset <= 2; offset += 4) {
      context.beginPath();
      context.moveTo(offset, -5);
      context.lineTo(offset - 2, -1);
      context.strokeStyle = outline;
      context.lineWidth = 1.1;
      context.stroke();
    }

    context.beginPath();
    context.moveTo(-14, 1);
    context.lineTo(-20, 7);
    context.lineTo(-16, 10);
    context.lineTo(-8, 2);
    context.closePath();
    fillAndStroke(grip);

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(7, 0);
    context.lineTo(5, 12);
    context.lineTo(0, 12);
    context.closePath();
    fillAndStroke(gripLight);

    context.beginPath();
    context.arc(-2, 3.6, 4, Math.PI * 0.1, Math.PI * 1.5);
    context.strokeStyle = outline;
    context.lineWidth = 1.8;
    context.stroke();
  }

  context.restore();
}

function drawGearIcon(x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.6, size * 0.1);

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    context.save();
    context.rotate(angle);
    context.strokeRect(size * 0.28, -size * 0.06, size * 0.2, size * 0.12);
    context.restore();
  }

  context.beginPath();
  context.arc(0, 0, size * 0.32, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(0, 0, size * 0.12, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawAcceleratorIcon(x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.strokeStyle = "#2f3446";
  context.lineWidth = Math.max(1.6, size * 0.08);

  context.beginPath();
  context.moveTo(size * 0.05, -size * 0.48);
  context.lineTo(-size * 0.28, size * 0.02);
  context.lineTo(-size * 0.05, size * 0.02);
  context.lineTo(-size * 0.18, size * 0.48);
  context.lineTo(size * 0.3, -size * 0.12);
  context.lineTo(size * 0.06, -size * 0.12);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawPickups() {
  for (const pickup of state.pickups) {
    const config = pickupConfig[pickup.type];
    const bob = Math.sin(pickup.age * 4) * 3;

    context.save();
    context.translate(pickup.x, pickup.y + bob);
    context.shadowColor = config.color;
    context.shadowBlur = 16;

    context.beginPath();
    context.arc(0, 0, pickup.radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(8, 10, 16, 0.88)";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = config.color;
    context.stroke();

    if (pickup.type === "gear") {
      drawGearIcon(0, 0, 29, config.color);
    } else if (pickup.type === "speedBoost") {
      drawAcceleratorIcon(0, 0, 30, config.color);
    } else {
      drawWeaponIcon(pickup.type, 0, 1, 32, config.color, -0.08);
    }
    context.restore();
  }
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    const angle = Math.atan2(projectile.vy, projectile.vx);

    context.save();
    context.translate(projectile.x, projectile.y);
    context.rotate(angle);
    context.shadowColor = projectile.color;
    context.shadowBlur = 12;
    context.fillStyle = projectile.color;
    context.fillRect(-8, -2, 16, 4);
    context.restore();
  }
}

function getWeaponAimAngle(ball) {
  const target = ball.targetId
    ? state.balls.find((candidate) => candidate.id === ball.targetId && candidate.alive)
    : findClosestEnemy(ball);

  if (target) {
    return Math.atan2(target.y - ball.y, target.x - ball.x);
  }

  return Math.atan2(ball.vy, ball.vx);
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

    if (ball.weapon) {
      const weapon = weaponConfig[ball.weapon.type];
      const aimAngle = getWeaponAimAngle(ball);
      const mountX = ball.x + Math.cos(aimAngle) * (ball.radius + 9);
      const mountY = ball.y + Math.sin(aimAngle) * (ball.radius + 9);

      context.beginPath();
      context.arc(mountX, mountY, 12, 0, Math.PI * 2);
      context.fillStyle = "rgba(8, 10, 16, 0.9)";
      context.fill();
      context.strokeStyle = weapon.color;
      context.lineWidth = 2;
      context.stroke();

      drawWeaponIcon(
        ball.weapon.type,
        mountX,
        mountY,
        22,
        weapon.color,
        aimAngle,
      );
    }

    if (ball.shieldCharges > 0) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 7, 0, Math.PI * 2);
      context.strokeStyle = "rgba(61, 220, 151, 0.72)";
      context.lineWidth = 3;
      context.stroke();
    }

    if (ball.speedBoostTimer > 0) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 11, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255, 209, 102, 0.72)";
      context.lineWidth = 3;
      context.setLineDash([6, 6]);
      context.stroke();
      context.setLineDash([]);
    }
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
  drawPickups();
  drawProjectiles();
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

  updatePickupSpawner(deltaSeconds);
  steerTowardTargets(deltaSeconds);
  moveBalls(deltaSeconds);
  collectPickups();
  updateWeapons(deltaSeconds);
  resolveCollisions();
  updateProjectiles(deltaSeconds);
  updateParticles(deltaSeconds);
  checkWinner();
  updateHud();
  drawGame();

  if (state.running) {
    requestAnimationFrame(gameLoop);
  }
}

startButton.addEventListener("click", toggleGame);
resetButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
});
playAgainButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
  toggleGame();
});

groupModeButton.addEventListener("click", () => {
  unlockAudio();

  if (state.battleMode === "group") {
    return;
  }

  state.battleMode = "group";
  resetGame();
});

duelModeButton.addEventListener("click", () => {
  unlockAudio();

  if (state.battleMode === "duel") {
    return;
  }

  state.battleMode = "duel";
  resetGame();
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
