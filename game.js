const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const redViewCanvas = document.querySelector("#redViewCanvas");
const blueViewCanvas = document.querySelector("#blueViewCanvas");
const redViewContext = redViewCanvas.getContext("2d");
const blueViewContext = blueViewCanvas.getContext("2d");

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
const roomModeButton = document.querySelector("#roomModeButton");
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
  roomDoors: [],
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
const maxRoomPickups = 10;
const pickupLifetime = 10;
const weaponReadyDelay = 1;
const speedBoostDuration = 4;
const speedBoostMultiplier = 1.45;
const roomMap = {
  bounds: { x: 90, y: 105, width: 720, height: 690 },
  walls: [
    { x: 438, y: 105, width: 24, height: 260 },
    { x: 438, y: 535, width: 24, height: 260 },
    { x: 90, y: 322, width: 238, height: 22 },
    { x: 572, y: 322, width: 238, height: 22 },
    { x: 90, y: 556, width: 246, height: 22 },
    { x: 564, y: 556, width: 246, height: 22 },
  ],
  doors: [
    { x: 445, y: 398, width: 10, height: 72 },
    { x: 300, y: 328, width: 56, height: 10 },
    { x: 544, y: 562, width: 56, height: 10 },
  ],
  spawnZones: {
    red: [
      { x: 130, y: 140, width: 210, height: 145 },
      { x: 130, y: 610, width: 210, height: 140 },
    ],
    blue: [
      { x: 560, y: 140, width: 210, height: 145 },
      { x: 560, y: 610, width: 210, height: 140 },
    ],
  },
};

const roomPickupZones = [
  { x: 130, y: 140, width: 210, height: 145 },
  { x: 560, y: 140, width: 210, height: 145 },
  { x: 130, y: 370, width: 210, height: 140 },
  { x: 560, y: 370, width: 210, height: 140 },
  { x: 130, y: 610, width: 210, height: 140 },
  { x: 560, y: 610, width: 210, height: 140 },
];

const audioState = {
  context: null,
  enabled: false,
  noiseBuffer: null,
  gunshotBuffers: {},
  gunshotLoadPromises: {},
};

const gunshotAudioFiles = {
  pistol: "assets/audio/gunshots/pistol.wav",
  shotgun: "assets/audio/gunshots/shotgun.wav",
  sniper: "assets/audio/gunshots/sniper.wav",
  machineGun: "assets/audio/gunshots/machine-gun.wav",
};

const gunshotPlaybackConfig = {
  pistol: { offset: 0.24, duration: 0.44, volume: 0.34, playbackRate: 1.03 },
  shotgun: { offset: 0.1, duration: 0.55, volume: 0.4, playbackRate: 1 },
  sniper: { offset: 0.42, duration: 0.7, volume: 0.38, playbackRate: 0.96 },
  machineGun: { offset: 2.28, duration: 0.24, volume: 0.26, playbackRate: 1.12 },
};

const roomAssetFiles = {
  weapons: {
    pistol: "assets/images/room/weapons/pistol.png",
    shotgun: "assets/images/room/weapons/shotgun.png",
    sniper: "assets/images/room/weapons/sniper.png",
    machineGun: "assets/images/room/weapons/machine-gun.png",
  },
  characters: {
    red: {
      stand: "assets/images/room/characters/red-stand.png",
      gun: "assets/images/room/characters/red-gun.png",
      sniper: "assets/images/room/characters/red-sniper.png",
      machineGun: "assets/images/room/characters/red-machine.png",
    },
    blue: {
      stand: "assets/images/room/characters/blue-stand.png",
      gun: "assets/images/room/characters/blue-gun.png",
      sniper: "assets/images/room/characters/blue-sniper.png",
      machineGun: "assets/images/room/characters/blue-machine.png",
    },
  },
};

const roomAssets = {
  weapons: {},
  characters: {
    red: {},
    blue: {},
  },
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadImageAsset(src) {
  const image = new Image();
  image.onload = () => drawGame();
  image.src = src;
  return image;
}

function loadRoomAssets() {
  for (const [type, src] of Object.entries(roomAssetFiles.weapons)) {
    roomAssets.weapons[type] = loadImageAsset(src);
  }

  for (const [team, variants] of Object.entries(roomAssetFiles.characters)) {
    for (const [variant, src] of Object.entries(variants)) {
      roomAssets.characters[team][variant] = loadImageAsset(src);
    }
  }
}

function isRoomMode() {
  return state.battleMode === "room";
}

function createRoomDoors() {
  return roomMap.doors.map((door, index) => {
    const orientation = door.height > door.width ? "vertical" : "horizontal";
    const roomDoor = {
      ...door,
      id: `door-${index}`,
      closedX: door.x,
      closedY: door.y,
      closedWidth: door.width,
      closedHeight: door.height,
      orientation,
      openAmount: 0,
      openVelocity: 0,
      openDirection: index % 2 === 0 ? 1 : -1,
    };

    updateRoomDoorRect(roomDoor);
    return roomDoor;
  });
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function updateRoomDoorRect(door) {
  const amount = clamp(door.openAmount, 0, 1);
  const direction = door.openDirection || 1;

  if (door.orientation === "vertical") {
    const openX = direction > 0
      ? door.closedX
      : door.closedX - door.closedHeight + door.closedWidth;
    const openY = door.closedY + (door.closedHeight - door.closedWidth) / 2;

    door.x = lerp(door.closedX, openX, amount);
    door.y = lerp(door.closedY, openY, amount);
    door.width = lerp(door.closedWidth, door.closedHeight, amount);
    door.height = lerp(door.closedHeight, door.closedWidth, amount);
    return;
  }

  const openX = door.closedX + (door.closedWidth - door.closedHeight) / 2;
  const openY = direction > 0
    ? door.closedY
    : door.closedY - door.closedWidth + door.closedHeight;

  door.x = lerp(door.closedX, openX, amount);
  door.y = lerp(door.closedY, openY, amount);
  door.width = lerp(door.closedWidth, door.closedHeight, amount);
  door.height = lerp(door.closedHeight, door.closedWidth, amount);
}

function getRoomDoors() {
  return state.roomDoors.length > 0 ? state.roomDoors : roomMap.doors;
}

function getRoomObstacles() {
  return [...roomMap.walls, ...getRoomDoors()];
}

function getRectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function rectContainsPoint(rect, point, padding = 0) {
  return point.x >= rect.x + padding
    && point.x <= rect.x + rect.width - padding
    && point.y >= rect.y + padding
    && point.y <= rect.y + rect.height - padding;
}

function circleOverlapsRect(circle, rect, padding = 0) {
  const nearestX = clamp(circle.x, rect.x - padding, rect.x + rect.width + padding);
  const nearestY = clamp(circle.y, rect.y - padding, rect.y + rect.height + padding);
  return Math.hypot(circle.x - nearestX, circle.y - nearestY) <= circle.radius;
}

function randomPointInArena(padding = 34) {
  if (isRoomMode()) {
    return randomPointInRoomMap(padding);
  }

  const angle = randomBetween(0, Math.PI * 2);
  const radius = Math.sqrt(Math.random()) * (state.arena.radius - padding);

  return {
    x: state.arena.x + Math.cos(angle) * radius,
    y: state.arena.y + Math.sin(angle) * radius,
  };
}

function isPointInRoomMap(point, padding = 24) {
  if (!rectContainsPoint(roomMap.bounds, point, padding)) {
    return false;
  }

  return !getRoomObstacles().some((obstacle) => {
    return circleOverlapsRect({ ...point, radius: padding }, obstacle);
  });
}

function randomPointInRect(rect, padding = 24) {
  return {
    x: randomBetween(rect.x + padding, rect.x + rect.width - padding),
    y: randomBetween(rect.y + padding, rect.y + rect.height - padding),
  };
}

function randomPointInRoomMap(padding = 28, team = null) {
  const zones = team ? roomMap.spawnZones[team] : null;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const sourceRects = zones ?? [roomMap.bounds];
    const rect = sourceRects[Math.floor(Math.random() * sourceRects.length)];
    const point = randomPointInRect(rect, padding);

    if (isPointInRoomMap(point, padding)) {
      return point;
    }
  }

  return getRectCenter(team ? roomMap.spawnZones[team][0] : roomMap.bounds);
}

function randomPickupPointInRoom(padding = 42) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const zone = roomPickupZones[Math.floor(Math.random() * roomPickupZones.length)];
    const point = randomPointInRect(zone, padding);

    if (isPointInRoomMap(point, padding)) {
      return point;
    }
  }

  return randomPointInRoomMap(padding);
}

function getRoomPatrolPoints() {
  const doorPoints = getRoomDoors().flatMap((door) => {
    const center = getRectCenter(door);
    const isVertical = door.height > door.width;
    const offset = 58;

    return isVertical
      ? [
        { x: center.x - offset, y: center.y },
        { x: center.x + offset, y: center.y },
      ]
      : [
        { x: center.x, y: center.y - offset },
        { x: center.x, y: center.y + offset },
      ];
  });

  const roomCenters = [
    { x: 220, y: 215 },
    { x: 680, y: 215 },
    { x: 220, y: 455 },
    { x: 680, y: 455 },
    { x: 220, y: 685 },
    { x: 680, y: 685 },
    getRectCenter(roomMap.bounds),
  ];

  return [...doorPoints, ...roomCenters].filter((point) => isPointInRoomMap(point, 28));
}

function chooseRoomPatrolPoint(ball) {
  const patrolPoints = getRoomPatrolPoints().filter((point) => distanceBetween(ball, point) > 80);

  if (patrolPoints.length > 0 && Math.random() < 0.72) {
    return patrolPoints[Math.floor(Math.random() * patrolPoints.length)];
  }

  return randomPointInRoomMap(34);
}

function getRoomCoverPoints() {
  const wallCoverPoints = roomMap.walls.flatMap((wall) => {
    const center = getRectCenter(wall);
    const vertical = wall.height > wall.width;
    const offset = 54;

    return vertical
      ? [
        { x: wall.x - offset, y: center.y - 72 },
        { x: wall.x - offset, y: center.y + 72 },
        { x: wall.x + wall.width + offset, y: center.y - 72 },
        { x: wall.x + wall.width + offset, y: center.y + 72 },
      ]
      : [
        { x: center.x - 82, y: wall.y - offset },
        { x: center.x + 82, y: wall.y - offset },
        { x: center.x - 82, y: wall.y + wall.height + offset },
        { x: center.x + 82, y: wall.y + wall.height + offset },
      ];
  });

  const cornerPoints = roomPickupZones.flatMap((zone) => [
    { x: zone.x + 42, y: zone.y + 42 },
    { x: zone.x + zone.width - 42, y: zone.y + zone.height - 42 },
  ]);

  return [...wallCoverPoints, ...cornerPoints, ...getRoomPatrolPoints()]
    .filter((point) => isPointInRoomMap(point, 30));
}

function getVisibleEnemiesFromPoint(point, team) {
  return state.balls.filter((ball) => {
    return ball.alive
      && ball.team !== team
      && distanceBetween(point, ball) < 360
      && hasLineOfSight(point, ball);
  });
}

function isPointVisibleToEnemies(point, team, maxDistance = 430) {
  return state.balls.some((ball) => {
    return ball.alive
      && ball.team !== team
      && distanceBetween(ball, point) <= maxDistance
      && hasLineOfSight(ball, point);
  });
}

function findPriorityWeaponPickup(ball) {
  const weaponPickups = state.pickups.filter((pickup) => weaponConfig[pickup.type]);

  if (weaponPickups.length === 0) {
    return null;
  }

  return weaponPickups
    .map((pickup) => {
      const distance = distanceBetween(ball, pickup);
      const visibilityPenalty = hasLineOfSight(ball, pickup) ? 0 : 120;
      const enemySightPenalty = isPointVisibleToEnemies(pickup, ball.team, 360) ? 60 : 0;

      return {
        pickup,
        score: distance + visibilityPenalty + enemySightPenalty,
      };
    })
    .sort((a, b) => a.score - b.score)[0].pickup;
}

function getWeaponApproachPoint(ball, pickup) {
  if (hasLineOfSight(ball, pickup)) {
    return pickup;
  }

  const approachPoints = [...getRoomPatrolPoints(), ...getRoomCoverPoints()]
    .filter((point) => hasLineOfSight(point, pickup))
    .map((point) => ({
      point,
      score: distanceBetween(ball, point) * 0.7 + distanceBetween(point, pickup),
    }))
    .sort((a, b) => a.score - b.score);

  return approachPoints[0]?.point ?? chooseRoomEscapePoint(ball);
}

function shouldUnarmedEscape(ball, target, weaponPickup) {
  if (!target) {
    return false;
  }

  const enemyDistance = distanceBetween(ball, target);
  if (!target.weapon && enemyDistance <= 240) {
    return true;
  }

  if (enemyDistance > 170) {
    return false;
  }

  if (!weaponPickup) {
    return true;
  }

  const weaponDistance = distanceBetween(ball, weaponPickup);
  return weaponDistance > enemyDistance || isPointVisibleToEnemies(weaponPickup, ball.team, 300);
}

function setRoomAction(ball, action, point = null, duration = 1) {
  ball.roomAction = action;
  ball.patrolPoint = point;
  ball.awarenessTimer = duration;
}

function shouldRefreshRoomAction(ball, action, point = null, closeDistance = 34) {
  if (ball.roomAction !== action || ball.awarenessTimer <= 0 || !ball.patrolPoint) {
    return true;
  }

  return point ? distanceBetween(ball.patrolPoint, point) > closeDistance : distanceBetween(ball, ball.patrolPoint) < closeDistance;
}

function moveRoomAction(ball, action, point, speed, deltaSeconds, duration = 1) {
  if (shouldRefreshRoomAction(ball, action, point)) {
    setRoomAction(ball, action, point, duration);
  }

  moveRoomBallToward(ball, ball.patrolPoint, speed, deltaSeconds);
  keepRoomSpacing(ball, deltaSeconds);
}

function chooseRoomCoverPoint(ball) {
  const points = getRoomCoverPoints();
  const scoredPoints = points.map((point) => {
    const visibleEnemies = getVisibleEnemiesFromPoint(point, ball.team).length;
    const distance = distanceBetween(ball, point);
    const homeBias = ball.team === "red"
      ? clamp((roomMap.bounds.x + roomMap.bounds.width - point.x) / roomMap.bounds.width, 0, 1)
      : clamp((point.x - roomMap.bounds.x) / roomMap.bounds.width, 0, 1);
    const score = visibleEnemies * 220 + distance * 0.45 - homeBias * 55 + Math.random() * 24;

    return { point, score };
  }).sort((a, b) => a.score - b.score);

  return scoredPoints[0]?.point ?? chooseRoomPatrolPoint(ball);
}

function chooseRoomAmbushPoint(ball) {
  const enemies = state.balls.filter((candidate) => candidate.alive && candidate.team !== ball.team);
  const points = getRoomCoverPoints();
  const scoredPoints = points.map((point) => {
    const closestEnemyDistance = enemies.reduce((closest, enemy) => {
      return Math.min(closest, distanceBetween(point, enemy));
    }, Infinity);
    const visibleEnemies = getVisibleEnemiesFromPoint(point, ball.team).length;
    const exposedPenalty = isPointVisibleToEnemies(point, ball.team) ? 800 : 0;
    const midRangeBonus = Math.abs(closestEnemyDistance - 190);
    const score = exposedPenalty + visibleEnemies * 260 + midRangeBonus + distanceBetween(ball, point) * 0.25 + Math.random() * 20;

    return { point, score };
  }).sort((a, b) => a.score - b.score);

  return scoredPoints[0]?.point ?? chooseRoomCoverPoint(ball);
}

function chooseRoomEscapePoint(ball) {
  const sampledPoints = [];
  for (let index = 0; index < 40; index += 1) {
    sampledPoints.push(randomPointInRoomMap(34));
  }

  const points = [...getRoomCoverPoints(), ...sampledPoints];
  const hiddenPoints = points.filter((point) => !isPointVisibleToEnemies(point, ball.team));
  const candidatePoints = hiddenPoints.length > 0 ? hiddenPoints : points;
  const enemies = state.balls.filter((candidate) => candidate.alive && candidate.team !== ball.team);
  const scoredPoints = candidatePoints.map((point) => {
    const visibleToEnemy = isPointVisibleToEnemies(point, ball.team);
    const closestEnemyDistance = enemies.reduce((closest, enemy) => {
      return Math.min(closest, distanceBetween(point, enemy));
    }, Infinity);
    const distanceFromBall = distanceBetween(ball, point);
    const score = (visibleToEnemy ? 1200 : 0)
      + distanceFromBall * 0.45
      - Math.min(closestEnemyDistance, 420) * 0.55
      + Math.random() * 18;

    return { point, score };
  }).sort((a, b) => a.score - b.score);

  return scoredPoints[0]?.point ?? chooseRoomAmbushPoint(ball);
}

function lineIntersectsRect(start, end, rect) {
  if (rectContainsPoint(rect, start) || rectContainsPoint(rect, end)) {
    return true;
  }

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const edges = [
    [{ x: left, y: top }, { x: right, y: top }],
    [{ x: right, y: top }, { x: right, y: bottom }],
    [{ x: right, y: bottom }, { x: left, y: bottom }],
    [{ x: left, y: bottom }, { x: left, y: top }],
  ];

  return edges.some(([edgeStart, edgeEnd]) => {
    return lineSegmentsIntersect(start, end, edgeStart, edgeEnd);
  });
}

function lineSegmentsIntersect(a, b, c, d) {
  const denominator = ((d.y - c.y) * (b.x - a.x)) - ((d.x - c.x) * (b.y - a.y));

  if (Math.abs(denominator) < 0.00001) {
    return false;
  }

  const ua = (((d.x - c.x) * (a.y - c.y)) - ((d.y - c.y) * (a.x - c.x))) / denominator;
  const ub = (((b.x - a.x) * (a.y - c.y)) - ((b.y - a.y) * (a.x - c.x))) / denominator;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function hasLineOfSight(start, end) {
  if (!isRoomMode()) {
    return true;
  }

  return !getRoomObstacles().some((obstacle) => lineIntersectsRect(start, end, obstacle));
}

function getCircleRectCollision(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
  let dx = circle.x - nearestX;
  let dy = circle.y - nearestY;
  let distance = Math.hypot(dx, dy);

  if (distance >= circle.radius) {
    return null;
  }

  if (distance < 0.001) {
    const distances = [
      { value: Math.abs(circle.x - rect.x), nx: -1, ny: 0 },
      { value: Math.abs(rect.x + rect.width - circle.x), nx: 1, ny: 0 },
      { value: Math.abs(circle.y - rect.y), nx: 0, ny: -1 },
      { value: Math.abs(rect.y + rect.height - circle.y), nx: 0, ny: 1 },
    ].sort((a, b) => a.value - b.value);
    const side = distances[0];
    dx = side.nx;
    dy = side.ny;
    distance = 1;
  }

  const normalX = dx / distance;
  const normalY = dy / distance;
  const overlap = circle.radius - distance;

  return { normalX, normalY, overlap };
}

function resolveBallAgainstRect(ball, rect, options = {}) {
  const { bounce = true } = options;
  const collision = getCircleRectCollision(ball, rect);

  if (!collision) {
    return false;
  }

  const { normalX, normalY, overlap } = collision;
  ball.x += normalX * overlap;
  ball.y += normalY * overlap;

  const dot = ball.vx * normalX + ball.vy * normalY;
  if (dot < 0) {
    if (bounce) {
      ball.vx -= 2 * dot * normalX;
      ball.vy -= 2 * dot * normalY;
      ball.vx *= 0.9;
      ball.vy *= 0.9;
    } else {
      ball.vx -= dot * normalX;
      ball.vy -= dot * normalY;
      ball.vx *= 0.86;
      ball.vy *= 0.86;
    }
  }

  return true;
}

function pushRoomDoorFromBall(ball, door) {
  const collision = getCircleRectCollision(ball, door);

  if (!collision) {
    return false;
  }

  const doorCenter = getRectCenter(door);
  const side = door.orientation === "vertical"
    ? Math.sign(ball.x - doorCenter.x)
    : Math.sign(ball.y - doorCenter.y);
  door.openDirection = side || door.openDirection || 1;
  door.openVelocity = Math.min(3.2, door.openVelocity + 1.35 + collision.overlap * 0.08);
  door.openAmount = clamp(door.openAmount + 0.09, 0, 1);
  updateRoomDoorRect(door);
  return resolveBallAgainstRect(ball, door, { bounce: false });
}

function updateRoomDoors(deltaSeconds) {
  for (const door of state.roomDoors) {
    if (Math.abs(door.openVelocity) < 0.02) {
      door.openVelocity = 0;
      updateRoomDoorRect(door);
      continue;
    }

    door.openAmount = clamp(door.openAmount + door.openVelocity * deltaSeconds, 0, 1);
    door.openVelocity *= 0.78;
    updateRoomDoorRect(door);
  }
}

function resolveBallAgainstRoomMap(ball) {
  const { bounds } = roomMap;
  let touched = false;

  if (ball.x < bounds.x + ball.radius) {
    ball.x = bounds.x + ball.radius;
    ball.vx = Math.max(0, ball.vx) * 0.42;
    touched = true;
  } else if (ball.x > bounds.x + bounds.width - ball.radius) {
    ball.x = bounds.x + bounds.width - ball.radius;
    ball.vx = Math.min(0, ball.vx) * 0.42;
    touched = true;
  }

  if (ball.y < bounds.y + ball.radius) {
    ball.y = bounds.y + ball.radius;
    ball.vy = Math.max(0, ball.vy) * 0.42;
    touched = true;
  } else if (ball.y > bounds.y + bounds.height - ball.radius) {
    ball.y = bounds.y + bounds.height - ball.radius;
    ball.vy = Math.min(0, ball.vy) * 0.42;
    touched = true;
  }

  for (const wall of roomMap.walls) {
    touched = resolveBallAgainstRect(ball, wall, { bounce: false }) || touched;
  }

  for (const door of getRoomDoors()) {
    touched = pushRoomDoorFromBall(ball, door) || touched;
  }

  if (touched) {
    createImpact(ball.x, ball.y, "rgba(255, 255, 255, 0.72)", 2);
  }
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

function getPickupPool() {
  if (!isRoomMode()) {
    return pickupConfig;
  }

  return Object.fromEntries(
    Object.entries(pickupConfig)
      .filter(([type]) => type !== "speedBoost" && type !== "gear")
      .map(([type, config]) => {
        const weaponWeightBoost = weaponConfig[type] ? 1.45 : 1;
        return [type, { ...config, weight: config.weight * weaponWeightBoost }];
      }),
  );
}

function getAliveTeamCounts() {
  return state.balls.reduce((counts, ball) => {
    if (ball.alive) {
      counts[ball.team] += 1;
    }

    return counts;
  }, { red: 0, blue: 0 });
}

function getEnemyTeam(team) {
  return team === "red" ? "blue" : "red";
}

function isTeamOutnumbered(team) {
  const counts = getAliveTeamCounts();
  return counts[getEnemyTeam(team)] - counts[team] >= 2;
}

function teamHasWeapon(team) {
  return state.balls.some((ball) => ball.alive && ball.team === team && ball.weapon);
}

function bothRoomTeamsHaveWeapons() {
  return teamHasWeapon("red") && teamHasWeapon("blue");
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
  preloadGunshotSounds();
}

function loadGunshotSound(type) {
  if (!audioState.context || !gunshotAudioFiles[type]) {
    return Promise.resolve(null);
  }

  if (audioState.gunshotBuffers[type]) {
    return Promise.resolve(audioState.gunshotBuffers[type]);
  }

  if (audioState.gunshotLoadPromises[type]) {
    return audioState.gunshotLoadPromises[type];
  }

  audioState.gunshotLoadPromises[type] = fetch(gunshotAudioFiles[type])
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load gunshot sound: ${type}`);
      }

      return response.arrayBuffer();
    })
    .then((arrayBuffer) => audioState.context.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      audioState.gunshotBuffers[type] = audioBuffer;
      return audioBuffer;
    })
    .catch(() => {
      delete audioState.gunshotLoadPromises[type];
      return null;
    });

  return audioState.gunshotLoadPromises[type];
}

function preloadGunshotSounds() {
  Object.keys(gunshotAudioFiles).forEach((type) => {
    loadGunshotSound(type);
  });
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

function playSyntheticGunshot(type) {
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

function playGunshot(type) {
  if (!audioState.enabled || !audioState.context) {
    return;
  }

  const audioContext = audioState.context;
  const audioBuffer = audioState.gunshotBuffers[type];
  const playbackConfig = gunshotPlaybackConfig[type] ?? gunshotPlaybackConfig.pistol;

  if (!audioBuffer) {
    loadGunshotSound(type);
    playSyntheticGunshot(type);
    return;
  }

  const now = audioContext.currentTime;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const offset = Math.min(playbackConfig.offset, Math.max(audioBuffer.duration - 0.05, 0));
  const duration = Math.min(playbackConfig.duration, audioBuffer.duration - offset);

  source.buffer = audioBuffer;
  source.playbackRate.setValueAtTime(playbackConfig.playbackRate, now);
  gain.gain.setValueAtTime(playbackConfig.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.08);

  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start(now, offset, duration);
  source.stop(now + duration + 0.1);
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
  if (state.battleMode === "duel") {
    return "個人戰";
  }

  if (state.battleMode === "room") {
    return "房間戰";
  }

  return "團體戰";
}

function syncModeControls() {
  const isDuel = state.battleMode === "duel";
  const isRoom = isRoomMode();
  groupModeButton.classList.toggle("active", !isDuel && !isRoom);
  duelModeButton.classList.toggle("active", isDuel);
  roomModeButton.classList.toggle("active", isRoom);
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
  const roomSpawn = isRoomMode() ? randomPointInRoomMap(34, team) : null;
  const angle = (Math.PI * 2 * index) / total + (team === "red" ? 0 : Math.PI);
  const spread = randomBetween(90, 250);
  const x = roomSpawn?.x ?? state.arena.x + Math.cos(angle) * spread;
  const y = roomSpawn?.y ?? state.arena.y + Math.sin(angle) * spread;
  const direction = roomSpawn
    ? normalizeVector(team === "red" ? 1 : -1, randomBetween(-0.35, 0.35))
    : normalizeVector(
      state.arena.x - x + randomBetween(-140, 140),
      state.arena.y - y + randomBetween(-140, 140),
    );
  const baseSpeed = isRoomMode() ? randomBetween(72, 112) : randomBetween(145, 205);

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
    awarenessTimer: randomBetween(0, 0.6),
    ambushMode: false,
    roomAction: "patrol",
    strafeSide: Math.random() < 0.5 ? -1 : 1,
    strafeTimer: randomBetween(0.8, 1.8),
    patrolPoint: roomSpawn ? randomPointInRoomMap(34) : null,
    trail: [],
  };
}

function resetGame() {
  const ballCount = getBallsPerTeam();
  state.balls = [];
  state.pickups = [];
  state.projectiles = [];
  state.particles = [];
  state.roomDoors = isRoomMode() ? createRoomDoors() : [];
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

  if (isRoomMode()) {
    seedRoomPickups();
  }

  startButton.textContent = "開始";
  roundStatusElement.textContent = `${getModeLabel()} / LAST BALL STANDING`;
  winnerBanner.classList.add("hidden");
  syncModeControls();
  updateHud();
  drawGame();
}

function spawnPickup() {
  const pickupLimit = isRoomMode() ? maxRoomPickups : maxPickups;

  if (state.pickups.length >= pickupLimit) {
    return;
  }

  const type = pickWeightedType(getPickupPool());
  const position = isRoomMode() ? randomPickupPointInRoom(42) : randomPointInArena(42);

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

function seedRoomPickups() {
  const roomPickupCount = Math.min(maxRoomPickups, 8);

  for (let index = 0; index < roomPickupCount; index += 1) {
    spawnPickup();
  }
}

function updatePickupSpawner(deltaSeconds) {
  if (isRoomMode() && bothRoomTeamsHaveWeapons()) {
    state.pickups = [];
    state.nextPickupIn = 1.2;
    return;
  }

  state.nextPickupIn -= deltaSeconds;

  if (state.nextPickupIn <= 0) {
    spawnPickup();
    state.nextPickupIn = randomBetween(1.6, 3.2);
  }

  if (isRoomMode()) {
    return;
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

  if (pickup.type === "speedBoost" && !isRoomMode()) {
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

  if (pickup.type === "speedBoost") {
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
    ball.weaponCooldown = weapon.cooldown;

    if (!isRoomMode()) {
      ball.weapon.ammo -= 1;
    }

    if (!isRoomMode() && ball.weapon.ammo <= 0) {
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

    if (isRoomMode()) {
      const insideBounds = rectContainsPoint(roomMap.bounds, projectile);
      const hitObstacle = getRoomObstacles().some((obstacle) => rectContainsPoint(obstacle, projectile));

      if (!insideBounds || hitObstacle) {
        projectile.life = 0;
        createImpact(projectile.x, projectile.y, "#ffffff", 3);
        continue;
      }
    } else if (distanceBetween(projectile, state.arena) > state.arena.radius) {
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

    if (!hasLineOfSight(ball, otherBall)) {
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

function isCircleClearInRoom(circle) {
  if (!rectContainsPoint(roomMap.bounds, circle, circle.radius)) {
    return false;
  }

  return !getRoomObstacles().some((obstacle) => circleOverlapsRect(circle, obstacle));
}

function rotateVector(vector, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

function getRoomSteeringDirection(ball, desiredDirection) {
  const lookAhead = ball.radius + 34;
  const testCircle = (direction) => ({
    x: ball.x + direction.x * lookAhead,
    y: ball.y + direction.y * lookAhead,
    radius: ball.radius + 6,
  });

  if (isCircleClearInRoom(testCircle(desiredDirection))) {
    return desiredDirection;
  }

  const alternatives = [0.55, -0.55, 1.05, -1.05, Math.PI * 0.5, -Math.PI * 0.5]
    .map((angle) => rotateVector(desiredDirection, angle));

  return alternatives.find((direction) => isCircleClearInRoom(testCircle(direction))) ?? {
    x: -desiredDirection.x,
    y: -desiredDirection.y,
  };
}

function moveRoomBallToward(ball, point, speed, deltaSeconds) {
  const distance = distanceBetween(ball, point);

  if (distance < 8) {
    ball.vx *= 0.62;
    ball.vy *= 0.62;
    return;
  }

  const desiredDirection = normalizeVector(point.x - ball.x, point.y - ball.y);
  const steeringDirection = getRoomSteeringDirection(ball, desiredDirection);
  const arrivalSpeed = distance < 70 ? speed * clamp(distance / 70, 0.28, 1) : speed;
  const desiredVelocityX = steeringDirection.x * arrivalSpeed;
  const desiredVelocityY = steeringDirection.y * arrivalSpeed;
  const blend = Math.min(1, deltaSeconds * 4.4);

  ball.vx += (desiredVelocityX - ball.vx) * blend;
  ball.vy += (desiredVelocityY - ball.vy) * blend;
}

function keepRoomSpacing(ball, deltaSeconds) {
  for (const otherBall of state.balls) {
    if (!otherBall.alive || otherBall.id === ball.id) {
      continue;
    }

    const distance = distanceBetween(ball, otherBall);
    const preferredDistance = ball.team === otherBall.team ? 42 : 58;

    if (distance <= 0 || distance > preferredDistance) {
      continue;
    }

    const direction = normalizeVector(ball.x - otherBall.x, ball.y - otherBall.y);
    const spacingForce = (preferredDistance - distance) * 2.2;
    ball.vx += direction.x * spacingForce * deltaSeconds;
    ball.vy += direction.y * spacingForce * deltaSeconds;
  }
}

function applyRoomAwareness(ball, target, deltaSeconds) {
  ball.awarenessTimer = Math.max(0, ball.awarenessTimer - deltaSeconds);
  ball.strafeTimer = Math.max(0, ball.strafeTimer - deltaSeconds);
  const outnumbered = isTeamOutnumbered(ball.team);
  ball.ambushMode = outnumbered;

  if (!ball.weapon) {
    const weaponPickup = findPriorityWeaponPickup(ball);

    if (shouldUnarmedEscape(ball, target, weaponPickup)) {
      if (
        ball.roomAction !== "escape"
        || ball.awarenessTimer <= 0
        || !ball.patrolPoint
        || isPointVisibleToEnemies(ball.patrolPoint, ball.team)
        || distanceBetween(ball, ball.patrolPoint) < 34
      ) {
        setRoomAction(ball, "escape", chooseRoomEscapePoint(ball), randomBetween(1.1, 1.8));
      }

      moveRoomBallToward(ball, ball.patrolPoint, 142, deltaSeconds);
      keepRoomSpacing(ball, deltaSeconds);
      return;
    }

    if (weaponPickup) {
      const approachPoint = getWeaponApproachPoint(ball, weaponPickup);
      moveRoomAction(ball, "arm", approachPoint, outnumbered ? 136 : 152, deltaSeconds, 0.9);
      return;
    }

    if (target) {
      if (ball.roomAction !== "escape" || ball.awarenessTimer <= 0 || !ball.patrolPoint) {
        setRoomAction(ball, "escape", chooseRoomEscapePoint(ball), randomBetween(1.1, 1.8));
      }

      moveRoomBallToward(ball, ball.patrolPoint, 128, deltaSeconds);
      keepRoomSpacing(ball, deltaSeconds);
      return;
    }
  }

  if (outnumbered) {
    const weapon = ball.weapon ? weaponConfig[ball.weapon.type] : null;
    const canAmbush = target && weapon && distanceBetween(ball, target) <= weapon.range * 0.92;

    if (!canAmbush) {
      if (!ball.patrolPoint || distanceBetween(ball, ball.patrolPoint) < 34 || ball.awarenessTimer <= 0) {
        setRoomAction(ball, "hide", chooseRoomEscapePoint(ball), randomBetween(1.8, 3.2));
      }

      moveRoomBallToward(ball, ball.patrolPoint, 118, deltaSeconds);
      keepRoomSpacing(ball, deltaSeconds);
      return;
    }
  }

  if (target) {
    const distance = distanceBetween(ball, target);
    const weapon = ball.weapon ? weaponConfig[ball.weapon.type] : null;
    const preferredDistance = weapon ? weapon.range * (outnumbered ? 0.72 : 0.56) : 96;
    const direction = normalizeVector(target.x - ball.x, target.y - ball.y);
    const strafeDirection = normalizeVector(-direction.y, direction.x);
    if (ball.strafeTimer <= 0) {
      ball.strafeSide *= -1;
      ball.strafeTimer = randomBetween(1.1, 2.1);
    }

    const anchor = {
      x: ball.x + direction.x * (distance > preferredDistance ? 70 : -58) + strafeDirection.x * ball.strafeSide * 32,
      y: ball.y + direction.y * (distance > preferredDistance ? 70 : -58) + strafeDirection.y * ball.strafeSide * 32,
    };

    setRoomAction(ball, "engage", null, 0.4);
    moveRoomBallToward(ball, anchor, weapon ? 132 : 146, deltaSeconds);
    keepRoomSpacing(ball, deltaSeconds);
    return;
  }

  if (!ball.patrolPoint || distanceBetween(ball, ball.patrolPoint) < 44 || ball.awarenessTimer <= 0) {
    setRoomAction(ball, "patrol", chooseRoomPatrolPoint(ball), randomBetween(1.4, 2.7));
  }

  moveRoomBallToward(ball, ball.patrolPoint, 122, deltaSeconds);
  keepRoomSpacing(ball, deltaSeconds);
}

function steerTowardTargets(deltaSeconds) {
  const speedModifier = Number(speedInput.value) / 100;

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const target = findClosestEnemy(ball);
    ball.targetId = (ball.weapon || isRoomMode()) ? target?.id ?? null : null;
    ball.speedBoostTimer = Math.max(0, ball.speedBoostTimer - deltaSeconds);
    ball.vx *= 1 - 0.012 * deltaSeconds;
    ball.vy *= 1 - 0.012 * deltaSeconds;

    if (isRoomMode()) {
      applyRoomAwareness(ball, target, deltaSeconds);
    }

    const boostMultiplier = !isRoomMode() && ball.speedBoostTimer > 0 ? speedBoostMultiplier : 1;
    const maxSpeed = (isRoomMode() ? 168 : 245) * speedModifier * boostMultiplier;
    const minSpeed = (isRoomMode() ? 0 : 105) * speedModifier;
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

    if (isRoomMode()) {
      resolveBallAgainstRoomMap(ball);
      continue;
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
  if (isRoomMode()) {
    return;
  }

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

function drawRoomMap() {
  context.clearRect(0, 0, 900, 900);
  const { bounds } = roomMap;

  context.save();
  context.fillStyle = "rgba(11, 15, 24, 0.92)";
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  context.strokeStyle = "rgba(255, 255, 255, 0.07)";
  context.lineWidth = 1;
  for (let x = bounds.x + 90; x < bounds.x + bounds.width; x += 90) {
    context.beginPath();
    context.moveTo(x, bounds.y);
    context.lineTo(x, bounds.y + bounds.height);
    context.stroke();
  }
  for (let y = bounds.y + 90; y < bounds.y + bounds.height; y += 90) {
    context.beginPath();
    context.moveTo(bounds.x, y);
    context.lineTo(bounds.x + bounds.width, y);
    context.stroke();
  }

  context.lineWidth = 6;
  context.strokeStyle = "rgba(255, 255, 255, 0.58)";
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  for (const wall of roomMap.walls) {
    context.fillStyle = "#3f4758";
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
    context.strokeStyle = "rgba(255, 255, 255, 0.12)";
    context.lineWidth = 2;
    context.strokeRect(wall.x, wall.y, wall.width, wall.height);
  }

  for (const door of getRoomDoors()) {
    context.fillStyle = "#8b6f45";
    context.fillRect(door.x, door.y, door.width, door.height);
    context.strokeStyle = "rgba(255, 209, 102, 0.28)";
    context.lineWidth = 2;
    context.strokeRect(door.x, door.y, door.width, door.height);
  }

  context.restore();
}

function drawArena() {
  if (isRoomMode()) {
    drawRoomMap();
    return;
  }

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
  if (isRoomMode()) {
    return;
  }

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

function drawRoomWeaponImage(type, x, y, size, rotation = 0) {
  const image = roomAssets.weapons[type];

  if (!image?.complete || image.naturalWidth === 0) {
    drawWeaponIcon(type, x, y, size, weaponConfig[type]?.color ?? "#ffffff", rotation);
    return;
  }

  const drawSizes = {
    pistol: { width: size * 0.9, height: size * 0.48 },
    shotgun: { width: size * 1.18, height: size * 0.48 },
    sniper: { width: size * 1.45, height: size * 0.42 },
    machineGun: { width: size * 1.48, height: size * 0.46 },
  };
  const drawSize = drawSizes[type] ?? { width: size, height: size * 0.48 };

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    -drawSize.width / 2,
    -drawSize.height / 2,
    drawSize.width,
    drawSize.height,
  );
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
    } else if (isRoomMode()) {
      drawRoomWeaponImage(pickup.type, 0, 1, 34, -0.08);
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

function getRoomCharacterVariant(ball) {
  if (!ball.weapon) {
    return "stand";
  }

  if (ball.weapon.type === "machineGun") {
    return "machineGun";
  }

  if (ball.weapon.type === "sniper") {
    return "sniper";
  }

  return "gun";
}

function drawRoomCharacter(ball) {
  const variant = getRoomCharacterVariant(ball);
  const image = roomAssets.characters[ball.team][variant] ?? roomAssets.characters[ball.team].stand;
  const aimAngle = getWeaponAimAngle(ball);
  const config = teamConfig[ball.team];

  if (!image?.complete || image.naturalWidth === 0) {
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = config.color;
    context.fill();
    return;
  }

  const scale = ball.weapon ? 1.04 : 1.12;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  context.save();
  context.translate(ball.x, ball.y);
  context.rotate(aimAngle);
  context.imageSmoothingEnabled = false;

  context.beginPath();
  context.ellipse(-4, 4, width * 0.38, height * 0.34, 0, 0, Math.PI * 2);
  context.fillStyle = "rgba(0, 0, 0, 0.3)";
  context.fill();

  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();

  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius + 7, 0, Math.PI * 2);
  context.strokeStyle = ball.team === "red"
    ? "rgba(255, 59, 77, 0.24)"
    : "rgba(47, 125, 255, 0.24)";
  context.lineWidth = 1.5;
  context.stroke();

  if (ball.weapon && ball.weapon.type === "shotgun") {
    const mountX = ball.x + Math.cos(aimAngle) * 21;
    const mountY = ball.y + Math.sin(aimAngle) * 21;
    drawRoomWeaponImage("shotgun", mountX, mountY, 24, aimAngle);
  }
}

function drawRoomBalls() {
  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    drawRoomCharacter(ball);

    if (ball.health < maxHealth) {
      const healthWidth = 38;
      context.fillStyle = "rgba(0, 0, 0, 0.48)";
      context.fillRect(ball.x - healthWidth / 2, ball.y - 30, healthWidth, 4);
      context.fillStyle = ball.health > 34 ? "#3ddc97" : "#ffd166";
      context.fillRect(
        ball.x - healthWidth / 2,
        ball.y - 30,
        healthWidth * Math.max(0, ball.health / maxHealth),
        4,
      );
    }

    if (ball.shieldCharges > 0) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 11, 0, Math.PI * 2);
      context.strokeStyle = "rgba(61, 220, 151, 0.72)";
      context.lineWidth = 3;
      context.stroke();
    }

  }
}

function drawBalls() {
  if (isRoomMode()) {
    drawRoomBalls();
    return;
  }

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

    if (isRoomMode() && ball.ambushMode) {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius + 10, 0, Math.PI * 2);
      context.strokeStyle = "rgba(12, 16, 24, 0.78)";
      context.lineWidth = 4;
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
  if (isRoomMode()) {
    return;
  }

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

function isPointVisibleToTeam(point, team, maxDistance = 430) {
  return state.balls.some((ball) => {
    return ball.alive
      && ball.team === team
      && distanceBetween(ball, point) <= maxDistance
      && hasLineOfSight(ball, point);
  });
}

function drawTeamView(team, viewCanvas, viewContext) {
  const width = viewCanvas.width;
  const height = viewCanvas.height;
  viewContext.clearRect(0, 0, width, height);
  viewContext.fillStyle = "#080b12";
  viewContext.fillRect(0, 0, width, height);

  if (!isRoomMode()) {
    viewContext.fillStyle = "rgba(244, 247, 251, 0.72)";
    viewContext.font = "700 15px system-ui, sans-serif";
    viewContext.textAlign = "center";
    viewContext.fillText("房間戰啟用隊伍視角", width / 2, height / 2);
    return;
  }

  const bounds = roomMap.bounds;
  const padding = 12;
  const scale = Math.min((width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height);
  const offsetX = (width - bounds.width * scale) / 2;
  const offsetY = (height - bounds.height * scale) / 2;
  const toViewX = (x) => offsetX + (x - bounds.x) * scale;
  const toViewY = (y) => offsetY + (y - bounds.y) * scale;
  const drawRect = (rect, fillStyle, strokeStyle = null) => {
    viewContext.fillStyle = fillStyle;
    viewContext.fillRect(toViewX(rect.x), toViewY(rect.y), rect.width * scale, rect.height * scale);

    if (strokeStyle) {
      viewContext.strokeStyle = strokeStyle;
      viewContext.lineWidth = 1;
      viewContext.strokeRect(toViewX(rect.x), toViewY(rect.y), rect.width * scale, rect.height * scale);
    }
  };

  drawRect(bounds, "rgba(17, 22, 34, 0.96)", "rgba(255, 255, 255, 0.32)");

  for (const wall of roomMap.walls) {
    drawRect(wall, "#535b6e", "rgba(255, 255, 255, 0.22)");
  }

  for (const door of getRoomDoors()) {
    drawRect(door, "#9a784a", "rgba(255, 209, 102, 0.52)");
  }

  for (const pickup of state.pickups) {
    if (!isPointVisibleToTeam(pickup, team)) {
      continue;
    }

    const config = pickupConfig[pickup.type];
    viewContext.beginPath();
    viewContext.arc(toViewX(pickup.x), toViewY(pickup.y), 4.8, 0, Math.PI * 2);
    viewContext.fillStyle = config.color;
    viewContext.fill();
  }

  for (const ball of state.balls) {
    if (!ball.alive) {
      continue;
    }

    const isOwnTeam = ball.team === team;
    if (!isOwnTeam && !isPointVisibleToTeam(ball, team)) {
      continue;
    }

    viewContext.beginPath();
    viewContext.arc(toViewX(ball.x), toViewY(ball.y), isOwnTeam ? 6 : 5, 0, Math.PI * 2);
    viewContext.fillStyle = isOwnTeam ? teamConfig[ball.team].color : "rgba(255, 255, 255, 0.88)";
    viewContext.fill();

    if (isOwnTeam && ball.ambushMode) {
      viewContext.beginPath();
      viewContext.arc(toViewX(ball.x), toViewY(ball.y), 8, 0, Math.PI * 2);
      viewContext.strokeStyle = "rgba(0, 0, 0, 0.8)";
      viewContext.lineWidth = 2;
      viewContext.stroke();
    }
  }

  viewContext.fillStyle = teamConfig[team].color;
  viewContext.font = "800 12px system-ui, sans-serif";
  viewContext.textAlign = "left";
  viewContext.fillText(`${teamConfig[team].label} VISION`, 10, 18);
}

function drawTeamViews() {
  drawTeamView("red", redViewCanvas, redViewContext);
  drawTeamView("blue", blueViewCanvas, blueViewContext);
}

function drawGame() {
  drawArena();
  drawTargetLines();
  drawPickups();
  drawProjectiles();
  drawParticles();
  drawBalls();
  drawTeamViews();
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
  updateRoomDoors(deltaSeconds);
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

roomModeButton.addEventListener("click", () => {
  unlockAudio();

  if (state.battleMode === "room") {
    return;
  }

  state.battleMode = "room";
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

loadRoomAssets();
resizeCanvas();
resetGame();
